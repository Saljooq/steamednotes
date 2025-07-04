import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/',
  server: {
    port: 80,  // Match Nginx
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Local Go
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
