'use client';

import { afterBoot } from '../after-boot';
import { useEffect, useRef } from 'react';

// Robtic Discord's page, told by scrolling and kept minimal: a hero whose dashboard preview lies back and flattens as
// you scroll; one big list of what the bots do, the current line lit; a pinned "how to start" whose preview changes per
// step; and a closing line that fills in while the page warms. Scrolling only sets CSS variables and data attributes
// (one rAF per frame, no React renders). Under reduced motion every section simply shows its finished state.

const FEATURES = [
    ['Levels and XP', 'Robtic System'],
    ['Daily streaks', 'Robtic System'],
    ['Leaderboards', 'Robtic System'],
    ['AutoMod', 'Robtic System'],
    ['Auto replies', 'Robtic System'],
    ['Staff ranks', 'Robtic Staff'],
    ['Staff points', 'Robtic Staff'],
    ['Ticket panels', 'Robtic Ticket'],
    ['Transcripts', 'Robtic Ticket'],
    ['Music in voice', 'Robtic Voice'],
    ['Raid protection', 'Robtic Guard'],
    ['One dashboard', 'Every bot'],
] as const;

const STEPS = [
    { title: 'Sign in', text: 'Use your Robtic account and link Discord.' },
    { title: 'Turn it on', text: 'Accept the Robtic Discord Terms once.' },
    { title: 'Pick a server', text: 'Every server you administer is listed.' },
    { title: 'Add a bot', text: 'Add the bots you want and set each one up.' },
] as const;

const CLOSE = ['Set', 'it', 'up', 'once.', 'Your', 'bots', 'handle', 'the', 'rest.'];

/** How far a tall section has scrolled through its pinned run, 0 to 1. */
function runOf(el: HTMLElement): number {
    const box = el.getBoundingClientRect();
    const run = el.offsetHeight - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -box.top / run)) : 0;
}

export default function DiscordLanding({ addHref, discordMark }: { addHref: string; discordMark: string }) {
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = root.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        el.dataset.motion = 'on';
        // The hero's entrance plays once the eye loading screen has gone, so it's seen.
        const stopBoot = afterBoot(() => { el.dataset.entered = 'on'; });
        const hero = el.querySelector<HTMLElement>('.dl-hero')!;
        const list = el.querySelector<HTMLElement>('.dl-list')!;
        const steps = el.querySelector<HTMLElement>('.dl-steps')!;
        const close = el.querySelector<HTMLElement>('.dl-close')!;
        const last: Record<string, string> = {};
        const set = (node: HTMLElement, k: string, v: string) => {
            const key = node.className + k;
            if (last[key] === v) return;
            last[key] = v;
            if (k.startsWith('--')) node.style.setProperty(k, v);
            else node.dataset[k] = v;
        };
        let frame = 0;
        const tick = () => {
            frame = 0;
            // Hero: the preview lies back at the top and is flat once the hero has scrolled half a screen.
            const h = hero.getBoundingClientRect();
            set(hero, '--flat', Math.min(1, Math.max(0, -h.top / (window.innerHeight * 0.55))).toFixed(3));
            // The list: which line is current, and how far between lines (for a smooth slide).
            const lp = runOf(list) * (FEATURES.length - 1);
            set(list, '--pos', lp.toFixed(3));
            set(list, 'i', String(Math.round(lp)));
            // The steps: one per quarter of the run.
            set(steps, 'i', String(Math.min(STEPS.length - 1, Math.floor(runOf(steps) * STEPS.length))));
            // The close: words light up one by one, the ground warms with them.
            set(close, '--fill', runOf(close).toFixed(3));
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
        tick();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { stopBoot(); cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, []);

    return (
        <div className="dl" ref={root}>
            <section className="dl-hero" aria-labelledby="dl-title">
                <div className="dl-glow" aria-hidden="true" />
                <div className="dl-hero-txt" data-enter>
                    <h1 id="dl-title">Discord bots, set up from <span>one dashboard</span>.</h1>
                    <p>Five bots for levels, staff, tickets, voice and raid protection, in English or Arabic.</p>
                    <div className="dl-ctas">
                        <a className="dl-add" href={addHref}>
                            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d={discordMark} /></svg>
                            Add to Discord
                        </a>
                        <a className="dl-ghost" href="#features">See what they do</a>
                    </div>
                </div>
                <div className="dl-stage">
                    <div className="dl-frame">
                        <img src="/rl/robtic/site/discord-home.webp" alt="The Robtic Discord dashboard: a server’s bots, what needs attention, and its charts" width={1600} height={1000} fetchPriority="high" />
                    </div>
                </div>
            </section>

            <section className="dl-list" id="features" style={{ ['--n' as string]: FEATURES.length }} aria-labelledby="dl-list-title">
                <div className="dl-pin">
                    <h2 id="dl-list-title" className="sr-only">What the bots do</h2>
                    <ol className="dl-words">
                        {FEATURES.map(([word, bot], i) => (
                            <li key={word} style={{ ['--k' as string]: i }}>
                                <span className="dl-count" aria-hidden="true">{i + 1} of {FEATURES.length}</span>
                                <b>{word}</b>
                                <span className="dl-bot">{bot}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="dl-steps" data-i="0" aria-labelledby="dl-steps-title">
                <div className="dl-pin">
                    <div className="wrap dl-steps-in">
                        <div>
                            <h2 id="dl-steps-title">Running in four steps</h2>
                            <ol className="dl-step-list">
                                {STEPS.map((s, i) => (
                                    <li key={s.title} style={{ ['--k' as string]: i }}>
                                        <b>{s.title}</b>
                                        <span>{s.text}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="dl-shot" aria-hidden="true">
                            <div className="dl-card" style={{ ['--k' as string]: 0 }}>
                                <div className="dl-mini-logo"><svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d={discordMark} /></svg></div>
                                <b>Sign in to Robtic</b>
                                <i className="dl-mini-btn">Continue with Discord</i>
                            </div>
                            <div className="dl-card" style={{ ['--k' as string]: 1 }}>
                                <div className="dl-mini-logo"><svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d={discordMark} /></svg></div>
                                <b>Turn on Robtic Discord</b>
                                <span className="dl-mini-check"><i />I agree to the Robtic Discord Terms</span>
                                <i className="dl-mini-btn">Turn on</i>
                            </div>
                            <div className="dl-card" style={{ ['--k' as string]: 2 }}>
                                <b>Which server today?</b>
                                <div className="dl-mini-servers">{['RC', 'AG', 'DH', 'GL'].map((s) => <i key={s}>{s}</i>)}</div>
                            </div>
                            <div className="dl-card" style={{ ['--k' as string]: 3 }}>
                                {['Robtic System', 'Robtic Staff', 'Robtic Ticket'].map((b, i) => (
                                    <span className="dl-mini-row" key={b}><i className={`b${i}`} />{b}<em>{i === 0 ? 'Added' : 'Add'}</em></span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="dl-close" aria-labelledby="dl-close-title">
                <div className="dl-pin">
                    <div className="dl-close-glow" aria-hidden="true" />
                    <h2 id="dl-close-title">
                        {CLOSE.map((w, i) => <span key={i} style={{ ['--k' as string]: i / CLOSE.length }}>{w} </span>)}
                    </h2>
                    <a className="dl-add" href={addHref}>
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d={discordMark} /></svg>
                        Add to Discord
                    </a>
                </div>
            </section>
        </div>
    );
}
