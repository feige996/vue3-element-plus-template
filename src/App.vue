<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左侧资产列表 -->
    <div class="w-64 bg-white border-r border-gray-200 overflow-hidden">
      <h2 class="p-4 text-lg font-semibold bg-gray-50 border-b border-gray-200">资产列表</h2>
      <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
        <div
          v-for="(asset, index) in assets"
          :key="index"
          class="cursor-move border border-gray-200 rounded hover:shadow-md transition-shadow"
          draggable="true"
          @dragstart="onDragStart($event, asset)"
        >
          <img :src="asset.url" :alt="asset.name" class="w-full h-32 object-cover" />
          <div class="p-2 text-sm text-center">
            {{ asset.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 中间画布区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 工具栏 -->
      <div class="h-12 bg-white border-b border-gray-200 flex items-center px-4 space-x-2">
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'text' ? null : 'text'"
          :class="{ 'ring-2 ring-blue-400': activeTool === 'text' }"
        >
          文本框
        </button>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'rect' ? null : 'rect'"
          :class="{ 'ring-2 ring-blue-400': activeTool === 'rect' }"
        >
          矩形框
        </button>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'number' ? null : 'number'"
          :class="{ 'ring-2 ring-blue-400': activeTool === 'number' }"
        >
          数字标
        </button>
        <div class="w-px h-6 bg-gray-300 mx-2"></div>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="editMode = !editMode"
          :class="{ 'ring-2 ring-blue-400': editMode }"
        >
          {{ editMode ? '编辑' : '浏览' }}
        </button>
      </div>
      <!-- 画布区域 -->
      <div class="flex-1 bg-gray-200 p-4 overflow-hidden">
        <div
          ref="canvasRef"
          class="w-full h-full bg-white border border-gray-300 relative"
          @dragover.prevent
          @drop="onDrop"
          @click="onCanvasClick"
        >
          <!-- 画布元素 -->
          <div
            v-for="element in canvasElements"
            :key="element.id"
            :class="['absolute', { 'ring-2 ring-blue-400': selectedElementId === element.id }]"
            :style="getElementStyle(element)"
            @click.stop="activeTool ? undefined : selectElement(element.id)"
            @mousedown="onElementMouseDown($event, element)"
          >
            <!-- 图片元素 -->
            <img
              v-if="element.type === 'image'"
              :src="element.url"
              :alt="element.name"
              class="w-full h-full object-cover"
            />
            <!-- 文本框元素 -->
            <div
              v-else-if="element.type === 'text'"
              contenteditable="true"
              class="w-full h-full p-2 outline-none"
              @input="updateTextContent($event, element.id)"
            >
              {{ element.content }}
            </div>
            <!-- 矩形框元素 -->
            <div
              v-else-if="element.type === 'rect'"
              class="w-full h-full"
              :style="{ backgroundColor: element.color }"
            ></div>
            <!-- 数字标元素 -->
            <div
              v-else-if="element.type === 'number'"
              class="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full font-bold"
            >
              {{ element.number }}
            </div>

            <!-- 缩放控制点 -->
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ left: '-6px', top: '-6px', cursor: 'nwse-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'nw')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ left: 'calc(50% - 6px)', top: '-6px', cursor: 'ns-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'n')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ right: '-6px', top: '-6px', cursor: 'nesw-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'ne')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ right: '-6px', top: 'calc(50% - 6px)', cursor: 'ew-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'e')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ right: '-6px', bottom: '-6px', cursor: 'nwse-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'se')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ left: 'calc(50% - 6px)', bottom: '-6px', cursor: 'ns-resize' }"
              @mousedown.stop="onResizeStart($event, element, 's')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ left: '-6px', bottom: '-6px', cursor: 'nesw-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'sw')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"
              :style="{ left: '-6px', top: 'calc(50% - 6px)', cursor: 'ew-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'w')"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <div class="w-64 bg-white border-l border-gray-200 overflow-hidden">
      <h2 class="p-4 text-lg font-semibold bg-gray-50 border-b border-gray-200">属性面板</h2>
      <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
        <!-- 属性面板内容 -->
        <div v-if="selectedElement">
          <!-- 矩形框属性 -->
          <div v-if="selectedElement.type === 'rect'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <select
                v-model="selectedElement.color"
                class="w-full p-1 border border-gray-300 rounded"
              >
                <option v-for="color in colorList" :key="color" :value="color">
                  {{ color }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
                <input
                  type="number"
                  v-model.number="selectedElement.width"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">高度</label>
                <input
                  type="number"
                  v-model.number="selectedElement.height"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <!-- 文本框属性 -->
          <div v-else-if="selectedElement.type === 'text'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <input
                type="color"
                v-model="selectedElement.color"
                class="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          </div>

          <!-- 数字标属性 -->
          <div v-else-if="selectedElement.type === 'number'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">数值</label>
              <input
                type="number"
                v-model.number="selectedElement.number"
                class="w-full p-1 border border-gray-300 rounded"
              />
            </div>
          </div>

          <!-- 通用属性 -->
          <div class="mt-4">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">左偏移</label>
                <input
                  type="number"
                  v-model.number="selectedElement.left"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">上偏移</label>
                <input
                  type="number"
                  v-model.number="selectedElement.top"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-8">请选择一个元素</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 资产数据类型定义
interface Asset {
  id: number
  name: string
  url: string
}

// 画布元素数据类型定义
interface CanvasElement {
  id: string
  type: 'image' | 'text' | 'rect' | 'number'
  left: number
  top: number
  width?: number
  height?: number
  url?: string
  name?: string
  content?: string
  color?: string
  number?: number
  aspectRatio?: number // 宽高比，仅用于图片元素
}

// 资产列表数据
const assets = ref<Asset[]>([
  {
    id: 1,
    name: '示例图片1',
    url: 'https://picsum.photos/300/200?random=1',
  },
  {
    id: 2,
    name: '示例图片2',
    url: 'https://picsum.photos/300/200?random=2',
  },
  {
    id: 3,
    name: '示例图片3',
    url: 'https://picsum.photos/300/200?random=3',
  },
  {
    id: 4,
    name: '示例图片4',
    url: 'https://picsum.photos/300/200?random=4',
  },
  {
    id: 5,
    name: '示例图片5',
    url: 'https://picsum.photos/300/200?random=5',
  },
])

// 画布元素列表
const canvasElements = ref<CanvasElement[]>([])

// 当前选中的元素ID
const selectedElementId = ref<string | null>(null)

// 活跃工具
const activeTool = ref<'text' | 'rect' | 'number' | null>(null)

// 编辑模式
const editMode = ref(true)

// 画布引用
const canvasRef = ref<HTMLElement | null>(null)

// 颜色列表
const colorList = ref<string[]>(['red', 'green', 'blue', 'yellow', 'purple', 'black', 'white'])

// 当前颜色索引
const currentColorIndex = ref(0)

// 当前数字标序号
const currentNumber = ref(1)

// 拖拽状态管理
const isDragging = ref(false)
const isResizing = ref(false)
const currentDragElement = ref<CanvasElement | null>(null)
const currentResizeElement = ref<CanvasElement | null>(null)
const resizeDirection = ref<'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// 拖拽开始处理
const onDragStart = (event: DragEvent, asset: Asset) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('asset', JSON.stringify(asset))
  }
}

