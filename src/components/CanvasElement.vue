<template>
  <div
    :class="['absolute', { 'ring-2 ring-blue-400': isSelected }]"
    :style="elementStyle"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <!-- 图片元素 -->
    <img
      v-if="element.type === 'image'"
      :src="element.url"
      :alt="element.name"
      class="w-full h-full object-cover"
      draggable="false"
    />
    <!-- 文本框元素 -->
    <div
      v-else-if="element.type === 'text'"
      :data-element-id="element.id"
      contenteditable="true"
      class="w-full h-full p-2 outline-none cursor-text"
      :placeholder="'输入文字'"
      @input="handleTextInput"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
    ></div>
    <!-- 矩形框元素 -->
    <div
      v-else-if="element.type === 'rect'"
      class="w-full h-full border-2 border-solid"
      :style="{ borderColor: element.color, backgroundColor: 'transparent' }"
    ></div>
    <!-- 虚线框元素 -->
    <div
      v-else-if="element.type === 'dashed'"
      class="w-full h-full border-2"
      :style="{
        borderColor: '#000000',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
      }"
    ></div>
    <!-- 数字标元素 -->
    <div
      v-else-if="element.type === 'number'"
      class="flex items-center justify-center text-white rounded-full font-bold"
      :style="{
        width: `${element.size || 32}px`,
        height: `${element.size || 32}px`,
        backgroundColor: element.backgroundColor || '#ef4444',
      }"
    >
      {{ element.number }}
    </div>

    <!-- 人物元素 -->
    <HumanFigure
      v-else-if="element.type === 'human'"
      :left="element.left"
      :top="element.top"
      :width="element.width || 150"
      :height="element.height || 250"
      :rotation="element.rotation || 0"
      :figureType="element.figureType || 'cartoon'"
      :pose="element.pose || 'standing'"
      @select="() => handleSelect(element.id)"
      @jointMousedown="handleJointMousedown"
    />

    <!-- 画笔元素 -->
    <svg
      v-else-if="element.type === 'brush'"
      class="w-full h-full"
      :style="{ left: '0', top: '0', position: 'absolute' }"
    >
      <polyline
        :points="element.points?.map((p) => `${p.x},${p.y}`).join(' ') || ''"
        fill="none"
        :stroke="element.color"
        :stroke-width="element.strokeWidth || 3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <!-- 箭头元素 -->
    <svg
      v-else-if="element.type === 'arrow'"
      class="w-full h-full"
      :style="{ left: '0', top: '0', position: 'absolute' }"
    >
      <line
        :x1="element.startX || 0"
        :y1="element.startY || 0"
        :x2="element.endX || 0"
        :y2="element.endY || 0"
        :stroke="element.color"
        :stroke-width="element.strokeWidth || 3"
        stroke-linecap="round"
      />
      <polygon :points="getArrowHeadPoints(element)" :fill="element.color" />
    </svg>

    <!-- 圆形框元素 -->
    <div
      v-else-if="element.type === 'circle'"
      class="w-full h-full border-2 border-solid"
      :style="{
        borderColor: element.color,
        borderRadius: '50%',
        backgroundColor: 'transparent',
      }"
    ></div>

    <!-- 直线元素 -->
    <svg
      v-else-if="element.type === 'line'"
      class="w-full h-full"
      :style="{ left: '0', top: '0', position: 'absolute' }"
    >
      <line
        :x1="element.startX || 0"
        :y1="element.startY || 0"
        :x2="element.endX || 0"
        :y2="element.endY || 0"
        :stroke="element.color"
        :stroke-width="element.strokeWidth || 3"
        stroke-linecap="round"
      />
    </svg>

    <!-- 缩放控制点 -->
    <div
      v-if="isSelected && editMode && element.type !== 'number'"
      class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
      :style="{ right: '-6px', bottom: '-6px', cursor: 'nwse-resize' }"
      @mousedown.stop="handleResizeStart($event, 'se')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HumanFigure from './HumanFigure.vue'
