import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';
import PlansView from './PlansView';

export const metadata: Metadata = {
    title: 'Plans and pricing · Robtic',
    description:
        'Robtic plans and prices: Personal (free for the first month), Developers, Servers, Communities, Team ' +
        'and Org, with their memory, CPU, storage and databases.',
    alternates: { canonical: '/plans' },
};

const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Robtic hosting',
    serviceType: 'Discord bot and application hosting',
    url: `${ORIGIN}/plans`,
    provider: { '@id': `${ORIGIN}/#organization` },
};

export default function PlansPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
            <PlansView />
        </>
    );
}
