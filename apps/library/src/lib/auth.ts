export const SESSION_COOKIE = "facets_session";

/** Auth is off when no token is configured (local development). */
export function authEnabled() {
  return Boolean(process.env.FACETS_API_TOKEN);
}

export function isValidToken(candidate: string | undefined | null) {
  const expected = process.env.FACETS_API_TOKEN;
  if (!expected) return true;
  if (!candidate || candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i);
  return diff === 0;
}
