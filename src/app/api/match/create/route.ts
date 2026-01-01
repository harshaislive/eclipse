import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis"; // Prepare for future use

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
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
        const match = await prisma.match.create({
            data: {
                encryptionKey,
                status: "lobby",
            },
        });

        return NextResponse.json({ matchId: match.id, encryptionKey });
    } catch (error) {
        console.error("Error creating match:", error);
        return NextResponse.json(
            { error: "Failed to initialize protocol" },
            { status: 500 }
        );
    }
}
