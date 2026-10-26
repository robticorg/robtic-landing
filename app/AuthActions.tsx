'use client';

// The bar's sign-in area. The landing and the panel share the robtic.org origin, so we can ask the panel who
// is signed in (its session cookie is sent same-origin). Signed in -> the avatar that opens the panel plus a
// Sign out; signed out (or while checking) -> Sign in / Get started, so the bar is never empty.
import { useState, useEffect } from 'react';

type Me = { username: string; avatarUrl: string | null } | null;

function cookie(name: string): string | null {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : null;
}

export default function AuthActions({ panelRoot }: { panelRoot: string }) {
    const [me, setMe] = useState<Me>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch('/api/client/account', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!alive) return;
                const a = d && d.attributes;
                if (a && a.username) setMe({ username: a.username, avatarUrl: a.avatar_url ?? null });
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    const logout = async () => {
        setBusy(true);
        try {
            // Make sure an XSRF cookie exists, then post logout as the panel's own frontend would.
            await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
            const xsrf = cookie('XSRF-TOKEN');
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                },
            });
        } catch {
            /* ignore — fall through to reload */
        }
        setMe(null);
        window.location.href = '/';
    };

    if (me) {
        return (
            <>
                <a className="me" href={`${panelRoot}/panel`} title="Open the panel" aria-label={`Open the panel (${me.username})`}>
                    {me.avatarUrl ? <img src={me.avatarUrl} alt="" /> : <span>{me.username.charAt(0).toUpperCase()}</span>}
                </a>
                <button type="button" className="btn btn-ghost" onClick={logout} disabled={busy}>
                    {busy ? 'Signing out…' : 'Sign out'}
                </button>
            </>
        );
    }

    return (
        <>
            <a className="btn btn-ghost" href={`${panelRoot}/auth/login`}>Sign in</a>
            <a className="btn btn-primary" href={`${panelRoot}/auth/register`}>Get started</a>
        </>
    );
}
