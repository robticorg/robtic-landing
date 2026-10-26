// Robtic landing: a snapshot of the plans, so the public Plans page can render without the panel or its
// database. These mirror Pterodactyl\Services\Robtic\Plans::PLANS. Prices are set in the panel (Admin -> Plans);
// until they are wired in here they show "Price soon". Sizes: memory/disk in MiB, cpu in % (100 = 1 vCPU);
// null means unlimited.

export type Plan = {
    key: string;
    name: string;
    group: 'individual' | 'business';
    byRequest?: boolean;
    trialDays: number;
    price: string; // "" => "Price soon"; "Custom" handled by key === 'org'
    limits: { apps: number | null; memory: number | null; cpu: number | null; disk: number | null };
    features: {
        sftp: boolean;
        github: boolean;
        env: boolean;
        databases: number | null | false; // count, null = unlimited, false/0 = none
        cache: 'server' | 'redis' | false;
        alerts: boolean;
        backups: number | null | false;
        schedules: boolean;
        live: boolean;
    };
};

export const TRIAL_DAYS = 30;

export const PLANS: Plan[] = [
    {
        key: 'personal', name: 'Personal', group: 'individual', trialDays: TRIAL_DAYS, price: '',
        limits: { apps: 1, memory: 256, cpu: 15, disk: 512 },
        features: { sftp: true, github: false, env: false, databases: 0, cache: 'server', alerts: false, backups: 0, schedules: false, live: false },
    },
    {
        key: 'developers', name: 'Developers', group: 'individual', trialDays: 0, price: '',
        limits: { apps: 2, memory: 512, cpu: 50, disk: 2048 },
        features: { sftp: true, github: true, env: true, databases: 1, cache: 'redis', alerts: true, backups: 0, schedules: false, live: false },
    },
    {
        key: 'servers', name: 'Servers', group: 'individual', trialDays: 0, price: '',
        limits: { apps: 5, memory: 2048, cpu: 150, disk: 8192 },
        features: { sftp: true, github: true, env: true, databases: 3, cache: 'redis', alerts: true, backups: 2, schedules: false, live: true },
    },
    {
        key: 'communities', name: 'Communities', group: 'individual', trialDays: 0, price: '',
        limits: { apps: 8, memory: 4096, cpu: 300, disk: 16384 },
        features: { sftp: true, github: true, env: true, databases: 5, cache: 'redis', alerts: true, backups: 3, schedules: true, live: true },
    },
    {
        key: 'team', name: 'Team', group: 'business', trialDays: 0, price: '',
        limits: { apps: null, memory: null, cpu: null, disk: null },
        features: { sftp: true, github: true, env: true, databases: null, cache: 'redis', alerts: true, backups: null, schedules: true, live: true },
    },
    {
        key: 'org', name: 'Org', group: 'business', byRequest: true, trialDays: 0, price: 'Custom',
        limits: { apps: null, memory: null, cpu: null, disk: null },
        features: { sftp: true, github: true, env: true, databases: null, cache: 'redis', alerts: true, backups: null, schedules: true, live: true },
    },
];

export const PLAN_FEATURE_LABELS: Array<[keyof Plan['features'], string]> = [
    ['sftp', 'SFTP'], ['github', 'GitHub'], ['env', 'Encrypted variables'], ['databases', 'MongoDB'],
    ['cache', 'Cache'], ['alerts', 'Discord alerts'], ['backups', 'Backups'], ['schedules', 'Schedules'],
    ['live', 'Live teamwork'],
];

export function sizeLabel(mib: number | null): string {
    if (mib === null) return 'Unlimited';
    return mib >= 1024 ? `${parseFloat((mib / 1024).toFixed(1))} GB` : `${mib} MB`;
}

export function coresLabel(cpu: number | null): string {
    if (cpu === null) return 'Unlimited';
    return `${parseFloat((cpu / 100).toFixed(2))} vCPU`;
}

export function featureDetail(plan: Plan, key: keyof Plan['features']): string | null {
    const value = plan.features[key];
    if (value === false || value === 0) return null;
    switch (key) {
        case 'databases': return value === null ? 'unlimited' : String(value);
        case 'cache': return value === 'redis' ? 'Redis' : 'private';
        case 'backups': return value === null ? 'unlimited' : `${value} per app`;
        default: return '';
    }
}
