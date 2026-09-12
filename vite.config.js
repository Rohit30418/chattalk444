import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Local development talks to the backend through Vite so the browser only
// sees same-origin requests. Production continues to use VITE_BACKEND_URL.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: true,
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          secure: true,
          ws: true,
          rewriteWsOrigin: true,
        },
      },
    },
  }
})
