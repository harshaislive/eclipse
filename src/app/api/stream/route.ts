import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
        return new NextResponse("Missing matchId", { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            console.log(`[SSE] Starting stream for match: ${matchId}`);

            // Subscribe to Redis channel specifically for this request
            // We need a NEW Redis connection for subscription because calling .subscribe() 
            // puts the client into subscriber mode where it can't execute other commands.
            // However, io-redis handles this if we use a duplicate, or we can just use the global one 
            // if we are careful. Best practice for SSE + Redis is a dedicated sub client.
            // For simplicity in this serverless-like env (Next.js), we'll assume a new connection 
            // or duplicate is acceptable.

            const subRedis = redis.duplicate();

            console.log(`[SSE] Subscribing to channel: match:${matchId}`);
            await subRedis.subscribe(`match:${matchId}`);
            console.log(`[SSE] Successfully subscribed to match:${matchId}`);

            subRedis.on("message", (channel, message) => {
                console.log(`[SSE] Message received on ${channel}:`, message);
                const data = `data: ${message}\n\n`;
                controller.enqueue(encoder.encode(data));
            });

            subRedis.on("error", (err) => {
                console.error(`[SSE] Redis error:`, err);
            });

            // Heartbeat to keep connection alive
            const interval = setInterval(() => {
                controller.enqueue(encoder.encode(": heartbeat\n\n"));
            }, 15000);

            req.signal.addEventListener("abort", () => {
                console.log(`[SSE] Client disconnected from match: ${matchId}`);
                clearInterval(interval);
                subRedis.unsubscribe();
                subRedis.quit();
            });
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
