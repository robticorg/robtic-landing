'use client';

// The Settings frame: who you are at the top of a left nav, the sections under it, one page each. Signed-out visitors
// go to sign in and come back here.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const BACK_KEY = 'robtic-settings-back';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiError, errorText, getProfile, type Profile } from '@/lib/account';

const NAV: Array<{ group: string; items: Array<{ href: string; label: string }> }> = [
    { group: 'You', items: [{ href: '/settings', label: 'Public profile' }, { href: '/settings/account', label: 'Account' }] },
    { group: 'Preferences', items: [{ href: '/settings/notifications', label: 'Notifications' }] },
    { group: 'Access', items: [{ href: '/settings/security', label: 'Security' }, { href: '/settings/connections', label: 'Connections' }, { href: '/settings/devices', label: 'Devices' }] },
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

// A change that needs a recent sign-in sends the person through one and back to this page.
function needsSignIn(e: unknown): boolean {
    if (!(e instanceof ApiError) || e.status !== 428) return false;
    window.location.assign(`/oidc/login?${new URLSearchParams({ prompt: 'login', return: window.location.pathname })}`);
    return true;
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
            if (!needsSignIn(e)) toast('err', errorText(e));
            return null;
        } finally {
            setPending(false);
        }
    };
    return { run, pending };
}

// The same for a popup: a toast would sit behind it, so the failure is kept here to show inside.
export function useAct() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const act = async <T,>(action: () => Promise<T>): Promise<T | null> => {
        setBusy(true);
        setError(null);
        try {
            const r = await action();
            return r === undefined ? (true as T) : r;
        } catch (e) {
            if (!needsSignIn(e)) setError(errorText(e));
            return null;
        } finally {
            setBusy(false);
        }
    };
    return { act, busy, error, setError };
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        dialog.showModal();
        dialog.querySelector<HTMLElement>('input, textarea')?.focus();
        return () => dialog.close();
    }, []);

    return (
        <dialog
            ref={ref}
            className="st-modal"
            aria-label={title}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <header>
                <h2>{title}</h2>
                <button type="button" className="st-x" aria-label="Close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
            </header>
            {children}
        </dialog>
    );
}

export default function SettingsShell({ children }: { children: React.ReactNode }) {
    const path = usePathname();
    // The email link opens this page from any device, signed in or not.
    // …and the connect window is a page of its own, without the Settings frame.
    const open = path === '/settings/email/confirm' || path === '/settings/connections/popup';
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const [back, setBack] = useState('/');

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
        if (!open) load();
    }, [load, open]);

    // On a phone the sections are one sliding row: keep the open one in view.
    const ready = !!profile;
    useEffect(() => {
        if (ready) document.querySelector('.st-tabs a.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }, [path, ready]);

    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => setMessage(null), message.kind === 'err' ? 6000 : 3000);
        return () => clearTimeout(t);
    }, [message]);

    const toast = useCallback((kind: 'ok' | 'err', text: string) => setMessage({ kind, text }), []);

    // Back leaves Settings: to the page you came from on the site, however many sections you opened since.
    useEffect(() => {
        const from = document.referrer ? new URL(document.referrer) : null;
        if (from && from.origin === window.location.origin && !from.pathname.startsWith('/settings')) {
            // The panel's old account pages only redirect here, so going back to them would come straight back.
            sessionStorage.setItem(BACK_KEY, from.pathname.startsWith('/panel/account') ? '/panel' : from.pathname + from.search);
        }
        setBack(sessionStorage.getItem(BACK_KEY) ?? '/');
    }, []);

    if (open) return <>{children}</>;
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
                    <a className="st-back" href={back}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                        Back
                    </a>
                    <a className="st-me" href={`/u/${profile.username}`} title="View your public profile">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile.username.charAt(0).toUpperCase()}</span>}
                        <div>
                            <b>{profile.username}</b>
                            <small>View public profile</small>
                        </div>
                    </a>
                    <div className="st-tabs">
                        {NAV.map((g) => (
                            <nav key={g.group} aria-label={g.group}>
                                <h2>{g.group}</h2>
                                {g.items.map((i) => (
                                    <Link key={i.href} href={i.href} className={path === i.href || (i.href !== '/settings' && path.startsWith(`${i.href}/`)) ? 'on' : ''}>
                                        {i.label}
                                    </Link>
                                ))}
                            </nav>
                        ))}
                        <nav aria-label="Billing">
                            <h2>Billing</h2>
                            <Link href="/settings/plan" className={path === '/settings/plan' ? 'on' : ''}>Plan</Link>
                        </nav>
                    </div>
                </aside>
                <div className="st-main">{children}</div>
            </div>
            {message ? <div className={`st-toast ${message.kind}`} role="status">{message.text}</div> : null}
        </SettingsContext.Provider>
    );
}

// One setting: what it is on the left, its control on the right or below.
export function Row({ title, desc, value, children }: { title: string; desc?: React.ReactNode; value?: boolean; children?: React.ReactNode }) {
    return (
        <div className={value ? 'st-row st-value' : 'st-row'}>
            <div>
                <h3>{title}</h3>
                {desc ? <p>{desc}</p> : null}
            </div>
            {children ? <div className="st-ctl">{children}</div> : null}
        </div>
    );
}

export function Field(props: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string; autoComplete?: string; placeholder?: string; maxLength?: number; inputMode?: 'numeric'; autoFocus?: boolean }) {
    const { label, value, onChange, type = 'text', hint, autoComplete, placeholder, maxLength, inputMode, autoFocus } = props;
    return (
        <label className="st-field">
            <span>{label}</span>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} autoFocus={autoFocus} />
            {hint ? <small>{hint}</small> : null}
        </label>
    );
}

// A code: one box per character, with one real input over them, so typing, pasting and autofill all just work.
export function CodeField({ label, value, onChange, length = 6 }: { label: string; value: string; onChange: (v: string) => void; length?: number }) {
    return (
        <label className="st-otp">
            <span>{label}</span>
            <span className="st-otp-boxes">
                {Array.from({ length }, (_, i) => (
                    <span key={i} className={i === Math.min(value.length, length - 1) ? 'st-otp-box now' : 'st-otp-box'}>{value[i]}</span>
                ))}
                <input type="text" value={value} maxLength={length} autoComplete="one-time-code" spellCheck={false} onChange={(e) => onChange(e.target.value.replace(/\s/g, ''))} />
            </span>
        </label>
    );
}
