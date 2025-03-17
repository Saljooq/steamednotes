import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 80,  // Match Nginx
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Local Go
        changeOrigin: true,
      },
    },
  },
})
