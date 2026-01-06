<template>
  <div class="flex-1 bg-gray-200 p-4 overflow-auto">
    <div
      ref="canvasRef"
      class="w-full min-h-[800px] bg-white border border-gray-300 relative"
      @dragover.prevent
      @drop="onDrop"
      @click="onCanvasClick"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseUp"
    >
      <!-- 画布元素 -->
      <CanvasElement
        v-for="element in canvasElements"
        :key="element.id"
        :element="element"
        :is-selected="selectedElementId === element.id"
        :edit-mode="editMode"
        :active-tool="activeTool"
        @select="selectElement"
        @mousedown="onElementMouseDown"
        @resize-start="onResizeStart"
        @joint-mousedown="onHumanJointMouseDown"
        @text-input="updateTextContent"
        @composition-start="onCompositionStart"
        @composition-end="onCompositionEnd"
      />

      <!-- 临时绘制的矩形框 -->
      <div
        v-if="tempRect && isDrawingRect"
        class="absolute border-2 border-dashed pointer-events-none"
        :style="{
          left: `${tempRect.left}px`,
          top: `${tempRect.top}px`,
          width: `${tempRect.width}px`,
          height: `${tempRect.height}px`,
          borderColor: colorList[currentColorIndex],
          backgroundColor: 'transparent',
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件名称：CanvasContainer（避免单词组件名警告）
import { ref } from 'vue'
import CanvasElement from './CanvasElement.vue'

// 画布元素数据类型定义
interface CanvasElement {
  id: string
  type: 'image' | 'text' | 'rect' | 'dashed' | 'number' | 'human'
  left: number
  top: number
  width?: number
  height?: number
  size?: number
  url?: string
  name?: string
  content?: string
  color?: string
  backgroundColor?: string
  number?: number
  fontSize?: number
  aspectRatio?: number
  screenshot?: string
  rotation?: number
  figureType?: string
  pose?: string
  zIndex?: number
}

// 资产数据类型定义
interface Asset {
  id: number
  name: string
  type: 'image'
  url: string
}

// 预设姿势类型定义
interface Pose {
  id: number
  name: string
  type: 'pose'
  poseId: string
  thumbnail: string
}

// 合并资产类型
type CombinedAsset = Asset | Pose

// Props 定义
interface Props {
  canvasElements: CanvasElement[]
  selectedElementId: string | null
  activeTool?: 'text' | 'rect' | 'number' | null
  editMode?: boolean
  currentNumber?: number
  colorList?: string[]
  currentColorIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  activeTool: null,
  editMode: true,
  currentNumber: 1,
  colorList: () => ['red', 'green', 'blue', 'yellow', 'purple', 'black'],
  currentColorIndex: 0,
})

// Emits 定义
const emit = defineEmits<{
  'element-select': [id: string]
  'element-add': [element: Partial<CanvasElement>]
  'element-update': [element: CanvasElement]
  'element-delete': []
  drop: [event: DragEvent, asset: CombinedAsset]
  'canvas-click': [event: MouseEvent]
  'text-update': [event: Event, id: string]
  'composition-start': []
  'composition-end': [event: CompositionEvent, id: string]
  'number-update': [number: number]
}>()

// 画布引用
const canvasRef = ref<HTMLElement | null>(null)

// 拖拽状态管理
const isDragging = ref(false)
const isResizing = ref(false)
const isDrawingRect = ref(false)
const currentDragElement = ref<CanvasElement | null>(null)
const currentResizeElement = ref<CanvasElement | null>(null)
const resizeDirection = ref<'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// 矩形框绘制状态
const drawStartPos = ref({ x: 0, y: 0 })
const tempRect = ref<{ left: number; top: number; width: number; height: number } | null>(null)

// 中文输入状态
const isComposing = ref(false)

// 处理画布点击
const onCanvasClick = (event: MouseEvent) => {
  emit('canvas-click', event)
}

