import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getQuote } from "@/lib/market-data";

type Params = { params: Promise<{ id: string }> };

async function getOwnedWatchlist(userId: string, id: string) {
  return prisma.watchlist.findFirst({
    where: { id, userId },
  });
}

const addSchema = z.object({
  symbol: z.string().min(1).max(20).transform((s) => s.toUpperCase()),
  notes: z.string().max(200).optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const watchlist = await getOwnedWatchlist(user.id, id);
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = addSchema.parse(body);

    // Validate symbol exists in our universe
    const quote = getQuote(data.symbol);
    if (!quote) {
      return NextResponse.json(
        { error: `Symbol "${data.symbol}" not found in supported universe` },
        { status: 400 }
      );
    }

    // Prevent duplicates
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_symbol: { watchlistId: id, symbol: data.symbol },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Symbol already in this watchlist" },
        { status: 409 }
      );
    }

    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: id,
        symbol: data.symbol,
        notes: data.notes,
      },
    });

    return NextResponse.json({ item, quote }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to add symbol" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const watchlist = await getOwnedWatchlist(user.id, id);
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "symbol query param required" }, { status: 400 });
  }

  await prisma.watchlistItem.deleteMany({
    where: { watchlistId: id, symbol },
  });

  return NextResponse.json({ ok: true });
}
