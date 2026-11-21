'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Boxes, Database, FolderUp, Globe2, KeyRound, Users } from 'lucide-react';
import HeroCta from '../HeroCta';
import { afterBoot } from '../after-boot';

// Robtic Hosting, in a world of its own: calm black, a serif voice for the headlines, and the product itself (its
// console, its code, its panel) as the pictures. Code first, few words. Loops are short (2.5 to 4 s) and rest under
// reduced motion; the tabs are clicked, never timed.

/** Syntax colours for the code samples. */
const Kx = ({ children }: { children: ReactNode }) => <span className="k">{children}</span>;
const Sx = ({ children }: { children: ReactNode }) => <span className="s">{children}</span>;
const Fx = ({ children }: { children: ReactNode }) => <span className="f">{children}</span>;
const Vx = ({ children }: { children: ReactNode }) => <span className="v">{children}</span>;
const Cx = ({ children }: { children: ReactNode }) => <span className="c">{children}</span>;

export interface HostingPlanCard { key: string; name: string; price: string; rows: [string, string][]; free: boolean }

const CODE: Record<string, { file: string; lang: string; lines: ReactNode[] }> = {
    'discord.js': {
        file: 'index.js', lang: 'JavaScript',
        lines: [
            <><Kx>const</Kx> {'{'} Client, GatewayIntentBits {'}'} = <Fx>require</Fx>(<Sx>'discord.js'</Sx>);</>,
            <><Kx>const</Kx> client = <Kx>new</Kx> <Fx>Client</Fx>({'{'} intents: [GatewayIntentBits.Guilds] {'}'});</>,
            <></>,
            <>client.<Fx>once</Fx>(<Sx>'ready'</Sx>, () =&gt; console.<Fx>log</Fx>(<Sx>`${'{'}client.user.tag{'}'} is online`</Sx>));</>,
            <>client.<Fx>login</Fx>(process.env.<Vx>DISCORD_TOKEN</Vx>);</>,
        ],
    },
    'discord.py': {
        file: 'main.py', lang: 'Python',
        lines: [
            <><Kx>import</Kx> os, discord</>,
            <></>,
            <>client = discord.<Fx>Client</Fx>(intents=discord.Intents.<Fx>default</Fx>())</>,
            <></>,
            <>@client.event</>,
            <><Kx>async def</Kx> <Fx>on_ready</Fx>():</>,
            <>    <Fx>print</Fx>(<Sx>f"{'{'}client.user{'}'} is online"</Sx>)</>,
            <></>,
            <>client.<Fx>run</Fx>(os.environ[<Sx>"DISCORD_TOKEN"</Sx>])</>,
        ],
    },
    TypeScript: {
        file: 'index.ts', lang: 'TypeScript',
        lines: [
            <><Kx>import</Kx> {'{'} Client, Events {'}'} <Kx>from</Kx> <Sx>'discord.js'</Sx>;</>,
            <></>,
            <><Kx>const</Kx> client = <Kx>new</Kx> <Fx>Client</Fx>({'{'} intents: [<Sx>'Guilds'</Sx>] {'}'});</>,
            <>client.<Fx>once</Fx>(Events.ClientReady, (c) =&gt; console.<Fx>log</Fx>(<Sx>`${'{'}c.user.tag{'}'} is online`</Sx>));</>,
            <><Kx>await</Kx> client.<Fx>login</Fx>(process.env.<Vx>DISCORD_TOKEN</Vx>);</>,
        ],
    },
    Bun: {
        file: 'server.ts', lang: 'Bun',
        lines: [
            <><Cx>// An API next to your bot, on your own domain.</Cx></>,
            <>Bun.<Fx>serve</Fx>({'{'}</>,
            <>  port: <Vx>3000</Vx>,</>,
            <>  <Fx>fetch</Fx>: () =&gt; Response.<Fx>json</Fx>({'{'} status: <Sx>'ok'</Sx> {'}'}),</>,
            <>{'}'});</>,
        ],
    },
};
const LANGS = Object.keys(CODE);

const PANEL_TABS = ['Workspaces', 'Console', 'Editor', 'Databases'] as const;
type PanelTab = (typeof PANEL_TABS)[number];

const GRID = [
    { icon: Globe2, title: 'Your own domain', text: 'A web address for every app, or your own domain with HTTPS.' },
    { icon: KeyRound, title: 'Encrypted secrets', text: 'Environment variables encrypted; an uploaded .env moves into them.' },
    { icon: Database, title: 'MongoDB and Redis', text: 'A database or a cache in one click, already in your app’s environment.' },
    { icon: Users, title: 'Teams', text: 'Owners, admins, managers and members, each with the workspaces they need.' },
    { icon: Boxes, title: 'Shared resources', text: 'Each workspace gets its memory, CPU and storage; its apps share it.' },
    { icon: FolderUp, title: 'Files and SFTP', text: 'Upload whole folders in the browser, or connect over SFTP.' },
];

