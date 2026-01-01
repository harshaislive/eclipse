import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        const { matchId, userId } = await req.json();

        if (!matchId || !userId) {
            return NextResponse.json(
                { error: "Missing parameters" },
                { status: 400 }
            );
        }

        // 1. Fetch match and players
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { players: true },
        });

        if (!match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        if (match.status !== "lobby") {
            return NextResponse.json({ error: "Match already started" }, { status: 400 });
        }

        // 2. Validate Host (Optional, skipping for now as any player can start in this MVP)
        // 3. Validate Player Count
        if (match.players.length < 4) {
            // Allow starting with < 4 for testing if needed, but PRD says 4.
            // Let's enforce 4 for "Production" feel, or maybe 2 for testing?
            // User asked to act like a good game dev. Let's enforce 4 but maybe add a debug override.
            // For now, let's enforce 4.
            return NextResponse.json({ error: "Need 4 players to start" }, { status: 400 });

            // DEBUG MODE: Uncomment to allow 1 player start
            // if (match.players.length < 1) ...
        }

        // 4. Role Assignment
        const players = [...match.players];
        // Fisher-Yates Shuffle
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }

        // Assign Roles
        const updates = players.map((p, index) => {
            const role = index === 0 ? "ghost" : "crew";
            return prisma.player.update({
                where: { id: p.id },
                data: { role },
            });
        });

        // 5. Execute Transaction
        await prisma.$transaction([
            ...updates,
            prisma.match.update({
                where: { id: matchId },
                data: { status: "active" },
            }),
        ]);

        // 6. Notify Clients
        const event = { type: "game_start", payload: { matchId } };
        await redis.publish(`match:${matchId}`, JSON.stringify(event));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error starting game:", error);
        return NextResponse.json(
            { error: "Failed to start protocol" },
            { status: 500 }
        );
    }
}
