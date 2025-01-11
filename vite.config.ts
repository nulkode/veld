import { defineConfig } from "vite";
import { terser } from "rollup-plugin-terser";

export default defineConfig({
  base: "/veld/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
      plugins: [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        }),
      ],
    },
  },
});
