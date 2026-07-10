import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token || token.length < 32) {
    return NextResponse.json({ error: "Запись не найдена." }, { status: 404 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { publicToken: token },
    select: {
      service: true,
      master: true,
      date: true,
      time: true,
      price: true,
      duration: true,
      status: true,
      createdAt: true
    }
  });

  if (!appointment) {
    return NextResponse.json({ error: "Запись не найдена." }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}
