<template>
  <div
    ref="toolbarRef"
    class="h-12 bg-white border-b border-gray-200 flex items-center px-2 space-x-2"
  >
    <button
      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      @click="handleToolChange('text')"
      :class="{
        'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'text',
      }"
    >
      文本框
    </button>
    <button
      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      @click="handleToolChange('rect')"
      :class="{
        'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'rect',
      }"
    >
      矩形框
    </button>
    <button
      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      @click="handleToolChange('number')"
      :class="{
        'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'number',
      }"
    >
      数字标
    </button>
    <div class="w-px h-6 bg-gray-300 mx-2"></div>
    <button
      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      @click="handleEditModeChange"
      :class="{ 'ring-2 ring-blue-400': editMode }"
    >
      {{ editMode ? '编辑' : '浏览' }}
    </button>
    <button
      class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ml-2"
      @click="handleClearCanvas"
    >
      清空画布
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 组件名称：CanvasToolbar（避免单词组件名警告）

// Props 定义
interface Props {
  activeTool?: 'text' | 'rect' | 'number' | null
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeTool: null,
  editMode: true,
})

// Emits 定义
const emit = defineEmits<{
  'tool-change': [tool: 'text' | 'rect' | 'number' | null]
  'edit-mode-change': [editMode: boolean]
  'clear-canvas': []
}>()

// 工具栏引用
const toolbarRef = ref<HTMLElement | null>(null)

// 处理工具切换
const handleToolChange = (tool: 'text' | 'rect' | 'number') => {
  const newTool = props.activeTool === tool ? null : tool
  emit('tool-change', newTool)
}

// 处理编辑模式切换
const handleEditModeChange = () => {
  emit('edit-mode-change', !props.editMode)
}

// 处理清空画布
const handleClearCanvas = () => {
  emit('clear-canvas')
}

// 暴露工具栏引用，供父组件使用
defineExpose({
  toolbarRef,
})
</script>
