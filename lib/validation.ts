import { MASTERS, normalizeAppointmentCore, SERVICES } from "./validation-core";

export type AppointmentInput = {
  name: string;
  phone: string;
  service: string;
  master: string;
  date: string;
  time: string;
  duration: number;
  price?: number;
  comment?: string;
};

export function normalizeAppointment(payload: unknown): AppointmentInput {
  return normalizeAppointmentCore(payload) as AppointmentInput;
}

export { MASTERS, SERVICES };
