"use client";

import { FormEvent, useState } from "react";
import { MASTERS, SERVICES } from "@/lib/validation";

type FormState = {
  name: string;
  phone: string;
  service: string;
  master: string;
  date: string;
  time: string;
  comment: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  service: SERVICES[0],
  master: MASTERS[0],
  date: "",
  time: "",
  comment: ""
};

export function AppointmentForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(data.message ?? "Проверьте данные и попробуйте снова.");
      return;
    }

    setStatus("success");
    setMessage(data.message ?? "Заявка отправлена.");
    setForm(initialState);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="form-title">
        <span>Быстрая запись</span>
        <h3>Оставьте контакты</h3>
      </div>

      <div className="form-grid">
        <label>
          Имя
          <input
            name="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ваше имя"
            required
          />
        </label>
        <label>
          Телефон
          <input
            name="phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+7 900 000-00-00"
            required
          />
        </label>
        <label>
          Услуга
          <select
            name="service"
            value={form.service}
            onChange={(event) => updateField("service", event.target.value)}
            required
          >
            {SERVICES.map((service) => (
              <option key={service}>{service}</option>
            ))}
          </select>
        </label>
        <label>
          Мастер
          <select
            name="master"
            value={form.master}
            onChange={(event) => updateField("master", event.target.value)}
            required
          >
            {MASTERS.map((master) => (
              <option key={master}>{master}</option>
            ))}
          </select>
        </label>
        <label>
          Дата
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={(event) => updateField("date", event.target.value)}
            required
          />
        </label>
        <label>
          Время
          <input
            name="time"
            type="time"
            value={form.time}
            onChange={(event) => updateField("time", event.target.value)}
            required
          />
        </label>
      </div>
      <label>
        Комментарий
        <textarea
          name="comment"
          value={form.comment}
          onChange={(event) => updateField("comment", event.target.value)}
          placeholder="Пожелания к стрижке или окрашиванию"
          rows={4}
        />
      </label>
      <button className="button button-primary form-button" disabled={status === "loading"} type="submit">
        {status === "loading" ? "Отправка..." : "Отправить заявку"}
      </button>
      {message ? <p className={`form-message ${status}`}>{message}</p> : null}
    </form>
  );
}
