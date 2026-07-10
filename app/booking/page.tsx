"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MASTER_OPTIONS, SERVICE_OPTIONS } from "@/lib/validation-core";
import { getMastersForDate } from "@/lib/schedule";

type Availability = {
  date: string;
  master: string;
  workingHours: {
    start: string;
    end: string;
  };
  busySlots: string[];
  availableSlots: string[];
};

type FormErrors = {
  name?: string;
  phone?: string;
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь"
];

export default function BookingPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMaster, setSelectedMaster] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const mastersOnShift = useMemo(
    () => (selectedDate ? getMastersForDate(selectedDate) : []),
    [selectedDate]
  );

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const canSubmit = Boolean(
    name.trim() &&
      phone.trim() &&
      selectedService &&
      selectedDate &&
      selectedMaster &&
      selectedTime
  );

  useEffect(() => {
    setSelectedMaster("");
    setSelectedTime("");
    setAvailability(null);
  }, [selectedDate, selectedService]);

  useEffect(() => {
    if (!selectedDate || !selectedMaster || !selectedService) {
      return;
    }

    const controller = new AbortController();
    setAvailabilityStatus("loading");
    setAvailability(null);
    setSelectedTime("");

    const params = new URLSearchParams({
      date: selectedDate,
      master: selectedMaster,
      duration: String(selectedService.duration)
    });

    fetch(`/api/availability?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить свободное время.");
        }

        return response.json() as Promise<Availability>;
      })
      .then((data) => {
        setAvailability(data);
        setAvailabilityStatus("idle");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAvailabilityStatus("error");
      });

    return () => controller.abort();
  }, [selectedDate, selectedMaster, selectedService]);

  function validateClient() {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Введите имя.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Введите телефон.";
    } else if (!/^\+7 \d{3} \d{3}-\d{2}-\d{2}$/.test(phone)) {
      nextErrors.phone = "Введите телефон в формате +7 900 000-00-00.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");

    if (!validateClient() || !canSubmit) {
      setSubmitStatus("error");
      setSubmitMessage("Заполните все шаги записи.");
      return;
    }

    setSubmitStatus("loading");

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        service: selectedService.title,
        master: selectedMaster,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration,
        price: selectedService.price,
        comment
      })
    });

    const data = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setSubmitStatus("error");
      setSubmitMessage(
        data.error ??
          data.message ??
          "Не удалось создать запись. Попробуйте выбрать другое время."
      );
      return;
    }

    setSubmitStatus("success");
    setSubmitMessage("Администратор свяжется с вами для подтверждения записи.");
  }

  function resetBooking() {
    setName("");
    setPhone("");
    setComment("");
    setSelectedService(SERVICE_OPTIONS[0]);
    setSelectedDate("");
    setSelectedMaster("");
    setSelectedTime("");
    setAvailability(null);
    setErrors({});
    setSubmitStatus("idle");
    setSubmitMessage("");
  }

  if (submitStatus === "success") {
    return (
      <main className="booking-page">
        <section className="booking-success">
          <span className="section-badge">Заявка отправлена</span>
          <h1>Спасибо, запись создана</h1>
          <p>{submitMessage}</p>
          <div className="success-actions">
            <Link className="button button-ghost" href="/">
              Вернуться на главную
            </Link>
            <button className="button button-primary" type="button" onClick={resetBooking}>
              Создать ещё одну запись
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <header className="booking-top">
        <Link className="back-link" href="/">
          ← Вернуться на главную
        </Link>
        <span className="section-badge">Онлайн-запись</span>
        <h1>Выберите услугу, мастера и удобное время</h1>
        <p>
          Пошаговая запись проверяет смены мастеров и свободные слоты перед
          сохранением заявки.
        </p>
      </header>

      <form className="booking-wizard" onSubmit={handleSubmit}>
        <div className="wizard-main">
          <section className="wizard-step">
            <StepHeader number="1" title="Данные клиента" />
            <div className="client-grid">
              <label>
                Имя
                <input
                  value={name}
                  onBlur={validateClient}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ваше имя"
                />
                {errors.name ? <small className="field-error">{errors.name}</small> : null}
              </label>
              <label>
                Телефон
                <input
                  value={phone}
                  onBlur={validateClient}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  placeholder="+7 900 000-00-00"
                  inputMode="tel"
                />
                {errors.phone ? (
                  <small className="field-error">{errors.phone}</small>
                ) : null}
              </label>
            </div>
          </section>

          <section className="wizard-step">
            <StepHeader number="2" title="Выбор услуги" />
            <div className="booking-service-grid">
              {SERVICE_OPTIONS.map((service) => (
                <button
                  className={`booking-option-card ${
                    selectedService.title === service.title ? "is-selected" : ""
                  }`}
                  key={service.title}
                  type="button"
                  onClick={() => setSelectedService(service)}
                >
                  <span className="service-icon">{service.icon}</span>
                  <strong>{service.title}</strong>
                  <p>{service.description}</p>
                  <em>
                    {service.priceLabel} · {service.durationLabel}
                  </em>
                </button>
              ))}
            </div>
          </section>

          <section className="wizard-step">
            <StepHeader number="3" title="Дата визита" />
            <div className="calendar-card">
              <div className="calendar-head">
                <button type="button" onClick={() => shiftMonth(-1)}>
                  ←
                </button>
                <strong>
                  {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                </strong>
                <button type="button" onClick={() => shiftMonth(1)}>
                  →
                </button>
              </div>
              <div className="calendar-weekdays">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day) => {
                  const dateValue = toDateValue(day.date);
                  const disabled = day.isOutside || isPastDate(day.date);

                  return (
                    <button
                      className={selectedDate === dateValue ? "is-selected" : ""}
                      disabled={disabled}
                      key={dateValue}
                      type="button"
                      onClick={() => setSelectedDate(dateValue)}
                    >
                      {day.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="wizard-step">
            <StepHeader number="4" title="Мастера на смене" />
            {!selectedDate ? (
              <EmptyState text="Сначала выберите дату, чтобы увидеть мастеров на смене." />
            ) : mastersOnShift.length ? (
              <div className="booking-master-grid">
                {mastersOnShift.map((master) => (
                  <button
                    className={`booking-master-card ${
                      selectedMaster === master.name ? "is-selected" : ""
                    }`}
                    key={master.name}
                    type="button"
                    onClick={() => setSelectedMaster(master.name)}
                  >
                    <img src={master.image} alt={master.name} />
                    <span>На смене в этот день</span>
                    <strong>{master.name}</strong>
                    <p>{master.role}</p>
                    <em>{master.experience}</em>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState text="На выбранную дату мастеров на смене нет. Выберите другой день." />
            )}
          </section>

          <section className="wizard-step">
            <StepHeader number="5" title="Свободное время" />
            {!selectedMaster ? (
              <EmptyState text="Выберите мастера, чтобы загрузить свободные слоты." />
            ) : availabilityStatus === "loading" ? (
              <EmptyState text="Загружаем свободное время..." />
            ) : availabilityStatus === "error" ? (
              <EmptyState text="Не удалось загрузить свободное время. Попробуйте еще раз." />
            ) : availability?.availableSlots.length ? (
              <div className="time-grid">
                {availability.availableSlots.map((slot) => (
                  <button
                    className={selectedTime === slot ? "is-selected" : ""}
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState text="На выбранные дату и мастера свободных слотов нет." />
            )}
          </section>

          <section className="wizard-step">
            <StepHeader number="6" title="Комментарий" />
            <label>
              Комментарий
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Пожелания к стрижке, окрашиванию или времени связи"
                rows={4}
              />
            </label>
          </section>
        </div>

        <aside className="booking-summary">
          <span>Ваша запись</span>
          <h2>Детали визита</h2>
          {!name && !phone && !selectedDate && !selectedMaster && !selectedTime ? (
            <p>Заполните данные, чтобы увидеть детали записи.</p>
          ) : (
            <dl>
              <SummaryItem label="Имя" value={name} />
              <SummaryItem label="Телефон" value={phone} />
              <SummaryItem label="Услуга" value={selectedService.title} />
              <SummaryItem label="Мастер" value={selectedMaster} />
              <SummaryItem label="Дата" value={formatDate(selectedDate)} />
              <SummaryItem label="Время" value={selectedTime} />
              <SummaryItem label="Длительность" value={selectedService.durationLabel} />
              <SummaryItem label="Стоимость" value={selectedService.priceLabel} />
            </dl>
          )}
          {submitMessage && submitStatus === "error" ? (
            <p className="summary-error">{submitMessage}</p>
          ) : null}
          <button
            className="button button-primary summary-submit"
            disabled={!canSubmit || submitStatus === "loading"}
            type="submit"
          >
            {submitStatus === "loading" ? "Отправка..." : "Отправить заявку"}
          </button>
        </aside>
      </form>
    </main>
  );

  function shiftMonth(direction: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );
  }
}

function StepHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="step-header">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="booking-empty">{text}</div>;
}

function SummaryItem({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || "Не выбрано"}</dd>
    </>
  );
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      isOutside: date.getMonth() !== month.getMonth()
    };
  });
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^8/, "7").replace(/^7?/, "7").slice(0, 11);
  const part1 = digits.slice(1, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 9);
  const part4 = digits.slice(9, 11);

  let formatted = "+7";
  if (part1) formatted += ` ${part1}`;
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += `-${part3}`;
  if (part4) formatted += `-${part4}`;

  return formatted;
}

function isPastDate(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  return normalized < today;
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}
