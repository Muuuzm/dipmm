"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Не удалось выполнить вход.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label>
        Логин
        <input
          autoComplete="username"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          placeholder="admin"
          required
        />
      </label>
      <label>
        Пароль
        <input
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Введите пароль"
          required
        />
      </label>
      {message ? <p className="admin-alert">{message}</p> : null}
      <button className="button button-primary" disabled={status === "loading"} type="submit">
        {status === "loading" ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}
