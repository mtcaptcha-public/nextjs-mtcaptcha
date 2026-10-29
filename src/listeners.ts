import type { MTCaptchaClientConfig, MTCaptchaState } from './types';

type CallbackBucket = 'jsloaded' | 'rendered' | 'verified' | 'verifyexpired' | 'error';

export type MTCaptchaListenerMap = Record<
  CallbackBucket,
  (state: MTCaptchaState) => void
>;

const buckets: Record<CallbackBucket, Set<(state: MTCaptchaState) => void>> = {
  jsloaded: new Set(),
  rendered: new Set(),
  verified: new Set(),
  verifyexpired: new Set(),
  error: new Set(),
};

const callbackKeys: Record<CallbackBucket, keyof MTCaptchaClientConfig> = {
  jsloaded: 'jsloaded-callback',
  rendered: 'rendered-callback',
  verified: 'verified-callback',
  verifyexpired: 'verifyexpired-callback',
  error: 'error-callback',
};

const boundConfigs = new WeakSet<MTCaptchaClientConfig>();

function belongsToAnchor(state: MTCaptchaState, domId: string): boolean {
  if (!state?.domID) return true;
  if (state.domID === domId) return true;
  return state.element?.id === domId;
}

function emit(bucket: CallbackBucket, state: MTCaptchaState) {
  buckets[bucket].forEach((listener) => {
    listener(state);
  });
}

/** Attaches stable callbacks once. Later subscribers are invoked through these functions. */
export function bindDispatchers(config: MTCaptchaClientConfig): void {
  if (boundConfigs.has(config)) return;
  boundConfigs.add(config);

  (Object.keys(callbackKeys) as CallbackBucket[]).forEach((bucket) => {
    const key = callbackKeys[bucket];
    const callback = (state: MTCaptchaState) => {
      emit(bucket, state);
    };
    config[key] = callback as MTCaptchaClientConfig[typeof key];
  });
}

/**
 * Registers callbacks for one widget anchor.
 * Events that name a different `domID` are ignored, except `jsloaded`,
 * which fires for the library rather than a single anchor.
 */
export function subscribe(domId: string, listeners: MTCaptchaListenerMap): () => void {
  const removals = (Object.keys(listeners) as CallbackBucket[]).map((bucket) => {
    const listener = (state: MTCaptchaState) => {
      if (bucket !== 'jsloaded' && !belongsToAnchor(state, domId)) {
        return;
      }
      listeners[bucket](state);
    };
    buckets[bucket].add(listener);
    return () => {
      buckets[bucket].delete(listener);
    };
  });

  return () => {
    removals.forEach((remove) => {
      remove();
    });
  };
}
