import assert from "node:assert/strict";
import { build } from "esbuild";
import axios from "axios";
import { mkdir, rm } from "node:fs/promises";

await mkdir(".test-tmp", { recursive: true });
await build({
  entryPoints: ["src/api.ts"],
  outfile: ".test-tmp/api.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["axios"],
  define: { "import.meta.env.VITE_API_URL": '"https://api.test"' },
});

const jwt = (role) =>
  "header." +
  Buffer.from(JSON.stringify({ sub: "user-1", role })).toString("base64url") +
  ".signature";
let currentMode = "customer";
let refreshCount = 0;
let failRefresh = false;
let protectedRequestCount = 0;
let currentUserRequest;
const respond = (config, data, status = 200) => ({
  data,
  status,
  headers: {},
  config,
});
const reject = (config, status) =>
  Promise.reject(
    new axios.AxiosError(
      `HTTP ${status}`,
      "ERR_BAD_RESPONSE",
      config,
      undefined,
      respond(config, { message: "Unauthorized" }, status),
    ),
  );

axios.defaults.adapter = async (config) => {
  assert.equal(config.withCredentials, true);
  if (config.url === "/auth/refresh") {
    refreshCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (failRefresh) return reject(config, 401);
    return respond(config, { accessToken: jwt(currentMode) });
  }
  if (config.url === "/auth/me") {
    currentUserRequest = config;
    return respond(config, {
      id: "user-1",
      email: "test@example.com",
      name: "Олена",
      roles: ["customer", "employee"],
      mode: currentMode,
    });
  }
  if (config.url === "/auth/login") return reject(config, 401);
  if (config.url === "/auth/roles/employee") {
    currentMode = "employee";
    return respond(config, { accessToken: jwt(currentMode) });
  }
  if (config.url === "/services") {
    assert.equal(config.headers.Authorization, undefined);
    return respond(config, []);
  }

  protectedRequestCount += 1;
  if (config.headers.Authorization !== `Bearer ${jwt(currentMode)}`)
    return reject(config, 401);
  return respond(config, {
    items: [],
    meta: { page: 1, limit: 10, total: 0, pages: 0 },
  });
};

try {
  const apiModule = await import("../.test-tmp/api.mjs");
  let current;
  apiModule.listenSession((session) => (current = session));
  apiModule.applySession({
    accessToken: "expired",
    user: {
      id: "user-1",
      name: "Олена",
      email: "test@example.com",
      mode: "customer",
      roles: ["customer"],
      rolesComplete: true,
    },
  });

  await Promise.all([
    apiModule.api.get("/contracts/my"),
    apiModule.api.get("/contracts/a"),
    apiModule.api.get("/contracts/b"),
  ]);
  assert.equal(refreshCount, 1);
  assert.equal(protectedRequestCount, 6);
  assert.equal(current.user.name, "Олена");
  assert.deepEqual(new Set(current.user.roles), new Set(["customer", "employee"]));
  assert.equal(currentUserRequest.url, "/auth/me");
  assert.equal(
    currentUserRequest.headers.get("Authorization"),
    `Bearer ${jwt("customer")}`,
  );

  await apiModule.api.get("/services");
  const role = await apiModule.api.post("/auth/roles/employee", {});
  apiModule.applySession(role.data);
  assert.deepEqual(new Set(current.user.roles), new Set(["customer", "employee"]));
  assert.equal(current.user.mode, "employee");

  await apiModule.refresh();
  assert.deepEqual(new Set(current.user.roles), new Set(["customer", "employee"]));
  assert.equal(current.user.name, "Олена");
  try {
    await apiModule.api.post("/auth/login", {});
  } catch (error) {
    assert.equal(apiModule.errorText(error), "Невірний email/пароль");
  }

  const list = await apiModule.pageGet("/contracts/my");
  assert.equal(list.total, 0);
  failRefresh = true;
  apiModule.applySession({ ...current, accessToken: "expired" });
  await assert.rejects(apiModule.api.get("/contracts/my"));
  assert.equal(current, null);
  console.log(
    "PASS: refresh, full roles/profile, auth headers, retry, pagination, login errors, and session expiry",
  );
} finally {
  await rm(".test-tmp", { recursive: true, force: true });
}
