import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';
import { getSiteData, landingFaq, priceMap } from '@/lib/site-data';
import { PLANS, limitRows } from '@/lib/plans';
import { SERVICES } from '@/lib/services';
import HostingLanding from './HostingLanding';
import Faq from '../Faq';

// Robtic Hosting's own page, in a world of its own: calm black, a serif voice, and the product (console, code, panel)
// as the pictures (HostingLanding.tsx). Starting Hosting happens in the app (/hosting/dashboard): sign-in, then Hosting's terms the first time.

const S = SERVICES.hosting;

export const metadata: Metadata = {
    title: 'Robtic Hosting: host Discord bots, websites and APIs',
    description:
        'Robtic Hosting runs your Discord bots (discord.js, discord.py, TypeScript), websites and APIs from the browser: ' +
        'workspaces, live console, code editor, MongoDB and Redis, backups, GitHub and your own domain. First month free.',
    alternates: { canonical: '/hosting' },
    openGraph: { title: 'Robtic Hosting', url: `${ORIGIN}/hosting` },
};


export default async function HostingPage() {
    const site = await getSiteData();
    const faq = landingFaq(site);
    const prices = priceMap(site);
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

            <HostingLanding
                appHref={S.app}
                plans={plans.map((p) => ({
                    key: p.key,
                    name: p.name,
                    price: p.trialDays ? `Free for ${p.trialDays} days` : (prices[p.key] ?? 'Price soon'),
                    rows: limitRows(p).slice(0, 3),
                    free: !!p.trialDays,
                }))}
            />

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

        </>
    );
}
