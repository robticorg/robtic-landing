'use client';

import { useEffect, useState } from 'react';
import { PANEL_URL } from '@/lib/site';

const panelRoot = PANEL_URL.replace(/\/panel$/, '');

// Robtic: the hero button. New visitors get the free-month trial; someone already signed in has no trial to start,
// so it becomes "Open your panel" and sends them straight in.
export default function HeroCta({ label }: { label: string }) {
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        fetch(`${panelRoot}/api/bootstrap`, { credentials: 'include', headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setSignedIn(!!d?.user))
            .catch(() => {
                /* signed out or offline: keep the trial CTA */
            });
    }, []);

    return (
        <a className="btn btn-primary btn-lg" href={signedIn ? `${panelRoot}/panel` : `${panelRoot}/auth/register`}>
            {signedIn ? 'Open your panel' : label}
        </a>
    );
}
