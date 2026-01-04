<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'

// 定义画布元素类型
type CanvasElement = {
  id: string
  type: 'image' | 'box'
  x: number
  y: number
  width: number
  height: number
  imageUrl?: string
  text?: string
  selected: boolean
}

// 画布引用
const canvasRef = ref<HTMLElement | null>(null)

// 画布元素列表
const canvasElements = ref<CanvasElement[]>([])

// 当前操作状态
const currentState = reactive({
  isDragging: false,
  isResizing: false,
  dragStartX: 0,
  dragStartY: 0,
  currentElement: null as CanvasElement | null,
  resizeHandle: '',
})

// 框选起始位置
const boxSelectStart = reactive({ x: 0, y: 0 })
const isBoxSelecting = ref(false)

// 计算当前选中的元素
const selectedElement = computed(() => {
  return canvasElements.value.find((el) => el.selected)
})

// 生成唯一ID
const generateId = () => {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 处理拖拽上传图片
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (canvasRef.value) {
    canvasRef.value.classList.add('border-4', 'border-blue-500')
  }
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (canvasRef.value) {
    canvasRef.value.classList.remove('border-4', 'border-blue-500')
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (canvasRef.value) {
    canvasRef.value.classList.remove('border-4', 'border-blue-500')
  }

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // 获取画布位置
          if (!canvasRef.value) return

          const canvasRect = canvasRef.value.getBoundingClientRect()
          const x = ((e.clientX - canvasRect.left - img.width / 2) / canvasRect.width) * 100
          const y = ((e.clientY - canvasRect.top - img.height / 2) / canvasRect.height) * 100

          // 添加图片到画布
          canvasElements.value.push({
            id: generateId(),
            type: 'image',
            x: Math.max(0, Math.min(100 - (img.width / canvasRect.width) * 100, x)),
            y: Math.max(0, Math.min(100 - (img.height / canvasRect.height) * 100, y)),
            width: (img.width / canvasRect.width) * 100,
            height: (img.height / canvasRect.height) * 100,
            imageUrl: event.target?.result as string,
            selected: false,
          })
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }
}

// 处理画布点击，用于选择元素或开始框选
const handleCanvasClick = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const x = ((e.clientX - canvasRect.left) / canvasRect.width) * 100
  const y = ((e.clientY - canvasRect.top) / canvasRect.height) * 100

  // 检查是否点击了某个元素
  let clickedElement = null
  for (let i = canvasElements.value.length - 1; i >= 0; i--) {
    const el = canvasElements.value[i]
    if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
      clickedElement = el
      break
    }
  }

  // 更新选中状态
  canvasElements.value.forEach((el) => {
    el.selected = el === clickedElement
  })

  // 如果没有点击到元素，开始框选
  if (!clickedElement) {
    isBoxSelecting.value = true
    boxSelectStart.x = x
    boxSelectStart.y = y
  }
}

