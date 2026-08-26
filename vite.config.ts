import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: "iife",
        entryFileNames: "assets/app.js",
        assetFileNames: "assets/[name][extname]",
        inlineDynamicImports: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    allowedHosts: true,
  },
  server: {
    allowedHosts: true,
  },
});
