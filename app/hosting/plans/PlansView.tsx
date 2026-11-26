'use client';

import { Fragment, useEffect, useState } from 'react';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { PANEL_URL } from '@/lib/site';
import { openPay } from '@/lib/pay-popup';
import { openSettings } from '@/lib/settings-popup';
import TypeOnce from '../../TypeOnce';
import { PLANS, PLAN_FEATURE_LABELS, limitRows, featureDetail, type Plan } from '@/lib/plans';

// Robtic Hosting's plans, in the hosting page's own world (services.css .rh): calm black, the serif voice, thin rules,
// one white pill. Cards first (price, limits, what's included), then every plan of the group side by side. Prices are
// the panel's live ones; a signed-in visitor sees their own plan marked and no free-month offer (that's for new
// visitors).
//
// Buying: the four account plans are paid by card in the pay popup, right here. Signed out, the button signs in first
// and comes back with ?buy=<plan>, which opens the popup. Someone already paying by card changes plan in Settings → Plan.
// Team and Org keep their own flow.

const panelRoot = PANEL_URL.replace(/\/panel$/, '');
type Group = 'individual' | 'business';
const GROUPS: Array<[Group, string]> = [['individual', 'Individual'], ['business', 'Business']];
const CARD_PLANS = ['personal', 'developers', 'servers', 'communities'];
const LIVE = ['active', 'trialing', 'past_due'];
const signIn = (back: string) => `/oidc/login?return=${encodeURIComponent(back)}`;

function cta(plan: Plan, signedIn: boolean): string {
    if (plan.key === 'org') return 'Ask for an offer';
    if (plan.trialDays && !signedIn) return 'Start free';
    return `Choose ${plan.name}`;
}

function Price({ plan, prices, signedIn }: { plan: Plan; prices: Record<string, string>; signedIn: boolean }) {
    // The panel's live price wins over the snapshot in lib/plans.
    const text = prices[plan.key] || plan.price;
    if (plan.key === 'org') return <>Custom <small>priced for you</small></>;
    if (plan.trialDays && !signedIn) return <>Free <small>first {plan.trialDays} days</small></>;
    if (text && text.toLowerCase() === 'free') return <>Free</>;
    if (text) return <>{text.split(' / ')[0]} <small>/ month</small></>;
    return <small>Price soon</small>;
}

