import assert from 'node:assert/strict';
import test from 'node:test';
import { readVerifiedToken } from '../src/read-token.ts';
import { verifyMTCaptchaToken, withMTCaptcha } from '../src/server.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('readVerifiedToken prefers the MTCaptcha form field', () => {
  const token = readVerifiedToken({
    token: 'generic',
    verifiedToken: 'camel',
    'mtcaptcha-verifiedtoken': 'official',
  });
  assert.equal(token, 'official');
  assert.equal(readVerifiedToken({ token: [' spaced '] }), 'spaced');
  assert.equal(readVerifiedToken(null), null);
});

test('verifyMTCaptchaToken reports missing secrets without calling the network', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return jsonResponse({ success: true });
  };
  const result = await verifyMTCaptchaToken({ privateKey: ' ', token: '' });
  assert.equal(called, false);
  assert.deepEqual(result.fail_codes, ['missing-input-privatekey', 'missing-input-token']);
});

test('verifyMTCaptchaToken calls CheckToken and keeps the private key in the query', async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return jsonResponse({
      success: true,
      tokeninfo: { v: '1.0', code: 201, action: 'login' },
    });
  };

  const result = await verifyMTCaptchaToken({
    privateKey: 'private-key',
    token: 'verified-token',
    explicitAcl: true,
    tokenExpireMiniSec: 300,
  });

  assert.equal(result.success, true);
  assert.equal(result.tokeninfo?.code, 201);
  assert.match(urls[0], /^https:\/\/service2\.mtcaptcha\.com\/mtcv1\/api\/checktoken\?/);
  assert.match(urls[0], /privatekey=private-key/);
  assert.match(urls[0], /token=verified-token/);
  assert.match(urls[0], /tokenExpireMiniSec=300/);
});

test('verifyMTCaptchaToken rejects out-of-range options before fetch', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return jsonResponse({ success: true });
  };
  const result = await verifyMTCaptchaToken({
    privateKey: 'private-key',
    token: 'verified-token',
    tokenDuplicateCallMaxCount: 21,
  });
  assert.equal(called, false);
  assert.deepEqual(result.fail_codes, ['bad-request']);
});

test('verifyMTCaptchaToken returns bad-request when CheckToken is unreachable', async () => {
  globalThis.fetch = async () => {
    throw new Error('offline');
  };
  const result = await verifyMTCaptchaToken({
    privateKey: 'private-key',
    token: 'verified-token',
  });
  assert.deepEqual(result, { success: false, fail_codes: ['bad-request'] });
});

test('withMTCaptcha blocks a missing token and forwards a valid one', async (t) => {
  const previousKey = process.env.MTCAPTCHA_PRIVATE_KEY;
  process.env.MTCAPTCHA_PRIVATE_KEY = 'private-key';
  t.after(() => {
    if (previousKey === undefined) delete process.env.MTCAPTCHA_PRIVATE_KEY;
    else process.env.MTCAPTCHA_PRIVATE_KEY = previousKey;
  });

  globalThis.fetch = async () =>
    jsonResponse({ success: true, tokeninfo: { hostname: 'localhost' } });

  const handler = withMTCaptcha((req, res) => {
    res.status(200).json({ ok: true, hostname: req.mtcaptcha?.tokeninfo?.hostname });
  });

  const missing = createResponse();
  await handler({ body: {} }, missing);
  assert.equal(missing.statusCode, 400);
  assert.equal(
    (missing.payload as { success: boolean }).success,
    false,
  );

  const allowed = createResponse();
  await handler({ body: { verifiedToken: 'verified-token' } }, allowed);
  assert.equal(allowed.statusCode, 200);
  assert.deepEqual(allowed.payload, { ok: true, hostname: 'localhost' });
});

function createResponse() {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.payload = body;
    },
  };
  return response;
}
