import { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aegis Triage OS',
    short_name: 'Aegis OS',
    description: 'Enterprise AI Healthcare Triage Assistant',
    start_url: '/patient',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, 
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
}
