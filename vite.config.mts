import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const clientDir = fileURLToPath(new URL('./client', import.meta.url))

export default defineConfig({
  root: clientDir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist/web', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) expects a function; split the heavy vendors
        // so the app chunk stays lean and cacheable.
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](recharts|d3-|victory)/.test(id)) return 'charts'
          if (/[\\/]node_modules[\\/](framer-motion|motion-)/.test(id)) return 'motion'
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)
          ) {
            return 'react-vendor'
          }
          return undefined
        },
      },
    },
  },
})
