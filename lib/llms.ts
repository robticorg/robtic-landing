// What AI tools read about Robtic: /llms.txt (the index, see llmstxt.org) and the fuller guide it links to. Both are
// built from the panel's data, so a price or legal page changed in the admin console shows up without a redeploy.

import { BUILTIN_FEATURES } from './features';
import { PLANS, PLAN_FEATURE_LABELS, TRIAL_DAYS, featureDetail, limitRows, type Plan } from './plans';
import { ORIGIN } from './site';
import { legalPages, priceMap, resolveContact, resolveSocials, type SiteData } from './site-data';

// Only llms.txt links here: no page, menu or sitemap does.
export const AI_GUIDE_PATH = '/rl/ai/robtic.md';

// Readable by anything that asks, but kept out of search results.
export const NOINDEX = { 'X-Robots-Tag': 'noindex' };

const SUMMARY =
    'Robtic hosts Discord bots and small apps. Upload your code or deploy it from GitHub, then run it from the ' +
    `browser with a live console, a code editor, databases, backups and teams. The Personal plan is free for the first ${TRIAL_DAYS} days.`;

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
        `- [Home](${ORIGIN}/): what Robtic does and its features`,
        `- [Plans and pricing](${ORIGIN}/plans): every plan with its limits and price`,
        `- [Create an account](${ORIGIN}/auth/register): sign up and start on the Personal plan, free for ${TRIAL_DAYS} days`,
        `- [Sign in](${ORIGIN}/auth/login): open the panel`,
        `- [Everything about Robtic](${ORIGIN}${AI_GUIDE_PATH}): features, plans, limits and contacts in one Markdown file`,
        '',
        '## Plans',
        '',
        ...PLANS.map((p) => `- [${p.name}](${ORIGIN}/plans#plan-${p.key}): ${planPrice(p, prices)}`),
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
        'A hosting service for Discord bots (discord.js, discord.py, TypeScript), websites and APIs. Everything runs ' +
            'from the browser, so there is no server to set up. Add an app by uploading files, starting from a ready ' +
            'Discord bot, or cloning a GitHub repository.',
        '',
        '## Features',
        '',
        ...features(site).map((f) => `- **${f.title}:** ${f.text}`),
        '',
        '## Plans',
        '',
        `All plans are listed at ${ORIGIN}/plans. Individual plans: ${PLANS.filter((p) => p.group === 'individual').map((p) => p.name).join(', ')}. ` +
            `Business plans: ${PLANS.filter((p) => p.group === 'business').map((p) => p.name).join(', ')}.`,
        '',
        ...PLANS.flatMap((p) => planDetails(p, prices)),
        '## Getting started',
        '',
        `1. Create an account at ${ORIGIN}/auth/register.`,
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
