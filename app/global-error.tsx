'use client';

// The last resort when the root layout itself fails: tell Sentry and offer a way back.
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 12, textAlign: 'center', background: '#070b14', color: '#e8eefb', fontFamily: 'system-ui, sans-serif' }}>
                <h1 style={{ margin: 0, fontSize: 24 }}>Something went wrong</h1>
                <p style={{ margin: 0, color: '#93a1ba' }}>We’ve been told about it. Try again in a moment.</p>
                <a href="/" style={{ color: '#6cc0ff' }}>Reload</a>
            </body>
        </html>
    );
}