// 元素拖拽开始
const onElementMouseDown = (event: MouseEvent, element: CanvasElement) => {
  if (!editMode.value) return
  event.stopPropagation()

  // 如果有活跃工具，不执行拖拽操作，允许创建新元素
  if (activeTool.value) return

  // 如果点击的是元素内容而不是缩放控制点，开始拖拽
  if (event.target instanceof HTMLElement && !event.target.classList.contains('resize-handle')) {
    isDragging.value = true
    currentDragElement.value = element
    dragStartPos.value = { x: event.clientX, y: event.clientY }
    selectElement(element.id)

    // 添加全局事件监听
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
  }
}

// 拖拽移动
const onDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !currentDragElement.value || !canvasRef.value) return

  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  currentDragElement.value.left += deltaX
  currentDragElement.value.top += deltaY

  dragStartPos.value = { x: event.clientX, y: event.clientY }
}

// 拖拽结束
const onDragEnd = () => {
  isDragging.value = false
  currentDragElement.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// 缩放开始
const onResizeStart = (
  event: MouseEvent,
  element: CanvasElement,
  direction: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
) => {
  if (!editMode.value) return
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
const onResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !currentResizeElement.value || !resizeDirection.value) return

  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y

  const element = currentResizeElement.value
  const startWidth = resizeStartSize.value.width
  const startHeight = resizeStartSize.value.height

  // 保存原始宽高比
  const aspectRatio = element.aspectRatio || startWidth / startHeight

  switch (resizeDirection.value) {
    case 'nw':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newWidth = Math.max(10, startWidth - deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += deltaX
        element.top += newHeight - startHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth - deltaX)
        element.height = Math.max(10, startHeight - deltaY)
        element.left += deltaX
        element.top += deltaY
      }
      break
    case 'n':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newHeight = Math.max(10, startHeight - deltaY)
        const newWidth = newHeight * aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.top += deltaY
        element.left += (startWidth - newWidth) / 2
      } else {
        // 其他元素自由缩放
        element.height = Math.max(10, startHeight - deltaY)
        element.top += deltaY
      }
      break
    case 'ne':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newWidth = Math.max(10, startWidth + deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.top += newHeight - startHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth + deltaX)
        element.height = Math.max(10, startHeight - deltaY)
        element.top += deltaY
      }
      break
    case 'e':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newWidth = Math.max(10, startWidth + deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth + deltaX)
      }
      break
    case 'se':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newWidth = Math.max(10, startWidth + deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth + deltaX)
        element.height = Math.max(10, startHeight + deltaY)
      }
      break
    case 's':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newHeight = Math.max(10, startHeight + deltaY)
        const newWidth = newHeight * aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += (startWidth - newWidth) / 2
      } else {
        // 其他元素自由缩放
        element.height = Math.max(10, startHeight + deltaY)
      }
      break
    case 'sw':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newWidth = Math.max(10, startWidth - deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += deltaX
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth - deltaX)
        element.height = Math.max(10, startHeight + deltaY)
        element.left += deltaX
      }
      break
    case 'w':
      if (element.type === 'image' && element.aspectRatio) {
        // 图片保持宽高比
        const newWidth = Math.max(10, startWidth - deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += deltaX
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth - deltaX)
        element.left += deltaX
      }
      break
  }
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

