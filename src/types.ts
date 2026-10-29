export interface MTCaptchaState {
  element: HTMLElement | null;
  domID: string;
  statusCode: number;
  verifiedToken: string | null;
  isVerified: boolean;
  isVisible: boolean;
  statusDesc: string;
}

export interface MTCaptchaCustomLangEntry {
  inputPrompt?: string;
  captchaRefresh?: string;
  loading?: string;
  reload?: string;
  verifying?: string;
  verifyFail?: string;
  verifySuccess?: string;
  captchaExpired?: string;
  verifyExpired?: string;
  emptyCaptcha?: string;
  incompleteCaptcha?: string;
  audioPlay?: string;
  audioPlaying?: string;
  continueAudio?: string;
  downloadAudio?: string;
  audioDownloading?: string;
  connectionError?: string;
}

export type MTCaptchaCustomLangText = Record<string, MTCaptchaCustomLangEntry>;

export type MTCaptchaFontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype';

export interface MTCaptchaCustomFontFace {
  /** CSS font-family name, for example `Inter`. */
  family: string;
  /** URL of the font file. */
  url: string;
  /** Font file format. */
  format: MTCaptchaFontFormat;
}

export interface MTCaptchaCustomFonts {
  /** Font stack applied across widget elements, for example `sans-serif` or `Arial`. */
  defaultFontFamily?: string;
  /** Font files the widget may load. */
  fonts?: MTCaptchaCustomFontFace[];
}

export interface MTCaptchaAccessibilityLabels {
  /** Title announced for the captcha iframe. */
  iframeTitle?: string;
}

export interface MTCaptchaAccessibilityLanguage {
  /** Labels used when no more specific widget state applies. */
  default?: MTCaptchaAccessibilityLabels;
  /** Labels for a named widget state. */
  [state: string]: MTCaptchaAccessibilityLabels | undefined;
}

/** Accessibility labels keyed by language code, then by `default` or a widget state. */
export type MTCaptchaCustomAccessibilityText = Record<string, MTCaptchaAccessibilityLanguage>;

export interface MTCaptchaInputBorderColor {
  byDefault?: string;
  hover?: string;
  active?: string;
}

export interface MTCaptchaButtonIconColor {
  refresh?: string;
  verify?: string;
  success?: string;
  fail?: string;
  audio?: string;
  audiofocus?: string;
}

export interface MTCaptchaCustomStyle {
  cardColor?: string;
  cardShadowColor?: string;
  cardBorder?: string;
  placeHolderColor?: string;
  inputTextColor?: string;
  inputTextFont?: string;
  msgTextColor?: string;
  invalidMsgTextColor?: string;
  msgTextFont?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: MTCaptchaInputBorderColor;
  buttonIconColor?: MTCaptchaButtonIconColor;
  loadAnimationDotColor?: string;
  loadAnimationBorderColor?: string;
}

export type MTCaptchaTheme =
  | 'basic'
  | 'overcast'
  | 'neowhite'
  | 'goldbezel'
  | 'blackmoon'
  | 'darkruby'
  | 'touchoforange'
  | 'caribbean'
  | 'woodyallen'
  | 'chrome'
  | 'highcontrast';

export type MTCaptchaChallengeType = 'imageonly' | 'standard';

export type MTCaptchaWidgetSize = 'mini' | 'standard';

export type MTCaptchaLowFrictionInvisible = 'force-visible' | 'force-invisible';

export interface MTCaptchaProps {
  /** MTCaptcha site key from the Admin Console. */
  sitekey: string;
  /** DOM id used for explicit render. A stable id is generated when omitted. */
  id?: string;
  /** Extra class names appended to the anchor element. */
  className?: string;
  /** Test key from the MTCaptcha Admin Console, next to the private key. */
  enableTestMode?: string;
  /** Active language code, for example `en`, `fr`, or `ta`. */
  lang?: string;
  /** Label overrides keyed by language code. */
  customLangText?: MTCaptchaCustomLangText;
  /** Screen-reader labels keyed by language, then by `default` or a widget state. */
  customAccessibilityText?: MTCaptchaCustomAccessibilityText;
  /** Font stack and font files loaded by the widget. */
  customFonts?: MTCaptchaCustomFonts;
  /** Color, font, and border overrides for the widget. */
  customStyle?: MTCaptchaCustomStyle;
  /** Preset widget theme. */
  theme?: MTCaptchaTheme;
  /** Challenge mode. `imageonly` forces image challenges. */
  challengeType?: MTCaptchaChallengeType;
  /** Action tag stored with the token. 1-30 characters: letters, numbers, and `- _ . ,` or space. */
  action?: string;
  /** Widget size preset. */
  widgetSize?: MTCaptchaWidgetSize;
  /** Mini widget width, from 265 to 600. */
  miniFormWidth?: number;
  /** Mini widget height, from 42 to 55. */
  miniFormHeight?: number;
  /** Set to `false` to disable the loading animation. */
  loadAnimation?: boolean;
  /** When `true`, outer text fades on its own. */
  autoFadeOuterText?: boolean;
  /** Visibility override for low-friction invisible mode. */
  lowFrictionInvisible?: MTCaptchaLowFrictionInvisible;
  /** Ask MTCaptcha to block form submit until the captcha is complete. */
  autoFormValidate?: boolean;
  /** Called when the MTCaptcha JavaScript library has loaded. Maps to `jsloaded-callback`. */
  jsloadedCallback?: (state: MTCaptchaState) => void;
  /** Called when the widget is rendered. May not fire for invisible captcha. Maps to `rendered-callback`. */
  renderedCallback?: (state: MTCaptchaState) => void;
  /** Called when the user is verified. `verifiedToken` is set. Maps to `verified-callback`. */
  verifiedCallback?: (state: MTCaptchaState) => void;
  /** Called when the last verified token expires. Maps to `verifyexpired-callback`. */
  verifyexpiredCallback?: (state: MTCaptchaState) => void;
  /** Called for widget or connection errors. Maps to `error-callback`. */
  errorCallback?: (state: MTCaptchaState) => void;
}

