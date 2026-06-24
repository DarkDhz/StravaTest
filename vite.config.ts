import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const haUrl = env.VITE_HA_URL || 'http://192.168.0.91:8123'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': 'http://localhost:3001',
        '/ha-proxy': {
          target: haUrl,
          rewrite: (path) => path.replace(/^\/ha-proxy/, ''),
          changeOrigin: true,
        },
      },
    },
  }
})
