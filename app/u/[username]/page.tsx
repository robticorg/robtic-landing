import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
    return {
        title: `${profile.username} · Robtic`,
        description: profile.bio || `${profile.username} on Robtic.`,
        alternates: { canonical: `/u/${profile.username}` },
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
