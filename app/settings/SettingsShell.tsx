'use client';

// The Settings frame: who you are at the top of a left nav, the sections under it, one page each. Signed-out visitors
// go to sign in and come back here.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ApiError, errorText, getProfile, type Profile } from '@/lib/account';

const NAV: Array<{ group: string; items: Array<{ href: string; label: string }> }> = [
    { group: 'You', items: [{ href: '/settings', label: 'Public profile' }, { href: '/settings/account', label: 'Account' }] },
    { group: 'Preferences', items: [{ href: '/settings/notifications', label: 'Notifications' }] },
    { group: 'Access', items: [{ href: '/settings/linked', label: 'Linked accounts' }, { href: '/settings/security', label: 'Security' }] },
];

type Ctx = {
    profile: Profile;
    setProfile: (p: Profile) => void;
    reload: () => Promise<void>;
    toast: (kind: 'ok' | 'err', text: string) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function useSettings(): Ctx {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings outside SettingsShell');
    return ctx;
}

// Run an action: failures and (optionally) success become a toast; returns the result, or null if it failed.
export function useRun() {
    const { toast } = useSettings();
    const [pending, setPending] = useState(false);
    const run = async <T,>(action: () => Promise<T>, done?: string): Promise<T | null> => {
        setPending(true);
        try {
            const r = await action();
            if (done) toast('ok', done);
            return r === undefined ? (true as T) : r;
        } catch (e) {
            toast('err', errorText(e));
            return null;
        } finally {
            setPending(false);
        }
    };
    return { run, pending };
}

export default function SettingsShell({ children }: { children: React.ReactNode }) {
    const path = usePathname();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            setProfile(await getProfile());
        } catch (e) {
            if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                window.location.assign(`/auth/login?return=${encodeURIComponent(window.location.pathname)}`);
                return;
            }
            setError(errorText(e));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => setMessage(null), message.kind === 'err' ? 6000 : 3000);
        return () => clearTimeout(t);
    }, [message]);

    const toast = useCallback((kind: 'ok' | 'err', text: string) => setMessage({ kind, text }), []);

    if (error) {
        return (
            <div className="st-state">
                <h1>Settings can’t load right now</h1>
                <p>{error}</p>
                <button type="button" className="btn btn-primary" onClick={() => location.reload()}>Try again</button>
            </div>
        );
    }
    if (!profile) return <div className="st-state"><div className="st-spin" /></div>;

    return (
        <SettingsContext.Provider value={{ profile, setProfile, reload: load, toast }}>
            <div className="st-app">
                <aside className="st-side">
                    <a className="st-me" href={`/u/${profile.username}`} title="View your public profile">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile.username.charAt(0).toUpperCase()}</span>}
                        <div>
                            <b>{profile.username}</b>
                            <small>View public profile</small>
                        </div>
                    </a>
                    {NAV.map((g) => (
                        <nav key={g.group} aria-label={g.group}>
                            <h2>{g.group}</h2>
                            {g.items.map((i) => (
                                <a key={i.href} href={i.href} className={path === i.href ? 'on' : ''}>
                                    {i.label}
                                </a>
                            ))}
                        </nav>
                    ))}
                    <nav aria-label="Billing">
                        <h2>Billing</h2>
                        <a href="/panel/account/plan">Plan</a>
                    </nav>
                </aside>
                <div className="st-main">{children}</div>
            </div>
            {message ? <div className={`st-toast ${message.kind}`} role="status">{message.text}</div> : null}
        </SettingsContext.Provider>
    );
}

// One setting: what it is on the left, its control on the right or below.
export function Row({ title, desc, children }: { title: string; desc?: React.ReactNode; children?: React.ReactNode }) {
    return (
        <div className="st-row">
            <div>
                <h3>{title}</h3>
                {desc ? <p>{desc}</p> : null}
            </div>
            {children ? <div className="st-ctl">{children}</div> : null}
        </div>
    );
}

export function Field(props: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string; autoComplete?: string; placeholder?: string; maxLength?: number; inputMode?: 'numeric' }) {
    const { label, value, onChange, type = 'text', hint, autoComplete, placeholder, maxLength, inputMode } = props;
    return (
        <label className="st-field">
            <span>{label}</span>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} />
            {hint ? <small>{hint}</small> : null}
        </label>
    );
}
