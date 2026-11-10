import type { Metadata } from 'next';
import { getSiteData, landingFaq } from '@/lib/site-data';
import Faq from '../Faq';

export const metadata: Metadata = {
    title: 'FAQ · Robtic',
    description: 'Common questions about Robtic — hosting Discord bots and apps, running servers, plans, databases and getting started.',
    alternates: { canonical: '/faq' },
};

export default async function FaqPage() {
    const faq = landingFaq(await getSiteData());

    // JSON-LD so the questions can show as rich results in search.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
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
                    <p>Everything people ask before they start building on Robtic.</p>
                </div>
            </section>

            <section className="block faq-sec faq-page" id="faq">
                <div className="wrap reveal">
                    <Faq items={faq} />
                </div>
            </section>
        </>
    );
}
