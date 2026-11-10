'use client';

// The FAQ: questions on the left (an accordion — click one to read its answer), the 3D question mark on the right.
// Used in two places: the home page shows the first few with a link to the full list, and /faq shows them all.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/lib/site-data';

export default function Faq({
    items,
    limit,
    moreHref,
    showImage = true,
}: {
    items: FaqItem[];
    limit?: number;
    moreHref?: string;
    showImage?: boolean;
}) {
    const shown = typeof limit === 'number' ? items.slice(0, limit) : items;
    // Open the first one so the section reads as interactive at a glance.
    const [open, setOpen] = useState<number>(0);

    return (
        <div className={showImage ? 'faq-grid' : 'faq-grid faq-grid-solo'}>
            <div className="faq-list">
                {shown.map((item, i) => {
                    const isOpen = open === i;
                    return (
                        <div className={isOpen ? 'faq-item is-open' : 'faq-item'} key={`${i}-${item.q}`}>
                            <button
                                type="button"
                                className="faq-q"
                                aria-expanded={isOpen}
                                onClick={() => setOpen(isOpen ? -1 : i)}
                            >
                                <span>{item.q}</span>
                                <ChevronDown className="faq-chev" size={20} aria-hidden="true" />
                            </button>
                            <div className="faq-a" role="region">
                                <div className="faq-a-in">
                                    <p>{item.a}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {moreHref && typeof limit === 'number' && items.length > limit ? (
                    <a className="faq-more" href={moreHref}>
                        See all questions
                        <ChevronDown size={16} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }} />
                    </a>
                ) : null}
            </div>

            {showImage ? (
                <div className="faq-art" aria-hidden="true">
                    <img className="faq-q-img" src="/rl/robtic/site/question.png" alt="" width={520} height={620} />
                </div>
            ) : null}
        </div>
    );
}
