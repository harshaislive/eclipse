"use client";

import { useCallback } from "react";

// Tiny base64 sounds for prototype (Click, Reveal, Hover)
// These are short beeps/static sounds.
const SOUNDS = {
    click: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU", // Placeholder, very short
    hover: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
    reveal: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"
};

// Real implementation would use real files in /public/sounds/ but for this portable demo we'll use a simple synth approach if possible or just standard Audio with placeholder URL logic.
// Actually, creating a synthesizer is better for "Noir" glitch sounds without assets.

export function useSound() {
    const play = useCallback((type: "click" | "hover" | "reveal" | "error") => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === "click") {
                // High pitched blip
                osc.type = "square";
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === "hover") {
                // Low static
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(50, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === "reveal") {
                // Dramatic sweep
                osc.type = "sine";
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.5);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === "error") {
                // Error buzz
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }

        } catch (e) {
            console.error("Audio error", e);
        }
    }, []);

    return { play };
}
