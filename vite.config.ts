import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// @ts-ignore
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  publicDir: "public",
  server: {
    port: 5173,
    allowedHosts: ["localhost:5173", "35.74.40.37:5173", "product.jp"],
  },
  define: {
    // sockjs-client requires global to be defined
    global: "globalThis",
  },
});
