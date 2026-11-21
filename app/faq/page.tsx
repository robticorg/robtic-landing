import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { getSiteData, landingFaq } from '@/lib/site-data';
import { DISCORD_FAQ, ROBTIC_FAQ } from '@/lib/faqs';
import Faq from '../Faq';

export const metadata: Metadata = pageMeta({
    title: 'FAQ · Robtic',
    description: 'Common questions about Robtic and your account, Robtic Hosting (bots, apps, plans, databases) and the Robtic Discord bots.',
    path: '/faq',
});

export default async function FaqPage() {
    const groups = [
        { id: 'robtic', title: 'Robtic and your account', items: ROBTIC_FAQ },
        { id: 'hosting', title: 'Robtic Hosting', items: landingFaq(await getSiteData()) },
        { id: 'discord', title: 'Robtic Discord', items: DISCORD_FAQ },
    ];

    // JSON-LD so the questions can show as rich results in search.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: groups.flatMap((g) => g.items).map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <section className="page-head faq-top">
                <div className="wrap">
                    <h1>Questions, answered</h1>
                    <p>About Robtic and your account, and about each of our services.</p>
                </div>
            </section>

            {groups.map((g, i) => (
                <section className="block faq-sec faq-page" id={g.id} key={g.id}>
                    <div className="wrap reveal">
                        <h2 className="rx-faq-h">{g.title}</h2>
                        <Faq items={g.items} showImage={i === 0} />
                    </div>
                </section>
            ))}
        </>
    );
}
