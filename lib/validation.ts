import { normalizeAppointmentRequestCore } from "./validation-core";

export type AppointmentRequest = {
  name: string;
  phone: string;
  service: string;
  master: string;
  date: string;
  time: string;
  comment?: string;
};

export function normalizeAppointmentRequest(payload: unknown): AppointmentRequest {
  return normalizeAppointmentRequestCore(payload);
}

export function isDateWithinBookingWindow(date: string, now = new Date()) {
  const selected = new Date(`${date}T12:00:00`);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 90);
  return !Number.isNaN(selected.getTime()) && selected >= start && selected <= end;
}
