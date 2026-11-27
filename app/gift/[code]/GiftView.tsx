'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { request } from '@/lib/account';
import { signInHref } from '../../SignInLink';
import './gift.css';

// robtic.org/gift/<code>. Signed in, the panel says whether this account can claim the gift (and which of its
// workspaces can take it); signed out, the public read shows the gift and Claim asks to sign in first.
type Gift = {
    code: string;
    kind: 'plan' | 'apps' | 'backups';
    title: string;
    detail: string;
    value: string;
    unit: string;
    note: string | null;
    from: string;
    expires_at: string | null;
    state: 'available' | 'off' | 'expired' | 'used_up';
    claimed?: { at: string; summary: string } | null;
    blocked?: string | null;
    workspaces?: Array<{ id: string; name: string }>;
    name?: string;
};
type Load = { kind: 'loading' } | { kind: 'missing' } | { kind: 'down' } | { kind: 'ready'; gift: Gift; signedIn: boolean };
type Done = { summary: string; at: string; workspace: { id: string; name: string } | null };

const CODE = /^RB-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;
const STAMP: Record<Exclude<Gift['state'], 'available'>, string> = { off: 'Turned off', expired: 'Expired', used_up: 'Claimed' };
const WHY: Record<Exclude<Gift['state'], 'available'>, string> = {
    off: 'This gift was turned off by Robtic.',
    expired: 'This gift has expired.',
    used_up: 'Someone has already claimed this gift.',
};
const DASHBOARD = '/hosting/dashboard';

const ICONS: Record<Gift['kind'], string> = {
    apps: 'M3 4h18v7H3zM3 13h18v7H3zM7 7.5h.01M7 16.5h.01',
    plan: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
    backups: 'M4 7h16v4H4zM5 11v8h14v-8M10 15h4',
};

