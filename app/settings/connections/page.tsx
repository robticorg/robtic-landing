'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONNECT_WINDOW } from '@/lib/account';

// Where a connect step comes back (GitHub or Discord, ?connection=…). Inside the connect window it tells the page that
// opened it (whose Settings popup updates in place) and closes; anywhere else it opens Settings → Connections with the
// outcome.
function Back() {
    const outcome = useSearchParams().get('connection') ?? '';
    useEffect(() => {
        if (window.name === CONNECT_WINDOW && window.opener) {
            try { window.opener.postMessage({ robticConnection: outcome }, window.location.origin); } catch { /* opener gone */ }
            window.close();
            return;
        }
        window.location.replace(`/?${new URLSearchParams({ settings: 'connections', ...(outcome ? { connection: outcome } : {}) })}`);
    }, [outcome]);
    return <main className="st-popup"><div className="st-spin" /><p>Done. This window closes itself.</p></main>;
}

export default function ConnectionsReturn() {
    return <Suspense fallback={null}><Back /></Suspense>;
}
