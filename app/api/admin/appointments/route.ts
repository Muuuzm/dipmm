import { NextResponse } from "next/server";
import { buildAppointmentWhere, parseAppointmentFilters } from "@/lib/admin-data";
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

  return NextResponse.json({ appointments });
}
