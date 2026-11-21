import type { Metadata } from 'next';

// Settings is a popup now (settings-app/, opened anywhere with ?settings=<section>). What is left under /settings are
// the steps other services send people to: the email confirmation link and the connect window's pages.
export const metadata: Metadata = {
    title: 'Settings · Robtic',
    robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
