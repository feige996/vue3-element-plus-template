<template>
  <div class="flex-1 bg-gray-200 p-3 overflow-auto h-full box-border">
    <div
      ref="canvasRef"
      class="w-full h-full bg-white border border-gray-300 relative"
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

      <!-- 临时绘制的画笔路径 -->
      <svg
        v-if="isDrawingBrush && brushPoints.length > 1"
        class="absolute pointer-events-none"
        :style="{ left: '0', top: '0', width: '100%', height: '100%' }"
      >
        <polyline
          :points="brushPoints.map((p) => `${p.x},${p.y}`).join(' ')"
          fill="none"
          :stroke="colorList[currentColorIndex]"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- 临时绘制的箭头 -->
      <svg
        v-if="isDrawingArrow"
        class="absolute pointer-events-none"
        :style="{ left: '0', top: '0', width: '100%', height: '100%' }"
      >
        <line
          :x1="arrowStartPos.x"
          :y1="arrowStartPos.y"
          :x2="arrowEndPos.x"
          :y2="arrowEndPos.y"
          :stroke="colorList[currentColorIndex]"
          stroke-width="3"
          stroke-linecap="round"
        />
        <polygon
          :points="getArrowHeadPoints(arrowStartPos, arrowEndPos)"
          :fill="colorList[currentColorIndex]"
        />
      </svg>

      <!-- 临时绘制的圆形框 -->
      <div
        v-if="isDrawingCircle && circleRadius > 0"
        class="absolute border-2 border-solid pointer-events-none"
        :style="{
          left: `${circleCenterPos.x - circleRadius}px`,
          top: `${circleCenterPos.y - circleRadius}px`,
          width: `${circleRadius * 2}px`,
          height: `${circleRadius * 2}px`,
          borderColor: colorList[currentColorIndex],
          borderRadius: '50%',
          backgroundColor: 'transparent',
        }"
      ></div>

      <!-- 临时绘制的直线 -->
      <svg
        v-if="isDrawingLine"
        class="absolute pointer-events-none"
        :style="{ left: '0', top: '0', width: '100%', height: '100%' }"
      >
        <line
          :x1="lineStartPos.x"
          :y1="lineStartPos.y"
          :x2="lineEndPos.x"
          :y2="lineEndPos.y"
          :stroke="colorList[currentColorIndex]"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件名称：CanvasContainer（避免单词组件名警告）
import { ref } from 'vue'
import CanvasElement from './CanvasElement.vue'
import type { CanvasElement as CanvasElementType, ToolType } from '../typing'

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
  canvasElements: CanvasElementType[]
  selectedElementId: string | null
  activeTool?: ToolType | null
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
  'element-add': [element: Partial<CanvasElementType>]
  'element-update': [element: CanvasElementType]
  'element-delete': [id: string]
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
const currentDragElement = ref<CanvasElementType | null>(null)
const currentResizeElement = ref<CanvasElementType | null>(null)
const resizeDirection = ref<'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// 矩形框绘制状态
const drawStartPos = ref({ x: 0, y: 0 })
const tempRect = ref<{ left: number; top: number; width: number; height: number } | null>(null)

// 画笔绘制状态
const isDrawingBrush = ref(false)
const brushPoints = ref<{ x: number; y: number }[]>([])

// 箭头绘制状态
const isDrawingArrow = ref(false)
const arrowStartPos = ref({ x: 0, y: 0 })
const arrowEndPos = ref({ x: 0, y: 0 })

// 圆形框绘制状态
const isDrawingCircle = ref(false)
const circleCenterPos = ref({ x: 0, y: 0 })
const circleRadius = ref(0)

// 直线绘制状态
const isDrawingLine = ref(false)
const lineStartPos = ref({ x: 0, y: 0 })
const lineEndPos = ref({ x: 0, y: 0 })

