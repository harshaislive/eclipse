import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const matchId = searchParams.get("matchId");

    if (!userId || !matchId) return new NextResponse("Missing params", { status: 400 });

    const player = await prisma.player.findUnique({
        where: {
            matchId_userId: {
                matchId,
                userId
            }
        }
    });

    if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(player);
}
