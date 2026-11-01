import { llmsIndex, NOINDEX } from '@/lib/llms';
import { getSiteData } from '@/lib/site-data';

export async function GET() {
    return new Response(llmsIndex(await getSiteData()), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...NOINDEX },
    });
}
