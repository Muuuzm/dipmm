import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAppointmentCore } from "../lib/validation-core.js";

const validPayload = {
  name: "Иван",
  phone: "+7 900 000-00-00",
  service: "Мужская стрижка",
  master: "Илья Соколов",
  date: "2026-07-10",
  time: "12:30",
  comment: "Без комментариев"
};

test("accepts valid appointment data", () => {
  assert.deepEqual(normalizeAppointmentCore(validPayload), {
    ...validPayload,
    duration: 40,
    price: 900
  });
});

test("rejects empty required fields", () => {
  assert.throws(
    () => normalizeAppointmentCore({ ...validPayload, phone: "" }),
    /Заполните все обязательные поля/
  );
});

test("rejects unknown services", () => {
  assert.throws(
    () => normalizeAppointmentCore({ ...validPayload, service: "Маникюр" }),
    /Выберите услугу из списка/
  );
});
