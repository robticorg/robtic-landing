'use client';

import { useEffect, useState } from 'react';
import { money, type PublicLink } from '@/pay-app/api';
import { openPay } from '@/lib/pay-popup';
import './paylink.css';

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'down' } | { kind: 'ready'; link: PublicLink };

const CLOSED: Record<NonNullable<PublicLink['reason']>, string> = {
    paid: 'It has already been paid.',
    expired: 'It has expired.',
    off: 'It was turned off.',
};


export default function PayLinkView({ id }: { id: string }) {
    const [state, setState] = useState<State>({ kind: 'loading' });
    const [paid, setPaid] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!/^lnk_[A-Za-z0-9]{12}$/.test(id)) {
            setState({ kind: 'missing' });
            return;
        }
        fetch(`/api/robtic/pay/links/${id}`, { headers: { Accept: 'application/json' } })
            .then(async (r) => (r.status === 404 ? setState({ kind: 'missing' }) : r.ok ? setState({ kind: 'ready', link: await r.json() }) : setState({ kind: 'down' })))
            .catch(() => setState({ kind: 'down' }));
    }, [id]);

    const style = state.kind === 'ready' ? state.link.style : 'hosting';

    const pay = async () => {
        if (state.kind !== 'ready') return;
        setBusy(true);
        setError('');
        try {
            if ((await openPay({ kind: 'link', link: state.link, theme: state.link.style })) === 'paid') setPaid(true);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className={`pl-root pl-${style}`}>
            <div className="pl-card" aria-live="polite">
                {state.kind === 'loading' ? <span className="pl-spin" aria-label="Loading" /> : null}

                {state.kind === 'missing' ? (
                    <>
                        <span className="pl-from">Robtic</span>
                        <h1>There is no such payment link</h1>
                        <p className="pl-sub">Check the address you were sent, or ask whoever sent it.</p>
                    </>
                ) : null}

                {state.kind === 'down' ? (
                    <>
                        <span className="pl-from">Robtic</span>
                        <h1>Payments are unavailable right now</h1>
                        <p className="pl-sub">Try again in a few minutes.</p>
                    </>
                ) : null}

                {state.kind === 'ready' ? (
                    <>
                        <h1>{state.link.title}</h1>
                        <div className="pl-amount">{money(state.link.amount.total, state.link.currency)}</div>
                        {state.link.tax ? (
                            <p className="pl-tax">
                                {state.link.tax.inclusive
                                    ? `Includes ${state.link.tax.name} ${state.link.tax.rate}% (${money(state.link.amount.tax, state.link.currency)})`
                                    : `${money(state.link.amount.net, state.link.currency)} + ${state.link.tax.name} ${state.link.tax.rate}% (${money(state.link.amount.tax, state.link.currency)})`}
                            </p>
                        ) : null}
                        {state.link.note ? <p className="pl-note">{state.link.note}</p> : null}

                        {paid ? (
                            <div className="pl-done">
                                <span className="pl-tick" aria-hidden="true">
                                    <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </span>
                                <b>Paid. Thank you!</b>
                                <span>Your invoice is on its way to your email.</span>
                            </div>
                        ) : state.link.open ? (
                            <>
                                <p className="pl-sub">One payment, no subscription. No account needed.</p>
                                <button type="button" className="pl-btn" onClick={pay} disabled={busy}>
                                    {busy ? 'Opening…' : `Pay ${money(state.link.amount.total, state.link.currency)}`}
                                </button>
                                {error ? <p className="pl-err" role="alert">{error}</p> : null}
                            </>
                        ) : (
                            <div className="pl-closed">
                                <b>This link is no longer active.</b>
                                <span>{state.link.reason ? CLOSED[state.link.reason] : ''}</span>
                            </div>
                        )}
                        <p className="pl-foot">
                            Paid securely with Stripe. <a href="/terms/billing">Billing terms</a>
                        </p>
                    </>
                ) : null}
            </div>
        </main>
    );
}
