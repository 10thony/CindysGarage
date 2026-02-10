import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api/uploadthing': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    TanStackRouterVite({
      // Add a small delay to avoid file locking issues on Windows
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    viteReact(),
  ],
})
