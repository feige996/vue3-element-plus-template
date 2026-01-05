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
      <div
        ref="toolbarRef"
        class="h-12 bg-white border-b border-gray-200 flex items-center px-4 space-x-2"
      >
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'text' ? null : 'text'"
          :class="{
            'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'text',
          }"
        >
          文本框
        </button>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'rect' ? null : 'rect'"
          :class="{
            'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'rect',
          }"
        >
          矩形框
        </button>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'number' ? null : 'number'"
          :class="{
            'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'number',
          }"
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
        <button
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ml-2"
          @click="clearCanvas"
        >
          清空画布
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
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @mouseleave="onCanvasMouseUp"
        >
          <!-- 画布元素 -->
          <div
            v-for="element in canvasElements"
            :key="element.id"
            :class="['absolute', { 'ring-2 ring-blue-400': selectedElementId === element.id }]"
            :style="getElementStyle(element)"
            @click="activeTool ? onElementClick($event) : selectElement(element.id)"
            @mousedown="onElementMouseDown($event, element)"
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
              @input="updateTextContent($event, element.id)"
              @compositionstart="onCompositionStart"
              @compositionend="onCompositionEnd($event, element.id)"
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
              class="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full font-bold"
            >
              {{ element.number }}
            </div>

            <!-- 缩放控制点 -->
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ left: '-6px', top: '-6px', cursor: 'nwse-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'nw')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ left: 'calc(50% - 6px)', top: '-6px', cursor: 'ns-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'n')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ right: '-6px', top: '-6px', cursor: 'nesw-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'ne')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ right: '-6px', top: 'calc(50% - 6px)', cursor: 'ew-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'e')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ right: '-6px', bottom: '-6px', cursor: 'nwse-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'se')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ left: 'calc(50% - 6px)', bottom: '-6px', cursor: 'ns-resize' }"
              @mousedown.stop="onResizeStart($event, element, 's')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ left: '-6px', bottom: '-6px', cursor: 'nesw-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'sw')"
            ></div>
            <div
              v-if="selectedElementId === element.id && editMode"
              class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
              :style="{ left: '-6px', top: 'calc(50% - 6px)', cursor: 'ew-resize' }"
              @mousedown.stop="onResizeStart($event, element, 'w')"
            ></div>
          </div>

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
    </div>

    <!-- 右侧属性面板 -->
    <div class="w-64 bg-white border-l border-gray-200 overflow-hidden">
      <h2 class="p-4 text-lg font-semibold bg-gray-50 border-b border-gray-200">属性面板</h2>
      <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
        <!-- 属性面板内容 -->
        <div v-if="selectedElement">
          <!-- 删除按钮 -->
          <div class="mb-4">
            <button
              class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              @click="deleteElement"
            >
              删除元素
            </button>
          </div>

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

          <!-- 虚线框属性 -->
          <div v-else-if="selectedElement.type === 'dashed'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">比例</label>
              <select
                v-model="selectedElement.aspectRatio"
                class="w-full p-1 border border-gray-300 rounded"
                @change="updateDashedHeight"
              >
                <option :value="1">1:1</option>
                <option :value="16 / 9">16:9</option>
                <option :value="9 / 16">9:16</option>
                <option :value="4 / 3">4:3</option>
                <option :value="3 / 4">3:4</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-4">
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

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
              <input
                type="number"
                v-model.number="selectedElement.width"
                class="w-full p-1 border border-gray-300 rounded"
                @input="updateDashedHeight"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">高度（自适应）</label>
              <input
                type="number"
                :value="(selectedElement.width || 100) / (selectedElement.aspectRatio || 1)"
                class="w-full p-1 border border-gray-300 rounded bg-gray-50"
                readonly
              />
            </div>

            <div class="mt-6 mb-4">
              <button
                class="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                @click="captureAndSendScreenshot(selectedElement)"
                :disabled="isScreenshotLoading"
              >
                <span v-if="isScreenshotLoading" class="flex items-center justify-center">
                  <span class="animate-spin mr-2">⏳</span> 截图中...
                </span>
                <span v-else>重新截图</span>
              </button>
            </div>

            <!-- 截图预览，放在最下面 -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">截图预览</label>
              <div class="border border-gray-300 rounded p-2 bg-gray-50 relative">
                <!-- 截图loading状态 -->
                <div
                  v-if="isScreenshotLoading"
                  class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded"
                >
                  <div class="flex flex-col items-center">
                    <span class="animate-spin text-2xl mb-2">⏳</span>
                    <span class="text-sm text-gray-600">截图生成中...</span>
                  </div>
                </div>

                <!-- 截图内容 -->
                <img
                  v-if="selectedElement.screenshot"
                  :src="selectedElement.screenshot"
                  alt="截图预览"
                  class="w-full h-auto rounded"
                />
                <div v-else-if="!isScreenshotLoading" class="text-center text-gray-400 py-8">
                  点击"重新截图"按钮生成截图
                </div>
              </div>
            </div>
          </div>

          <!-- 通用属性 -->
          <div v-if="selectedElement.type !== 'dashed'" class="mt-4">
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

