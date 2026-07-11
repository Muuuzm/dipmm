import { Prisma } from "@prisma/client";

export const STATUS_LABELS = {
  new: "Новая",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Выполнена"
} as const;

export const ADMIN_STATUSES = Object.keys(STATUS_LABELS);

export type AppointmentFilters = {
  search?: string;
  from?: string;
  to?: string;
  master?: string;
  service?: string;
  status?: string;
};

export function parseAppointmentFilters(searchParams: URLSearchParams): AppointmentFilters {
  return {
    search: clean(searchParams.get("search")),
    from: clean(searchParams.get("from")),
    to: clean(searchParams.get("to")),
    master: clean(searchParams.get("master")),
    service: clean(searchParams.get("service")),
    status: clean(searchParams.get("status"))
  };
}

export function buildAppointmentWhere(filters: AppointmentFilters): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { phone: { contains: filters.search } }
    ];
  }

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {})
    };
  }

  if (filters.master) {
    where.master = filters.master;
  }

  if (filters.service) {
    where.service = filters.service;
  }

  if (filters.status && ADMIN_STATUSES.includes(filters.status)) {
    where.status = filters.status;
  }

  return where;
}

export function getTodayValue(now = new Date()) {
  return toDateValue(now);
}

export function getWeekStart(now = new Date()) {
  const date = new Date(now);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);

  return toDateValue(date);
}

export function getWeekEnd(now = new Date()) {
  const date = new Date(now);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() + (6 - day));
  return toDateValue(date);
}

export function getMonthStart(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getMonthEnd(now = new Date()) {
  return toDateValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

export function formatCurrency(value: number | null | undefined) {
  if (!value) {
    return "0 ₽";
  }

  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function clean(value: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
