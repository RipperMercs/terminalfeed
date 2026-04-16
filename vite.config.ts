import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), {
    name: 'static-page-rewrites',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rewrites: Record<string, string> = {
          '/cleaner': '/cleaner.html',
          '/buy': '/buy.html',
          '/buy/thanks': '/buy-thanks.html',
        }
        if (req.url && rewrites[req.url]) {
          req.url = rewrites[req.url]
        }
        next()
      })
    },
  }],
  build: