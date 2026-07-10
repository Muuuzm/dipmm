import { NextResponse } from "next/server";
import { adminSessionCookieName, clearAdminCookieOptions } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set(adminSessionCookieName, "", clearAdminCookieOptions());

  return response;
}
