import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Azurite blob storage requests to avoid CORS issues in local dev.
      // Azure Blob Storage URLs work directly (public container or SAS tokens).
      '/azurite': {
        target: 'http://127.0.0.1:10000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azurite/, ''),
      },
    },
  },
})
