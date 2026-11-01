'use client';

import { useEffect, useState } from 'react';
import { errorText, request } from '@/lib/account';
import { useSettings } from '../SettingsShell';

// Settings -> Plan: the plan you're on, how long it has left, and your subscription history.
type Plan = { name: string; ends_at: string | null; ended: boolean };
type History = { id: number; plan: string; status: 'approved' | 'declined' | 'cancelled'; change: string | null; price: string | null; months: number; at: string };
type Data = { plan: Plan; teams: Array<{ owner: boolean; plan: Plan }>; history: History[] };

const STATUS: Record<History['status'], string> = { approved: 'Started', declined: 'Declined', cancelled: 'Cancelled' };
const DAY = 86_400_000;

const date = (v: string) => new Date(v).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });

// Days, hours and minutes left, ticking every minute, with a bar over the plan's last month.
function TimeLeft({ plan }: { plan: Plan }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
    }, []);

    if (!plan.ends_at) return <p className="st-sub">No end date.</p>;
    const left = Math.max(0, new Date(plan.ends_at).getTime() - now);
    if (plan.ended || left === 0) {
        return (
            <p className="st-sub">
                Ended {date(plan.ends_at)}. <a href="/plans">Choose a plan</a>
            </p>
        );
    }

    const days = Math.floor(left / DAY);
    const hours = Math.floor((left % DAY) / 3_600_000);
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    const parts: Array<[number, string]> = [
        [days, days === 1 ? 'day' : 'days'],
        [hours, hours === 1 ? 'hour' : 'hours'],
        [minutes, minutes === 1 ? 'minute' : 'minutes'],
    ];

    return (
        <div className="st-left">
            <div>
                {parts.map(([n, label]) => (
                    <p key={label}>
                        <b>{n}</b>
                        {label}
                    </p>
                ))}
                <small>Ends {date(plan.ends_at)}</small>
            </div>
            <i className={days < 3 ? 'low' : ''}>
                <s style={{ width: `${(Math.min(1, left / (30 * DAY)) * 100).toFixed(1)}%` }} />
            </i>
        </div>
    );
}

export default function PlanSettings() {
    const { toast } = useSettings();
    const [data, setData] = useState<Data | null>(null);

    useEffect(() => {
        request<Data>('GET', '/api/client/robtic/account/plan')
            .then(setData)
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);

    // The plan shown as theirs: the team's when they own one, otherwise their own.
    const owned = data?.teams.find((t) => t.owner);
    const plan = owned?.plan ?? data?.plan;

    return (
        <>
            <header className="st-head">
                <h1>Plan</h1>
                <p>Your plan and your subscription history.</p>
            </header>
            {!data || !plan ? (
                <div className="st-spin" />
            ) : (
                <>
                    <section className="st-card">
                        <div className="st-plan">
                            <div>
                                <small>{owned ? 'Team plan' : 'Personal plan'}</small>
                                <h2>{plan.name}</h2>
                            </div>
                            <a className="btn btn-ghost" href="/plans">See plans</a>
                        </div>
                        <TimeLeft plan={plan} />
                    </section>

                    <section className="st-card">
                        <h2>Subscription history</h2>
                        {data.history.length === 0 ? <p className="st-sub">Nothing yet.</p> : <div className="st-gap" />}
                        {data.history.map((h) => (
                            <div className="st-item" key={h.id}>
                                <div>
                                    <b>{h.change === 'downgrade' ? `Moved to ${h.plan}` : h.plan}</b>
                                    <small>
                                        {date(h.at)}
                                        {h.price ? ` · ${h.price}` : ''}
                                        {h.status === 'approved' && h.change !== 'downgrade' ? ` · ${h.months} month${h.months === 1 ? '' : 's'}` : ''}
                                    </small>
                                </div>
                                <span className={h.status === 'approved' ? 'st-pill' : 'st-pill off'}>{h.change === 'downgrade' ? 'Changed' : STATUS[h.status]}</span>
                            </div>
                        ))}
                    </section>
                </>
            )}
        </>
    );
}
