import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@itsmeadarsh/warper'],
  },
  server: {
    fs: {
      allow: ['..', 'node_modules/@itsmeadarsh/warper'],
    },
  },
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
})
