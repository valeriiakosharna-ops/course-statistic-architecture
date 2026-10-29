import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({ jsxImportSource: "@learningatlas/i18n" }),
    {
      name: "local-presentation-runtime",
      enforce: "post",
      config(config) {
        // Keep the local JSX runtime and its language store in the same source graph.
        if (config.optimizeDeps?.include)
          config.optimizeDeps.include = config.optimizeDeps.include.filter(
            (id) => !id.startsWith("@learningatlas/i18n"),
          );
      },
    },
  ],
  resolve: {
    alias: {
      "@learningatlas/i18n": new URL("./src/i18n", import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    exclude: [
      "@learningatlas/i18n",
      "@learningatlas/i18n/jsx-runtime",
      "@learningatlas/i18n/jsx-dev-runtime",
    ],
  },
  base: "./",
  test: { include: ["src/**/*.test.ts"] },
});
