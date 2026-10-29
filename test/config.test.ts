import assert from 'node:assert/strict';
import test from 'node:test';
import { assignMTCaptchaProps, validateMTCaptchaProps } from '../src/config.ts';
import type { MTCaptchaClientConfig, MTCaptchaProps } from '../src/types.ts';

function props(overrides: Partial<MTCaptchaProps> = {}): MTCaptchaProps {
  return { sitekey: 'MTPublic-example', ...overrides };
}

function config(): MTCaptchaClientConfig {
  return {
    sitekey: '',
    render: 'explicit',
    renderQueue: ['kept'],
    'verified-callback': () => undefined,
  };
}

test('sitekey is required', () => {
  assert.equal(validateMTCaptchaProps({ sitekey: '  ' }), 'MTCaptcha: "sitekey" is required');
});

test('action accepts the documented character set and rejects anything else', () => {
  assert.equal(validateMTCaptchaProps(props({ action: 'login.submit' })), null);
  assert.equal(validateMTCaptchaProps(props({ action: 'a b,._-' })), null);
  assert.match(
    validateMTCaptchaProps(props({ action: 'bad/action' })) ?? '',
    /action/,
  );
  assert.match(
    validateMTCaptchaProps(props({ action: 'x'.repeat(31) })) ?? '',
    /action/,
  );
});

test('widget dimensions and enums are checked', () => {
  assert.match(
    validateMTCaptchaProps(props({ miniFormWidth: 264 })) ?? '',
    /miniFormWidth/,
  );
  assert.match(
    validateMTCaptchaProps(props({ miniFormHeight: 56 })) ?? '',
    /miniFormHeight/,
  );
  assert.equal(validateMTCaptchaProps(props({ miniFormWidth: 265, miniFormHeight: 42 })), null);
  assert.match(
    validateMTCaptchaProps(props({ widgetSize: 'large' as 'mini' })) ?? '',
    /widgetSize/,
  );
  assert.match(
    validateMTCaptchaProps(props({ theme: 'neon' as 'basic' })) ?? '',
    /theme/,
  );
  assert.match(
    validateMTCaptchaProps(props({ id: '1bad' })) ?? '',
    /id/,
  );
});

test('assign keeps the render queue and explicit mode', () => {
  const target = config();
  const callback = target['verified-callback'];
  assignMTCaptchaProps(
    target,
    props({
      theme: 'chrome',
      loadAnimation: false,
      action: 'contact.form',
      autoFadeOuterText: false,
    }),
  );

  assert.equal(target.sitekey, 'MTPublic-example');
  assert.equal(target.render, 'explicit');
  assert.deepEqual(target.renderQueue, ['kept']);
  assert.equal(target.theme, 'chrome');
  assert.equal(target.loadAnimation, false);
  assert.equal(target.action, 'contact.form');
  assert.equal(target.autoFadeOuterText, false);
  assert.equal(target['verified-callback'], callback);
});

test('custom fonts and accessibility text are copied onto the client config', () => {
  const customAccessibilityText = {
    en: { default: { iframeTitle: 'Custom Security Verification Frame' } },
  };
  const customFonts = {
    defaultFontFamily: 'sans-serif',
    fonts: [
      {
        family: 'Inter',
        url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@5.3.0/latin-wght-normal.woff2',
        format: 'woff2' as const,
      },
    ],
  };
  assert.equal(validateMTCaptchaProps(props({ customAccessibilityText, customFonts })), null);
  assert.match(
    validateMTCaptchaProps(
      props({
        customFonts: {
          fonts: [{ family: 'Inter', url: 'https://example.com/inter.woff2', format: 'svg' as 'woff2' }],
        },
      }),
    ) ?? '',
    /format/,
  );

  const target = config();
  assignMTCaptchaProps(target, props({ customAccessibilityText, customFonts }));
  assert.deepEqual(target.customAccessibilityText, customAccessibilityText);
  assert.deepEqual(target.customFonts, customFonts);
});

test('assign drops optional values that are cleared', () => {
  const target = config();
  target.lang = 'fr';
  assignMTCaptchaProps(target, props());
  assert.equal(target.lang, undefined);
  assert.equal(target.theme, 'basic');
  assert.equal(target.loadAnimation, true);
});
