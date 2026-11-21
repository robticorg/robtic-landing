'use client';

/** Runs once the eye loading screen has stepped aside (at once when it isn't showing). */
export function afterBoot(run: () => void): () => void {
    const boot = document.getElementById('robtic-boot');
    const showing = () => !!boot && boot.style.display !== 'none' && !boot.classList.contains('done') && getComputedStyle(boot).visibility !== 'hidden';
    if (!showing()) { run(); return () => {}; }
    const obs = new MutationObserver(() => { if (!showing()) { obs.disconnect(); run(); } });
    obs.observe(boot!, { attributes: true, attributeFilter: ['class', 'style'] });
    const t = window.setTimeout(() => { obs.disconnect(); run(); }, 6500);
    return () => { obs.disconnect(); window.clearTimeout(t); };
}