// 擦除工具状态
const isErasing = ref(false)
const erasedElementIds = ref<string[]>([])

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
    case 'brush':
      // 开始绘制画笔
      isDrawingBrush.value = true
      brushPoints.value = [{ x: left, y: top }]
      break
    case 'arrow':
      // 开始绘制箭头
      isDrawingArrow.value = true
      arrowStartPos.value = { x: left, y: top }
      arrowEndPos.value = { x: left, y: top }
      break
    case 'circle':
      // 开始绘制圆形框
      isDrawingCircle.value = true
      circleCenterPos.value = { x: left, y: top }
      circleRadius.value = 0
      break
    case 'line':
      // 开始绘制直线
      isDrawingLine.value = true
      lineStartPos.value = { x: left, y: top }
      lineEndPos.value = { x: left, y: top }
      break
    case 'eraser':
      // 开始擦除
      isErasing.value = true
      erasedElementIds.value = []
      // 检查鼠标位置是否在某个元素上
      const clickedElement = findElementAtPosition(left, top)
      if (clickedElement) {
        erasedElementIds.value.push(clickedElement.id)
        emit('element-delete', clickedElement.id)
      }
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

  // 处理画笔绘制
  if (isDrawingBrush.value && canvasRef.value) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    brushPoints.value.push({ x, y })
  }

  // 处理箭头绘制
  if (isDrawingArrow.value && canvasRef.value) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    arrowEndPos.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  // 处理圆形框绘制
  if (isDrawingCircle.value && canvasRef.value) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top
    const dx = currentX - circleCenterPos.value.x
    const dy = currentY - circleCenterPos.value.y
    circleRadius.value = Math.sqrt(dx * dx + dy * dy)
  }

  // 处理直线绘制
  if (isDrawingLine.value && canvasRef.value) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    lineEndPos.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  // 处理擦除
  if (isErasing.value && canvasRef.value) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const element = findElementAtPosition(x, y)
    if (element && !erasedElementIds.value.includes(element.id)) {
      erasedElementIds.value.push(element.id)
      emit('element-delete', element.id)
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

  // 结束画笔绘制
  if (isDrawingBrush.value && brushPoints.value.length > 1) {
    addBrushElement(brushPoints.value)
    isDrawingBrush.value = false
    brushPoints.value = []
  } else if (isDrawingBrush.value) {
    isDrawingBrush.value = false
    brushPoints.value = []
  }

  // 结束箭头绘制
  if (isDrawingArrow.value) {
    const dx = arrowEndPos.value.x - arrowStartPos.value.x
    const dy = arrowEndPos.value.y - arrowStartPos.value.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > 10) {
      addArrowElement(arrowStartPos.value, arrowEndPos.value)
    }
    isDrawingArrow.value = false
  }

  // 结束圆形框绘制
  if (isDrawingCircle.value && circleRadius.value > 10) {
    addCircleElement(circleCenterPos.value, circleRadius.value)
    isDrawingCircle.value = false
    circleRadius.value = 0
  } else if (isDrawingCircle.value) {
    isDrawingCircle.value = false
    circleRadius.value = 0
  }

  // 结束直线绘制
  if (isDrawingLine.value) {
    const dx = lineEndPos.value.x - lineStartPos.value.x
    const dy = lineEndPos.value.y - lineStartPos.value.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > 10) {
      addLineElement(lineStartPos.value, lineEndPos.value)
    }
    isDrawingLine.value = false
  }

  // 结束擦除
  if (isErasing.value) {
    isErasing.value = false
    erasedElementIds.value = []
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
    // 使用拖拽数据中的缩略图尺寸
    const thumbnailWidth = dragData.thumbnailWidth || 200
    const thumbnailHeight = dragData.thumbnailHeight || 200
    addImageElement(asset, left, top, thumbnailWidth, thumbnailHeight)
  } else if (asset.type === 'pose') {
    addHumanElement(asset, left, top)
  }

  emit('drop', event, asset)
}

// 处理元素鼠标按下（拖拽开始）
const onElementMouseDown = (event: MouseEvent, element: CanvasElementType) => {
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
  element: CanvasElementType,
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
const onHumanJointMouseDown = (event: MouseEvent, element: CanvasElementType) => {
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
    strokeWidth: 2,
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
const addImageElement = (
  asset: Asset,
  left: number,
  top: number,
  realWidth: number,
  realHeight: number,
) => {
  emit('element-add', {
    type: 'image',
    url: asset.url,
    name: asset.name,
    left,
    top,
    width: realWidth,
    height: realHeight,
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

// 计算箭头头部坐标
const getArrowHeadPoints = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const headLength = 15
  const angle = Math.atan2(end.y - start.y, end.x - start.x)

  const x1 = end.x - headLength * Math.cos(angle - Math.PI / 6)
  const y1 = end.y - headLength * Math.sin(angle - Math.PI / 6)
  const x2 = end.x - headLength * Math.cos(angle + Math.PI / 6)
  const y2 = end.y - headLength * Math.sin(angle + Math.PI / 6)

  return `${end.x},${end.y} ${x1},${y1} ${x2},${y2}`
}

// 添加画笔元素
const addBrushElement = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return

  const minX = Math.min(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y))
  const maxX = Math.max(...points.map((p) => p.x))
  const maxY = Math.max(...points.map((p) => p.y))

  const width = maxX - minX
  const height = maxY - minY

  emit('element-add', {
    type: 'brush',
    left: minX,
    top: minY,
    width: width || 1,
    height: height || 1,
    points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    color: props.colorList[props.currentColorIndex],
    strokeWidth: 3,
  })
}

// 添加箭头元素
const addArrowElement = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const minX = Math.min(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxX = Math.max(start.x, end.x)
  const maxY = Math.max(start.y, end.y)

  emit('element-add', {
    type: 'arrow',
    left: minX,
    top: minY,
    width: maxX - minX || 1,
    height: maxY - minY || 1,
    startX: start.x - minX,
    startY: start.y - minY,
    endX: end.x - minX,
    endY: end.y - minY,
    color: props.colorList[props.currentColorIndex],
    strokeWidth: 3,
  })
}

// 添加圆形框元素
const addCircleElement = (center: { x: number; y: number }, radius: number) => {
  emit('element-add', {
    type: 'circle',
    left: center.x - radius,
    top: center.y - radius,
    width: radius * 2,
    height: radius * 2,
    radiusX: radius,
    radiusY: radius,
    color: props.colorList[props.currentColorIndex],
    strokeWidth: 2,
  })
}

// 添加直线元素
const addLineElement = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const minX = Math.min(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxX = Math.max(start.x, end.x)
  const maxY = Math.max(start.y, end.y)

  emit('element-add', {
    type: 'line',
    left: minX,
    top: minY,
    width: maxX - minX || 1,
    height: maxY - minY || 1,
    startX: start.x - minX,
    startY: start.y - minY,
    endX: end.x - minX,
    endY: end.y - minY,
    color: props.colorList[props.currentColorIndex],
    strokeWidth: 3,
  })
}

// 查找指定位置的元素
const findElementAtPosition = (x: number, y: number): CanvasElementType | null => {
  // 从后往前遍历，优先选择最上层的元素
  for (let i = props.canvasElements.length - 1; i >= 0; i--) {
    const element = props.canvasElements[i]
    if (!element) continue

    const elementRight = element.left + (element.width || 0)
    const elementBottom = element.top + (element.height || 0)

    if (x >= element.left && x <= elementRight && y >= element.top && y <= elementBottom) {
      return element
    }
  }
  return null
}

// 暴露画布引用，供父组件使用
defineExpose({
  canvasRef,
})
</script>
