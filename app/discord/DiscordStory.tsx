'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Robtic Discord's hero, told by scrolling: a big title over a Discord server. The server stays pinned while the page
// scrolls; the first step joins it, then each step brings one bot forward: its channel lights up, its messages arrive,
// and its profile card opens with what it does. After the last bot the page moves on.

type Bot = {
    key: string;
    name: string;
    accent: string;
    tagline: string;
    text: string;
    features: string[];
    /** The channel it works in (lit up while it's shown). */
    channel: string;
    messages: ReactNode[];
};

const BOTS: Bot[] = [
    {
        key: 'system', name: 'Robtic System', accent: '#1793ff', channel: 'level-ups',
        tagline: 'Levels, points, streaks, moderation and logs',
        text: 'The all-in-one community bot: XP for chat and voice, activity points, daily streaks, leaderboards and moderation with evidence.',
        features: ['Levels & XP', 'Points & RC', 'Streaks', 'Combos', 'Leaderboards', 'Moderation', 'Logs'],
        messages: [
            <Embed key="a" title="Level up! 🎉" accent="#1793ff">@layla reached <b>level 12</b> · 3,480 XP<Progress value={68} /></Embed>,
            <Line key="b">🔥 <b>@omar_dev</b> kept a <b>14-day</b> streak</Line>,
            <Embed key="c" title="Top this week" accent="#1793ff"><ol className="rx-ds-top"><li>🥇 layla · 9,120 XP</li><li>🥈 sara.k · 8,404 XP</li><li>🥉 yousef · 7,990 XP</li></ol></Embed>,
        ],
    },
    {
        key: 'staff', name: 'Robtic Staff', accent: '#8b5cf6', channel: 'staff-reports',
        tagline: 'Staff ranks, warnings, reports and points',
        text: 'Runs your staff team: a numbered rank ladder, staff points and weekly promotions, warnings, reports in private threads and vacations.',
        features: ['Rank ladder', 'Staff points', 'Promotions', 'Warnings', 'Reports', 'Appeals', 'Vacations'],
        messages: [
            <Line key="a">📨 Report <b>#128</b> claimed by <b>@sara.k</b> · +2 points</Line>,
            <Embed key="b" title="Weekly promotions" accent="#8b5cf6">3 staff reached the target · <b>@nour</b> → Moderator II</Embed>,
            <Line key="c">⚠️ Staff warning 1/3 for <b>@khaled99</b>: missed shift</Line>,
        ],
    },
    {
        key: 'ticket', name: 'Robtic Ticket', accent: '#10b981', channel: 'open-a-ticket',
        tagline: 'Ticket panels, private channels and transcripts',
        text: 'Ticket panels you design yourself. Each ticket opens a private channel with its own form and staff controls, and a full transcript when it closes.',
        features: ['Panels', 'Forms', 'Claim & close', 'Permissions', 'Transcripts', 'Templates'],
        messages: [
            <Embed key="a" title="Need a hand?" accent="#10b981">Pick what your ticket is about.<span className="rx-ds-btns"><i>🎫 Support</i><i>🚨 Report</i><i>💳 Purchases</i></span></Embed>,
            <Line key="b">🎫 <b>#ticket-129</b> opened by <b>@mariam</b></Line>,
            <Line key="c">📄 Transcript saved · 32 messages</Line>,
        ],
    },
    {
        key: 'music', name: 'Robtic Music', accent: '#f43f5e', channel: 'Lounge',
        tagline: 'Music bots for your voice channels',
        text: 'Up to ten music bots per server: each stays in its own voice channel or follows the music, with a control panel and text commands.',
        features: ['Up to 10 bots', 'Fixed or roaming', 'Queue', 'Control panel', 'Text commands'],
        messages: [
            <Embed key="a" title="Now playing" accent="#f43f5e">Lofi beats to code to · 🔊 Lounge<Progress value={42} /><span className="rx-ds-btns"><i>⏮</i><i>⏸</i><i>⏭</i><i>🔁</i></span></Embed>,
            <Line key="b">➕ <b>@yousef</b> added 3 songs to the queue</Line>,
        ],
    },
];

