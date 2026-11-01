'use client';

import { useEffect, useState } from 'react';
import { errorText, request } from '@/lib/account';
import { useRun, useSettings } from '../SettingsShell';

// Settings -> Notifications: the optional emails. Important ones (sign-in codes, invitations, billing) always go out.
type Pref = { key: string; label: string; enabled: boolean };
const URL = '/api/client/robtic/account/notifications';

export default function NotificationSettings() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const [prefs, setPrefs] = useState<Pref[] | null>(null);

    useEffect(() => {
        request<{ data: Pref[] }>('GET', URL)
            .then((r) => setPrefs(r.data))
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);

    const set = async (key: string, enabled: boolean) => {
        const r = await run(() => request<{ data: Pref[] }>('PUT', URL, { key, enabled }));
        if (r) setPrefs(r.data);
    };

    return (
        <>
            <header className="st-head">
                <h1>Notifications</h1>
                <p>Choose which emails you get. Sign-in codes, invitations and billing emails are always sent.</p>
            </header>
            <section className="st-card">
                {!prefs ? <div className="st-spin" /> : null}
                {prefs?.map((p) => (
                    <label className="st-switch" key={p.key}>
                        <span>{p.label}</span>
                        <input type="checkbox" role="switch" checked={p.enabled} disabled={pending} onChange={(e) => set(p.key, e.target.checked)} />
                        <i aria-hidden="true" />
                    </label>
                ))}
            </section>
        </>
    );
}
