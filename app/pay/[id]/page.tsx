import type { Metadata } from 'next';
import PayLinkView from './PayLinkView';

// robtic.org/pay/<id>: a payment link made in Admin → Billing. Anyone with the link pays here, without signing in.
// The link is read in the browser (the panel limits each visitor, not this server), and paid in the pay popup.
export const metadata: Metadata = {
    title: 'Payment · Robtic',
    description: 'A payment request from Robtic.',
    robots: { index: false, follow: false },
};

export default async function PayLinkPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <PayLinkView id={id} />;
}