export interface MTCaptchaHandle {
  /** Enables automated test mode with a test key. */
  setEnableTestMode: (testKey?: string) => void;
  /** Returns a copy of the captcha configuration. Mutating it has no effect. */
  getConfiguration: () => unknown;
  /** Returns the current captcha state. */
  getStatus: () => MTCaptchaState | undefined;
  /** Returns the current verified token, or `null` when the user is not verified. */
  getVerifiedToken: () => string | null;
  /** Renders the widget again. */
  renderUI: () => void;
  /** Resets the widget and its verification state. */
  resetUI: () => void;
  /** Removes the widget from the page. Call `renderUI` to show it again. */
  remove: () => void;
  /** Shows the mandatory-field message for a custom validation flow. */
  showMandatory: () => void;
}

export interface MTCaptchaClientConfig {
  sitekey: string;
  render: 'explicit' | 'auto';
  renderQueue: string[];
  enableTestMode?: string;
  lang?: string;
  customLangText?: MTCaptchaCustomLangText;
  customAccessibilityText?: MTCaptchaCustomAccessibilityText;
  customFonts?: MTCaptchaCustomFonts;
  customStyle?: MTCaptchaCustomStyle;
  theme?: MTCaptchaTheme;
  challengeType?: MTCaptchaChallengeType;
  action?: string;
  widgetSize?: MTCaptchaWidgetSize;
  miniFormWidth?: number;
  miniFormHeight?: number;
  loadAnimation?: boolean;
  autoFadeOuterText?: boolean;
  lowFrictionInvisible?: MTCaptchaLowFrictionInvisible;
  autoFormValidate?: boolean;
  'jsloaded-callback'?: (state: MTCaptchaState) => void;
  'rendered-callback'?: (state: MTCaptchaState) => void;
  'verified-callback'?: (state: MTCaptchaState) => void;
  'verifyexpired-callback'?: (state: MTCaptchaState) => void;
  'error-callback'?: (state: MTCaptchaState) => void;
}

export interface MTCaptchaApi {
  enableTestMode: (testKey?: string) => void;
  getConfiguration: () => unknown;
  getStatus: () => MTCaptchaState | undefined;
  getVerifiedToken: () => string | null | undefined;
  resetUI: () => void;
  renderUI: () => void;
  remove: () => void;
  showMandatory: () => void;
}

export interface MTCaptchaTokenInfo {
  v?: string;
  code?: number;
  codeDesc?: string;
  tokID?: string;
  timestampSec?: number;
  timestampISO?: string;
  hostname?: string;
  isDevHost?: boolean;
  action?: string;
  ip?: string;
}

export interface MTCaptchaVerifyResult {
  success: boolean;
  fail_codes?: string[];
  tokeninfo?: MTCaptchaTokenInfo;
  token_callcount?: number;
  token_agesec?: number;
}

export interface VerifyMTCaptchaOptions {
  /** Site private key. Keep this on the server. */
  privateKey: string;
  /** Verified token from the widget. */
  token: string;
  /** Use `service2.mtcaptcha.com` when outbound firewall rules require fixed IPs. */
  explicitAcl?: boolean;
  /** Minimum token lifetime in seconds. Integer from 1 to 1200. Applied only when longer than the default. */
  tokenExpireMiniSec?: number;
  /** How many CheckToken calls one token may accept. Integer from 1 to 20. */
  tokenDuplicateCallMaxCount?: number;
}

declare global {
  interface Window {
    mtcaptchaConfig?: MTCaptchaClientConfig;
    mtcaptcha?: MTCaptchaApi;
  }
}
