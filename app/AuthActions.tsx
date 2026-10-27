'use client';

// The bar's sign-in area. The landing and the panel share the robtic.org origin, so we ask the panel who is
// signed in (its session cookie is sent same-origin). Signed in -> the avatar that opens the panel; signed out
// (or while checking) -> Sign in / Get started, so the bar is never empty. Logout lives in the panel itself.
import { useState, useEffect } from 'react';

type Me = { username: string; avatarUrl: string | null } | null;

export default function AuthActions({ panelRoot }: { panelRoot: string }) {
    const [me, setMe] = useState<Me>(null);
    const [avatarFailed, setAvatarFailed] = useState(false);

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

    if (me) {
        return (
            <a className="me" href={`${panelRoot}/panel`} title="Open the panel" aria-label={`Open the panel (${me.username})`}>
                {me.avatarUrl && !avatarFailed ? (
                    <img src={me.avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
                ) : (
                    <span>{me.username.charAt(0).toUpperCase()}</span>
                )}
            </a>
        );
    }

    return (
        <>
            <a className="btn btn-ghost" href={`${panelRoot}/auth/login`}>Sign in</a>
            <a className="btn btn-primary" href={`${panelRoot}/auth/register`}>Get started</a>
        </>
    );
}
