'use client';

import { afterBoot } from './after-boot';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { ArrowRight, Globe2, KeyRound, Layers, ShieldCheck } from 'lucide-react';
import HeroCta from './HeroCta';

// Robtic's home, minimal and told by scrolling:
//   hero      both products as two stacked screens that fan out and settle side by side; tabs bring one forward;
//   services  one pinned chapter per product (words left, its screen right; the Discord bots as avatars);
//   tour      one Discord channel per bot (levels, tickets, staff, protection, voice), the list beside it lit;
//   language  the same dashboard in English, then in Arabic, mirrored;
//   account   one line that fills in word by word, then four quiet points;
//   close     one line and the two actions, in the light that leads into the FAQ.
// Scrolling only sets CSS variables and data attributes (one rAF per frame, no React renders); every value has a resting
// default, so without JavaScript or under reduced motion all of it shows.

export interface HomeService { key: string; name: string; path: string; app: string; tagline: string; text: string; shot: string }

const D = '/rl/robtic/site/discord';
const BOTS = [['system', 'Robtic System'], ['staff', 'Robtic Staff'], ['ticket', 'Robtic Ticket'], ['music', 'Robtic Voice'], ['guard', 'Robtic Guard']] as const;
type BotKey = 'system' | 'staff' | 'ticket' | 'music' | 'guard';
const BOT_NAME: Record<BotKey, string> = { system: 'Robtic System', staff: 'Robtic Staff', ticket: 'Robtic Ticket', music: 'Robtic Voice', guard: 'Robtic Guard' };
interface TourMsg { bot?: BotKey; who?: string; pic?: string; body: React.ReactNode }
interface TourStep { key: string; title: string; line: string; channel: string; messages: TourMsg[] }

// The tour: one Discord channel per bot, as members of the Robtic server would see it.
const TOUR: TourStep[] = [
    {
        key: 'levels', title: 'Levels', line: 'XP for chat and voice, a rank card on demand.', channel: 'general',
        messages: [
            { who: 'robo', pic: 'm-1', body: <p>/rank</p> },
            { bot: 'system', body: <div className="hl-emb"><span>Level 11 · 3,120 XP</span><i><s /></i><small>360 XP to level 12</small></div> },
            { bot: 'system', body: <div className="hl-emb hl-emb-up"><span>Level up! 🎉</span><p>robo reached <strong>level 12</strong></p></div> },
        ],
    },
    {
        key: 'tickets', title: 'Tickets', line: 'Panels you design, a private channel per ticket.', channel: 'support',
        messages: [
            { bot: 'ticket', body: <div className="hl-emb"><span>Need a hand?</span><p>Pick what your ticket is about.</p><p className="hl-btns"><i>🎫 Support</i><i>🚨 Report</i><i>💳 Purchases</i></p></div> },
            { bot: 'ticket', body: <p>🎫 <strong>#ticket-129</strong> opened by <strong>patrike</strong></p> },
        ],
    },
    {
        key: 'staff', title: 'Staff', line: 'Ranks, points and promotions for your team.', channel: 'staff-reports',
        messages: [
            { bot: 'staff', body: <p>📨 Report <strong>#128</strong> claimed by <strong>One</strong> · +2 points</p> },
            { bot: 'staff', body: <div className="hl-emb"><span>Weekly promotions</span><p><strong>3mar</strong> → Moderator II</p></div> },
        ],
    },
    {
        key: 'guard', title: 'Protection', line: 'A raid stopped before anyone notices.', channel: 'mod-log',
        messages: [
            { bot: 'guard', body: <div className="hl-emb hl-emb-warn"><span>Raid stopped</span><p>6 scam messages deleted in 4 channels · 1 member timed out</p></div> },
        ],
    },
    {
        key: 'voice', title: 'Voice', line: 'Music bots that stay in your voice channels.', channel: 'music',
        messages: [
            { bot: 'music', body: <div className="hl-emb"><span>Now playing</span><p>Lofi beats to code to · 🔊 Lounge</p><i><s /></i></div> },
            { who: '3mar', pic: 'm-4', body: <p>added 3 songs to the queue</p> },
        ],
    },
];

const ACCOUNT = ['One', 'account.', 'Every', 'Robtic', 'service.'];
const ACCOUNT_POINTS = [
    { icon: KeyRound, t: 'Sign in your way', d: 'Email, a passkey, GitHub or Discord.' },
    { icon: Layers, t: 'You choose', d: 'A service starts only when you start it.' },
    { icon: Globe2, t: 'In the browser', d: 'Nothing to install, on desktop or phone.' },
    { icon: ShieldCheck, t: 'Secure', d: 'Two-factor, passkeys and your devices list.' },
];

/** Where each product lives, shown in its window bar. */
const ADDRESS: Record<string, string> = { hosting: 'robtic.org/hosting/dashboard', discord: 'robtic.org/discord/public' };

function WinBar({ url }: { url: string }) {
    return (
        <div className="hl-win" aria-hidden="true">
            <i /><i /><i />
            <span>{url}</span>
        </div>
    );
}

function runOf(el: HTMLElement): number {
    const box = el.getBoundingClientRect();
    const run = el.offsetHeight - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -box.top / run)) : 0;
}

