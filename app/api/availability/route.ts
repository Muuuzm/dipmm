import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAvailability, isMasterWorkingOnDate } from "@/lib/schedule";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim() ?? "";
  const master = searchParams.get("master")?.trim() ?? "";
  const duration = Number(searchParams.get("duration") ?? 30);

  if (!date || !master || !Number.isFinite(duration) || duration < 1) {
    return NextResponse.json(
      { error: "Передайте дату, мастера и длительность услуги." },
      { status: 400 }
    );
  }

  if (!isMasterWorkingOnDate(master, date)) {
    return NextResponse.json({
      date,
      master,
      workingHours: { start: "09:00", end: "21:00" },
      busySlots: [],
      availableSlots: []
    });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      master,
      status: { not: "cancelled" }
    },
    select: {
      time: true,
      duration: true
    }
  });

  return NextResponse.json(
    buildAvailability({
      date,
      master,
      duration,
      appointments
    })
  );
}
