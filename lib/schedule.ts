import { getMasterByName, MASTER_OPTIONS } from "./validation-core";

export const WORKING_HOURS = {
  start: "09:00",
  end: "21:00"
};

export type ExistingAppointment = {
  time: string;
  duration: number;
};

export function getMastersForDate(date: string) {
  const day = getDayOfWeek(date);
  if (day === undefined) {
    return [];
  }

  return MASTER_OPTIONS.filter((master) => master.workDays.includes(day));
}

export function isMasterWorkingOnDate(masterName: string, date: string) {
  const master = getMasterByName(masterName);
  const day = getDayOfWeek(date);

  return Boolean(master && day !== undefined && master.workDays.includes(day));
}

export function buildAvailability(params: {
  date: string;
  master: string;
  duration: number;
  appointments: ExistingAppointment[];
  now?: Date;
}) {
  const duration = Math.max(1, Math.round(params.duration));
  const allSlots = buildCandidateSlots(duration);
  const busySlots = buildBusySlots(params.appointments);
  const now = params.now ?? new Date();

  const availableSlots = allSlots.filter((slot) => {
    if (isPastSlot(params.date, slot, now)) {
      return false;
    }

    return !doesSlotOverlap(slot, duration, params.appointments);
  });

  return {
    date: params.date,
    master: params.master,
    workingHours: WORKING_HOURS,
    busySlots,
    availableSlots
  };
}

export function isSlotAvailable(params: {
  date: string;
  time: string;
  duration: number;
  appointments: ExistingAppointment[];
  now?: Date;
}) {
  const start = timeToMinutes(params.time);
  const end = start + params.duration;
  const dayStart = timeToMinutes(WORKING_HOURS.start);
  const dayEnd = timeToMinutes(WORKING_HOURS.end);

  if (start < dayStart || end > dayEnd) {
    return false;
  }

  if (start % 30 !== 0) {
    return false;
  }

  if (isPastSlot(params.date, params.time, params.now ?? new Date())) {
    return false;
  }

  return !doesSlotOverlap(params.time, params.duration, params.appointments);
}

export function buildBusySlots(appointments: ExistingAppointment[]) {
  const slots = new Set<string>();

  appointments.forEach((appointment) => {
    const start = timeToMinutes(appointment.time);
    const duration = Math.max(30, appointment.duration || 30);
    const roundedDuration = Math.ceil(duration / 30) * 30;

    for (let offset = 0; offset < roundedDuration; offset += 30) {
      slots.add(minutesToTime(start + offset));
    }
  });

  return Array.from(slots).sort();
}

export function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildCandidateSlots(duration: number) {
  const slots: string[] = [];
  const start = timeToMinutes(WORKING_HOURS.start);
  const end = timeToMinutes(WORKING_HOURS.end);

  for (let minutes = start; minutes + duration <= end; minutes += 30) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

function doesSlotOverlap(
  time: string,
  duration: number,
  appointments: ExistingAppointment[]
) {
  const start = timeToMinutes(time);
  const end = start + duration;

  return appointments.some((appointment) => {
    const busyStart = timeToMinutes(appointment.time);
    const busyEnd = busyStart + Math.max(30, appointment.duration || 30);

    return start < busyEnd && end > busyStart;
  });
}

function isPastSlot(date: string, time: string, now: Date) {
  const slotDate = new Date(`${date}T${time}:00`);

  return Number.isNaN(slotDate.getTime()) || slotDate.getTime() <= now.getTime();
}

function getDayOfWeek(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.getDay();
}
