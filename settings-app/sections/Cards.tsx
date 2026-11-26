import { useCallback, useEffect, useState } from 'react';
import { BILLING, brandName, brandShort, call, planName, PayError, type Card } from '../../pay-app/api';
import { CodeField, Field, Modal, useSettings } from '../Popup';
import { day, openPay } from './billing-shared';

// Settings → Payment methods: the cards saved with Stripe (Robtic keeps only brand, last 4, expiry), which one pays
// renewals, adding one (the pay popup, nothing charged) and removing one. A card paying a running subscription goes
// only once that subscription is cancelled; removing asks for the two-step code, the password, or an email code.
type Cards = { cards: Card[]; paysSubscription: string | null };
type Sub = { plan: string; periodEnd: string | null } | null;

export default function CardsSettings() {
    const { toast } = useSettings();
    const [data, setData] = useState<Cards | null>(null);
    const [sub, setSub] = useState<Sub>(null);
    const [blocked, setBlocked] = useState('');
    const [removing, setRemoving] = useState<Card | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [cards, overview] = await Promise.all([
                call<Cards>('GET', `${BILLING}/cards`),
                call<{ account: { subscription: Sub } }>('GET', BILLING),
            ]);
            setData(cards);
            setSub(overview.account.subscription);
        } catch (e) {
            setBlocked(e instanceof PayError && e.status === 403 ? 'Turn on Robtic Hosting to save cards and pay for plans.' : (e as Error).message);
        }
    }, []);
    useEffect(() => {
        void load();
    }, [load]);

    const add = async () => {
        try {
            if ((await openPay({ kind: 'card' })) === 'saved') {
                toast('ok', 'Card saved.');
                await load();
            }
        } catch (e) {
            toast('err', (e as Error).message);
        }
    };

    const makeDefault = async (card: Card) => {
        setBusy(true);
        try {
            setData(await call<Cards>('POST', `${BILLING}/cards/${card.id}/default`));
            toast('ok', `${brandName(card.brand)} ·${card.last4} now pays your renewals.`);
        } catch (e) {
            toast('err', (e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <header className="st-head">
                <h1>Payment methods</h1>
                <p>The default card pays your renewals.</p>
            </header>
            {blocked ? (
                <section className="st-card"><p className="st-sub">{blocked}</p></section>
            ) : !data ? (
                <div className="st-spin" />
            ) : (
                <section className="st-card">
                    {data.cards.length === 0 ? <p className="st-sub">No saved cards yet. A card you pay a plan with is saved here.</p> : null}
                    {data.cards.map((c) => (
                        <div className="st-pm" key={c.id}>
                            <span className={`st-brand st-brand-${c.brand}`}>{brandShort(c.brand)}</span>
                            <div className="st-pm-meta">
                                <b>{brandName(c.brand)} ending {c.last4}</b>
                                <small>
                                    Expires {String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}
                                    {data.paysSubscription === c.id && sub ? ` · pays your ${planName(sub.plan)} plan` : ''}
                                </small>
                            </div>
                            {c.isDefault ? <span className="st-pill">Default</span> : null}
                            <div className="st-pm-acts">
                                {!c.isDefault ? <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => makeDefault(c)}>Make default</button> : null}
                                <button type="button" className="st-link danger" disabled={busy} onClick={() => setRemoving(c)}>Remove</button>
                            </div>
                        </div>
                    ))}
                    <div className="st-pm-add">
                        <button type="button" className="btn btn-ghost" onClick={add}>Add a card</button>
                    </div>
                    <p className="st-sub st-pm-note">Card details are kept by Stripe. Robtic keeps only the brand, last 4 digits, expiry and billing address.</p>
                </section>
            )}
            {removing && data ? (
                <RemoveCard
                    card={removing}
                    paysSubscription={data.paysSubscription === removing.id ? sub : null}
                    onClose={async (removed) => {
                        setRemoving(null);
                        if (removed) {
                            toast('ok', 'Card removed.');
                            await load();
                        }
                    }}
                />
            ) : null}
        </>
    );
}

type Method = 'totp' | 'password' | 'email';

function RemoveCard({ card, paysSubscription, onClose }: { card: Card; paysSubscription: Sub; onClose: (removed: boolean) => void }) {
    const [phase, setPhase] = useState<'sub' | 'verify' | 'done'>(paysSubscription ? 'sub' : 'verify');
    const [cancel, setCancel] = useState(false);
    const [method, setMethod] = useState<Method | null>(null);
    const [secret, setSecret] = useState('');
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [endsAt, setEndsAt] = useState<string | null>(null);
    const name = `${brandName(card.brand)} ·${card.last4}`;

    useEffect(() => {
        if (phase !== 'verify' || method) return;
        call<{ method: Method }>('GET', `${BILLING}/verify-method`)
            .then((r) => setMethod(r.method))
            .catch((e) => setError((e as Error).message));
    }, [phase, method]);

    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        setError('');
        try {
            await action();
        } catch (e) {
            if (e instanceof PayError && e.body.code === 'card_pays_subscription') {
                // It started paying a subscription meanwhile: that has to be cancelled first.
                setPhase('sub');
            }
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const sendCode = () =>
        run(async () => {
            await call('POST', `${BILLING}/verify-email-code`);
            setSent(true);
        });

    const remove = () =>
        run(async () => {
            const r = await call<{ removed: true; subscriptionEndsAt: string | null }>('POST', `${BILLING}/cards/${card.id}/remove`, { secret, cancelSubscription: cancel });
            setEndsAt(r.subscriptionEndsAt);
            setPhase('done');
        });

    const ready = method === 'password' ? secret.length > 0 : secret.replace(/\D/g, '').length === 6;

    return (
        <Modal title="Remove card" onClose={() => onClose(phase === 'done')}>
            {phase === 'sub' && paysSubscription ? (
                <>
                    <div className="st-warn">
                        <b>This card pays your {planName(paysSubscription.plan)} plan.</b>
                        <span>
                            To remove it, cancel the plan first. It keeps running
                            {paysSubscription.periodEnd ? ` until ${day(paysSubscription.periodEnd)}` : ' to the end of the month you paid for'}, then ends. Or make another card the default instead.
                        </span>
                    </div>
                    {error ? <p className="st-err">{error}</p> : null}
                    <div className="st-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>Keep card</button>
                        <button type="button" className="btn btn-danger" onClick={() => { setCancel(true); setError(''); setPhase('verify'); }}>Cancel plan and continue</button>
                    </div>
                </>
            ) : null}

            {phase === 'verify' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (ready && !busy) void remove();
                    }}
                >
                    {!method ? (
                        error ? <p className="st-err">{error}</p> : <div className="st-spin" />
                    ) : (
                        <>
                            <p className="st-sub">
                                {method === 'totp'
                                    ? <>Two-step sign-in is on. Enter the 6-digit code from your authenticator app to remove <b>{name}</b>.</>
                                    : method === 'password'
                                      ? <>Enter your password to remove <b>{name}</b>.</>
                                      : sent
                                        ? <>We sent a 6-digit code to your email. Enter it to remove <b>{name}</b>.</>
                                        : <>To remove <b>{name}</b>, we’ll send a 6-digit code to your email.</>}
                                {cancel ? ' Your plan will be cancelled at the end of the month you paid for.' : ''}
                            </p>
                            {method === 'password' ? <Field label="Password" type="password" value={secret} onChange={setSecret} autoComplete="current-password" autoFocus /> : null}
                            {method === 'totp' || (method === 'email' && sent) ? <CodeField label="Code" value={secret} onChange={setSecret} /> : null}
                            {error ? <p className="st-err">{error}</p> : null}
                            <div className="st-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>Cancel</button>
                                {method === 'email' && !sent ? (
                                    <button type="button" className="btn btn-primary" disabled={busy} onClick={sendCode}>Send code</button>
                                ) : (
                                    <button type="submit" className="btn btn-danger" disabled={busy || !ready}>{busy ? 'Removing…' : cancel ? 'Cancel plan and remove card' : 'Remove card'}</button>
                                )}
                            </div>
                        </>
                    )}
                </form>
            ) : null}

            {phase === 'done' ? (
                <>
                    <p className="st-sub">
                        <b>{name}</b> was removed.
                        {endsAt ? ` Your plan is cancelled and ends on ${day(endsAt)}.` : ''}
                    </p>
                    <div className="st-actions">
                        <button type="button" className="btn btn-primary" onClick={() => onClose(true)}>Done</button>
                    </div>
                </>
            ) : null}
        </Modal>
    );
}
