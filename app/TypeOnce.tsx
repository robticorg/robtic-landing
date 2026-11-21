'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

// A closing section that holds still and types its heading as you scroll: the section is a few screens tall and its
// content stays pinned in the middle, so the page seems to stop while the scroll types the sentence, letter by letter
// (scrolling back takes letters away). When the sentence is whole, the actions below it appear and the page moves on.
// Every letter keeps its place from the start (hidden until typed), so nothing shifts. Screen readers get the whole
// sentence at once; with reduced motion, or without JavaScript, the section is ordinary and everything is shown.

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The share of the pinned stretch the typing takes; the rest holds the finished sentence with its actions. */
const TYPE_SHARE = 0.78;

export default function TypeOnce({ id, plain, em, className = '', children }: { id?: string; plain: string; em: string; className?: string; children?: ReactNode }) {
    const ref = useRef<HTMLElement>(null);
    const total = plain.length + em.length;
    // -1: not driven (all shown, as on the server or with reduced motion); 0..total: letters typed so far.
    const [n, setN] = useState(-1);

    useIsoLayoutEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        el.dataset.pin = 'on';
        let frame = 0;
        const measure = () => {
            frame = 0;
            const box = el.getBoundingClientRect();
            const run = Math.max(1, box.height - window.innerHeight);
            const p = Math.min(1, Math.max(0, -box.top / run) / TYPE_SHARE);
            setN(Math.round(p * total));
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
        measure();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            delete el.dataset.pin;
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [total]);

    const shown = (i: number) => n < 0 || i < n;
    const caretAfter = n > 0 && n < total ? n : -1;
    const chars = (text: string, offset: number) => [...text].map((c, i) => (
        <span key={i} className={shown(offset + i) ? 'tw-c' : 'tw-c tw-off'}>
            {c}
            {caretAfter === offset + i + 1 ? <i className="tw-caret" /> : null}
        </span>
    ));

    return (
        <section ref={ref} className={`tw-pin ${className}`} aria-labelledby={id} data-done={n < 0 || n >= total ? 'on' : undefined}>
            <div className="tw-stick">
                <h2 id={id} aria-label={`${plain} ${em}`}>
                    <span aria-hidden="true">{n === 0 ? <i className="tw-caret tw-caret-start" /> : null}{chars(plain, 0)}</span>
                    {' '}
                    <em aria-hidden="true">{chars(em, plain.length)}</em>
                </h2>
                {children}
            </div>
        </section>
    );
}
