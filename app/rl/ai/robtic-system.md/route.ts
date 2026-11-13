import { NOINDEX } from '@/lib/llms';
import { systemBotGuide } from '@/lib/discord-bots';

// Markdown for AI tools about Robtic System: only /llms.txt links here (see lib/discord-bots.ts).
export function GET() {
    return new Response(systemBotGuide(), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...NOINDEX },
    });
}
