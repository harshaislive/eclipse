"use client";

import { useState, useEffect } from "react";
import { useSound } from "@/hooks/use-sound";

interface DecryptGameProps {
    onComplete: () => void;
    onClose: () => void;
}

const SYMBOLS = ["◆", "●", "■", "▲", "★", "◇", "○", "□"];
const GRID_SIZE = 4;
const MEMORIZE_TIME = 5000; // 5 seconds
const GAME_TIME = 30000; // 30 seconds

export function DecryptGame({ onComplete, onClose }: DecryptGameProps) {
    const [pattern, setPattern] = useState<number[]>([]);
    const [userPattern, setUserPattern] = useState<number[]>([]);
    const [phase, setPhase] = useState<"memorize" | "input" | "success" | "failure">("memorize");
    const [timeLeft, setTimeLeft] = useState(MEMORIZE_TIME);
    const { play } = useSound();

    // Generate random pattern on mount
    useEffect(() => {
        const size = GRID_SIZE * GRID_SIZE;
        const randomPattern = Array.from({ length: size }, () =>
            Math.floor(Math.random() * SYMBOLS.length)
        );
        setPattern(randomPattern);
    }, []);

    // Timer countdown
    useEffect(() => {
        if (phase === "success" || phase === "failure") return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 100) {
                    if (phase === "memorize") {
                        setPhase("input");
                        return GAME_TIME;
                    } else {
                        setPhase("failure");
                        play("error");
                        return 0;
                    }
                }
                return prev - 100;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [phase, play]);

    const handleSymbolClick = (index: number) => {
        if (phase !== "input") return;

        play("click");
        const newUserPattern = [...userPattern, index];
        setUserPattern(newUserPattern);

        // Check if pattern matches so far
        if (newUserPattern.length <= pattern.length) {
            const isCorrect = newUserPattern.every((val, idx) => val === pattern[idx]);

            if (!isCorrect) {
                setPhase("failure");
                play("error");
                return;
            }

            if (newUserPattern.length === pattern.length) {
                setPhase("success");
                play("reveal");
                setTimeout(onComplete, 1000);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl p-8 border border-cyan/30 bg-black/80 rounded-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan mb-2">DECRYPT SEQUENCE</h2>
                    <p className="text-slate-400 text-sm">
                        {phase === "memorize" && "Memorize the pattern..."}
                        {phase === "input" && "Recreate the pattern by clicking symbols in order"}
                        {phase === "success" && "DECRYPTION SUCCESSFUL"}
                        {phase === "failure" && "DECRYPTION FAILED"}
                    </p>
                    <div className="mt-4 text-cyan font-mono">
                        TIME: {Math.ceil(timeLeft / 1000)}s
                    </div>
                </div>

                {/* Pattern Grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {pattern.map((symbolIndex, index) => (
                        <button
                            key={index}
                            onClick={() => handleSymbolClick(index)}
                            disabled={phase !== "input"}
                            className={`
                                aspect-square flex items-center justify-center text-4xl
                                border rounded-lg transition-all
                                ${phase === "memorize"
                                    ? "border-cyan/50 bg-cyan/10 text-cyan"
                                    : "border-slate-600 bg-slate-800/50 text-slate-400 hover:border-cyan hover:bg-cyan/10 hover:text-cyan"
                                }
                                ${userPattern.includes(index) ? "border-green-500 bg-green-500/20 text-green-500" : ""}
                                ${phase === "failure" && userPattern.includes(index) && userPattern[userPattern.indexOf(index)] !== pattern[userPattern.indexOf(index)]
                                    ? "border-red-500 bg-red-500/20 text-red-500"
                                    : ""
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {phase === "memorize" ? SYMBOLS[symbolIndex] :
                                phase === "input" && !userPattern.includes(index) ? "?" :
                                    SYMBOLS[symbolIndex]}
                        </button>
                    ))}
                </div>

                {/* Status Messages */}
                {phase === "success" && (
                    <div className="text-center text-green-500 font-bold animate-pulse">
                        ✓ Sequence decrypted! Progress updated.
                    </div>
                )}
                {phase === "failure" && (
                    <div className="text-center">
                        <div className="text-red-500 font-bold mb-4">✗ Decryption failed</div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
