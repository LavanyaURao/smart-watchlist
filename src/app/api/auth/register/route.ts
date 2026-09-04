import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name || data.email.split("@")[0],
        passwordHash,
      },
    });

    // Create a default watchlist so the user is not dropped into emptiness
    await prisma.watchlist.create({
      data: {
        name: "My Watchlist",
        userId: user.id,
        items: {
          create: [
            { symbol: "RELIANCE" },
            { symbol: "TCS" },
            { symbol: "HDFCBANK" },
            { symbol: "INFY" },
          ],
        },
      },
    });

    const token = await createToken(user.id, user.email);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
