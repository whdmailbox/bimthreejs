import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base:'/bimthreejs/',
  resolve:{
    alias:{
      "@": resolve(__dirname, 'src'), // 路径别名
      extensions: ['.js', '.json', '.ts']
    }
  }
})
