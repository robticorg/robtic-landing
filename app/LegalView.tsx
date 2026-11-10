import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getLegalPage, getSiteData, legalPages } from '@/lib/site-data';

// Shared rendering for every legal page. The terms live at /terms/<name> and the privacy pages at
// /privacy/<name>; each group's route (app/terms/[slug], app/privacy/[slug]) derives the storage key
// `<group>-<name>` from the address and hands it here. The Markdown comes from the panel, with a snapshot in
// legal-md/ as the fallback.

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

// The address of a legal page from its group and name, e.g. ('terms', 'hosting') -> 'terms/hosting'.
export const legalPath = (group: string, slug: string) => `${group}/${slug}`;

export async function legalMetadata(group: string, slug: string): Promise<Metadata> {
    const page = await getLegalPage(`${group}-${slug}`);
    if (!page) return {};
    return { title: `${page.title} · Robtic`, alternates: { canonical: `/${legalPath(group, slug)}` } };
}

export default async function LegalView({ group, slug }: { group: string; slug: string }) {
    const page = await getLegalPage(`${group}-${slug}`);
    if (!page) notFound();

    // The canonical address is the one being served, whatever path the panel stored.
    const here = legalPath(group, slug);
    // The tabs: every legal page, in the order the admin console set them.
    const pages = legalPages(await getSiteData());
    const { html, toc } = renderLegal(page.markdown);

    return (
        <>
            <div className="page-head">
                <div className="wrap">
                    <h1>{page.title}</h1>
                    <p>Last updated {page.updated}</p>
                    <nav className="legal-tabs" aria-label="Legal pages">
                        {pages.map((p) => (
                            <a key={p.key} href={`/${p.path}`} className={p.path === here ? 'on' : ''}>{p.title}</a>
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
