import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GameEvent =
    | { type: "player_joined"; payload: any }
    | { type: "game_start"; payload: any };

export function useGameState(matchId: string, initialPlayers: any[]) {
    const [players, setPlayers] = useState(initialPlayers);
    const router = useRouter();

    useEffect(() => {
        // Connect to SSE
        const eventSource = new EventSource(`/api/stream?matchId=${matchId}`);

        console.log("SSE connected for match:", matchId);

        eventSource.onmessage = (e) => {
            console.log("SSE message received:", e.data);
            try {
                const event: GameEvent = JSON.parse(e.data);
                console.log("Parsed SSE event:", event);

                if (event.type === "player_joined") {
                    setPlayers((prev) => {
                        // Avoid duplicates
                        if (prev.find(p => p.id === event.payload.id)) return prev;
                        return [...prev, event.payload];
                    });
                } else if (event.type === "game_start") {
                    console.log("Game start event received! Redirecting to /game/" + matchId);
                    // Redirect to active game page
                    router.push(`/game/${matchId}`);
                }
            } catch (err) {
                console.error("Failed to parse SSE message", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE error:", err);
        };

        return () => {
            console.log("SSE disconnected for match:", matchId);
            eventSource.close();
        };
    }, [matchId, router]);

    return { players };
}
