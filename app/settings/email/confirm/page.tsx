'use client';

import { useState } from 'react';
import { errorText, request } from '@/lib/account';

// Where the link from an email change lands. It waits for a click because mail scanners open links on their own.
export default function ConfirmEmail() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const confirm = async () => {
        setBusy(true);
        setError(null);
        try {
            const token = new URLSearchParams(window.location.search).get('token') ?? '';
            const r = await request<{ data: { email: string } }>('POST', '/api/robtic/email/confirm', { token });
            setEmail(r.data.email);
        } catch (e) {
            setError(errorText(e));
        } finally {
            setBusy(false);
        }
    };

    if (email) {
        return (
            <div className="st-state">
                <h1>Your email is changed</h1>
                <p>Your account now uses {email}.</p>
                <a className="btn btn-primary" href="/settings/account">Open your account</a>
            </div>
        );
    }

    return (
        <div className="st-state">
            <h1>Confirm your new email</h1>
            <p>This makes it the email of your Robtic account.</p>
            {error ? <p className="st-err" role="alert">{error}</p> : null}
            <button type="button" className="btn btn-primary st-confirm" disabled={busy} onClick={confirm}>Confirm this email</button>
        </div>
    );
}
