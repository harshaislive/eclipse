"use client";

import { useEffect, useState, useCallback } from "react";
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
    const [lockdown, setLockdown] = useState(false);
    const [glitchEffect, setGlitchEffect] = useState(false);

    // Ghost Cooldowns
    const [cooldowns, setCooldowns] = useState({ glitch: 0, lockdown: 0 });

    const { play } = useSound();
    const router = useRouter();

    // Initial Data & Role Fetch
    useEffect(() => {
        const userId = localStorage.getItem("eclipse_user_id");
        if (!userId) return;

        async function fetchState() {
            try {
                // Fetch Role
                const res = await fetch(`/api/player?userId=${userId}&matchId=${matchId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRole(data.role || "crew");
                    play("reveal"); // Initial role reveal sound
                }

                // Initial Match State (Progress) - we should probably have an endpoint for this or include it in player fetch
                // For now, it defaults to 0 and SSE will catch us up, or we might need a `GET /api/match/${matchId}`
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchState();
    }, [matchId, play]);

    // Real-time Event Subscription (SSE)
    useEffect(() => {
        console.log(`[GameTerminal] Connecting to stream for ${matchId}`);
        const eventSource = new EventSource(`/api/stream?matchId=${matchId}`);

        eventSource.onmessage = (e) => {
            try {
                const event = JSON.parse(e.data);

                if (event.type === "task_completed") {
                    // Update progress from any player
                    setProgress(event.data.progress);
                    if (event.data.progress >= 100) {
                        play("reveal"); // Victory sound logic handled elsewhere usually?
                    }
                }
                else if (event.type === "sabotage") {
                    const { effect, duration, progress: newProgress } = event.payload;
                    play("error");

                    if (effect === "glitch") {
                        if (newProgress !== undefined) setProgress(newProgress);
                        setGlitchEffect(true);
                        setTimeout(() => setGlitchEffect(false), 2000);
                    } else if (effect === "lockdown") {
                        setLockdown(true);
                        setTimeout(() => setLockdown(false), duration || 10000);
                    }
                }
                else if (event.type === "crew_victory") {
                    // Handle victory (maybe redirect or show modal)
                    alert("CREW VICTORY - PROTOCOL COMPLETE");
                    router.push("/");
                }
            } catch (err) {
                // Ignore heartbeat or parse errors
            }
        };

        return () => {
            eventSource.close();
        };
    }, [matchId, play, router]);

    // Cooldown Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCooldowns(prev => ({
                glitch: Math.max(0, prev.glitch - 1),
                lockdown: Math.max(0, prev.lockdown - 1)
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleTaskClick = (taskType: "decrypt" | "bypass" | "wiring") => {
        if (completedTasks.has(taskType)) return;
        if (lockdown) {
            play("error");
            return;
        }
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
                setCompletedTasks(prev => new Set(Array.from(prev).concat(activeTask)));
                setActiveTask(null);
                // Progress is updated via SSE now for consistency
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSabotage = async (type: "glitch" | "lockdown") => {
        if (cooldowns[type] > 0) return;

        const userId = localStorage.getItem("eclipse_user_id");

        // Optimistic UI updates
        play("click");
        setCooldowns(prev => ({
            ...prev,
            [type]: type === "glitch" ? 30 : 60
        }));

        try {
            await fetch("/api/match/sabotage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, userId, type }),
            });
        } catch (e) {
            console.error("Sabotage failed", e);
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
            <div className={`flex flex-col h-screen p-8 relative overflow-hidden transition-all duration-200 ${glitchEffect ? "translate-x-1 blur-[1px] hue-rotate-90" : ""}`}>
                {/* Background */}
                <div className={`absolute inset-0 opacity-10 ${role === 'ghost' ? 'bg-blood' : 'bg-cyan'}`}></div>

                {/* Lockdown Overlay */}
                {lockdown && (
                    <div className="absolute inset-0 z-40 bg-red-900/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                        <div className="bg-black/80 border-2 border-red-500 p-8 text-center animate-pulse">
                            <h2 className="text-4xl font-bold text-red-500 mb-2">⚠ SYSTEM LOCKDOWN ⚠</h2>
                            <p className="text-red-400">Sabotage detected. Terminals disabled.</p>
                        </div>
                    </div>
                )}

                <div className="z-10 flex-1 max-w-4xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-3xl font-black tracking-tighter mb-2 ${role === 'ghost' ? 'text-blood' : 'text-cyan'}`}>
                            {role === 'ghost' ? 'GHOST PROTOCOL' : 'CREW TERMINAL'}
                        </h1>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className={`font-bold ${glitchEffect ? "text-red-500" : "text-slate-400"}`}>
                                    {glitchEffect ? "⚠ CONNECTION UNSTABLE ⚠" : "EXTRACTION PROGRESS"}
                                </span>
                                <span className="text-cyan font-mono">{progress}%</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan to-green-500 transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                                {glitchEffect && (
                                    <div className="absolute inset-0 bg-white/50 animate-ping" />
                                )}
                            </div>
                        </div>
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
                                        disabled={isCompleted || lockdown}
                                        className={`
                                            p-6 rounded-lg border-2 text-left transition-all
                                            ${isCompleted
                                                ? 'border-green-500/30 bg-green-500/10 opacity-50 cursor-not-allowed'
                                                : lockdown
                                                    ? 'border-red-500/30 bg-red-900/10 cursor-not-allowed opacity-75'
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
                                                        {isCompleted ? 'COMPLETED ✓' : lockdown ? 'LOCKED 🔒' : 'Click to start'}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isCompleted && !lockdown && (
                                                <div className="text-cyan">→</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Ghost Controls */}
                    {role === 'ghost' && (
                        <div className="p-8 border border-blood/30 bg-blood/5 rounded-lg">
                            <h2 className="text-xl font-bold text-blood mb-6 flex items-center gap-2">
                                <span className="animate-pulse">●</span> SABOTAGE PROTOCOLS
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => handleSabotage("glitch")}
                                    disabled={cooldowns.glitch > 0}
                                    className={`
                                        p-6 border rounded relative overflow-hidden group transition-all text-left
                                        ${cooldowns.glitch > 0
                                            ? "border-slate-700 bg-slate-900/50 cursor-not-allowed opacity-50"
                                            : "border-blood hover:bg-blood/20 bg-slate-900 cursor-pointer"
                                        }
                                    `}
                                >
                                    <div className="relative z-10">
                                        <h3 className="font-bold text-lg text-blood mb-1">SYSTEM GLITCH</h3>
                                        <p className="text-xs text-slate-400 mb-4">Reduce extraction progress by 15%</p>
                                        <div className="font-mono text-sm text-slate-500">
                                            {cooldowns.glitch > 0 ? `RECHARGING: ${cooldowns.glitch}s` : "READY"}
                                        </div>
                                    </div>
                                    {!cooldowns.glitch && (
                                        <div className="absolute inset-0 bg-blood/5 group-hover:bg-blood/10 transition-colors" />
                                    )}
                                </button>

                                <button
                                    onClick={() => handleSabotage("lockdown")}
                                    disabled={cooldowns.lockdown > 0}
                                    className={`
                                        p-6 border rounded relative overflow-hidden group transition-all text-left
                                        ${cooldowns.lockdown > 0
                                            ? "border-slate-700 bg-slate-900/50 cursor-not-allowed opacity-50"
                                            : "border-blood hover:bg-blood/20 bg-slate-900 cursor-pointer"
                                        }
                                    `}
                                >
                                    <div className="relative z-10">
                                        <h3 className="font-bold text-lg text-blood mb-1">TOTAL LOCKDOWN</h3>
                                        <p className="text-xs text-slate-400 mb-4">Disable all terminals for 10s</p>
                                        <div className="font-mono text-sm text-slate-500">
                                            {cooldowns.lockdown > 0 ? `RECHARGING: ${cooldowns.lockdown}s` : "READY"}
                                        </div>
                                    </div>
                                    {!cooldowns.lockdown && (
                                        <div className="absolute inset-0 bg-blood/5 group-hover:bg-blood/10 transition-colors" />
                                    )}
                                </button>
                            </div>
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
