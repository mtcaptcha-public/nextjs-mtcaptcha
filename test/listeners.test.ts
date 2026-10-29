import assert from 'node:assert/strict';
import test from 'node:test';
import { bindDispatchers, subscribe } from '../src/listeners.ts';
import type { MTCaptchaClientConfig, MTCaptchaState } from '../src/types.ts';

function state(domID: string): MTCaptchaState {
  return {
    element: null,
    domID,
    statusCode: 200,
    verifiedToken: 'token',
    isVerified: true,
    isVisible: true,
    statusDesc: 'verified',
  };
}

test('callbacks reach the matching anchor and ignore a different one', () => {
  const config: MTCaptchaClientConfig = {
    sitekey: 'site',
    render: 'explicit',
    renderQueue: [],
  };
  bindDispatchers(config);
  const firstCallback = config['verified-callback'];
  bindDispatchers(config);
  assert.equal(config['verified-callback'], firstCallback);

  let verified = 0;
  let loaded = 0;
  const unsubscribe = subscribe('anchor-a', {
    jsloaded: () => {
      loaded += 1;
    },
    rendered: () => undefined,
    verified: () => {
      verified += 1;
    },
    verifyexpired: () => undefined,
    error: () => undefined,
  });

  config['verified-callback']?.(state('anchor-a'));
  config['verified-callback']?.(state('anchor-b'));
  config['jsloaded-callback']?.(state('anchor-b'));

  assert.equal(verified, 1);
  assert.equal(loaded, 1);
  unsubscribe();
  config['verified-callback']?.(state('anchor-a'));
  assert.equal(verified, 1);
});