// 处理鼠标移动，用于框选或拖拽
const handleMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const x = ((e.clientX - canvasRect.left) / canvasRect.width) * 100
  const y = ((e.clientY - canvasRect.top) / canvasRect.height) * 100

  if (isBoxSelecting.value) {
    // 正在框选，不做其他操作
    return
  }

  if (currentState.isDragging && currentState.currentElement) {
    // 拖拽元素
    const dx = x - currentState.dragStartX
    const dy = y - currentState.dragStartY

    currentState.currentElement.x += dx
    currentState.currentElement.y += dy

    // 确保元素不超出画布
    currentState.currentElement.x = Math.max(0, currentState.currentElement.x)
    currentState.currentElement.y = Math.max(0, currentState.currentElement.y)
    currentState.currentElement.x = Math.min(
      100 - currentState.currentElement.width,
      currentState.currentElement.x,
    )
    currentState.currentElement.y = Math.min(
      100 - currentState.currentElement.height,
      currentState.currentElement.y,
    )

    currentState.dragStartX = x
    currentState.dragStartY = y
  }

  if (currentState.isResizing && currentState.currentElement) {
    // 缩放元素
    const dx = x - currentState.dragStartX
    const dy = y - currentState.dragStartY

    switch (currentState.resizeHandle) {
      case 'ne':
        currentState.currentElement.width += dx
        currentState.currentElement.height -= dy
        currentState.currentElement.y += dy
        break
      case 'se':
        currentState.currentElement.width += dx
        currentState.currentElement.height += dy
        break
      case 'sw':
        currentState.currentElement.width -= dx
        currentState.currentElement.height += dy
        currentState.currentElement.x += dx
        break
      case 'nw':
        currentState.currentElement.width -= dx
        currentState.currentElement.height -= dy
        currentState.currentElement.x += dx
        currentState.currentElement.y += dy
        break
    }

    // 确保元素大小不小于最小值
    currentState.currentElement.width = Math.max(5, currentState.currentElement.width)
    currentState.currentElement.height = Math.max(5, currentState.currentElement.height)

    // 确保元素不超出画布
    currentState.currentElement.x = Math.max(0, currentState.currentElement.x)
    currentState.currentElement.y = Math.max(0, currentState.currentElement.y)
    currentState.currentElement.x = Math.min(
      100 - currentState.currentElement.width,
      currentState.currentElement.x,
    )
    currentState.currentElement.y = Math.min(
      100 - currentState.currentElement.height,
      currentState.currentElement.y,
    )

    currentState.dragStartX = x
    currentState.dragStartY = y
  }
}

// 处理鼠标释放，用于完成框选或拖拽
const handleMouseUp = (e: MouseEvent) => {
  if (!canvasRef.value) return

  if (isBoxSelecting.value) {
    // 完成框选
    const canvasRect = canvasRef.value.getBoundingClientRect()
    const x = ((e.clientX - canvasRect.left) / canvasRect.width) * 100
    const y = ((e.clientY - canvasRect.top) / canvasRect.height) * 100

    const width = Math.abs(x - boxSelectStart.x)
    const height = Math.abs(y - boxSelectStart.y)
    const startX = Math.min(x, boxSelectStart.x)
    const startY = Math.min(y, boxSelectStart.y)

    // 创建新的框选元素
    if (width > 2 && height > 2) {
      canvasElements.value.push({
        id: generateId(),
        type: 'box',
        x: startX,
        y: startY,
        width: width,
        height: height,
        selected: true,
        text: '',
      })
    }

    isBoxSelecting.value = false
  }

  // 结束拖拽或缩放
  currentState.isDragging = false
  currentState.isResizing = false
  currentState.currentElement = null
}

// 处理元素拖拽开始
const handleElementDragStart = (e: MouseEvent, element: CanvasElement) => {
  e.stopPropagation()

  // 确保该元素被选中
  canvasElements.value.forEach((el) => {
    el.selected = el === element
  })

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  currentState.isDragging = true
  currentState.currentElement = element
  currentState.dragStartX = ((e.clientX - canvasRect.left) / canvasRect.width) * 100
  currentState.dragStartY = ((e.clientY - canvasRect.top) / canvasRect.height) * 100
}

// 处理元素缩放开始
const handleResizeStart = (e: MouseEvent, element: CanvasElement, handle: string) => {
  e.stopPropagation()

  // 确保该元素被选中
  canvasElements.value.forEach((el) => {
    el.selected = el === element
  })

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  currentState.isResizing = true
  currentState.currentElement = element
  currentState.resizeHandle = handle
  currentState.dragStartX = ((e.clientX - canvasRect.left) / canvasRect.width) * 100
  currentState.dragStartY = ((e.clientY - canvasRect.top) / canvasRect.height) * 100
}

// 更新元素文字
const updateElementText = (element: CanvasElement, text: string) => {
  element.text = text
}

// 生成AI提示词
const generatePrompt = () => {
  const imageElements = canvasElements.value.filter((el) => el.type === 'image')
  const boxElements = canvasElements.value.filter((el) => el.type === 'box')

  let prompt = '根据以下图片和描述生成图像：'

  if (imageElements.length > 0) {
    prompt += ' 参考图片：'
    imageElements.forEach((img, index) => {
      prompt += `图片${index + 1} `
    })
  }

  if (boxElements.length > 0) {
    prompt += ' 区域描述：'
    boxElements.forEach((box, index) => {
      if (box.text) {
        prompt += `${box.text} `
      }
    })
  }

  return prompt
}

