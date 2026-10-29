# nextjs-mtcaptcha

Next.js MTCaptcha component for the App Router and the Pages Router. [MTCaptcha](https://www.mtcaptcha.com/) protects forms against spam and automated abuse. Use it on login, registration, forgot password, comments, contact forms, and any custom form.

The widget is a Client Component, so it can be rendered from a Server Component page. Token checks stay on the server through `nextjs-mtcaptcha/server`.

## Why MTCaptcha

- GDPR compliance
- Enterprise friendly
- Accessibility compliance
- Adaptive risk engine
- High availability around the world

Learn more at [mtcaptcha.com](https://www.mtcaptcha.com/). Integration details are in the [developer guide](https://docs.mtcaptcha.com/dev-guide-quickstart).

## Forms you can protect

- Login form protection
- Registration form protection
- Comments form protection
- Forgot password form protection
- Contact form protection
- Any custom form you want to secure

## Installation

Requires Next.js 13 or newer and React 18 or newer.

```bash
npm install nextjs-mtcaptcha
```

```bash
yarn add nextjs-mtcaptcha
```

Create a site key in the [MTCaptcha Admin Console](https://admin.mtcaptcha.com/) and allow your development host, including `localhost`.

## App Router

Add the widget inside a Client Component. Function props such as `verifiedCallback` have to be created in client code. A Server Component page can render that client child and pass the site key as a string.

`app/login-form.tsx`

```tsx
'use client';

import { useState } from 'react';
import { MTCaptcha, type MTCaptchaState } from 'nextjs-mtcaptcha';

export function LoginForm() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verifiedToken: token }),
        });
      }}
    >
      <MTCaptcha
        sitekey="YOUR_SITE_KEY"
        action="login.submit"
        verifiedCallback={(state: MTCaptchaState) => setToken(state.verifiedToken)}
        verifyexpiredCallback={() => setToken(null)}
        errorCallback={(state) => console.error(state.statusDesc)}
      />
      <button type="submit" disabled={!token}>
        Continue
      </button>
    </form>
  );
}
```

`app/page.tsx`

```tsx
import { LoginForm } from './login-form';

export default function Page() {
  return <LoginForm />;
}
```

`app/api/verify/route.ts`

```ts
import { verifyMTCaptchaToken } from 'nextjs-mtcaptcha/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json()) as { verifiedToken?: string };
  const result = await verifyMTCaptchaToken({
    privateKey: process.env.MTCAPTCHA_PRIVATE_KEY ?? '',
    token: body.verifiedToken ?? '',
  });

  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}
```

Keep `MTCAPTCHA_PRIVATE_KEY` on the server. Do not prefix it with `NEXT_PUBLIC_`.

## Pages Router

The same component works in `pages/` without a `'use client'` file, because Pages Router components already run on the client.

`pages/login.tsx`

```tsx
import { useState } from 'react';
import { MTCaptcha, type MTCaptchaState } from 'nextjs-mtcaptcha';

export default function LoginPage() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <form method="post" action="/api/login">
      <MTCaptcha
        sitekey="YOUR_SITE_KEY"
        verifiedCallback={(state: MTCaptchaState) => setToken(state.verifiedToken)}
        verifyexpiredCallback={() => setToken(null)}
        errorCallback={(state) => console.error(state.statusDesc)}
      />
      <input type="hidden" name="verifiedToken" value={token ?? ''} />
      <button type="submit">Continue</button>
    </form>
  );
}
```

`pages/api/login.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withMTCaptcha, type MTCaptchaRouteRequest } from 'nextjs-mtcaptcha/server';

function handler(req: NextApiRequest & MTCaptchaRouteRequest, res: NextApiResponse) {
  res.status(200).json({ success: true, tokeninfo: req.mtcaptcha?.tokeninfo });
}

export default withMTCaptcha(handler);
```

`withMTCaptcha` reads the token from `mtcaptcha-verifiedtoken`, `verifiedToken`, or `token` on `req.body`, then `req.query`. A valid result is attached to `req.mtcaptcha`.

## Props

The component sets `render` to `explicit` and renders the anchor when it mounts. That keeps the widget working with client-side navigation in both routers.

| Name | Config key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `sitekey` | `sitekey` | `string` | Yes | — | Site key from the MTCaptcha Admin Console. |
| `id` | render queue id | `string` | No | generated | DOM id used for explicit render. |
| `className` | — | `string` | No | — | Extra class names on the anchor. The anchor always includes `mtcaptcha`. |
| `enableTestMode` | `enableTestMode` | `string` | No | — | Test key from the Admin Console, next to the private key. |
| `lang` | `lang` | `string` | No | — | Active language code, for example `en`, `fr`, or `ta`. |
| `customLangText` | `customLangText` | `MTCaptchaCustomLangText` | No | — | Label overrides keyed by language code. |
| `customAccessibilityText` | `customAccessibilityText` | `MTCaptchaCustomAccessibilityText` | No | — | Screen-reader labels keyed by language, then by `default` or a widget state. |
| `customFonts` | `customFonts` | `MTCaptchaCustomFonts` | No | — | Default font family and custom font files for the widget. |
| `customStyle` | `customStyle` | `MTCaptchaCustomStyle` | No | — | Color, font, and border overrides. |
| `theme` | `theme` | see below | No | `basic` | Preset widget theme. |
| `challengeType` | `challengeType` | `'imageonly' \| 'standard'` | No | `standard` | Use `imageonly` to force image challenges. |
| `action` | `action` | `string` | No | — | Action tag. Must match `^[a-zA-Z0-9\-_. ,]{1,30}$`. |
| `widgetSize` | `widgetSize` | `'mini' \| 'standard'` | No | `standard` | Widget size. |
| `miniFormWidth` | `miniFormWidth` | `number` | No | responsive | Mini widget width, from 265 to 600. |
| `miniFormHeight` | `miniFormHeight` | `number` | No | `45` | Mini widget height, from 42 to 55. |
| `loadAnimation` | `loadAnimation` | `boolean` | No | `true` | Set to `false` to disable the loading animation. |
| `autoFadeOuterText` | `autoFadeOuterText` | `boolean` | No | — | When `true`, outer text fades on its own. |
| `lowFrictionInvisible` | `lowFrictionInvisible` | `'force-visible' \| 'force-invisible'` | No | — | Visibility override when low-friction invisible mode is enabled. |
| `autoFormValidate` | `autoFormValidate` | `boolean` | No | — | Blocks HTML form submit until the captcha is complete. |
| `jsloadedCallback` | `jsloaded-callback` | `(state) => void` | No | — | The MTCaptcha script has loaded. |
| `renderedCallback` | `rendered-callback` | `(state) => void` | No | — | The widget was rendered. It may not fire when the captcha stays invisible. |
| `verifiedCallback` | `verified-callback` | `(state) => void` | No | — | The user is verified. `state.verifiedToken` is set. |
| `verifyexpiredCallback` | `verifyexpired-callback` | `(state) => void` | No | — | The last verified token expired. |
| `errorCallback` | `error-callback` | `(state) => void` | No | — | A widget, site key, or connection error occurred. Also called when the client script fails to load. |

`theme` accepts `basic`, `overcast`, `neowhite`, `goldbezel`, `blackmoon`, `darkruby`, `touchoforange`, `caribbean`, `woodyallen`, `chrome`, or `highcontrast`.

Callback reference: [JavaScript callbacks](https://docs.mtcaptcha.com/dev-guide-jscallbacks).

MTCaptcha keeps one configuration per page. Use one widget on a page.

## Ref methods

```tsx
import { useRef } from 'react';
import { MTCaptcha, type MTCaptchaHandle } from 'nextjs-mtcaptcha';

const captchaRef = useRef<MTCaptchaHandle>(null);

<MTCaptcha ref={captchaRef} sitekey="YOUR_SITE_KEY" />

captchaRef.current?.getVerifiedToken();
```

| Method | Description |
| --- | --- |
| `setEnableTestMode(testKey?)` | Enables automated test mode with a test key. |
| `getConfiguration()` | Returns a copy of the captcha configuration. Changing the copy has no effect. |
| `getStatus()` | Returns the current captcha state. |
| `getVerifiedToken()` | Returns the current verified token, or `null`. |
| `renderUI()` | Renders the widget again. |
| `resetUI()` | Resets the widget and its state. |
| `remove()` | Removes the widget. Call `renderUI()` to show it again. |
| `showMandatory()` | Shows the mandatory-field message for a custom form check. |

## Callback state

```ts
interface MTCaptchaState {
  element: HTMLElement | null;
  domID: string;
  statusCode: number;
  verifiedToken: string | null;
  isVerified: boolean;
  isVisible: boolean;
  statusDesc: string;
}
```

## Server verification

A verified token has to be checked with your private key before you trust it. `verifyMTCaptchaToken` calls the [CheckToken API](https://docs.mtcaptcha.com/dev-guide-validate-token).

```ts
import { verifyMTCaptchaToken } from 'nextjs-mtcaptcha/server';

const result = await verifyMTCaptchaToken({
  privateKey: process.env.MTCAPTCHA_PRIVATE_KEY ?? '',
  token,
});

if (!result.success) {
  // result.fail_codes explains the rejection, for example "token-expired"
}
```

| Option | Description |
| --- | --- |
| `privateKey` | Site private key. Required. |
| `token` | Verified token from the widget. Required. |
| `explicitAcl` | When `true`, calls `service2.mtcaptcha.com` for firewall rules that need fixed IPs. |
| `tokenExpireMiniSec` | Integer from 1 to 1200. Extends token lifetime only past the default. |
| `tokenDuplicateCallMaxCount` | Integer from 1 to 20. Allows more than one CheckToken call per token. |

Import `nextjs-mtcaptcha/server` only from Route Handlers, Server Actions, `getServerSideProps`, or `pages/api`. The helpers throw if they run in the browser.

## customLangText

```ts
const customLangText = {
  en: {
    inputPrompt: 'Enter captcha text',
    verifyFail: 'Verification failed',
    verifySuccess: 'Verified',
  },
};

<MTCaptcha sitekey="YOUR_SITE_KEY" lang="en" customLangText={customLangText} />
```

`MTCaptchaCustomLangEntry` includes `inputPrompt`, `captchaRefresh`, `loading`, `reload`, `verifying`, `verifyFail`, `verifySuccess`, `captchaExpired`, `verifyExpired`, `emptyCaptcha`, `incompleteCaptcha`, `audioPlay`, `audioPlaying`, `continueAudio`, `downloadAudio`, `audioDownloading`, and `connectionError`.

## customStyle

```ts
const customStyle = {
  inputTextColor: '#112233',
  inputBorderColor: { byDefault: '#ccddee', hover: '#88aacc', active: '#336699' },
  buttonIconColor: { refresh: '#336699', verify: '#336699' },
};

<MTCaptcha sitekey="YOUR_SITE_KEY" customStyle={customStyle} />
```

## customAccessibilityText

Accessibility text is set per language code, then under `default` or a named widget state.

```tsx
const customAccessibilityText = {
  en: {
    default: {
      iframeTitle: 'Custom Security Verification Frame',
    },
  },
};

<MTCaptcha
  sitekey="YOUR_SITE_KEY"
  lang="en"
  customAccessibilityText={customAccessibilityText}
/>
```

## customFonts

`defaultFontFamily` applies a font stack such as `serif`, `sans-serif`, or `Arial` across the widget. `fonts` lists files the widget can load. `format` is `woff2`, `woff`, `truetype`, or `opentype`.

```tsx
const customFonts = {
  defaultFontFamily: 'sans-serif',
  fonts: [
    {
      family: 'Inter',
      url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@5.3.0/latin-wght-normal.woff2',
      format: 'woff2',
    },
  ],
};

<MTCaptcha sitekey="YOUR_SITE_KEY" customFonts={customFonts} />
```

## Example

A login demo lives in [mtcaptcha-nextjs-example](https://github.com/mtcaptcha-public/mtcaptcha-nextjs-example), next to this repository.

```bash
cd ../mtcaptcha-nextjs-example
npm install
```

Copy `.env.example` to `.env`, set `MTCAPTCHA_SITEKEY`, then `npm run dev`.

## License

MIT. See [LICENSE](https://github.com/mtcaptcha-public/nextjs-mtcaptcha/blob/main/LICENSE).

## Support

Issues and feature requests: [GitHub issue tracker](https://github.com/mtcaptcha-public/nextjs-mtcaptcha/issues).
