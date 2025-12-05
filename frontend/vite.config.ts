import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// En mode dev https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "::",
//     port: 2025,
//   },
//   plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// }));

// En mode prod
export default defineConfig({
  base: "./", //  chemins relatifs pour un build copié dans /public/
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // alias React
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost/backend/public", //  vers backend Laravel
        // target: "https://quotes-parts.oni-car.com/public", //  vers backend Laravel
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"), //  optionnelle
      },
    },
  },
});

