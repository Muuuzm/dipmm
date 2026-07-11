import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ADMIN_STATUSES } from "@/lib/admin-data";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { buildSlotReservations } from "@/lib/schedule";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Требуется вход администратора." }, { status: 401 });
  }

  const { id } = await context.params;
  const appointmentId = Number(id);
  const payload = (await request.json()) as { status?: string };

  if (!Number.isInteger(appointmentId)) {
    return NextResponse.json({ error: "Некорректный ID заявки." }, { status: 400 });
  }

  if (!payload.status || !ADMIN_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Некорректный статус заявки." }, { status: 400 });
  }

  const current = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!current) {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      if (payload.status === "cancelled") {
        await tx.appointmentSlot.deleteMany({ where: { appointmentId } });
      } else if (current.status === "cancelled" && current.masterId) {
        await tx.appointmentSlot.createMany({
          data: buildSlotReservations(current.time, current.duration).map((time) => ({
            appointmentId,
            masterId: current.masterId as number,
            date: current.date,
            time
          }))
        });
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: { status: payload.status }
      });
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Время этой отмененной записи уже занято другой заявкой." },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Требуется вход администратора." }, { status: 401 });
  }

  const { id } = await context.params;
  const appointmentId = Number(id);

  if (!Number.isInteger(appointmentId)) {
    return NextResponse.json({ error: "Некорректный ID заявки." }, { status: 400 });
  }

  await prisma.appointment.delete({
    where: { id: appointmentId }
  });

  return NextResponse.json({ ok: true });
}
