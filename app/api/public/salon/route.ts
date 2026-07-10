import { NextResponse } from "next/server";
import { getSalonInfo } from "@/lib/public-data";

export async function GET() {
  return NextResponse.json(getSalonInfo());
}
