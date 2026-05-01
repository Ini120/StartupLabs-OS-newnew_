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
    chunkSizeWarningLimit: 800,

    // IMPORTANT FIX for Netlify + mixed modules
    commonjsOptions: {
      transformMixedEsModules: true,
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"].some((p) =>
              id.includes(`node_modules/${p}`)
            )
          ) {
            return "vendor-react";
          }

          if (
            id.includes("node_modules/react-router-dom") ||
            id.includes("node_modules/@remix-run")
          ) {
            return "vendor-router";
          }

          if (id.includes("node_modules/@clerk")) {
            return "vendor-clerk";
          }

          if (
            id.includes("node_modules/@tanstack") ||
            id.includes("node_modules/@supabase")
          ) {
            return "vendor-data";
          }

          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }

          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3")
          ) {
            return "vendor-charts";
          }

          if (id.includes("node_modules/date-fns")) {
            return "vendor-dates";
          }

          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },

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
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
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