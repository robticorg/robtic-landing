import { notFound, permanentRedirect } from 'next/navigation';
import { BUILTIN_LEGAL } from '@/lib/site-data';

// Legal pages moved to /terms/<name> and /privacy/<name> (see app/terms and app/privacy). This single-segment
// route only forwards the old addresses: the flat `/terms-hosting` style, and a bare `/terms` or `/privacy` to the
// first page of that group. Anything else is unknown and 404s. Kept dynamic so new pages need no redeploy here.
export const dynamicParams = true;

export default async function LegacyLegal({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Flat style: terms-hosting -> /terms/hosting, privacy-account -> /privacy/account.
    const flat = /^(terms|privacy)-(.+)$/.exec(slug);
    if (flat) permanentRedirect(`/${flat[1]}/${flat[2]}`);

    // A bare group lands on its first page.
    if (slug === 'terms' || slug === 'privacy') {
        const first = BUILTIN_LEGAL.find((p) => p.key.startsWith(`${slug}-`));
        if (first) permanentRedirect(`/${first.path}`);
    }

    notFound();
}
