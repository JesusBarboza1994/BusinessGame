import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load every variable from .env files (not only VITE_*) for the dev-server settings
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const apiTarget = env.API_TARGET || 'http://localhost:4000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: { chunkSizeWarningLimit: 700 },
    server: {
      port: Number(env.PORT || 5174),
      proxy: {
        '/v1': { target: apiTarget, changeOrigin: true },
        '/socket.io': { target: apiTarget, ws: true, changeOrigin: true },
      },
    },
  }
})
