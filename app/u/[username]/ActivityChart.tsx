'use client';

import { useState } from 'react';
import type { ActivityDay } from '@/lib/profile';

function duration(minutes: number): string {
    if (minutes === 0) return 'Not active';
    if (minutes < 60) return `${minutes} min`;
    const m = minutes % 60;
    return `${Math.floor(minutes / 60)} h${m ? ` ${m} min` : ''}`;
}

function day(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// Time active per day: one bar a day, with the day's time on hover or focus. The table is the same data for screen
// readers.
export default function ActivityChart({ days, totalHours }: { days: ActivityDay[]; totalHours: number }) {
    const [hover, setHover] = useState<number | null>(null);
    const peak = Math.max(...days.map((d) => d.minutes), 1);
    const shown = hover === null ? null : days[hover];
    const left = hover === null ? 50 : Math.min(88, Math.max(12, ((hover + 0.5) / days.length) * 100));

    return (
        <figure className="pf-chart">
            <figcaption>
                <h2>Activity</h2>
                <span>{totalHours < 1 ? 'Under an hour' : `${totalHours.toLocaleString('en')} hours`} on Robtic</span>
            </figcaption>
            <div className="pf-plot" onMouseLeave={() => setHover(null)}>
                {shown ? (
                    <div className="pf-tip" style={{ left: `${left}%` }}>
                        <b>{duration(shown.minutes)}</b>
                        <span>{day(shown.date)}</span>
                    </div>
                ) : null}
                {days.map((d, i) => (
                    <div
                        key={d.date}
                        className={`pf-day${hover === i ? ' on' : ''}`}
                        tabIndex={0}
                        aria-label={`${day(d.date)}: ${duration(d.minutes)}`}
                        onMouseEnter={() => setHover(i)}
                        onFocus={() => setHover(i)}
                        onBlur={() => setHover(null)}
                    >
                        <i style={{ height: d.minutes ? `${Math.max(4, (d.minutes / peak) * 100)}%` : undefined }} className={d.minutes ? '' : 'none'} />
                    </div>
                ))}
            </div>
            <div className="pf-axis">
                <span>{day(days[0].date)}</span>
                <span>Today</span>
            </div>
            <table className="pf-sr">
                <caption>Time active per day</caption>
                <tbody>
                    {days.map((d) => (
                        <tr key={d.date}>
                            <th scope="row">{day(d.date)}</th>
                            <td>{duration(d.minutes)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
