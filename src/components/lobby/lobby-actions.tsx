"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/use-gamestate";
import { useSound } from "@/hooks/use-sound";

interface LobbyActionsProps {
    matchId: string;
    players: any[]; // Initial players
}

export function LobbyActions({ matchId, players: initialPlayers }: LobbyActionsProps) {
    const { players } = useGameState(matchId, initialPlayers);
    const [loading, setLoading] = useState(false);
    const { play } = useSound();

    // We get userId from localstorage to send to start api (though strictly not needed if we trust any client to start)
    // API requires userId just for logging or validation if we add it later.
    const handleStart = async () => {
        play("click");
        setLoading(true);
        const userId = localStorage.getItem("eclipse_user_id");
        try {
            const res = await fetch("/api/match/start", {
                method: "POST",
                body: JSON.stringify({ matchId, userId })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error);
                setLoading(false);
            }
            // If success, the SSE 'game_start' event will redirect us (handled in useGameState)
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-4">
            {players.length < 4 && (
                <div className="text-center p-4 border border-yellow-500/20 bg-yellow-500/5 rounded text-yellow-500 text-xs animate-pulse">
                    WARNING: 4 Agents required to initialize sequence. ({players.length}/4)
                </div>
            )}

            <button
                onClick={handleStart}
                disabled={players.length < 4 || loading}
                className="w-full bg-cyan text-black py-4 rounded font-bold tracking-widest disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-[0_0_20px_cyan] transition-all"
            >
                {loading ? "INITIALIZING..." : "START OPERATION"}
            </button>
        </div>
    );
}
