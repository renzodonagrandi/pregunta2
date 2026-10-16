import type { MetadataRoute } from 'next'
import messages from '../../messages/es.json'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: messages.Common.appName,
    short_name: messages.Common.appName,
    description: messages.Metadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#1a2238',
    theme_color: '#1a2238',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
