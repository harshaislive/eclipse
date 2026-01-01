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
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
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

    const handleLeftClick = (index: number) => {
        play("hover");
        if (selectedLeft === index) {
            setSelectedLeft(null);
        } else {
            setSelectedLeft(index);
        }
    };

    const handleRightClick = (rightIndex: number) => {
        if (selectedLeft === null) return;

        play("click");
        const newConnections = new Map(connections);

        // Check if correct connection
        const leftColor = WIRE_COLORS[selectedLeft];
        const rightColor = rightOrder[rightIndex];

        if (leftColor.name === rightColor.name) {
            newConnections.set(selectedLeft, rightIndex);
            setConnections(newConnections);
            setSelectedLeft(null);

            // Check if all wires connected
            if (newConnections.size === WIRE_COLORS.length) {
                play("reveal");
                setTimeout(onComplete, 1000);
            }
        } else {
            // Wrong connection - flash error
            play("error");
            setSelectedLeft(null);
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
                        Match wire colors: Left to Right
                    </p>
                    <p className="text-cyan text-sm mt-2">
                        {connections.size} / {WIRE_COLORS.length} connected
                    </p>
                </div>

                {/* Wiring Grid */}
                <div className="flex justify-between items-center gap-12">
                    {/* Left Side */}
                    <div className="flex-1 space-y-3">
                        {WIRE_COLORS.map((wire, index) => (
                            <button
                                key={index}
                                onClick={() => handleLeftClick(index)}
                                disabled={connections.has(index)}
                                className={`
                                    w-full py-3 px-4 rounded-lg border-2 transition-all
                                    ${connections.has(index)
                                        ? "border-green-500 bg-green-500/10 opacity-50 cursor-not-allowed"
                                        : selectedLeft === index
                                            ? `border-${wire.color} ${wire.color} text-black font-bold`
                                            : `border-slate-600 hover:border-${wire.color} bg-slate-800/50`
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full ${wire.color}`} />
                                    <span>{wire.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Connection Visualization */}
                    <div className="flex-shrink-0 text-slate-600 text-4xl">
                        →
                    </div>

                    {/* Right Side (Shuffled) */}
                    <div className="flex-1 space-y-3">
                        {rightOrder.map((wire, rightIndex) => {
                            const leftIndex = Array.from(connections.entries()).find(
                                ([, r]) => r === rightIndex
                            )?.[0];
                            const isConnected = leftIndex !== undefined;

                            return (
                                <button
                                    key={rightIndex}
                                    onClick={() => handleRightClick(rightIndex)}
                                    disabled={isConnected}
                                    className={`
                                        w-full py-3 px-4 rounded-lg border-2 transition-all
                                        ${isConnected
                                            ? "border-green-500 bg-green-500/10 cursor-not-allowed"
                                            : selectedLeft !== null
                                                ? `border-slate-600 hover:border-${wire.color} bg-slate-800/50 cursor-pointer`
                                                : "border-slate-700 bg-slate-900/50 cursor-not-allowed"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full ${wire.color}`} />
                                        <span className={isConnected ? "text-green-500" : ""}>
                                            {isConnected ? "✓" : "?"}
                                        </span>
                                    </div>
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
