import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-source.svg", "icons/icon-32.png", "icons/icon-180.png"],
      manifest: {
        name: "Artec CRM",
        short_name: "Artec CRM",
        description: "Central comercial da Artec Ambientes Climatizados: clientes, oportunidades, funil e follow-up.",
        start_url: "/central-comercial",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        lang: "pt-BR",
        theme_color: "#485e92",
        background_color: "#fdf7ff",
        icons: [
          { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      // A Artec lida com dados comerciais sensiveis a conflito (aprovacao, valores,
      // follow-up) — o service worker so faz cache do app shell (JS/CSS/HTML/icones)
      // para abrir rapido; nenhuma chamada a /api/* e cacheada ou interceptada aqui,
      // evitando dado comercial desatualizado exibido como se fosse ao vivo, e
      // evitando fila de sincronizacao de escrita offline (nao autorizada).
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
