<template>
  <div
    ref="toolbarRef"
    class="h-12 bg-white border-b border-gray-200 flex items-center px-2 space-x-2"
  >
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'text' }"
      @click="handleToolChange('text')"
    >
      文本框
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'rect' }"
      @click="handleToolChange('rect')"
    >
      矩形框
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'number' }"
      @click="handleToolChange('number')"
    >
      数字标
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'brush' }"
      @click="handleToolChange('brush')"
    >
      画笔
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'eraser' }"
      @click="handleToolChange('eraser')"
    >
      擦除
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'arrow' }"
      @click="handleToolChange('arrow')"
    >
      箭头
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'circle' }"
      @click="handleToolChange('circle')"
    >
      圆形框
    </el-button>
    <el-button
      type="primary"
      :class="{ 'bg-green-600 hover:bg-green-600': activeTool === 'line' }"
      @click="handleToolChange('line')"
    >
      直线
    </el-button>
    <div class="w-px h-6 bg-gray-300 mx-2"></div>
    <el-button type="info" @click="handleUndo"> 撤销 </el-button>
    <el-button type="info" @click="handleRedo"> 重做 </el-button>
    <div class="w-px h-6 bg-gray-300 mx-2"></div>
    <!-- <el-button :type="editMode ? 'success' : 'info'" @click="handleEditModeChange">
      {{ editMode ? '编辑' : '浏览' }}
    </el-button> -->
    <el-button type="danger" @click="handleClearCanvas"> 清空画布 </el-button>
    <el-button type="success" @click="handleGenerateScreenshot" :loading="isScreenshotLoading">
      生成截图
    </el-button>
    <el-button
      :icon="isCanvasExpanded ? ArrowUp : ArrowDown"
      size="small"
      @click="handleToggleCanvas"
    >
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

// 处理编辑模式切换
const handleEditModeChange = () => {
  emit('edit-mode-change', !props.editMode)
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
