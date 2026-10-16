import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    port: 5190,
    strictPort: true,
    proxy: {
      // В docker compose бэкенд доступен по имени сервиса.
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3020',
    },
  },
})
