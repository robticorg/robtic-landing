// Robtic's account settings, as one popup shared by every Robtic place (the landing, Robtic Discord's dashboard and
// Robtic Hosting's panel). It is built into one script (scripts/build-settings.ts → /rl/robtic/settings/settings.js)
// that draws inside its own shadow root, so no page's styles reach in or out; only its colours follow the place that
// opened it (theme "discord": Robtic's navy and blue; theme "hosting": Robtic Hosting's black and white).
//
// Who you are at the top of a left menu, the sections under it, one at a time. On a phone it fills the screen and the
// sections are one sliding row. Everything talks to the panel's account API on the same site (lib/account).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ApiError, errorText, getProfile, type Profile } from '@/lib/account';

export type Section = 'profile' | 'account' | 'notifications' | 'security' | 'connections' | 'devices' | 'plan';
export const SECTIONS: Section[] = ['profile', 'account', 'notifications', 'security', 'connections', 'devices', 'plan'];

const NAV: Array<{ group: string; items: Array<{ id: Section; label: string }> }> = [
    { group: 'You', items: [{ id: 'profile', label: 'Public profile' }, { id: 'account', label: 'Account' }] },
    { group: 'Preferences', items: [{ id: 'notifications', label: 'Notifications' }] },
    { group: 'Access', items: [{ id: 'security', label: 'Security' }, { id: 'connections', label: 'Connections' }, { id: 'devices', label: 'Devices' }] },
    { group: 'Billing', items: [{ id: 'plan', label: 'Plan' }] },
];

type Ctx = {
    profile: Profile;
    setProfile: (p: Profile) => void;
    reload: () => Promise<void>;
    toast: (kind: 'ok' | 'err', text: string) => void;
    /** Open another section of the popup. */
    go: (s: Section) => void;
    /** What the address carried when the popup opened (a connection's outcome, for example). */
    params: Record<string, string>;
};

const SettingsContext = createContext<Ctx | null>(null);

export function useSettings(): Ctx {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings outside the Settings popup');
    return ctx;
}

/** The section the popup shows now, kept for a sign-in round trip (see needsSignIn). */
let current: Section = 'profile';

/** The address to come back to with the popup open on a section. */
export function returnTo(section: Section = current): string {
    const u = new URL(window.location.href);
    u.searchParams.set('settings', section);
    return u.pathname + u.search;
}

// A change that needs a recent sign-in sends the person through one and back, with Settings open where they were.
function needsSignIn(e: unknown): boolean {
    if (!(e instanceof ApiError) || e.status !== 428) return false;
    window.location.assign(`/oidc/login?${new URLSearchParams({ prompt: 'login', return: returnTo() })}`);
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

// The same for a popup inside Settings: a toast would sit behind it, so the failure is kept here to show inside.
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

/** The popup: a backdrop, the panel, the left menu and the open section. `render` draws a section. */
export default function SettingsPopup({ section: first, params, onClose, render }: {
    section: Section;
    params: Record<string, string>;
    onClose: () => void;
    render: (s: Section) => React.ReactNode;
}) {
    const [section, setSection] = useState<Section>(first);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const panel = useRef<HTMLDivElement>(null);
    current = section;

    const load = useCallback(async () => {
        try {
            setProfile(await getProfile());
        } catch (e) {
            if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                window.location.assign(`/auth/login?return=${encodeURIComponent(returnTo())}`);
                return;
            }
            setError(errorText(e));
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    // Escape closes (a dialog inside Settings handles its own Escape first). Focus starts in the panel.
    useEffect(() => {
        const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
        window.addEventListener('keydown', key);
        panel.current?.focus();
        return () => window.removeEventListener('keydown', key);
    }, [onClose]);

    // On a phone the sections are one sliding row: keep the open one in view; a new section starts at its top.
    useEffect(() => {
        const root = panel.current;
        root?.querySelector('.st-tabs button.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
        root?.querySelector('.st-main')?.scrollTo({ top: 0 });
    }, [section, profile]);

    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => setMessage(null), message.kind === 'err' ? 6000 : 3000);
        return () => clearTimeout(t);
    }, [message]);

    const toast = useCallback((kind: 'ok' | 'err', text: string) => setMessage({ kind, text }), []);

    let body: React.ReactNode;
    if (error) {
        body = (
            <div className="st-state">
                <h1>Settings can’t load right now</h1>
                <p>{error}</p>
                <button type="button" className="btn btn-primary" onClick={() => { setError(null); load(); }}>Try again</button>
            </div>
        );
    } else if (!profile) {
        body = <div className="st-state"><div className="st-spin" /></div>;
    } else {
        body = (
            <SettingsContext.Provider value={{ profile, setProfile, reload: load, toast, go: setSection, params }}>
                <div className="st-app">
                    <aside className="st-side">
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
                                        <button key={i.id} type="button" className={section === i.id ? 'on' : ''} aria-current={section === i.id ? 'page' : undefined} onClick={() => setSection(i.id)}>
                                            {i.label}
                                        </button>
                                    ))}
                                </nav>
                            ))}
                        </div>
                    </aside>
                    <div className="st-main">{render(section)}</div>
                </div>
            </SettingsContext.Provider>
        );
    }

    return (
        <div className="st-pop" role="presentation">
            <div className="st-pop-bg" onClick={onClose} aria-hidden="true" />
            <div className="st-pop-panel" role="dialog" aria-modal="true" aria-label="Settings" tabIndex={-1} ref={panel}>
                <header className="st-pop-head">
                    <b>Settings</b>
                    <button type="button" className="st-x" aria-label="Close settings" onClick={onClose}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </header>
                {body}
            </div>
            {message ? <div className={`st-toast ${message.kind}`} role="status">{message.text}</div> : null}
        </div>
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
