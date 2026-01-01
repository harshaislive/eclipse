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

        eventSource.onmessage = (e) => {
            try {
                const event: GameEvent = JSON.parse(e.data);

                if (event.type === "player_joined") {
                    setPlayers((prev) => {
                        // Avoid duplicates
                        if (prev.find(p => p.id === event.payload.id)) return prev;
                        return [...prev, event.payload];
                    });
                }

                // Future events: game_start, etc.
            } catch (err) {
                console.error("Failed to parse SSE message", err);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [matchId]);

    return { players };
}
