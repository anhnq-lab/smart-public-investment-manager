import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['@thatopen/components', '@thatopen/components-front', '@thatopen/fragments']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // 3D/BIM vendor (~5MB) — only loaded on BIM tab
            'vendor-3d': ['three', 'web-ifc'],
            // Charts vendor — loaded on Dashboard + Reports
            'vendor-charts': ['recharts'],
            // Map vendor — loaded on Dashboard + Project map views
            'vendor-map': ['leaflet', 'react-leaflet'],
            // Document generation vendor — loaded on export
            'vendor-docs': ['docx', 'jspdf', 'jspdf-autotable', 'file-saver'],
            // Icons — shared across all pages
            'vendor-icons': ['lucide-react'],
            // React core — cached long-term
            'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-router'],
            // Data layer
            'vendor-data': ['@supabase/supabase-js', '@tanstack/react-query'],
          }
        }
      }
    },
    worker: {
      format: 'es'
    }
  };
});
