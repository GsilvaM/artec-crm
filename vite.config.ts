import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3100,
    proxy: {
      "/api": {
        target: process.env.CRM_API_PROXY_TARGET ?? "http://localhost:4100",
        changeOrigin: true,
      },
    },
  },
});
