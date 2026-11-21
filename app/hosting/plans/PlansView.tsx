'use client';

import { Fragment, useEffect, useState } from 'react';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { PANEL_URL } from '@/lib/site';
import { PLANS, PLAN_FEATURE_LABELS, limitRows, featureDetail, type Plan } from '@/lib/plans';

// Robtic Hosting's plans, in the hosting page's own world (services.css .rh): calm black, the serif voice, thin rules,
// one white pill. Cards first (price, limits, what's included), then every plan of the group side by side. Prices are
// the panel's live ones; a signed-in visitor sees their own plan marked and no free-month offer (that's for new
// visitors).

const panelRoot = PANEL_URL.replace(/\/panel$/, '');
type Group = 'individual' | 'business';
const GROUPS: Array<[Group, string]> = [['individual', 'Individual'], ['business', 'Business']];

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
    const [myPlans, setMyPlans] = useState<Set<string>>(new Set());
    const [signedIn, setSignedIn] = useState(false);

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
                const keys = new Set<string>();
                if (d?.plan?.key) { keys.add(d.plan.key as string); setSignedIn(true); }
                // A team's plan is the visitor's too when they own the team.
                (d?.teams || []).forEach((t: { owner?: boolean; plan?: { key?: string } }) => { if (t?.owner && t?.plan?.key) keys.add(t.plan.key); });
                if (keys.size) setMyPlans(keys);
            })
            .catch(() => { /* signed out or offline: the plans, unmarked */ });
    }, []);

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
                        const mine = myPlans.has(plan.key);
                        const recommended = plan.key === 'developers';
                        return (
                            <article key={plan.key} id={`plan-${plan.key}`} className={`rhp-card${recommended ? ' pick' : ''}${mine ? ' mine' : ''}`} style={{ ['--i' as string]: i }}>
                                <header>
                                    <h2>{plan.name}</h2>
                                    {mine ? <span className="rhp-tag mine">Your plan</span> : recommended ? <span className="rhp-tag">Most picked</span> : null}
                                </header>
                                <p className="rhp-price"><Price plan={plan} prices={prices} signedIn={signedIn} /></p>
                                {mine ? (
                                    <span className="rhp-btn current" aria-disabled="true">Current plan</span>
                                ) : (
                                    <a className={`rhp-btn${recommended ? ' main' : ''}`} href={`${panelRoot}/plans?plan=${plan.key}`}>{cta(plan, signedIn)}</a>
                                )}
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

            <section className="rh-close" aria-labelledby="rhp-close-title">
                <h2 id="rhp-close-title">Not sure yet? <em>Start free, pick later.</em></h2>
                <div className="rh-ctas">
                    <a className="btn btn-primary" href={`${panelRoot}/plans?plan=personal`}>Start hosting free</a>
                    <a className="rh-link" href="/hosting">Back to Robtic Hosting <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
            </section>
        </div>
    );
}
