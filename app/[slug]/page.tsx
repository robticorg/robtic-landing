import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { BUILTIN_LEGAL, getLegalPage, getSiteData, legalPages } from '@/lib/site-data';

// The legal pages (terms, privacy, and any others added in the admin console) at the address the console gives
// each. Their Markdown comes from the panel; legal-md/ holds a snapshot of the built-in pages for when it's down.
// Any other single-segment path is unknown and falls through to the redirect page.

export function generateStaticParams() {
    return BUILTIN_LEGAL.map((p) => ({ slug: p.path }));
}

export const dynamicParams = true;
export const revalidate = 300;

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
    const page = await getLegalPage(slug);
    if (!page) return {};
    return { title: `${page.title} · Robtic`, alternates: { canonical: `/${page.path}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await getLegalPage(slug);
    if (!page) notFound();

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
                            <a key={p.key} href={`/${p.path}`} className={p.path === page.path ? 'on' : ''}>{p.title}</a>
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
