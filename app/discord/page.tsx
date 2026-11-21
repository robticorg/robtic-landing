import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';
import { pageMeta, SHARE } from '@/lib/seo';
import { DISCORD_FAQ } from '@/lib/faqs';
import { DISCORD_BOTS, SERVICES } from '@/lib/services';
import Faq from '../Faq';
import DiscordLanding from './DiscordLanding';

// Robtic Discord's own page, with a hero of its own: a Discord channel where the bots work, in Discord's blurple. The dashboard itself is /discord/public (robtic-discord):
// sign-in with Discord linked, then Robtic Discord's terms the first time.

const S = SERVICES.discord;

/** Discord's mark (Simple Icons), as on the official \"Add to Discord\" buttons. */
const DISCORD_MARK = 'M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z';

export const metadata: Metadata = pageMeta({
    title: 'Robtic Discord: ready-made Discord bots with a web dashboard',
    shareTitle: 'Robtic Discord',
    description:
        'Robtic Discord bots for your server: Robtic System (levels, points, moderation), Robtic Staff (staff ranks and ' +
        'reports), Robtic Ticket (ticket panels and transcripts), Robtic Voice and Robtic Guard. Set up every feature from one web dashboard, in English or Arabic.',
    path: '/discord',
    share: SHARE.discord,
    keywords: ['Robtic Discord', 'Robtic', 'Robtic bots', 'Discord bots', 'Discord leveling bot', 'Discord ticket bot', 'Discord staff bot'],
});


export default function DiscordPage() {
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${ORIGIN}/discord#service`,
        name: S.name,
        serviceType: 'Discord bots',
        url: `${ORIGIN}/discord`,
        description: metadata.description,
        provider: { '@id': `${ORIGIN}/#organization` },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Robtic Discord bots',
            itemListElement: DISCORD_BOTS.map((b) => ({ '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: b.name, applicationCategory: 'CommunicationApplication', operatingSystem: 'Discord', description: b.text } })),
        },
    };
    const crumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Robtic', item: `${ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: S.name, item: `${ORIGIN}/discord` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ld, crumbs]) }} />
            <DiscordLanding addHref={S.app} discordMark={DISCORD_MARK} />

            <section className="block faq-sec" id="faq">
                <div className="wrap reveal">
                    <div className="faq-head">
                        <span className="pill">FAQ</span>
                        <h2>Discord questions</h2>
                        <p className="sub">About adding and setting up the bots.</p>
                    </div>
                    <Faq items={DISCORD_FAQ} limit={5} moreHref="/faq" />
                </div>
            </section>
        </>
    );
}
