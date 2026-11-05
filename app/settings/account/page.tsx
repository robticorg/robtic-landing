'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { identity, IDENTITY, request, type Identity, type Profile } from '@/lib/account';
import { CodeField, Field, Modal, Row, useAct, useRun, useSettings } from '../SettingsShell';

// Settings -> Account: each setting shows what it is now, and its change opens in a popup.
type Popup = 'name' | 'username' | 'email';

export default function AccountSettings() {
    const { profile } = useSettings();
    const [popup, setPopup] = useState<Popup | null>(null);
    const [me, setMe] = useState<Identity | null>(null);
    const load = useCallback(() => {
        identity().then(setMe).catch(() => setMe(null));
    }, []);
    useEffect(load, [load]);
    const close = () => {
        setPopup(null);
        load();
    };

    return (
        <>
            <header className="st-head">
                <h1>Account</h1>
                <p>Your name, username and email, and how the panel looks.</p>
            </header>
            <section className="st-card">
                <Row value title="Name" desc={me ? `${me.name.first} ${me.name.last}`.trim() : '…'}>
                    <Change what="name" onClick={() => setPopup('name')} />
                </Row>
                <Row value title="Username" desc={profile.username}>
                    <Change what="username" onClick={() => setPopup('username')} />
                </Row>
                <Row value title="Email" desc={me ? `${me.email.address}${me.email.verified ? '' : ' (not confirmed yet)'}` : profile.email}>
                    <Change what="email" onClick={() => setPopup('email')} />
                </Row>
            </section>
            <PanelView />
            {popup === 'username' ? <UsernamePopup onClose={close} /> : null}
            {popup === 'name' && me ? <NamePopup first={me.name.first} last={me.name.last} onClose={close} /> : null}
            {popup === 'email' ? <EmailPopup onClose={close} /> : null}
        </>
    );
}

// On a phone there's room for the verb only; the row's title says what it changes.
function Change({ what, verb = 'Change', onClick }: { what: string; verb?: string; onClick: () => void }) {
    return (
        <button type="button" className="btn btn-ghost" aria-label={`${verb} ${what}`} onClick={onClick}>
            {verb}<span className="st-noun">{what}</span>
        </button>
    );
}

// How the panel's home opens: workspaces (the canvas) or the classic list of apps.
function PanelView() {
    const { profile, setProfile } = useSettings();
    const { run, pending } = useRun();

    const choose = async (enabled: boolean) => {
        if (enabled === profile.workspace_ui) return;
        if (await run(() => request('PUT', '/api/client/robtic/interface', { enabled }), enabled ? 'Workspaces it is.' : 'The classic view it is.')) {
            setProfile({ ...profile, workspace_ui: enabled });
        }
    };

    return (
        <section className="st-card">
            <Row title="Panel view" desc="How your panel’s home opens.">
                <div className="st-seg" role="radiogroup" aria-label="Panel view">
                    {([[true, 'Workspaces'], [false, 'Classic']] as Array<[boolean, string]>).map(([on, label]) => (
                        <button key={label} type="button" role="radio" aria-checked={on === profile.workspace_ui} className={on === profile.workspace_ui ? 'on' : ''} disabled={pending} onClick={() => choose(on)}>
                            {label}
                        </button>
                    ))}
                </div>
            </Row>
        </section>
    );
}

function UsernamePopup({ onClose }: { onClose: () => void }) {
    const { profile, setProfile, toast } = useSettings();
    const { act, busy, error } = useAct();
    const [username, setUsername] = useState(profile.username);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await act(() => request<{ data: Profile }>('PUT', '/api/client/robtic/account/username', { username }));
        if (r) {
            setProfile(r.data);
            toast('ok', 'Username changed.');
            onClose();
        }
    };

    return (
        <Modal title="Change username" onClose={onClose}>
            <form onSubmit={save}>
                <p className="st-sub">It’s also your profile’s address. The old address stops working when you change it.</p>
                <Field label="New username" value={username} onChange={setUsername} autoComplete="username" maxLength={191} />
                {error ? <p className="st-err" role="alert">{error}</p> : null}
                <div className="st-actions">
                    <button type="button" className="st-link" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={busy || !username || username === profile.username}>Change username</button>
                </div>
            </form>
        </Modal>
    );
}

function NamePopup({ first: firstNow, last: lastNow, onClose }: { first: string; last: string; onClose: () => void }) {
    const { toast } = useSettings();
    const { act, busy, error } = useAct();
    const [first, setFirst] = useState(firstNow);
    const [last, setLast] = useState(lastNow);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await act(() => request('PUT', `${IDENTITY}/name`, { first, last }))) {
            toast('ok', 'Name changed.');
            onClose();
        }
    };

    return (
        <Modal title="Change your name" onClose={onClose}>
            <form onSubmit={submit}>
                <Field label="First name" value={first} onChange={setFirst} autoComplete="given-name" />
                <Field label="Last name (optional)" value={last} onChange={setLast} autoComplete="family-name" />
                {error ? <p className="st-error">{error}</p> : null}
                <button type="submit" className="btn btn-primary" disabled={busy || !first.trim()}>Save</button>
            </form>
        </Modal>
    );
}

// The new address only counts once the code sent to it is confirmed.
function EmailPopup({ onClose }: { onClose: () => void }) {
    const { toast, reload } = useSettings();
    const { act, busy, error } = useAct();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [sent, setSent] = useState(false);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await act(() => request('POST', `${IDENTITY}/email`, { email }))) setSent(true);
    };
    const confirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await act(() => request('POST', `${IDENTITY}/email/verify`, { code }))) {
            toast('ok', 'Email changed.');
            await reload();
            onClose();
        }
    };

    return (
        <Modal title="Change your email" onClose={onClose}>
            {sent ? (
                <form onSubmit={confirm}>
                    <p className="st-sub">We sent a code to <b>{email}</b>. Type it here.</p>
                    <CodeField label="Code" value={code} onChange={setCode} />
                    {error ? <p className="st-error">{error}</p> : null}
                    <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>Confirm</button>
                </form>
            ) : (
                <form onSubmit={send}>
                    <Field label="New email" type="email" value={email} onChange={setEmail} autoComplete="email" />
                    {error ? <p className="st-error">{error}</p> : null}
                    <button type="submit" className="btn btn-primary" disabled={busy || !email.includes('@')}>Send code</button>
                </form>
            )}
        </Modal>
    );
}
