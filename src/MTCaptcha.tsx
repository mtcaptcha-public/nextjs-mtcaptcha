import Script from 'next/script';
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
} from 'react';
import { dequeueRender, enqueueRender, ensureClientConfig } from './client-config';
import { assignMTCaptchaProps, validateMTCaptchaProps } from './config';
import { bindDispatchers, subscribe } from './listeners';
import type { MTCaptchaHandle, MTCaptchaProps, MTCaptchaState } from './types';

const PRIMARY_SCRIPT = 'https://service.mtcaptcha.com/mtcv1/client/mtcaptcha.min.js';
const SECONDARY_SCRIPT = 'https://service2.mtcaptcha.com/mtcv1/client/mtcaptcha2.min.js';

function scriptFailure(domId: string): MTCaptchaState {
  return {
    element: typeof document === 'undefined' ? null : document.getElementById(domId),
    domID: domId,
    statusCode: 0,
    verifiedToken: null,
    isVerified: false,
    isVisible: false,
    statusDesc: 'Failed to load the MTCaptcha client script.',
  };
}

function MTCaptchaComponent(props: MTCaptchaProps, ref: ForwardedRef<MTCaptchaHandle>) {
  const reactId = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const domId = props.id || `mtcaptcha-${reactId}`;
  const propsRef = useRef(props);
  const domIdRef = useRef(domId);
  const skipPropRender = useRef(true);
  propsRef.current = props;
  domIdRef.current = domId;

  const validationError = validateMTCaptchaProps(props);

  if (typeof window !== 'undefined' && !validationError) {
    const config = ensureClientConfig();
    assignMTCaptchaProps(config, props);
    bindDispatchers(config);
  }

  useImperativeHandle(
    ref,
    (): MTCaptchaHandle => ({
      setEnableTestMode(testKey) {
        window.mtcaptcha?.enableTestMode(testKey);
      },
      getConfiguration() {
        return window.mtcaptcha?.getConfiguration();
      },
      getStatus() {
        return window.mtcaptcha?.getStatus();
      },
      getVerifiedToken() {
        return window.mtcaptcha?.getVerifiedToken() ?? null;
      },
      renderUI() {
        window.mtcaptcha?.renderUI();
      },
      resetUI() {
        window.mtcaptcha?.resetUI();
      },
      remove() {
        window.mtcaptcha?.remove();
      },
      showMandatory() {
        window.mtcaptcha?.showMandatory();
      },
    }),
    [],
  );

  useEffect(() => {
    if (validateMTCaptchaProps(propsRef.current)) return undefined;

    const config = ensureClientConfig();
    assignMTCaptchaProps(config, propsRef.current);
    bindDispatchers(config);

    const unsubscribe = subscribe(domId, {
      jsloaded: (state) => propsRef.current.jsloadedCallback?.(state),
      rendered: (state) => propsRef.current.renderedCallback?.(state),
      verified: (state) => propsRef.current.verifiedCallback?.(state),
      verifyexpired: (state) => propsRef.current.verifyexpiredCallback?.(state),
      error: (state) => propsRef.current.errorCallback?.(state),
    });
    enqueueRender(domId);

    return () => {
      unsubscribe();
      dequeueRender(domId);
      try {
        window.mtcaptcha?.remove();
      } catch (error) {
        console.error('MTCaptcha failed to remove the widget', error);
      }
    };
  }, [domId]);

  useEffect(() => {
    if (validationError) return;
    const config = ensureClientConfig();
    assignMTCaptchaProps(config, props);
    if (skipPropRender.current) {
      skipPropRender.current = false;
      return;
    }
    try {
      window.mtcaptcha?.renderUI();
    } catch (error) {
      console.error('MTCaptcha failed to render the widget', error);
    }
  }, [
    validationError,
    domId,
    props.sitekey,
    props.enableTestMode,
    props.lang,
    props.customLangText,
    props.customAccessibilityText,
    props.customFonts,
    props.customStyle,
    props.theme,
    props.challengeType,
    props.action,
    props.widgetSize,
    props.miniFormWidth,
    props.miniFormHeight,
    props.loadAnimation,
    props.autoFadeOuterText,
    props.lowFrictionInvisible,
    props.autoFormValidate,
  ]);

  if (validationError) {
    throw new Error(validationError);
  }

  const anchorClassName = props.className ? `mtcaptcha ${props.className}` : 'mtcaptcha';

  return (
    <>
      <div id={domId} className={anchorClassName} />
      <Script
        id="nextjs-mtcaptcha-script"
        src={PRIMARY_SCRIPT}
        strategy="afterInteractive"
        onError={() => propsRef.current.errorCallback?.(scriptFailure(domIdRef.current))}
      />
      <Script
        id="nextjs-mtcaptcha-script-secondary"
        src={SECONDARY_SCRIPT}
        strategy="afterInteractive"
      />
    </>
  );
}

/**
 * MTCaptcha widget for the Next.js App Router and Pages Router.
 * The component is a Client Component. Pass callbacks from client code.
 */
export const MTCaptcha = forwardRef(MTCaptchaComponent);
MTCaptcha.displayName = 'MTCaptcha';
