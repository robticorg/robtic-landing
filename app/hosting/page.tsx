import type { Metadata } from 'next';
import Script from 'next/script';
import { Boxes, Cable, Rocket } from 'lucide-react';
import { ORIGIN } from '@/lib/site';
import { getSiteData, landingFaq, priceMap, type LandingFeature } from '@/lib/site-data';
import { asset } from '@/lib/asset';
import { BUILTIN_FEATURES, SHOTS } from '@/lib/features';
import { PLANS, limitRows } from '@/lib/plans';
import { SERVICES } from '@/lib/services';
import HeroCta from '../HeroCta';
import Faq from '../Faq';

// Robtic Hosting's own page: what used to be the home page's hosting story, in a look of its own (a console instead
// of the sky). Starting Hosting happens in the app (/hosting/dashboard): sign-in, then Hosting's terms the first time.

const S = SERVICES.hosting;

export const metadata: Metadata = {
    title: 'Robtic Hosting: host Discord bots, websites and APIs',
    description:
        'Robtic Hosting runs your Discord bots (discord.js, discord.py, TypeScript), websites and APIs from the browser: ' +
        'workspaces, live console, code editor, MongoDB and Redis, backups, GitHub and your own domain. First month free.',
    alternates: { canonical: '/hosting' },
    openGraph: { title: 'Robtic Hosting', url: `${ORIGIN}/hosting` },
};

const STEPS = [
    { icon: Boxes, title: 'Start Hosting', text: 'Sign in with your Robtic account and accept Hosting’s terms. Your first month is free.' },
    { icon: Cable, title: 'Bring your code', text: 'Upload your files, pick a ready Discord bot template, or clone a repository from GitHub.' },
    { icon: Rocket, title: 'It runs', text: 'Start it and watch the live console. Robtic keeps it running and tells you when something stops.' },
];

const STACK = ['discord.js', 'discord.py', 'TypeScript', 'Node.js', 'Python', 'Bun', 'MongoDB', 'Redis'];

