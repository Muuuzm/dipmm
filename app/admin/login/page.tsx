import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminConfig, getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const config = getAdminConfig();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="back-link" href="/">
          ← На сайт
        </Link>
        <span className="section-badge">Администратор</span>
        <h1>Вход в панель</h1>
        <p>Введите логин и пароль администратора для управления заявками.</p>
        {!config.isConfigured ? (
          <p className="admin-alert">
            Панель не настроена. Добавьте ADMIN_LOGIN, ADMIN_PASSWORD и
            ADMIN_SESSION_SECRET в `.env`.
          </p>
        ) : null}
        <AdminLoginForm />
      </section>
    </main>
  );
}
