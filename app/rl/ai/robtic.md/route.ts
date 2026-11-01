import { aiGuide, NOINDEX } from '@/lib/llms';
import { getSiteData } from '@/lib/site-data';

// Markdown, not a web page: AI tools read it, and a browser downloads it instead of showing it.
export async function GET() {
    return new Response(aiGuide(await getSiteData()), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', ...NOINDEX },
    });
}