// 处理画布鼠标按下
const onCanvasMouseDown = (event: MouseEvent) => {
  if (!props.editMode) return

  // 如果没有激活的工具，不处理
  if (!props.activeTool) return

  // 获取画布位置
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const left = event.clientX - rect.left
  const top = event.clientY - rect.top

  // 根据工具类型创建元素
  switch (props.activeTool) {
    case 'text':
      addTextElement(left, top)
      break
    case 'rect':
      // 开始绘制矩形框
      isDrawingRect.value = true
      drawStartPos.value = { x: left, y: top }
      tempRect.value = { left, top, width: 0, height: 0 }
      break
    case 'number':
      addNumberElement(left, top)
      break
  }
}

// 处理画布鼠标移动
const onCanvasMouseMove = (event: MouseEvent) => {
  // 处理拖拽移动
  if (isDragging.value && currentDragElement.value && canvasRef.value) {
    const deltaX = event.clientX - dragStartPos.value.x
    const deltaY = event.clientY - dragStartPos.value.y

    currentDragElement.value.left += deltaX
    currentDragElement.value.top += deltaY

    dragStartPos.value = { x: event.clientX, y: event.clientY }
    emit('element-update', currentDragElement.value)
  }

  // 处理缩放移动
  if (isResizing.value && currentResizeElement.value && resizeDirection.value) {
    handleResizeMove(event)
  }

  // 处理矩形框绘制
  if (isDrawingRect.value && tempRect.value) {
    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top

    const width = currentX - drawStartPos.value.x
    const height = currentY - drawStartPos.value.y

    tempRect.value = {
      left: width > 0 ? drawStartPos.value.x : currentX,
      top: height > 0 ? drawStartPos.value.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    }
  }
}

// 处理画布鼠标释放
const onCanvasMouseUp = (event: MouseEvent) => {
  // 结束拖拽
  if (isDragging.value) {
    isDragging.value = false
    currentDragElement.value = null
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
  }

  // 结束缩放
  if (isResizing.value) {
    isResizing.value = false
    currentResizeElement.value = null
    resizeDirection.value = null
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
  }

  // 结束矩形框绘制
  if (isDrawingRect.value && tempRect.value) {
    // 如果矩形框太小（没有拖拽），创建默认大小的矩形框
    if (tempRect.value.width < 10 && tempRect.value.height < 10) {
      addRectElement({
        left: tempRect.value.left,
        top: tempRect.value.top,
        width: 100,
        height: 100,
      })
    } else if (tempRect.value.width > 10 && tempRect.value.height > 10) {
      // 只有当矩形框有一定大小时才创建
      addRectElement(tempRect.value)
    }
    isDrawingRect.value = false
    tempRect.value = null
  }
}

// 处理拖拽放置
const onDrop = (event: DragEvent) => {
  event.preventDefault()

  const data = event.dataTransfer?.getData('asset')
  if (!data) return

  const dragData = JSON.parse(data)
  const asset = dragData.asset as CombinedAsset

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const left = event.clientX - rect.left - dragData.relativeX
  const top = event.clientY - rect.top - dragData.relativeY

  if (asset.type === 'image') {
    addImageElement(asset, left, top)
  } else if (asset.type === 'pose') {
    addHumanElement(asset, left, top)
  }

  emit('drop', event, asset)
}

// 处理元素鼠标按下（拖拽开始）
const onElementMouseDown = (event: MouseEvent, element: CanvasElement) => {
  if (!props.editMode) return
  event.stopPropagation()

  // 如果有活跃工具，不执行拖拽操作
  if (props.activeTool) return

  isDragging.value = true
  currentDragElement.value = element
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  selectElement(element.id)

  // 添加全局事件监听
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

// 拖拽移动
const onDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !currentDragElement.value || !canvasRef.value) return

  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  currentDragElement.value.left += deltaX
  currentDragElement.value.top += deltaY

  dragStartPos.value = { x: event.clientX, y: event.clientY }
  emit('element-update', currentDragElement.value)
}

