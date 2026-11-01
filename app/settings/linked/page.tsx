'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorText, request } from '@/lib/account';
import { Row, useRun, useSettings } from '../SettingsShell';

// Settings -> Linked accounts: GitHub (sign-in and deploying from repositories) and Discord (sign-in).
type Connections = { password_set: boolean; discord: { available: boolean; name: string | null } };
type Github = { available: boolean; account: { login: string; avatar_url: string | null } | null };

const BACK = '/settings/linked';

export default function LinkedAccounts() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const [connections, setConnections] = useState<Connections | null>(null);
    const [github, setGithub] = useState<Github | null>(null);

    const load = useCallback(() => {
        Promise.all([request<Connections>('GET', '/api/client/robtic/account/connections'), request<Github>('GET', '/api/client/robtic/github')])
            .then(([c, g]) => {
                setConnections(c);
                setGithub(g);
            })
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);

    useEffect(() => {
        load();
        // A provider's window reports back here when it finishes.
        const onMessage = (e: MessageEvent) => {
            if (e.origin === window.location.origin && e.data?.robticLogin) load();
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [load]);

    const connectDiscord = () => {
        const w = window.open('/robtic/discord/connect', 'robtic-discord', 'popup,width=520,height=760');
        if (!w) window.location.href = '/robtic/discord/connect';
    };
    const unlinkDiscord = async () => {
        const r = await run(() => request<Connections>('DELETE', '/api/client/robtic/account/discord'), 'Discord disconnected.');
        if (r) setConnections(r);
    };
    const unlinkGithub = async () => {
        if (await run(() => request('DELETE', '/api/client/robtic/github'), 'GitHub disconnected.')) load();
    };

    return (
        <>
            <header className="st-head">
                <h1>Linked accounts</h1>
                <p>Sign in with these, and deploy your apps straight from GitHub.</p>
            </header>
            <section className="st-card">
                {!connections || !github ? <div className="st-spin" /> : null}
                {github?.available ? (
                    <Row title="GitHub" desc={github.account ? `Connected as ${github.account.login}` : 'Sign in with GitHub and deploy from your repositories.'}>
                        {github.account ? (
                            <button type="button" className="st-link danger" disabled={pending} onClick={unlinkGithub}>Disconnect</button>
                        ) : (
                            <a className="btn btn-ghost" href={`/robtic/github/connect?${new URLSearchParams({ back: BACK })}`}>Connect</a>
                        )}
                    </Row>
                ) : null}
                {connections?.discord.available ? (
                    <Row title="Discord" desc={connections.discord.name ? `Connected as ${connections.discord.name}` : 'Sign in with your Discord account.'}>
                        {connections.discord.name ? (
                            <button type="button" className="st-link danger" disabled={pending} onClick={unlinkDiscord}>Disconnect</button>
                        ) : (
                            <button type="button" className="btn btn-ghost" onClick={connectDiscord}>Connect</button>
                        )}
                    </Row>
                ) : null}
            </section>
        </>
    );
}
