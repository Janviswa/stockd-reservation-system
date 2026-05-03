// lib/auth.ts — simple cookie-based admin auth (no external deps needed)
// Admin credentials are env-configured; this is intentionally minimal
// for a take-home exercise. Production would use NextAuth or similar.

import { cookies } from "next/headers";

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "admin@stockd.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const SESSION_COOKIE = "stockd_admin_session";
const SESSION_VALUE  = "authenticated";

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
