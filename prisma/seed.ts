/**
 * Optional seed — the register flow already creates a default watchlist.
 * This script is useful for local demos with a known account.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@groww.code";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo User",
      passwordHash,
      watchlists: {
        create: {
          name: "Core Holdings",
          items: {
            create: [
              { symbol: "RELIANCE" },
              { symbol: "TCS" },
              { symbol: "HDFCBANK" },
              { symbol: "INFY" },
              { symbol: "ICICIBANK" },
              { symbol: "BHARTIARTL" },
              { symbol: "SBIN" },
              { symbol: "ITC" },
            ],
          },
        },
      },
    },
  });

  console.log("Created demo user:", user.email, "/ password: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
