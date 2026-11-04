'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { errorText, request } from '@/lib/account';
import { Field, Row, useRun, useSettings } from '../SettingsShell';

// Settings -> Devices and SSH: signed-in devices and SSH keys. Passwords and two-factor are at /setting.
export default function SecuritySettings() {
    return (
        <>
            <header className="st-head">
                <h1>Devices and SSH</h1>
                <p>See where you’re signed in and manage your SSH keys. Password and two-factor are under <a href="/setting">Sign-in and security</a>.</p>
            </header>
            <Devices />
            <SshKeys />
        </>
    );
}

function Devices() {
    const { toast } = useSettings();
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        request<{ data: unknown[] }>('GET', '/api/client/robtic/account/devices')
            .then((r) => setCount(r.data.length))
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);

    return (
        <Link className="st-card st-open" href="/settings/security/devices">
            <div>
                <h3>Signed-in devices</h3>
                <p>{count === null ? 'Where your account is signed in.' : `${count} device${count === 1 ? '' : 's'} signed in now.`}</p>
            </div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </Link>
    );
}

type Key = { attributes: { name: string; fingerprint: string; created_at: string } };

function SshKeys() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const [keys, setKeys] = useState<Key[] | null>(null);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [publicKey, setPublicKey] = useState('');

    const load = useCallback(() => {
        request<{ data: Key[] }>('GET', '/api/client/account/ssh-keys')
            .then((r) => setKeys(r.data))
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);
    useEffect(load, [load]);

    const add = async () => {
        if (await run(() => request('POST', '/api/client/account/ssh-keys', { name, public_key: publicKey }), 'SSH key added.')) {
            setName('');
            setPublicKey('');
            setAdding(false);
            load();
        }
    };
    const remove = async (fingerprint: string) => {
        if (await run(() => request('POST', '/api/client/account/ssh-keys/remove', { fingerprint }), 'SSH key removed.')) load();
    };

    return (
        <section className="st-card">
            <Row title="SSH keys" desc="Sign in to SFTP without a password.">
                {!adding ? <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>Add key</button> : null}
            </Row>
            {adding ? (
                <div className="st-inline">
                    <Field label="Name" value={name} onChange={setName} placeholder="My laptop" />
                    <label className="st-field">
                        <span>Public key</span>
                        <textarea rows={3} value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="ssh-ed25519 AAAA…" />
                    </label>
                    <div className="st-actions">
                        <button type="button" className="st-link" onClick={() => setAdding(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" disabled={pending || !name || !publicKey} onClick={add}>Add key</button>
                    </div>
                </div>
            ) : null}
            {keys?.map((k) => (
                <div className="st-item" key={k.attributes.fingerprint}>
                    <div>
                        <b>{k.attributes.name}</b>
                        <small><code>{k.attributes.fingerprint}</code></small>
                    </div>
                    <button type="button" className="st-link danger" disabled={pending} onClick={() => remove(k.attributes.fingerprint)}>Remove</button>
                </div>
            ))}
        </section>
    );
}
