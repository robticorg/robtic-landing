'use client';

// Choosing another account that has signed in on this browser, or adding one. Picking one goes through a normal sign-in:
// an account still signed in continues straight away, one that signed out asks for its password.
import { useEffect, useRef, useState } from 'react';

type Account = { login: string; name: string | null; active: boolean };

const signIn = (params: Record<string, string> = {}) => {
    window.location.assign(`/oidc/login?${new URLSearchParams({ ...params, return: window.location.pathname })}`);
};

// An account still signed in continues as its exact session. One that signed out goes to its own sign-in.
async function choose(account: Account) {
    if (account.active) {
        const reply = await fetch('/auth/signedin-accounts', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: account.login }),
        }).then((r) => r.json()).catch(() => ({ found: false }));
        if (reply.found) return signIn();
    }
    signIn({ login_hint: account.login });
}

export default function SwitchAccount({ current, onClose }: { current: string[]; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    const [accounts, setAccounts] = useState<Account[] | null>(null);
    const [going, setGoing] = useState<string | null>(null);

    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        fetch('/auth/signedin-accounts', { credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : { accounts: [] }))
            .then((r) => setAccounts(r.accounts))
            .catch(() => setAccounts([]));
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={ref}
            className="st-modal"
            aria-label="Switch account"
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            onClick={(e) => {
                if (e.target === ref.current) onClose();
            }}
        >
            <header>
                <h2>Switch account</h2>
                <button type="button" className="st-x" aria-label="Close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
            </header>
            {!accounts ? <div className="st-spin" /> : (
                <div className="st-accounts">
                    {accounts.map((a) => {
                        const here = current.some((name) => name && [a.login.toLowerCase(), a.login.toLowerCase().split('@')[0]].includes(name.toLowerCase()));
                        return (
                            <button
                                key={a.login}
                                type="button"
                                disabled={here || !!going}
                                onClick={() => {
                                    setGoing(a.login);
                                    choose(a);
                                }}
                            >
                                <i aria-hidden="true">{(a.name || a.login).charAt(0).toUpperCase()}</i>
                                <span>
                                    <b>{a.name || a.login}</b>
                                    <small>{a.login}</small>
                                </span>
                                <em>{going === a.login ? <span className="st-spin st-spin-sm" /> : here ? 'Current' : a.active ? '' : 'Signed out'}</em>
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        disabled={!!going}
                        onClick={() => {
                            setGoing('+');
                            signIn({ prompt: 'login' });
                        }}
                    >
                        <i aria-hidden="true">+</i>
                        <span><b>Add another account</b></span>
                        {going === '+' ? <em><span className="st-spin st-spin-sm" /></em> : null}
                    </button>
                </div>
            )}
        </dialog>
    );
}
