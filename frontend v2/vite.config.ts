import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      // Proxy API routes to the backend (dev HTTPS with self-signed cert)
      // Uses secure:false so self-signed certs are accepted in dev.
      '/auth': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/certificates': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/ai': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/feedback': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/admin': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/employer/history': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/employer/reports': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/student/verification-history': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
