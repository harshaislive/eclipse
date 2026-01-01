import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { matchId, userId, taskType } = await req.json();

        if (!matchId || !userId || !taskType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. Get player to verify they are Crew (Ghost can't complete tasks)
        const player = await prisma.player.findFirst({
            where: { matchId, userId },
        });

        if (!player) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        if (player.role === "ghost") {
            return NextResponse.json(
                { error: "Ghost cannot complete tasks" },
                { status: 403 }
            );
        }

        // 2. Check if task already completed
        const existing = await prisma.taskCompletion.findFirst({
            where: { matchId, taskType },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Task already completed" },
                { status: 409 }
            );
        }

        // 3. Create task completion and update match progress
        const PROGRESS_PER_TASK = 33; // 3 tasks = 99%, close enough to 100%

        const result = await prisma.$transaction(async (tx) => {
            // Record completion
            const completion = await tx.taskCompletion.create({
                data: {
                    matchId,
                    taskType,
                    completedBy: player.id,
                },
            });

            // Update match progress
            const match = await tx.match.update({
                where: { id: matchId },
                data: {
                    extractionProgress: {
                        increment: PROGRESS_PER_TASK,
                    },
                },
                include: {
                    taskCompletions: true,
                },
            });

            return { completion, match };
        });

        // 4. Broadcast task completion
        await redis.publish(
            `match:${matchId}`,
            JSON.stringify({
                type: "task_completed",
                data: {
                    taskType,
                    completedBy: player.userId,
                    progress: result.match.extractionProgress,
                    totalCompleted: result.match.taskCompletions.length,
                },
            })
        );

        // 5. Check for Crew victory
        if (result.match.extractionProgress >= 100) {
            await redis.publish(
                `match:${matchId}`,
                JSON.stringify({
                    type: "crew_victory",
                    data: {
                        reason: "All tasks completed",
                    },
                })
            );
        }

        return NextResponse.json({
            success: true,
            progress: result.match.extractionProgress,
            totalCompleted: result.match.taskCompletions.length,
        });
    } catch (error) {
        console.error("Error completing task:", error);
        return NextResponse.json(
            { error: "Failed to complete task" },
            { status: 500 }
        );
    }
}
