import { useEffect, useId, useMemo, useRef, useState } from 'react';

// The billing country: a searchable list in the popup's own look (a native <select> can't be styled, and Stripe's
// address field draws its own). Type to filter by name or code; arrows, Enter and Esc work as in any list.

const CODES =
    'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');

const names = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
const nameOf = (code: string) => {
    try {
        return names?.of(code) ?? code;
    } catch {
        return code;
    }
};

export const COUNTRIES: Array<{ code: string; name: string }> = CODES.map((code) => ({ code, name: nameOf(code) })).sort((a, b) => a.name.localeCompare(b.name));

/** The visitor's likely country from their browser language (en-SA → SA), if it's one we list. */
export function guessCountry(): string {
    const langs = typeof navigator !== 'undefined' ? [...(navigator.languages ?? []), navigator.language] : [];
    for (const l of langs) {
        const region = /[-_]([A-Za-z]{2})\b/.exec(l ?? '')?.[1]?.toUpperCase();
        if (region && CODES.includes(region)) return region;
    }
    return '';
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [active, setActive] = useState(0);
    const wrap = useRef<HTMLDivElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const id = useId();

    const shown = useMemo(() => {
        const f = fold(q.trim());
        if (!f) return COUNTRIES;
        const starts = COUNTRIES.filter((c) => fold(c.name).startsWith(f) || c.code.toLowerCase() === f);
        const rest = COUNTRIES.filter((c) => !starts.includes(c) && fold(c.name).includes(f));
        return [...starts, ...rest];
    }, [q]);

    // Opening: search box focused, the chosen country in view.
    useEffect(() => {
        if (!open) return;
        setQ('');
        const at = Math.max(0, COUNTRIES.findIndex((c) => c.code === value));
        setActive(at);
        requestAnimationFrame(() => {
            search.current?.focus();
            list.current?.children[at]?.scrollIntoView({ block: 'center' });
        });
        const outside = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', outside);
        return () => document.removeEventListener('mousedown', outside);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const pick = (code: string) => {
        onChange(code);
        setOpen(false);
        wrap.current?.querySelector<HTMLButtonElement>('.rp-cp-btn')?.focus();
    };

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) pick(shown[active].code); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); wrap.current?.querySelector<HTMLButtonElement>('.rp-cp-btn')?.focus(); }
        else if (e.key === 'Tab') setOpen(false);
    };

    const chosen = value ? COUNTRIES.find((c) => c.code === value) : null;

    return (
        <div className={`rp-cp${open ? ' open' : ''}`} ref={wrap}>
            <button
                type="button"
                className="rp-in rp-cp-btn"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby={`${id}-l ${id}-v`}
                onClick={() => setOpen(!open)}
                onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}
            >
                <span id={`${id}-v`} className={chosen ? '' : 'rp-cp-ph'}>
                    {chosen ? <><span className="rp-cp-code">{chosen.code}</span>{chosen.name}</> : 'Choose your country'}
                </span>
                <svg className="rp-cp-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span id={`${id}-l`} hidden>Country</span>
            {open ? (
                <div className="rp-cp-pop">
                    <input
                        ref={search}
                        className="rp-cp-search"
                        placeholder="Search countries"
                        aria-label="Search countries"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={`${id}-list`}
                        aria-activedescendant={shown[active] ? `${id}-${shown[active].code}` : undefined}
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setActive(0); }}
                        onKeyDown={onKey}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <ul ref={list} id={`${id}-list`} role="listbox" aria-label="Countries" className="rp-cp-list">
                        {shown.map((c, i) => (
                            <li
                                key={c.code}
                                id={`${id}-${c.code}`}
                                role="option"
                                aria-selected={c.code === value}
                                className={`${i === active ? 'act' : ''}${c.code === value ? ' sel' : ''}`}
                                onMouseEnter={() => setActive(i)}
                                onMouseDown={(e) => { e.preventDefault(); pick(c.code); }}
                            >
                                <span className="rp-cp-code">{c.code}</span>
                                <span className="rp-cp-name">{c.name}</span>
                                {c.code === value ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : null}
                            </li>
                        ))}
                        {shown.length === 0 ? <li className="rp-cp-none" role="presentation">No country matches “{q}”</li> : null}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
