"use client";

import { useGameState } from "@/hooks/use-gamestate";

interface Player {
    id: string;
    userId: string | null;
    skinId: string | null;
    isAlive: boolean;
}

interface PlayerGridProps {
    matchId: string;
    initialPlayers: Player[];
}

export function PlayerGrid({ matchId, initialPlayers }: PlayerGridProps) {
    const { players } = useGameState(matchId, initialPlayers);
    const slots = [0, 1, 2, 3];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
            {slots.map((i) => {
                const player = players[i];
                return (
                    <div
                        key={i}
                        className={`
                            relative aspect-[3/4] border rounded-lg flex flex-col items-center justify-center p-4 transition-all
                            ${player
                                ? "border-cyan/50 bg-cyan/5 shadow-[0_0_20px_rgba(0,243,255,0.1)]"
                                : "border-slate-800 bg-black/40 border-dashed"}
                        `}
                    >
                        {player ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-cyan mb-4 blur-sm opacity-80 animate-pulse"></div>
                                <p className="text-cyan font-bold tracking-widest">AGENT {i + 1}</p>
                                <p className="text-xs text-slate-400 mt-2">{player.userId?.split('-')[0]}...</p>
                                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                            </>
                        ) : (
                            <p className="text-slate-700 text-xs animate-pulse">SEARCHING_SIGNAL...</p>
                        )}
                    </div>
                )
            })}
            {/* Pass player count up or handle start button state here if needed, 
                 but for now we just visualize. Ideally checking < 4 agents should be consistent. */}
            <div className="hidden" data-player-count={players.length}></div>
        </div>
    );
}
