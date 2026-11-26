import { useCallback, useEffect, useState } from 'react';
import { BILLING, brandName, call, money, planName, PayError, type Money, type Tax } from '../../pay-app/api';
import { Modal, useSettings } from '../Popup';
import { day } from './billing-shared';

// Settings → Plan, the part about paying by card: the subscription (next renewal, card, change plan, cancel or
// resume), the 7-day refund while it is allowed, and every invoice with its PDF.
type Sub = {
    plan: string;
    status: string;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    amount: number;
    currency: string;
    nextPlan: string | null;
    card: { brand: string; last4: string } | null;
};
type Overview = {
    account: {
        subscription: Sub | null;
        refund: { until: string | null; request: { id: string; status: string } | null };
        invoices: Array<{ number: string; total: number; currency: string; status: string; paidAt: string }>;
    };
    prices: Record<string, Money>;
    tax: Tax;
};
type Ask = 'cancel' | 'refund' | 'change' | null;

const ORDER = ['personal', 'developers', 'servers', 'communities'];

export default function Subscription() {
    const { toast, go } = useSettings();
    const [data, setData] = useState<Overview | null>(null);
    const [off, setOff] = useState(false);
    const [ask, setAsk] = useState<Ask>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [target, setTarget] = useState('');

    const load = useCallback(async () => {
        try {
            setData(await call<Overview>('GET', BILLING));
        } catch (e) {
            // Hosting off, or payments not reachable: the rest of the Plan page still shows.
            setOff(true);
            if (!(e instanceof PayError && e.status === 403)) console.warn('[settings] billing:', (e as Error).message);
        }
    }, []);
    useEffect(() => {
        void load();
    }, [load]);

    const act = async (path: string, body: unknown, done: string) => {
        setBusy(true);
        setError('');
        try {
            await call('POST', `${BILLING}${path}`, body);
            setAsk(null);
            toast('ok', done);
            await load();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    if (off || !data) return null;
    const { subscription: sub, refund, invoices } = data.account;
    const taxNote = data.tax?.enabled && data.tax.rate > 0 && !data.tax.inclusive ? ` + ${data.tax.name}` : '';

    return (
        <>
            {sub ? (
                <section className="st-card">
                    <div className="st-plan">
                        <div>
                            <small>Paid by card</small>
                            <h2>Subscription</h2>
                        </div>
                        <span className={sub.status === 'past_due' ? 'st-pill warn' : sub.cancelAtPeriodEnd ? 'st-pill off' : 'st-pill'}>
                            {sub.status === 'past_due' ? 'Payment failed' : sub.cancelAtPeriodEnd ? 'Cancelled' : 'Active'}
                        </span>
                    </div>
                    <div className="st-row">
                        <div>
                            <h3>{sub.cancelAtPeriodEnd ? 'Ends' : 'Next renewal'}</h3>
                            <p>
                                {sub.periodEnd ? day(sub.periodEnd) : '—'}
                                {!sub.cancelAtPeriodEnd ? ` · ${money(sub.amount, sub.currency)}${taxNote}` : ''}
                                {sub.nextPlan ? ` · moves to ${planName(sub.nextPlan)}` : ''}
                            </p>
                        </div>
                        <div className="st-ctl">
                            {sub.cancelAtPeriodEnd ? (
                                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act('/resume', {}, 'Your plan will keep renewing.')}>Resume</button>
                            ) : (
                                <button type="button" className="st-link danger" onClick={() => { setError(''); setAsk('cancel'); }}>Cancel plan</button>
                            )}
                        </div>
                    </div>
                    <div className="st-row">
                        <div>
                            <h3>Card</h3>
                            <p>{sub.card ? `${brandName(sub.card.brand)} ending ${sub.card.last4}` : 'Your default card'}</p>
                        </div>
                        <div className="st-ctl"><button type="button" className="btn btn-ghost" onClick={() => go('cards')}>Payment methods</button></div>
                    </div>
                    {!sub.cancelAtPeriodEnd ? (
                        <div className="st-row">
                            <div>
                                <h3>Change plan</h3>
                                <p>Bigger: now, you pay the difference. Smaller: from your next renewal.</p>
                            </div>
                            <div className="st-ctl"><button type="button" className="btn btn-ghost" onClick={() => { setError(''); setTarget(''); setAsk('change'); }}>Change</button></div>
                        </div>
                    ) : null}
                    {refund.until && !refund.request ? (
                        <div className="st-row">
                            <div>
                                <h3>Refund</h3>
                                <p>You paid during your free month, so you can ask for a refund until {day(refund.until)}.</p>
                            </div>
                            <div className="st-ctl"><button type="button" className="btn btn-ghost" onClick={() => { setError(''); setAsk('refund'); }}>Ask for a refund</button></div>
                        </div>
                    ) : null}
                    {refund.request ? (
                        <div className="st-row">
                            <div>
                                <h3>Refund</h3>
                                <p>{refund.request.status === 'pending' ? 'You asked for a refund. We’ll email you once it’s answered.' : refund.request.status === 'approved' ? 'Refunded.' : 'Your refund request was declined.'}</p>
                            </div>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {invoices.length ? (
                <section className="st-card">
                    <h2>Invoices</h2>
                    <div className="st-gap" />
                    {invoices.map((i) => (
                        <div className="st-item" key={i.number}>
                            <div>
                                <b>{i.number}</b>
                                <small>{day(i.paidAt)} · {money(i.total, i.currency)}</small>
                            </div>
                            <span className="st-inv">
                                {i.status === 'refunded' ? <span className="st-pill off">Refunded</span> : null}
                                <a className="btn btn-ghost" href={`${BILLING}/invoices/${i.number}.pdf`} target="_blank" rel="noopener">PDF</a>
                            </span>
                        </div>
                    ))}
                </section>
            ) : null}

            {ask === 'cancel' && sub ? (
                <Modal title="Cancel your plan?" onClose={() => setAsk(null)}>
                    <p className="st-sub">
                        {planName(sub.plan)} keeps running until <b>{sub.periodEnd ? day(sub.periodEnd) : 'the end of the month you paid for'}</b>, then ends. Nothing more is charged. You can resume it until then.
                    </p>
                    {error ? <p className="st-err">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>Keep plan</button>
                        <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act('/cancel', {}, 'Your plan is cancelled.')}>{busy ? 'Cancelling…' : 'Cancel plan'}</button>
                    </div>
                </Modal>
            ) : null}

            {ask === 'refund' ? (
                <Modal title="Ask for a refund?" onClose={() => setAsk(null)}>
                    <p className="st-sub">If it’s approved, everything you paid for this plan is refunded and the plan ends. You can ask once per account.</p>
                    {error ? <p className="st-err">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>Not now</button>
                        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act('/refund-request', {}, 'Refund requested.')}>{busy ? 'Sending…' : 'Ask for a refund'}</button>
                    </div>
                </Modal>
            ) : null}

            {ask === 'change' && sub ? (
                <Modal title="Change plan" onClose={() => setAsk(null)}>
                    <div className="st-choices" role="radiogroup" aria-label="Plan">
                        {ORDER.filter((p) => data.prices[p]).map((p) => (
                            <button key={p} type="button" role="radio" aria-checked={target === p} disabled={p === sub.plan && !sub.nextPlan} className={target === p ? 'st-choice on' : 'st-choice'} onClick={() => setTarget(p)}>
                                <b>{planName(p)}</b>
                                <small>{money(data.prices[p]!.amount, data.prices[p]!.currency)} / month{taxNote}{p === sub.plan ? ' · current' : ''}</small>
                            </button>
                        ))}
                    </div>
                    {target ? (
                        <p className="st-sub">
                            {target === sub.plan
                                ? 'You stay on your current plan and the waiting change is dropped.'
                                : ORDER.indexOf(target) > ORDER.indexOf(sub.plan)
                                  ? `${planName(target)} starts now. You pay the difference for the rest of this month today, on your card.`
                                  : `${planName(target)} starts at your next renewal${sub.periodEnd ? ` on ${day(sub.periodEnd)}` : ''}. Your apps must fit in it.`}
                        </p>
                    ) : null}
                    {error ? <p className="st-err">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>Cancel</button>
                        <button type="button" className="btn btn-primary" disabled={busy || !target} onClick={() => act('/plan', { plan: target }, 'Plan changed.')}>{busy ? 'Changing…' : 'Change plan'}</button>
                    </div>
                </Modal>
            ) : null}
        </>
    );
}
