'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorText, request } from '@/lib/account';
import { Row, useRun, useSettings } from '../SettingsShell';

// Settings -> GitHub: the connection that deploys apps from repositories. Signing in with GitHub or Discord is at /setting.
type Github = { available: boolean; account: { login: string; avatar_url: string | null } | null };

const BACK = '/settings/linked';

export default function LinkedAccounts() {
    const { toast } = useSettings();
    const { run, pending } = useRun();
    const [github, setGithub] = useState<Github | null>(null);

    const load = useCallback(() => {
        request<Github>('GET', '/api/client/robtic/github')
            .then(setGithub)
            .catch((e) => toast('err', errorText(e)));
    }, [toast]);

    useEffect(load, [load]);

    const unlink = async () => {
        if (await run(() => request('DELETE', '/api/client/robtic/github'), 'GitHub disconnected.')) load();
    };

    return (
        <>
            <header className="st-head">
                <h1>GitHub</h1>
                <p>Deploy your apps straight from your repositories. To sign in with GitHub or Discord, go to <a href="/setting">Sign-in and security</a>.</p>
            </header>
            <section className="st-card">
                {!github ? <div className="st-spin" /> : null}
                {github?.available ? (
                    <Row title="GitHub" desc={github.account ? `Connected as ${github.account.login}` : 'Deploy from your repositories.'}>
                        {github.account ? (
                            <button type="button" className="st-link danger" disabled={pending} onClick={unlink}>Disconnect</button>
                        ) : (
                            <a className="btn btn-ghost" href={`/robtic/github/connect?${new URLSearchParams({ back: BACK })}`}>Connect</a>
                        )}
                    </Row>
                ) : null}
            </section>
        </>
    );
}
