import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  base: '/veld/',
  plugins: [tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      },
      plugins: [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        })
      ]
    }
  }
});
