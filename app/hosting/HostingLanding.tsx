'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Archive, ArrowLeftRight, ArrowRight, Bot, Boxes, Database, FolderUp, Globe2, KeyRound, Users } from 'lucide-react';
import HeroCta from '../HeroCta';
import { afterBoot } from '../after-boot';
import TypeOnce from '../TypeOnce';

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

/* The Workspaces tab: a live workspace, the way the panel draws it. Apps are cards on a dotted canvas, linked to their
   backups, database and SFTP; running apps tick their CPU and memory, and moderation starts while you watch. */
type AppState = 'Running' | 'Starting…' | 'Stopped';
const APPS: { name: string; kind: string; mem: number }[] = [
    { name: 'music-bot', kind: 'Node.js Discord bot', mem: 256 },
    { name: 'shop-bot', kind: 'Python Discord bot', mem: 512 },
    { name: 'moderation', kind: 'Node.js Discord bot', mem: 256 },
];
const NODES = [
    { icon: Archive, title: 'Backups', sub: 'music-bot · 3 kept' },
    { icon: Database, title: 'MongoDB', sub: 'shop-bot · 48 MB' },
    { icon: ArrowLeftRight, title: 'SFTP', sub: 'moderation' },
];
function Workspace() {
    const [state, setState] = useState<AppState[]>(['Running', 'Running', 'Stopped']);
    const [load, setLoad] = useState<number[]>([22, 9, 0]);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setState(['Running', 'Running', 'Running']); setLoad([22, 9, 14]); return; }
        const a = window.setTimeout(() => setState((s) => [s[0]!, s[1]!, 'Starting…']), 1400);
        const b = window.setTimeout(() => setState((s) => [s[0]!, s[1]!, 'Running']), 3000);
        const t = window.setInterval(() => setLoad((l) => l.map((v) => Math.max(4, Math.min(64, Math.round(v + (Math.random() - 0.5) * 12))))), 1100);
        return () => { window.clearTimeout(a); window.clearTimeout(b); window.clearInterval(t); };
    }, []);
    const running = state.filter((x) => x === 'Running').length;
    return (
        <div className="rh-ws">
            <div className="rh-ws-head">
                <img src="/rl/robtic/icon-128.png" alt="" width={30} height={30} />
                <div><small>Workspaces</small><b>Robtic Bots</b></div>
                <span className="rh-ws-sum">{`${APPS.length} apps · ${running} running`}</span>
                <span className="rh-ws-new">+ New app</span>
            </div>
            <div className="rh-ws-canvas">
                <svg className="rh-ws-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M14 44 C14 58 12 62 12 72" /><path d="M41 44 C41 58 40 62 40 72" /><path d="M68 44 C68 58 70 62 70 72" />
                </svg>
                <div className="rh-ws-apps">
                    {APPS.map((a, i) => {
                        const st = state[i]!;
                        const on = st === 'Running';
                        const cpu = on ? load[i]! : 0;
                        const ram = on ? Math.round(a.mem * (cpu / 100 + 0.3)) : 0;
                        return (
                            <div key={a.name} className={`rh-app${on ? ' on' : st === 'Stopped' ? ' off' : ' busy'}`}>
                                <div className="rh-app-top"><Bot size={18} aria-hidden="true" /><b>{a.name}</b><span className="rh-app-st"><i />{st}</span></div>
                                <div className="rh-app-meters">
                                    <span>CPU</span><em><i style={{ width: `${cpu}%` }} /></em><small>{on ? `${cpu}%` : '–'}</small>
                                    <span>RAM</span><em><i style={{ width: `${on ? Math.round((ram / a.mem) * 100) : 0}%` }} /></em><small>{on ? `${ram} MB` : '–'}</small>
                                </div>
                                <div className="rh-app-foot"><span>{a.kind}</span><span>{`${a.mem} MB`}</span></div>
                            </div>
                        );
                    })}
                    <div className="rh-app rh-app-add"><span>+</span>New app</div>
                </div>
                <div className="rh-ws-nodes">
                    {NODES.map(({ icon: Icon, title, sub }) => <div key={title} className="rh-node"><Icon size={26} aria-hidden="true" /><b>{title}</b><small>{sub}</small></div>)}
                </div>
            </div>
        </div>
    );
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
                                <Workspace />
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
            <TypeOnce className="rh-close" id="rh-close-title" plain="Your bot is ready." em="Give it a home.">
                <div className="rh-ctas">
                    <HeroCta label="Start hosting free" href={appHref} signedInLabel="Open Hosting" signedInHref={appHref} />
                    <a className="rh-link" href="/hosting/plans">See the plans <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
            </TypeOnce>
        </div>
    );
}
