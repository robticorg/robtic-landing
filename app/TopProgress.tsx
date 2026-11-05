'use client';

// A slim bar at the top of the page whenever something is on its way: a request, or the next page loading.
import { useEffect, useRef } from 'react';

// Background traffic that nobody asked for shouldn't look like loading.
const QUIET = /heartbeat|\/rl\/e|sentry/;

export default function TopProgress() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bar = ref.current;
        if (!bar) return;
        let pending = 0;
        let leaving = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const update = () => {
            clearTimeout(timer);
            // A short wait, so what finishes at once doesn't flash.
            timer = setTimeout(() => bar.classList.toggle('on', leaving || pending > 0), pending > 0 || leaving ? 120 : 0);
        };
        const realFetch = window.fetch;
        window.fetch = (...args) => {
            const url = String(args[0] instanceof Request ? args[0].url : args[0]);
            if (QUIET.test(url)) return realFetch(...args);
            pending++;
            update();
            return realFetch(...args).finally(() => {
                pending--;
                update();
            });
        };
        const leave = () => {
            leaving = true;
            update();
        };
        const back = () => {
            leaving = false;
            pending = 0;
            update();
        };
        window.addEventListener('beforeunload', leave);
        window.addEventListener('pageshow', back);
        return () => {
            clearTimeout(timer);
            window.fetch = realFetch;
            window.removeEventListener('beforeunload', leave);
            window.removeEventListener('pageshow', back);
        };
    }, []);

    return <div ref={ref} className="top-progress" aria-hidden="true" />;
}