// 组件挂载后初始化事件监听
onMounted(() => {
  if (canvasRef.value) {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
})
</script>

<template>
  <div class="w-full max-w-6xl mx-auto p-4">
    <!-- 标题 -->
    <h2 class="text-2xl font-bold mb-4 text-center">AIGC多控制条件画布式引导生成</h2>

    <!-- 画布区域 -->
    <div
      ref="canvasRef"
      class="relative w-full h-[600px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @mousedown="handleCanvasClick"
    >
      <!-- 提示文字 -->
      <div
        v-if="canvasElements.length === 0"
        class="absolute inset-0 flex items-center justify-center text-gray-500"
      >
        <div class="text-center">
          <div class="text-4xl mb-2">📁</div>
          <p>请将图片拖入画布，或点击画布创建框选区域</p>
        </div>
      </div>

      <!-- 框选预览 -->
      <div
        v-if="isBoxSelecting"
        class="absolute border-2 border-red-500 bg-red-50 border-solid opacity-50 pointer-events-none"
        :style="{
          left: `${Math.min(boxSelectStart.x, currentState.dragStartX || 0)}%`,
          top: `${Math.min(boxSelectStart.y, currentState.dragStartY || 0)}%`,
          width: `${Math.abs((currentState.dragStartX || 0) - boxSelectStart.x)}%`,
          height: `${Math.abs((currentState.dragStartY || 0) - boxSelectStart.y)}%`,
        }"
      ></div>

      <!-- 画布元素 -->
      <div
        v-for="element in canvasElements"
        :key="element.id"
        class="absolute transition-all duration-100"
        :class="{
          'border-2 border-solid border-blue-500': element.selected,
          'cursor-move': !currentState.isResizing,
        }"
        :style="{
          left: `${element.x}%`,
          top: `${element.y}%`,
          width: `${element.width}%`,
          height: `${element.height}%`,
        }"
        @mousedown="handleElementDragStart($event, element)"
      >
        <!-- 图片元素 -->
        <img
          v-if="element.type === 'image' && element.imageUrl"
          :src="element.imageUrl"
          class="w-full h-full object-contain"
          alt="拖拽图片"
        />

        <!-- 框选元素 -->
        <div
          v-else-if="element.type === 'box'"
          class="w-full h-full border-2 border-red-500 bg-transparent"
        ></div>

        <!-- 文字输入区域 -->
        <div
          v-if="element.type === 'box'"
          class="absolute -right-40 top-0 w-36 bg-white border border-gray-300 rounded p-2 shadow-lg"
        >
          <input
            type="text"
            v-model="element.text"
            placeholder="输入描述文字"
            class="w-full border border-gray-200 rounded p-1 text-sm"
            @mousedown.stop
          />
        </div>

        <!-- 缩放手柄 -->
        <div
          v-if="element.selected"
          class="absolute w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nwse-resize"
          style="top: -4px; left: -4px"
          @mousedown="handleResizeStart($event, element, 'nw')"
        ></div>
        <div
          v-if="element.selected"
          class="absolute w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nesw-resize"
          style="top: -4px; right: -4px"
          @mousedown="handleResizeStart($event, element, 'ne')"
        ></div>
        <div
          v-if="element.selected"
          class="absolute w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nwse-resize"
          style="bottom: -4px; right: -4px"
          @mousedown="handleResizeStart($event, element, 'se')"
        ></div>
        <div
          v-if="element.selected"
          class="absolute w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nesw-resize"
          style="bottom: -4px; left: -4px"
          @mousedown="handleResizeStart($event, element, 'sw')"
        ></div>
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <!-- 提示词预览 -->
      <div class="w-full md:w-2/3">
        <h3 class="text-lg font-semibold mb-2">生成的提示词：</h3>
        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {{ generatePrompt() }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-2">
        <el-button type="primary">生成图片</el-button>
        <el-button @click="canvasElements = []">清空画布</el-button>
      </div>
    </div>
  </div>
</template>
