import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error for main API:', err.message);
          });
        }
      },
      '/scraper-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/scraper-api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Scraper service not available:', err.message);
            // Return a fallback response when scraper is not available
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Scraper service unavailable',
                message: 'Please start the scraper service with: npm run scraper',
                data: [],
                status: {
                  isRunning: false,
                  lastError: 'Service not started',
                  totalScraped: 0,
                  successRate: 0
                }
              }));
            }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  base: '/'
})