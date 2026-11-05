'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { errorText, identity, IDENTITY, request, type Identity } from '@/lib/account';
import { CodeField, Field, Modal, Row, useAct, useRun, useSettings } from '../SettingsShell';

// Settings -> Security: password, passkeys, two-factor and recovery codes (all kept in Robtic Auth), and SSH keys.
type Popup = 'password' | 'authenticator' | 'passkey' | null;

export default function SecuritySettings() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const [me, setMe] = useState<Identity | null>(null);
    const [popup, setPopup] = useState<Popup>(null);
    const [codes, setCodes] = useState<string[] | null>(null);

    const load = useCallback(() => {
        identity().then(setMe).catch((e) => toast('err', errorText(e)));
    }, [toast]);
    useEffect(load, [load]);

    const close = () => {
        setPopup(null);
        load();
    };
    const change = async (action: () => Promise<unknown>, done: string) => {
        if (await run(action, done)) load();
    };
    const newCodes = async () => {
        const r = await run(() => request<{ codes: string[] }>('POST', `${IDENTITY}/recovery-codes`));
        if (r) {
            setCodes(r.codes);
            load();
        }
    };

    return (
        <>
            <header className="st-head">
                <h1>Security</h1>
                <p>How you sign in, and what protects your account.</p>
            </header>

            {!me ? <section className="st-card"><div className="st-spin" /></section> : (
                <>
                    <section className="st-card">
                        <Row value title="Password" desc={me.password ? '••••••••' : 'Not set. You sign in another way.'}>
                            <button type="button" className="btn btn-ghost" onClick={() => setPopup('password')}>{me.password ? 'Change' : 'Set'}</button>
                        </Row>
                    </section>

                    <section className="st-card">
                        <h2>Passkeys</h2>
                        <p className="st-sub">Sign in with your fingerprint, face or a security key, with nothing to type.</p>
                        {me.passkeys.map((key) => (
                            <Row key={key.id} title={key.name}>
                                <button type="button" className="st-link danger" disabled={pending} onClick={() => change(() => request('DELETE', `${IDENTITY}/passkeys/${encodeURIComponent(key.id)}`), 'Passkey removed.')}>Remove</button>
                            </Row>
                        ))}
                        <Row title={me.passkeys.length ? 'Add another passkey' : 'No passkeys yet'}>
                            <button type="button" className="btn btn-ghost" onClick={() => setPopup('passkey')}>Add</button>
                        </Row>
                    </section>

                    <section className="st-card">
                        <h2>Two-factor authentication</h2>
                        <p className="st-sub">A second step after your password, so your password alone isn’t enough.</p>
                        <Row title="Authenticator app" desc={me.authenticator ? 'On' : 'Off'}>
                            {me.authenticator ? (
                                <button type="button" className="st-link danger" disabled={pending} onClick={() => change(() => request('DELETE', `${IDENTITY}/authenticator`), 'Authenticator removed.')}>Remove</button>
                            ) : (
                                <button type="button" className="btn btn-ghost" onClick={() => setPopup('authenticator')}>Set up</button>
                            )}
                        </Row>
                        <Row title="Email codes" desc={me.email_codes ? 'On' : 'Off'}>
                            <button
                                type="button"
                                className={me.email_codes ? 'st-link danger' : 'btn btn-ghost'}
                                disabled={pending}
                                onClick={() => (me.email_codes
                                    ? change(() => request('DELETE', `${IDENTITY}/email-codes`), 'Email codes turned off.')
                                    : change(() => request('POST', `${IDENTITY}/email-codes`), 'Email codes turned on.'))}
                            >
                                {me.email_codes ? 'Remove' : 'Turn on'}
                            </button>
                        </Row>
                        <Row title="Recovery codes" desc={me.recovery_codes ? 'On. Each one signs you in once if you lose your second factor.' : 'Off. Keep a set somewhere safe in case you lose your second factor.'}>
                            {me.recovery_codes ? <button type="button" className="st-link danger" disabled={pending} onClick={() => change(() => request('DELETE', `${IDENTITY}/recovery-codes`), 'Recovery codes removed.')}>Remove</button> : null}
                            <button type="button" className="btn btn-ghost" disabled={pending} onClick={newCodes}>{me.recovery_codes ? 'Replace' : 'Create'}</button>
                        </Row>
                    </section>

                    {popup === 'password' ? <PasswordPopup has={me.password} onClose={close} /> : null}
                    {popup === 'authenticator' ? <AuthenticatorPopup onClose={close} /> : null}
                    {popup === 'passkey' ? <PasskeyPopup onClose={close} /> : null}
                    {codes ? <CodesPopup codes={codes} onClose={() => setCodes(null)} /> : null}
                </>
            )}

            <SshKeys />
        </>
    );
}

function PasswordPopup({ has, onClose }: { has: boolean; onClose: () => void }) {
    const { toast } = useSettings();
    const { act, busy, error } = useAct();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const body = { current: has ? current : undefined, password, password_confirmation: confirm };
        if (await act(() => request('PUT', `${IDENTITY}/password`, body))) {
            toast('ok', 'Password changed.');
            onClose();
        }
    };

    return (
        <Modal title={has ? 'Change your password' : 'Set a password'} onClose={onClose}>
            <form onSubmit={submit}>
                {has ? <Field label="Current password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" /> : null}
                <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
                <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
                {error ? <p className="st-error">{error}</p> : null}
                <button type="submit" className="btn btn-primary" disabled={busy || !password || password !== confirm || (has && !current)}>Save</button>
            </form>
        </Modal>
    );
}

