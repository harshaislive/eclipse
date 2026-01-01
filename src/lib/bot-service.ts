import { prisma } from "./prisma";
import { redis } from "./redis";

const TASK_TYPES = ["decrypt", "bypass", "wiring"] as const;
const MIN_INTERVAL = 20000; // 20 seconds
const MAX_INTERVAL = 40000; // 40 seconds

interface ActiveBotMatch {
    matchId: string;
    timeoutId: NodeJS.Timeout;
}

// Track active bot matches to avoid duplicates
const activeBotMatches = new Map<string, ActiveBotMatch>();

/**
 * Start bot behavior for a specific match
 * Bots will auto-complete tasks at random intervals
 */
export async function startBotBehavior(matchId: string) {
    // Don't start if already running for this match
    if (activeBotMatches.has(matchId)) {
        console.log(`Bot behavior already active for match ${matchId}`);
        return;
    }

    console.log(`Starting bot behavior for match ${matchId}`);
    scheduleNextBotAction(matchId);
}

/**
 * Stop bot behavior for a match
 */
export function stopBotBehavior(matchId: string) {
    const active = activeBotMatches.get(matchId);
    if (active) {
        clearTimeout(active.timeoutId);
        activeBotMatches.delete(matchId);
        console.log(`Stopped bot behavior for match ${matchId}`);
    }
}

/**
 * Schedule the next bot action at a random interval
 */
function scheduleNextBotAction(matchId: string) {
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);

    const timeoutId = setTimeout(async () => {
        await executeBotAction(matchId);
        // Schedule next action if match still active
        const match = await prisma.match.findUnique({ where: { id: matchId } });
        if (match && match.status === "active") {
            scheduleNextBotAction(matchId);
        } else {
            stopBotBehavior(matchId);
        }
    }, delay);

    activeBotMatches.set(matchId, { matchId, timeoutId });
}

/**
 * Execute a bot task completion
 */
async function executeBotAction(matchId: string) {
    try {
        // Get all bot players in this match with crew role
        const botPlayers = await prisma.player.findMany({
            where: {
                matchId,
                isBot: true,
                role: "crew",
                isAlive: true,
            },
        });

        if (botPlayers.length === 0) {
            console.log(`No active bot crew members in match ${matchId}`);
            return;
        }

        // Get completed tasks for this match
        const completedTasks = await prisma.taskCompletion.findMany({
            where: { matchId },
            select: { taskType: true },
        });

        const completedTaskTypes = new Set(completedTasks.map(t => t.taskType));
        const availableTasks = TASK_TYPES.filter(t => !completedTaskTypes.has(t));

        if (availableTasks.length === 0) {
            console.log(`All tasks completed in match ${matchId}`);
            stopBotBehavior(matchId);
            return;
        }

        // Pick a random bot and a random available task
        const randomBot = botPlayers[Math.floor(Math.random() * botPlayers.length)];
        const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];

        console.log(`Bot ${randomBot.userId} completing task ${randomTask} in match ${matchId}`);

        // Calculate progress increment
        const PROGRESS_PER_TASK = 33;

        // Complete the task
        const result = await prisma.$transaction(async (tx) => {
            const completion = await tx.taskCompletion.create({
                data: {
                    matchId,
                    taskType: randomTask,
                    completedBy: randomBot.id,
                },
            });

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

        // Broadcast task completion
        await redis.publish(
            `match:${matchId}`,
            JSON.stringify({
                type: "task_completed",
                data: {
                    taskType: randomTask,
                    completedBy: randomBot.userId,
                    progress: result.match.extractionProgress,
                    totalCompleted: result.match.taskCompletions.length,
                },
            })
        );

        // Check for victory
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
            stopBotBehavior(matchId);
        }

        console.log(`Bot task completed. Progress: ${result.match.extractionProgress}%`);
    } catch (error) {
        console.error(`Error executing bot action for match ${matchId}:`, error);
    }
}
