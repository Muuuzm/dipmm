"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Service = { id?: number; slug: string; icon: string; title: string; price: number; priceLabel: string; duration: number; durationLabel: string; description: string; isBookable: boolean };
type Master = { id?: number; slug: string; name: string; role: string; experience: string; bio?: string | null; image: string; tags: string[] };
type Availability = { availableSlots: string[]; busySlots: string[]; workingHours: { start: string; end: string } };

const today = startOfDay(new Date());
const steps = ["Контакты", "Услуга", "Дата", "Мастер", "Время", "Готово"];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

export default function BookingPage() {
  return <Suspense fallback={<BookingLoading />}><BookingWizard /></Suspense>;
}

function BookingWizard() {
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service") ?? "";
  const initialMaster = searchParams.get("master") ?? "";
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState<"catalog" | "masters" | "slots" | "submit" | "">("catalog");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/public/services?bookable=true")
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить услуги.");
        return response.json() as Promise<{ services: Service[] }>;
      })
      .then(({ services: loaded }) => {
        setServices(loaded);
        setSelectedService(loaded.find((item) => item.slug === initialService) ?? null);
        setLoading("");
      })
      .catch(() => { setMessage("Не удалось загрузить услуги. Проверьте подключение и повторите."); setLoading(""); });
  }, [initialService]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const progress = success ? 100 : (step / 6) * 100;

  function continueFromContacts(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setMessage("Введите имя.");
    if (!/^\+7 \d{3} \d{3}-\d{2}-\d{2}$/.test(phone)) return setMessage("Введите телефон в формате +7 900 000-00-00.");
    setMessage("");
    setStep(2);
  }

  function chooseService(service: Service) {
    setSelectedService(service);
    setSelectedDate("");
    setSelectedMaster(null);
    setSelectedTime("");
    setMessage("");
    setStep(3);
  }

  async function chooseDate(date: string) {
    if (!selectedService) return;
    setSelectedDate(date);
    setSelectedMaster(null);
    setSelectedTime("");
    setAvailability(null);
    setLoading("masters");
    setMessage("");
    setStep(4);
    try {
      const params = new URLSearchParams({ date, service: selectedService.slug });
      const response = await fetch(`/api/public/masters?${params}`);
      if (!response.ok) throw new Error();
      const data = await response.json() as { masters: Master[] };
      setMasters(data.masters);
      const preferred = data.masters.find((item) => item.slug === initialMaster);
      if (preferred) await chooseMaster(preferred, date, selectedService);
    } catch {
      setMessage("Не удалось загрузить мастеров на выбранную дату.");
    } finally {
      setLoading("");
    }
  }

  async function chooseMaster(master: Master, date = selectedDate, service = selectedService) {
    if (!service || !date) return;
    setSelectedMaster(master);
    setSelectedTime("");
    setAvailability(null);
    setLoading("slots");
    setMessage("");
    setStep(5);
    try {
      const params = new URLSearchParams({ date, master: master.name, service: service.slug });
      const response = await fetch(`/api/availability?${params}`);
      if (!response.ok) throw new Error();
      setAvailability(await response.json() as Availability);
    } catch {
      setMessage("Не удалось загрузить свободное время. Попробуйте ещё раз.");
    } finally {
      setLoading("");
    }
  }

  async function submitAppointment() {
    if (!selectedService || !selectedMaster || !selectedDate || !selectedTime) return;
    setLoading("submit");
    setMessage("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, service: selectedService.title, master: selectedMaster.name, date: selectedDate, time: selectedTime, comment })
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        if (response.status === 409) {
          setStep(5);
          await chooseMaster(selectedMaster);
          throw new Error("Это время только что заняли. Выберите другое свободное окно.");
        }
        throw new Error(data.error || "Не удалось создать запись.");
      }
      setSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось создать запись.");
    } finally {
      setLoading("");
    }
  }

  function reset() {
    setStep(1); setName(""); setPhone(""); setComment(""); setSelectedService(null); setSelectedDate(""); setSelectedMaster(null); setSelectedTime(""); setSuccess(false); setMessage("");
  }

  if (success && selectedService && selectedMaster) {
    return <main className="booking-page"><section className="booking-success booking-success-rich"><div className="success-mark">✓</div><span className="section-badge">Запись создана</span><h1>До встречи в студии</h1><p>Заявка отправлена. После подтверждения её статус обновится в клиентском приложении.</p><div className="success-details"><SummaryItem label="Услуга" value={selectedService.title} /><SummaryItem label="Мастер" value={selectedMaster.name} /><SummaryItem label="Дата" value={formatDate(selectedDate)} /><SummaryItem label="Время" value={selectedTime} /></div><div className="hero-actions"><Link className="button button-primary" href="/">На главную</Link><button className="button button-ghost" type="button" onClick={reset}>Создать ещё одну запись</button></div></section></main>;
  }

  return (
    <main className="booking-page">
      <header className="booking-top compact-booking-top">
        <Link className="back-link" href="/">← Вернуться на главную</Link>
        <span className="section-badge">Онлайн-запись</span>
        <h1>Выберите удобное время</h1>
        <p>Данные услуг, мастеров и свободных окон загружаются из расписания студии.</p>
        <div className="booking-progress" aria-label={`Шаг ${step} из 6`}><span style={{ width: `${progress}%` }} /></div>
        <div className="booking-step-labels">{steps.map((label, index) => <span className={index + 1 <= step ? "is-active" : ""} key={label}>{index + 1}<small>{label}</small></span>)}</div>
      </header>

      <div className="booking-wizard booking-wizard-focused">
        <section className="booking-flow-card">
          <div className="booking-step-head"><span>{step}</span><div><small>Шаг {step} из 6</small><h2>{steps[step - 1]}</h2></div></div>
          {message ? <div className="form-message error">{message}</div> : null}

          {step === 1 ? <form className="booking-client-form" onSubmit={continueFromContacts}><label>Имя<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ваше имя" autoComplete="name" /></label><label>Телефон<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="+7 900 000-00-00" inputMode="tel" autoComplete="tel" /></label><button className="button button-primary" type="submit">Продолжить</button></form> : null}

          {step === 2 ? <div className="booking-choice-list">{loading === "catalog" ? <LoadingState text="Загружаем услуги" /> : services.map((service) => <button className={`booking-option-card ${selectedService?.slug === service.slug ? "is-selected" : ""}`} type="button" key={service.slug} onClick={() => chooseService(service)}><span className="booking-option-icon">{iconSymbol(service.icon)}</span><span><strong>{service.title}</strong><small>{service.description}</small><em>{service.priceLabel} · {service.durationLabel}</em></span><b>→</b></button>)}</div> : null}

          {step === 3 ? <div className="calendar-card"><div className="calendar-head"><button type="button" aria-label="Предыдущий месяц" disabled={!canMovePrevious(visibleMonth)} onClick={() => setVisibleMonth(changeMonth(visibleMonth, -1))}>←</button><strong>{monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</strong><button type="button" aria-label="Следующий месяц" disabled={!canMoveNext(visibleMonth)} onClick={() => setVisibleMonth(changeMonth(visibleMonth, 1))}>→</button></div><div className="calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{calendarDays.map((day) => { const value = formatDateValue(day.date); const disabled = !day.inCurrentMonth || day.date < today || day.date > addDays(today, 90); return <button className={selectedDate === value ? "is-selected" : ""} disabled={disabled} type="button" key={day.key} onClick={() => chooseDate(value)}><span>{day.date.getDate()}</span>{!disabled && day.date.getDay() === 0 ? <small>вс</small> : null}</button>; })}</div></div> : null}

          {step === 4 ? loading === "masters" ? <LoadingState text="Проверяем смену мастеров" /> : masters.length ? <div className="booking-master-grid">{masters.map((master) => <button className="booking-master-card" type="button" key={master.slug} onClick={() => chooseMaster(master)}><img src={master.image} alt={master.name} /><span><strong>{master.name}</strong><small>{master.role}</small><em>{master.experience}</em><b>На смене в этот день</b></span></button>)}</div> : <EmptyState text="На эту дату нет мастеров, которые выполняют выбранную услугу." action="Выбрать другой день" onClick={() => setStep(3)} /> : null}

          {step === 5 ? loading === "slots" ? <LoadingState text="Ищем свободные окна" /> : availability?.availableSlots.length ? <><p className="slot-caption">Рабочее время мастера: {availability.workingHours.start}–{availability.workingHours.end}</p><div className="time-grid">{availability.availableSlots.map((slot) => <button className={selectedTime === slot ? "is-selected" : ""} type="button" key={slot} onClick={() => { setSelectedTime(slot); setStep(6); }}>{slot}</button>)}</div></> : <EmptyState text="У мастера нет свободных окон на эту дату." action="Выбрать другого мастера" onClick={() => setStep(4)} /> : null}

          {step === 6 ? <div className="booking-confirm"><div className="confirm-grid"><SummaryItem label="Имя" value={name} /><SummaryItem label="Телефон" value={phone} /><SummaryItem label="Услуга" value={selectedService?.title ?? "—"} /><SummaryItem label="Мастер" value={selectedMaster?.name ?? "—"} /><SummaryItem label="Дата" value={formatDate(selectedDate)} /><SummaryItem label="Время" value={selectedTime} /><SummaryItem label="Стоимость" value={selectedService?.priceLabel ?? "—"} /><SummaryItem label="Длительность" value={selectedService?.durationLabel ?? "—"} /></div><label>Комментарий<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Пожелания к визиту" rows={3} /></label><button className="button button-primary" type="button" disabled={loading === "submit"} onClick={submitAppointment}>{loading === "submit" ? "Создаём запись..." : "Подтвердить запись"}</button></div> : null}

          {step > 1 ? <button className="booking-back-step" type="button" onClick={() => { setMessage(""); setStep((current) => Math.max(1, current - 1)); }}>← Назад к предыдущему шагу</button> : null}
        </section>

        <aside className="booking-summary booking-summary-live"><span>Ваша запись</span><h2>{selectedService ? selectedService.title : "Детали визита"}</h2>{selectedService || name ? <dl><SummaryItem label="Клиент" value={name || "—"} /><SummaryItem label="Услуга" value={selectedService?.title ?? "—"} /><SummaryItem label="Дата" value={selectedDate ? formatDate(selectedDate) : "—"} /><SummaryItem label="Мастер" value={selectedMaster?.name ?? "—"} /><SummaryItem label="Время" value={selectedTime || "—"} /><SummaryItem label="Стоимость" value={selectedService?.priceLabel ?? "—"} /></dl> : <p>Заполните данные, и здесь появятся детали визита.</p>}<div className="summary-safe"><strong>Без двойной записи</strong><span>Перед сохранением сервер ещё раз проверит выбранное время.</span></div></aside>
      </div>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function LoadingState({ text }: { text: string }) { return <div className="booking-loading"><i /><strong>{text}</strong><span>Это займёт несколько секунд</span></div>; }
function EmptyState({ text, action, onClick }: { text: string; action: string; onClick: () => void }) { return <div className="booking-empty"><strong>{text}</strong><button className="button button-ghost" type="button" onClick={onClick}>{action}</button></div>; }
function BookingLoading() { return <main className="booking-page"><LoadingState text="Открываем онлайн-запись" /></main>; }
function iconSymbol(icon: string) { return ({ scissors: "✂", sparkles: "✦", heart: "♡", palette: "◉", waves: "≋", leaf: "⌁" } as Record<string, string>)[icon] ?? "✦"; }
function startOfDay(date: Date) { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy; }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); return copy; }
function changeMonth(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function canMovePrevious(month: Date) { return month > new Date(today.getFullYear(), today.getMonth(), 1); }
function canMoveNext(month: Date) { return changeMonth(month, 1) <= new Date(addDays(today, 90).getFullYear(), addDays(today, 90).getMonth(), 1); }
function formatDateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDate(value: string) { if (!value) return "—"; return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function buildCalendarDays(month: Date) { const first = new Date(month.getFullYear(), month.getMonth(), 1); const offset = (first.getDay() + 6) % 7; const start = addDays(first, -offset); return Array.from({ length: 42 }, (_, index) => { const date = addDays(start, index); return { date, key: formatDateValue(date), inCurrentMonth: date.getMonth() === month.getMonth() }; }); }
function formatPhone(value: string) { const digits = value.replace(/\D/g, "").replace(/^8/, "7").replace(/^([^7])/, "7$1").slice(0, 11); const rest = digits.startsWith("7") ? digits.slice(1) : digits; let result = "+7"; if (rest.length) result += ` ${rest.slice(0, 3)}`; if (rest.length > 3) result += ` ${rest.slice(3, 6)}`; if (rest.length > 6) result += `-${rest.slice(6, 8)}`; if (rest.length > 8) result += `-${rest.slice(8, 10)}`; return result; }