const TEXT_CHANNELS = ['welcome', 'general', 'level-ups', 'staff-reports', 'open-a-ticket'];
/** Real pictures from the Robtic pack (public/rl/robtic/site/discord/). */
const IMG = (name: string) => `/rl/robtic/site/discord/${name}.webp`;
const MEMBERS = [['layla', 'm-1'], ['omar_dev', 'm-2'], ['sara.k', 'm-3'], ['yousef', 'm-4'], ['nour', 'm-5']] as const;
const Av = ({ src, className }: { src: string; className?: string }) => <img className={className} src={src} alt="" width={48} height={48} loading="lazy" decoding="async" />;

function Embed({ title, accent, children }: { title: string; accent: string; children: ReactNode }) {
    return <div className="rx-ds-emb" style={{ ['--accent' as string]: accent }}><b>{title}</b><div>{children}</div></div>;
}
function Line({ children }: { children: ReactNode }) {
    return <p className="rx-ds-line">{children}</p>;
}
function Progress({ value }: { value: number }) {
    return <i className="rx-ds-prog"><s style={{ width: `${value}%` }} /></i>;
}

export default function DiscordStory({ addHref, discordMark }: { addHref: string; discordMark: string }) {
    const ref = useRef<HTMLElement>(null);
    // 0: before joining; 1: joined, the server's own welcome; 2..5: one bot each.
    const [step, setStep] = useState(0);
    const STEPS = BOTS.length + 2;

    useEffect(() => {
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const el = ref.current;
                if (!el) return;
                const box = el.getBoundingClientRect();
                const run = el.offsetHeight - window.innerHeight;
                const progress = run > 0 ? Math.min(1, Math.max(0, -box.top / run)) : 0;
                // How far the server has opened up (0 at the top, 1 once the first step is scrolled): the card
                // grows from its own width to nearly the whole screen with it, smoothly, frame by frame.
                el.style.setProperty('--open', String(Math.min(1, progress * STEPS).toFixed(3)));
                setStep(Math.min(STEPS - 1, Math.floor(progress * STEPS)));
            });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, [STEPS]);

    /** Scrolls to a step (the dots and the Join button). */
    const goTo = (n: number) => {
        const el = ref.current;
        if (!el) return;
        const run = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: el.offsetTop + (run * (n + 0.5)) / STEPS, behavior: 'smooth' });
    };

    const bot = step >= 2 ? BOTS[step - 2]! : null;
    const joined = step >= 1;
    const style = { ['--steps' as string]: STEPS, ['--accent' as string]: bot?.accent ?? '#5865f2' } as CSSProperties;

    return (
        <section ref={ref} className="rx-ds" style={style} data-step={step} aria-label="Robtic Discord bots">
            <div className="rx-ds-pin">
                <div className="rx-ds-bg" aria-hidden="true"><i /><i /><i /></div>

                <header className={`rx-ds-title${step > 0 ? ' is-small' : ''}`}>
                    <span className="rx-kicker">Robtic Discord</span>
                    <h1>Bots your server <span>actually needs</span>.</h1>
                    <p className="lead">Levels and moderation, a staff team, tickets and music, set up from one dashboard in English or Arabic.</p>
                    <div className="rx-ds-ctas">
                        <a className="rx-d-add" href={addHref}>
                            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d={discordMark} /></svg>
                            Add to Discord
                        </a>
                        <a className="btn btn-ghost btn-lg" href="#how">How it works</a>
                    </div>
                </header>

                {/* The server. Decorative: everything it shows is also said in the page's text. */}
                <div className="rx-ds-card" aria-hidden="true">
                    <div className="rx-ds-rail">
                        <i className="home"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d={discordMark} /></svg></i>
                        <span className="sep" />
                        <i className={`srv${joined ? ' on' : ''}`}><Av src={IMG('server-community')} /></i>
                        <i className="img"><Av src={IMG('server-log')} /></i>
                        <i className="img"><Av src={IMG('server-shop')} /></i>
                        <i className="img"><Av src={IMG('server-guard')} /></i>
                        <i className="add">+</i>
                    </div>

                    <div className="rx-ds-side">
                        <div className="rx-ds-srv"><b>Robtic Community</b><small>12,840 members</small></div>
                        <p className="rx-ds-cat">Text channels</p>
                        {TEXT_CHANNELS.map((c) => (
                            <span key={c} className={`rx-ds-ch${(bot?.channel ?? (joined ? 'welcome' : '')) === c ? ' on' : ''}`}># {c}</span>
                        ))}
                        <p className="rx-ds-cat">Voice channels</p>
                        <span className={`rx-ds-ch voice${bot?.key === 'music' ? ' on' : ''}`}>🔊 Lounge</span>
                        <div className={`rx-ds-voice${bot?.key === 'music' ? ' live' : ''}`}>
                            <span><Av src={IMG('bot-music')} />Robtic Music</span>
                            <span><Av src={IMG('m-1')} />layla</span>
                            <span><Av src={IMG('m-4')} />yousef</span>
                        </div>
                        <span className="rx-ds-ch voice">🔊 Staff room</span>
                    </div>

                    <div className="rx-ds-chat">
                        <div className="rx-ds-head"># {bot ? bot.channel.replace('Lounge', 'music') : 'welcome'}</div>
                        <div className="rx-ds-msgs" key={step}>
                            {!joined ? (
                                <div className="rx-ds-invite">
                                    <Av className="rx-ds-inv-ic" src={IMG('server-community')} />
                                    <b>You’ve been invited to join</b>
                                    <strong>Robtic Community</strong>
                                    <small><i className="on" />1,204 online · <i />12,840 members</small>
                                    <button type="button" tabIndex={-1} onClick={() => goTo(1)}>Join server</button>
                                    <em>Scroll to join</em>
                                </div>
                            ) : !bot ? (
                                <>
                                    <div className="rx-ds-sys">→ <b>You</b> joined the server. Say hi! 👋</div>
                                    <div className="rx-ds-msg" style={{ ['--accent' as string]: '#5865f2' }}>
                                        <Av className="av" src={IMG('server-community')} />
                                        <div><p className="who">Robtic Community</p><Line>Welcome! Meet the bots that run this server. Keep scrolling.</Line></div>
                                    </div>
                                </>
                            ) : (
                                bot.messages.map((m, i) => (
                                    <div className="rx-ds-msg" key={i} style={{ ['--accent' as string]: bot.accent, ['--i' as string]: i }}>
                                        <Av className="av" src={IMG(`bot-${bot.key}`)} />
                                        <div><p className="who">{bot.name} <em>APP</em></p>{m}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="rx-ds-input">Message #{bot ? bot.channel.replace('Lounge', 'music') : 'welcome'}</div>
                    </div>

                    <div className="rx-ds-members">
                        <p className="rx-ds-cat">Bots — {BOTS.length}</p>
                        {BOTS.map((b) => (
                            <span key={b.key} className={`rx-ds-mem bot${bot?.key === b.key ? ' on' : ''}`} style={{ ['--accent' as string]: b.accent }}>
                                <span className="mav"><Av src={IMG(`bot-${b.key}`)} /></span>{b.name}<em>APP</em>
                            </span>
                        ))}
                        <p className="rx-ds-cat">Online — {MEMBERS.length + (joined ? 1 : 0)}</p>
                        {joined ? <span className="rx-ds-mem you"><span className="mav"><Av src={IMG('you')} /></span>You</span> : null}
                        {MEMBERS.map(([m, pic]) => <span key={m} className="rx-ds-mem"><span className="mav"><Av src={IMG(pic)} /></span>{m}</span>)}
                    </div>

                    {/* The bot's profile card, Discord-style, opening over the member list. */}
                    {bot ? (
                        <div className="rx-ds-profile" key={bot.key} style={{ ['--accent' as string]: bot.accent }}>
                            <div className="banner"><img src={IMG('banner')} alt="" width={640} height={360} /></div>
                            <span className="pav"><Av src={IMG(`bot-${bot.key}`)} /><i /></span>
                            <div className="pbody">
                                <b>{bot.name} <em>APP</em></b>
                                <small>{bot.tagline}</small>
                                <p className="ph">About me</p>
                                <p>{bot.text}</p>
                                <p className="ph">Features</p>
                                <div className="roles">{bot.features.map((f, i) => <span key={f} style={{ ['--i' as string]: i }}><i />{f}</span>)}</div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <nav className="rx-ds-dots" aria-label="Bots">
                    {BOTS.map((b, i) => (
                        <button key={b.key} type="button" className={step === i + 2 ? 'on' : ''} style={{ ['--accent' as string]: b.accent }} onClick={() => goTo(i + 2)}>
                            <i />{b.name.replace('Robtic ', '')}
                        </button>
                    ))}
                </nav>
            </div>

            {/* The same story as text, for screen readers and search engines. */}
            <ul className="sr-only">
                {BOTS.map((b) => <li key={b.key}><b>{b.name}</b>: {b.text} Features: {b.features.join(', ')}.</li>)}
            </ul>
        </section>
    );
}