// 拖拽结束处理
const onDrop = (event: DragEvent) => {
  if (!canvasRef.value || !event.dataTransfer) return

  const assetStr = event.dataTransfer.getData('asset')
  if (assetStr) {
    const asset = JSON.parse(assetStr) as Asset
    const rect = canvasRef.value.getBoundingClientRect()
    const left = event.clientX - rect.left
    const top = event.clientY - rect.top

    // 创建临时图片对象获取原始宽高比
    const img = new Image()
    img.onload = () => {
      const aspectRatio = img.width / img.height
      // 设置初始宽度为200，高度根据宽高比计算
      const initialWidth = 200
      const initialHeight = initialWidth / aspectRatio

      // 添加图片元素到画布
      addCanvasElement({
        type: 'image',
        url: asset.url,
        name: asset.name,
        left,
        top,
        width: initialWidth,
        height: initialHeight,
        aspectRatio, // 保存宽高比
      })
    }
    img.src = asset.url
  }
}

// 画布点击处理
const onCanvasClick = (event: MouseEvent) => {
  if (!canvasRef.value || !editMode.value || !activeTool.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const left = event.clientX - rect.left
  const top = event.clientY - rect.top

  switch (activeTool.value) {
    case 'text':
      addCanvasElement({
        type: 'text',
        content: '输入文本',
        color: '#000000',
        left,
        top,
        width: 150,
        height: 50,
      })
      break
    case 'rect':
      addCanvasElement({
        type: 'rect',
        color: colorList.value[currentColorIndex.value],
        left,
        top,
        width: 100,
        height: 100,
      })
      // 更新颜色索引
      currentColorIndex.value = (currentColorIndex.value + 1) % colorList.value.length
      break
    case 'number':
      addCanvasElement({
        type: 'number',
        number: currentNumber.value,
        left,
        top,
        width: 32,
        height: 32,
      })
      // 更新数字标序号
      currentNumber.value++
      break
  }
}

// 添加画布元素
const addCanvasElement = (element: Partial<CanvasElement>) => {
  const newElement: CanvasElement = {
    id: `element-${Date.now()}`,
    type: element.type || 'text',
    left: element.left || 0,
    top: element.top || 0,
    width: element.width || 100,
    height: element.height || 100,
    ...element,
  }
  canvasElements.value.push(newElement)
  selectedElementId.value = newElement.id
  // 不再自动重置activeTool，保持工具激活状态
}

// 选择元素
const selectElement = (id: string) => {
  selectedElementId.value = id
}

// 获取选中的元素
const selectedElement = computed(() => {
  return canvasElements.value.find((el) => el.id === selectedElementId.value) || null
})

// 获取元素样式
const getElementStyle = (element: CanvasElement) => {
  return {
    left: `${element.left}px`,
    top: `${element.top}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    color: element.color,
    position: 'absolute' as const,
  }
}

// 更新文本内容
const updateTextContent = (event: Event, id: string) => {
  const element = canvasElements.value.find((el) => el.id === id)
  if (element && element.type === 'text') {
    element.content = (event.target as HTMLElement).innerText
  }
}
</script>
