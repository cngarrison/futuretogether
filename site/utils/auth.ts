/**
 * Shared authentication helpers for middleware and route handlers.
 *
 * - getSessionFromRequest(req): extracts access_token from 'sb-access-token' cookie
 * - getUserFromToken(token): validates token via Supabase auth.getUser()
 * - hasPlatformRole(profileId, role): checks user_platform_roles table via admin client
 * - isSiteAdmin(profileId): returns true if user has site_owner OR site_admin role
 * - setSessionCookies(headers, session, rememberMe): sets httpOnly session cookies
 * - clearSessionCookies(headers): clears both session cookies (maxAge=0)
 */

import { getCookies, setCookie } from "@std/http";
import type { Session, User } from "@supabase/supabase-js";
import { isLocalDev } from "@/utils/app.ts";
import { createAdminClient, createSupabaseClient } from "@/utils/supabase.ts";

/**
 * Extract the Supabase access token from the 'sb-access-token' cookie.
 * Returns undefined if the cookie is absent.
 */
export function getSessionFromRequest(req: Request): string | undefined {
  const cookies = getCookies(req.headers);
  return cookies["sb-access-token"] || undefined;
}

/**
 * Validate an access token by calling Supabase auth.getUser().
 * Returns the User on success, null on any error (expired, invalid, etc.).
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const client = createSupabaseClient(token);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Check whether a user has a specific platform role.
 * Uses the admin client to bypass RLS on user_platform_roles.
 */
export async function hasPlatformRole(
  profileId: string,
  role: string,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_platform_roles")
      .select("role")
      .eq("profile_id", profileId)
      .eq("role", role)
      .maybeSingle();
    return !error && data !== null;
  } catch {
    return false;
  }
}

/**
 * Returns true if the user has the site_owner OR site_admin platform role.
 * Both checks run in parallel for efficiency.
 */
export async function isSiteAdmin(profileId: string): Promise<boolean> {
  const [isOwner, isAdmin] = await Promise.all([
    hasPlatformRole(profileId, "site_owner"),
    hasPlatformRole(profileId, "site_admin"),
  ]);
  return isOwner || isAdmin;
}

/**
 * Write session cookies onto the given Headers object.
 *
 * - sb-access-token: maxAge = session.expires_in (default 3600 s)
 * - sb-refresh-token: maxAge = 30 days (rememberMe=true) or 7 days
 *
 * Both cookies are httpOnly, path='/', sameSite='Lax'.
 * secure=true in production, false in local dev.
 */
export function setSessionCookies(
  headers: Headers,
  session: Session,
  rememberMe: boolean,
): void {
  const secure = !isLocalDev();

  setCookie(headers, {
    name: "sb-access-token",
    value: session.access_token,
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "Lax",
    maxAge: session.expires_in ?? 3600,
  });

  setCookie(headers, {
    name: "sb-refresh-token",
    value: session.refresh_token ?? "",
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "Lax",
    maxAge: rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600,
  });
}

/**
 * Clear both session cookies by setting them to empty with maxAge=0.
 */
export function clearSessionCookies(headers: Headers): void {
  const secure = !isLocalDev();

  setCookie(headers, {
    name: "sb-access-token",
    value: "",
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "Lax",
    maxAge: 0,
  });

  setCookie(headers, {
    name: "sb-refresh-token",
    value: "",
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "Lax",
    maxAge: 0,
  });
}
