import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// A file under public/ with a short hash of its contents in the query, so every change gets a new URL. The CSS and
// scripts keep fixed names and are cached for hours (browser and Cloudflare), so without this a deploy would keep
// serving the old ones.
const seen = new Map<string, string>();

export function asset(url: string): string {
    let versioned = seen.get(url);
    if (!versioned) {
        try {
            const data = fs.readFileSync(path.join(process.cwd(), 'public', url));
            versioned = `${url}?v=${createHash('sha1').update(data).digest('hex').slice(0, 10)}`;
        } catch {
            versioned = url;
        }
        seen.set(url, versioned);
    }
    return versioned;
}