<style scoped>
/* contenteditable元素的placeholder样式 */
:deep([contenteditable='true']):empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 资产数据类型定义
interface Asset {
  id: number
  name: string
  url: string
}

// 画布元素数据类型定义
interface CanvasElement {
  id: string
  type: 'image' | 'text' | 'rect' | 'dashed' | 'number'
  left: number
  top: number
  width?: number
  height?: number
  url?: string
  name?: string
  content?: string
  color?: string
  number?: number
  aspectRatio?: number // 宽高比，仅用于图片和虚线框元素
  screenshot?: string // 截图数据，仅用于虚线框元素
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

// 主虚线框引用
const mainDashedElement = ref<CanvasElement | null>(null)

// 截图loading状态
const isScreenshotLoading = ref(false)

// 中文输入状态
const isComposing = ref(false)

// 画布引用
const canvasRef = ref<HTMLElement | null>(null)

// 颜色列表
const colorList = ref<string[]>(['red', 'green', 'blue', 'yellow', 'purple', 'black'])

// 当前颜色索引
const currentColorIndex = ref(0)

// 当前数字标序号
const currentNumber = ref(1)

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

// 工具栏引用
const toolbarRef = ref<HTMLElement | null>(null)

// 组件挂载时添加全局事件监听器
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)

  // 初始化时自动生成一个1:1比例的虚线框
  initializeDashedElement()
})

// 组件卸载时移除全局事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
})

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否按下了删除键或退格键
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId.value) {
    // 调用删除元素函数
    deleteElement()
  }
}

// 初始化虚线框
const initializeDashedElement = () => {
  if (!canvasRef.value) return

  // 获取画布尺寸
  const rect = canvasRef.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const size = 600 // 3倍于原来的200px

  // 创建默认的1:1虚线框
  const dashedElement: CanvasElement = {
    id: 'main-dashed-element',
    type: 'dashed',
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
    aspectRatio: 1,
    screenshot: undefined,
  }

  canvasElements.value.push(dashedElement)
  mainDashedElement.value = dashedElement
  selectedElementId.value = dashedElement.id

  // 不再自动截图，只有在用户点击"重新截图"按钮时才截图
}

// 全局点击事件处理，点击画布以外区域取消工具激活
const handleGlobalClick = (event: MouseEvent) => {
  // 如果没有激活的工具，不处理
  if (!activeTool.value) return

  // 检查点击是否发生在工具栏区域
  if (toolbarRef.value && toolbarRef.value.contains(event.target as Node)) {
    // 点击发生在工具栏内，不取消工具激活
    return
  }

  // 如果画布存在，检查点击是否发生在画布以外
  if (canvasRef.value) {
    const isClickInsideCanvas = canvasRef.value.contains(event.target as Node)
    if (!isClickInsideCanvas) {
      activeTool.value = null
    }
  }
}

