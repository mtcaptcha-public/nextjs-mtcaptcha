/** Body and query fields checked, in order, for a verified token. */
export const MTCAPTCHA_TOKEN_FIELDS = [
  'mtcaptcha-verifiedtoken',
  'verifiedToken',
  'token',
] as const;

function readField(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return readField(value[0]);
  }
  return null;
}

/** Reads a verified token from a JSON body, form object, or query object. */
export function readVerifiedToken(
  source: unknown,
  fields: readonly string[] = MTCAPTCHA_TOKEN_FIELDS,
): string | null {
  if (!source || typeof source !== 'object') return null;
  const record = source as Record<string, unknown>;
  for (const field of fields) {
    const token = readField(record[field]);
    if (token) return token;
  }
  return null;
}
