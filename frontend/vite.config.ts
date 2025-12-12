import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    base: isDev ? "/" : "/public/front/", // "./" pour build copié dans public/
    plugins: [react(), isDev && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "::", // pour accéder via 127.0.0.1 ou localhost
      port: 2025,
      proxy: {
        "/api": {
          target: isDev
            ? "http://localhost/backend" // dev backend
            : "https://quotes-parts.oni-car.com", // prod backend
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/api"), // optionnel
        },
      },
    },
  };
});
