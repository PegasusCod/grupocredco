import { defineConfig } from "vite"
import laravel from "laravel-vite-plugin"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [
    laravel({
      input: "resources/js/app.jsx",
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "resources/js"),
       "@components": path.resolve(__dirname, "resources/js/components"), // shadcn (minúscula)
      // o si tu carpeta es Components (Breeze):
      // "@components": path.resolve(__dirname, "resources/js/Components"),
    },
  },
/*   server: {
        host: "0.0.0.0",
        port: 5173,
        cors: true,
        hmr: {
            host: "192.168.1.170",
        },
    }, */
})
