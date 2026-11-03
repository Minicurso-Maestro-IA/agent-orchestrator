import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' faz o site funcionar em qualquer subpasta — GitHub Pages publica em
// /<repo>/, e com base absoluta os assets quebrariam.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5175 }
})
