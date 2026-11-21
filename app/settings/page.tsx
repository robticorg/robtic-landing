import { redirect } from 'next/navigation';

// Settings is a popup now: old links and bookmarks open it on the home page.
export default function Settings() {
    redirect('/?settings=profile');
}
