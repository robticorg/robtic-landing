// What AI tools read about Robtic: /llms.txt (the index, see llmstxt.org) and the fuller guide it links to. Both are
// built from the panel's data, so a price or legal page changed in the admin console shows up without a redeploy.

import { BOT_GUIDES } from './discord-bots';
import { BUILTIN_FEATURES } from './features';
import { PLANS, PLAN_FEATURE_LABELS, TRIAL_DAYS, featureDetail, limitRows, type Plan } from './plans';
import { ORIGIN } from './site';
import { landingFaq, legalPages, priceMap, resolveContact, resolveSocials, type SiteData } from './site-data';

// Only llms.txt links here: no page, menu or sitemap does.
export const AI_GUIDE_PATH = '/rl/ai/robtic.md';

// Readable by anything that asks, but kept out of search results.
export const NOINDEX = { 'X-Robots-Tag': 'noindex' };

const SUMMARY =
    'Robtic makes tools for people who build and run Discord communities, under one account: Robtic Hosting runs your own ' +
    'Discord bots (discord.js, discord.py, TypeScript), websites and APIs from the browser, with a live console, a code ' +
    'editor, databases, backups and teams; Robtic Discord adds ready-made bots to your server and sets them up from a web ' +
    `dashboard, in English or Arabic. The Personal hosting plan is free for the first ${TRIAL_DAYS} days.`;

function features(site: SiteData | null): Array<{ title: string; text: string }> {
    const fromPanel = site?.landing?.features;
    return fromPanel?.length ? fromPanel : BUILTIN_FEATURES.map(([, title, text]) => ({ title, text }));
}

function planPrice(plan: Plan, prices: Record<string, string>): string {
    if (plan.key === 'org') return 'priced for you, ask for an offer';
    return prices[plan.key] || 'see the plans page';
}

function legalLinks(site: SiteData | null): string[] {
    return legalPages(site).map((p) => `- [${p.title}](${ORIGIN}/${p.path})`);
}

export function llmsIndex(site: SiteData | null): string {
    const prices = priceMap(site);
    return [
        '# Robtic',
        '',
        `> ${SUMMARY}`,
        '',
        `Contact: ${resolveContact(site)}`,
        '',
        '## Site',
        '',
        `- [Home](${ORIGIN}/): what Robtic is: Robtic Hosting and Robtic Discord`,
        `- [Robtic Hosting for AI tools](${ORIGIN}/hosting/llms.txt): hosting features, plans and getting started`,
        `- [Robtic Hosting](${ORIGIN}/hosting): host Discord bots, websites and APIs from the browser`,
        `- [Robtic Discord](${ORIGIN}/discord): ready-made Discord bots with a web dashboard`,
        `- [Plans and pricing](${ORIGIN}/hosting/plans): every hosting plan with its limits and price`,
        `- [FAQ](${ORIGIN}/faq): common questions about hosting, bots, plans and getting started`,
        `- [Documentation](https://docs.robtic.org): guides for Robtic Hosting and the Robtic Discord bots`,
        `- [Everything about Robtic](${ORIGIN}${AI_GUIDE_PATH}): features, plans, limits and contacts in one Markdown file`,
        '',
        '## Platforms',
        '',
        `- [Hosting panel](${ORIGIN}/hosting/dashboard): where your apps run (sign-in required)`,
        `- [Discord bots dashboard](${ORIGIN}/discord/public): server administrators add and configure Robtic’s public Discord bots (rolling out to allowlisted servers)`,
        '',
        '## Discord bots',
        '',
        `- [Robtic System](${ORIGIN}${BOT_GUIDES.system.path}): community bot with XP and levels, activity points, daily streaks, leaderboards, moderation with evidence, shortcuts and log channels`,
        `- [Robtic Staff](${ORIGIN}${BOT_GUIDES.staff.path}): staff management bot with a rank ladder, staff points and promotions, warnings, reports, appeals, vacations and staff applications`,
        `- [Every public bot and how to add it](${ORIGIN}/discord/llms.txt): Robtic System, Staff, Music and Ticket, from the Discord platform itself`,
        '',
        '## Plans',
        '',
        ...PLANS.map((p) => `- [${p.name}](${ORIGIN}/hosting/plans#plan-${p.key}): ${planPrice(p, prices)}`),
        '',
        '## Optional',
        '',
        ...legalLinks(site),
        '',
    ].join('\n');
}

