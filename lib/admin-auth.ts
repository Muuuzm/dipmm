import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "prestige_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  login: string;
  expiresAt: number;
};

export function getAdminConfig() {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  return {
    login,
    password,
    secret,
    isConfigured: Boolean(login && password && secret)
  };
}

export function createAdminSession(login: string) {
  const { secret } = getAdminConfig();
  if (!secret) {
    throw new Error("Административная панель не настроена.");
  }

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${login}.${expiresAt}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function verifyAdminSession(value?: string): AdminSession | null {
  const { login, secret, isConfigured } = getAdminConfig();
  if (!value || !login || !secret || !isConfigured) {
    return null;
  }

  const parts = value.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [sessionLogin, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  const payload = `${sessionLogin}.${expiresAtRaw}`;
  const expected = signPayload(payload, secret);

  if (
    sessionLogin !== login ||
    !Number.isFinite(expiresAt) ||
    expiresAt < Date.now() ||
    !safeEqual(signature, expected)
  ) {
    return null;
  }

  return {
    login: sessionLogin,
    expiresAt
  };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export function clearAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export const adminSessionCookieName = SESSION_COOKIE;

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
}
