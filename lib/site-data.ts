// The landing only READS the site's data; the panel owns it (set in the admin console, stored in the database).
// We fetch it from the panel's public endpoint and let Next cache it, revalidating every few minutes — so a price
// change in the admin shows up without a redeploy, and the panel isn't hit on every page view.

import { ORIGIN } from './site';

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
    };
    legal_updated: Record<string, string>;
};

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

// key -> formatted monthly price, for the plans the panel has priced (plus the team plan).
export function priceMap(data: SiteData | null): Record<string, string> {
    const map: Record<string, string> = {};
    if (!data) return map;
    for (const p of data.plans ?? []) if (p.price) map[p.key] = p.price;
    if (data.team?.price) map['team'] = data.team.price;
    return map;
}