export default async function HostingPage() {
    const site = await getSiteData();
    const faq = landingFaq(site);
    const prices = priceMap(site);
    const features: LandingFeature[] = site?.landing?.features?.length
        ? site.landing.features
        : BUILTIN_FEATURES.map(([file, title, text]) => ({
            title,
            text,
            image: `/rl/robtic/site/features/${file}.webp`,
            alt: SHOTS.includes(file) ? `${title}: a screenshot of Robtic Hosting` : `${title}: an illustration`,
        }));
    const plans = PLANS.filter((p) => p.group === 'individual');

    const ld = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${ORIGIN}/hosting#service`,
        name: S.name,
        serviceType: 'Discord bot, website and API hosting',
        url: `${ORIGIN}/hosting`,
        description: metadata.description,
        provider: { '@id': `${ORIGIN}/#organization` },
        termsOfService: `${ORIGIN}${S.terms}`,
    };
    const crumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Robtic', item: `${ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: S.name, item: `${ORIGIN}/hosting` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ld, crumbs]) }} />

            <section className="rx-h-hero">
                <div className="rx-h-grid" aria-hidden="true" />
                <div className="wrap rx-h-in">
                    <div className="rx-h-copy">
                        <span className="rx-kicker">{S.name}</span>
                        <h1>Run your bots, <span>not the servers</span> under them.</h1>
                        <p className="lead">
                            Host Discord bots, websites and APIs straight from your browser: a live console, a code editor,
                            databases, backups and your own domain. The first month is free.
                        </p>
                        <div className="rx-h-ctas">
                            <HeroCta label="Start hosting free" href={S.app} signedInLabel="Open Hosting" signedInHref={S.app} />
                            <a className="btn btn-ghost btn-lg" href="/hosting/plans">See the plans</a>
                        </div>
                        <ul className="rx-stack" aria-label="What you can run">
                            {STACK.map((t) => <li key={t}>{t}</li>)}
                        </ul>
                    </div>

                    {/* A workspace, the way the panel draws it: apps and what they use, joined on a canvas, with a
                        console in front. Decorative: the real thing is the screenshot below. */}
                    <div className="rx-canvas" aria-hidden="true">
                        <svg className="rx-wires" viewBox="0 0 520 400" preserveAspectRatio="none">
                            <path d="M150 92 C 250 92, 250 60, 360 60" />
                            <path d="M150 92 C 240 92, 230 200, 340 200" />
                            <path d="M150 92 C 200 160, 120 230, 120 290" />
                            <path d="M360 60 C 420 60, 430 130, 430 150" />
                            <path d="M340 200 C 380 240, 390 290, 400 320" />
                        </svg>
                        <div className="rx-node n-bot"><i className="on" /><b>my-bot</b><small>discord.js · online</small><span className="rx-spark"><s /><s /><s /><s /><s /><s /><s /></span></div>
                        <div className="rx-node n-api"><i className="on" /><b>dashboard-api</b><small>Bun · 2 instances</small></div>
                        <div className="rx-node n-db"><i className="on" /><b>MongoDB</b><small>3 collections · 48 MB</small></div>
                        <div className="rx-node n-cache"><i className="on" /><b>Redis</b><small>cache · 1.2k keys</small></div>
                        <div className="rx-node n-backup"><i className="wait" /><b>Backups</b><small>daily · next in 4h</small></div>
                        <div className="rx-node n-domain"><i className="on" /><b>bot.example.com</b><small>HTTPS · your domain</small></div>
                        <div className="rx-term">
                            <div className="rx-term-bar"><i /><i /><i /><span>my-bot · console</span></div>
                            <pre>
                                <span className="l l1"><b>$</b> bun start</span>
                                <span className="l l2 dim">Logging in to Discord…</span>
                                <span className="l l3 live">● my-bot#0420 is online in 3 servers</span>
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="wrap rx-h-shot">
                    <img src={S.image} alt={S.imageAlt} width={1600} height={645} fetchPriority="high" />
                </div>
            </section>

            <div className="wave" data-wave style={{ ['--from' as string]: 'var(--bg)', ['--to' as string]: 'var(--bg-2)' }} aria-hidden="true">
                <svg viewBox="0 0 1440 110" preserveAspectRatio="none"><path className="w2" /><path className="w1" /><path className="wl" /></svg>
            </div>

            {/* The deck: the page holds still while scrolling slides the pictures along a wave; the middle one rises. */}
            <section className="deck" id="features">
                <div className="deck-stage">
                    <i className="deck-progress" aria-hidden="true"><s id="deck-bar" /></i>
                    <div className="wrap deck-head">
                        <small>Keep scrolling to see them all</small>
                        <div className="deck-title">
                            <span className="pill">{features.length} features</span>
                            <h2>Everything Hosting does</h2>
                        </div>
                    </div>
                    <div className="deck-track" id="deck-track">
                        {features.map((f, i) => (
                            <figure className="dk" tabIndex={0} key={`${i}-${f.title}`}>
                                <div className="dk-in">
                                    <img src={f.image} alt={f.alt || f.title} width={640} height={440} loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
                                    <figcaption>
                                        <h3>{f.title}</h3>
                                        <p>{f.text}</p>
                                    </figcaption>
                                </div>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            <div className="wave" data-wave style={{ ['--from' as string]: 'var(--bg-2)', ['--to' as string]: 'var(--bg)' }} aria-hidden="true">
                <svg viewBox="0 0 1440 110" preserveAspectRatio="none"><path className="w2" /><path className="w1" /><path className="wl" /></svg>
            </div>

            <section className="block" id="how">
                <div className="wrap reveal">
                    <span className="pill">How it works</span>
                    <h2>From code to online in three steps</h2>
                    <ol className="rx-steps">
                        {STEPS.map(({ icon: Icon, title, text }, i) => (
                            <li className="rx-step" key={title}>
                                <span className="rx-step-n">{i + 1}</span>
                                <span className="rx-point-ic"><Icon size={20} aria-hidden="true" /></span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="block rx-plans-sec" id="plans">
                <div className="wrap reveal">
                    <span className="pill">Plans</span>
                    <h2>A plan for every size</h2>
                    <p className="sub">Start on Personal, free for your first month. Move up when your project grows.</p>
                    <div className="rx-plans">
                        {plans.map((p) => (
                            <a className="rx-plan" href={`/hosting/plans#${p.key}`} key={p.key}>
                                <b>{p.name}</b>
                                <span className="rx-plan-price">{p.trialDays ? `Free for ${p.trialDays} days` : (prices[p.key] ?? 'Price soon')}</span>
                                <ul>
                                    {limitRows(p).slice(0, 3).map(([label, value]) => <li key={label}><span>{label}</span><span>{value}</span></li>)}
                                </ul>
                            </a>
                        ))}
                    </div>
                    <a className="more-link" href="/hosting/plans">Compare every plan</a>
                </div>
            </section>

            <section className="block faq-sec" id="faq">
                <div className="wrap reveal">
                    <div className="faq-head">
                        <span className="pill">FAQ</span>
                        <h2>Hosting questions</h2>
                        <p className="sub">The things people ask most before they start hosting.</p>
                    </div>
                    <Faq items={faq} limit={6} moreHref="/faq" />
                </div>
            </section>

            <Script src={asset('/rl/robtic/site/landing-deck.js')} strategy="afterInteractive" />
        </>
    );
}
