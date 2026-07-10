import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  adminSessionCookieName,
  createAdminSession,
  getAdminConfig
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { login, password } = (await request.json()) as {
    login?: string;
    password?: string;
  };
  const config = getAdminConfig();

  if (!config.isConfigured) {
    return NextResponse.json(
      { error: "Административная панель не настроена. Проверьте .env." },
      { status: 503 }
    );
  }

  if (!config.login || login !== config.login || password !== config.password) {
    return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    adminSessionCookieName,
    createAdminSession(config.login),
    adminCookieOptions()
  );

  return response;
}
