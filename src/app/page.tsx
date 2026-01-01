"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Home() {
    const router = useRouter();
    const [view, setView] = useState<"menu" | "join">("menu");
    const [roomCode, setRoomCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string>("");

    useEffect(() => {
        // Generate or retrieve persistent User ID
        let storedId = localStorage.getItem("eclipse_user_id");
        if (!storedId) {
            storedId = crypto.randomUUID();
            localStorage.setItem("eclipse_user_id", storedId);
        }
        setUserId(storedId);
    }, []);

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/match/create", { method: "POST" });
            const data = await res.json();

            if (data.matchId) {
                // Auto-join as host
                await handleJoinRequest(data.encryptionKey, data.matchId);
            }
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    const handleJoinRequest = async (code: string, matchId?: string) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/match/join", {
                method: "POST",
                body: JSON.stringify({
                    encryptionKey: code,
                    userId: userId
                }),
            });
            const data = await res.json();

            if (data.matchId) {
                router.push(`/lobby/${data.matchId}`);
            } else {
                alert(data.error || "Failed to join");
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert("System Error");
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-void relative overflow-hidden">
            {/* Background Grids */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <div className="z-10 max-w-5xl w-full flex flex-col items-center gap-2 mb-12">
                <h1 className="text-5xl md:text-7xl font-serif text-cyan tracking-tighter drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
                    PROTOCOL <span className="text-blood drop-shadow-[0_0_15px_rgba(255,0,60,0.5)]">ECLIPSE</span>
                </h1>
                <p className="text-slate-400 tracking-widest text-xs uppercase">Secure Uplink // v1.0.4</p>
            </div>

            <div className="border border-slate-700 p-8 rounded-lg bg-slate-dark/80 backdrop-blur-md max-w-md w-full shadow-2xl relative">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-cyan shadow-[0_0_10px_cyan]"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-cyan shadow-[0_0_10px_cyan]"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan shadow-[0_0_10px_cyan]"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan shadow-[0_0_10px_cyan]"></div>

                <div className="mb-6 font-mono text-sm space-y-2">
                    <p className="text-cyan animate-pulse">&gt; ESTABLISHING_SECURE_CONNECTION...</p>
                    <p className="text-gray-500">&gt; USER_ID: <span className="text-slate-300">{userId.split('-')[0]}***</span></p>
                    <p className="text-green-500">&gt; UPLINK_READY</p>
                </div>

                {view === "menu" ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleCreate}
                            disabled={isLoading}
                            className="w-full group relative bg-cyan/5 border border-cyan text-cyan hover:bg-cyan/10 transition-all py-4 px-4 rounded uppercase tracking-widest font-bold text-sm overflow-hidden"
                        >
                            <div className="absolute inset-0 w-0 bg-cyan/20 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? "INITIALIZING..." : "CREATE PROTOCOL"}
                                {/* Simple arrow icon */}
                                {!isLoading && <span className="text-xs">&gt;&gt;</span>}
                            </span>
                        </button>

                        <button
                            onClick={() => setView("join")}
                            className="w-full bg-transparent border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-all py-3 px-4 rounded uppercase tracking-widest font-bold text-xs"
                        >
                            JOIN EXISTING CHANNEL
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-cyan uppercase tracking-widest">Encryption Key</label>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="0000"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                className="w-full bg-black/50 border border-slate-600 focus:border-cyan text-center text-2xl tracking-[0.5em] font-mono py-3 outline-none text-white placeholder:text-slate-700 transition-all"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setView("menu")}
                                className="flex-1 bg-transparent border border-slate-600 text-slate-400 hover:text-white py-3 text-xs uppercase font-bold"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => handleJoinRequest(roomCode)}
                                disabled={isLoading || roomCode.length < 4}
                                className="flex-[2] bg-cyan/10 border border-cyan text-cyan hover:bg-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-xs uppercase font-bold transition-all"
                            >
                                {isLoading ? "CONNECTING..." : "CONFIRM"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
