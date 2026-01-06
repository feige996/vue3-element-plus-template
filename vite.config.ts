import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

const BACKEND_API_URL = 'http://10.200.16.127:8056'
const AIGC_API_URL = 'http://10.200.16.74:9890'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    UnoCSS(),
    // Auto import APIs on-demand
    AutoImport({
      imports: ['vue', 'vue-router'],
      resolvers: [ElementPlusResolver()],
      // 生成全局类型声明文件
      dts: './auto-imports.d.ts',
    }),
    // Auto register components on-demand
    Components({
      resolvers: [ElementPlusResolver()],
      // 生成组件类型声明文件
      dts: './components.d.ts',
    }),
    // SVG icons plugin
    createSvgIconsPlugin({
      // 指定SVG图标目录，默认路径
      iconDirs: [
        // 可以添加多个目录
        fileURLToPath(new URL('./src/assets/icons', import.meta.url)),
      ],
      // 指定symbolId格式
      symbolId: 'icon-[dir]-[name]',
      // 启用压缩
      svgoOptions: true,
      // 自动插入到页面
      inject: 'body-last',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: AIGC_API_URL,
        changeOrigin: true,
        // rewrite: (path) => path.replace(new RegExp(`/api`), ''),
        configure: (proxyServer) => {
          proxyServer.on('proxyReq', (proxyReq, req) => {
            const fullProxyPath = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`
            console.log(`[Proxy Log]: ${req.method} ${req.url} -> ${fullProxyPath}`)
          })
        },
      },
      '/backend': {
        target: BACKEND_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`/backend`), ''),
        configure: (proxyServer) => {
          proxyServer.on('proxyReq', (proxyReq, req) => {
            const fullProxyPath = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`
            console.log(`[Proxy Log]: ${req.method} ${req.url} -> ${fullProxyPath}`)
          })
        },
      },
    },
  },
})
