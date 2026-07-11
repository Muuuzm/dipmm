import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAppointmentRequestCore } from "../lib/validation-core.js";

const validPayload = {
  name: "Иван",
  phone: "+7 900 000-00-00",
  service: "Мужская стрижка",
  master: "Илья Соколов",
  date: "2026-07-20",
  time: "12:30",
  comment: "Без комментариев"
};

test("accepts and normalizes valid appointment data", () => {
  assert.deepEqual(normalizeAppointmentRequestCore(validPayload), validPayload);
});

test("does not accept price and duration from the client", () => {
  const normalized = normalizeAppointmentRequestCore({ ...validPayload, price: 1, duration: 1 });
  assert.equal("price" in normalized, false);
  assert.equal("duration" in normalized, false);
});

test("rejects empty required fields", () => {
  assert.throws(() => normalizeAppointmentRequestCore({ ...validPayload, phone: "" }), /обязательные поля/);
});

test("rejects malformed phone, date and time", () => {
  assert.throws(() => normalizeAppointmentRequestCore({ ...validPayload, phone: "123" }), /номер телефона/);
  assert.throws(() => normalizeAppointmentRequestCore({ ...validPayload, date: "20.07.2026" }), /корректную дату/);
  assert.throws(() => normalizeAppointmentRequestCore({ ...validPayload, time: "25:00" }), /корректное время/);
});
