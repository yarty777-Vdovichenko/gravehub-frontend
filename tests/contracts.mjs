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
await build({
  entryPoints: ["src/new-api.ts"],
  outfile: ".test-tmp/new-api.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["axios"],
  define: { "import.meta.env.VITE_API_URL": '"https://api.test"' },
});
await build({
  entryPoints: ["src/components/listQuery.ts"],
  outfile: ".test-tmp/list-query.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
await build({
  entryPoints: ["src/service-selection.ts"],
  outfile: ".test-tmp/service-selection.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
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
  const newApiModule = await import("../.test-tmp/new-api.mjs");
  const listQueryModule = await import("../.test-tmp/list-query.mjs");
  const serviceSelection = await import("../.test-tmp/service-selection.mjs");
  const parsedListQuery = listQueryModule.parseListQuery(
    new URLSearchParams(
      "search=cleaning&serviceId=service-1&regionId=region-1&minRating=4&page=3&limit=20&sortBy=completedContracts&order=asc",
    ),
    true,
  );
  assert.equal(parsedListQuery.page, 3);
  assert.equal(parsedListQuery.limit, 20);
  assert.deepEqual(parsedListQuery.filters, {
    search: "cleaning",
    serviceId: "service-1",
    regionId: "region-1",
    minRating: 4,
    sortBy: "completedContracts",
    order: "asc",
  });
  const savedListQuery = listQueryModule.createListQuery(
    parsedListQuery.filters,
    parsedListQuery.limit,
    parsedListQuery.page,
    { status: "open" },
  );
  assert.equal(savedListQuery.get("page"), "3");
  assert.equal(savedListQuery.get("limit"), "20");
  assert.equal(savedListQuery.get("serviceId"), "service-1");
  assert.equal(savedListQuery.get("status"), "open");
  const invalidListQuery = listQueryModule.parseListQuery(
    new URLSearchParams("page=-1&limit=15&minRating=6&sortBy=invalid"),
    true,
  );
  assert.equal(invalidListQuery.page, 1);
  assert.equal(invalidListQuery.limit, 10);
  assert.equal(invalidListQuery.filters.minRating, undefined);
  assert.equal(invalidListQuery.filters.sortBy, "rating");
  assert.equal(
    listQueryModule.listQueryKey(
      new URLSearchParams("page=2&status=open&reviewsPage=3"),
    ),
    "page=2",
  );
  const serviceCatalog = newApiModule.normalizeServiceCatalog([
    {
      id: "category-1",
      name: "Благоустрій",
      price: null,
      parentId: null,
      children: [
        {
          id: "cleaning",
          name: "Прибирання могил",
          price: null,
          parentId: "category-1",
          children: [
            {
              id: "wet-cleaning",
              name: "Вологе прибирання",
              price: 250,
              parentId: "cleaning",
            },
            {
              id: "dry-cleaning",
              name: "Сухе прибирання",
              price: 150,
              parentId: "cleaning",
            },
          ],
        },
        {
          id: "fence-installation",
          name: "Встановлення огорожі",
          price: null,
          parentId: "category-1",
          children: [
            {
              id: "fence",
              name: "Паркан",
              price: null,
              parentId: "fence-installation",
              children: [
                {
                  id: "wood-fence",
                  name: "Дерев’яний паркан",
                  price: 500,
                  parentId: "fence",
                },
                {
                  id: "metal-fence",
                  name: "Металевий паркан",
                  price: 800,
                  parentId: "fence",
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
  assert.deepEqual(
    newApiModule.flattenServiceCatalog(serviceCatalog).map((service) => service.id),
    ["wet-cleaning", "dry-cleaning", "wood-fence", "metal-fence"],
  );
  const terminalServices = newApiModule.flattenServiceCatalog(serviceCatalog);
  assert.deepEqual(
    terminalServices.find((service) => service.id === "metal-fence").path.map(
      (item) => item.name,
    ),
    [
      "Благоустрій",
      "Встановлення огорожі",
      "Паркан",
      "Металевий паркан",
    ],
  );
  assert.equal(serviceCatalog[0].price, null);
  assert.equal(serviceCatalog[0].children[0].price, null);
  assert.equal(
    newApiModule.servicePathLabel(terminalServices, "metal-fence"),
    "Благоустрій / Встановлення огорожі / Паркан / Металевий паркан",
  );
  assert.deepEqual(
    serviceSelection.toggleServiceSelection(
      ["wood-fence"],
      "metal-fence",
      terminalServices,
    ),
    ["metal-fence"],
  );
  assert.deepEqual(
    serviceSelection.toggleServiceSelection(
      ["metal-fence"],
      "metal-fence",
      terminalServices,
    ),
    [],
  );
  assert.deepEqual(
    serviceSelection.toggleServiceSelection(
      ["metal-fence"],
      "wet-cleaning",
      terminalServices,
    ),
    ["metal-fence", "wet-cleaning"],
  );
  assert.deepEqual(
    serviceSelection.normalizeServiceSelection(
      ["wood-fence", "metal-fence", "wet-cleaning"],
      terminalServices,
    ),
    ["metal-fence", "wet-cleaning"],
  );
  assert.throws(
    () =>
      newApiModule.normalizeServiceCatalog([
        { id: "category-1", name: "Категорія", children: "invalid" },
      ]),
    /некоректний каталог послуг/,
  );
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
    "PASS: auth/session, URL persistence, recursive catalog, and exclusive service selection",
  );
} finally {
  await rm(".test-tmp", { recursive: true, force: true });
}
