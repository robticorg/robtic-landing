'use client';

// The bar's sign-in area. The landing and the panel share the robtic.org origin, so we ask the panel who is
// signed in (its session cookie is sent same-origin). Signed in -> the avatar, whose menu opens on a click or a
// right-click (profile, settings, dashboard, log out); signed out (or while checking) -> Sign in / Get started, so the
// bar is never empty. While signed in it also sends the ping that counts time on Robtic.
import { useState, useEffect, useRef } from 'react';
import { User, SlidersHorizontal, ArrowLeftRight, LogOut } from 'lucide-react';
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
                            <User aria-hidden="true" />
                            Profile
                        </a>
                        <a role="menuitem" href="/settings">
                            <SlidersHorizontal aria-hidden="true" />
                            Settings
                        </a>
                        <button type="button" role="menuitem" onClick={() => { setOpen(false); setSwitching(true); }}>
                            <ArrowLeftRight aria-hidden="true" />
                            Switch account
                        </button>
                        <i className="me-sep" aria-hidden="true" />
                        <button type="button" role="menuitem" className="danger" disabled={leaving} onClick={logout}>
                            <LogOut aria-hidden="true" />
                            {leaving ? 'Logging out…' : 'Log out'}
                        </button>
                    </div>
                ) : null}
            {switching ? <SwitchAccount onClose={() => setSwitching(false)} /> : null}
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
