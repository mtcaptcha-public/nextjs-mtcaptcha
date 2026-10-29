import type { MTCaptchaClientConfig } from './types';

/**
 * Returns the page-level MTCaptcha config, creating it when needed.
 * The same object and render queue are kept so the loaded client script
 * continues to see new explicit-render requests.
 */
export function ensureClientConfig(): MTCaptchaClientConfig {
  const current = window.mtcaptchaConfig;
  if (current) {
    current.render = 'explicit';
    if (!Array.isArray(current.renderQueue)) {
      current.renderQueue = [];
    }
    return current;
  }

  const created: MTCaptchaClientConfig = {
    sitekey: '',
    render: 'explicit',
    renderQueue: [],
  };
  window.mtcaptchaConfig = created;
  return created;
}

export function enqueueRender(domId: string): void {
  const config = ensureClientConfig();
  if (!config.renderQueue.includes(domId)) {
    config.renderQueue.push(domId);
  }
}

export function dequeueRender(domId: string): void {
  const queue = window.mtcaptchaConfig?.renderQueue;
  if (!queue) return;
  for (let index = queue.length - 1; index >= 0; index -= 1) {
    if (queue[index] === domId) {
      queue.splice(index, 1);
    }
  }
}
