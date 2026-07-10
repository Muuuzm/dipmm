export const SERVICES: readonly string[];
export const MASTERS: readonly string[];
export const SERVICE_OPTIONS: readonly {
  icon: string;
  title: string;
  price: number;
  priceLabel: string;
  duration: number;
  durationLabel: string;
  description: string;
}[];
export const MASTER_OPTIONS: readonly {
  name: string;
  role: string;
  experience: string;
  workDays: readonly number[];
  workDaysLabel: string;
  tags: readonly string[];
  image: string;
}[];

export function getServiceByTitle(title: string): (typeof SERVICE_OPTIONS)[number] | undefined;
export function getMasterByName(name: string): (typeof MASTER_OPTIONS)[number] | undefined;

export function normalizeAppointmentCore(payload: unknown): {
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
