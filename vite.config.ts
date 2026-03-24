import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'static-page-rewrites',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/cleaner') {
            req.url = '/cleaner.html'
          }
          next()
        })
      },
    },
  ],
})
