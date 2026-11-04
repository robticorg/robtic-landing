'use client';

import { useState } from 'react';
import { request, type Profile } from '@/lib/account';
import { Field, Modal, Row, useAct, useRun, useSettings } from '../SettingsShell';

// Settings -> Account: each setting shows what it is now, and its change opens in a popup.
type Popup = 'username';

export default function AccountSettings() {
    const { profile } = useSettings();
    const [popup, setPopup] = useState<Popup | null>(null);
    const close = () => setPopup(null);

    return (
        <>
            <header className="st-head">
                <h1>Account</h1>
                <p>Your username and how the panel looks.</p>
            </header>
            <section className="st-card">
                <Row value title="Username" desc={profile.username}>
                    <Change what="username" onClick={() => setPopup('username')} />
                </Row>
                <Row value title="Email and password" desc={profile.email}>
                    <a className="btn btn-ghost" href="/setting">Change</a>
                </Row>
            </section>
            <PanelView />
            {popup === 'username' ? <UsernamePopup onClose={close} /> : null}
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
