'use client';

import { useEffect } from 'react';
import { request } from '@/lib/account';

const EVERY = 60_000;
const IDLE_AFTER = 120_000;

// Time on Robtic: about once a minute, tell the panel this person is here — only while the tab is visible and they
// did something in the last two minutes, so a tab left open doesn't count.
export function useHeartbeat(signedIn: boolean) {
    useEffect(() => {
        if (!signedIn) return;
        let lastUsed = Date.now();
        const used = () => {
            lastUsed = Date.now();
        };
        const beat = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastUsed < IDLE_AFTER) {
                request('POST', '/api/client/robtic/account/heartbeat').catch(() => {});
            }
        };
        const events = ['pointermove', 'pointerdown', 'keydown', 'scroll'];
        events.forEach((e) => window.addEventListener(e, used, { passive: true }));
        beat();
        const timer = setInterval(beat, EVERY);
        return () => {
            clearInterval(timer);
            events.forEach((e) => window.removeEventListener(e, used));
        };
    }, [signedIn]);
}
