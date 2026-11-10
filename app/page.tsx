import type { Metadata } from 'next';
import Script from 'next/script';
import { PANEL_URL } from '@/lib/site';
import { getSiteData, landingFaq, type LandingFeature } from '@/lib/site-data';
import WaveLoop from './WaveLoop';
import HeroCta from './HeroCta';
import Faq from './Faq';
import { asset } from '@/lib/asset';
import { BUILTIN_FEATURES, SHOTS } from '@/lib/features';

export const metadata: Metadata = {
    title: 'Robtic: the platform for Discord builders — hosting, servers and bots',
    description:
        'Host Discord bots (discord.js, discord.py, TypeScript), websites and APIs, run game and app servers, and ' +
        'add our public bots — all from your browser. MongoDB and Redis on paid plans. First month free.',
    alternates: { canonical: '/' },
};

const panelRoot = PANEL_URL.replace(/\/panel$/, '');

export default async function Home() {
    // Hero words and the hero picture are owned by the panel (set in the admin console, stored in the DB); the
    // landing only reads them, cached via ISR. Each falls back to the built-in default when unset.
    const site = await getSiteData();
    const landing = site?.landing;
    const faq = landingFaq(site);
    const heroTitle = landing?.hero_title?.trim();
    const heroSubtitle = landing?.hero_subtitle?.trim();
    const ctaLabel = landing?.cta_label?.trim() || 'Start free for a month';
    const heroImageUrl = landing?.images?.hero?.url?.trim();
    const screenSrc = heroImageUrl || '/rl/robtic/site/panel.webp';
    const screenAlt = heroImageUrl
        ? (landing?.images?.hero?.alt?.trim() || 'Robtic')
        : 'A Robtic workspace: three Discord bot apps on a canvas, with backups and SFTP linked to them';
    const features: LandingFeature[] = landing?.features?.length
        ? landing.features
        : BUILTIN_FEATURES.map(([file, title, text]) => ({
            title,
            text,
            image: `/rl/robtic/site/features/${file}.webp`,
            alt: SHOTS.includes(file) ? `${title}: a screenshot of the Robtic panel` : `${title}: an illustration`,
        }));

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
                            'Robtic is where Discord builders ship: host your bots and apps, run servers, or add our ready-made bots — all from one account, straight from your browser.'}
                    </p>
                    <div className="ctas">
                        <HeroCta label={ctaLabel} />
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
                            <span className="pill">{features.length} features</span>
                            <h2>Everything it does</h2>
                        </div>
                    </div>
                    <div className="deck-track" id="deck-track">
                        {features.map((f, i) => (
                            <figure className="dk" tabIndex={0} key={`${i}-${f.title}`}>
                                <div className="dk-in">
                                    <img
                                        src={f.image}
                                        alt={f.alt || f.title}
                                        width={640} height={440} loading={i < 4 ? 'eager' : 'lazy'} decoding="async"
                                    />
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

            {/* Wave from the features (bg-2) into the FAQ (bg). */}
            <div className="wave" data-wave style={{ ['--from' as string]: 'var(--bg-2)', ['--to' as string]: 'var(--bg)' }} aria-hidden="true">
                <svg viewBox="0 0 1440 110" preserveAspectRatio="none"><path className="w2" /><path className="w1" /><path className="wl" /></svg>
            </div>

            {/* FAQ: the common questions, with the 3D question mark. Its own subtle tint; the first few here, all at /faq. */}
            <section className="block faq-sec" id="faq">
                <div className="wrap reveal">
                    <div className="faq-head">
                        <span className="pill">FAQ</span>
                        <h2>Questions, answered</h2>
                        <p className="sub">The things people ask most before they start. More on the full FAQ.</p>
                    </div>
                    <Faq items={faq} limit={5} moreHref="/faq" />
                </div>
            </section>

            <Script src={asset('/rl/robtic/site/landing-deck.js')} strategy="afterInteractive" />
        </>
    );
}
