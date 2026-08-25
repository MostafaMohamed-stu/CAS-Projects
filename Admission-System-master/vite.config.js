import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios', 'jwt-decode']
        }
      }
    }
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5253',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: true
  }
})
