import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getQuotes } from "@/lib/market-data";
import { analyzeWatchlist } from "@/lib/change-detection";

type Params = { params: Promise<{ id: string }> };

async function getOwnedWatchlist(userId: string, id: string) {
  return prisma.watchlist.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { addedAt: "asc" } } },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const watchlist = await getOwnedWatchlist(user.id, id);
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const symbols = watchlist.items.map((i) => i.symbol);
  const quotes = getQuotes(symbols);
  const analysis = analyzeWatchlist(quotes, watchlist.lastViewedAt);

  // Mark as viewed (this is the "return later and see what changed" mechanism)
  await prisma.watchlist.update({
    where: { id },
    data: { lastViewedAt: new Date() },
  });

  return NextResponse.json({
    watchlist: {
      id: watchlist.id,
      name: watchlist.name,
      lastViewedAt: watchlist.lastViewedAt,
      createdAt: watchlist.createdAt,
      items: watchlist.items,
    },
    analysis,
  });
}

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedWatchlist(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const watchlist = await prisma.watchlist.update({
      where: { id },
      data: { name: data.name },
    });

    return NextResponse.json({ watchlist });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedWatchlist(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  await prisma.watchlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
