import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import svgLoader from 'vite-svg-loader'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'AC_')
  const licenseType = env.AC_LICENSE_TYPE
  return {
    plugins: [vue(), tailwindcss(), svgLoader()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@edition-component': path.resolve(__dirname, `./src/components/${licenseType}`),
        '@edition-router': path.resolve(__dirname, `./src/router/${licenseType}`),
        '@edition-store': path.resolve(__dirname, `./src/stores/${licenseType}`),
      },
    },
    envPrefix: ['AC_'],
    server: {
      port: +env.AC_FRONTEND_PORT,
      host: env.AC_FRONTEND_HOST,
      strictPort: true,
      allowedHosts: [
        'ac'
      ],
      proxy: {
        '/api': {
          target: env.AC_BACKEND,
          changeOrigin: true
        },
      }
    }
  }
})
