'use client';

import { useRef, useState } from 'react';
import { imageForm, PROFILE, request, type Profile } from '@/lib/account';
import { Field, useRun, useSettings } from './SettingsShell';

// Settings -> Public profile: what everyone sees at robtic.org/u/<username>, edited in place. The limits match
// AvatarController and ProfileController, which re-encode what they get to these sizes.
const BIO_MAX = 300;
const TYPES = 'image/png,image/jpeg,image/webp,image/gif';
const BANNER = { max: 8, rules: '1500 × 500 px · PNG, JPG, WebP or GIF · up to 8 MB' };
const AVATAR = { max: 4, rules: 'Square, 256 × 256 px · PNG, JPG, WebP or GIF · up to 4 MB' };

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V5M7 10l5-5 5 5M4 19h16" /></svg>
);

export default function PublicProfileSettings() {
    const { profile, setProfile, reload, toast } = useSettings();
    const { run, pending } = useRun();
    const [uploading, setUploading] = useState<'banner' | 'avatar' | null>(null);
    const avatar = useRef<HTMLInputElement>(null);
    const banner = useRef<HTMLInputElement>(null);

    const tooBig = (f: File, max: number) => {
        if (f.size <= max * 1024 * 1024) return false;
        toast('err', `That file is too big. The most is ${max} MB.`);
        return true;
    };
    const apply = (r: { data: Profile } | null) => {
        if (r) setProfile(r.data);
    };
    const uploadBanner = async (f?: File) => {
        if (!f || tooBig(f, BANNER.max)) return;
        setUploading('banner');
        apply(await run(() => request<{ data: Profile }>('POST', '/api/client/robtic/account/banner', imageForm('banner', f)), 'Banner updated.'));
        setUploading(null);
    };
    const removeBanner = async () => apply(await run(() => request<{ data: Profile }>('DELETE', '/api/client/robtic/account/banner'), 'Banner removed.'));
    const uploadAvatar = async (f?: File) => {
        if (!f || tooBig(f, AVATAR.max)) return;
        setUploading('avatar');
        if (await run(() => request('POST', '/api/client/account/avatar', imageForm('avatar', f)), 'Picture updated.')) await reload();
        setUploading(null);
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

            <input ref={banner} type="file" hidden accept={TYPES} onChange={(e) => { uploadBanner(e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={avatar} type="file" hidden accept={TYPES} onChange={(e) => { uploadAvatar(e.target.files?.[0]); e.target.value = ''; }} />

            <div className="st-preview">
                <button
                    type="button"
                    className="st-banner"
                    style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined}
                    aria-label={`Upload a banner. ${BANNER.rules}`}
                    disabled={pending}
                    onClick={() => banner.current?.click()}
                >
                    <span className="st-rules">{BANNER.rules}</span>
                    {uploading === 'banner' ? <span className="st-spin" /> : <span className="st-up"><UploadIcon /></span>}
                </button>
                <button type="button" className="st-pic" aria-label={`Upload a picture. ${AVATAR.rules}`} disabled={pending} onClick={() => avatar.current?.click()}>
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile.username.charAt(0).toUpperCase()}</span>}
                    {uploading === 'avatar' ? <span className="st-spin" /> : <span className="st-up"><UploadIcon /></span>}
                    <span className="st-rules">{AVATAR.rules}</span>
                </button>
            </div>
            <div className="st-under">
                {profile.avatar_url ? <button type="button" className="st-link" disabled={pending} onClick={removeAvatar}>Remove picture</button> : null}
                {profile.banner_url ? <button type="button" className="st-link" disabled={pending} onClick={removeBanner}>Remove banner</button> : null}
            </div>
            {/* No hover on a touch screen, so the limits are written out. */}
            <ul className="st-touch-rules">
                <li><b>Banner:</b> {BANNER.rules}</li>
                <li><b>Picture:</b> {AVATAR.rules}</li>
            </ul>

            <Bio key={profile.bio} />
        </>
    );
}

// The bio as text, until "Change bio" turns it into a box to write in.
function Bio() {
    const { profile, setProfile } = useSettings();
    const { run, pending } = useRun();
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState(profile.bio);

    const save = async () => {
        const r = await run(() => request<{ data: Profile }>('PATCH', PROFILE, { bio }), 'Bio saved.');
        if (r) {
            setProfile(r.data);
            setEditing(false);
        }
    };
    const cancel = () => {
        setBio(profile.bio);
        setEditing(false);
    };

    return (
        <section className="st-card">
            <div className="st-bio-head">
                <h2>Bio</h2>
                {editing ? null : <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>Change bio</button>}
            </div>
            {editing ? (
                <>
                    <label className="st-field st-bio-box">
                        <span className="st-sr">Bio</span>
                        <textarea rows={4} autoFocus maxLength={BIO_MAX} value={bio} onChange={(e) => setBio(e.target.value)} onFocus={(e) => e.target.setSelectionRange(bio.length, bio.length)} placeholder="Tell people what you build." />
                        <small>{bio.length} / {BIO_MAX}</small>
                    </label>
                    <div className="st-actions">
                        <button type="button" className="st-link" disabled={pending} onClick={cancel}>Cancel</button>
                        <button type="button" className="btn btn-primary" disabled={pending || bio === profile.bio} onClick={save}>Save bio</button>
                    </div>
                </>
            ) : (
                <p className={profile.bio ? 'st-bio' : 'st-bio empty'}>{profile.bio || 'No bio yet.'}</p>
            )}
        </section>
    );
}
