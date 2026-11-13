'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

// Signing in comes back to the page it was started from (a plan, a legal page, the Discord dashboard…), not always the
// panel: the panel's /oidc/login takes `return` and only accepts a path on this site.

/** `/oidc/login?return=<this page>`; `create` opens the sign-up instead. */
export function signInHref(panelRoot: string, here: string, create = false): string {
    const params = new URLSearchParams({ return: here || '/' });
    if (create) params.set('prompt', 'create');
    return `${panelRoot}/oidc/login?${params}`;
}

function Inner({ panelRoot, create, className, children }: { panelRoot: string; create?: boolean; className?: string; children: ReactNode }) {
    const path = usePathname() || '/';
    const query = useSearchParams()?.toString();
    return <a className={className} href={signInHref(panelRoot, query ? `${path}?${query}` : path, create)}>{children}</a>;
}

/** A Sign in (or, with `create`, Get started) link that returns to the current page. */
export function SignInLink(props: { panelRoot: string; create?: boolean; className?: string; children: ReactNode }) {
    // useSearchParams needs a Suspense boundary in a statically rendered page; the fallback links to the page itself.
    return (
        <Suspense fallback={<a className={props.className} href={signInHref(props.panelRoot, '/', props.create)}>{props.children}</a>}>
            <Inner {...props} />
        </Suspense>
    );
}
