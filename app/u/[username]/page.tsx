import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProfile, lastSeenText } from '@/lib/profile';
import ProfileOwnerLink from './ProfileOwnerLink';

// A public profile: banner, picture, bio, badges and time on Robtic. Anyone can open it; nothing private is here.
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

function hours(n: number): string {
    return n < 1 ? 'Under an hour' : `${n.toLocaleString('en')} hour${n === 1 ? '' : 's'}`;
}

export default async function ProfilePage({ params }: Props) {
    const { username } = await params;
    const profile = await getPublicProfile(username);
    if (!profile) notFound();

    const joined = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en', { year: 'numeric', month: 'long' }) : '—';

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
                        <h1>{profile.username}</h1>
                        <p>{profile.online ? 'Online now' : `Last seen ${lastSeenText(profile.last_seen).toLowerCase()}`}</p>
                    </div>
                    <ProfileOwnerLink username={profile.username} />
                </div>

                {profile.badges.length ? (
                    <ul className="pf-badges" aria-label="Badges">
                        {profile.badges.map((b) => (
                            <li key={b.key} title={b.description ?? b.name} style={{ ['--badge' as string]: b.color }}>
                                {b.icon ? <span aria-hidden="true">{b.icon}</span> : null}
                                {b.name}
                            </li>
                        ))}
                    </ul>
                ) : null}

                {profile.bio ? <p className="pf-bio">{profile.bio}</p> : null}

                <dl className="pf-stats">
                    <div>
                        <dt>Time on Robtic</dt>
                        <dd>{hours(profile.active_hours)}</dd>
                    </div>
                    <div>
                        <dt>Member since</dt>
                        <dd>{joined}</dd>
                    </div>
                    <div>
                        <dt>Last seen</dt>
                        <dd>{profile.online ? 'Now' : lastSeenText(profile.last_seen)}</dd>
                    </div>
                </dl>
            </div>
        </section>
    );
}
