import { prisma } from "@/lib/prisma";
import { PlayerGrid } from "@/components/lobby/player-grid";
import { LobbyActions } from "@/components/lobby/lobby-actions";
import { Copy } from "lucide-react";
import { redirect } from "next/navigation";

// Force dynamic rendering so we always get fresh DB data
export const dynamic = "force-dynamic";

interface LobbyPageProps {
    params: {
        id: string;
    };
}

export default async function LobbyPage({ params }: LobbyPageProps) {
    const match = await prisma.match.findUnique({
        where: { id: params.id },
        include: { players: true },
    });

    if (!match) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-void text-blood font-mono">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">404 // SIGNAL_LOST</h1>
                    <p>Protocol does not exist.</p>
                    <a href="/" className="underline hover:text-white">Return to Uplink</a>
                </div>
            </div>
        );
    }

    // Placeholder for when we have skins/names
    const slots = [0, 1, 2, 3];

    return (
        <main className="flex min-h-screen flex-col bg-void text-white font-mono selection:bg-cyan/30">

            {/* Header */}
            <header className="border-b border-slate-800 p-6 flex justify-between items-center bg-slate-dark/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    <span className="text-xs tracking-widest text-slate-400">STATUS: {match.status.toUpperCase()}</span>
                </div>
                <h1 className="text-xl font-serif text-cyan tracking-widest">PROTOCOL: LOBBY</h1>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-12">

                {/* Room Code Display - Only for human matches */}
                {match.gameMode === "humans" && (
                    <div className="text-center space-y-4">
                        <p className="text-slate-500 text-xs uppercase tracking-[0.3em]">Encryption Key</p>
                        <div className="group relative inline-flex items-center gap-4 px-12 py-6 border border-cyan/30 bg-cyan/5 rounded-lg hover:bg-cyan/10 transition-all cursor-pointer">
                            <span className="text-6xl md:text-8xl tracking-[0.2em] font-bold text-cyan drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                                {match.encryptionKey}
                            </span>
                        </div>
                        <p className="text-slate-600 text-xs">Share this key to recruit agents.</p>
                    </div>
                )}

                {/* Bot Mode Indicator */}
                {match.gameMode === "bots" && (
                    <div className="text-center space-y-2">
                        <p className="text-cyan text-sm uppercase tracking-widest">Solo Training Mode</p>
                        <p className="text-slate-500 text-xs">3 AI agents have been deployed</p>
                    </div>
                )}

                {/* Player Grid */}
                <PlayerGrid matchId={match.id} initialPlayers={match.players} />

                {/* Actions */}
                <LobbyActions matchId={match.id} players={match.players} gameMode={match.gameMode} />
            </div>
        </main>
    );
}
