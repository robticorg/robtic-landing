'use client';

import { useState } from 'react';
import { request, type Profile } from '@/lib/account';
import { Field, useRun, useSettings } from '../SettingsShell';

// Settings -> Account: username, email and password.
export default function AccountSettings() {
    return (
        <>
            <header className="st-head">
                <h1>Account</h1>
                <p>Your username, email address and password.</p>
            </header>
            <Username />
            <Email />
            <Password />
            <PanelView />
        </>
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
            <h2>Panel view</h2>
            <p className="st-sub">How your panel’s home opens.</p>
            <div className="st-seg" role="radiogroup" aria-label="Panel view">
                {([[true, 'Workspaces'], [false, 'Classic']] as Array<[boolean, string]>).map(([on, label]) => (
                    <button key={label} type="button" role="radio" aria-checked={on === profile.workspace_ui} className={on === profile.workspace_ui ? 'on' : ''} disabled={pending} onClick={() => choose(on)}>
                        {label}
                    </button>
                ))}
            </div>
        </section>
    );
}

function Username() {
    const { profile, setProfile } = useSettings();
    const { run, pending } = useRun();
    const [username, setUsername] = useState(profile.username);

    const save = async () => {
        const r = await run(() => request<{ data: Profile }>('PUT', '/api/client/robtic/account/username', { username }), 'Username changed.');
        if (r) {
            setProfile(r.data);
            setUsername(r.data.username);
        }
    };

    return (
        <section className="st-card">
            <h2>Username</h2>
            <p className="st-sub">It’s also your profile’s address. The old address stops working when you change it.</p>
            <Field label="Username" value={username} onChange={setUsername} autoComplete="username" maxLength={191} />
            <div className="st-actions">
                <button type="button" className="btn btn-primary" disabled={pending || !username || username === profile.username} onClick={save}>Change username</button>
            </div>
        </section>
    );
}

function Email() {
    const { profile, reload, toast } = useSettings();
    const { run, pending } = useRun();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [sentTo, setSentTo] = useState<string | null>(null);

    const change = async (withCode: string | undefined) => {
        const r = await run(() => request('PUT', '/api/client/account/email', { email, password, code: withCode }), 'Email changed.');
        if (r) {
            setEmail('');
            setPassword('');
            setCode('');
            setSentTo(null);
            await reload();
        }
    };

    // With email set up the panel sends a code to the current address first; without it, the change is immediate.
    const start = async () => {
        const r = await run(() => request<{ data: { sent: boolean; to?: string } }>('POST', '/api/client/account/email/code', { email, password }));
        if (!r) return;
        if (r.data.sent) {
            setSentTo(r.data.to ?? 'your current address');
            toast('ok', 'We sent you a code.');
        } else {
            await change(undefined);
        }
    };

    if (!profile.password_set) {
        return (
            <section className="st-card">
                <h2>Email</h2>
                <p className="st-sub">{profile.email}. Set a password below to change it.</p>
            </section>
        );
    }

    return (
        <section className="st-card">
            <h2>Email</h2>
            <p className="st-sub">Now: {profile.email}</p>
            {sentTo ? (
                <>
                    <Field label={`Code sent to ${sentTo}`} value={code} onChange={setCode} autoComplete="one-time-code" inputMode="numeric" />
                    <div className="st-actions">
                        <button type="button" className="st-link" onClick={() => setSentTo(null)}>Back</button>
                        <button type="button" className="btn btn-primary" disabled={pending || !code} onClick={() => change(code)}>Confirm change</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="st-two">
                        <Field label="New email" type="email" value={email} onChange={setEmail} autoComplete="email" />
                        <Field label="Current password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
                    </div>
                    <div className="st-actions">
                        <button type="button" className="btn btn-primary" disabled={pending || !email || !password} onClick={start}>Change email</button>
                    </div>
                </>
            )}
        </section>
    );
}

function Password() {
    const { profile, reload } = useSettings();
    const { run, pending } = useRun();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const has = profile.password_set;
    const mismatch = confirm !== '' && password !== confirm;

    const save = async () => {
        const r = await run(
            () =>
                has
                    ? request('PUT', '/api/client/account/password', { current_password: current, password, password_confirmation: confirm })
                    : request('POST', '/api/client/robtic/account/password', { password, password_confirmation: confirm }),
            has ? 'Password changed.' : 'Password set.'
        );
        if (r) {
            setCurrent('');
            setPassword('');
            setConfirm('');
            if (!has) await reload();
        }
    };

    return (
        <section className="st-card">
            <h2>Password</h2>
            <p className="st-sub">{has ? 'Changing it signs you out on your other devices.' : 'You sign in with GitHub or Discord. Add a password to sign in with your email too.'}</p>
            {has ? <Field label="Current password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" /> : null}
            <div className="st-two">
                <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." />
                <Field label="Repeat new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" hint={mismatch ? 'These don’t match.' : undefined} />
            </div>
            <div className="st-actions">
                <button type="button" className="btn btn-primary" disabled={pending || password.length < 8 || password !== confirm || (has && !current)} onClick={save}>
                    {has ? 'Change password' : 'Set password'}
                </button>
            </div>
        </section>
    );
}
