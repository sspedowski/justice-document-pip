import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Conditionally import Spark plugins only in development
const getPlugins = () => {
  const basePlugins = [react(), tailwindcss()]
  
  // Only use Spark plugins in development/local builds
  if (process.env.NODE_ENV !== 'production' && process.env.GITHUB_PAGES !== 'true') {
    try {
      const sparkPlugin = require("@github/spark/spark-vite-plugin");
      const createIconImportProxy = require("@github/spark/vitePhosphorIconProxyPlugin");
      basePlugins.push(
        createIconImportProxy() as PluginOption,
        sparkPlugin() as PluginOption
      )
    } catch (error) {
      console.log('Spark plugins not available, using fallback mode')
    }
  }
  
  return basePlugins
}

// https://vite.dev/config/
export default defineConfig({
  // Set base path for static deployment
  base: '/',
  
  plugins: getPlugins(),
  
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
