import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await getAdminSession())) return unauthorized();
  const [salon, services, masters] = await Promise.all([
    prisma.salonSettings.findUnique({ where: { id: 1 } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.master.findMany({
      include: { shifts: true, services: true },
      orderBy: { sortOrder: "asc" }
    })
  ]);
  return NextResponse.json({ salon, services, masters });
}

export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return unauthorized();
  try {
    return await updateCatalog(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить изменения.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function updateCatalog(request: Request) {
  const payload = await request.json() as Record<string, unknown>;
  const type = readString(payload.type);

  if (type === "salon") {
    const salon = await prisma.salonSettings.update({
      where: { id: 1 },
      data: {
        name: required(payload.name, "Название"),
        subtitle: required(payload.subtitle, "Подпись"),
        tagline: required(payload.tagline, "Заголовок"),
        description: required(payload.description, "Описание"),
        phone: required(payload.phone, "Телефон"),
        email: optional(payload.email) ?? "",
        address: required(payload.address, "Адрес"),
        workingHoursStart: required(payload.workingHoursStart, "Начало работы"),
        workingHoursEnd: required(payload.workingHoursEnd, "Конец работы"),
        weekendHoursStart: required(payload.weekendHoursStart, "Начало работы в выходные"),
        weekendHoursEnd: required(payload.weekendHoursEnd, "Конец работы в выходные"),
        heroImage: required(payload.heroImage, "Главное изображение"),
        aboutImage: required(payload.aboutImage, "Изображение о студии"),
        vkUrl: optional(payload.vkUrl),
        telegramUrl: optional(payload.telegramUrl),
        whatsappUrl: optional(payload.whatsappUrl),
        mapUrl: optional(payload.mapUrl),
        latitude: optionalNumber(payload.latitude),
        longitude: optionalNumber(payload.longitude)
      }
    });
    return NextResponse.json({ salon });
  }

  if (type === "service") {
    const id = readId(payload.id);
    const service = await prisma.service.update({
      where: { id },
      data: {
        title: required(payload.title, "Название услуги"),
        description: required(payload.description, "Описание услуги"),
        icon: required(payload.icon, "Иконка"),
        price: nonNegativeInt(payload.price, "Цена"),
        duration: positiveInt(payload.duration, "Длительность"),
        isActive: Boolean(payload.isActive),
        isPopular: Boolean(payload.isPopular),
        isBookable: Boolean(payload.isBookable)
      }
    });
    return NextResponse.json({ service });
  }

  if (type === "master") {
    const id = readId(payload.id);
    const serviceIds = readNumberArray(payload.serviceIds);
    const workDays = readNumberArray(payload.workDays).filter((day) => day >= 0 && day <= 6);
    if (!serviceIds.length) throw new Error("Выберите хотя бы одну услугу мастера.");
    if (!workDays.length) throw new Error("Выберите хотя бы один рабочий день.");
    const master = await prisma.$transaction(async (tx) => {
      await tx.masterService.deleteMany({ where: { masterId: id } });
      await tx.weeklyShift.deleteMany({ where: { masterId: id } });
      const salon = await tx.salonSettings.findUnique({ where: { id: 1 } });
      await tx.masterService.createMany({ data: serviceIds.map((serviceId) => ({ masterId: id, serviceId })) });
      await tx.weeklyShift.createMany({
        data: workDays.map((dayOfWeek) => ({
          masterId: id,
          dayOfWeek,
          startTime: dayOfWeek === 0 || dayOfWeek === 6 ? salon?.weekendHoursStart ?? "11:00" : salon?.workingHoursStart ?? "11:00",
          endTime: dayOfWeek === 0 || dayOfWeek === 6 ? salon?.weekendHoursEnd ?? "18:00" : salon?.workingHoursEnd ?? "19:00"
        }))
      });
      return tx.master.update({
        where: { id },
        data: {
          name: required(payload.name, "Имя мастера"),
          role: required(payload.role, "Специализация"),
          experience: required(payload.experience, "Опыт"),
          bio: optional(payload.bio),
          image: required(payload.image, "Фото"),
          tags: required(payload.tags, "Навыки"),
          isActive: Boolean(payload.isActive)
        }
      });
    });
    return NextResponse.json({ master });
  }

  return NextResponse.json({ error: "Неизвестный тип данных." }, { status: 400 });
}

function unauthorized() { return NextResponse.json({ error: "Требуется вход администратора." }, { status: 401 }); }
function readString(value: unknown) { return typeof value === "string" ? value.trim().slice(0, 1000) : ""; }
function required(value: unknown, label: string) { const result = readString(value); if (!result) throw new Error(`${label}: заполните поле.`); return result; }
function optional(value: unknown) { return readString(value) || null; }
function readId(value: unknown) { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw new Error("Некорректный ID."); return id; }
function positiveInt(value: unknown, label: string) { const result = Number(value); if (!Number.isInteger(result) || result < 1) throw new Error(`${label}: укажите положительное число.`); return result; }
function nonNegativeInt(value: unknown, label: string) { const result = Number(value); if (!Number.isInteger(result) || result < 0) throw new Error(`${label}: укажите неотрицательное число.`); return result; }
function optionalNumber(value: unknown) { const result = Number(value); return Number.isFinite(result) ? result : null; }
function readNumberArray(value: unknown) { return Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : []; }
