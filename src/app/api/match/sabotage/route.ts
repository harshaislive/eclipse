import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        const { matchId, userId, type } = await req.json();

        if (!matchId || !userId || !type) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 1. Validate Player is Ghost
        const player = await prisma.player.findUnique({
            where: { id: userId }, // Actually we receive ID or userId? Let's assume userId is passed as search param usually, but here we likely pass the DB UUID if we have it?
            // Wait, previous code uses userId (uuid) to query.
            // Let's check: in game-terminal we send `userId` which is from localStorage. 
            // In Prisma schema, `userId` is the string generic ID, `id` is the uuid.
            // Let's support looking up by our custom userId string.
        });

        // Actually, let's look up by the matchId + userId combination to be safe?
        // Let's just use findFirst with matchId and userId (string)
        const ghost = await prisma.player.findFirst({
            where: {
                matchId,
                userId: userId,
                role: "ghost",
            }
        });

        if (!ghost) {
            return NextResponse.json({ error: "Unauthorized: Only Ghost can sabotage" }, { status: 403 });
        }

        // 2. Apply Sabotage Effect
        let eventPayload: any = { type: "sabotage", effect: type };

        if (type === "glitch") {
            // Reduce progress by 15%
            const match = await prisma.match.findUnique({ where: { id: matchId } });
            if (match) {
                const newProgress = Math.max(0, match.extractionProgress - 15);
                await prisma.match.update({
                    where: { id: matchId },
                    data: { extractionProgress: newProgress }
                });
                eventPayload.progress = newProgress;
            }
        } else if (type === "lockdown") {
            // Just broadcast event, client handles disabling
            eventPayload.duration = 10000; // 10 seconds
        }

        // 3. Broadcast Event
        await redis.publish(`match:${matchId}`, JSON.stringify({
            type: "sabotage",
            payload: eventPayload
        }));

        return NextResponse.json({ success: true, type });

    } catch (error) {
        console.error("Sabotage error:", error);
        return NextResponse.json({ error: "Sabotage failed" }, { status: 500 });
    }
}
