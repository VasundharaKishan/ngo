import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Foundation NGO',
        short_name: 'Foundation',
        description: 'Support meaningful causes through our foundation',
        theme_color: '#4CAF50',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'admin': [
            './src/pages/Dashboard.tsx',
            './src/pages/Donations.tsx',
            './src/pages/Campaigns.tsx',
            './src/pages/Categories.tsx',
            './src/pages/AdminUsers.tsx',
            './src/pages/AdminSettings.tsx',
            './src/pages/AdminContactSettings.tsx',
            './src/pages/AdminFooterSettings.tsx',
            './src/pages/AdminDonatePopupSettings.tsx',
            './src/pages/AdminHeroSlides.tsx',
            './src/pages/AdminHomeSections.tsx',
            './src/pages/AdminCMS.tsx',
            './src/pages/AdminLogin.tsx',
            './src/pages/AdminCampaignForm.tsx',
            './src/pages/PasswordSetup.tsx'
          ],
          'public': [
            './src/pages/Home.tsx',
            './src/pages/CampaignList.tsx',
            './src/pages/CampaignDetail.tsx',
            './src/pages/DonationForm.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true
  }
})
