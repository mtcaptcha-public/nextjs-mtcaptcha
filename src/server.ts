import { MTCAPTCHA_TOKEN_FIELDS, readVerifiedToken } from './read-token.ts';
import type { MTCaptchaVerifyResult, VerifyMTCaptchaOptions } from './types';

const CHECKTOKEN_URL = 'https://service.mtcaptcha.com/mtcv1/api/checktoken';
const CHECKTOKEN_EXPLICIT_ACL_URL = 'https://service2.mtcaptcha.com/mtcv1/api/checktoken';

export interface WithMTCaptchaOptions {
  /** Defaults to `process.env.MTCAPTCHA_PRIVATE_KEY`. */
  privateKey?: string;
  /** Fields to inspect on `req.body`, then `req.query`. */
  tokenFields?: readonly string[];
  /** Use the service2 CheckToken host for fixed-IP firewall rules. */
  explicitAcl?: boolean;
  tokenExpireMiniSec?: number;
  tokenDuplicateCallMaxCount?: number;
}

export interface MTCaptchaRouteRequest {
  body?: unknown;
  query?: unknown;
  mtcaptcha?: MTCaptchaVerifyResult;
}

export interface MTCaptchaRouteResponse {
  status: (code: number) => MTCaptchaRouteResponse;
  json: (body: unknown) => void;
}

export { MTCAPTCHA_TOKEN_FIELDS, readVerifiedToken };
export type { MTCaptchaVerifyResult, VerifyMTCaptchaOptions };

function assertServerContext(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'MTCaptcha server helpers must run on the server. Import them from "nextjs-mtcaptcha/server" in a Route Handler, Server Action, or Pages API route.',
    );
  }
}

function failed(codes: string[]): MTCaptchaVerifyResult {
  return { success: false, fail_codes: codes };
}

function isBoundedInteger(value: number | undefined, max: number): boolean {
  if (value == null) return true;
  return Number.isInteger(value) && value >= 1 && value <= max;
}

/**
 * Checks a verified token with the MTCaptcha CheckToken API.
 * The private key never leaves the server.
 */
export async function verifyMTCaptchaToken(
  options: VerifyMTCaptchaOptions,
): Promise<MTCaptchaVerifyResult> {
  assertServerContext();

  const privateKey = options.privateKey?.trim() ?? '';
  const token = options.token?.trim() ?? '';
  const missing: string[] = [];
  if (!privateKey) missing.push('missing-input-privatekey');
  if (!token) missing.push('missing-input-token');
  if (missing.length > 0) return failed(missing);

  if (!isBoundedInteger(options.tokenExpireMiniSec, 1200)) {
    return failed(['bad-request']);
  }
  if (!isBoundedInteger(options.tokenDuplicateCallMaxCount, 20)) {
    return failed(['bad-request']);
  }

  const url = new URL(options.explicitAcl ? CHECKTOKEN_EXPLICIT_ACL_URL : CHECKTOKEN_URL);
  url.searchParams.set('privatekey', privateKey);
  url.searchParams.set('token', token);
  if (options.tokenExpireMiniSec != null) {
    url.searchParams.set('tokenExpireMiniSec', String(options.tokenExpireMiniSec));
  }
  if (options.tokenDuplicateCallMaxCount != null) {
    url.searchParams.set('tokenDuplicateCallMaxCount', String(options.tokenDuplicateCallMaxCount));
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'error',
    });
    if (!response.ok) return failed(['bad-request']);
    return (await response.json()) as MTCaptchaVerifyResult;
  } catch {
    return failed(['bad-request']);
  }
}

function statusFor(result: MTCaptchaVerifyResult): number {
  const codes = result.fail_codes ?? [];
  if (codes.includes('missing-input-privatekey')) return 500;
  if (codes.includes('missing-input-token')) return 400;
  return 403;
}

/**
 * Pages Router guard. Verifies the captcha token, then calls `handler`.
 * On success, the CheckToken result is available as `req.mtcaptcha`.
 */
export function withMTCaptcha<
  Req extends MTCaptchaRouteRequest,
  Res extends MTCaptchaRouteResponse,
>(handler: (req: Req, res: Res) => unknown, options: WithMTCaptchaOptions = {}) {
  return async function mtcaptchaRoute(req: Req, res: Res): Promise<unknown> {
    const fields = options.tokenFields ?? MTCAPTCHA_TOKEN_FIELDS;
    const token =
      readVerifiedToken(req.body, fields) ?? readVerifiedToken(req.query, fields) ?? '';
    const result = await verifyMTCaptchaToken({
      privateKey: options.privateKey ?? process.env.MTCAPTCHA_PRIVATE_KEY ?? '',
      token,
      explicitAcl: options.explicitAcl,
      tokenExpireMiniSec: options.tokenExpireMiniSec,
      tokenDuplicateCallMaxCount: options.tokenDuplicateCallMaxCount,
    });

    if (!result.success) {
      res.status(statusFor(result)).json(result);
      return;
    }

    req.mtcaptcha = result;
    return handler(req, res);
  };
}
