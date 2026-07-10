import { NextResponse } from "next/server";
import { adminSessionCookieName, clearAdminCookieOptions } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, "", clearAdminCookieOptions());

  return response;
}
