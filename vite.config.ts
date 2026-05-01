import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  // Pre-bundle these so Vite never reloads the page on cold start
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "date-fns",
      "lucide-react",
      "clsx",
      "tailwind-merge",
    ],
  },

  build: {
    target: "ES2020",
    minify: "esbuild",
    // Raise the warning limit — chunks under 800 kB are fine
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Granular manual chunks so the browser can cache each layer independently
        manualChunks(id) {
          // Core React runtime — loaded first, cached forever
          if (["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"].some((p) => id.includes(`node_modules/${p}`))) {
            return "vendor-react";
          }
          // Router
          if (id.includes("node_modules/react-router-dom") || id.includes("node_modules/@remix-run")) {
            return "vendor-router";
          }
          // Auth
          if (id.includes("node_modules/@clerk")) {
            return "vendor-clerk";
          }
          // Data layer
          if (id.includes("node_modules/@tanstack") || id.includes("node_modules/@supabase")) {
            return "vendor-data";
          }
          // UI primitives (Radix) — big but rarely changes
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          // Charts — heavy, only needed on dashboard pages
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
            return "vendor-charts";
          }
          // Date helpers
          if (id.includes("node_modules/date-fns")) {
            return "vendor-dates";
          }
          // Icons — split from UI so icon updates don't bust the Radix cache
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
        // Content-hash filenames → long-lived CDN/browser cache
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));