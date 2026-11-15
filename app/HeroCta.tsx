'use client';

import { useEffect, useState } from 'react';
import { PANEL_URL } from '@/lib/site';

const panelRoot = PANEL_URL.replace(/\/panel$/, '');

// Robtic: a hero button that knows whether the visitor is signed in. Each page says what it offers to each: the home
// page asks a new visitor to create an account, a service page to start that service.
export default function HeroCta({
    label,
    href,
    signedInLabel,
    signedInHref,
}: {
    label: string;
    href: string;
    signedInLabel?: string;
    signedInHref?: string;
}) {
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        if (!signedInLabel) return;
        fetch(`${panelRoot}/api/bootstrap`, { credentials: 'include', headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setSignedIn(!!d?.user))
            .catch(() => {
                /* signed out or offline: keep the first label */
            });
    }, [signedInLabel]);

    const useSignedIn = signedIn && signedInLabel;
    return (
        <a className="btn btn-primary btn-lg" href={useSignedIn ? (signedInHref ?? href) : href}>
            {useSignedIn ? signedInLabel : label}
        </a>
    );
}
