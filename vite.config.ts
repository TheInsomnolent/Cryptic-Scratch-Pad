import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed to GitHub Pages at https://theinsomnolent.github.io/Cryptic-Scratch-Pad/
export default defineConfig({
  base: '/Cryptic-Scratch-Pad/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Cryptic Scratch Pad',
        short_name: 'Cryptic Pad',
        description:
          'A visual scratch pad for working out solutions to cryptic crossword clues.',
        theme_color: '#6c3bff',
        background_color: '#f5f2ec',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
