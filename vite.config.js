import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildTime = Date.now();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Include build timestamp in filename — every deploy = unique URL
        // CDN can cache the JS forever (it's immutable per build)
        // but index.html always references the new unique filename
        entryFileNames: `assets/[name]-[hash]-${buildTime}.js`,
        chunkFileNames: `assets/[name]-[hash]-${buildTime}.js`,
        assetFileNames: `assets/[name]-[hash][extname]`,
      }
    }
  }
})
