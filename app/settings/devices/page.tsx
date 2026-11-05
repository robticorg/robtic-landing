'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { errorText, request } from '@/lib/account';
import { useRun, useSettings } from '../SettingsShell';

// Settings -> Security -> Devices: everywhere the account is signed in, one card each.
type Device = { id: number; device: string; kind: 'desktop' | 'phone' | 'tablet'; ip: string; current: boolean; last_seen_at: string; first_seen_at: string };

const ICONS: Record<Device['kind'], string> = {
    desktop: 'M3 5h18v11H3zM8 20h8M12 16v4',
    phone: 'M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2',
    tablet: 'M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2',
};
const KINDS: Record<Device['kind'], string> = { desktop: 'Computer', phone: 'Phone', tablet: 'Tablet' };

const when = (v: string) => new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export default function DevicesPage() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const [devices, setDevices] = useState<Device[] | null>(null);

    const load = useCallback(() => {
        request<{ data: Device[] }>('GET', '/api/client/robtic/account/devices')
            .then((r) => setDevices(r.data))
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);
    useEffect(load, [load]);

    const signOut = async (id: number) => {
        if (await run(() => request('DELETE', `/api/client/robtic/account/devices/${id}`), 'Signed out.')) load();
    };
    const signOutOthers = async () => {
        if (await run(() => request('DELETE', '/api/client/robtic/account/devices'), 'Signed out everywhere else.')) load();
    };
    const others = (devices ?? []).filter((d) => !d.current).length;

    return (
        <>
            <header className="st-head">
                <Link className="st-crumb" href="/settings/security">Security</Link>
                <h1>Signed-in devices</h1>
                <p>Don’t recognise one? Sign it out, then change your password.</p>
            </header>

            {!devices ? <div className="st-spin" /> : null}

            <div className="st-dvs">
                {devices?.map((d) => (
                    <article key={d.id} className={`st-dv${d.current ? ' here' : ''}`}>
                        <div className="st-dv-top">
                            <span className="st-dv-ico" title={KINDS[d.kind]}>
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[d.kind]} /></svg>
                            </span>
                            <div>
                                <b>{d.device}</b>
                                {d.current ? <span className="st-pill">This device</span> : <small>{KINDS[d.kind]}</small>}
                            </div>
                        </div>
                        <dl>
                            <dt>IP address</dt>
                            <dd>{d.ip}</dd>
                            <dt>Last active</dt>
                            <dd>{d.current ? 'Now' : when(d.last_seen_at)}</dd>
                            <dt>First seen</dt>
                            <dd>{when(d.first_seen_at)}</dd>
                        </dl>
                        {!d.current ? (
                            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => signOut(d.id)}>
                                Sign out
                            </button>
                        ) : null}
                    </article>
                ))}
            </div>

            {others > 1 ? (
                <div className="st-actions" style={{ marginTop: 16 }}>
                    <button type="button" className="st-link danger" disabled={pending} onClick={signOutOthers}>
                        Sign out all the others
                    </button>
                </div>
            ) : null}
        </>
    );
}
