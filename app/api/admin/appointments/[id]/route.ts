import { NextResponse } from "next/server";
import { ADMIN_STATUSES } from "@/lib/admin-data";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: payload.status }
  });

  return NextResponse.json({ appointment });
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
