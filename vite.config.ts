import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      "/api/identity": {
        target: "https://ms1-identity-157498364441.us-east1.run.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/identity/, ""),
      },
      "/api/catalog": {
        target: "https://catalog-1003140017553.us-east1.run.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catalog/, ""),
      },
      "/api/conversation": {
        target: "http://34.23.14.69:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/conversation/, ""),
      },
      "/api/reservation": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reservation/, ""),
      },
    }
  },
});
