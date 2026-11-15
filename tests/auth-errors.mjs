import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

await mkdir('.test-tmp', { recursive: true });
await build({
  entryPoints: ['src/api.ts'],
  outfile: '.test-tmp/api.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['axios'],
  define: { 'import.meta.env.VITE_API_URL': '"https://api.test"' },
});
try {
  const {
    api,
    errorText,
    hydrateSession,
    isEmailVerificationError,
  } = await import('../.test-tmp/api.mjs');

  const loginError = {
    config: { url: '/auth/login' },
    response: { status: 401, data: { message: 'Invalid credentials' } },
  };
  assert.equal(errorText(loginError), 'Невірний email або пароль.');

  const unverifiedLoginError = {
    config: { url: '/auth/login' },
    response: {
      status: 403,
      data: { message: 'Підтвердіть електронну пошту перед входом до системи' },
    },
  };
  assert.equal(
    errorText(unverifiedLoginError),
    'Підтвердіть електронну пошту перед входом до системи',
  );
  assert.equal(isEmailVerificationError(unverifiedLoginError), true);
  assert.equal(isEmailVerificationError(loginError), false);

  const refreshError = {
    config: { url: '/auth/refresh' },
    response: { status: 403, data: { message: 'Session expired' } },
  };
  assert.equal(errorText(refreshError), 'Сесію завершено. Увійдіть знову.');

  const protectedError = {
    config: { url: '/contracts/my' },
    response: { status: 401, data: { message: 'Unauthorized' } },
  };
  assert.equal(errorText(protectedError), 'Неавторизовано. Увійдіть знову.');

  const session = await hydrateSession({
    accessToken: `header.${b64({ sub: 'user-1', role: 'employee' })}.sig`,
  });
  assert.equal(session.mode, 'employee');
  assert.deepEqual(session.user.roles, ['employee']);
  assert.equal(session.user.id, 'user-1');

  const registrationMessage = {
    message: 'Акаунт створено. Підтвердіть електронну пошту, щоб увійти.',
  };
  const resendMessage = {
    message:
      'Якщо акаунт існує і пошта не підтверджена, лист буде надіслано',
  };
  api.defaults.adapter = async (config) => ({
    data:
      config.url === '/auth/resend-verification'
        ? resendMessage
        : registrationMessage,
    status: 201,
    statusText: 'Created',
    headers: {},
    config,
  });
  const registration = await api.post('/auth/register', {
    email: 'user@example.com',
    password: 'password',
    name: 'User',
    role: 'customer',
  });
  assert.deepEqual(registration.data, registrationMessage);

  const resend = await api.post('/auth/resend-verification', {
    email: 'user@example.com',
  });
  assert.deepEqual(resend.data, resendMessage);
  assert.equal(resend.config.url, '/auth/resend-verification');
  assert.deepEqual(JSON.parse(resend.config.data), {
    email: 'user@example.com',
  });

  console.log('PASS: auth error handling and session hydration');
} finally {
  await rm('.test-tmp', { recursive: true, force: true });
}
