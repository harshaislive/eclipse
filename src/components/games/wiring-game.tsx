"use client";

import { useState } from "react";
import { useSound } from "@/hooks/use-sound";

interface WiringGameProps {
    onComplete: () => void;
    onClose: () => void;
}

const WIRE_COLORS = [
    { name: "RED", color: "bg-red-500" },
    { name: "BLUE", color: "bg-blue-500" },
    { name: "GREEN", color: "bg-green-500" },
    { name: "YELLOW", color: "bg-yellow-500" },
    { name: "PURPLE", color: "bg-purple-500" },
    { name: "CYAN", color: "bg-cyan" },
];

export function WiringGame({ onComplete, onClose }: WiringGameProps) {
    const [connections, setConnections] = useState<Map<number, number>>(new Map());
    const [selection, setSelection] = useState<{ side: "left" | "right", index: number } | null>(null);
    const { play } = useSound();

    // Shuffle right side
    const [rightOrder] = useState(() => {
        const shuffled = [...WIRE_COLORS];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    });

    const handleSelection = (side: "left" | "right", index: number) => {
        // If already connected, ignore
        if (side === "left" && connections.has(index)) return;
        if (side === "right" && Array.from(connections.values()).includes(index)) return;

        play("hover");

        // If nothing selected, select this
        if (!selection) {
            setSelection({ side, index });
            return;
        }

        // If clicked same item, deselect
        if (selection.side === side && selection.index === index) {
            setSelection(null);
            return;
        }

        // If clicked same side (different item), switch selection
        if (selection.side === side) {
            setSelection({ side, index });
            return;
        }

        // Attempt connection (Opposite sides)
        const leftIndex = side === "left" ? index : selection.index;
        const rightIndex = side === "right" ? index : selection.index;

        const leftColor = WIRE_COLORS[leftIndex];
        const rightColor = rightOrder[rightIndex];

        if (leftColor.name === rightColor.name) {
            play("click");
            const newConnections = new Map(connections);
            newConnections.set(leftIndex, rightIndex);
            setConnections(newConnections);
            setSelection(null);

            if (newConnections.size === WIRE_COLORS.length) {
                play("reveal");
                setTimeout(onComplete, 1000);
            }
        } else {
            play("error");
            setSelection(null); // Reset on error
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl p-8 border border-cyan/30 bg-black/80 rounded-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-cyan mb-2">REWIRE CONNECTIONS</h2>
                    <p className="text-slate-400 text-sm">
                        Select a wire on one side, then match it on the other.
                    </p>
                    <p className="text-cyan text-sm mt-2">
                        {connections.size} / {WIRE_COLORS.length} connected
                    </p>
                </div>

                <div className="flex justify-between items-center gap-12">
                    {/* Left Side */}
                    <div className="flex-1 space-y-3">
                        {WIRE_COLORS.map((wire, index) => {
                            const isConnected = connections.has(index);
                            const isSelected = selection?.side === "left" && selection.index === index;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelection("left", index)}
                                    disabled={isConnected}
                                    className={`
                                        w-full py-3 px-4 rounded-lg border-2 transition-all flex items-center gap-3
                                        ${isConnected
                                            ? `border-${wire.color.replace("bg-", "")} bg-slate-900/50 opacity-50`
                                            : isSelected
                                                ? `border-white ${wire.color} text-black font-bold scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]`
                                                : `border-slate-700 hover:border-slate-500 bg-slate-800/50`
                                        }
                                    `}
                                >
                                    <div className={`w-4 h-4 rounded-full ${wire.color} shadow-[0_0_8px_currentColor]`} />
                                    <span>{wire.name}</span>
                                    {isConnected && <span className="ml-auto text-green-500">✓</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Center */}
                    <div className="flex-shrink-0 text-slate-700 text-4xl font-thin tracking-tighter">
                        {"<---->"}
                    </div>

                    {/* Right Side */}
                    <div className="flex-1 space-y-3">
                        {rightOrder.map((wire, index) => {
                            const isConnected = Array.from(connections.values()).includes(index);
                            const isSelected = selection?.side === "right" && selection.index === index;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelection("right", index)}
                                    disabled={isConnected}
                                    className={`
                                        w-full py-3 px-4 rounded-lg border-2 transition-all flex items-center gap-3 justify-end
                                        ${isConnected
                                            ? `border-${wire.color.replace("bg-", "")} bg-slate-900/50 opacity-50`
                                            : isSelected
                                                ? `border-white ${wire.color} text-black font-bold scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]`
                                                : `border-slate-700 hover:border-slate-500 bg-slate-800/50`
                                        }
                                    `}
                                >
                                    {isConnected && <span className="mr-auto text-green-500">✓</span>}
                                    <span>???</span>
                                    <div className={`w-4 h-4 rounded-full ${isConnected ? wire.color : "bg-slate-600"} shadow-[0_0_8px_currentColor]`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {connections.size === WIRE_COLORS.length && (
                    <div className="text-center mt-6 text-green-500 font-bold animate-pulse">
                        ✓ Wiring complete! Progress updated.
                    </div>
                )}
            </div>
        </div>
    );
}
