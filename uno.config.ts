import { defineConfig } from 'unocss'
import presetIcons from '@unocss/preset-icons'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import presetTypography from '@unocss/preset-typography'

// 配置UnoCSS
// 集成了多个预设：基础样式、属性化CSS、图标支持和排版样式
export default defineConfig({
  // 预设配置
  presets: [
    // 基础预设，提供类似Tailwind的功能
    presetUno(),
    // 属性化CSS支持，允许使用类名作为属性
    presetAttributify(),
    // 图标支持，使用iconify图标库
    presetIcons({
      // 启用图标的自动导入
      autoInstall: true,
      // 配置SVG图标的默认前缀
      prefix: 'i-',
      // 配置可用的图标集合
      collections: {
        // 可以在这里添加自定义图标集合
      },
      // 配置SVG的默认属性
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    // 排版预设，提供更好的文本排版支持
    presetTypography(),
  ],
  // 自定义规则
  rules: [],
  // 自定义快捷方式
  shortcuts: [],
  // 自定义主题
  theme: {
    // 可以在这里扩展或覆盖默认主题
    colors: {},
    fontFamily: {},
  },
  // 安全列表，确保这些类名会被生成
  safelist: [],
  // 块列表，确保这些类名不会被生成
  blocklist: [],
})