function planDetails(plan: Plan, prices: Record<string, string>): string[] {
    const included = PLAN_FEATURE_LABELS.flatMap(([key, name]) => {
        const detail = featureDetail(plan, key);
        if (detail === null) return [];
        return [detail ? `${name} (${detail})` : name];
    });
    return [
        `### ${plan.name}`,
        '',
        `- Price: ${planPrice(plan, prices)}`,
        ...(plan.trialDays ? [`- Free for the first ${plan.trialDays} days`] : []),
        ...limitRows(plan).map(([label, value]) => `- ${label}: ${value}`),
        `- Includes: ${included.join(', ')}`,
        '',
    ];
}

export function aiGuide(site: SiteData | null): string {
    const prices = priceMap(site);
    const socials = resolveSocials(site);
    return [
        '# Robtic',
        '',
        `> ${SUMMARY}`,
        '',
        '## What Robtic is',
        '',
        'A platform for Discord builders, run entirely from the browser. It brings several things together under one ' +
            'account:',
        '',
        '- **Hosting** — Discord bots (discord.js, discord.py, TypeScript), websites and APIs. Add an app by ' +
            'uploading files, starting from a ready Discord bot, or cloning a GitHub repository; there is no server to set up.',
        '- **Discord bots** — ready-made public bots to add to your own server, set up from a web dashboard in English or Arabic.',
        '',
        '## Features',
        '',
        ...features(site).map((f) => `- **${f.title}:** ${f.text}`),
        '',
        '## Plans',
        '',
        `All plans are listed at ${ORIGIN}/hosting/plans. Individual plans: ${PLANS.filter((p) => p.group === 'individual').map((p) => p.name).join(', ')}. ` +
            `Business plans: ${PLANS.filter((p) => p.group === 'business').map((p) => p.name).join(', ')}.`,
        '',
        ...PLANS.flatMap((p) => planDetails(p, prices)),
        '## Frequently asked questions',
        '',
        `Full list at ${ORIGIN}/faq.`,
        '',
        ...landingFaq(site).flatMap((f) => [`### ${f.q}`, '', f.a, '']),
        '## Getting started',
        '',
        `1. Create an account from ${ORIGIN}/hosting (Get started).`,
        '2. Choose a plan and add an app: upload files, start from a ready Discord bot, or clone from GitHub.',
        '3. Run it from the browser and watch its console.',
        '',
        '## Contact',
        '',
        `- Email: ${resolveContact(site)}`,
        ...socials.map(([name, url]) => `- ${name}: ${url}`),
        '',
        '## Terms and privacy',
        '',
        ...legalLinks(site),
        '',
    ].join('\n');
}

/** /hosting/llms.txt: Robtic Hosting on its own, for AI tools asked about hosting a Discord bot. */
export function hostingLlms(site: SiteData | null): string {
    const prices = priceMap(site);
    return [
        '# Robtic Hosting',
        '',
        '> Robtic Hosting runs Discord bots (discord.js, discord.py, TypeScript), websites and APIs from the browser, with no ' +
            `server to set up. Part of Robtic (${ORIGIN}). The Personal plan is free for the first ${TRIAL_DAYS} days.`,
        '',
        `- Landing page: ${ORIGIN}/hosting`,
        `- Plans and pricing: ${ORIGIN}/hosting/plans`,
        `- Panel (sign-in required): ${ORIGIN}/hosting/dashboard`,
        '- Documentation: https://docs.robtic.org',
        `- Terms: ${ORIGIN}/terms/hosting · Privacy: ${ORIGIN}/privacy/hosting`,
        `- Contact: ${resolveContact(site)}`,
        '',
        '## Features',
        '',
        ...features(site).map((f) => `- **${f.title}:** ${f.text}`),
        '',
        '## Plans',
        '',
        ...PLANS.map((p) => `- [${p.name}](${ORIGIN}/hosting/plans#plan-${p.key}): ${planPrice(p, prices)}`),
        '',
        '## Getting started',
        '',
        `1. Open ${ORIGIN}/hosting and choose Get started; sign in or create a Robtic account.`,
        '2. Add an app: upload files, start from a ready Discord bot, or clone a GitHub repository.',
        '3. Start it from the browser and watch its live console.',
        '',
    ].join('\n');
}
