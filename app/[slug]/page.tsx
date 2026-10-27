import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getSiteData } from '@/lib/site-data';

// The legal pages (hosting terms, team's terms, account privacy, hosting privacy) live as Markdown in
// legal-md/, a snapshot of the panel's resources/robtic/legal. Any other single-segment path is unknown and
// falls through to the redirect page.
const LEGAL: Record<string, string> = {
    'terms-hosting': 'Hosting Terms',
    'terms-teams': "Team's Terms",
    'privacy-account': 'Account Privacy',
    'privacy-hosting': 'Hosting Privacy',
};
const UPDATED = 'October 25, 2026';

export function generateStaticParams() {
    return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export const dynamicParams = true;

function read(slug: string): string | null {
    if (!LEGAL[slug]) return null;
    try {
        return fs.readFileSync(path.join(process.cwd(), 'legal-md', `${slug}.md`), 'utf8');
    } catch {
        return null;
    }
}

function slugify(s: string): string {
    return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

// Render the Markdown, give every section heading an id, and collect those headings for the table of contents
// on the right of the page.
function renderLegal(md: string): { html: string; toc: Array<{ id: string; text: string }> } {
    const raw = marked.parse(md, { async: false }) as string;
    const toc: Array<{ id: string; text: string }> = [];
    const seen = new Set<string>();
    const html = raw.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner) => {
        const text = inner.replace(/<[^>]+>/g, '').trim();
        let id = slugify(text) || `section-${toc.length + 1}`;
        while (seen.has(id)) id = `${id}-${toc.length + 1}`;
        seen.add(id);
        toc.push({ id, text });
        return `<h2 id="${id}">${inner}</h2>`;
    });
    return { html, toc };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    if (!LEGAL[slug]) return {};
    return { title: `${LEGAL[slug]} · Robtic`, alternates: { canonical: `/${slug}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const md = read(slug);
    if (!md) notFound();

    // The "last updated" date is owned by the panel (bumped when the admin edits a legal page); fall back to the
    // build-time date only if the panel API is unreachable.
    const site = await getSiteData();
    const updated = site?.legal_updated?.[slug]?.trim() || UPDATED;
    const { html, toc } = renderLegal(md);

    return (
        <>
            <div className="page-head">
                <div className="wrap">
                    <h1>{LEGAL[slug]}</h1>
                    <p>Last updated {updated}</p>
                    <nav className="legal-tabs" aria-label="Legal pages">
                        {Object.entries(LEGAL).map(([s, label]) => (
                            <a key={s} href={`/${s}`} className={s === slug ? 'on' : ''}>{label}</a>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="legal-wrap">
                <article className="legal" dangerouslySetInnerHTML={{ __html: html }} />
                {toc.length > 0 ? (
                    <aside className="legal-toc" aria-label="On this page">
                        <h2>On this page</h2>
                        <nav>
                            {toc.map((h) => (
                                <a key={h.id} href={`#${h.id}`}>{h.text}</a>
                            ))}
                        </nav>
                    </aside>
                ) : null}
            </div>
        </>
    );
}
