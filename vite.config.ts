import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLibBuild = mode === 'lib';
  
  return {
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
    build: isLibBuild ? {
      target: 'esnext',
      lib: {
        entry: resolve(__dirname, 'src/warper-grid/index.ts'),
        name: 'WarperGrid',
        fileName: 'warper-grid',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
        ],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'warper-grid.css';
            return assetInfo.name || 'assets/[name][extname]';
          },
        },
      },
      sourcemap: true,
      minify: 'esbuild',
    } : {
      target: 'esnext',
    },
    worker: {
      format: 'es',
    },
  };
})
