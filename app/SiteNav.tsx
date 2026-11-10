'use client';

// The site bar's centre navigation. Keeps the existing pill (.nav-links) look exactly; Dashboard and Community
// gain a hover mega-menu (see ~/Downloads/navbar.png): a couple of icon+title+description columns on the left and a
// small info card on the right. Links to things that don't have a page yet don't navigate — they raise a "Coming
// soon" toast instead. Home, Features and Plans stay plain links.
//
// Icons are lucide-react (one distinct icon per item), except the Discord and GitHub marks: lucide ships no brand
// logos, so those two keep their official brand SVGs.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    Server,
    Gamepad2,
    Bot,
    ShieldCheck,
    BookOpen,
    Activity,
    ChevronDown,
    type LucideIcon,
} from 'lucide-react';

// Official brand marks (Simple Icons), used where lucide has no equivalent.
const BRAND = {
    discord:
        'M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z',
    github:
        'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
} as const;

type IconDef = { lucide: LucideIcon } | { brand: keyof typeof BRAND };

type Item = {
    label: string;
    desc: string;
    icon: IconDef;
    href?: string; // absent -> "Coming soon"
    external?: boolean;
};
type Column = { heading: string; items: Item[] };
type Menu = {
    key: string;
    label: string;
    columns: Column[];
    card: { title: string; text: string; img: string };
};

function ItemIcon({ icon }: { icon: IconDef }) {
    if ('lucide' in icon) {
        const C = icon.lucide;
        return (
            <span className="mega-ic" aria-hidden="true">
                <C size={20} strokeWidth={1.7} />
            </span>
        );
    }
    return (
        <span className="mega-ic is-brand" aria-hidden="true">
            <svg viewBox="0 0 24 24">
                <path d={BRAND[icon.brand]} />
            </svg>
        </span>
    );
}

export default function SiteNav({
    hosting,
    discord,
    github,
}: {
    hosting: string;
    discord: string;
    github: string;
}) {
    const menus: Menu[] = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            columns: [
                {
                    heading: 'Platforms',
                    items: [
                        { label: 'Hosting', desc: 'Discord bots, sites and APIs', icon: { lucide: Server }, href: hosting },
                        { label: 'Servers', desc: 'Game and app servers', icon: { lucide: Gamepad2 } },
                    ],
                },
                {
                    heading: 'Discord',
                    items: [
                        { label: 'Public Bots', desc: 'Add our bots to your server', icon: { lucide: Bot } },
                        { label: 'Private Bots', desc: 'Host and run your own', icon: { lucide: ShieldCheck } },
                    ],
                },
            ],
            card: {
                title: 'One account, every platform',
                text: 'Hosting, servers and Discord bots — all run from the same Robtic account.',
                img: '/rl/robtic/site/robot-sitting.webp',
            },
        },
        {
            key: 'community',
            label: 'Community',
            columns: [
                {
                    heading: 'Tools',
                    items: [
                        { label: 'Docs', desc: 'Guides and API reference', icon: { lucide: BookOpen } },
                        { label: 'Status', desc: 'Live platform uptime', icon: { lucide: Activity } },
                    ],
                },
                {
                    heading: 'Community',
                    items: [
                        { label: 'Discord', desc: 'Join our community server', icon: { brand: 'discord' }, href: discord, external: true },
                        { label: 'GitHub', desc: 'Open-source tools', icon: { brand: 'github' }, href: github, external: true },
                    ],
                },
            ],
            card: {
                title: 'Build with the community',
                text: 'Docs, live status and an active Discord — everything to get going on Robtic.',
                img: '/rl/robtic/site/robot-peek.webp',
            },
        },
    ];

    // On the FAQ page the bar is stripped back to just the logo and the account/sign-in buttons — no centre nav.
    const pathname = usePathname();
    const minimal = pathname === '/faq' || pathname?.startsWith('/faq/');

    const [open, setOpen] = useState<string | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
    }, []);
    const scheduleClose = useCallback(() => {
        cancelClose();
        closeTimer.current = setTimeout(() => setOpen(null), 140);
    }, [cancelClose]);

    // Escape closes the open menu.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Links with no page close the menu; the global [data-soon] handler (landing-ui.js) shows the toast.
    const onItem = (e: React.MouseEvent, item: Item) => {
        setOpen(null);
        if (!item.href) e.preventDefault();
    };

    // All hooks ran above; now we can drop the centre nav on the minimal pages.
    if (minimal) return null;

    return (
        <>
            <nav className="nav-links" aria-label="Site" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
                <a href="/">Home</a>
                {menus.map((m) => (
                    <div
                        key={m.key}
                        className="nav-has-menu"
                        onMouseEnter={() => {
                            cancelClose();
                            setOpen(m.key);
                        }}
                    >
                        <button
                            type="button"
                            className={open === m.key ? 'nav-trigger is-open' : 'nav-trigger'}
                            aria-haspopup="true"
                            aria-expanded={open === m.key}
                            onClick={() => setOpen((o) => (o === m.key ? null : m.key))}
                        >
                            {m.label}
                            <ChevronDown className="caret" size={14} aria-hidden="true" />
                        </button>
                    </div>
                ))}
                <a href="/#features">Features</a>
                <a href="/plans">Plans</a>
            </nav>

            {menus.map((m) => (
                <div
                    key={m.key}
                    className={open === m.key ? 'mega is-open' : 'mega'}
                    role="region"
                    aria-label={m.label}
                    hidden={open !== m.key}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                >
                    <div className="mega-in">
                        <div className="mega-cols">
                            {m.columns.map((col) => (
                                <div className="mega-col" key={col.heading}>
                                    <p className="mega-h">{col.heading}</p>
                                    {col.items.map((item) => (
                                        <a
                                            key={item.label}
                                            className="mega-item"
                                            href={item.href || '#'}
                                            {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
                                            {...(item.href ? {} : { 'data-soon': `${item.label} — coming soon` })}
                                            aria-disabled={item.href ? undefined : true}
                                            onClick={(e) => onItem(e, item)}
                                        >
                                            <ItemIcon icon={item.icon} />
                                            <span className="mega-tx">
                                                <b>{item.label}</b>
                                                <small>{item.desc}</small>
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="mega-card">
                            <img src="/rl/robtic/site/robot-sitting.webp" alt="" aria-hidden="true" />
                            <b>{m.card.title}</b>
                            <p>{m.card.text}</p>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}
