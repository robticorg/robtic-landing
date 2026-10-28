import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ORIGIN, PANEL_URL, SOCIAL_ICONS } from '@/lib/site';
import { getSiteData, resolveContact, resolveSocials } from '@/lib/site-data';
import AuthActions from './AuthActions';

const DESCRIPTION =
    'Robtic hosts Discord bots and small apps: upload your code or deploy it from GitHub, then run it from the ' +
    'browser with a live console, a code editor, databases, backups and teams.';
const IMAGE = `${ORIGIN}/rl/robtic/icon-512.png`;

export const metadata: Metadata = {
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

export const viewport: Viewport = { themeColor: '#070b14' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Contact email and socials are owned by the panel (set in the admin console, stored in the DB); the landing
    // only reads them. getSiteData is cached (ISR), so this doesn't hit the panel on every render.
    const site = await getSiteData();
    const contact = resolveContact(site);
    const socials = resolveSocials(site);
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: 'Robtic', url: `${ORIGIN}/`,
                logo: IMAGE, email: contact,
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
                    href="/rl/robtic/site/site.css"
                    // eslint-disable-next-line @next/next/no-css-tags
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                {/* The eyes while the page loads: they blink once, then fade out once the page is there. */}
                <div id="robtic-boot" aria-hidden="true">
                    <video autoPlay muted loop playsInline disablePictureInPicture preload="auto" poster="/rl/robtic/loading.jpg">
                        <source src="/rl/robtic/loading.webm" type="video/webm" />
                        <source src="/rl/robtic/loading.mp4" type="video/mp4" />
                    </video>
                </div>

                <header className="bar" id="bar">
                    <a href="/" className="brand" aria-label="Robtic home">
                        <img src="/rl/robtic/icon-128.png" alt="" />
                        <span>Robtic</span>
                    </a>
                    <nav className="nav-links" aria-label="Site">
                        <a href="/">Home</a>
                        <a href="/#features">Features</a>
                        <a href="/plans">Plans</a>
                    </nav>
                    <div className="actions">
                        <AuthActions panelRoot={PANEL_URL.replace(/\/panel$/, '')} />
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
                                <h4>Terms &amp; Service</h4>
                                <a href="/terms-hosting">Hosting Terms</a>
                                <a href="/terms-teams">Team&apos;s Terms</a>
                                <a href="/privacy-account">Account Privacy</a>
                                <a href="/privacy-hosting">Hosting Privacy</a>
                            </div>
                            <div className="foot-col">
                                <h4>Other</h4>
                                <a href="/#features">Features</a>
                                <a href="/plans">Plans</a>
                                <a href={`${PANEL_URL.replace(/\/panel$/, '')}/auth/login`}>Sign in</a>
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

                <Script src="/rl/robtic/site/landing-boot.js" strategy="afterInteractive" />
                <Script src="/rl/robtic/transit.js" strategy="afterInteractive" />
                <Script src="/rl/robtic/site/landing-ui.js" strategy="afterInteractive" />

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