// 拖拽结束
const onDragEnd = () => {
  isDragging.value = false
  currentDragElement.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// 处理缩放开始
const onResizeStart = (
  event: MouseEvent,
  element: CanvasElement,
  direction: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
) => {
  if (!props.editMode) return
  event.stopPropagation()

  isResizing.value = true
  currentResizeElement.value = element
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { width: element.width || 0, height: element.height || 0 }
  selectElement(element.id)

  // 添加全局事件监听
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

// 缩放移动
const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !currentResizeElement.value || !resizeDirection.value) return

  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y

  const element = currentResizeElement.value
  const startWidth = resizeStartSize.value.width
  const startHeight = resizeStartSize.value.height

  switch (resizeDirection.value) {
    case 'se':
      // 右下角缩放
      element.width = startWidth + deltaX
      element.height = startHeight + deltaY
      break
    case 's':
      // 下边缩放
      element.height = startHeight + deltaY
      break
    case 'e':
      // 右边缩放
      element.width = startWidth + deltaX
      break
    case 'n':
      // 上边缩放
      element.top = resizeStartPos.value.y + deltaY
      element.height = startHeight - deltaY
      break
    case 'w':
      // 左边缩放
      element.left = resizeStartPos.value.x + deltaX
      element.width = startWidth - deltaX
      break
    case 'nw':
      // 左上角缩放
      element.left = resizeStartPos.value.x + deltaX
      element.top = resizeStartPos.value.y + deltaY
      element.width = startWidth - deltaX
      element.height = startHeight - deltaY
      break
    case 'ne':
      // 右上角缩放
      element.top = resizeStartPos.value.y + deltaY
      element.width = startWidth + deltaX
      element.height = startHeight - deltaY
      break
    case 'sw':
      // 左下角缩放
      element.left = resizeStartPos.value.x + deltaX
      element.width = startWidth - deltaX
      element.height = startHeight + deltaY
      break
  }

  emit('element-update', element)
}

// 缩放移动（全局事件）
const onResizeMove = (event: MouseEvent) => {
  handleResizeMove(event)
}

// 缩放结束
const onResizeEnd = () => {
  isResizing.value = false
  currentResizeElement.value = null
  resizeDirection.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// 处理人物关节鼠标按下事件
const onHumanJointMouseDown = (event: MouseEvent, element: CanvasElement) => {
  if (!props.editMode) return
  event.stopPropagation()

  // 这里可以添加人物关节旋转的逻辑
  selectElement(element.id)
}

// 选择元素
const selectElement = (id: string) => {
  emit('element-select', id)
}

// 添加文本元素
const addTextElement = (left: number, top: number) => {
  emit('element-add', {
    type: 'text',
    left,
    top,
    width: 200,
    height: 50,
    content: '',
    fontSize: 16,
  })
}

// 添加矩形框元素
const addRectElement = (rect: { left: number; top: number; width: number; height: number }) => {
  emit('element-add', {
    type: 'rect',
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    color: props.colorList[props.currentColorIndex],
  })
}

// 添加数字标元素
const addNumberElement = (left: number, top: number) => {
  const numberSize = 32
  emit('element-add', {
    type: 'number',
    number: props.currentNumber,
    left: left - numberSize / 2,
    top: top - numberSize / 2,
    width: numberSize,
    height: numberSize,
  })
  emit('number-update', props.currentNumber + 1)
}

// 添加图片元素
const addImageElement = (asset: Asset, left: number, top: number) => {
  emit('element-add', {
    type: 'image',
    url: asset.url,
    name: asset.name,
    left,
    top,
    width: 200,
    height: 200,
  })
}

// 添加人物元素
const addHumanElement = (asset: Pose, left: number, top: number) => {
  emit('element-add', {
    type: 'human',
    left,
    top,
    width: 150,
    height: 250,
    figureType: 'cartoon',
    pose: asset.poseId,
  })
}

// 更新文本内容
const updateTextContent = (event: Event, id: string) => {
  // 中文输入过程中不更新内容
  if (isComposing.value) return

  emit('text-update', event, id)
}

// 中文输入开始
const onCompositionStart = () => {
  isComposing.value = true
  emit('composition-start')
}

// 中文输入结束
const onCompositionEnd = (event: CompositionEvent, id: string) => {
  isComposing.value = false
  emit('composition-end', event, id)
}

// 暴露画布引用，供父组件使用
defineExpose({
  canvasRef,
})
</script>