function WinBar({ title }: { title: string }) {
    return <div className="rh-win" aria-hidden="true"><i /><i /><i /><span>{title}</span></div>;
}

export default function HostingLanding({ appHref, plans }: { appHref: string; plans: HostingPlanCard[] }) {
    const root = useRef<HTMLDivElement>(null);
    const [lang, setLang] = useState(LANGS[0]!);
    const [tab, setTab] = useState<PanelTab>('Workspaces');

    useEffect(() => {
        const el = root.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        el.dataset.motion = 'on';
        return afterBoot(() => { el.dataset.entered = 'on'; });
    }, []);

    const code = CODE[lang]!;
    return (
        <div className="rh" ref={root}>
            {/* -------------------------------------------------------------------------------------------- hero */}
            <section className="rh-hero" aria-labelledby="rh-title">
                <div className="rh-beam" aria-hidden="true" />
                <div className="wrap rh-hero-in">
                    <div className="rh-hero-txt">
                        <h1 id="rh-title">Hosting for Discord bots <em>and the apps around them.</em></h1>
                        <p>Upload your code or bring it from GitHub, press Start, and watch it come online in a live console. Your first month is free.</p>
                        <div className="rh-ctas">
                            <HeroCta label="Start hosting free" href={appHref} signedInLabel="Open Hosting" signedInHref={appHref} />
                            <a className="rh-link" href="/hosting/plans">See the plans <ArrowRight size={15} aria-hidden="true" /></a>
                        </div>
                    </div>
                    <div className="rh-term" aria-hidden="true">
                        <WinBar title="my-bot · console" />
                        <pre>
                            <span className="t t1"><b>$</b> bun start</span>
                            <span className="t t2 dim">Installing packages… done in 1.4s</span>
                            <span className="t t3 dim">Logging in to Discord…</span>
                            <span className="t t4 ok">● my-bot#0420 is online in 3 servers</span>
                            <span className="t t5 caret"><b>$</b> </span>
                        </pre>
                        <div className="rh-term-foot"><span><i /> Running</span><span>256 MB · 0.15 vCPU</span></div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------------------------------- your code */}
            <section className="rh-sec rh-code" aria-labelledby="rh-code-title">
                <div className="wrap">
                    <h2 id="rh-code-title" className="rh-h2">Bring the bot <em>you already have.</em></h2>
                    <p className="rh-sub">Upload it, start from a ready Discord bot, or clone it from GitHub. Whatever it’s written in.</p>
                    <div className="rh-editor">
                        <div className="rh-tabs" role="tablist" aria-label="Language">
                            {LANGS.map((l) => (
                                <button key={l} type="button" role="tab" aria-selected={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l}</button>
                            ))}
                            <span className="rh-file">{code.file}</span>
                        </div>
                        <pre className="rh-src" key={lang}>
                            {code.lines.map((line, i) => <span key={i} style={{ ['--i' as string]: i }}><em>{i + 1}</em>{line}{'\n'}</span>)}
                        </pre>
                        <div className="rh-out"><i /> {lang === 'Bun' ? 'Listening on https://api.example.com' : 'my-bot#0420 is online'}</div>
                    </div>
                </div>
            </section>

            {/* -------------------------------------------------------------------------------------- live cards */}
            <section className="rh-sec" aria-labelledby="rh-live-title">
                <div className="wrap">
                    <h2 id="rh-live-title" className="rh-h2">It runs. <em>You’ll know if it stops.</em></h2>
                    <div className="rh-cards">
                        <article className="rh-card">
                            <div className="rh-vis rh-logs" aria-hidden="true">
                                <div className="rh-logs-run">
                                    {['[ready] my-bot#0420 online', '[cmd] /rank by robo', '[cmd] /ticket by patrike', '[voice] joined Lounge', '[cmd] /play by 3mar', '[ready] shard 0 heartbeat 42ms'].concat(['[ready] my-bot#0420 online', '[cmd] /rank by robo', '[cmd] /ticket by patrike']).map((l, i) => <span key={i}>{l}</span>)}
                                </div>
                            </div>
                            <h3>Live console</h3>
                            <p>Start, stop and restart, type commands and read the logs as they happen.</p>
                        </article>
                        <article className="rh-card">
                            <div className="rh-vis rh-alerts" aria-hidden="true">
                                <div className="rh-alert bad"><b>my-bot stopped</b><small>exit code 1 · 14:02</small></div>
                                <div className="rh-alert good"><b>my-bot restarted</b><small>online again · 14:02</small></div>
                                <div className="rh-alert"><b>Backup finished</b><small>my-bot · 12 MB · 15:00</small></div>
                            </div>
                            <h3>Alerts in your Discord</h3>
                            <p>Crashes, restarts and backups, posted in a channel you choose.</p>
                        </article>
                        <article className="rh-card">
                            <div className="rh-vis rh-backups" aria-hidden="true">
                                {[['Today, 15:00', '12 MB'], ['Yesterday, 15:00', '12 MB'], ['Nov 19, 15:00', '11 MB']].map(([when, size], i) => (
                                    <div key={when} className="rh-bk"><span>{when}</span><small>{size}</small><em>{i === 0 ? 'Restore' : 'Download'}</em></div>
                                ))}
                            </div>
                            <h3>Backups and schedules</h3>
                            <p>Copies to restore or download, made by hand or on a schedule.</p>
                        </article>
                        <article className="rh-card">
                            <div className="rh-vis rh-deploy" aria-hidden="true">
                                <div className="rh-commit"><span className="rh-branch">main</span><b>fix: reply to /ping</b><small>a3f9c21</small></div>
                                <div className="rh-steps"><span className="s1">Pulled</span><span className="s2">Installed</span><span className="s3">Live</span></div>
                            </div>
                            <h3>Deploy from GitHub</h3>
                            <p>Clone a repository, then deploy again in one click when it changes.</p>
                        </article>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------------------------------------------------- panel */}
            <section className="rh-sec" aria-labelledby="rh-panel-title">
                <div className="wrap">
                    <h2 id="rh-panel-title" className="rh-h2">One panel <em>for all of it.</em></h2>
                    <div className="rh-ptabs" role="tablist" aria-label="Panel">
                        {PANEL_TABS.map((t) => (
                            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
                        ))}
                    </div>
                    <div className="rh-panel">
                        <WinBar title="robtic.org/hosting/dashboard" />
                        <div className="rh-panel-body" key={tab}>
                            {tab === 'Workspaces' ? (
                                <img src="/rl/robtic/site/panel.webp" alt="A Robtic Hosting workspace: three Discord bots with their backups and SFTP" width={1600} height={645} loading="lazy" />
                            ) : tab === 'Console' ? (
                                <pre className="rh-pconsole">
                                    <span className="dim">[robtic] starting index.js</span>{'\n'}
                                    <span className="dim">Logging in to Discord…</span>{'\n'}
                                    <span className="ok">● music-bot#1182 is online in 5 servers</span>{'\n'}
                                    <span>[voice] joined Lounge · queue 3 songs</span>{'\n'}
                                    <span>[cmd] /play lofi beats by 3mar</span>{'\n'}
                                    <span className="caret"><b>›</b> </span>
                                </pre>
                            ) : tab === 'Editor' ? (
                                <div className="rh-peditor">
                                    <div className="rh-files"><b>Files</b><span className="on">index.js</span><span>package.json</span><span>commands/</span><span>.env → secrets</span></div>
                                    <pre className="rh-src">
                                        {CODE['discord.js']!.lines.map((line, i) => <span key={i}><em>{i + 1}</em>{line}{'\n'}</span>)}
                                    </pre>
                                </div>
                            ) : (
                                <div className="rh-pdb">
                                    {[['MongoDB', 'shop-bot', '3 collections · 48 MB'], ['Redis', 'music-bot', 'cache · 1.2k keys'], ['MongoDB', 'moderation', '5 collections · 112 MB']].map(([kind, app, size]) => (
                                        <div key={app} className="rh-dbrow"><Database size={18} aria-hidden="true" /><b>{kind}</b><span>{app}</span><small>{size}</small><i>Connected</i></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* -------------------------------------------------------------------------------------------- grid */}
            <section className="rh-sec" aria-labelledby="rh-grid-title">
                <div className="wrap">
                    <h2 id="rh-grid-title" className="rh-h2">And the parts <em>you’d rather not build.</em></h2>
                    <ul className="rh-grid">
                        {GRID.map(({ icon: Icon, title, text }) => (
                            <li key={title}><Icon size={20} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ------------------------------------------------------------------------------------------- plans */}
            <section className="rh-sec" id="plans" aria-labelledby="rh-plans-title">
                <div className="wrap">
                    <h2 id="rh-plans-title" className="rh-h2">Start free. <em>Grow when your bots do.</em></h2>
                    <div className="rh-plans">
                        {plans.map((p) => (
                            <a className={`rh-plan${p.free ? ' free' : ''}`} href={`/hosting/plans#plan-${p.key}`} key={p.key}>
                                <b>{p.name}</b>
                                <span className="rh-price">{p.price}</span>
                                <ul>{p.rows.map(([l, v]) => <li key={l}><span>{l}</span><span>{v}</span></li>)}</ul>
                            </a>
                        ))}
                    </div>
                    <a className="rh-link rh-more" href="/hosting/plans">Compare every plan <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
            </section>

            {/* ------------------------------------------------------------------------------------------- close */}
            <section className="rh-close" aria-labelledby="rh-close-title">
                <h2 id="rh-close-title">Your bot is ready. <em>Give it a home.</em></h2>
                <div className="rh-ctas">
                    <HeroCta label="Start hosting free" href={appHref} signedInLabel="Open Hosting" signedInHref={appHref} />
                    <a className="rh-link" href="/hosting/plans">See the plans <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
            </section>
        </div>
    );
}
