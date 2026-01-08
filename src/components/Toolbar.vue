<template>
  <div
    ref="toolbarRef"
    class="h-12 bg-white border-b border-gray-200 flex items-center px-2 space-x-2"
  >
    <!-- 第一组：基础绘制工具 -->
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'brush',
        'hover:bg-gray-100': activeTool !== 'brush',
      }"
      @click="handleToolChange('brush')"
      title="画笔"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>画笔</title>
        <path
          d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.83 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.83L17 11l4.37-4.37a2 2 0 0 0 0-2.83l-1.26-1.27a2 2 0 0 0-2.83 0z"
        ></path>
        <circle cx="11" cy="11" r="2"></circle>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'line',
        'hover:bg-gray-100': activeTool !== 'line',
      }"
      @click="handleToolChange('line')"
      title="直线"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>直线</title>
        <line x1="20" y1="10" x2="4" y2="10"></line>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'arrow',
        'hover:bg-gray-100': activeTool !== 'arrow',
      }"
      @click="handleToolChange('arrow')"
      title="箭头"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>箭头</title>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'circle',
        'hover:bg-gray-100': activeTool !== 'circle',
      }"
      @click="handleToolChange('circle')"
      title="圆形框"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>圆形框</title>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'rect',
        'hover:bg-gray-100': activeTool !== 'rect',
      }"
      @click="handleToolChange('rect')"
      title="矩形框"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>矩形框</title>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
    </div>

    <!-- 第二组：编辑修改工具 -->
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'text',
        'hover:bg-gray-100': activeTool !== 'text',
      }"
      @click="handleToolChange('text')"
      title="文本框"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>文本框</title>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'number',
        'hover:bg-gray-100': activeTool !== 'number',
      }"
      @click="handleToolChange('number')"
      title="数字标"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>数字标</title>
        <text x="9" y="10" text-anchor="middle" dominant-baseline="middle" font-size="12">①</text>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-600 text-white': activeTool === 'eraser',
        'hover:bg-gray-100': activeTool !== 'eraser',
      }"
      @click="handleToolChange('eraser')"
      title="擦除"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>擦除</title>
        <path d="M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
    </div>

    <div class="w-px h-6 bg-gray-300 mx-2"></div>

    <!-- 第三组：操作管理工具 -->
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-100"
      @click="handleUndo"
      title="撤销"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>撤销</title>
        <path d="M3 7v6h6"></path>
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
      </svg>
    </div>
    <div
      class="tool-icon flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-100"
      @click="handleRedo"
      title="重做"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>重做</title>
        <path d="M21 7v6h-6"></path>
        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
      </svg>
    </div>

    <div class="w-px h-6 bg-gray-300 mx-2"></div>

    <!-- 第四组：最终操作工具 -->
    <el-button type="danger" @click="handleClearCanvas"> 清空画布 </el-button>
    <el-button type="success" @click="handleGenerateScreenshot" :loading="isScreenshotLoading">
      生成截图
    </el-button>
    <el-button :icon="isCanvasExpanded ? ArrowUp : ArrowDown" @click="handleToggleCanvas">
      {{ isCanvasExpanded ? '收起' : '展开' }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { ToolType } from '../typing'

// 组件名称：CanvasToolbar（避免单词组件名警告）

// Props 定义
interface Props {
  activeTool?: ToolType | null
  editMode?: boolean
  isScreenshotLoading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  activeTool: null,
  editMode: true,
  isScreenshotLoading: false,
})
// Emits 定义
const emit = defineEmits<{
  'tool-change': [tool: ToolType | null]
  'edit-mode-change': [editMode: boolean]
  'clear-canvas': []
  'toggle-canvas': []
  'generate-screenshot': []
  undo: []
  redo: []
}>()

// 工具栏引用
const toolbarRef = ref<HTMLElement | null>(null)

// 画布展开状态
const isCanvasExpanded = ref(true)

// 处理画布收起/展开
const handleToggleCanvas = () => {
  isCanvasExpanded.value = !isCanvasExpanded.value
  emit('toggle-canvas')
}

// 处理工具切换
const handleToolChange = (tool: Exclude<ToolType, null>) => {
  const newTool = props.activeTool === tool ? null : tool
  emit('tool-change', newTool)
}

// 处理清空画布
const handleClearCanvas = () => {
  emit('clear-canvas')
}

// 处理生成截图
const handleGenerateScreenshot = () => {
  emit('generate-screenshot')
}

// 处理撤销
const handleUndo = () => {
  emit('undo')
}

// 处理重做
const handleRedo = () => {
  emit('redo')
}

// 暴露工具栏引用，供父组件使用
defineExpose({
  toolbarRef,
})
</script>
