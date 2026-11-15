import type { MetadataRoute } from 'next';

// /manifest.webmanifest: the name, colours and icons a phone uses when Robtic is added to its home screen. Next links
// it from every page by itself.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Robtic',
        short_name: 'Robtic',
        description: 'The platform for Discord builders: hosting, servers and public Discord bots, from one account.',
        start_url: '/',
        display: 'standalone',
        background_color: '#090d15',
        theme_color: '#090d15',
        icons: [
            { src: '/rl/favicons/android-chrome-192x192.png?v=r3', sizes: '192x192', type: 'image/png' },
            { src: '/rl/favicons/android-chrome-512x512.png?v=r3', sizes: '512x512', type: 'image/png' },
            { src: '/rl/robtic/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
