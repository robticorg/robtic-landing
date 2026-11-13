import type { Metadata, Viewport } from 'next';
import TopProgress from './TopProgress';
import Script from 'next/script';
import { ORIGIN, PANEL_URL, SOCIAL_ICONS } from '@/lib/site';
import { getSiteData, legalPages, resolveContact, resolveSocials } from '@/lib/site-data';
import AuthActions from './AuthActions';
import SiteNav from './SiteNav';
import { asset } from '@/lib/asset';

const DESCRIPTION =
    'Robtic is the platform for Discord builders: host bots and small apps, run game and app servers, and add ' +
    'our public bots — all from one account, in the browser, with a live console, code editor, databases and teams.';
const IMAGE = `${ORIGIN}/rl/robtic/icon-512.png`;

const BASE_METADATA: Metadata = {
    metadataBase: new URL(ORIGIN),
    title: { default: 'Robtic', template: '%s' },
    description: DESCRIPTION,
    alternates: { canonical: '/' },
    robots: { index: true, follow: true, 'max-image-preview': 'large' } as Metadata['robots'],
    icons: {
        icon: [{ url: '/rl/favicons/favicon-32x32.png?v=r3', sizes: '32x32', type: 'image/png' }],
        apple: [{ url: '/rl/favicons/apple-touch-icon.png?v=r3', sizes: '180x180' }],
    },
    openGraph: {
        type: 'website', siteName: 'Robtic', locale: 'en_US', title: 'Robtic', description: DESCRIPTION,
        url: `${ORIGIN}/`, images: [{ url: IMAGE, width: 512, height: 512, alt: 'The Robtic robot' }],
    },
    twitter: { card: 'summary', title: 'Robtic', description: DESCRIPTION, images: [IMAGE] },
};

// The share picture can be changed in the admin console (Landing -> Images); the robot is the default.
export async function generateMetadata(): Promise<Metadata> {
    const og = (await getSiteData())?.landing?.images?.og;
    const url = og?.url?.trim();
    if (!url) return BASE_METADATA;
    const alt = og?.alt?.trim() || 'Robtic';
    return {
        ...BASE_METADATA,
        openGraph: { ...BASE_METADATA.openGraph, images: [{ url, alt }] },
        twitter: { card: 'summary_large_image', title: 'Robtic', description: DESCRIPTION, images: [url] },
    };
}

