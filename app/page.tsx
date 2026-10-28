import type { Metadata } from 'next';
import Script from 'next/script';
import { PANEL_URL } from '@/lib/site';
import { getSiteData } from '@/lib/site-data';
import WaveLoop from './WaveLoop';

export const metadata: Metadata = {
    title: 'Robtic: Discord bot and app hosting, free for your first month',
    description:
        'Host Discord bots (discord.js, discord.py, TypeScript), websites and APIs, run from your browser. ' +
        'MongoDB and Redis on paid plans. First month free.',
    alternates: { canonical: '/' },
};

const panelRoot = PANEL_URL.replace(/\/panel$/, '');

// [image, title, text] — one picture each; the text shows on hover. Screenshots vs. illustrations differ in alt.
const SHOTS = ['workspaces', 'add', 'console', 'editor', 'teams', 'resources'];
const FEATURES: Array<[string, string, string]> = [
    ['workspaces', 'Workspaces', 'Apps, databases, backups, SFTP, schedules and alerts on one canvas, joined to what they belong to.'],
    ['add', 'Add anything', 'Upload your files, start from a ready Discord bot, or clone a repository from GitHub.'],
    ['console', 'Live console', 'Start, stop and restart, type commands and read the logs as they happen.'],
    ['editor', 'Code editor', 'Edit and save your code in the browser, upload whole folders, or use SFTP.'],
    ['teams', 'Teams', 'Owners, admins, managers and members, each with the workspaces they need.'],
    ['resources', 'Shared resources', 'Each workspace gets its share of memory, CPU and storage; its apps share it.'],
    ['databases', 'MongoDB and Redis', "A database or a cache in one click, its connection already in your apps' environment."],
    ['backups', 'Backups and schedules', 'Copies to restore or download, made by hand or on a schedule.'],
    ['alerts', 'Alerts on Discord', 'Crashes, restarts and backups, told in your own channel.'],
    ['github', 'GitHub', 'Clone, deploy again in one click, or put an app on GitHub for you.'],
    ['domains', 'Your own domain', 'A web address for every app, or your own domain with HTTPS.'],
    ['secrets', 'Encrypted secrets', 'Environment variables encrypted; an uploaded .env is moved into them.'],
];

export default async function Home() {
    // Hero words and the hero picture are owned by the panel (set in the admin console, stored in the DB); the
    // landing only reads them, cached via ISR. Each falls back to the built-in default when unset.
    const landing = (await getSiteData())?.landing;
    const heroTitle = landing?.hero_title?.trim();
    const heroSubtitle = landing?.hero_subtitle?.trim();
    const ctaLabel = landing?.cta_label?.trim() || 'Start free for a month';
    const heroImageUrl = landing?.images?.hero?.url?.trim();
    const screenSrc = heroImageUrl || '/rl/robtic/site/panel.webp';
    const screenAlt = heroImageUrl
        ? (landing?.images?.hero?.alt?.trim() || 'Robtic')
        : 'A Robtic workspace: three Discord bot apps on a canvas, with backups and SFTP linked to them';

    return (
        <>
            
            <WaveLoop />
<section className="sky">
                <div className="stars" />
                <div className="cloud c1" />
                <div className="cloud c2" />
                <div className="cloud c3" />

                <div className="wrap hero">
                    {heroTitle ? (
                        <h1>{heroTitle}</h1>
                    ) : (
                        <h1>Run your bots, <span>not the servers</span> under them.</h1>
                    )}
                    <p className="lead">
                        {heroSubtitle ||
                            'Robtic keeps your Discord bots and small Node.js or Python apps running. Upload them or bring them from GitHub, then watch them work from your browser.'}
                    </p>
                    <div className="ctas">
                        <a className="btn btn-primary btn-lg" href={`${panelRoot}/auth/register`}>{ctaLabel}</a>
                        <a className="btn btn-ghost btn-lg" href="#features">See the features</a>
                    </div>

                    {/* The panel, hanging in the sky; the robot peeks over its top edge. */}
                    <div className="hang">
                        <div className="swing">
                            <span className="rope left" aria-hidden="true" />
                            <span className="rope right" aria-hidden="true" />
                            <div className="shot">
                                <img className="peek" src="/rl/robtic/site/robot-peek.webp" alt="" aria-hidden="true" />
                                <div className="dots" aria-hidden="true"><i /><i /><i /></div>
                                <img className="screen" src={screenSrc} alt={screenAlt} width={1600} height={645} fetchPriority="high" />
                            </div>
                        </div>
                    </div>
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
                            <span className="pill">{FEATURES.length} features</span>
                            <h2>Everything it does</h2>
                        </div>
                    </div>
                    <div className="deck-track" id="deck-track">
                        {FEATURES.map(([file, title, text], i) => (
                            <figure className="dk" tabIndex={0} key={file}>
                                <div className="dk-in">
                                    <img
                                        src={`/rl/robtic/site/features/${file}.webp`}
                                        alt={SHOTS.includes(file) ? `${title}: a screenshot of the Robtic panel` : `${title}: an illustration`}
                                        width={640} height={440} loading={i < 4 ? 'eager' : 'lazy'} decoding="async"
                                    />
                                    <figcaption>
                                        <h3>{title}</h3>
                                        <p>{text}</p>
                                    </figcaption>
                                </div>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            <Script src="/rl/robtic/site/landing-deck.js" strategy="afterInteractive" />
        </>
    );
}
