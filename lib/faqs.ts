import type { FaqItem } from './site-data';

// The questions on the home page (about Robtic and the account) and on the Discord page. Hosting's questions are the
// admin console's FAQ (lib/site-data.ts, BUILTIN_FAQ when unset), shown on /hosting.

export const ROBTIC_FAQ: FaqItem[] = [
    {
        q: 'What is Robtic?',
        a: 'Robtic makes software for people who build and run Discord communities. Today that is two services: Robtic Hosting, to run your own bots, websites and APIs, and Robtic Discord, ready-made bots you set up from a web dashboard.',
    },
    {
        q: 'Do I need a separate account for each service?',
        a: 'No. One Robtic account signs you in everywhere. Each service is started on its own, the first time you open it, with its own terms, so you only use what you choose.',
    },
    {
        q: 'Is it free?',
        a: 'Creating an account is free. Robtic Hosting is free for the first month after you start it; after that you pick a plan.',
    },
    {
        q: 'Which languages does Robtic speak?',
        a: 'The websites are in English. The Discord bots speak English and Arabic, chosen per server.',
    },
    {
        q: 'How do I sign in?',
        a: 'With your email and password, a passkey, or GitHub or Discord. Two-factor authentication and recovery codes are in your account settings.',
    },
    {
        q: 'How do I reach you?',
        a: 'Join our Discord server or email us; the addresses are at the bottom of every page.',
    },
];

export const DISCORD_FAQ: FaqItem[] = [
    {
        q: 'What do I need to add a Robtic bot?',
        a: 'A Robtic account with your Discord account linked, and the Administrator permission in the server you want to add it to.',
    },
    {
        q: 'Where do I set the bots up?',
        a: 'On the dashboard at robtic.org/discord/public: pick a server, add a bot, and every feature has its own page there. Changes apply straight away.',
    },
    {
        q: 'Can I use the bots in Arabic?',
        a: 'Yes. Each server chooses English or Arabic, and the bots answer in it.',
    },
    {
        q: 'Can every server add them?',
        a: 'They are rolling out to servers on an allowlist. If yours isn’t on it yet, the dashboard says so, and we are opening them to more servers soon.',
    },
    {
        q: 'Can the bot have my server’s own name and picture?',
        a: 'Yes. Each server can give each bot its own nickname, avatar, banner and bio from the dashboard.',
    },
];
