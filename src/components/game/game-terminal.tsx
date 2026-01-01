"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface GameTerminalProps {
    matchId: string;
}

export function GameTerminal({ matchId }: GameTerminalProps) {
    const [role, setRole] = useState<"crew" | "ghost" | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem("eclipse_user_id");
        if (!userId) return;

        // Fetch my player data
        // We need a generic "get my state" endpoint or we can abuse the join endpoint?
        // Let's create a specialized 'fetch_state' or just Query DB via a Server Action/API.
        // For speed, let's use a server action if configured, but we are using API routes.
        // Let's make a quick "GET /api/player?userId=...&matchId=..."

        async function fetchRole() {
            try {
                const res = await fetch(`/api/player?userId=${userId}&matchId=${matchId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRole(data.role || "crew"); // Default to crew if null (shouldn't happen in active)
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchRole();
    }, [matchId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-cyan animate-pulse">DECRYPTING_IDENTITY_MATRIX...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className={`absolute inset-0 opacity-20 ${role === 'ghost' ? 'bg-blood' : 'bg-cyan'}`}></div>

            <div className="z-10 text-center space-y-8 p-12 border border-slate-700 bg-black/80 backdrop-blur-xl rounded-xl shadow-2xl max-w-2xl w-full">
                <p className="text-xs text-slate-400 tracking-[0.5em] uppercase">Identity Confirmed</p>

                <h1 className={`text-6xl md:text-8xl font-black tracking-tighter ${role === 'ghost' ? 'text-blood drop-shadow-[0_0_30px_red]' : 'text-cyan drop-shadow-[0_0_30px_cyan]'}`}>
                    {role === 'ghost' ? 'THE GHOST' : 'THE CREW'}
                </h1>

                <div className="text-lg font-mono text-slate-300 leading-relaxed max-w-lg mx-auto">
                    {role === 'ghost' ? (
                        <>
                            <p>OBJECTIVE: <span className="text-blood font-bold">TERMINATE & SABOTAGE</span></p>
                            <p className="text-sm mt-4 text-slate-400">
                                You are the anomal. Blend in. Fake tasks.
                                Eliminate the Crew before they extract the data.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>OBJECTIVE: <span className="text-cyan font-bold">EXTRACT DATA</span></p>
                            <p className="text-sm mt-4 text-slate-400">
                                Complete tasks to fill the progress bar.
                                Identify and purge the Ghost before it's too late.
                            </p>
                        </>
                    )}
                </div>

                <div className="pt-8">
                    <button className={`px-8 py-4 rounded font-bold uppercase tracking-widest transition-all
                        ${role === 'ghost'
                            ? 'bg-blood/20 text-blood border border-blood hover:bg-blood/30'
                            : 'bg-cyan/20 text-cyan border border-cyan hover:bg-cyan/30'}
                     `}>
                        Enter System
                    </button>
                </div>
            </div>
        </div>
    );
}