export default function PlansView({ prices = {} }: { prices?: Record<string, string> }) {
    const [group, setGroup] = useState<Group>('individual');
    // Plan key → whose it is: the visitor's own plan, or a team they own.
    const [myPlans, setMyPlans] = useState<Map<string, 'own' | 'team'>>(new Map());
    const [signedIn, setSignedIn] = useState(false);
    // The visitor's own plan: whether it ran out, and whether a card subscription pays it.
    const [own, setOwn] = useState<{ key: string; ended: boolean } | null>(null);
    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [payError, setPayError] = useState('');
    const [loaded, setLoaded] = useState(0);

    // A link to one plan (/hosting/plans#plan-team) opens its group.
    useEffect(() => {
        const key = /#plan-([\w-]+)/.exec(window.location.hash)?.[1];
        const plan = PLANS.find((p) => p.key === key);
        if (plan) setGroup(plan.group as Group);
    }, []);

    useEffect(() => {
        fetch(`${panelRoot}/api/client/robtic/account/plan`, { credentials: 'include', headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                const keys = new Map<string, 'own' | 'team'>();
                if (d?.plan?.key) { keys.set(d.plan.key as string, 'own'); setSignedIn(true); setOwn({ key: d.plan.key, ended: Boolean(d.plan.ended) }); }
                // A team's plan is the visitor's too when they own the team.
                (d?.teams || []).forEach((t: { owner?: boolean; plan?: { key?: string } }) => { if (t?.owner && t?.plan?.key && !keys.has(t.plan.key)) keys.set(t.plan.key, 'team'); });
                if (keys.size) setMyPlans(keys);
            })
            .catch(() => { /* signed out or offline: the plans, unmarked */ });
        fetch(`${panelRoot}/api/client/robtic/billing`, { credentials: 'include', headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setSubscribed(Boolean(d?.account?.subscription && LIVE.includes(d.account.subscription.status))))
            .catch(() => { /* billing not set up: the popup says so when used */ });
    }, [loaded]);

    const buy = async (key: string) => {
        if (busy) return;
        setPayError('');
        setBusy(key);
        try {
            const r = await openPay({ kind: 'plan', plan: key, theme: 'hosting' });
            if (r === 'paid' || r === 'saved') setLoaded((n) => n + 1);
        } catch (e) {
            setPayError((e as Error).message || 'Payments are unavailable right now. Try again in a few minutes.');
        } finally {
            setBusy(null);
        }
    };

    // Back from signing in to buy: open the popup for that plan once.
    useEffect(() => {
        if (!signedIn) return;
        const url = new URL(window.location.href);
        const key = url.searchParams.get('buy');
        if (!key) return;
        url.searchParams.delete('buy');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        if (CARD_PLANS.includes(key) && !subscribed) void buy(key);
        else if (CARD_PLANS.includes(key)) openSettings({ theme: 'hosting', section: 'plan' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signedIn]);

    /** The button for one plan card. */
    const action = (plan: Plan, recommended: boolean) => {
        const cls = `rhp-btn${recommended ? ' main' : ''}`;
        const card = CARD_PLANS.includes(plan.key);
        const mine = myPlans.get(plan.key);
        if (!card) {
            return mine ? <span className="rhp-btn current" aria-disabled="true">Current plan</span> : <a className={cls} href={`${panelRoot}/plans?plan=${plan.key}`}>{cta(plan, signedIn)}</a>;
        }
        if (!signedIn) {
            // A new visitor's Personal starts with the free month: sign in and go to the dashboard.
            const back = plan.trialDays ? '/hosting/dashboard' : `/hosting/plans?buy=${plan.key}`;
            return <a className={cls} href={signIn(back)}>{cta(plan, signedIn)}</a>;
        }
        const isOwn = own?.key === plan.key;
        if (isOwn && subscribed) return <span className="rhp-btn current" aria-disabled="true">Current plan</span>;
        if (!isOwn && subscribed) {
            return <button type="button" className={cls} onClick={() => openSettings({ theme: 'hosting', section: 'plan' })}>Switch to {plan.name}</button>;
        }
        const label = isOwn ? (own?.ended ? `Renew ${plan.name}` : `Keep ${plan.name}`) : `Choose ${plan.name}`;
        return (
            <button type="button" className={`${cls}${isOwn && own?.ended ? ' main' : ''}`} onClick={() => buy(plan.key)} disabled={busy !== null} aria-busy={busy === plan.key}>
                {busy === plan.key ? 'Opening…' : label}
            </button>
        );
    };

    const plans = PLANS.filter((p) => p.group === group);
    const limits = plans[0] ? limitRows(plans[0]).map(([label]) => label) : [];

    return (
        <div className="rh rhp">
            <section className="rh-hero rhp-hero" aria-labelledby="rhp-title">
                <div className="rh-beam" aria-hidden="true" />
                <div className="wrap">
                    <h1 id="rhp-title">Plans <em>that grow with your bots.</em></h1>
                    <p className="rh-sub">Every plan runs Discord bots, websites and APIs with a live console, a code editor, databases and backups. Start free for a month.</p>
                    <div className="rh-ptabs" role="tablist" aria-label="Plans for">
                        {GROUPS.map(([key, label]) => (
                            <button key={key} type="button" role="tab" aria-selected={key === group} className={key === group ? 'on' : ''} onClick={() => setGroup(key)}>{label}</button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="wrap" aria-label={`${group === 'individual' ? 'Individual' : 'Business'} plans`}>
                <div className={`rhp-cards n${plans.length}`} key={group}>
                    {plans.map((plan, i) => {
                        const mine = myPlans.get(plan.key);
                        const recommended = plan.key === 'developers';
                        return (
                            <article key={plan.key} id={`plan-${plan.key}`} className={`rhp-card${recommended ? ' pick' : ''}${mine ? ' is-mine' : ''}`} style={{ ['--i' as string]: i }}>
                                <header>
                                    <h2>{plan.name}</h2>
                                    {mine ? <span className="rhp-tag is-mine">{mine === 'team' ? 'Your team’s plan' : 'Your plan'}</span> : recommended ? <span className="rhp-tag">Most picked</span> : null}
                                </header>
                                <p className="rhp-price"><Price plan={plan} prices={prices} signedIn={signedIn} /></p>
                                {action(plan, recommended)}
                                <ul className="rhp-limits">
                                    {limitRows(plan).map(([label, value]) => <li key={label}><span>{label}</span><b>{value}</b></li>)}
                                </ul>
                                <ul className="rhp-feats">
                                    {PLAN_FEATURE_LABELS.map(([key, name]) => {
                                        const detail = featureDetail(plan, key);
                                        return (
                                            <li key={key} className={detail === null ? 'no' : ''}>
                                                {detail === null ? <Minus size={15} aria-label="Not included" /> : <Check size={15} aria-label="Included" />}
                                                <span>{name}{detail ? <small> · {detail}</small> : null}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </article>
                        );
                    })}
                </div>
                {payError ? <p className="rhp-pay-err" role="alert">{payError}</p> : null}
            </section>

            {/* Every plan of the group, line by line. */}
            <section className="rh-sec rhp-compare-sec" aria-labelledby="rhp-compare-title">
                <div className="wrap">
                    <h2 id="rhp-compare-title" className="rh-h2">Side by side, <em>line by line.</em></h2>
                    <div className="rhp-scroll" tabIndex={0} role="region" aria-label="Plan comparison (scrolls sideways on small screens)">
                        <table className="rhp-table">
                            <thead>
                                <tr>
                                    <th scope="col"><span className="sr-only">Feature</span></th>
                                    {plans.map((p) => <th scope="col" key={p.key}>{p.name}<small><Price plan={p} prices={prices} signedIn={signedIn} /></small></th>)}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="rhp-group"><th scope="rowgroup" colSpan={plans.length + 1}>Limits</th></tr>
                                {limits.map((label) => (
                                    <tr key={label}>
                                        <th scope="row">{label}</th>
                                        {plans.map((p) => <td key={p.key}>{limitRows(p).find(([l]) => l === label)?.[1] ?? '–'}</td>)}
                                    </tr>
                                ))}
                                <tr className="rhp-group"><th scope="rowgroup" colSpan={plans.length + 1}>Included</th></tr>
                                {PLAN_FEATURE_LABELS.map(([key, name]) => (
                                    <Fragment key={key}>
                                        <tr>
                                            <th scope="row">{name}</th>
                                            {plans.map((p) => {
                                                const d = featureDetail(p, key);
                                                return <td key={p.key} className={d === null ? 'no' : ''}>{d === null ? <Minus size={15} aria-label="Not included" /> : d ? d : <Check size={15} aria-label="Included" />}</td>;
                                            })}
                                        </tr>
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <TypeOnce className="rh-close" id="rhp-close-title" plain="Not sure yet?" em="Start free, pick later.">
                <div className="rh-ctas">
                    <a className="btn btn-primary" href={signedIn ? '/hosting/dashboard' : signIn('/hosting/dashboard')}>Start hosting free</a>
                    <a className="rh-link" href="/hosting">Back to Robtic Hosting <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
            </TypeOnce>
        </div>
    );
}
