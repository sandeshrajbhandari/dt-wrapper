import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/local_root_url': {
        target: 'http://0.0.0.0:7860',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/local_root_url/, '')
        // rewrite explanation : 
        // 1. ^ means the start of the string
        // 2. /^\/local_root_url/ means the start of the string and the string is /local_root_url
        // 3. "" means the string is empty
        // 4. path.replace(/^\/local_root_url/ ,"") means replace the start of the string and the string is /local_root_url with empty
        // 5. path is the original path
        // 6. return the original path
      }
    }
  }
})
