import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { startBotBehavior } from "@/lib/bot-service";

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

        // 2. Validate Player Count
        // For bot matches, allow any count (bots auto-fill)
        // For human matches, require 4 players
        if (match.gameMode === "humans" && match.players.length < 4) {
            return NextResponse.json({ error: "Need 4 players to start" }, { status: 400 });
        }

        // 3. Role Assignment
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

        // 4. Execute Transaction
        await prisma.$transaction([
            ...updates,
            prisma.match.update({
                where: { id: matchId },
                data: { status: "active" },
            }),
        ]);

        // 5. Start bot behavior if this is a bot match
        if (match.gameMode === "bots") {
            startBotBehavior(matchId);
        }

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
