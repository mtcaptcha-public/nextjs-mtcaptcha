import type {
  MTCaptchaChallengeType,
  MTCaptchaClientConfig,
  MTCaptchaCustomFonts,
  MTCaptchaFontFormat,
  MTCaptchaLowFrictionInvisible,
  MTCaptchaProps,
  MTCaptchaTheme,
  MTCaptchaWidgetSize,
} from './types';

const ACTION_PATTERN = /^[a-zA-Z0-9\-_. ,]{1,30}$/;

const THEMES: Record<MTCaptchaTheme, true> = {
  basic: true,
  overcast: true,
  neowhite: true,
  goldbezel: true,
  blackmoon: true,
  darkruby: true,
  touchoforange: true,
  caribbean: true,
  woodyallen: true,
  chrome: true,
  highcontrast: true,
};

const WIDGET_SIZES: Record<MTCaptchaWidgetSize, true> = {
  mini: true,
  standard: true,
};

const CHALLENGE_TYPES: Record<MTCaptchaChallengeType, true> = {
  imageonly: true,
  standard: true,
};

const LOW_FRICTION: Record<MTCaptchaLowFrictionInvisible, true> = {
  'force-visible': true,
  'force-invisible': true,
};

const DOM_ID_PATTERN = /^[A-Za-z][\w:.-]*$/;

const FONT_FORMATS: Record<MTCaptchaFontFormat, true> = {
  woff2: true,
  woff: true,
  truetype: true,
  opentype: true,
};

function validateCustomFonts(fonts: MTCaptchaCustomFonts | undefined): string | null {
  const faces = fonts?.fonts;
  if (faces == null) return null;
  if (!Array.isArray(faces)) {
    return 'MTCaptcha: "customFonts.fonts" must be an array';
  }
  for (const face of faces) {
    if (!face || !isPresent(face.family) || !isPresent(face.url)) {
      return 'MTCaptcha: each custom font needs a "family" and a "url"';
    }
    if (!hasNamedValue(FONT_FORMATS, face.format)) {
      return 'MTCaptcha: "customFonts.fonts.format" must be "woff2", "woff", "truetype", or "opentype"';
    }
  }
  return null;
}

function isPresent(value: string | undefined): value is string {
  return value != null && value !== '';
}

function hasNamedValue(record: object, value: string | undefined): boolean {
  return value != null && Object.prototype.hasOwnProperty.call(record, value);
}

/**
 * Returns an error message when a prop cannot be sent to MTCaptcha.
 * Empty optional fields are treated as unset.
 */
export function validateMTCaptchaProps(props: MTCaptchaProps): string | null {
  if (typeof props.sitekey !== 'string' || props.sitekey.trim() === '') {
    return 'MTCaptcha: "sitekey" is required';
  }
  if (props.id != null && props.id !== '' && !DOM_ID_PATTERN.test(props.id)) {
    return 'MTCaptcha: "id" must start with a letter and contain only letters, numbers, "_", ":", ".", or "-"';
  }
  if (isPresent(props.action) && !ACTION_PATTERN.test(props.action)) {
    return 'MTCaptcha: "action" is invalid. Use 1-30 chars [a-zA-Z0-9-_. ,]';
  }
  if (isPresent(props.widgetSize) && !hasNamedValue(WIDGET_SIZES, props.widgetSize)) {
    return 'MTCaptcha: "widgetSize" must be "mini" or "standard"';
  }
  if (
    props.miniFormWidth != null &&
    (!Number.isFinite(props.miniFormWidth) ||
      props.miniFormWidth < 265 ||
      props.miniFormWidth > 600)
  ) {
    return 'MTCaptcha: "miniFormWidth" must be between 265 and 600';
  }
  if (
    props.miniFormHeight != null &&
    (!Number.isFinite(props.miniFormHeight) ||
      props.miniFormHeight < 42 ||
      props.miniFormHeight > 55)
  ) {
    return 'MTCaptcha: "miniFormHeight" must be between 42 and 55';
  }
  if (
    isPresent(props.lowFrictionInvisible) &&
    !hasNamedValue(LOW_FRICTION, props.lowFrictionInvisible)
  ) {
    return 'MTCaptcha: "lowFrictionInvisible" must be "force-visible" or "force-invisible"';
  }
  if (isPresent(props.challengeType) && !hasNamedValue(CHALLENGE_TYPES, props.challengeType)) {
    return 'MTCaptcha: "challengeType" must be "imageonly" or "standard"';
  }
  if (isPresent(props.theme) && !hasNamedValue(THEMES, props.theme)) {
    return 'MTCaptcha: "theme" must be one of basic, overcast, neowhite, goldbezel, blackmoon, darkruby, touchoforange, caribbean, woodyallen, chrome, highcontrast';
  }
  const fontError = validateCustomFonts(props.customFonts);
  if (fontError) return fontError;
  return null;
}

function assignOptional<K extends keyof MTCaptchaClientConfig>(
  config: MTCaptchaClientConfig,
  key: K,
  value: MTCaptchaClientConfig[K] | undefined,
) {
  if (value === undefined) {
    delete config[key];
    return;
  }
  config[key] = value;
}

/** Copies component props onto the shared MTCaptcha config object. */
export function assignMTCaptchaProps(
  config: MTCaptchaClientConfig,
  props: MTCaptchaProps,
): void {
  config.sitekey = props.sitekey.trim();
  config.render = 'explicit';
  if (!Array.isArray(config.renderQueue)) {
    config.renderQueue = [];
  }

  assignOptional(config, 'enableTestMode', props.enableTestMode);
  assignOptional(config, 'lang', props.lang);
  assignOptional(config, 'customLangText', props.customLangText);
  assignOptional(config, 'customAccessibilityText', props.customAccessibilityText);
  assignOptional(config, 'customFonts', props.customFonts);
  assignOptional(config, 'customStyle', props.customStyle);
  assignOptional(config, 'action', isPresent(props.action) ? props.action : undefined);
  assignOptional(config, 'widgetSize', props.widgetSize);
  assignOptional(config, 'miniFormWidth', props.miniFormWidth);
  assignOptional(config, 'miniFormHeight', props.miniFormHeight);
  assignOptional(config, 'lowFrictionInvisible', props.lowFrictionInvisible);
  assignOptional(config, 'challengeType', props.challengeType);
  assignOptional(config, 'autoFormValidate', props.autoFormValidate);
  assignOptional(config, 'autoFadeOuterText', props.autoFadeOuterText);

  config.theme = props.theme ?? 'basic';
  config.loadAnimation = props.loadAnimation ?? true;
}
