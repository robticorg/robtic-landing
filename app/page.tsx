import type { Metadata } from 'next';
import { ArrowRight, Globe2, KeyRound, Layers, UserRound } from 'lucide-react';
import { ORIGIN } from '@/lib/site';
import { ROBTIC_FAQ } from '@/lib/faqs';
import { SERVICES, SERVICE_ORDER } from '@/lib/services';
import WaveLoop from './WaveLoop';
import HeroCta from './HeroCta';
import Faq from './Faq';

// The home page is about Robtic itself: who we are and what we make. Each service has its own landing page
// (/hosting, /discord) with its own words, plans and terms; this page only introduces them.

export const metadata: Metadata = {
    title: 'Robtic: software for Discord builders and communities',
    description:
        'Robtic makes tools for people who build and run Discord communities: Robtic Hosting for your own bots and apps, ' +
        'and Robtic Discord, ready-made bots set up from a web dashboard. One account for every service.',
    alternates: { canonical: '/' },
};

const POINTS = [
    { icon: UserRound, title: 'One account', text: 'Sign in once with email, a passkey, GitHub or Discord, and use every Robtic service with it.' },
    { icon: Layers, title: 'You choose the services', text: 'Nothing starts by itself. Each service opens with its own terms the first time you use it.' },
    { icon: Globe2, title: 'In your browser', text: 'No installs. Everything is run from a web page, on a computer or on your phone.' },
    { icon: KeyRound, title: 'Secure by default', text: 'Two-factor authentication, passkeys, recovery codes and a list of your signed-in devices.' },
];

export default function Home() {
    // Robtic's services, for search engines: each is its own part of the site.
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Robtic services',
        itemListElement: SERVICE_ORDER.map((k, i) => ({
            '@type': 'ListItem', position: i + 1, name: SERVICES[k].name, url: `${ORIGIN}${SERVICES[k].path}`,
        })),
    };
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
            <WaveLoop />
            <section className="sky">
                <div className="stars" />
                <div className="cloud c1" />
                <div className="cloud c2" />
                <div className="cloud c3" />

                <div className="wrap hero">
                    <h1>Tools for the people who <span>build on Discord</span>.</h1>
                    <p className="lead">
                        Robtic makes software for Discord builders and communities. Create one account, then start the
                        services you need: hosting for your own bots and apps, or our ready-made bots for your server.
                    </p>
                    <div className="ctas">
                        <HeroCta label="Create your Robtic account" href="/auth/register" signedInLabel="Choose a service" signedInHref="#services" />
                        <a className="btn btn-ghost btn-lg" href="#services">See our services</a>
                    </div>
                </div>

                {/* The services, rising out of the sky: each card goes to that service's own page. */}
                <div className="wrap rx-services" id="services">
                    {SERVICE_ORDER.map((k) => {
                        const s = SERVICES[k];
                        return (
                            <article className={`rx-svc rx-svc-${k}`} key={k}>
                                <a className="rx-svc-shot" href={s.path} tabIndex={-1} aria-hidden="true">
                                    <img src={s.image} alt="" width={1290} height={726} loading="eager" />
                                </a>
                                <div className="rx-svc-body">
                                    <span className="rx-kicker">{s.name}</span>
                                    <h2><a href={s.path}>{s.tagline}</a></h2>
                                    <p>{s.text}</p>
                                    <div className="rx-svc-links">
                                        <a className="btn btn-primary" href={s.path}>Explore {s.name.replace('Robtic ', '')} <ArrowRight size={16} aria-hidden="true" /></a>
                                        <a className="btn btn-ghost" href={s.app}>Open it</a>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <div className="wave" data-wave style={{ ['--from' as string]: 'var(--bg)', ['--to' as string]: 'var(--bg-2)' }} aria-hidden="true">
                <svg viewBox="0 0 1440 110" preserveAspectRatio="none"><path className="w2" /><path className="w1" /><path className="wl" /></svg>
            </div>

            <section className="block rx-band" id="account">
                <div className="wrap reveal">
                    <span className="pill">Your account</span>
                    <h2>One Robtic account, your choice of services</h2>
                    <p className="sub">Your account is yours alone. Services are added to it only when you start them.</p>
                    <div className="rx-points">
                        {POINTS.map(({ icon: Icon, title, text }) => (
                            <div className="rx-point" key={title}>
                                <span className="rx-point-ic"><Icon size={20} aria-hidden="true" /></span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="wave" data-wave style={{ ['--from' as string]: 'var(--bg-2)', ['--to' as string]: 'var(--bg)' }} aria-hidden="true">
                <svg viewBox="0 0 1440 110" preserveAspectRatio="none"><path className="w2" /><path className="w1" /><path className="wl" /></svg>
            </div>

            <section className="block faq-sec" id="faq">
                <div className="wrap reveal">
                    <div className="faq-head">
                        <span className="pill">FAQ</span>
                        <h2>Questions, answered</h2>
                        <p className="sub">About Robtic and your account. Each service answers its own on its page.</p>
                    </div>
                    <Faq items={ROBTIC_FAQ} limit={6} moreHref="/faq" />
                </div>
            </section>
        </>
    );
}
