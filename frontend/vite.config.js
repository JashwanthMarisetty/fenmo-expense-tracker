import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/expenses': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
