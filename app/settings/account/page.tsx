'use client';

import { useEffect, useRef, useState } from 'react';
import { request, type Profile } from '@/lib/account';
import { Field, Modal, Row, useAct, useRun, useSettings } from '../SettingsShell';

// Settings -> Account: each setting shows what it is now, and its change opens in a popup.
type Popup = 'username' | 'email' | 'password';

export default function AccountSettings() {
    const { profile } = useSettings();
    const [popup, setPopup] = useState<Popup | null>(null);
    const close = () => setPopup(null);

    return (
        <>
            <header className="st-head">
                <h1>Account</h1>
                <p>Your username, email address and password.</p>
            </header>
            <section className="st-card">
                <Row value title="Username" desc={profile.username}>
                    <Change what="username" onClick={() => setPopup('username')} />
                </Row>
                <Row value title="Email" desc={profile.email}>
                    {/* An email change asks for the password, so an account without one sets it first. */}
                    <Change what="email" onClick={() => setPopup(profile.password_set ? 'email' : 'password')} />
                </Row>
                <Row value title="Password" desc={profile.password_set ? '••••••••' : 'Not set. You sign in with GitHub or Discord.'}>
                    <Change what="password" verb={profile.password_set ? 'Change' : 'Set'} onClick={() => setPopup('password')} />
                </Row>
            </section>
            <PanelView />
            {popup === 'username' ? <UsernamePopup onClose={close} /> : null}
            {popup === 'email' ? <EmailPopup onClose={close} /> : null}
            {popup === 'password' ? <PasswordPopup onClose={close} /> : null}
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

const EMAIL = '/api/client/robtic/account/email';
const STEPS = ['Your code', 'New email', 'Password'];

// The wizard: a code from the current address, the new address, the password, then a link to the new address. The
// email changes only when that link is opened. A panel with no email set up skips the code and changes it at once.
function EmailPopup({ onClose }: { onClose: () => void }) {
    const { profile, reload, toast } = useSettings();
    const { act, busy, error, setError } = useAct();
    const [step, setStep] = useState(0);
    const [to, setTo] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const started = useRef(false);

    const sendCode = async (again: boolean) => {
        const r = await act(() => request<{ data: { sent: boolean; fresh?: boolean; to?: string } }>('POST', `${EMAIL}/start`));
        if (!r) return;
        if (!r.data.sent) return setStep(1);
        setTo(r.data.to ?? 'your current email');
        if (again && !r.data.fresh) setError('A code went out less than a minute ago. Check your inbox, or try again in a moment.');
    };

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        sendCode(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await act(() => request('POST', `${EMAIL}/code`, { code }))) setStep(1);
    };
    const chooseEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await act(() => request('POST', `${EMAIL}/new`, { email }))) setStep(2);
    };
    const finish = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await act(() => request<{ data: { changed: boolean; to?: string } }>('POST', `${EMAIL}/finish`, { password }));
        if (!r) return;
        if (r.data.changed) {
            await reload();
            toast('ok', 'Email changed.');
            onClose();
            return;
        }
        setStep(3);
    };

    return (
        <Modal title={step === 3 ? 'Check your new inbox' : 'Change email'} onClose={onClose}>
            {step < 3 ? (
                <ol className="st-steps">
                    {STEPS.map((label, i) => (
                        <li key={label} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
                            <i>{i + 1}</i>
                            <span>{label}</span>
                        </li>
                    ))}
                </ol>
            ) : null}

            {step === 0 ? (
                <form onSubmit={checkCode}>
                    <p className="st-sub">{to ? `We sent a 6-digit code to ${to}. It works for 15 minutes.` : 'Sending a code to your current email…'}</p>
                    <Field label="Code" value={code} onChange={setCode} autoComplete="one-time-code" inputMode="numeric" maxLength={6} autoFocus />
                    {error ? <p className="st-err" role="alert">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="st-link" disabled={busy} onClick={() => sendCode(true)}>Send again</button>
                        <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>Next</button>
                    </div>
                </form>
            ) : null}

            {step === 1 ? (
                <form onSubmit={chooseEmail}>
                    <p className="st-sub">Now: {profile.email}</p>
                    <Field label="New email" type="email" value={email} onChange={setEmail} autoComplete="email" autoFocus />
                    {error ? <p className="st-err" role="alert">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="st-link" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={busy || !email}>Next</button>
                    </div>
                </form>
            ) : null}

            {step === 2 ? (
                <form onSubmit={finish}>
                    <p className="st-sub">Enter your password to change your email to {email}.</p>
                    <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" autoFocus />
                    {error ? <p className="st-err" role="alert">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="st-link" disabled={busy} onClick={() => { setError(null); setStep(1); }}>Back</button>
                        <button type="submit" className="btn btn-primary" disabled={busy || !password}>Submit</button>
                    </div>
                </form>
            ) : null}

            {step === 3 ? (
                <>
                    <p className="st-sub">We sent a link to <b>{email}</b>. Open it within 60 minutes to confirm. Your email stays {profile.email} until then.</p>
                    <div className="st-actions">
                        <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
                    </div>
                </>
            ) : null}
        </Modal>
    );
}

function PasswordPopup({ onClose }: { onClose: () => void }) {
    const { profile, reload, toast } = useSettings();
    const { act, busy, error } = useAct();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const has = profile.password_set;
    const mismatch = confirm !== '' && password !== confirm;

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await act(() =>
            has
                ? request('PUT', '/api/client/account/password', { current_password: current, password, password_confirmation: confirm })
                : request('POST', '/api/client/robtic/account/password', { password, password_confirmation: confirm })
        );
        if (r) {
            if (!has) await reload();
            toast('ok', has ? 'Password changed.' : 'Password set.');
            onClose();
        }
    };

    return (
        <Modal title={has ? 'Change password' : 'Set a password'} onClose={onClose}>
            <form onSubmit={save}>
                <p className="st-sub">{has ? 'Changing it signs you out on your other devices.' : 'Add a password to sign in with your email too, and to change your email.'}</p>
                {has ? <Field label="Old password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" /> : null}
                <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." />
                <Field label="Repeat new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" hint={mismatch ? 'These don’t match.' : undefined} />
                {error ? <p className="st-err" role="alert">{error}</p> : null}
                <div className="st-actions">
                    <button type="button" className="st-link" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={busy || password.length < 8 || password !== confirm || (has && !current)}>
                        {has ? 'Change password' : 'Set password'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
