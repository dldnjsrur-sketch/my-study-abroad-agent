import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/llm-api': {
        target: 'http://10.197.2.131:3003/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/llm-api/, '')
      }
    }
  },
  // 添加 base 配置，适应 GitHub Pages 部署
  base: '/my-study-abroad-agent/'
})