// The Robtic pay popup: one window for every payment (a plan, a saved card, a payment link). Saved cards to pick
// from, or a new card in three steps: the card (Stripe's field), billing details (our own form), review.
// Card details go from Stripe's fields straight to Stripe; this code only sees the brand and last 4 digits.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { BILLING, brandName, brandShort, call, money, planName, withTax, type BillingDetails, type BillingOverview, type Card, type Checkout, type PublicLink, type Tax } from './api';
import { appearance, cardOnly, stripeFor, type Theme } from './stripe';
import CountryPicker, { guessCountry } from './CountryPicker';

export type PayOptions =
    | { kind: 'plan'; plan: string; theme?: Theme }
    | { kind: 'card'; theme?: Theme }
    | { kind: 'link'; link: PublicLink; theme?: Theme };
export type PayResult = 'paid' | 'saved' | 'closed';

type Step = 'loading' | 'choose' | 'card' | 'billing' | 'review' | 'done' | 'fatal';
// amount: what is charged (tax included); taxAmount: the tax inside it.
type Info = { amount: number; taxAmount: number; currency: string; tax: Tax; trial: boolean };

const STEPS: Array<{ id: Step; label: string }> = [
    { id: 'card', label: 'Card' },
    { id: 'billing', label: 'Billing details' },
    { id: 'review', label: 'Review' },
];

const message = (e: unknown) => (e instanceof Error ? e.message : (e as any)?.message || 'Something went wrong. Try again.');

