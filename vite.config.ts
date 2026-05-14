import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";

const packageVersion = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
).version;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: process.env.TEMPO === "true" ? "0.0.0.0" : "::",
    port: 8080,
    // allowedHosts: process.env.TEMPO === "true" ? true : undefined,
    proxy: {
      '/bps-api': {
        target: 'https://webapi.bps.go.id',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/bps-api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');
          });
        }
      },
      '/deepseek-api': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/deepseek-api/, ''),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Inject app version as meta tag into index.html so the update checker can read it
    {
      name: 'inject-app-version',
      transformIndexHtml(html: string) {
        return html.replace(
          '<meta name="author" content="Lavotas" />',
          `<meta name="author" content="Lavotas" />\n    <meta name="app-version" content="${packageVersion}" />`
        );
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  optimizeDeps: {
    // Vite 8 uses Rolldown instead of Rollup for optimization
    // Ensure dependencies are properly optimized
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
            if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'ui-vendor';
            if (id.includes('recharts')) return 'chart-vendor';
            if (id.includes('xlsx')) return 'excel-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('react-hook-form') || id.includes('zod')) return 'form-vendor';
            if (id.includes('date-fns')) return 'date-vendor';
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
}));
