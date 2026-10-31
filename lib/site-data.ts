// The landing only READS the site's data; the panel owns it (set in the admin console, stored in the database).
// We fetch it from the panel's public endpoint and let Next cache it, revalidating every few minutes — so a price
// change in the admin shows up without a redeploy, and the panel isn't hit on every page view.

import fs from 'node:fs';
import path from 'node:path';
import { ORIGIN, CONTACT, SOCIALS } from './site';

// The panel is reached at its public origin by default; override with PANEL_API_ORIGIN (e.g. the internal
// http://robtic-panel:80) to skip the round-trip through the proxy.
const PANEL_API_ORIGIN = (process.env.PANEL_API_ORIGIN || ORIGIN).replace(/\/$/, '');

export type SitePlan = {
    key: string;
    name: string;
    price: string | null; // formatted, e.g. "$4.99 / month" or "Free"; null until a price is set
    amount: number | null;
    trial: number | null;
};

export type SiteData = {
    plans: SitePlan[];
    team: { name: string; price: string | null; amount: number | null } | null;
    currency: string;
    contact: string;
    contact_legal: string;
    contact_phone: string;
    socials: Record<string, string>;
    landing: {
        hero_title: string;
        hero_subtitle: string;
        cta_label: string;
        images: Record<string, { url: string; alt: string }>;
        features?: LandingFeature[];
    };
    legal_updated: Record<string, string>;
    legal_pages?: LegalPage[];
};

export type LandingFeature = { title: string; text: string; image: string; alt: string };

// A legal page: `key` is where the panel stores it, `path` its address here (robtic.org/<path>), both set in the
// admin console.
export type LegalPage = { key: string; title: string; path: string; updated?: string };

// What the site starts from, and what it falls back to when the panel can't be reached: the built-in pages, whose
// Markdown is a snapshot in legal-md/.
export const BUILTIN_LEGAL: LegalPage[] = [
    { key: 'terms-hosting', title: 'Hosting Terms', path: 'terms-hosting' },
    { key: 'terms-teams', title: "Team's Terms", path: 'terms-teams' },
    { key: 'privacy-account', title: 'Account Privacy', path: 'privacy-account' },
    { key: 'privacy-hosting', title: 'Hosting Privacy', path: 'privacy-hosting' },
];
const BUILTIN_UPDATED = 'October 25, 2026';

export async function getSiteData(): Promise<SiteData | null> {
    try {
        const res = await fetch(`${PANEL_API_ORIGIN}/api/robtic/site`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        return (await res.json()) as SiteData;
    } catch {
        return null;
    }
}

// The legal pages, in the order the admin console set them.
export function legalPages(data: SiteData | null): LegalPage[] {
    return data?.legal_pages?.length ? data.legal_pages : BUILTIN_LEGAL;
}

// One legal page by its address, with its Markdown. Asks the panel; if it can't be reached, a built-in page is
// read from legal-md/ so the terms never go missing.
export async function getLegalPage(slug: string): Promise<(LegalPage & { markdown: string; updated: string }) | null> {
    try {
        const res = await fetch(`${PANEL_API_ORIGIN}/api/robtic/site/legal/${encodeURIComponent(slug)}`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 300 },
        });
        if (res.status === 404) return null;
        if (res.ok) return await res.json();
    } catch {
        // fall through to the snapshot
    }
    const page = BUILTIN_LEGAL.find((p) => p.path === slug);
    if (!page) return null;
    try {
        const markdown = fs.readFileSync(path.join(process.cwd(), 'legal-md', `${page.key}.md`), 'utf8');
        return { ...page, markdown, updated: BUILTIN_UPDATED };
    } catch {
        return null;
    }
}

// key -> formatted monthly price, for the plans the panel has priced (plus the team plan).
export function priceMap(data: SiteData | null): Record<string, string> {
    const map: Record<string, string> = {};
    if (!data) return map;
    for (const p of data.plans ?? []) if (p.price) map[p.key] = p.price;
    if (data.team?.price) map['team'] = data.team.price;
    return map;
}

// The contact email to show. The panel (admin console) owns it; fall back to the built-in only if the API is down.
export function resolveContact(data: SiteData | null): string {
    return data?.contact?.trim() || CONTACT;
}

// Active social links as [key, url] pairs. When the API answered, the panel's saved socials are authoritative
// (so clearing one in the admin removes it here); only if the API is unreachable do we fall back to the built-ins.
export function resolveSocials(data: SiteData | null): Array<[string, string]> {
    const src = data?.socials && Object.keys(data.socials).length ? data.socials : SOCIALS;
    return Object.entries(src).filter(([, url]) => (url ?? '').trim() !== '');
}
