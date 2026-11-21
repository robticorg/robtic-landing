import { redirect } from 'next/navigation';

// Old Settings addresses (/settings/account, /settings/security/devices, …) open the popup on the same section.
const SECTIONS = ['account', 'notifications', 'security', 'connections', 'devices', 'plan'];

export default async function OldSettings({ params }: { params: Promise<{ rest: string[] }> }) {
    const { rest } = await params;
    const wanted = [...rest].reverse().find((part) => SECTIONS.includes(part)) ?? (rest[0] === 'linked' ? 'connections' : 'account');
    redirect(`/?settings=${wanted}`);
}
