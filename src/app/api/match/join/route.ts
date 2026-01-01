import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { encryptionKey, userId, skinId } = await req.json();

        if (!encryptionKey || !userId) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // 1. Find the match
        const match = await prisma.match.findUnique({
            where: { encryptionKey },
            include: { players: true },
        });

        if (!match) {
            return NextResponse.json(
                { error: "Protocol not found (Invalid Code)" },
                { status: 404 }
            );
        }

        if (match.status !== "lobby") {
            return NextResponse.json(
                { error: "Protocol locked (Game in progress)" },
                { status: 403 }
            );
        }

        if (match.players.length >= 4) {
            return NextResponse.json(
                { error: "Protocol capacity reached" },
                { status: 409 }
            );
        }

        // 2. Check if user already in match
        const existingPlayer = match.players.find((p) => p.userId === userId);

        // If player exists, just return success (re-join)
        if (existingPlayer) {
            return NextResponse.json({
                matchId: match.id,
                playerId: existingPlayer.id,
                status: "rejoined"
            });
        }

        // 3. Add new player
        const newPlayer = await prisma.player.create({
            data: {
                matchId: match.id,
                userId: userId,
                skinId: skinId || "fixer", // Default skin
                role: null, // Assigned later
            },
        });

        // Notify others via Redis
        const event = {
            type: "player_joined",
            payload: newPlayer
        };
        // Use dynamic import to avoid cold start issues if Redis isn't immediately needed elsewhere
        await import("@/lib/redis").then(r => r.redis.publish(`match:${match.id}`, JSON.stringify(event)));

        return NextResponse.json({
            matchId: match.id,
            playerId: newPlayer.id,
            status: "joined"
        });

    } catch (error) {
        console.error("Error joining match:", error);
        return NextResponse.json(
            { error: "Connection refused" },
            { status: 500 }
        );
    }
}