function AuthenticatorPopup({ onClose }: { onClose: () => void }) {
    const { toast } = useSettings();
    const { act, busy, error } = useAct();
    const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
    const [code, setCode] = useState('');

    useEffect(() => {
        act(async () => {
            const r = await request<{ uri: string; secret: string }>('POST', `${IDENTITY}/authenticator`);
            setSetup({ secret: r.secret, qr: await QRCode.toDataURL(r.uri, { margin: 1, width: 200 }) });
        });
        // Once, when the popup opens: starting again would replace the key just shown.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await act(() => request('POST', `${IDENTITY}/authenticator/verify`, { code }))) {
            toast('ok', 'Authenticator is on.');
            onClose();
        }
    };

    return (
        <Modal title="Set up an authenticator app" onClose={onClose}>
            {setup ? (
                <form onSubmit={submit}>
                    <p className="st-sub">Scan this with your app, or enter the key by hand. Then type the code it shows.</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="st-qr" src={setup.qr} alt="QR code for your authenticator app" width={200} height={200} />
                    <p className="st-key"><code>{setup.secret}</code></p>
                    <CodeField label="Code from your app" value={code} onChange={setCode} />
                    {error ? <p className="st-error">{error}</p> : null}
                    <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>Turn on</button>
                </form>
            ) : error ? <p className="st-error">{error}</p> : <div className="st-spin" />}
        </Modal>
    );
}

// Binary values travel as base64url both ways.
const toBytes = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const toText = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

type PasskeyOptions = {
    publicKey: Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user' | 'excludeCredentials'> & {
        challenge: string;
        user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string };
        excludeCredentials?: Array<Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string }>;
    };
};

function PasskeyPopup({ onClose }: { onClose: () => void }) {
    const { toast } = useSettings();
    const { act, busy, error } = useAct();
    const [name, setName] = useState('');

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        const done = await act(async () => {
            const { id, options } = await request<{ id: string; options: PasskeyOptions }>('POST', `${IDENTITY}/passkeys`);
            const key = options.publicKey;
            const created = (await navigator.credentials.create({
                publicKey: {
                    ...key,
                    challenge: toBytes(key.challenge),
                    user: { ...key.user, id: toBytes(key.user.id) },
                    excludeCredentials: key.excludeCredentials?.map((c) => ({ ...c, id: toBytes(c.id) })),
                },
            })) as PublicKeyCredential | null;
            if (!created) throw new Error('No passkey was created.');
            const response = created.response as AuthenticatorAttestationResponse;
            await request('POST', `${IDENTITY}/passkeys/${encodeURIComponent(id)}`, {
                name,
                credential: {
                    id: created.id,
                    rawId: toText(created.rawId),
                    type: created.type,
                    response: { attestationObject: toText(response.attestationObject), clientDataJSON: toText(response.clientDataJSON) },
                },
            });
        });
        if (done) {
            toast('ok', 'Passkey added.');
            onClose();
        }
    };

    return (
        <Modal title="Add a passkey" onClose={onClose}>
            <form onSubmit={add}>
                <p className="st-sub">Your browser will ask you to confirm with your fingerprint, face or security key.</p>
                <Field label="Name it" value={name} onChange={setName} placeholder="My laptop" maxLength={64} />
                {error ? <p className="st-error">{error}</p> : null}
                <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>Continue</button>
            </form>
        </Modal>
    );
}

function CodesPopup({ codes, onClose }: { codes: string[]; onClose: () => void }) {
    return (
        <Modal title="Your recovery codes" onClose={onClose}>
            <p className="st-sub">Save these now: they won’t be shown again. Each one signs you in once.</p>
            <pre className="st-codes">{codes.join('\n')}</pre>
            <div className="st-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(codes.join('\n'))}>Copy</button>
                <button type="button" className="btn btn-primary" onClick={onClose}>I saved them</button>
            </div>
        </Modal>
    );
}

type Key = { attributes: { name: string; fingerprint: string } };

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
            setAdding(false);
            setName('');
            setPublicKey('');
            load();
        }
    };
    const remove = async (fingerprint: string) => {
        if (await run(() => request('POST', '/api/client/account/ssh-keys/remove', { fingerprint }), 'SSH key removed.')) load();
    };

    return (
        <section className="st-card">
            <Row title="SSH keys" desc="Connect to your apps’ files over SFTP without a password.">
                {!adding ? <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>Add key</button> : null}
            </Row>
            {adding ? (
                <div className="st-inline">
                    <Field label="Name" value={name} onChange={setName} />
                    <label className="st-field">
                        <span>Public key</span>
                        <textarea rows={3} value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="ssh-ed25519 AAAA…" />
                    </label>
                    <div className="st-actions">
                        <button type="button" className="st-link" onClick={() => setAdding(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" disabled={pending || !name || !publicKey} onClick={add}>Add</button>
                    </div>
                </div>
            ) : null}
            {keys?.map((k) => (
                <div className="st-item" key={k.attributes.fingerprint}>
                    <div>
                        <b>{k.attributes.name}</b>
                        <small>{k.attributes.fingerprint}</small>
                    </div>
                    <button type="button" className="st-link danger" disabled={pending} onClick={() => remove(k.attributes.fingerprint)}>Remove</button>
                </div>
            ))}
        </section>
    );
}
