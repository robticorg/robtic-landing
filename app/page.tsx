import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';
import { ROBTIC_FAQ } from '@/lib/faqs';
import { SERVICES, SERVICE_ORDER } from '@/lib/services';
import HomeLanding from './HomeLanding';
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
            <HomeLanding
                services={SERVICE_ORDER.map((k) => {
                    const s = SERVICES[k];
                    // The newest dashboard picture for Discord (the server home); Hosting's panel as it is.
                    return { key: k, name: s.name, path: s.path, app: s.app, tagline: s.tagline, text: s.text, shot: k === 'discord' ? '/rl/robtic/site/discord-home.webp' : s.image };
                })}
            />

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
