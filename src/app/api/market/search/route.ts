import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/market-data";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const results = searchSymbols(q).slice(0, 15);
  return NextResponse.json({ results });
}
