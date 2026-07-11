import { NextResponse } from "next/server";
import { getPublicMasters } from "@/lib/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim();
  const service = searchParams.get("service")?.trim();
  const masters = await getPublicMasters({ date, service });

  return NextResponse.json({ masters });
}
