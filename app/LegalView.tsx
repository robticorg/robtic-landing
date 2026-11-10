import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { ORIGIN } from '@/lib/site';
import {
    LEGAL_GROUPS, LEGAL_GROUP_TITLE, getLegalPage, getSiteData, legalGroupOf, legalHref, legalPages, type LegalGroup,
} from '@/lib/site-data';

// Shared rendering for every legal page. Terms live at /terms/<name> and privacy pages at /privacy/<name>; each
// group's route (app/terms/[slug], app/privacy/[slug]) hands its address here. The Markdown is written in the admin
// console, with a snapshot in legal-md/ as the fallback.

function slugify(s: string): string {
    return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

const SITE_HOST = ORIGIN.replace(/^https?:\/\//, '').replace(/\/$/, '');

// A link written in the admin console, made to work on the site: `[x](/terms/new)` stays, `terms/new` (no slash)
// and a full https://robtic.org/terms/new become /terms/new, the old flat `/terms-new` becomes /terms/new, and a
// link to another site opens in a new tab.
function fixLink(href: string): { href: string; external: boolean } {
    let h = href.trim();
    const own = new RegExp(`^(?:https?:)?//(?:www\\.)?${SITE_HOST.replace(/\./g, '\\.')}(?=/|$|[?#])`, 'i');
    h = h.replace(own, '') || '/';
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(h)) return { href: h, external: /^(?:https?:)?\/\//i.test(h) };
    if (h.startsWith('#')) return { href: h, external: false };
    if (!h.startsWith('/')) h = `/${h}`;
    h = h.replace(/^\/(terms|privacy)-([a-z0-9][a-z0-9-]*)(?=$|[/?#])/, '/$1/$2');
    return { href: h, external: false };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Render the Markdown, fix its links, give every section heading an id, and collect those headings for the table
// of contents.
function renderLegal(md: string): { html: string; toc: Array<{ id: string; text: string }> } {
    const raw = marked.parse(md, { async: false }) as string;
    const linked = raw.replace(/<a href="([^"]*)"/g, (_m, href: string) => {
        const decoded = href.replace(/&amp;/g, '&');
        const { href: fixed, external } = fixLink(decoded);
        return `<a href="${esc(fixed)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}`;
    });
    const toc: Array<{ id: string; text: string }> = [];
    const seen = new Set<string>();
    const html = linked.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner) => {
        const text = inner.replace(/<[^>]+>/g, '').trim();
        let id = slugify(text) || `section-${toc.length + 1}`;
        while (seen.has(id)) id = `${id}-${toc.length + 1}`;
        seen.add(id);
        toc.push({ id, text });
        return `<h2 id="${id}">${inner}</h2>`;
    });
    return { html, toc };
}

export async function legalMetadata(group: LegalGroup, slug: string): Promise<Metadata> {
    const path = `${group}/${slug}`;
    const page = await getLegalPage(path);
    if (!page) return {};
    return { title: `${page.title} · Robtic`, alternates: { canonical: `/${path}` } };
}

export default async function LegalView({ group, slug }: { group: LegalGroup; slug: string }) {
    const here = `${group}/${slug}`;
    const page = await getLegalPage(here);
    if (!page) notFound();

    // Every legal page, in the admin console's order, at its /terms/* or /privacy/* address.
    const pages = legalPages(await getSiteData());
    const inGroup = pages.filter((p) => legalGroupOf(p.path) === group);
    const groups = LEGAL_GROUPS.map((g) => ({ g, first: pages.find((p) => legalGroupOf(p.path) === g) })).filter((x) => x.first);
    // The pages to read alongside this one, as picked in the admin console.
    const me = pages.find((p) => p.path === here) ?? { ...page, path: legalHref(page), related: [] };
    const related = (me.related ?? [])
        .map((k) => pages.find((p) => p.key === k))
        .filter((p): p is NonNullable<typeof p> => !!p && p.path !== here);
    const { html, toc } = renderLegal(page.markdown);

    return (
        <>
            <div className="page-head">
                <div className="wrap">
                    <h1>{page.title}</h1>
                    <p>Last updated {page.updated}</p>
                    <div className="legal-nav">
                        {groups.length > 1 ? (
                            <nav className="legal-groups" aria-label="Terms or privacy">
                                {groups.map(({ g, first }) => (
                                    <a key={g} href={`/${first!.path}`} className={g === group ? 'on' : ''} aria-current={g === group ? 'true' : undefined}>
                                        {LEGAL_GROUP_TITLE[g]}
                                    </a>
                                ))}
                            </nav>
                        ) : null}
                        {inGroup.length > 1 ? (
                            <nav className="legal-tabs" aria-label={`${LEGAL_GROUP_TITLE[group]} pages`}>
                                {inGroup.map((p) => (
                                    <a key={p.key} href={`/${p.path}`} className={p.path === here ? 'on' : ''} aria-current={p.path === here ? 'page' : undefined}>
                                        {p.title}
                                    </a>
                                ))}
                            </nav>
                        ) : null}
                    </div>
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
                {related.length > 0 ? (
                    <aside className="legal-rel" aria-label="Read also">
                        <h2>Read also</h2>
                        <nav>
                            {related.map((p) => (
                                <a key={p.key} href={`/${p.path}`}>
                                    <small>{LEGAL_GROUP_TITLE[legalGroupOf(p.path)]}</small>
                                    <span>{p.title}</span>
                                </a>
                            ))}
                        </nav>
                    </aside>
                ) : null}
            </div>
        </>
    );
}