export default function HomeLanding({ services }: { services: HomeService[] }) {
    const root = useRef<HTMLDivElement>(null);
    const [front, setFront] = useState(services.length - 1);
    const [swapping, setSwapping] = useState(false);

    const bringForward = (i: number) => {
        if (i === front) return;
        setSwapping(true);
        setFront(i);
        window.setTimeout(() => setSwapping(false), 560);
    };

    useEffect(() => {
        const el = root.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        el.dataset.motion = 'on';
        // A soft light under the pointer on every card (a mouse only; touch has no hover to follow).
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        let spotFrame = 0;
        let spotEv: PointerEvent | null = null;
        const onPointer = (e: PointerEvent) => {
            spotEv = e;
            if (spotFrame) return;
            spotFrame = requestAnimationFrame(() => {
                spotFrame = 0;
                const card = (spotEv?.target as HTMLElement | null)?.closest<HTMLElement>('[data-spot]');
                if (!card || !spotEv) return;
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${((spotEv.clientX - r.left) / r.width) * 100}%`);
                card.style.setProperty('--my', `${((spotEv.clientY - r.top) / r.height) * 100}%`);
            });
        };
        if (fine) el.addEventListener('pointermove', onPointer, { passive: true });
        // The hero's entrance plays once the eye loading screen has gone, so it's seen.
        const stopBoot = afterBoot(() => { el.dataset.entered = 'on'; });
        const q = (s: string) => el.querySelector<HTMLElement>(s)!;
        const hero = q('.hl-hero'), svc = q('.hl-svc'), tour = q('.hl-tour'), lang = q('.hl-lang'), acc = q('.hl-acc');
        const last = new Map<string, string>();
        const set = (node: HTMLElement, k: string, v: string) => {
            const key = `${node.className.split(' ')[0]}|${k}`;
            if (last.get(key) === v) return;
            last.set(key, v);
            if (k.startsWith('--')) node.style.setProperty(k, v);
            else node.dataset[k] = v;
        };
        let frame = 0;
        const tick = () => {
            frame = 0;
            const h = hero.getBoundingClientRect();
            set(hero, '--spread', Math.min(1, Math.max(0, -h.top / (window.innerHeight * 0.6))).toFixed(3));
            set(svc, 'i', String(Math.min(services.length - 1, Math.floor(runOf(svc) * services.length))));
            set(tour, 'i', String(Math.min(TOUR.length - 1, Math.floor(runOf(tour) * TOUR.length))));
            set(lang, 'ar', runOf(lang) > 0.5 ? '1' : '0');
            set(acc, '--fill', runOf(acc).toFixed(3));
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
        tick();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { stopBoot(); el.removeEventListener('pointermove', onPointer); cancelAnimationFrame(spotFrame); cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, [services.length]);

    return (
        <div className="hl" ref={root}>
            {/* ------------------------------------------------------------------------------------------- hero */}
            <section className="hl-hero" aria-labelledby="hl-title">
                <div className="hl-glow" aria-hidden="true" />
                <div className="hl-hero-txt">
                    <h1 id="hl-title">Tools for the people who <span>build on Discord</span>.</h1>
                    <p>Host your own bots and apps, or add ready-made ones to your server. One account for both.</p>
                    <div className="hl-ctas">
                        <HeroCta label="Create your Robtic account" href="/auth/register" signedInLabel="Choose a service" signedInHref="#services" />
                        <a className="hl-ghost" href="#services">See our services</a>
                    </div>
                    <p className="hl-fact">Robtic Hosting is free for your first month.</p>
                </div>
                <div className="hl-tabs" role="tablist" aria-label="Show a product">
                    {services.map((s, i) => (
                        <button key={s.key} type="button" role="tab" aria-selected={front === i} className={front === i ? 'on' : ''} onClick={() => bringForward(i)}>
                            {s.name.replace('Robtic ', '')}
                        </button>
                    ))}
                </div>
                <div className={`hl-stage${swapping ? ' swapping' : ''}`}>
                    {services.map((s, i) => (
                        <div className={`hl-screen ${front === i ? 'is-front' : 'is-back'}`} key={s.key} data-spot>
                            <WinBar url={ADDRESS[s.key] ?? 'robtic.org'} />
                            <img src={s.shot} alt={`${s.name}: ${s.tagline}`} width={1600} height={1000} fetchPriority={i === services.length - 1 ? 'high' : 'auto'} />
                        </div>
                    ))}
                </div>
            </section>

            {/* --------------------------------------------------------------------------------------- services */}
            <section className="hl-svc" id="services" data-i="0" style={{ ['--n' as string]: services.length }} aria-label="Robtic services">
                <div className="hl-pin">
                    <div className="wrap hl-svc-in">
                        <div className="hl-svc-txt">
                            {services.map((s, i) => (
                                <article className="hl-chap" key={s.key} style={{ ['--k' as string]: i }}>
                                    <span className="hl-svc-n" aria-hidden="true">{String(i + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}</span>
                                    <h2>{s.name}</h2>
                                    <p className="hl-svc-tag">{s.tagline}</p>
                                    <p>{s.text}</p>
                                    {s.key === 'discord' ? (
                                        <ul className="hl-bots" aria-label="The bots">
                                            {BOTS.map(([k, name]) => (
                                                <li key={k} title={name}><img src={`${D}/bot-${k}.webp`} alt={name} width={44} height={44} loading="lazy" /></li>
                                            ))}
                                        </ul>
                                    ) : null}
                                    <div className="hl-svc-links">
                                        <a className="hl-solid" href={s.path}>Explore {s.name.replace('Robtic ', '')} <ArrowRight size={16} aria-hidden="true" /></a>
                                        <a className="hl-ghost" href={s.app}>Open it</a>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="hl-svc-shot" aria-hidden="true">
                            {services.map((s, i) => (
                                <div className="hl-svc-frame" key={s.key} style={{ ['--k' as string]: i }} data-spot>
                                    <WinBar url={ADDRESS[s.key] ?? 'robtic.org'} />
                                    <img src={s.shot} alt="" width={1600} height={1000} loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------------------------------------------------- tour */}
            <section className="hl-tour" data-i="0" style={{ ['--n' as string]: TOUR.length }} aria-labelledby="hl-tour-title">
                <div className="hl-pin">
                    <div className="wrap hl-tour-in">
                        <div className="hl-tour-side">
                            <h2 id="hl-tour-title">Your server, run by bots that just work.</h2>
                            <ol className="hl-tour-list">
                                {TOUR.map((t, i) => (
                                    <li key={t.key} style={{ ['--k' as string]: i }}>
                                        <b>{t.title}</b>
                                        <span>{t.line}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="hl-tour-stage" aria-hidden="true">
                            {TOUR.map((t, i) => (
                                <div className="hl-frame" key={t.key} style={{ ['--k' as string]: i }} data-spot>
                                    <div className="hl-chat">
                                        <div className="hl-chat-head"># {t.channel}</div>
                                        {t.messages.map((m, n) => (
                                            <div className="hl-msg" key={n} style={{ ['--m' as string]: n }}>
                                                <img src={m.bot ? `${D}/bot-${m.bot}.webp` : `${D}/${m.pic}.webp`} alt="" width={40} height={40} />
                                                <div>
                                                    <b>{m.bot ? BOT_NAME[m.bot] : m.who}{m.bot ? <em>APP</em> : null}</b>
                                                    {m.body}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --------------------------------------------------------------------------------------- language */}
            <section className="hl-lang" data-ar="0" aria-labelledby="hl-lang-title">
                <div className="hl-pin">
                    <div className="wrap hl-lang-in">
                        <h2 id="hl-lang-title">
                            <span className="en">In English.</span>
                            <span className="ar" lang="ar" dir="rtl">وبالعربية.</span>
                        </h2>
                        <p>Every dashboard and every bot speaks both, right to left included. Each server picks its own.</p>
                        <div className="hl-lang-shot" aria-hidden="true" data-spot>
                            <WinBar url={ADDRESS.discord!} />
                            <div className="hl-lang-imgs">
                                <img className="en" src="/rl/robtic/site/discord-home.webp" alt="" width={1600} height={1000} loading="lazy" />
                                <img className="ar" src="/rl/robtic/site/discord-home-ar.webp" alt="" width={1600} height={1000} loading="lazy" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------------------------------- account */}
            <section className="hl-acc" id="account" aria-labelledby="hl-acc-title">
                <div className="hl-pin">
                    <h2 id="hl-acc-title">
                        {ACCOUNT.map((w, i) => <span key={i} style={{ ['--k' as string]: i / ACCOUNT.length }}>{w} </span>)}
                    </h2>
                    <ul className="hl-points">
                        {ACCOUNT_POINTS.map(({ icon: Icon, t, d }, i) => (
                            <li key={t} style={{ ['--k' as string]: i }}>
                                <span className="hl-pt-ic"><Icon size={18} aria-hidden="true" /></span>
                                <b>{t}</b>
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ------------------------------------------------------------------------------------------ close */}
            <section className="hl-close" aria-labelledby="hl-close-title">
                <div className="hl-close-glow" aria-hidden="true" />
                <h2 id="hl-close-title">Pick a service. Start today.</h2>
                <div className="hl-ctas">
                    <HeroCta label="Create your Robtic account" href="/auth/register" signedInLabel="Choose a service" signedInHref="#services" />
                    <a className="hl-ghost" href="/hosting">Robtic Hosting</a>
                    <a className="hl-ghost" href="/discord">Robtic Discord</a>
                </div>
            </section>
        </div>
    );
}
