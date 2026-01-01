"use client";

import { useState, useEffect } from "react";
import { useSound } from "@/hooks/use-sound";

interface BypassGameProps {
    onComplete: () => void;
    onClose: () => void;
}

const TOTAL_BUTTONS = 5;
const BUTTON_WINDOW = 2000; // 2 seconds per button

export function BypassGame({ onComplete, onClose }: BypassGameProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [phase, setPhase] = useState<"waiting" | "active" | "success" | "failure">("waiting");
    const [timeLeft, setTimeLeft] = useState(BUTTON_WINDOW);
    const { play } = useSound();

    // Start game after brief delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase("active");
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Timer for each button
    useEffect(() => {
        if (phase !== "active") return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 50) {
                    // Time's up for this button
                    setPhase("failure");
                    play("error");
                    return 0;
                }
                return prev - 50;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [phase, currentStep, play]);

    const handleButtonClick = (index: number) => {
        if (phase !== "active") return;
        if (index !== currentStep) return;

        play("click");

        if (index === TOTAL_BUTTONS - 1) {
            // Last button - success!
            setPhase("success");
            play("reveal");
            setTimeout(onComplete, 1000);
        } else {
            // Move to next button
            setCurrentStep(index + 1);
            setTimeLeft(BUTTON_WINDOW);
        }
    };

    const progressPercent = (timeLeft / BUTTON_WINDOW) * 100;

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
                    <h2 className="text-2xl font-bold text-cyan mb-2">BYPASS SECURITY</h2>
                    <p className="text-slate-400 text-sm">
                        {phase === "waiting" && "Initializing bypass sequence..."}
                        {phase === "active" && `Click button ${currentStep + 1} before time runs out!`}
                        {phase === "success" && "BYPASS SUCCESSFUL"}
                        {phase === "failure" && "BYPASS FAILED - Security lockout"}
                    </p>
                    {phase === "active" && (
                        <div className="mt-4">
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan transition-all duration-50"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Button Sequence */}
                <div className="flex justify-center gap-4 mb-6">
                    {Array.from({ length: TOTAL_BUTTONS }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleButtonClick(index)}
                            disabled={phase !== "active" || index !== currentStep}
                            className={`
                                w-16 h-16 rounded-full border-2 font-bold text-xl
                                transition-all duration-200
                                ${index < currentStep
                                    ? "border-green-500 bg-green-500/20 text-green-500"
                                    : index === currentStep
                                        ? "border-cyan bg-cyan/20 text-cyan animate-pulse hover:bg-cyan/40 cursor-pointer"
                                        : "border-slate-600 bg-slate-800/50 text-slate-600 cursor-not-allowed"
                                }
                                disabled:opacity-50
                            `}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {/* Status Messages */}
                {phase === "success" && (
                    <div className="text-center text-green-500 font-bold animate-pulse">
                        ✓ Security bypassed! Progress updated.
                    </div>
                )}
                {phase === "failure" && (
                    <div className="text-center">
                        <div className="text-red-500 font-bold mb-4">✗ Bypass failed - too slow</div>
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
