import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  /* modo "pagina": tudo num bundle só, para o build de arquivo único */
  build:
    mode === 'pagina'
      ? { rollupOptions: { output: { inlineDynamicImports: true } }, assetsInlineLimit: 1024 * 1024 }
      : {},
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))
