import { randomBytes } from "crypto";
import { DEFAULT_SALON } from "./catalog-defaults";
import { prisma } from "./prisma";
import { getDayOfWeek } from "./schedule";

export async function getSalonInfo() {
  const salon = await prisma.salonSettings.findUnique({ where: { id: 1 } });
  const value = salon ?? DEFAULT_SALON;

  return {
    ...value,
    workingHours: `${value.workingDaysLabel} ${value.workingHoursStart}-${value.workingHoursEnd} · ${value.weekendDaysLabel} ${value.weekendHoursStart}-${value.weekendHoursEnd}`,
    schedule: [
      { days: value.workingDaysLabel, start: value.workingHoursStart, end: value.workingHoursEnd },
      { days: value.weekendDaysLabel, start: value.weekendHoursStart, end: value.weekendHoursEnd }
    ],
    benefits: ["Мужские стрижки", "Женские услуги", "Онлайн-запись"]
  };
}

export async function getPublicServices(options: { popularOnly?: boolean; bookableOnly?: boolean } = {}) {
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      ...(options.popularOnly ? { isPopular: true } : {}),
      ...(options.bookableOnly ? { isBookable: true } : {})
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
  });

  return services.map((service) => ({
    id: service.id,
    slug: service.slug,
    icon: service.icon,
    title: service.title,
    price: service.price,
    priceLabel: service.price > 0
      ? `от ${new Intl.NumberFormat("ru-RU").format(service.price)} ₽`
      : "цена по запросу",
    duration: service.duration,
    durationLabel: `${service.duration} мин`,
    description: service.description,
    isBookable: service.isBookable
  }));
}

export async function getPublicMasters(options: { date?: string; service?: string } = {}) {
  const dayOfWeek = options.date ? getDayOfWeek(options.date) : undefined;
  if (options.date && dayOfWeek === undefined) return [];

  const masters = await prisma.master.findMany({
    where: {
      isActive: true,
      ...(options.service
        ? {
            services: {
              some: {
                service: {
                  isActive: true,
                  OR: [{ slug: options.service }, { title: options.service }]
                }
              }
            }
          }
        : {}),
      ...(dayOfWeek !== undefined
        ? { shifts: { some: { dayOfWeek, isWorking: true } } }
        : {}),
      ...(options.date
        ? {
            timeOffs: {
              none: { date: options.date, startTime: null, endTime: null }
            }
          }
        : {})
    },
    include: {
      shifts: { where: { isWorking: true }, orderBy: { dayOfWeek: "asc" } },
      services: { include: { service: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  return masters.map((master) => ({
    id: master.id,
    slug: master.slug,
    name: master.name,
    role: master.role,
    experience: master.experience,
    bio: master.bio,
    image: master.image,
    tags: splitTags(master.tags),
    workDays: master.shifts.map((shift) => shift.dayOfWeek),
    workDaysLabel: formatWorkDays(master.shifts.map((shift) => shift.dayOfWeek)),
    serviceSlugs: master.services.map((item) => item.service.slug)
  }));
}

export async function getPublicGallery() {
  return prisma.galleryItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 6
  });
}

export async function getPublicReviews() {
  return prisma.review.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 6
  });
}

export async function getBookingContext(params: {
  serviceName: string;
  masterName: string;
  date: string;
}) {
  const dayOfWeek = getDayOfWeek(params.date);
  if (dayOfWeek === undefined) return null;

  const service = await prisma.service.findFirst({
    where: { title: params.serviceName, isActive: true, isBookable: true }
  });
  if (!service) return null;

  const master = await prisma.master.findFirst({
    where: {
      name: params.masterName,
      isActive: true,
      services: { some: { serviceId: service.id } },
      shifts: { some: { dayOfWeek, isWorking: true } },
      timeOffs: { none: { date: params.date, startTime: null, endTime: null } }
    },
    include: {
      shifts: { where: { dayOfWeek, isWorking: true }, take: 1 },
      timeOffs: { where: { date: params.date } }
    }
  });
  if (!master) return null;

  const shift = master.shifts[0];
  return {
    service,
    master,
    workingHours: { start: shift.startTime, end: shift.endTime },
    blockedPeriods: master.timeOffs
      .filter((item) => item.startTime && item.endTime)
      .map((item) => ({
        time: item.startTime as string,
        duration: minutesBetween(item.startTime as string, item.endTime as string)
      }))
  };
}

export function createPublicToken() {
  return randomBytes(32).toString("hex");
}

function splitTags(tags: string) {
  return tags.split("|").map((tag) => tag.trim()).filter(Boolean);
}

function formatWorkDays(days: number[]) {
  const labels = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  return days.map((day) => labels[day]).join(", ");
}

function minutesBetween(start: string, end: string) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  return Math.max(30, toMinutes(end) - toMinutes(start));
}
