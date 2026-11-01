'use client';

import { useEffect, useState } from 'react';

// "Edit profile" on your own profile, nothing on anyone else's.
export default function ProfileOwnerLink({ username }: { username: string }) {
    const [mine, setMine] = useState(false);

    useEffect(() => {
        fetch('/api/client/account', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setMine(d?.attributes?.username === username))
            .catch(() => {});
    }, [username]);

    return mine ? (
        <a className="btn btn-ghost pf-edit" href="/settings">
            Edit profile
        </a>
    ) : null;
}