// 拖拽开始处理
const onDragStart = (event: DragEvent, asset: Asset) => {
  if (event.dataTransfer) {
    // 获取鼠标在缩略图上的相对位置
    const target = event.target as HTMLElement
    const rect = target.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const relativeY = event.clientY - rect.top

    // 将资产信息和相对位置一起存储
    const dragData = {
      asset,
      relativeX,
      relativeY,
      thumbnailWidth: rect.width,
      thumbnailHeight: rect.height,
    }
    event.dataTransfer.setData('asset', JSON.stringify(dragData))
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
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

  const dragDataStr = event.dataTransfer.getData('asset')
  if (dragDataStr) {
    const dragData = JSON.parse(dragDataStr)
    const asset = dragData.asset as Asset
    const rect = canvasRef.value.getBoundingClientRect()
    const dropX = event.clientX - rect.left
    const dropY = event.clientY - rect.top

    // 创建临时图片对象获取原始宽高比
    const img = new Image()
    img.onload = () => {
      const aspectRatio = img.width / img.height
      // 设置初始宽度为200，高度根据宽高比计算
      const initialWidth = 200
      const initialHeight = initialWidth / aspectRatio

      // 计算缩放比例
      const scaleX = initialWidth / dragData.thumbnailWidth
      const scaleY = initialHeight / dragData.thumbnailHeight

      // 计算鼠标在大图上的相对位置
      const scaledRelativeX = dragData.relativeX * scaleX
      const scaledRelativeY = dragData.relativeY * scaleY

      // 计算大图的左上角位置
      const left = dropX - scaledRelativeX
      const top = dropY - scaledRelativeY

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

// 元素点击处理
const onElementClick = (event: MouseEvent) => {
  if (!canvasRef.value || !editMode.value || !activeTool.value) return
  event.stopPropagation()

  const rect = canvasRef.value.getBoundingClientRect()
  const left = event.clientX - rect.left
  const top = event.clientY - rect.top

  switch (activeTool.value) {
    case 'text':
      addCanvasElement({
        type: 'text',
        content: '',
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
      const numberSize = 32
      addCanvasElement({
        type: 'number',
        number: currentNumber.value,
        left: left - numberSize / 2,
        top: top - numberSize / 2,
        width: numberSize,
        height: numberSize,
      })
      // 更新数字标序号
      currentNumber.value++
      break
  }
}

// 画布鼠标按下处理
const onCanvasMouseDown = (event: MouseEvent) => {
  if (!canvasRef.value || !editMode.value || !activeTool.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 如果当前工具是矩形框，开始绘制
  if (activeTool.value === 'rect') {
    isDrawingRect.value = true
    drawStartPos.value = { x, y }
    tempRect.value = { left: x, top: y, width: 0, height: 0 }
  }
}

// 画布鼠标移动处理
const onCanvasMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 更新矩形框绘制
  if (isDrawingRect.value && tempRect.value) {
    const left = Math.min(drawStartPos.value.x, x)
    const top = Math.min(drawStartPos.value.y, y)
    const width = Math.abs(x - drawStartPos.value.x)
    const height = Math.abs(y - drawStartPos.value.y)
    tempRect.value = { left, top, width, height }
  }
}

// 画布鼠标释放处理
const onCanvasMouseUp = () => {
  // 矩形框绘制结束
  if (isDrawingRect.value && tempRect.value) {
    if (tempRect.value.width > 5 && tempRect.value.height > 5) {
      addCanvasElement({
        type: 'rect',
        color: colorList.value[currentColorIndex.value],
        left: tempRect.value.left,
        top: tempRect.value.top,
        width: tempRect.value.width,
        height: tempRect.value.height,
      })
      currentColorIndex.value = (currentColorIndex.value + 1) % colorList.value.length
    }
    isDrawingRect.value = false
    tempRect.value = null
  }
}

// 画布点击处理
const onCanvasClick = (event: MouseEvent) => {
  // 如果正在绘制矩形，不处理点击事件
  if (isDrawingRect.value) return

  if (!canvasRef.value || !editMode.value || !activeTool.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const left = event.clientX - rect.left
  const top = event.clientY - rect.top

  switch (activeTool.value) {
    case 'text':
      addCanvasElement({
        type: 'text',
        content: '',
        color: '#000000',
        left,
        top,
        width: 150,
        height: 50,
      })
      break
    case 'rect':
      // 矩形框现在通过拖拽绘制，点击不再生成
      break
    case 'number':
      const numberSize = 32
      addCanvasElement({
        type: 'number',
        number: currentNumber.value,
        left: left - numberSize / 2,
        top: top - numberSize / 2,
        width: numberSize,
        height: numberSize,
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
    content: element.content || '',
    ...element,
  }
  canvasElements.value.push(newElement)
  selectedElementId.value = newElement.id

  // 如果是文本框、矩形框或数字标，生成后取消工具激活状态
  if (newElement.type === 'text' || newElement.type === 'rect' || newElement.type === 'number') {
    activeTool.value = null
  }

  // 如果是文本框，自动聚焦光标
  if (newElement.type === 'text') {
    nextTick(() => {
      const el = document.querySelector(`[data-element-id="${newElement.id}"]`) as HTMLElement
      if (el) {
        el.focus()
      }
    })
  }
}

// 选择元素
const selectElement = (id: string) => {
  selectedElementId.value = id
}

// 获取选中的元素
const selectedElement = computed(() => {
  return canvasElements.value.find((el) => el.id === selectedElementId.value) || null
})

// 更新虚线框高度
const updateDashedHeight = () => {
  if (!selectedElement.value) return

  // 根据宽度和比例自动计算高度
  const width = selectedElement.value.width || 100
  const aspectRatio = selectedElement.value.aspectRatio || 1
  selectedElement.value.height = width / aspectRatio
}

// 删除元素
const deleteElement = () => {
  if (!selectedElementId.value) return

  // 获取要删除的元素
  const elementToDelete = canvasElements.value.find((el) => el.id === selectedElementId.value)
  if (elementToDelete) {
    // 如果是主虚线框，重置引用
    if (mainDashedElement.value?.id === elementToDelete.id) {
      mainDashedElement.value = null
    }
  }

  // 从画布元素列表中移除当前选中的元素
  const index = canvasElements.value.findIndex((el) => el.id === selectedElementId.value)
  if (index !== -1) {
    canvasElements.value.splice(index, 1)
  }

  // 清空选中状态
  selectedElementId.value = null
}

// 清空画布
const clearCanvas = () => {
  // 清空画布元素列表
  canvasElements.value = []
  // 清空选中状态
  selectedElementId.value = null
  // 重置主虚线框引用
  mainDashedElement.value = null
  // 重新初始化虚线框
  initializeDashedElement()
}

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
  // 中文输入过程中不更新内容
  if (isComposing.value) return

  const element = canvasElements.value.find((el) => el.id === id)
  if (element && element.type === 'text') {
    // 获取元素的实际文本内容
    const target = event.target as HTMLElement
    element.content = target.textContent || ''
  }
}

// 中文输入开始
const onCompositionStart = () => {
  isComposing.value = true
}

// 中文输入结束
const onCompositionEnd = (event: CompositionEvent, id: string) => {
  isComposing.value = false

  const element = canvasElements.value.find((el) => el.id === id)
  if (element && element.type === 'text') {
    // 使用compositionend事件中的数据更新内容
    const target = event.target as HTMLElement
    element.content = target.textContent || ''
  }
}

// 截图并发送给后端
const captureAndSendScreenshot = async (dashedElement: CanvasElement) => {
  if (!canvasRef.value) return

  try {
    // 开始截图，显示loading
    isScreenshotLoading.value = true

    // 使用 html2canvas 进行截图
    const html2canvas = (await import('html2canvas')).default

    // 从虚线框元素中获取截图区域
    const rect = {
      left: dashedElement.left,
      top: dashedElement.top,
      width: dashedElement.width || 0,
      height: dashedElement.height || 0,
    }

    // 创建一个临时的裁剪区域
    const canvas = await html2canvas(canvasRef.value, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    })

    // 将 canvas 转换为 base64 图片
    const imageData = canvas.toDataURL('image/png')

    // 更新虚线框元素的截图数据
    dashedElement.screenshot = imageData

    // 发送给后端（这里是一个示例，您需要根据实际后端接口调整）
    console.log('截图数据:', {
      image: imageData,
      rect: rect,
      aspectRatio: dashedElement.aspectRatio,
      timestamp: new Date().toISOString(),
    })

    // 示例：发送到后端 API（根据实际接口修改）
    // const response = await fetch('/api/capture', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     image: imageData,
    //     rect: rect,
    //     aspectRatio: dashedAspectRatio.value
    //   })
    // })
    // const result = await response.json()
    // console.log('后端返回结果:', result)
  } catch (error) {
    console.error('截图失败:', error)
  } finally {
    // 截图完成，隐藏loading
    isScreenshotLoading.value = false
  }
}
</script>