function Icon({ d, size = 22 }: { d: string; size?: number }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={d} />
        </svg>
    );
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function GiftView({ code: raw }: { code: string }) {
    const code = decodeURIComponent(raw).toUpperCase();
    const [load, setLoad] = useState<Load>({ kind: 'loading' });
    const [phase, setPhase] = useState<'sealed' | 'ticket' | 'final'>('sealed');
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState<Done | null>(null);
    const [workspace, setWorkspace] = useState('');
    const root = useRef<HTMLDivElement>(null);
    const reduce = useRef(false);

    useEffect(() => {
        reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!CODE.test(code)) {
            setLoad({ kind: 'missing' });
            return;
        }
        const json = { headers: { Accept: 'application/json' }, credentials: 'same-origin' as const };
        (async () => {
            try {
                const mine = await fetch(`/api/client/robtic/gifts/${code}`, json);
                if (mine.ok) return show(await mine.json(), true);
                if (mine.status === 404) return setLoad({ kind: 'missing' });
                const pub = await fetch(`/api/robtic/gifts/${code}`, json);
                if (pub.ok) return show(await pub.json(), false);
                setLoad({ kind: pub.status === 404 ? 'missing' : 'down' });
            } catch {
                setLoad({ kind: 'down' });
            }
        })();
        function show(gift: Gift, signedIn: boolean) {
            setLoad({ kind: 'ready', gift, signedIn });
            setWorkspace(gift.workspaces?.[0]?.id ?? '');
            // Already claimed by this account, or nothing left to claim: straight to the ticket, no box to open.
            setPhase(gift.claimed || gift.state !== 'available' ? 'final' : 'sealed');
        }
    }, [code]);

    const $ = <T extends Element = HTMLElement>(sel: string) => root.current?.querySelector<T>(sel) ?? null;
    const phone = () => window.matchMedia('(max-width: 640px)').matches;
    const animate = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions & { duration: number }) =>
        el ? el.animate(frames, { fill: 'forwards', ...opts, duration: reduce.current ? 1 : opts.duration }).finished.catch(() => undefined) : Promise.resolve(undefined);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduce.current ? Math.min(ms, 40) : ms));

    // ------------------------------------------------------------ Opening the box
    async function open() {
        const box = $('.gf-box');
        if (!box || box.hasAttribute('data-opening')) return;
        box.setAttribute('data-opening', '');
        box.classList.remove('gf-idle');
        await animate(box, [{ transform: 'scale(1)' }, { transform: 'scale(1.06, .92)' }], { duration: 160, easing: 'ease-in' });
        const bits = $('.gf-bits');
        if (bits && !reduce.current) {
            for (let i = 0; i < 16; i++) {
                const b = document.createElement('i');
                bits.appendChild(b);
                const angle = ((-90 + (Math.random() - 0.5) * 150) * Math.PI) / 180;
                const dist = 110 + Math.random() * 120;
                b.animate(
                    [
                        { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
                        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.7 },
                        { transform: `translate(${Math.cos(angle) * dist * 1.1}px, ${Math.sin(angle) * dist + 90}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
                    ],
                    { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' },
                );
            }
        }
        animate(box, [{ transform: 'scale(1.06, .92)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.2,1.6,.4,1)' });
        animate($('.gf-bow'), [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(-40px,-190px) rotate(-40deg)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.7,.3,1)' });
        await animate($('.gf-lid'), [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(-60px,-170px) rotate(-28deg)', opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.2,.7,.3,1)' });
        await Promise.all([
            animate($('.gf-body'), [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(60px) scale(.9)', opacity: 0 }], { duration: 380, easing: 'ease-in' }),
            animate($('.gf-intro'), [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: 300, easing: 'ease-in' }),
            animate($('.gf-open'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }),
        ]);
        setPhase('ticket');
    }

    // ------------------------------------------------------------ The ticket rises and gets cut
    useLayoutEffect(() => {
        if (phase !== 'ticket') return;
        let live = true;
        (async () => {
            const t = $('.gf-ticket'), perf = $('.gf-perf'), sc = $('.gf-scissors'), stub = $('.gf-stub');
            const vertical = !phone();
            if (perf) perf.style.transform = vertical ? 'translateX(1px) scaleY(0)' : 'translateY(1px) scaleX(0)';
            const from = Math.max(window.innerHeight, 700);
            await animate(t, [
                { transform: `translateY(${from}px) rotate(7deg)` },
                { transform: 'translateY(-18px) rotate(-1.2deg)', offset: 0.72 },
                { transform: 'translateY(4px) rotate(.4deg)', offset: 0.88 },
                { transform: 'translateY(0) rotate(0)' },
            ], { duration: 1100, easing: 'cubic-bezier(.22,.9,.3,1)' });
            if (!live) return;
            animate($('.gf-intro'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
            animate($('.gf-plane'), [{ left: '0%' }, { left: '100%' }], { duration: 1400, easing: 'cubic-bezier(.5,0,.3,1)' });
            await wait(250);
            const len = t ? (vertical ? t.offsetHeight : t.offsetWidth) : 0;
            animate(sc, [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 900 });
            animate(sc, vertical
                ? [{ transform: 'translate(50%, -50%) rotate(90deg)', top: '0px' }, { transform: 'translate(50%, -50%) rotate(90deg)', top: `${len}px` }]
                : [{ transform: 'translate(-50%, 50%)', left: '0px' }, { transform: 'translate(-50%, 50%)', left: `${len}px` }],
                { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' });
            await animate(perf, vertical
                ? [{ transform: 'translateX(1px) scaleY(0)' }, { transform: 'translateX(1px) scaleY(1)' }]
                : [{ transform: 'translateY(1px) scaleX(0)' }, { transform: 'translateY(1px) scaleX(1)' }],
                { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' });
            if (!live) return;
            await animate(stub, vertical
                ? [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(8px) rotate(1.5deg)' }, { transform: 'translateX(0) rotate(0)' }]
                : [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(8px) rotate(1deg)' }, { transform: 'translateY(0) rotate(0)' }],
                { duration: 460, easing: 'cubic-bezier(.3,1.4,.5,1)' });
            const reveal = [{ opacity: 0, transform: 'translateY(6px) scale(.96)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }];
            animate($('.gf-claim'), reveal, { duration: 300, easing: 'ease-out' });
            animate($('.gf-pick'), reveal, { duration: 300, easing: 'ease-out' });
            animate($('.gf-why'), reveal, { duration: 300, easing: 'ease-out' });
            setReady(true);
        })();
        return () => {
            live = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // Already decided (claimed, expired…): the ticket simply settles in with its stamp.
    useLayoutEffect(() => {
        if (phase !== 'final') return;
        animate($('.gf-ticket'), [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, easing: 'cubic-bezier(.22,.9,.3,1)' });
        animate($('.gf-stamp'), [{ opacity: 0, transform: 'rotate(-8deg) scale(1.6)' }, { opacity: 1, transform: 'rotate(-8deg) scale(1)' }], { duration: 420, delay: 300, easing: 'cubic-bezier(.3,.7,.4,1)' });
        animate($('.gf-after'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 450 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ------------------------------------------------------------ Claim: the stub tears off, the stamp lands
    async function claim() {
        if (load.kind !== 'ready' || busy) return;
        setBusy(true);
        setError('');
        let result: Done;
        try {
            result = await request<Done>('POST', `/api/client/robtic/gifts/${code}/claim`, workspace ? { workspace } : {});
        } catch (e) {
            setError((e as Error).message || 'The gift could not be claimed. Try again.');
            setBusy(false);
            return;
        }
        const vertical = !phone();
        const stub = $('.gf-stub'), t = $('.gf-ticket');
        animate($('.gf-perf'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
        animate($('.gf-pick'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
        await animate(stub, vertical
            ? [{ transform: 'translate(0,0) rotate(0)', transformOrigin: '0 0' }, { transform: 'translate(14px, 4px) rotate(4deg)', transformOrigin: '0 0' }]
            : [{ transform: 'translate(0,0) rotate(0)', transformOrigin: '0 0' }, { transform: 'translate(4px, 14px) rotate(3deg)', transformOrigin: '0 0' }],
            { duration: 140, easing: 'ease-out' });
        animate(stub, vertical
            ? [{ transform: 'translate(14px, 4px) rotate(4deg)', opacity: 1, transformOrigin: '0 0' }, { transform: 'translate(90px, 520px) rotate(28deg)', opacity: 0, transformOrigin: '0 0' }]
            : [{ transform: 'translate(4px, 14px) rotate(3deg)', opacity: 1, transformOrigin: '0 0' }, { transform: 'translate(40px, 520px) rotate(-18deg)', opacity: 0, transformOrigin: '0 0' }],
            { duration: 820, easing: 'cubic-bezier(.5,0,.75,.3)' });
        await wait(260);
        const shift = stub ? (vertical ? stub.offsetWidth / 2 : stub.offsetHeight / 4) : 0;
        animate(t, vertical ? [{ transform: 'translateX(0)' }, { transform: `translateX(${shift}px)` }] : [{ transform: 'translateY(0)' }, { transform: `translateY(${shift}px)` }],
            { duration: 520, easing: 'cubic-bezier(.3,1.2,.4,1)' });
        setDone(result);
        await animate($('.gf-stamp'), [{ opacity: 0, transform: 'rotate(-8deg) scale(1.9)' }, { opacity: 1, transform: 'rotate(-8deg) scale(.94)', offset: 0.7 }, { opacity: 1, transform: 'rotate(-8deg) scale(1)' }],
            { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' });
        animate($('.gf-main'), [{ transform: 'translateY(0)' }, { transform: 'translateY(3px)' }, { transform: 'translateY(0)' }], { duration: 180 });
        await animate($('.gf-after'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' });
        setBusy(false);
    }

    // ------------------------------------------------------------ Render
    if (load.kind !== 'ready') {
        return (
            <div className="gf" ref={root}>
                <div className="gf-stage" aria-live="polite">
                    {load.kind === 'loading' ? <span className="gf-spin-page" aria-label="Loading" /> : (
                        <div className="gf-intro">
                            <h1>{load.kind === 'missing' ? 'There’s no gift here' : 'Gifts are unavailable right now'}</h1>
                            <p className="gf-note">{load.kind === 'missing' ? 'Check the link you were sent, or ask whoever sent it.' : 'Try again in a few minutes.'}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const { gift, signedIn } = load;
    const closed = gift.state !== 'available' && !gift.claimed;
    const mine = gift.claimed ?? (done ? { at: done.at, summary: done.summary } : null);
    const stampText = mine ? 'Claimed' : closed ? STAMP[gift.state as keyof typeof STAMP] : 'Claimed';
    const stampDate = mine ? day(mine.at) : '';
    const hostingOff = gift.blocked?.startsWith('Turn on Robtic Hosting');
    const pick = signedIn && !gift.blocked && gift.kind !== 'plan' && (gift.workspaces?.length ?? 0) > 1;
    const here = `/gift/${gift.code}`;

    return (
        <div className="gf" ref={root}>
            <div className="gf-stage" aria-live="polite">
                {phase === 'sealed' ? (
                    <>
                        <div className="gf-intro">
                            <h1>Something’s <em>waiting</em> for you</h1>
                            <p className="gf-note">{gift.note || 'A gift from Robtic. Open it to see what’s inside.'}</p>
                        </div>
                        <div className="gf-box-wrap">
                            <button type="button" className="gf-box gf-idle" aria-label="Open the gift" onClick={open}>
                                <span className="gf-shadow" />
                                <span className="gf-body" />
                                <span className="gf-lid" />
                                <span className="gf-bow"><i /><i /></span>
                                <span className="gf-bits" aria-hidden="true" />
                            </button>
                            <button type="button" className="gf-btn gf-btn-primary gf-open" onClick={open}>Open the gift</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="gf-intro" style={phase === 'ticket' ? { opacity: 0 } : undefined}>
                            <h1>{closed ? <>This gift is <em>gone</em></> : mine ? <>It’s <em>yours</em> now</> : <>It’s <em>yours</em> to claim</>}</h1>
                        </div>
                        <div className="gf-area">
                            <div className={`gf-ticket${closed ? ' is-done' : ''}`}>
                                <div className="gf-part gf-main">
                                    <div className="gf-route">
                                        <span className="gf-place">{gift.from}</span>
                                        <span className="gf-line"><span className="gf-plane"><Icon d="M20 12 4 5l3 7-3 7 16-7Z" size={18} /></span></span>
                                        <span className="gf-place">{signedIn && gift.name ? gift.name : 'You'}</span>
                                    </div>
                                    <div className="gf-what">
                                        <h2>{gift.title}</h2>
                                        <p>{gift.detail}</p>
                                    </div>
                                    <div className="gf-foot">
                                        <code>{gift.code}</code>
                                        <span>{gift.expires_at ? `Claim by ${day(gift.expires_at)}` : 'No end date'}</span>
                                    </div>
                                    <div className="gf-stamp" style={phase === 'final' || done ? undefined : { opacity: 0 }}>
                                        <b>{stampText}</b>{stampDate}
                                    </div>
                                </div>
                                {phase === 'ticket' ? (
                                    <div className="gf-part gf-stub">
                                        <span className="gf-kind"><Icon d={ICONS[gift.kind]} /></span>
                                        <div className="gf-value"><b>{gift.value}</b><span>{gift.unit}</span></div>
                                        {!signedIn ? (
                                            <a className="gf-claim" href={signInHref('', here)}>Sign in to claim</a>
                                        ) : gift.blocked ? (
                                            hostingOff ? <a className="gf-claim" href={DASHBOARD}>Turn on Hosting</a> : <span />
                                        ) : (
                                            <button type="button" className="gf-claim" onClick={claim} disabled={!ready || busy || !!done}>
                                                {busy && !done ? <><span className="gf-spin" aria-hidden="true" />Claiming</> : 'Claim'}
                                            </button>
                                        )}
                                    </div>
                                ) : null}
                                {phase === 'ticket' ? (
                                    <>
                                        <span className="gf-perf" />
                                        <span className="gf-scissors"><Icon size={28} d="M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></span>
                                    </>
                                ) : null}
                            </div>

                            {phase === 'ticket' && pick && !done ? (
                                <label className="gf-pick">
                                    Add it to
                                    <select id="gf-workspace" value={workspace} onChange={(e) => setWorkspace(e.target.value)} disabled={busy}>
                                        {gift.workspaces!.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            {phase === 'ticket' && signedIn && gift.blocked && !done ? <p className="gf-why" style={{ opacity: 0 }}>{gift.blocked}</p> : null}
                            {phase === 'ticket' && !signedIn ? <p className="gf-why" style={{ opacity: 0 }}>Sign in or create a Robtic account to claim it. You’ll come straight back here.</p> : null}
                            {error ? <p className="gf-error" role="alert">{error}</p> : null}

                            {mine || closed ? (
                                <div className="gf-after" style={phase === 'ticket' && !done ? { opacity: 0 } : undefined}>
                                    {mine ? <span className="gf-ok">Added to your account</span> : null}
                                    <p>{mine ? <><b>{mine.summary}</b>.</> : WHY[gift.state as keyof typeof WHY]}</p>
                                    <div className="gf-row">
                                        {mine ? (
                                            <a className="gf-btn gf-btn-primary" href={done?.workspace ? `${DASHBOARD}/workspace/${done.workspace.id}` : DASHBOARD}>
                                                {done?.workspace || gift.kind !== 'plan' ? 'Open my workspace' : 'Open my dashboard'}
                                            </a>
                                        ) : null}
                                        <a className="gf-btn gf-btn-ghost" href="/hosting">Robtic Hosting</a>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
