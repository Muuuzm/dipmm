import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPublicToken } from "@/lib/public-data";
import { isMasterWorkingOnDate, isSlotAvailable } from "@/lib/schedule";
import { normalizeAppointment } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const appointment = normalizeAppointment(payload);

    if (!isMasterWorkingOnDate(appointment.master, appointment.date)) {
      return NextResponse.json(
        {
          error: "Выбранный мастер не работает в эту дату",
          message: "Выбранный мастер не работает в эту дату"
        },
        { status: 400 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        date: appointment.date,
        master: appointment.master,
        status: { not: "cancelled" }
      },
      select: {
        time: true,
        duration: true
      }
    });

    const available = isSlotAvailable({
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      appointments
    });

    if (!available) {
      return NextResponse.json(
        {
          error: "Выбранное время уже занято",
          message: "Выбранное время уже занято"
        },
        { status: 409 }
      );
    }

    const created = await createAppointmentWithPublicToken(appointment);

    return NextResponse.json(
      {
        message: "Заявка успешно отправлена. Администратор свяжется с вами.",
        id: created.id,
        appointment: {
          id: created.id,
          publicToken: created.publicToken
        }
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось отправить заявку.";

    return NextResponse.json({ error: message, message }, { status: 400 });
  }
}

async function createAppointmentWithPublicToken(
  appointment: ReturnType<typeof normalizeAppointment>
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.appointment.create({
        data: {
          ...appointment,
          publicToken: createPublicToken()
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("Unique constraint")) {
        throw error;
      }
    }
  }

  throw new Error("Не удалось создать безопасный токен записи.");
}
