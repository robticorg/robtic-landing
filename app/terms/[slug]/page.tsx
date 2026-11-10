import type { Metadata } from 'next';
import { BUILTIN_LEGAL } from '@/lib/site-data';
import LegalView, { legalMetadata } from '../../LegalView';

// Every terms page lives here: /terms/<name> (e.g. /terms/hosting, /terms/teams). Add another by giving the panel
// a legal page whose key is `terms-<name>`; the built-ins below are the fallback snapshot.
const GROUP = 'terms';

export function generateStaticParams() {
    return BUILTIN_LEGAL
        .filter((p) => p.key.startsWith(`${GROUP}-`))
        .map((p) => ({ slug: p.key.slice(GROUP.length + 1) }));
}

export const dynamicParams = true;
export const revalidate = 300;

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    return params.then(({ slug }) => legalMetadata(GROUP, slug));
}

export default async function TermsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <LegalView group={GROUP} slug={slug} />;
}
