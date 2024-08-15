import { defineConfig } from "vite";
import path from "path";
import svgr from "vite-plugin-svgr";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [svgr(), preact({
    devtoolsInProd: true
  })],
  server: {
    port: 8080,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  css: {
    preprocessorOptions: {
      less: {
        math: "always",
        relativeUrls: true,
        javascriptEnabled: true,
      },
    },
  },
});
