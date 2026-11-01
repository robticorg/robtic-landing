import type { Metadata } from 'next';
import SettingsShell from './SettingsShell';

export const metadata: Metadata = {
    title: 'Settings · Robtic',
    robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <SettingsShell>{children}</SettingsShell>;
}
