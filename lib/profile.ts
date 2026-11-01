// A public profile, read on the server for robtic.org/u/<username>. Only what the profile shows.
import { ORIGIN } from './site';

const PANEL_API_ORIGIN = (process.env.PANEL_API_ORIGIN || ORIGIN).replace(/\/$/, '');

export type PublicBadge = { key: string; name: string; icon: string | null; color: string; description: string | null };

export type PublicProfile = {
    username: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string;
    badges: PublicBadge[];
    joined_at: string | null;
    active_hours: number;
    online: boolean;
    last_seen: string | null;
};

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
    try {
        const res = await fetch(`${PANEL_API_ORIGIN}/api/robtic/profile/${encodeURIComponent(username)}`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 30 },
        });
        if (!res.ok) return null;
        return ((await res.json()) as { data: PublicProfile }).data;
    } catch {
        return null;
    }
}

// "Today", "Yesterday", "3 days ago", "2 months ago".
export function lastSeenText(date: string | null): string {
    if (!date) return 'Not yet';
    const days = Math.floor((Date.now() - new Date(`${date}T00:00:00Z`).getTime()) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
}
