'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

// Robtic: every so often — not every visit, and never twice within a few hours — a small transparent wave drifts
// in right at the edge of the page, plays once, and fades away. A quiet easter-egg, never in the way.
const COOLDOWN_MS = 3 * 60 * 60 * 1000; // at least ~3 hours between appearances (per browser)
const CHANCE = 0.25; // when past the cooldown, ~1 in 4 visits actually shows it
const KEY = 'robtic:wave-last';

export default function WaveLoop() {
    const [style, setStyle] = useState<CSSProperties | null>(null);
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let last = 0;
        try {
            last = Number(localStorage.getItem(KEY) || 0);
        } catch {
            // private mode: just treat as never-shown
        }
        if (Date.now() - last < COOLDOWN_MS) return; // shown recently — wait hours
        if (Math.random() > CHANCE) return; // otherwise rare

        // A random edge (0 top, 1 right, 2 bottom, 3 left), sitting right on the border.
        const edge = Math.floor(Math.random() * 4);
        const along = `${10 + Math.floor(Math.random() * 62)}%`;
        const base: CSSProperties = {
            position: 'fixed',
            zIndex: 6,
            width: 'min(22vw, 150px)',
            height: 'auto',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.9s ease',
            filter: 'drop-shadow(0 0 10px rgba(23, 147, 255, 0.3))',
        };
        if (edge === 0) Object.assign(base, { top: 0, left: along });
        else if (edge === 1) Object.assign(base, { right: 0, top: along });
        else if (edge === 2) Object.assign(base, { bottom: 0, left: along });
        else Object.assign(base, { left: 0, top: along });

        // Appear after a short, slightly random delay so it doesn't land exactly on load.
        const appear = setTimeout(() => {
            try {
                localStorage.setItem(KEY, String(Date.now()));
            } catch {
                /* ignore */
            }
            setStyle(base);
            setVisible(true);
        }, 1500 + Math.random() * 3000);
        return () => clearTimeout(appear);
    }, []);

    if (!style) return null;

    return (
        <video
            ref={ref}
            src="/rl/robtic/robtic-wave-loop-transparent.webm"
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            style={{ ...style, opacity: visible ? 0.9 : 0 }}
            onLoadedData={(e) => {
                e.currentTarget.play().catch(() => {});
            }}
            onEnded={() => {
                // Play once, then fade out and remove (no loop).
                setVisible(false);
                setTimeout(() => setStyle(null), 1000);
            }}
        />
    );
}
