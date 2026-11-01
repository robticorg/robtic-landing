'use client';

import { useRef, useState } from 'react';
import { imageForm, PROFILE, request, type Profile } from '@/lib/account';
import { Row, useRun, useSettings } from './SettingsShell';

// Settings -> Public profile: what everyone sees at robtic.org/u/<username>.
const BIO_MAX = 300;

export default function PublicProfileSettings() {
    const { profile, setProfile, reload } = useSettings();
    const { run, pending } = useRun();
    const [bio, setBio] = useState(profile.bio);
    const avatar = useRef<HTMLInputElement>(null);
    const banner = useRef<HTMLInputElement>(null);

    const apply = (r: { data: Profile } | null) => {
        if (r) setProfile(r.data);
    };
    const saveBio = async () => apply(await run(() => request<{ data: Profile }>('PATCH', PROFILE, { bio }), 'Bio saved.'));
    const uploadBanner = async (f?: File) => {
        if (f) apply(await run(() => request<{ data: Profile }>('POST', '/api/client/robtic/account/banner', imageForm('banner', f)), 'Banner updated.'));
    };
    const removeBanner = async () => apply(await run(() => request<{ data: Profile }>('DELETE', '/api/client/robtic/account/banner'), 'Banner removed.'));
    const uploadAvatar = async (f?: File) => {
        if (f && (await run(() => request('POST', '/api/client/account/avatar', imageForm('avatar', f)), 'Picture updated.'))) await reload();
    };
    const removeAvatar = async () => {
        if (await run(() => request('DELETE', '/api/client/account/avatar'), 'Picture removed.')) await reload();
    };

    return (
        <>
            <header className="st-head">
                <h1>Public profile</h1>
                <p>
                    What everyone sees at <a href={`/u/${profile.username}`}>robtic.org/u/{profile.username}</a>.
                </p>
            </header>

            <div className="st-preview">
                <div className="st-banner" style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined} />
                <div className="st-pic">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile.username.charAt(0).toUpperCase()}</span>}</div>
            </div>

            <section className="st-card">
                <Row title="Profile picture" desc="PNG, JPG, WebP or GIF, up to 4 MB. Cropped to a square.">
                    <input ref={avatar} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { uploadAvatar(e.target.files?.[0]); e.target.value = ''; }} />
                    <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => avatar.current?.click()}>Upload</button>
                    {profile.avatar_url ? <button type="button" className="st-link" disabled={pending} onClick={removeAvatar}>Remove</button> : null}
                </Row>
                <Row title="Banner" desc="A wide picture behind your profile, up to 8 MB. Cropped to 1500×500.">
                    <input ref={banner} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { uploadBanner(e.target.files?.[0]); e.target.value = ''; }} />
                    <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => banner.current?.click()}>Upload</button>
                    {profile.banner_url ? <button type="button" className="st-link" disabled={pending} onClick={removeBanner}>Remove</button> : null}
                </Row>
            </section>

            <section className="st-card">
                <label className="st-field">
                    <span>Bio</span>
                    <textarea rows={3} maxLength={BIO_MAX} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you build." />
                    <small>{bio.length} / {BIO_MAX}</small>
                </label>
                <div className="st-actions">
                    <button type="button" className="btn btn-primary" disabled={pending || bio === profile.bio} onClick={saveBio}>Save bio</button>
                </div>
            </section>

            {profile.badges.length ? (
                <section className="st-card">
                    <Row title="Badges" desc="Earned on Robtic or given by the team." />
                    <ul className="pf-badges">
                        {profile.badges.map((b) => (
                            <li key={b.key} title={b.description ?? b.name} style={{ ['--badge' as string]: b.color }}>
                                {b.icon ? <span aria-hidden="true">{b.icon}</span> : null}
                                {b.name}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </>
    );
}
