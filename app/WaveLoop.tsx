'use client';

import { useEffect, useState, type CSSProperties } from 'react';

// Robtic: once in a while (not every visit), a little transparent wave drifts in at a random spot along the edge
// of the page, plays for a bit, then fades away. A quiet easter-egg — never in the way (pointer-events: none).
const CHANCE = 0.2; // ~1 in 5 page loads
const SHOW_MS = 11000; // how long it stays once it appears

export default function WaveLoop() {
    const [style, setStyle] = useState<CSSProperties | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (Math.random() > CHANCE) return;

        // A random edge (0 top, 1 right, 2 bottom, 3 left) and a random offset along it.
        const edge = Math.floor(Math.random() * 4);
        const along = `${8 + Math.floor(Math.random() * 68)}%`;
        const base: CSSProperties = {
            position: 'fixed',
            zIndex: 6,
            width: 'min(34vw, 240px)',
            height: 'auto',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 1.1s ease',
            filter: 'drop-shadow(0 0 14px rgba(23, 147, 255, 0.35))',
        };
        if (edge === 0) Object.assign(base, { top: '-18px', left: along });
        else if (edge === 1) Object.assign(base, { right: '-18px', top: along });
        else if (edge === 2) Object.assign(base, { bottom: '-18px', left: along });
        else Object.assign(base, { left: '-18px', top: along });

        // Appear after a short, slightly random delay so it does not land exactly on page load.
        const appear = setTimeout(() => {
            setStyle(base);
            setVisible(true);
        }, 1500 + Math.random() * 3500);
        const hide = setTimeout(() => setVisible(false), SHOW_MS + 5000);
        return () => {
            clearTimeout(appear);
            clearTimeout(hide);
        };
    }, []);

    if (!style) return null;

    return (
        <video
            src="/rl/robtic/robtic-wave-loop-transparent.webm"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            style={{ ...style, opacity: visible ? 0.9 : 0 }}
            onLoadedData={(e) => {
                e.currentTarget.play().catch(() => {});
            }}
        />
    );
}