export const viewport: Viewport = { themeColor: '#070b14' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Contact email and socials are owned by the panel (set in the admin console, stored in the DB); the landing
    // only reads them. getSiteData is cached (ISR), so this doesn't hit the panel on every render.
    const site = await getSiteData();
    const contact = resolveContact(site);
    const socials = resolveSocials(site);
    const legal = legalPages(site);
    // Links the centre nav's mega-menus need. The Discord/GitHub entries prefer whatever is set in the admin
    // console, falling back to Robtic's own.
    const panelRoot = PANEL_URL.replace(/\/panel$/, '');
    const socialMap = Object.fromEntries(socials);
    const navDiscord = socialMap.discord || 'https://discord.gg/robtic';
    const navGithub = socialMap.github || 'https://github.com/robticorg';
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: 'Robtic', url: `${ORIGIN}/`,
                logo: IMAGE, email: contact, description: DESCRIPTION,
                ...(socials.length ? { sameAs: socials.map(([, url]) => url) } : {}),
            },
            {
                '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: 'Robtic', url: `${ORIGIN}/`,
                publisher: { '@id': `${ORIGIN}/#organization` }, inLanguage: 'en',
            },
        ],
    };
    return (
        <html lang="en" className="js">
            <head>
                <link
                    rel="stylesheet"
                    href={asset('/rl/robtic/site/site.css')}
                    // eslint-disable-next-line @next/next/no-css-tags
                />
                <link rel="describedby" type="text/plain" href="/llms.txt" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                <TopProgress />

                <header className="bar" id="bar">
                    <a href="/" className="brand" aria-label="Robtic home">
                        <img src="/rl/robtic/icon-128.png" alt="" />
                        <span>Robtic</span>
                    </a>
                    <SiteNav
                        hosting={`${panelRoot}/hosting/dashboard`}
                        discord={navDiscord}
                        github={navGithub}
                    />
                    <div className="actions">
                        <AuthActions panelRoot={panelRoot} />
                    </div>
                </header>

                <main>{children}</main>

                {/* The wave into the footer, then the footer, then the big wordmark with the robot on the T. */}
                <div className="wave foot-wave" data-wave style={{ ['--from' as string]: 'var(--bg-2)', ['--to' as string]: 'var(--foot)' }} aria-hidden="true">
                    <svg viewBox="0 0 1440 110" preserveAspectRatio="none"><path className="w2" /><path className="w1" /><path className="wl" /></svg>
                </div>
                <footer className="foot">
                    <div className="wrap foot-cols">
                        <div className="foot-brand">
                            <a href="/" className="logo"><img src="/rl/robtic/icon-128.png" alt="" /> Robtic</a>
                            <h4>Social</h4>
                            <div className="socials">
                                {socials.map(([key, url]) => (
                                    SOCIAL_ICONS[key] ? (
                                        <span key={key} style={{ display: 'contents' }}>
                                            <a href={url} target="_blank" rel="noopener" aria-label={SOCIAL_ICONS[key][0]} title={SOCIAL_ICONS[key][0]}>
                                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={SOCIAL_ICONS[key][1]} /></svg>
                                            </a>
                                            <span className="sep" aria-hidden="true" />
                                        </span>
                                    ) : null
                                ))}
                                <a href={`mailto:${contact}`} aria-label={`Email ${contact}`} title={contact}>
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5.5A1.5 1.5 0 013.5 4h17A1.5 1.5 0 0122 5.5v13a1.5 1.5 0 01-1.5 1.5h-17A1.5 1.5 0 012 18.5v-13zm2.2.5l7.8 6.1L19.8 6H4.2zM20 7.9l-7.4 5.8a1 1 0 01-1.2 0L4 7.9V18h16V7.9z" /></svg>
                                </a>
                            </div>
                        </div>
                        <div className="foot-right">
                            <div className="foot-col">
                                <h4>Platforms</h4>
                                <a href={`${panelRoot}/hosting/dashboard`}>Hosting</a>
                                <a href="#" data-soon="Servers — coming soon">Servers</a>
                                <a href="/discord/public">Public Bots</a>
                                <a href="#" data-soon="Private Bots — coming soon">Private Bots</a>
                            </div>
                            <div className="foot-col">
                                <h4>Community</h4>
                                <a href="#" data-soon="Docs — coming soon">Docs</a>
                                <a href="#" data-soon="Status — coming soon">Status</a>
                                <a href={navDiscord} target="_blank" rel="noopener">Discord</a>
                                <a href={navGithub} target="_blank" rel="noopener">GitHub</a>
                            </div>
                            <div className="foot-col">
                                <h4>Terms &amp; Service</h4>
                                {legal.map((p) => (
                                    <a key={p.key} href={`/${p.path}`}>{p.title}</a>
                                ))}
                            </div>
                            <div className="foot-col">
                                <h4>Other</h4>
                                <a href="/#features">Features</a>
                                <a href="/plans">Plans</a>
                                <a href="/faq">FAQ</a>
                                <a href={`${panelRoot}/auth/login`}>Sign in</a>
                            </div>
                        </div>
                    </div>
                    <div className="mark-wrap" aria-hidden="true">
                        <span className="mark">Rob<span className="t">T<img className="sitter" src="/rl/robtic/site/robot-sitting.webp" alt="" /></span>ic</span>
                    </div>
                </footer>

                <button type="button" className="to-top" id="to-top" aria-label="Back to the top">
                    <svg className="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" /><circle className="fill" id="to-top-fill" cx="24" cy="24" r="22" /></svg>
                    <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6l6-6 6 6" /></svg>
                </button>

                {/* Lightweight toast, driven by landing-ui.js: any link with a data-soon attribute shows it. */}
                <div id="toast" className="toast" role="status" aria-live="polite" aria-hidden="true" />

                {/* The enhancement scripts load after the app becomes interactive (so they run post-hydration and
                    don't fight React over the DOM). On modern browsers this is all that runs. */}
                <Script src={asset('/rl/robtic/site/landing-ui.js')} strategy="afterInteractive" />

                {/* Resilience net for old / very slow browsers: if the app never finishes hydrating, the
                    afterInteractive scripts above never load, and the page (whose reveal content starts hidden)
                    would stay blank. This inline script runs straight from the parsed HTML — no hydration needed —
                    and, only if nothing has booted after a short wait, loads the same scripts by hand. On a healthy
                    modern load it sees the app already running and does nothing, so behaviour there is unchanged. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html:
                            `(function(){var ui=${JSON.stringify(asset('/rl/robtic/site/landing-ui.js'))},` +
                            `dk=${JSON.stringify(asset('/rl/robtic/site/landing-deck.js'))};setTimeout(function(){` +
                            `if(window.__robticUi)return;var add=function(s){var e=document.createElement('script');e.src=s;document.body.appendChild(e);};` +
                            `add(ui);if(document.getElementById('deck-track'))add(dk);},2600);})();`,
                    }}
                />

                {/* Google Analytics (gtag.js) */}
                <Script src="https://www.googletagmanager.com/gtag/js?id=G-MEX3YG8YG3" strategy="afterInteractive" />
                <Script id="gtag-init" strategy="afterInteractive">
                    {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MEX3YG8YG3');`}
                </Script>
            </body>
        </html>
    );
}
