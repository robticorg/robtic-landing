'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiError, errorText, IDENTITY, request } from '@/lib/account';

// The small window Settings → Connections opens to connect GitHub or Discord, so the settings page never leaves.
// It asks Robtic Auth for the provider's sign-in address and goes there. If the change needs a recent sign-in, that
// happens here too and comes back to this page, which then carries on. The provider's answer lands on
// /settings/connections?connection=… inside this window; that page tells the settings page and closes the window.

function Connecting() {
    const provider = useSearchParams().get('provider') ?? '';
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!provider) {
            setError('Nothing to connect.');
            return;
        }
        request<{ url: string }>('POST', `${IDENTITY}/providers/${encodeURIComponent(provider)}`)
            .then((r) => window.location.replace(r.url))
            .catch((e) => {
                if (e instanceof ApiError && e.status === 428) {
                    // Confirm it's you first (in this window), then come back here and continue.
                    const back = `/settings/connections/popup?${new URLSearchParams({ provider })}`;
                    window.location.replace(`/oidc/login?${new URLSearchParams({ prompt: 'login', return: back })}`);
                    return;
                }
                if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                    window.location.replace(`/auth/login?${new URLSearchParams({ return: `/settings/connections/popup?provider=${provider}` })}`);
                    return;
                }
                setError(errorText(e));
            });
    }, [provider]);

    return (
        <main className="st-popup">
            {error ? (
                <>
                    <p className="st-popup-err">{error}</p>
                    <button type="button" className="btn btn-ghost" onClick={() => window.close()}>Close</button>
                </>
            ) : (
                <>
                    <div className="st-spin" />
                    <p>Connecting…</p>
                </>
            )}
        </main>
    );
}

export default function ConnectPopup() {
    return (
        <Suspense fallback={<main className="st-popup"><div className="st-spin" /></main>}>
            <Connecting />
        </Suspense>
    );
}
