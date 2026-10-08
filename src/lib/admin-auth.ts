import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'clapai_admin_session';
const SESSION_MAX_AGE = 8 * 60 * 60;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  }
  return secret;
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    throw new Error('ADMIN_PASSWORD is not configured.');
  }
  if (configuredPassword.length < 16) {
    throw new Error('ADMIN_PASSWORD must contain at least 16 characters.');
  }
  if (password.length > 256) return false;
  const submittedDigest = createHmac('sha256', 'clapai-admin-password-check').update(password).digest();
  const configuredDigest = createHmac('sha256', 'clapai-admin-password-check').update(configuredPassword).digest();
  return timingSafeEqual(submittedDigest, configuredDigest);
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = String(expiresAt);
  const signature = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return { token: `${payload}.${signature}`, maxAge: SESSION_MAX_AGE };
}

export function isAdminSessionValid(token: string | undefined) {
  if (!token) return false;
  const [payload, suppliedSignature, ...extra] = token.split('.');
  if (!payload || !suppliedSignature || extra.length) return false;
  const expiresAt = Number(payload);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const expectedSignature = createHmac('sha256', getSessionSecret()).update(payload).digest();
  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(suppliedSignature, 'base64url');
  } catch {
    return false;
  }
  return actualSignature.length === expectedSignature.length && timingSafeEqual(actualSignature, expectedSignature);
}

export function getCookieToken(cookieHeader: string | null) {
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`));
  return cookie?.slice(ADMIN_COOKIE_NAME.length + 1);
}

export function hasAdminSession(request: Request) {
  return isAdminSessionValid(getCookieToken(request.headers.get('cookie')));
}
