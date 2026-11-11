'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONNECT_WINDOW, errorText, identity, IDENTITY, request, type Identity } from '@/lib/account';
import { Row, useRun, useSettings } from '../SettingsShell';

// Settings -> Connections: GitHub and Discord to sign in with, and the GitHub link that deploys from repositories.
type Github = { available: boolean; account: { login: string; avatar_url: string | null } | null };

// GitHub/Discord sign-in links (connection=…) and the GitHub repositories link (robticGithub, from /robtic/github/done).
const OUTCOME: Record<string, { kind: 'ok' | 'err'; text: string }> = {
    linked: { kind: 'ok', text: 'GitHub connected.' },
    unavailable: { kind: 'err', text: 'GitHub isn’t available right now.' },
    done: { kind: 'ok', text: 'Connected.' },
    taken: { kind: 'err', text: 'That account is already connected to another Robtic account.' },
    failed: { kind: 'err', text: 'That couldn’t be connected. Try again.' },
};

const Check = () => (
    <svg className="st-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

export default function Connections() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const outcome = useSearchParams().get('connection');
    const [me, setMe] = useState<Identity | null>(null);
    const [github, setGithub] = useState<Github | null>(null);

    const load = useCallback(() => {
        identity().then(setMe).catch((e) => toast('err', errorText(e)));
        request<Github>('GET', '/api/client/robtic/github').then(setGithub).catch(() => setGithub({ available: false, account: null }));
    }, [toast]);
    useEffect(load, [load]);

    // Inside the connect window: the provider sent us back here. Tell the settings page and close.
    const inPopup = typeof window !== 'undefined' && window.name === CONNECT_WINDOW && !!window.opener;
    useEffect(() => {
        if (!outcome) return;
        if (inPopup) {
            try { window.opener.postMessage({ robticConnection: outcome }, window.location.origin); } catch { /* opener gone */ }
            window.close();
            return;
        }
        const said = OUTCOME[outcome];
        if (said) toast(said.kind, said.text);
        window.history.replaceState(null, '', '/settings/connections');
    }, [outcome, toast, inPopup]);

    // The settings page: the connect window reports back here, and the list updates in place.
    const popup = useRef<Window | null>(null);
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return;
            const said = OUTCOME[String(e.data.robticConnection ?? e.data.robticGithub ?? '')];
            if (!said) return;
            toast(said.kind, said.text);
            load();
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [load, toast]);

    /** Opens the connect window (centred over this page). Returns false when the browser blocked it. */
    const openWindow = (url: string) => {
        const w = 520, h = 720;
        const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2);
        const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2);
        const win = window.open(url, CONNECT_WINDOW, `popup,width=${w},height=${h},left=${left},top=${top}`);
        if (!win) return false;
        popup.current = win;
        win.focus();
        // Closed without finishing (or the provider didn't come back): just refresh the list.
        const watch = window.setInterval(() => {
            if (win.closed) { window.clearInterval(watch); load(); }
        }, 800);
        return true;
    };

    const connect = async (id: string) => {
        if (openWindow(`/settings/connections/popup?${new URLSearchParams({ provider: id })}`)) return;
        // Popups blocked: the old way, through this page.
        const r = await run(() => request<{ url: string }>('POST', `${IDENTITY}/providers/${encodeURIComponent(id)}`));
        if (r) window.location.assign(r.url);
    };
    const connectRepositories = () => {
        const back = new URLSearchParams({ back: '/settings/connections' });
        if (!openWindow(`/robtic/github/connect?${new URLSearchParams({ popup: '1' })}`)) window.location.assign(`/robtic/github/connect?${back}`);
    };
    const disconnect = async (id: string, linked: string) => {
        if (await run(() => request('DELETE', `${IDENTITY}/providers/${encodeURIComponent(id)}/${encodeURIComponent(linked)}`), 'Disconnected.')) load();
    };
    const unlinkRepositories = async () => {
        if (await run(() => request('DELETE', '/api/client/robtic/github'), 'GitHub disconnected.')) load();
    };

    if (inPopup && outcome) return <main className="st-popup"><div className="st-spin" /><p>Done. This window closes itself.</p></main>;

    return (
        <>
            <header className="st-head">
                <h1>Connections</h1>
                <p>Accounts you can sign in with, and where your apps deploy from.</p>
            </header>
            <section className="st-card">
                <h2>Sign in with</h2>
                {!me ? <div className="st-spin" /> : null}
                {me?.providers.map((p) => (
                    <Row key={p.id} title={p.name} desc={p.linked_as !== null ? <span className="st-connected"><Check /> Connected{p.linked_as ? ` as ${p.linked_as}` : ''}</span> : 'Not connected'}>
                        {p.linked_id ? (
                            <button type="button" className="st-link danger" disabled={pending} onClick={() => disconnect(p.id, p.linked_id as string)}>Disconnect</button>
                        ) : (
                            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => connect(p.id)}>Connect</button>
                        )}
                    </Row>
                ))}
            </section>
            {github?.available ? (
                <section className="st-card">
                    <h2>Deploy from</h2>
                    <Row title="GitHub repositories" desc={github.account ? <span className="st-connected"><Check /> Connected as {github.account.login}</span> : 'Not connected'}>
                        {github.account ? (
                            <button type="button" className="st-link danger" disabled={pending} onClick={unlinkRepositories}>Disconnect</button>
                        ) : (
                            <button type="button" className="btn btn-ghost" onClick={connectRepositories}>Connect</button>
                        )}
                    </Row>
                </section>
            ) : null}
        </>
    );
}
