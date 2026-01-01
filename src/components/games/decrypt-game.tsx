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
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [phase, setPhase] = useState<"memorize" | "input" | "success" | "failure">("memorize");
    const { play } = useSound();

    // Generate sequence on mount
    useEffect(() => {
        const newSequence = Array.from({ length: 5 }, () => Math.floor(Math.random() * 16));
        setSequence(newSequence);
        startSequenceDisplay(newSequence);
    }, []);

    const startSequenceDisplay = (seq: number[]) => {
        setIsShowingSequence(true);
        setPhase("memorize");

        let i = 0;
        const interval = setInterval(() => {
            if (i >= seq.length) {
                clearInterval(interval);
                setHighlightedIndex(null);
                setIsShowingSequence(false);
                setPhase("input");
                return;
            }

            setHighlightedIndex(seq[i]);
            play("hover"); // Sound for each step

            // Turn off highlight quickly
            setTimeout(() => {
                setHighlightedIndex(null);
            }, 600);

            i++;
        }, 1000);
    };

    const handleGridClick = (index: number) => {
        if (phase !== "input" || isShowingSequence) return;

        play("click");

        const nextIndex = userSequence.length;
        if (index !== sequence[nextIndex]) {
            setPhase("failure");
            play("error");
            return;
        }

        const newUserSequence = [...userSequence, index];
        setUserSequence(newUserSequence);

        if (newUserSequence.length === sequence.length) {
            setPhase("success");
            play("reveal");
            setTimeout(onComplete, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-lg p-8 border border-cyan/30 bg-black/80 rounded-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan mb-2">DECRYPT SEQUENCE</h2>
                    <p className="text-slate-400 text-sm">
                        {phase === "memorize" && "Watch the sequence..."}
                        {phase === "input" && "Repeat the sequence"}
                        {phase === "success" && "ACCESS GRANTED"}
                        {phase === "failure" && "INCORRECT SEQUENCE"}
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => handleGridClick(i)}
                            disabled={phase !== "input" || isShowingSequence}
                            className={`
                                aspect-square rounded-lg border-2 transition-all duration-200
                                ${highlightedIndex === i
                                    ? "bg-cyan border-cyan shadow-[0_0_15px_cyan] scale-105"
                                    : "border-slate-700 bg-slate-900/50"
                                }
                                ${phase === "input" && "hover:border-cyan/50 hover:bg-cyan/10"}
                                ${phase === "failure" && "opacity-50"}
                            `}
                        />
                    ))}
                </div>

                {phase === "failure" && (
                    <div className="text-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500 rounded hover:bg-red-500/20"
                        >
                            Close System
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
