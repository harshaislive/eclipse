import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis"; // Prepare for future use

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { gameMode } = await req.json();

        // Generate a random 4-digit numeric code
        let encryptionKey = "";
        let isUnique = false;

        // Retry just in case of collision
        while (!isUnique) {
            encryptionKey = Math.floor(1000 + Math.random() * 9000).toString();
            const existing = await prisma.match.findUnique({
                where: { encryptionKey },
            });
            if (!existing) isUnique = true;
        }

        // Create the match
        // NOTE: In a real auth scenario, we would get sender ID from session
        // For now, we return the match, and the client "joins" immediately as host
        // Create the match with game mode
        const match = await prisma.match.create({
            data: {
                encryptionKey,
                status: "lobby",
                gameMode: gameMode || "humans",
            },
        });

        // If bot mode, create 3 bot players
        if (gameMode === "bots") {
            const botNames = ["AGENT-001", "AGENT-002", "AGENT-003"];
            await Promise.all(
                botNames.map((name) =>
                    prisma.player.create({
                        data: {
                            matchId: match.id,
                            userId: name,
                            isBot: true,
                        },
                    })
                )
            );
        }

        return NextResponse.json({ matchId: match.id, encryptionKey, gameMode: match.gameMode });
    } catch (error) {
        console.error("Error creating match:", error);
        return NextResponse.json(
            { error: "Failed to initialize protocol" },
            { status: 500 }
        );
    }
}
