import { NextResponse } from "next/server";
import {
  buildAppointmentWhere,
  parseAppointmentFilters,
  STATUS_LABELS
} from "@/lib/admin-data";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Требуется вход администратора." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseAppointmentFilters(searchParams);
  const appointments = await prisma.appointment.findMany({
    where: buildAppointmentWhere(filters),
    orderBy: [{ date: "desc" }, { time: "asc" }]
  });
  const rows = [
    [
      "ID",
      "Дата",
      "Время",
      "Клиент",
      "Телефон",
      "Услуга",
      "Мастер",
      "Стоимость",
      "Длительность",
      "Статус",
      "Создано"
    ],
    ...appointments.map((appointment) => [
      appointment.id,
      appointment.date,
      appointment.time,
      appointment.name,
      appointment.phone,
      appointment.service,
      appointment.master,
      appointment.price ?? "",
      appointment.duration,
      STATUS_LABELS[appointment.status as keyof typeof STATUS_LABELS] ?? appointment.status,
      appointment.createdAt.toISOString()
    ])
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(";")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointments-${Date.now()}.csv"`
    }
  });
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[;"\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
