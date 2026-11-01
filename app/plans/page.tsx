import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';
import { getSiteData, priceMap } from '@/lib/site-data';
import PlansView from './PlansView';

export const metadata: Metadata = {
    title: 'Plans and pricing · Robtic',
    description:
        'Robtic plans and prices: Personal (free for the first month), Developers, Servers, Communities, Team ' +
        'and Org, with their memory, CPU, storage and databases.',
    alternates: { canonical: '/plans' },
};

export default async function PlansPage() {
    const site = await getSiteData();
    const prices = priceMap(site);
    // The live prices, so search engines and AI tools quote what the page shows.
    const priced = [...(site?.plans ?? []), ...(site?.team ? [site.team] : [])].filter((p) => p.amount !== null);
    const serviceLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Robtic hosting',
        serviceType: 'Discord bot and application hosting',
        url: `${ORIGIN}/plans`,
        provider: { '@id': `${ORIGIN}/#organization` },
        offers: priced.map((p) => ({
            '@type': 'Offer', name: p.name, price: p.amount, priceCurrency: site?.currency, url: `${ORIGIN}/plans`,
        })),
    };
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
            <PlansView prices={prices} />
        </>
    );
}