import type { CanvasElement as CanvasElementType } from '../typing'

// Props 定义
interface Props {
  element: CanvasElementType
  isSelected?: boolean
  editMode?: boolean
  activeTool?: 'text' | 'rect' | 'number' | 'brush' | 'eraser' | 'arrow' | 'circle' | 'line' | null
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  editMode: true,
  activeTool: null,
})

// Emits 定义
const emit = defineEmits<{
  select: [id: string]
  mousedown: [event: MouseEvent, element: CanvasElementType]
  'resize-start': [event: MouseEvent, element: CanvasElementType, direction: 'se']
  'joint-mousedown': [event: MouseEvent, element: CanvasElementType]
  'text-input': [event: Event, id: string]
  'composition-start': []
  'composition-end': [event: CompositionEvent, id: string]
}>()

// 计算元素样式
const elementStyle = computed(() => {
  const elementWidth =
    props.element.type === 'number' ? props.element.size || 32 : props.element.width
  const elementHeight =
    props.element.type === 'number' ? props.element.size || 32 : props.element.height

  const baseStyle = {
    left: `${props.element.left}px`,
    top: `${props.element.top}px`,
    width: `${elementWidth}px`,
    height: `${elementHeight}px`,
    color: props.element.color,
    position: 'absolute' as const,
    transform: `rotate(${props.element.rotation || 0}deg)`,
    transformOrigin: 'center',
    zIndex: props.element.zIndex,
  }

  // 为文本元素添加字体大小
  if (props.element.type === 'text') {
    return {
      ...baseStyle,
      fontSize: `${props.element.fontSize || 16}px`,
    }
  }

  return baseStyle
})

// 处理点击事件
const handleClick = () => {
  if (props.activeTool) {
    // 如果有活跃工具，不执行选择操作
    return
  }
  handleSelect(props.element.id)
}

// 处理选择
const handleSelect = (id: string) => {
  emit('select', id)
}

// 处理鼠标按下事件
const handleMouseDown = (event: MouseEvent) => {
  if (!props.editMode) return

  // 如果有活跃工具，不执行拖拽操作，也不阻止事件冒泡，让画布处理
  if (props.activeTool) return

  // 先选中元素
  handleSelect(props.element.id)

  event.stopPropagation()
  emit('mousedown', event, props.element)
}

// 处理缩放开始
const handleResizeStart = (event: MouseEvent, direction: 'se') => {
  if (!props.editMode) return
  event.stopPropagation()
  emit('resize-start', event, props.element, direction)
}

// 处理人物关节鼠标按下事件
const handleJointMousedown = (event: MouseEvent) => {
  if (!props.editMode) return
  event.stopPropagation()
  emit('joint-mousedown', event, props.element)
}

// 处理文本输入
const handleTextInput = (event: Event) => {
  emit('text-input', event, props.element.id)
}

// 处理中文输入开始
const handleCompositionStart = () => {
  emit('composition-start')
}

// 处理中文输入结束
const handleCompositionEnd = (event: CompositionEvent) => {
  emit('composition-end', event, props.element.id)
}

// 计算箭头头部坐标
const getArrowHeadPoints = (element: CanvasElementType) => {
  const startX = element.startX || 0
  const startY = element.startY || 0
  const endX = element.endX || 0
  const endY = element.endY || 0
  const headLength = 15
  const angle = Math.atan2(endY - startY, endX - startX)

  const x1 = endX - headLength * Math.cos(angle - Math.PI / 6)
  const y1 = endY - headLength * Math.sin(angle - Math.PI / 6)
  const x2 = endX - headLength * Math.cos(angle + Math.PI / 6)
  const y2 = endY - headLength * Math.sin(angle + Math.PI / 6)

  return `${endX},${endY} ${x1},${y1} ${x2},${y2}`
}
</script>

<style scoped>
/* contenteditable元素的placeholder样式 */
:deep([contenteditable='true']):empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}
</style>