export default function PayPopup({ options, onClose }: { options: PayOptions; onClose: (r: PayResult) => void }) {
    const kind = options.kind;
    const [step, setStep] = useState<Step>('loading');
    const [fatal, setFatal] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [info, setInfo] = useState<Info | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [cardDone, setCardDone] = useState(false);
    // Billing details, typed here: name and address (postal code optional; not every country has one).
    const [form, setForm] = useState({ name: '', line1: '', line2: '', city: '', postal_code: '', country: guessCountry() });
    const setF = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
    const billing: BillingDetails | null =
        form.name.trim() && form.line1.trim() && form.city.trim() && form.country
            ? { name: form.name.trim(), address: { line1: form.line1.trim(), line2: form.line2.trim() || null, city: form.city.trim(), postal_code: form.postal_code.trim(), country: form.country } }
            : null;
    const [email, setEmail] = useState('');
    const [done, setDone] = useState<{ title: string; text: string; result: PayResult } | null>(null);

    const stripe = useRef<any>(null);
    const elements = useRef<any>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const dialog = useRef<HTMLDivElement>(null);
    const publishableKey = useRef('');

    const close = useCallback(() => {
        if (busy) return;
        onClose(done?.result ?? 'closed');
    }, [busy, done, onClose]);

    // ---- what is being paid, Stripe, and the saved cards
    useEffect(() => {
        let gone = false;
        (async () => {
            try {
                let tax: Tax = null;
                let amount = 0;
                let taxAmount = 0;
                let currency = 'usd';
                let trial = false;
                if (kind === 'link') {
                    const link = (options as { link: PublicLink }).link;
                    publishableKey.current = (await call<{ publishableKey: string | null }>('GET', '/api/robtic/pay/config')).publishableKey ?? '';
                    amount = link.amount.total;
                    taxAmount = link.amount.tax;
                    currency = link.currency;
                    tax = link.tax ? { enabled: true, ...link.tax } : null;
                } else {
                    const ov = await call<BillingOverview>('GET', BILLING);
                    publishableKey.current = ov.publishableKey ?? '';
                    tax = ov.tax;
                    if (kind === 'plan') {
                        const price = ov.prices[(options as { plan: string }).plan];
                        if (!price) throw new Error('This plan has no price yet.');
                        const taxed = withTax(price.amount, tax);
                        amount = taxed.total;
                        taxAmount = taxed.tax;
                        currency = price.currency;
                        trial = ov.plan?.key === 'trial';
                        const saved = (await call<{ cards: Card[] }>('GET', `${BILLING}/cards`)).cards;
                        if (!gone) {
                            setCards(saved);
                            setSelected(saved.find((c) => c.isDefault)?.id ?? saved[0]?.id ?? null);
                        }
                        if (saved.length && !gone) {
                            setInfo({ amount, taxAmount, currency, tax, trial });
                            stripe.current = await stripeFor(publishableKey.current || fail());
                            if (!gone) setStep('choose');
                            return;
                        }
                    }
                }
                if (!publishableKey.current) fail();
                stripe.current = await stripeFor(publishableKey.current);
                if (gone) return;
                setInfo({ amount, taxAmount, currency, tax, trial });
                setStep('card');
            } catch (e) {
                if (!gone) {
                    setFatal(message(e));
                    setStep('fatal');
                }
            }
        })();
        return () => {
            gone = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function fail(): never {
        throw new Error('Card payments aren’t set up yet. Try again later.');
    }

    // ---- Stripe's card and address fields, made once the wizard starts and kept while moving between its steps
    const wizard = step === 'card' || step === 'billing' || step === 'review';
    useEffect(() => {
        if (!wizard || elements.current || !stripe.current || !info || !cardRef.current) return;
        const theme = options.theme ?? 'hosting';
        const mode = kind === 'card' ? 'setup' : kind === 'plan' ? 'subscription' : 'payment';
        const els = stripe.current.elements({
            mode,
            currency: info.currency,
            ...(mode === 'setup' ? { setupFutureUsage: 'off_session' } : { amount: info.amount }),
            ...cardOnly(),
            appearance: appearance(theme),
        });
        const card = els.create('payment', { layout: 'tabs', fields: { billingDetails: { name: 'never', address: 'never' } }, terms: { card: 'never' } });
        card.mount(cardRef.current);
        card.on('change', (e: any) => setCardDone(Boolean(e.complete)));
        elements.current = els;
    }, [wizard, info, kind, options.theme]);

    // ---- Esc closes; Tab stays inside the window
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !e.defaultPrevented) {
                // Settings may be open underneath: only this window closes.
                e.preventDefault();
                e.stopPropagation();
                close();
            }
            if (e.key !== 'Tab' || !dialog.current) return;
            const items = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], select, [tabindex="0"]')].filter((x) => x.offsetParent !== null);
            if (!items.length) return;
            const first = items[0]!;
            const last = items[items.length - 1]!;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [close]);
    // Focus goes to the window itself (no ring on the close button), so Tab starts inside it.
    useEffect(() => {
        dialog.current?.focus();
    }, []);

    // ---- paying
    const finish = (r: any, setupOnly: boolean) => {
        if (r?.error) throw new Error(r.error.message || 'Your card was declined.');
        const status = r?.paymentIntent?.status ?? r?.setupIntent?.status;
        if (status && !['succeeded', 'processing', 'requires_capture'].includes(status)) throw new Error('The payment didn’t go through. Try again or use another card.');
        const plan = kind === 'plan' ? planName((options as { plan: string }).plan) : '';
        setDone(
            kind === 'card'
                ? { title: 'Card saved', text: 'You can pick it the next time you pay.', result: 'saved' }
                : kind === 'link'
                  ? { title: 'Paid', text: `Thanks! Your invoice is on its way to ${email}.`, result: 'paid' }
                  : setupOnly
                    ? { title: 'Card saved', text: `You’re set for ${plan}. Billing starts when the time you have now runs out.`, result: 'saved' }
                    : { title: 'Paid', text: `You’re on ${plan}. Your invoice is on its way to your email.`, result: 'paid' },
        );
        setStep('done');
    };

    const pay = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        const s = stripe.current;
        const returnUrl = window.location.href;
        try {
            if (step === 'choose') {
                // A saved card: the subscription's first payment is confirmed with it (Stripe asks for 3-D Secure here if the bank wants it).
                const c = await call<Checkout>('POST', `${BILLING}/subscribe`, { plan: (options as { plan: string }).plan });
                const confirm = c.kind === 'payment' ? s.confirmPayment : s.confirmSetup;
                finish(await confirm.call(s, { clientSecret: c.clientSecret, confirmParams: { payment_method: selected, return_url: returnUrl }, redirect: 'if_required' }), c.kind === 'setup');
                return;
            }
            const submitted = await elements.current.submit();
            if (submitted?.error) throw new Error(submitted.error.message);
            const b = billing!;
            // The card field leaves name and address to us, so Stripe needs every address part (empty when there's none).
            const details = { name: b.name, address: { ...b.address, line2: b.address.line2 ?? '', state: '' }, ...(kind === 'link' ? { email } : {}) };
            const confirmParams = { return_url: returnUrl, payment_method_data: { billing_details: details } };
            if (kind === 'plan') {
                const c = await call<Checkout>('POST', `${BILLING}/subscribe`, { plan: (options as { plan: string }).plan, billing: b });
                const confirm = c.kind === 'payment' ? s.confirmPayment : s.confirmSetup;
                finish(await confirm.call(s, { elements: elements.current, clientSecret: c.clientSecret, confirmParams, redirect: 'if_required' }), c.kind === 'setup');
            } else if (kind === 'card') {
                const { clientSecret } = await call<{ clientSecret: string }>('POST', `${BILLING}/cards/setup`);
                const r = await s.confirmSetup({ elements: elements.current, clientSecret, confirmParams, redirect: 'if_required' });
                if (!r?.error) await call('POST', `${BILLING}/billing-details`, b).catch(() => undefined);
                finish(r, true);
            } else {
                const link = (options as { link: PublicLink }).link;
                const { clientSecret } = await call<{ clientSecret: string }>('POST', `/api/robtic/pay/links/${link.id}`, { name: b.name, email, address: b.address });
                finish(await s.confirmPayment({ elements: elements.current, clientSecret, confirmParams, redirect: 'if_required' }), false);
            }
        } catch (e) {
            setError(message(e));
        } finally {
            setBusy(false);
        }
    };

    // ---- what it shows
    const theme = options.theme ?? 'hosting';
    const title = kind === 'plan' ? `${planName((options as { plan: string }).plan)} plan` : kind === 'card' ? 'Add a card' : (options as { link: PublicLink }).link.title;
    const t = info ? withTaxShown(info) : null;
    const cta = kind === 'card' ? 'Save card' : t ? `Pay ${money(t.total, info!.currency)}` : 'Pay';
    const emailOk = kind !== 'link' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const back = () => {
        setError('');
        if (step === 'review') setStep('billing');
        else if (step === 'billing') setStep('card');
        else if (step === 'card' && cards.length && kind === 'plan') setStep('choose');
    };

    return (
        <div className={`rp-root rp-theme-${theme}`}>
            <div className="rp-scrim" onMouseDown={(e) => e.target === e.currentTarget && close()}>
                <div className="rp-pay" role="dialog" aria-modal="true" aria-labelledby="rp-title" ref={dialog} tabIndex={-1}>
                    <div className="rp-head">
                        <b id="rp-title">{title}</b>
                        <button type="button" className="rp-x" aria-label="Close" onClick={close} disabled={busy}>
                            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        </button>
                    </div>
                    <div className="rp-body">
                        {step === 'loading' ? <div className="rp-loading" aria-label="Loading"><span className="rp-spin" /></div> : null}

                        {step === 'fatal' ? (
                            <div className="rp-done">
                                <div className="rp-tick rp-bad" aria-hidden="true">!</div>
                                <h3>Can’t pay right now</h3>
                                <p>{fatal}</p>
                                <button type="button" className="rp-btn rp-primary rp-wide" onClick={() => onClose('closed')}>Close</button>
                            </div>
                        ) : null}

                        {step === 'done' && done ? (
                            <div className="rp-done" aria-live="polite">
                                <div className="rp-tick" aria-hidden="true">
                                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <h3>{done.title}</h3>
                                <p>{done.text}</p>
                                <button type="button" className="rp-btn rp-primary rp-wide" onClick={() => onClose(done.result)} autoFocus>Done</button>
                            </div>
                        ) : null}

                        {step === 'choose' && t ? (
                            <>
                                <Summary kind={kind} options={options} info={info!} t={t} />
                                <div className="rp-lab">Pay with</div>
                                <div className="rp-opts" role="radiogroup" aria-label="Pay with">
                                    {cards.map((c) => (
                                        <button key={c.id} type="button" role="radio" aria-checked={selected === c.id} className={`rp-opt${selected === c.id ? ' on' : ''}`} onClick={() => setSelected(c.id)}>
                                            <span className="rp-dot" />
                                            <span className={`rp-brand rp-${c.brand}`}>{brandShort(c.brand)}</span>
                                            <span className="rp-t">
                                                <b>{brandName(c.brand)} ·{c.last4}</b>
                                                <span>Expires {String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}{c.isDefault ? ' · default' : ''}</span>
                                            </span>
                                        </button>
                                    ))}
                                    <button type="button" className="rp-opt" onClick={() => { setError(''); setStep('card'); }}>
                                        <span className="rp-dot rp-plus" aria-hidden="true">+</span>
                                        <span className="rp-t"><b>New card</b><span>Add it in 3 short steps</span></span>
                                        <span className="rp-chev" aria-hidden="true">›</span>
                                    </button>
                                </div>
                                {error ? <p className="rp-err" role="alert">{error}</p> : null}
                                <button type="button" className="rp-btn rp-primary rp-wide" onClick={pay} disabled={busy || !selected}>{busy ? <><span className="rp-spin" /> Paying…</> : cta}</button>
                                <Terms kind={kind} info={info!} t={t} />
                            </>
                        ) : null}

                        {/* The wizard: Stripe's fields stay mounted while moving between its steps. */}
                        <div hidden={!wizard} className="rp-wizard">
                            <ol className="rp-steps">
                                {STEPS.map((s, i) => {
                                    const at = STEPS.findIndex((x) => x.id === step);
                                    return (
                                        <li key={s.id} className={i === at ? 'on' : i < at ? 'dn' : ''} aria-current={i === at ? 'step' : undefined}>
                                            <i>{i < at ? '✓' : i + 1}</i>
                                            {i === 2 && kind === 'card' ? 'Save' : s.label}
                                        </li>
                                    );
                                })}
                            </ol>
                            <div hidden={step !== 'card'} className="rp-fields">
                                <div ref={cardRef} className="rp-stripe" />
                            </div>
                            <div hidden={step !== 'billing'} className="rp-fields">
                                {kind === 'link' ? (
                                    <label className="rp-f">
                                        Email (your invoice goes here)
                                        <input className="rp-in" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                                    </label>
                                ) : null}
                                <label className="rp-f">
                                    Full name
                                    <input className="rp-in" autoComplete="billing name" value={form.name} onChange={(e) => setF('name')(e.target.value)} maxLength={100} />
                                </label>
                                <div className="rp-f">
                                    <span>Country</span>
                                    <CountryPicker value={form.country} onChange={setF('country')} />
                                </div>
                                <label className="rp-f">
                                    Address
                                    <input className="rp-in" autoComplete="billing address-line1" placeholder="Street and number" value={form.line1} onChange={(e) => setF('line1')(e.target.value)} maxLength={200} />
                                </label>
                                <input className="rp-in" aria-label="Address line 2 (optional)" autoComplete="billing address-line2" placeholder="Apartment, suite, building (optional)" value={form.line2} onChange={(e) => setF('line2')(e.target.value)} maxLength={200} />
                                <div className="rp-two">
                                    <label className="rp-f">
                                        City
                                        <input className="rp-in" autoComplete="billing address-level2" value={form.city} onChange={(e) => setF('city')(e.target.value)} maxLength={100} />
                                    </label>
                                    <label className="rp-f">
                                        <span>Postal code <i className="rp-opt-t">(optional)</i></span>
                                        <input className="rp-in" autoComplete="billing postal-code" value={form.postal_code} onChange={(e) => setF('postal_code')(e.target.value)} maxLength={20} />
                                    </label>
                                </div>
                            </div>
                            {step === 'review' && t && billing ? (
                                <>
                                    {kind !== 'card' ? <Summary kind={kind} options={options} info={info!} t={t} /> : null}
                                    <div className="rp-rv">
                                        <div className="rp-l"><span>Card</span><b>New card</b></div>
                                        <div className="rp-l"><span>Name</span><b>{billing.name}</b></div>
                                        {kind === 'link' ? <div className="rp-l"><span>Invoice to</span><b>{email}</b></div> : null}
                                        <div className="rp-l"><span>Billing address</span><b>{addressText(billing)}</b></div>
                                        <button type="button" className="rp-link" onClick={() => setStep('billing')}>Change</button>
                                    </div>
                                    {kind === 'plan' ? <p className="rp-hint">This card pays your renewals and is saved to your payment methods.</p> : null}
                                </>
                            ) : null}
                            {error && wizard ? <p className="rp-err" role="alert">{error}</p> : null}
                            <div className="rp-nav">
                                {step !== 'card' || (cards.length > 0 && kind === 'plan') ? (
                                    <button type="button" className="rp-btn rp-ghost" onClick={back} disabled={busy}>Back</button>
                                ) : null}
                                {step === 'card' ? <button type="button" className="rp-btn rp-primary" disabled={!cardDone} onClick={() => setStep('billing')}>Continue</button> : null}
                                {step === 'billing' ? <button type="button" className="rp-btn rp-primary" disabled={!billing || !emailOk} onClick={() => setStep('review')}>Continue</button> : null}
                                {step === 'review' ? (
                                    <button type="button" className="rp-btn rp-primary" onClick={pay} disabled={busy}>
                                        {busy ? <><span className="rp-spin" /> {kind === 'card' ? 'Saving…' : 'Paying…'}</> : cta}
                                    </button>
                                ) : null}
                            </div>
                            {step === 'review' && t ? <Terms kind={kind} info={info!} t={t} /> : null}
                        </div>

                        {step !== 'done' && step !== 'fatal' ? (
                            <div className="rp-lock">
                                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5.5" width="8" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M4 5.5V4a2 2 0 014 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                                Card details go straight to Stripe. Robtic never sees them.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

function withTaxShown(info: Info) {
    return { net: info.amount - info.taxAmount, tax: info.taxAmount, total: info.amount };
}

function Summary({ kind, options, info, t }: { kind: PayOptions['kind']; options: PayOptions; info: Info; t: { net: number; tax: number; total: number } }) {
    const m = (n: number) => money(n, info.currency);
    const tax = info.tax?.enabled && info.tax.rate > 0 ? info.tax : null;
    const lines: Array<[string, string]> =
        kind === 'plan'
            ? [
                  ['Plan', `${planName((options as { plan: string }).plan)}, monthly`],
                  ['Starts', info.trial ? 'Today (your free month ends)' : 'Today'],
                  ['Renews', 'Every month, until you cancel'],
              ]
            : kind === 'link'
              ? [['For', (options as { link: PublicLink }).link.title], ['Type', 'One payment']]
              : [];
    const note = kind === 'link' ? (options as { link: PublicLink }).link.note : '';
    return (
        <div className="rp-sum">
            {lines.map(([a, b]) => (
                <div className="rp-l" key={a}><span>{a}</span><b>{b}</b></div>
            ))}
            {note ? <div className="rp-note">{note}</div> : null}
            {tax ? (
                <div className="rp-l">
                    <span>{tax.inclusive ? `Includes ${tax.name} ${tax.rate}%` : `${tax.name} ${tax.rate}%`}</span>
                    <b>{m(t.tax)}</b>
                </div>
            ) : null}
            <div className="rp-l rp-tot"><span>{kind === 'plan' ? 'Due today' : 'Total'}</span><span>{m(t.total)}</span></div>
        </div>
    );
}

function Terms({ kind, info, t }: { kind: PayOptions['kind']; info: Info; t: { total: number } }) {
    const terms = <a href="/terms/billing" target="_blank" rel="noopener">Billing terms</a>;
    if (kind === 'card') return <p className="rp-terms">Nothing is charged now. Your bank may show a $0 check.</p>;
    if (kind === 'link') return <p className="rp-terms">A one-time payment. {terms}</p>;
    return (
        <p className="rp-terms">
            Renews every month at {money(t.total, info.currency)} until you cancel. We email you 3 days before each renewal.
            {info.trial ? ' Refundable within 7 days.' : ''} {terms}
        </p>
    );
}


const regions = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
function addressText(b: BillingDetails): string {
    const a = b.address;
    let country = a.country;
    try {
        country = regions?.of(a.country) ?? a.country;
    } catch {
        /* keep the code */
    }
    return [a.line1, a.line2, [a.city, a.postal_code].filter(Boolean).join(' '), country].filter(Boolean).join(', ');
}
