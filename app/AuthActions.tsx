'use client';

// The bar's sign-in area. The landing and the panel share the robtic.org origin, so we ask the panel who is
// signed in (its session cookie is sent same-origin). Signed in -> the avatar, whose menu opens on a click or a
// right-click (profile, settings, dashboard, log out); signed out (or while checking) -> Sign in / Get started, so the
// bar is never empty. While signed in it also sends the ping that counts time on Robtic.
import { useState, useEffect, useRef } from 'react';
import { logout as signOut } from '@/lib/account';
import SwitchAccount from './SwitchAccount';
import { useHeartbeat } from './useHeartbeat';

type Me = { username: string; email: string; avatarUrl: string | null } | null;

export default function AuthActions({ panelRoot }: { panelRoot: string }) {
    const [me, setMe] = useState<Me>(null);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const wrap = useRef<HTMLDivElement>(null);
    useHeartbeat(!!me);

    useEffect(() => {
        let alive = true;
        fetch('/api/client/account', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!alive) return;
                const a = d && d.attributes;
                if (a && a.username) setMe({ username: a.username, email: a.email ?? '', avatarUrl: a.avatar_url ?? null });
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    // Close on a click outside the menu, or Escape.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const logout = () => {
        setLeaving(true);
        signOut();
    };

    if (me) {
        return (
            <div className="me-wrap" ref={wrap}>
                <button
                    type="button"
                    className="me"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-label={`Account menu (${me.username})`}
                    onClick={() => setOpen((o) => !o)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    {me.avatarUrl && !avatarFailed ? (
                        <img src={me.avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
                    ) : (
                        <span>{me.username.charAt(0).toUpperCase()}</span>
                    )}
                </button>
                {open ? (
                    <div className="me-menu" role="menu">
                        <div className="me-head">
                            <b>{me.username}</b>
                            {me.email ? <span>{me.email}</span> : null}
                        </div>
                        <a role="menuitem" href={`/u/${me.username}`}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 20v-1.5A4.5 4.5 0 0015.5 14h-7A4.5 4.5 0 004 18.5V20M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                            Profile
                        </a>
                        <a role="menuitem" href="/settings">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 19.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /></svg>
                            Settings
                        </a>
                        <a role="menuitem" href={`${panelRoot}/panel`}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
                            Dashboard
                        </a>
                        <button type="button" role="menuitem" onClick={() => { setOpen(false); setSwitching(true); }}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h13l-3-3M17 17H4l3 3" /></svg>
                            Switch account
                        </button>
                        <i className="me-sep" aria-hidden="true" />
                        <button type="button" role="menuitem" className="danger" disabled={leaving} onClick={logout}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" /></svg>
                            {leaving ? 'Logging out…' : 'Log out'}
                        </button>
                    </div>
                ) : null}
            {switching ? <SwitchAccount current={me.email} onClose={() => setSwitching(false)} /> : null}
            </div>
        );
    }

    return (
        <>
            <a className="btn btn-ghost" href={`${panelRoot}/auth/login`}>Sign in</a>
            <a className="btn btn-primary" href={`${panelRoot}/auth/register`}>Get started</a>
        </>
    );
}
