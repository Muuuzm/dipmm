import { NextResponse } from "next/server";
import { getMastersForDate } from "@/lib/schedule";
import { getPublicMasters } from "@/lib/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim();
  const masters = date ? getMastersForDate(date) : getPublicMasters();

  return NextResponse.json({ masters });
}
