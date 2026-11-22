// Robtic's services, each its own platform: one Robtic account signs in to all of them, but each is started on its
// own (its own terms) from its own landing page. The home page introduces Robtic and points to these.

export type ServiceKey = 'hosting' | 'discord';

export interface Service {
    key: ServiceKey;
    name: string;
    /** The landing page (public, indexed). */
    path: string;
    /** Where the service itself opens (sign-in, then the service's own terms the first time). */
    app: string;
    tagline: string;
    text: string;
    image: string;
    imageAlt: string;
    terms: string;
    privacy: string;
}

export const SERVICES: Record<ServiceKey, Service> = {
    hosting: {
        key: 'hosting',
        name: 'Robtic Hosting',
        path: '/hosting',
        app: '/hosting/dashboard',
        tagline: 'Host Discord bots, websites and APIs',
        text: 'Run your bots and small apps from the browser: workspaces, a live console, a code editor, databases, backups and your own domain.',
        image: '/rl/robtic/site/panel.webp',
        imageAlt: 'A Robtic Hosting workspace: three Discord bot apps on a canvas, with backups and SFTP linked to them',
        terms: '/terms/hosting',
        privacy: '/privacy/hosting',
    },
    discord: {
        key: 'discord',
        name: 'Robtic Discord',
        path: '/discord',
        app: '/discord/public',
        tagline: 'Ready-made bots for your Discord server',
        text: 'Add Robtic’s bots to your server and set up every feature from a web dashboard: levels, staff, tickets, voice and raid protection.',
        image: '/rl/robtic/site/discord-dashboard.webp',
        imageAlt: 'The Robtic Discord dashboard: a ticket panel being designed, with its channels and options beside it',
        terms: '/terms/discord',
        privacy: '/privacy/discord',
    },
};

export const SERVICE_ORDER: ServiceKey[] = ['hosting', 'discord'];

/** Robtic Discord's bots (the same names and words as the dashboard, robtic-discord libs/shared/src/bots.ts). */
export const DISCORD_BOTS = [
    {
        key: 'system', name: 'Robtic System', accent: '#1793ff', tagline: 'Levels, points, streaks, moderation and logs',
        text: 'An all-in-one community bot: XP and levels for chat and voice, activity points, daily streaks, leaderboards, moderation with evidence and log channels.',
    },
    {
        key: 'staff', name: 'Robtic Staff', accent: '#8b5cf6', tagline: 'Staff ranks, warnings, reports and points',
        text: 'Run a staff team: a numbered rank ladder, staff points and promotions, warnings, reports in private threads, appeals, vacations and applications.',
    },
    {
        key: 'ticket', name: 'Robtic Ticket', accent: '#10b981', tagline: 'Ticket panels, private channels and transcripts',
        text: 'Ticket panels you design yourself. Each ticket opens a private channel with its own form, staff controls and a full transcript when it closes.',
    },
    {
        key: 'music', name: 'Robtic Voice', accent: '#f43f5e', tagline: 'Music bots for your voice channels',
        text: 'Up to ten music bots per server: each stays in its own voice channel or follows the music, with a control panel and text commands.',
    },
] as const;

/** Getting a Robtic Discord bot running, as /discord shows it (and marks it up as a HowTo). */
export const DISCORD_STEPS = [
    { title: 'Sign in', text: 'Use your Robtic account and link Discord.' },
    { title: 'Turn it on', text: 'Accept the Robtic Discord Terms once.' },
    { title: 'Pick a server', text: 'Every server you administer is listed.' },
    { title: 'Add a bot', text: 'Add the bots you want and set each one up.' },
] as const;
