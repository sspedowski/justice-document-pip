import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Production-only build configuration without Spark dependencies
export default defineConfig({
  base: '/',
  
  plugins: [
    react(),
    tailwindcss()
  ],
  
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['pdfjs-dist'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs']
        }
      }
    },
    minify: 'terser',
    target: 'esnext'
  },
  
  define: {
    'import.meta.env.VITE_APP_TITLE': JSON.stringify('Justice Document Manager'),
    'import.meta.env.VITE_APP_DESCRIPTION': JSON.stringify('Contact & Action Book — Master File System'),
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});