import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Production-only build configuration without Spark dependencies
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/justice-document-pip/' : '/',
  
  plugins: [
    react(),
    tailwindcss()
    // NOTE: Spark plugins removed for public deployment
  ],
  
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  
  build: {
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select']
        }
      }
    }
  },
  
  define: {
    'import.meta.env.VITE_APP_TITLE': JSON.stringify('Justice Document Manager'),
    'import.meta.env.VITE_APP_DESCRIPTION': JSON.stringify('Justice Document Manager - Evidence Analysis System'),
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});