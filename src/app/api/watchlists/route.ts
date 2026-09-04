import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getQuotes } from "@/lib/market-data";
import { analyzeWatchlist } from "@/lib/change-detection";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Enrich with quick market summary
  const enriched = await Promise.all(
    watchlists.map(async (wl) => {
      const symbols = wl.items.map((i) => i.symbol);
      const quotes = getQuotes(symbols);
      const analysis = analyzeWatchlist(quotes, wl.lastViewedAt);
      return {
        id: wl.id,
        name: wl.name,
        itemCount: wl._count.items,
        lastViewedAt: wl.lastViewedAt,
        createdAt: wl.createdAt,
        needingAttention: analysis.summary.needingAttention,
        biggestMover: analysis.summary.biggestMover,
      };
    })
  );

  return NextResponse.json({ watchlists: enriched });
}

const createSchema = z.object({
  name: z.string().min(1).max(60),
});

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const watchlist = await prisma.watchlist.create({
      data: {
        name: data.name,
        userId: user.id,
      },
    });

    return NextResponse.json({ watchlist }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create watchlist" },
      { status: 500 }
    );
  }
}
