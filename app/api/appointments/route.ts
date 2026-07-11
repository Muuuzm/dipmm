import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPublicToken, getBookingContext } from "@/lib/public-data";
import { buildSlotReservations, isSlotAvailable } from "@/lib/schedule";
import { isDateWithinBookingWindow, normalizeAppointmentRequest } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = normalizeAppointmentRequest(payload);

    if (!isDateWithinBookingWindow(input.date)) {
      return NextResponse.json(
        { error: "Запись доступна на ближайшие 90 дней." },
        { status: 400 }
      );
    }

    const service = await prisma.service.findFirst({
      where: {
        isActive: true,
        isBookable: true,
        OR: [{ title: input.service }, { slug: input.service }]
      }
    });
    if (!service) {
      return NextResponse.json({ error: "Выбранная услуга недоступна." }, { status: 400 });
    }

    const master = await prisma.master.findFirst({
      where: {
        isActive: true,
        name: input.master,
        services: { some: { serviceId: service.id } }
      }
    });
    if (!master) {
      return NextResponse.json(
        { error: "Выбранный мастер не оказывает эту услугу." },
        { status: 400 }
      );
    }

    const context = await getBookingContext({
      serviceName: service.title,
      masterName: master.name,
      date: input.date
    });
    if (!context) {
      return NextResponse.json(
        { error: "Выбранный мастер не работает в эту дату." },
        { status: 400 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: { date: input.date, masterId: master.id, status: { not: "cancelled" } },
      select: { time: true, duration: true }
    });
    const available = isSlotAvailable({
      date: input.date,
      time: input.time,
      duration: service.duration,
      appointments,
      blockedPeriods: context.blockedPeriods,
      workingHours: context.workingHours
    });

    if (!available) return slotConflict();

    const created = await prisma.appointment.create({
      data: {
        ...input,
        service: service.title,
        master: master.name,
        duration: service.duration,
        price: service.price,
        publicToken: createPublicToken(),
        serviceId: service.id,
        masterId: master.id,
        slots: {
          create: buildSlotReservations(input.time, service.duration).map((time) => ({
            masterId: master.id,
            date: input.date,
            time
          }))
        }
      },
      select: { id: true, publicToken: true }
    });

    return NextResponse.json(
      {
        message: "Заявка успешно отправлена. Администратор свяжется с вами.",
        id: created.id,
        appointment: created
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return slotConflict();
    }
    const message = error instanceof Error ? error.message : "Не удалось отправить заявку.";
    return NextResponse.json({ error: message, message }, { status: 400 });
  }
}

function slotConflict() {
  return NextResponse.json(
    { error: "Выбранное время уже занято", message: "Выбранное время уже занято" },
    { status: 409 }
  );
}
