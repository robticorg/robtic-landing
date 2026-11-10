import type { Metadata } from 'next';
import { BUILTIN_LEGAL } from '@/lib/site-data';
import LegalView, { legalMetadata } from '../../LegalView';

// Every terms page lives here: /terms/<name> (e.g. /terms/hosting, /terms/teams). Add one in the admin console (Terms & privacy ->
// Add page, type Terms); it shows up here without a redeploy. The built-ins below are prerendered.
const GROUP = 'terms' as const;

export function generateStaticParams() {
    return BUILTIN_LEGAL
        .filter((p) => p.path.startsWith(`${GROUP}/`))
        .map((p) => ({ slug: p.path.slice(GROUP.length + 1) }));
}

export const dynamicParams = true;
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return legalMetadata(GROUP, slug);
}

export default async function TermsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <LegalView group={GROUP} slug={slug} />;
}
