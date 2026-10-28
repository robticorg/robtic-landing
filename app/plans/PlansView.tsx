'use client';

import { useEffect, useRef, useState } from 'react';
import { PANEL_URL } from '@/lib/site';
import { PLANS, PLAN_FEATURE_LABELS, sizeLabel, coresLabel, featureDetail, type Plan } from '@/lib/plans';

const panelRoot = PANEL_URL.replace(/\/panel$/, '');
const GROUPS: Array<['individual' | 'business', string]> = [
    ['individual', 'Individual'],
    ['business', 'Business'],
];

function cta(plan: Plan): string {
    if (plan.key === 'org') return 'Ask for an offer';
    if (plan.trialDays) return 'Start free';
    return `Choose ${plan.name}`;
}

export default function PlansView({ prices = {} }: { prices?: Record<string, string> }) {
    const [group, setGroup] = useState<'individual' | 'business'>('individual');
    // The plan keys the signed-in visitor is on: their own account plan, plus the plan of any team they own.
    // Empty when signed out. Used to put the "Your plan" tape on the matching card(s).
    const [myPlans, setMyPlans] = useState<Set<string>>(new Set());
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`${panelRoot}/api/client/robtic/account/plan`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                const keys = new Set<string>();
                if (d?.plan?.key) keys.add(d.plan.key as string);
                // The team plan is "theirs" too when they own the team.
                (d?.teams || []).forEach((t: { owner?: boolean; plan?: { key?: string } }) => {
                    if (t?.owner && t?.plan?.key) keys.add(t.plan.key);
                });
                if (keys.size) setMyPlans(keys);
            })
            .catch(() => {
                // Signed out or offline: just show the plans without a "your plan" mark.
            });
    }, []);

    // Keep the rise-in cards visible. Re-run when myPlans arrives too: marking a card re-renders it, which would
    // otherwise drop the imperatively-added `is-in` and make the card (with its tape) flicker out.
    useEffect(() => {
        wrapRef.current?.querySelectorAll(`.reveal`).forEach((el) => el.classList.add('is-in'));
    }, [group, myPlans]);

    return (
        <>
            <div className="page-head">
                <div className="wrap">
                    <h1>Plans</h1>
                    <p>Start free for a month. Grow when your bots do.</p>
                    <div className="tabs" role="tablist">
                        {GROUPS.map(([key, label]) => (
                            <button key={key} type="button" role="tab" className={key === group ? 'on' : ''} onClick={() => setGroup(key)}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="wrap" style={{ paddingBottom: 40 }} ref={wrapRef}>
                {GROUPS.map(([g]) => (
                    <div className="plans" data-plans={g} key={g} hidden={g !== group}>
                        {PLANS.filter((p) => p.group === g).map((plan, i) => {
                            const recommended = plan.key === 'developers';
                            const mine = myPlans.has(plan.key);
                            return (
                                <div
                                    // `is-current` stays OFF the className on purpose: changing the className when the
                                    // plan loads would drop the imperatively-added `is-in` and flicker the card out.
                                    // The white border is applied as an inline style instead, which never touches `is-in`.
                                    className={`plan reveal ${recommended ? 'recommended' : ''}`}
                                    id={`plan-${plan.key}`}
                                    key={plan.key}
                                    style={{ transitionDelay: `${i * 70}ms`, ...(mine ? { borderColor: 'rgba(255, 255, 255, 0.5)' } : {}) }}
                                >
                                    {/* The visitor's own plan gets the white tape; otherwise the recommended one keeps its blue tape. */}
                                    {mine ? (
                                        <span className="ribbon mine-ribbon">Your plan</span>
                                    ) : (
                                        recommended && <span className="ribbon">Recommended</span>
                                    )}
                                    <h3>{plan.name}</h3>
                                    <p className="price">
                                        {(() => {
                                            // Live price from the panel (prices[key]) wins over the static snapshot.
                                            const priceText = prices[plan.key] || plan.price;
                                            if (plan.key === 'org') return <>Custom <small>priced for you</small></>;
                                            if (plan.trialDays) return <>Free <small>first {plan.trialDays} days</small></>;
                                            if (priceText && priceText.toLowerCase() === 'free') return <>Free</>;
                                            if (priceText) return <>{priceText.split(' / ')[0]} <small>/ month</small></>;
                                            return <small>Price soon</small>;
                                        })()}
                                    </p>
                                    <div className="limits">
                                        <div><span>Apps</span>{plan.limits.apps ?? 'Unlimited'}</div>
                                        <div><span>Memory</span>{sizeLabel(plan.limits.memory)}</div>
                                        <div><span>CPU</span>{coresLabel(plan.limits.cpu)}</div>
                                        <div><span>Storage</span>{sizeLabel(plan.limits.disk)}</div>
                                    </div>
                                    <ul>
                                        {PLAN_FEATURE_LABELS.map(([fkey, name]) => {
                                            const text = featureDetail(plan, fkey);
                                            return (
                                                <li className={text === null ? 'no' : ''} key={fkey}>
                                                    {name}{text ? ` · ${text}` : ''}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <a className={`btn ${recommended ? 'btn-primary' : 'btn-ghost'}`} href={`${panelRoot}/plans?plan=${plan.key}`}>
                                        {cta(plan)}
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </>
    );
}
