import { NOINDEX } from '@/lib/llms';
import { staffBotGuide } from '@/lib/discord-bots';

// Markdown for AI tools about Robtic Staff: only /llms.txt links here (see lib/discord-bots.ts).
export function GET() {
    return new Response(staffBotGuide(), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...NOINDEX },
    });
}
