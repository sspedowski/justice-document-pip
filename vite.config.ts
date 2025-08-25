import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  // Set base path for GitHub Pages deployment
  base: process.env.NODE_ENV === 'production' ? '/spark-template/' : '/',
  
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  
  // Optimize for production deployment
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['pdfjs-dist'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs']
        }
      }
    }
  },
  
  // Handle SPA routing for production
  preview: {
    port: 4173,
    host: true
  },
  
  // Environment variables for production
  define: {
    'import.meta.env.VITE_APP_TITLE': JSON.stringify('Justice Document Manager'),
    'import.meta.env.VITE_APP_DESCRIPTION': JSON.stringify('Contact & Action Book — Master File System')
  }
});
