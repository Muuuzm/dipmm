export const WORKING_HOURS = {
  start: "11:00",
  end: "19:00"
};

export type ExistingAppointment = {
  time: string;
  duration: number;
};

export function buildAvailability(params: {
  date: string;
  master: string;
  duration: number;
  appointments: ExistingAppointment[];
  blockedPeriods?: ExistingAppointment[];
  workingHours?: { start: string; end: string };
  now?: Date;
}) {
  const duration = Math.max(1, Math.round(params.duration));
  const workingHours = params.workingHours ?? WORKING_HOURS;
  const blocks = [...params.appointments, ...(params.blockedPeriods ?? [])];
  const allSlots = buildCandidateSlots(duration, workingHours);
  const busySlots = buildBusySlots(blocks);
  const now = params.now ?? new Date();

  const availableSlots = allSlots.filter((slot) => {
    if (isPastSlot(params.date, slot, now)) {
      return false;
    }

    return !doesSlotOverlap(slot, duration, blocks);
  });

  return {
    date: params.date,
    master: params.master,
    workingHours,
    busySlots,
    availableSlots
  };
}

export function isSlotAvailable(params: {
  date: string;
  time: string;
  duration: number;
  appointments: ExistingAppointment[];
  blockedPeriods?: ExistingAppointment[];
  workingHours?: { start: string; end: string };
  now?: Date;
}) {
  const start = timeToMinutes(params.time);
  const end = start + params.duration;
  const workingHours = params.workingHours ?? WORKING_HOURS;
  const dayStart = timeToMinutes(workingHours.start);
  const dayEnd = timeToMinutes(workingHours.end);

  if (start < dayStart || end > dayEnd) {
    return false;
  }

  if (start % 30 !== 0) {
    return false;
  }

  if (isPastSlot(params.date, params.time, params.now ?? new Date())) {
    return false;
  }

  return !doesSlotOverlap(params.time, params.duration, [
    ...params.appointments,
    ...(params.blockedPeriods ?? [])
  ]);
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

export function buildSlotReservations(time: string, duration: number) {
  const start = timeToMinutes(time);
  const count = Math.ceil(Math.max(30, duration) / 30);

  return Array.from({ length: count }, (_, index) => minutesToTime(start + index * 30));
}

function buildCandidateSlots(
  duration: number,
  workingHours: { start: string; end: string }
) {
  const slots: string[] = [];
  const start = timeToMinutes(workingHours.start);
  const end = timeToMinutes(workingHours.end);

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

export function getDayOfWeek(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.getDay();
}
