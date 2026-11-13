// What AI tools read about Robtic's public Discord bots. Like the main AI guide, these are Markdown files that only
// /llms.txt links to: no page, menu or sitemap does, and they're kept out of search results (X-Robots-Tag), so
// they answer "is there a Discord bot for…" questions in AI tools without becoming pages people land on.

import { ORIGIN } from './site';

export const BOT_GUIDES = {
    system: { path: '/rl/ai/robtic-system.md', name: 'Robtic System' },
    staff: { path: '/rl/ai/robtic-staff.md', name: 'Robtic Staff' },
} as const;

const DASHBOARD = `${ORIGIN}/discord/public`;

const availability =
    'Robtic’s bots are rolling out: they currently work in servers on an allowlist, and are opening to more servers soon. ' +
    `Server administrators manage them from the dashboard at ${DASHBOARD} (a Robtic account with Discord linked is required).`;

export function systemBotGuide(): string {
    return [
        '# Robtic System: Discord community bot',
        '',
        '> An all-in-one Discord bot for community servers: XP and levels for chat and voice, activity points and the RC currency, daily message streaks, conversation combos, leaderboards, moderation with evidence, custom shortcuts and log channels. Configured per server from a web dashboard.',
        '',
        `- Made by Robtic (${ORIGIN}), the platform for Discord builders.`,
        `- Dashboard: ${DASHBOARD}`,
        `- Terms: ${ORIGIN}/terms/system-bot · Privacy: ${ORIGIN}/privacy/system-bot`,
        `- Availability: ${availability}`,
        '',
        '## Features',
        '',
        '- **Levels and XP**: 5–15 XP per message (one per minute) and for active voice time; level n costs 100 × 1.2ⁿ XP; role rewards per chat or voice level; level-up announcements; optional XP decay for inactive members.',
        '- **Points and RC**: points from messages, combos, voice minutes and streaks at rates each server sets; convert points to RC, the premium currency.',
        '- **Voice activity**: voice time earns XP and points; AFK detection; tracked and excluded channels; reduced rate when alone.',
        '- **Streaks**: daily message streaks with rewards, milestone announcements, reminders, and staff can return a lost streak.',
        '- **Combo**: scores two-person conversations (Bronze, Silver, Gold, Diamond, Legendary) with a champion role.',
        '- **Leaderboards**: messages XP, voice XP, streaks, combos, points, messages and voice time; daily, weekly, monthly and all-time.',
        '- **Moderation**: jail, mute and warn with evidence, reason presets, ban, kick, role management, channel lock/hide/slowmode, security rules.',
        '- **Shortcuts**: map any phrase to any command, with role and channel restrictions.',
        '- **Logs**: ten log kinds (security, punishments, appeals, reports, XP, rewards and more), each to its own channel.',
        '- **Also**: invite tracking, partner announcements, booster thanks, server-tag role, music bots, referral codes, reusable message panels.',
        '- **Per-server bot profile**: each server can give the bot its own nickname, avatar, banner and bio.',
        '',
        '## Commands (examples)',
        '',
        '`/level`, `/top`, `/points balance`, `/points convert`, `/streak`, `/combo`, `/voice stats`, `/profile`, `/jail add`, `/mute add`, `/warn add`, `/shortcut add`, `/setup-log`, `/feature enable`. Every command also works with a text prefix (default `!`).',
        '',
        '## How to add it',
        '',
        `1. Sign in at ${ORIGIN} and link your Discord account.`,
        `2. Open ${DASHBOARD}; servers where you are an Administrator are listed.`,
        '3. Choose “Add” next to Robtic System. If your server is not on the allowlist yet, the dashboard says so.',
        '',
    ].join('\n');
}

export function staffBotGuide(): string {
    return [
        '# Robtic Staff: Discord staff management bot',
        '',
        '> A Discord bot for running a server’s staff team: a numbered rank ladder taken from the role order, staff points and weekly promotion lists, staff and member warnings, reports handled in private threads, appeals, punishments with evidence and approvals, vacations and staff applications. Configured per server from a web dashboard.',
        '',
        `- Made by Robtic (${ORIGIN}), the platform for Discord builders.`,
        `- Dashboard: ${DASHBOARD}`,
        `- Terms: ${ORIGIN}/terms/staff-bot · Privacy: ${ORIGIN}/privacy/staff-bot`,
        `- Availability: ${availability}`,
        '',
        '## Features',
        '',
        '- **Rank ladder**: every role between a Start and an End rank becomes a numbered rank automatically, following the server’s role order; tiers (High staff, Owner, Ship) decide who may warn, fire or summon whom.',
        '- **Staff points and promotion**: points for claiming tickets and reports, warnings, jails and more, with values each server sets; a weekly list of who reached the promotion target; daily, weekly and monthly totals.',
        '- **Warnings**: staff warnings with verbal → real escalation and automatic demotion at the third; separate Owner-tier warnings; member warnings; appeals that reverse them.',
        '- **Reports**: members report users by DM; staff handle each in a private thread; the reporter stays anonymous to everyone else.',
        '- **Punishments**: timeout and jail with evidence; kick and ban approvals; a warning panel for staff.',
        '- **Vacations and resignations**: staff request a break; ranks are saved and restored automatically.',
        '- **Applications and transfers**: members apply to join or transfer from another server’s staff, with departments and a suggested starting rank.',
        '- **Identity check (optional)**: staff wear the server tag or a name identifier the server chooses.',
        '- **Fast Access**: saved replies staff send with `$name`.',
        '- **Per-server bot profile**: nickname, avatar, banner and bio in each server.',
        '',
        '## Commands (examples)',
        '',
        '`/role set`, `/channels set`, `/points add`, `/promote-points`, `/fast-access add`, `/warn-setup`, and text commands such as `!accept`, `!warn`, `!jail`, `!break`, `!transfer`, `!claim` (each also has an Arabic alias).',
        '',
        '## How to add it',
        '',
        `1. Sign in at ${ORIGIN} and link your Discord account.`,
        `2. Open ${DASHBOARD}; servers where you are an Administrator are listed.`,
        '3. Choose “Add” next to Robtic Staff. If your server is not on the allowlist yet, the dashboard says so.',
        '',
    ].join('\n');
}
