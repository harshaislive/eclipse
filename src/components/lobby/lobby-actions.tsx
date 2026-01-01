"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/use-gamestate";
import { useSound } from "@/hooks/use-sound";
import { useRouter } from "next/navigation";

interface LobbyActionsProps {
    matchId: string;
    players: any[]; // Initial players
    gameMode: "bots" | "humans";
}

export function LobbyActions({ matchId, players: initialPlayers, gameMode }: LobbyActionsProps) {
    const { players } = useGameState(matchId, initialPlayers);
    const [loading, setLoading] = useState(false);
    const { play } = useSound();
    const router = useRouter();

    // We get userId from localstorage to send to start api (though strictly not needed if we trust any client to start)
    // API requires userId just for logging or validation if we add it later.
    const handleStart = async () => {
        play("click");
        setLoading(true);
        const userId = localStorage.getItem("eclipse_user_id");

        console.log("Starting game...", { matchId, userId });

        try {
            const res = await fetch("/api/match/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, userId })
            });

            const data = await res.json();
            console.log("Game start response:", data);

            if (!res.ok) {
                alert(data.error || "Failed to start game");
                setLoading(false);
            } else {
                // Success! Redirect immediately, don't wait for SSE
                // This fixes the "stuck in initializing" bug for the host
                console.log("Redirecting to game...");
                router.push(`/game/${matchId}`);
            }
        } catch (e) {
            console.error("Error starting game:", e);
            alert("Failed to start game");
            setLoading(false);
        }
    };

    const isReady = gameMode === "bots" || players.length >= 4;

    return (
        <div className="w-full max-w-md space-y-4">
            {gameMode === "humans" && players.length < 4 && (
                <div className="text-center p-4 border border-yellow-500/20 bg-yellow-500/5 rounded text-yellow-500 text-xs animate-pulse">
                    WARNING: 4 Agents required to initialize sequence. ({players.length}/4)
                </div>
            )}

            {gameMode === "bots" && (
                <div className="text-center p-4 border border-cyan/20 bg-cyan/5 rounded text-cyan text-xs">
                    ✓ Bot agents ready. Click to begin.
                </div>
            )}

            <button
                onClick={handleStart}
                disabled={!isReady || loading}
                className="w-full bg-cyan text-black py-4 rounded font-bold tracking-widest disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-[0_0_20px_cyan] transition-all"
            >
                {loading ? "INITIALIZING..." : "START OPERATION"}
            </button>
        </div>
    );
}
