import { NextResponse } from "next/server";
import { getPublicServices } from "@/lib/public-data";

export async function GET() {
  return NextResponse.json({ services: getPublicServices() });
}
