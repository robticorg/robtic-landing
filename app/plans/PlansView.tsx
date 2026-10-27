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
    const wrapRef = useRef<HTMLDivElement>(null);

    // When a group is shown, make sure its rise-in cards are visible (the shared reveal observer may not fire
    // for a list that was hidden when it ran).
    useEffect(() => {
        wrapRef.current?.querySelectorAll(`[data-plans="${group}"] .reveal`).forEach((el) => el.classList.add('is-in'));
    }, [group]);

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
                            return (
                                <div
                                    className={`plan reveal ${recommended ? 'recommended' : ''}`}
                                    id={`plan-${plan.key}`}
                                    key={plan.key}
                                    style={{ transitionDelay: `${i * 70}ms` }}
                                >
                                    {recommended && <span className="ribbon">Recommended</span>}
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
