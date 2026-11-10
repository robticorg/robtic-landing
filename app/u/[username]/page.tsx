import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ORIGIN } from '@/lib/site';
import { getPublicProfile, lastSeenText } from '@/lib/profile';
import ActivityChart from './ActivityChart';
import ProfileOwnerLink from './ProfileOwnerLink';

// A public profile: banner, picture, badges, bio and activity. Anyone can open it; nothing private is here.
export const revalidate = 30;

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    const profile = await getPublicProfile(username);
    if (!profile) return { title: 'Profile not found · Robtic', robots: { index: false } };

    const title = `${profile.username} · Robtic`;
    const description = profile.bio || `${profile.username} on Robtic.`;
    const url = `${ORIGIN}/u/${profile.username}`;
    // When the profile is shared (Discord, X, etc.) show the person's name, bio and picture. A banner makes a wide
    // card; otherwise the avatar makes a square one. With neither, the plain card still carries the name and bio.
    const image = profile.banner_url || profile.avatar_url || null;
    const wide = !!profile.banner_url;

    return {
        title,
        description,
        alternates: { canonical: `/u/${profile.username}` },
        openGraph: {
            type: 'profile',
            siteName: 'Robtic',
            title,
            description,
            url,
            ...(profile.username ? { username: profile.username } : {}),
            ...(image ? { images: [{ url: image, alt: `${profile.username} on Robtic` }] } : {}),
        },
        twitter: {
            card: image ? (wide ? 'summary_large_image' : 'summary') : 'summary',
            title,
            description,
            ...(image ? { images: [image] } : {}),
        },
    };
}

export default async function ProfilePage({ params }: Props) {
    const { username } = await params;
    const profile = await getPublicProfile(username);
    if (!profile) notFound();

    const joined = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en', { year: 'numeric', month: 'long' }) : null;
    const seen = profile.online ? 'Online now' : `Last seen ${lastSeenText(profile.last_seen).toLowerCase()}`;

    return (
        <section className="pf">
            <div className="pf-banner" style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined} />
            <div className="wrap pf-wrap">
                <div className="pf-head">
                    <div className="pf-pic">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile.username.charAt(0).toUpperCase()}</span>}
                        {profile.online ? <i title="Online now" /> : null}
                    </div>
                    <div className="pf-name">
                        <div className="pf-title">
                            <h1>{profile.username}</h1>
                            {profile.badges.length ? (
                                <ul className="pf-badges" aria-label="Badges">
                                    {profile.badges.map((b) => (
                                        <li key={b.key} title={b.description ? `${b.name}: ${b.description}` : b.name} aria-label={b.name}>
                                            {b.icon || '🏅'}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                        <p>
                            {seen}
                            {joined ? ` · Member since ${joined}` : ''}
                        </p>
                    </div>
                    <ProfileOwnerLink username={profile.username} />
                </div>

                {profile.bio ? <p className="pf-bio">{profile.bio}</p> : null}

                <ActivityChart days={profile.activity} totalHours={profile.active_hours} />
            </div>
        </section>
    );
}
