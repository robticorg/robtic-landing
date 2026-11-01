'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { errorText, request } from '@/lib/account';
import { Field, Row, useRun, useSettings } from '../SettingsShell';

// Settings -> Security: two-factor authentication, signed-in devices and SSH keys.
export default function SecuritySettings() {
    return (
        <>
            <header className="st-head">
                <h1>Security</h1>
                <p>Protect your account and see where you’re signed in.</p>
            </header>
            <TwoFactor />
            <Devices />
            <SshKeys />
        </>
    );
}

function TwoFactor() {
    const { profile, reload } = useSettings();
    const { run, pending } = useRun();
    const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
    const [disabling, setDisabling] = useState(false);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [tokens, setTokens] = useState<string[] | null>(null);

    const clear = () => {
        setSetup(null);
        setDisabling(false);
        setCode('');
        setPassword('');
    };
    const start = async () => {
        const r = await run(() => request<{ data: { image_url_data: string; secret: string } }>('GET', '/api/client/account/two-factor'));
        if (r) setSetup({ secret: r.data.secret, qr: await QRCode.toDataURL(r.data.image_url_data, { margin: 1, width: 200 }) });
    };
    const enable = async () => {
        const r = await run(() => request<{ attributes: { tokens: string[] } }>('POST', '/api/client/account/two-factor', { code, password }), 'Two-factor authentication is on.');
        if (r) {
            setTokens(r.attributes.tokens);
            clear();
            await reload();
        }
    };
    const disable = async () => {
        if (await run(() => request('POST', '/api/client/account/two-factor/disable', { password }), 'Two-factor authentication is off.')) {
            clear();
            await reload();
        }
    };

    return (
        <section className="st-card">
            <Row
                title="Two-factor authentication"
                desc={profile.two_factor ? 'On. Signing in asks for a code from your app.' : 'Off. Add a code from an authenticator app when you sign in.'}
            >
                {profile.two_factor ? (
                    !disabling && <button type="button" className="st-link danger" onClick={() => setDisabling(true)}>Turn off</button>
                ) : (
                    !setup && <button type="button" className="btn btn-primary" disabled={pending || !profile.password_set} onClick={start}>Turn on</button>
                )}
            </Row>
            {!profile.password_set ? <p className="st-sub">Set a password under Account first: turning this on needs it.</p> : null}

            {setup ? (
                <div className="st-2fa">
                    <img src={setup.qr} alt="QR code for your authenticator app" width={200} height={200} />
                    <div>
                        <p className="st-sub">Scan this with an authenticator app, or enter the key by hand:</p>
                        <code>{setup.secret}</code>
                        <Field label="Code from the app" value={code} onChange={setCode} autoComplete="one-time-code" inputMode="numeric" maxLength={6} />
                        <Field label="Your password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
                        <div className="st-actions">
                            <button type="button" className="st-link" onClick={clear}>Cancel</button>
                            <button type="button" className="btn btn-primary" disabled={pending || code.length !== 6 || !password} onClick={enable}>Turn on</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {disabling ? (
                <div className="st-inline">
                    <Field label="Your password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
                    <div className="st-actions">
                        <button type="button" className="st-link" onClick={clear}>Cancel</button>
                        <button type="button" className="btn btn-ghost" disabled={pending || !password} onClick={disable}>Turn off</button>
                    </div>
                </div>
            ) : null}

            {tokens ? (
                <div className="st-tokens">
                    <h3>Save your recovery codes</h3>
                    <p className="st-sub">Each one signs you in once if you lose your app. They won’t be shown again.</p>
                    <pre>{tokens.join('\n')}</pre>
                    <button type="button" className="btn btn-ghost" onClick={() => setTokens(null)}>I’ve saved them</button>
                </div>
            ) : null}
        </section>
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
        <a className="st-card st-open" href="/settings/security/devices">
            <div>
                <h3>Signed-in devices</h3>
                <p>{count === null ? 'Where your account is signed in.' : `${count} device${count === 1 ? '' : 's'} signed in now.`}</p>
            </div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
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
