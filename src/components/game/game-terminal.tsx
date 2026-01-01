"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSound } from "@/hooks/use-sound";
import { DecryptGame } from "../games/decrypt-game";
import { BypassGame } from "../games/bypass-game";
import { WiringGame } from "../games/wiring-game";

interface GameTerminalProps {
    matchId: string;
}

export function GameTerminal({ matchId }: GameTerminalProps) {
    const [role, setRole] = useState<"crew" | "ghost" | null>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [activeTask, setActiveTask] = useState<"decrypt" | "bypass" | "wiring" | null>(null);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
    const { play } = useSound();

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
                    play("reveal");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchRole();
    }, [matchId, play]);

    const handleTaskClick = (taskType: "decrypt" | "bypass" | "wiring") => {
        if (completedTasks.has(taskType)) return;
        setActiveTask(taskType);
    };

    const handleTaskComplete = async () => {
        if (!activeTask) return;

        const userId = localStorage.getItem("eclipse_user_id");
        try {
            const res = await fetch("/api/task/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, userId, taskType: activeTask }),
            });

            if (res.ok) {
                const data = await res.json();
                setCompletedTasks(prev => new Set(Array.from(prev).concat(activeTask)));
                setProgress(data.progress);
                setActiveTask(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-cyan animate-pulse">DECRYPTING_IDENTITY_MATRIX...</p>
            </div>
        );
    }

    const tasks = [
        { id: "decrypt", name: "DECRYPT SEQUENCE", icon: "◆" },
        { id: "bypass", name: "BYPASS SECURITY", icon: "●" },
        { id: "wiring", name: "REWIRE SYSTEMS", icon: "■" },
    ];

    return (
        <>
            <div className="flex flex-col h-screen p-8 relative overflow-hidden">
                {/* Background */}
                <div className={`absolute inset-0 opacity-10 ${role === 'ghost' ? 'bg-blood' : 'bg-cyan'}`}></div>

                <div className="z-10 flex-1 max-w-4xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-3xl font-black tracking-tighter mb-2 ${role === 'ghost' ? 'text-blood' : 'text-cyan'}`}>
                            {role === 'ghost' ? 'GHOST PROTOCOL' : 'CREW TERMINAL'}
                        </h1>
                        {role === 'crew' && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">EXTRACTION PROGRESS</span>
                                    <span className="text-cyan font-mono">{progress}%</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan to-green-500 transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Task List for Crew */}
                    {role === 'crew' && (
                        <div className="grid gap-4">
                            {tasks.map((task) => {
                                const isCompleted = completedTasks.has(task.id as any);
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => handleTaskClick(task.id as any)}
                                        disabled={isCompleted}
                                        className={`
                                            p-6 rounded-lg border-2 text-left transition-all
                                            ${isCompleted
                                                ? 'border-green-500/30 bg-green-500/10 opacity-50 cursor-not-allowed'
                                                : 'border-cyan/30 bg-slate-900/80 hover:border-cyan hover:bg-slate-800 cursor-pointer'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-4xl">{task.icon}</span>
                                                <div>
                                                    <h3 className="font-bold text-lg">{task.name}</h3>
                                                    <p className="text-sm text-slate-400">
                                                        {isCompleted ? 'COMPLETED ✓' : 'Click to start'}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isCompleted && (
                                                <div className="text-cyan">→</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Ghost Info */}
                    {role === 'ghost' && (
                        <div className="p-8 border border-blood/30 bg-blood/5 rounded-lg">
                            <h2 className="text-xl font-bold text-blood mb-4">SABOTAGE PROTOCOLS</h2>
                            <p className="text-slate-400">Ghost actions coming soon...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mini-Game Overlays */}
            {activeTask === "decrypt" && (
                <DecryptGame
                    onComplete={handleTaskComplete}
                    onClose={() => setActiveTask(null)}
                />
            )}
            {activeTask === "bypass" && (
                <BypassGame
                    onComplete={handleTaskComplete}
                    onClose={() => setActiveTask(null)}
                />
            )}
            {activeTask === "wiring" && (
                <WiringGame
                    onComplete={handleTaskComplete}
                    onClose={() => setActiveTask(null)}
                />
            )}
        </>
    );
}
