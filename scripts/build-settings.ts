// Builds the Settings popup (settings-app/) into one script every Robtic place loads:
// public/rl/robtic/settings/settings.js. React is bundled in, the styles are inlined, nothing else is needed.
// Run after changing anything in settings-app/:  bun scripts/build-settings.ts
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const result = await Bun.build({
    entrypoints: [join(root, 'settings-app/entry.tsx')],
    outdir: join(root, 'public/rl/robtic/settings'),
    naming: 'settings.js',
    target: 'browser',
    format: 'iife',
    minify: true,
    sourcemap: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
    tsconfig: join(root, 'tsconfig.json'),
});
if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}
for (const out of result.outputs) console.log(`${out.path.replace(root, '.')}  ${(out.size / 1024).toFixed(0)} KB`);
