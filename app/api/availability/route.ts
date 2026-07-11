import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAvailability, WORKING_HOURS } from "@/lib/schedule";
import { getBookingContext } from "@/lib/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim() ?? "";
  const master = searchParams.get("master")?.trim() ?? "";
  const serviceIdentifier = searchParams.get("service")?.trim() ?? "";
  const legacyDuration = Number(searchParams.get("duration") ?? 0);

  if (!date || !master || (!serviceIdentifier && !Number.isFinite(legacyDuration))) {
    return NextResponse.json(
      { error: "Передайте дату, мастера и услугу." },
      { status: 400 }
    );
  }

  const service = await prisma.service.findFirst({
    where: serviceIdentifier
      ? { isActive: true, isBookable: true, OR: [{ slug: serviceIdentifier }, { title: serviceIdentifier }] }
      : { isActive: true, isBookable: true, duration: legacyDuration }
  });

  if (!service) {
    return NextResponse.json({ error: "Услуга не найдена или недоступна." }, { status: 400 });
  }

  const context = await getBookingContext({
    serviceName: service.title,
    masterName: master,
    date
  });

  if (!context) {
    return NextResponse.json({
      date,
      master,
      service: service.title,
      workingHours: WORKING_HOURS,
      busySlots: [],
      availableSlots: []
    });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      masterId: context.master.id,
      status: { not: "cancelled" }
    },
    select: { time: true, duration: true }
  });

  return NextResponse.json({
    ...buildAvailability({
      date,
      master,
      duration: service.duration,
      appointments,
      blockedPeriods: context.blockedPeriods,
      workingHours: context.workingHours
    }),
    service: service.title
  });
}
