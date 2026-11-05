'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { errorText, identity, IDENTITY, request, type Identity } from '@/lib/account';
import { Row, useRun, useSettings } from '../SettingsShell';

// Settings -> Connections: GitHub and Discord to sign in with, and the GitHub link that deploys from repositories.
type Github = { available: boolean; account: { login: string; avatar_url: string | null } | null };

const OUTCOME: Record<string, { kind: 'ok' | 'err'; text: string }> = {
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

    useEffect(() => {
        const said = outcome ? OUTCOME[outcome] : null;
        if (said) {
            toast(said.kind, said.text);
            window.history.replaceState(null, '', '/settings/connections');
        }
    }, [outcome, toast]);

    const connect = async (id: string) => {
        const r = await run(() => request<{ url: string }>('POST', `${IDENTITY}/providers/${encodeURIComponent(id)}`));
        if (r) window.location.assign(r.url);
    };
    const disconnect = async (id: string, linked: string) => {
        if (await run(() => request('DELETE', `${IDENTITY}/providers/${encodeURIComponent(id)}/${encodeURIComponent(linked)}`), 'Disconnected.')) load();
    };
    const unlinkRepositories = async () => {
        if (await run(() => request('DELETE', '/api/client/robtic/github'), 'GitHub disconnected.')) load();
    };

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
                            <a className="btn btn-ghost" href={`/robtic/github/connect?${new URLSearchParams({ back: '/settings/connections' })}`}>Connect</a>
                        )}
                    </Row>
                </section>
            ) : null}
        </>
    );
}
