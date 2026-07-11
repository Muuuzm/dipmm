export type NormalizedAppointmentRequest = {
  name: string;
  phone: string;
  service: string;
  master: string;
  date: string;
  time: string;
  comment?: string;
};

export function normalizeAppointmentRequestCore(payload: unknown): NormalizedAppointmentRequest;
