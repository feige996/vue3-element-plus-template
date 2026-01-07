<template>
  <div class="flex flex-col bg-gray-100">
    <!-- 上部：资产列表 -->
    <AssetList :current-tab="currentAssetTab" @tab-change="(tab) => (currentAssetTab = tab)" />

    <!-- 中部：工具栏 + 画布 + 属性面板 -->
    <div
      class="flex flex-col border-b border-gray-300"
      :style="{ height: isCanvasExpanded ? '600px' : '48px' }"
    >
      <!-- 工具栏 -->
      <Toolbar
        ref="toolbarRef"
        :active-tool="activeTool"
        :edit-mode="editMode"
        :color-list="colorList"
        :current-color-index="currentColorIndex"
        :current-number="currentNumber"
        :is-screenshot-loading="isScreenshotLoading"
        @tool-change="(tool) => (activeTool = tool)"
        @toggle-edit-mode="() => (editMode = !editMode)"
        @clear-canvas="clearCanvas"
        @toggle-canvas="handleToggleCanvas"
        @generate-screenshot="generateScreenshot"
        @undo="undo"
        @redo="redo"
      />

      <!-- 画布和属性面板 -->
      <div v-if="isCanvasExpanded" class="flex flex-1 overflow-hidden bg-gray-50">
        <!-- 画布 -->
        <div class="flex-1 border-r border-gray-300 bg-white">
          <Canvas
            ref="canvasRef"
            :canvas-elements="canvasElements"
            :selected-element-id="selectedElementId"
            :active-tool="activeTool"
            :edit-mode="editMode"
            :current-number="currentNumber"
            :color-list="colorList"
            :current-color-index="currentColorIndex"
            @element-add="(element) => addCanvasElement(element)"
            @element-update="(element) => updateElement(element)"
            @element-delete="deleteElement"
            @element-select="selectElement"
            @text-input="updateTextContent"
            @composition-start="onCompositionStart"
            @composition-end="onCompositionEnd"
            @number-update="(number) => (currentNumber = number)"
          />
        </div>

        <!-- 右侧属性面板 -->
        <div class="w-72 border-l border-gray-300 bg-white">
          <PropertyPanel
            :selected-element="selectedElement"
            :color-list="colorList"
            @delete-element="deleteElement"
            @update-dashed-height="updateDashedHeight"
            @update-element="(element) => updateElement(element)"
          />
        </div>
      </div>
    </div>

    <!-- 下部：结果列表 + AI生成区域 -->
    <div class="flex flex-col overflow-hidden">
      <!-- 结果列表 -->
      <ResultList
        :result-list="resultList"
        @upload="handleUpload"
        @delete-result="deleteResult"
        @drop-asset="handleDropAsset"
      />

      <!-- AI生成结果 -->
      <GenerationResult
        :result-list="resultList"
        :is-aigc-loading="isAIGCLoading"
        :generation-results="generationResults"
        @generate-aigc-image="generateAIGCImage"
        @delete-generation-result="deleteGenerationResult"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import AssetList from './components/AssetList.vue'
import Toolbar from './components/Toolbar.vue'
import Canvas from './components/Canvas.vue'
import ResultList from './components/ResultList.vue'
import GenerationResult from './components/GenerationResult.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import type { UploadFile } from 'element-plus'
import { uploadFile } from './utils/upload'
import { generateImage, getTaskStatus, TaskStatusE } from './utils/aigc'
import type { CombinedAsset, CanvasElement } from './typing'

// 画布元素列表
const canvasElements = ref<CanvasElement[]>([])

// 历史记录栈
const historyStack = ref<CanvasElement[][]>([[]])
const historyIndex = ref(0)

// 最大历史记录数量
const MAX_HISTORY = 50

// 当前选中的元素ID
const selectedElementId = ref<string | null>(null)

// 活跃工具
const activeTool = ref<
  'text' | 'rect' | 'number' | 'brush' | 'eraser' | 'arrow' | 'circle' | 'line' | null
>(null)

// 编辑模式
const editMode = ref(true)

// 主虚线框引用
const mainDashedElement = ref<CanvasElement | null>(null)

// 截图loading状态
const isScreenshotLoading = ref(false)

// AIGC 生成loading状态
const isAIGCLoading = ref(false)

// 中文输入状态
const isComposing = ref(false)

// 用户输入的提示语
const userPrompt = ref('根据参考图片生成高质量图像')

// 生成结果项类型
interface ProgressResult {
  id: string
  type: 'progress'
  progress: number
  status: TaskStatusE
}

interface ImageResult {
  id: string
  type: 'image'
  url: string
}

type GenerationResult = ProgressResult | ImageResult

// 生成结果列表
const generationResults = ref<GenerationResult[]>([])

// 图片大小选择
const imageSize = ref('2K')

// 画布引用
const canvasRef = ref<{ canvasRef: HTMLElement | null } | null>(null)

// 颜色列表
const colorList = ref<string[]>(['red', 'green', 'blue', 'yellow', 'purple', 'black'])

// 当前颜色索引
const currentColorIndex = ref(0)

// 当前数字标序号
const currentNumber = ref(1)

// 结果列表
const resultList = ref<string[]>([])

// 工具栏引用
const toolbarRef = ref<{ toolbarRef: HTMLElement | null } | null>(null)

// 画布展开状态
const isCanvasExpanded = ref(true)

// 资产库标签页配置
const assetTabs = ref<{ label: string; value: 'images' | 'poses' }[]>([
  { label: '图片资源', value: 'images' },
  { label: '人物姿势', value: 'poses' },
])

// 当前选中的标签页
const currentAssetTab = ref<'images' | 'poses'>('images')

// 处理画布收起/展开
const handleToggleCanvas = () => {
  isCanvasExpanded.value = !isCanvasExpanded.value
}

// 组件挂载时添加全局事件监听器
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleKeyDown)
  nextTick(() => initializeDashedElement())
})

// 组件卸载时移除全局事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleKeyDown)
})

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查当前是否有输入元素处于焦点状态
  const activeElement = document.activeElement
  const isInputFocused =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    (activeElement instanceof HTMLElement && activeElement.isContentEditable)

  // 如果有输入元素处于焦点状态，不执行删除元素的操作
  if (isInputFocused) return

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId.value) {
    deleteElement()
  }
}

// 初始化虚线框
const initializeDashedElement = () => {
  if (!canvasRef.value?.canvasRef) return

  const rect = canvasRef.value.canvasRef.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const size = 500

  const dashedElement: CanvasElement = {
    id: 'main-dashed-element',
    type: 'dashed',
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
    aspectRatio: 1,
    screenshot: undefined,
    zIndex: 1, // 虚线框固定在最底层
  }

  canvasElements.value.push(dashedElement)
  mainDashedElement.value = dashedElement
  selectedElementId.value = dashedElement.id
}

// 全局点击事件处理
const handleGlobalClick = (event: MouseEvent) => {
  if (!activeTool.value) return

  if (toolbarRef.value?.toolbarRef && toolbarRef.value.toolbarRef.contains(event.target as Node)) {
    return
  }

  if (canvasRef.value?.canvasRef) {
    const isClickInsideCanvas = canvasRef.value.canvasRef.contains(event.target as Node)
    if (!isClickInsideCanvas) {
      activeTool.value = null
    }
  }
}

// 当前最大zIndex值
const currentMaxZIndex = ref(100)

// 添加画布元素
// 保存历史记录
const saveHistory = () => {
  const currentElements = JSON.parse(JSON.stringify(canvasElements.value))

  // 如果当前不在历史记录末尾，删除后面的记录
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
  }

  // 添加新的历史记录
  historyStack.value.push(currentElements)

  // 限制历史记录数量
  if (historyStack.value.length > MAX_HISTORY) {
    historyStack.value.shift()
  } else {
    historyIndex.value++
  }
}

// 撤销
const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    canvasElements.value = JSON.parse(JSON.stringify(historyStack.value[historyIndex.value]))
    selectedElementId.value = null
  }
}

// 重做
const redo = () => {
  if (historyIndex.value < historyStack.value.length - 1) {
    historyIndex.value++
    canvasElements.value = JSON.parse(JSON.stringify(historyStack.value[historyIndex.value]))
    selectedElementId.value = null
  }
}

// 添加画布元素
const addCanvasElement = (element: Partial<CanvasElement>) => {
  const elementZIndex = element.zIndex || currentMaxZIndex.value
  if (elementZIndex >= currentMaxZIndex.value) {
    currentMaxZIndex.value = elementZIndex + 1
  }

  const newElement: CanvasElement = {
    id: `element-${Date.now()}`,
    type: element.type || 'text',
    left: element.left || 0,
    top: element.top || 0,
    width: element.width || 100,
    height: element.height || 100,
    size: element.size || (element.type === 'number' ? 32 : undefined),
    content: element.content || '',
    rotation: element.rotation || 0,
    fontSize: element.fontSize || 16,
    backgroundColor: element.backgroundColor || '#ef4444',
    zIndex: elementZIndex,
    ...element,
  }
  canvasElements.value.push(newElement)
  selectedElementId.value = newElement.id

  // 保存历史记录
  saveHistory()

  if (newElement.type === 'text' || newElement.type === 'rect' || newElement.type === 'number') {
    activeTool.value = null
  }

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

// 更新元素
const updateElement = (element: CanvasElement) => {
  const index = canvasElements.value.findIndex((el) => el.id === element.id)
  if (index !== -1) {
    canvasElements.value[index] = element
    // 保存历史记录
    saveHistory()
  }
}

// 更新虚线框高度
const updateDashedHeight = () => {
  if (!selectedElement.value) return

  const width = selectedElement.value.width || 100
  const aspectRatio = selectedElement.value.aspectRatio || 1
  selectedElement.value.height = width / aspectRatio
  // 保存历史记录
  saveHistory()
}

// 删除元素
const deleteElement = (id?: string) => {
  const elementId = id || selectedElementId.value
  if (!elementId) return

  const elementToDelete = canvasElements.value.find((el) => el.id === elementId)
  if (elementToDelete) {
    if (mainDashedElement.value?.id === elementToDelete.id) {
      mainDashedElement.value = null
    }
  }

  const index = canvasElements.value.findIndex((el) => el.id === elementId)
  if (index !== -1) {
    canvasElements.value.splice(index, 1)
    // 保存历史记录
    saveHistory()
  }

  // 如果删除的是当前选中的元素，清空选中状态
  if (elementId === selectedElementId.value) {
    selectedElementId.value = null
  }
}

// 清空画布
const clearCanvas = () => {
  canvasElements.value = []
  selectedElementId.value = null
  mainDashedElement.value = null
  initializeDashedElement()
  // 保存历史记录
  saveHistory()
}

// 更新文本内容
const updateTextContent = (event: Event, id: string) => {
  if (isComposing.value) return

  const element = canvasElements.value.find((el) => el.id === id)
  if (element && element.type === 'text') {
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
    const target = event.target as HTMLElement
    element.content = target.textContent || ''
  }
}

// 文件上传处理
const handleUpload = async (file: UploadFile) => {
  if (file?.raw && file.raw instanceof File) {
    try {
      const uploadInfo = await uploadFile({
        filename: file.raw.name,
        file: file.raw,
      })

      resultList.value.push(uploadInfo.previewUrl)
    } catch (error) {
      console.error('上传失败:', error)
    }
  }
}

// 资产上传处理

// 生成截图
const generateScreenshot = () => {
  const dashedElement = canvasElements.value.find((el) => el.type === 'dashed')
  if (dashedElement) {
    captureAndSendScreenshot(dashedElement)
  }
}

// 删除结果列表中的图片
const deleteResult = (index: number) => {
  resultList.value.splice(index, 1)
}

// 删除生成结果列表中的图片
const deleteGenerationResult = (index: number) => {
  generationResults.value.splice(index, 1)
}

// 处理拖拽资产
const handleDropAsset = (asset: CombinedAsset) => {
  if (asset) {
    // 根据资产类型获取图片URL
    let imageUrl = ''
    if (asset.type === 'image') {
      imageUrl = asset.url
    } else if (asset.type === 'pose') {
      imageUrl = asset.thumbnail
    }

    // 如果获取到了图片URL，则添加到结果列表
    if (imageUrl) {
      resultList.value.push(imageUrl)
    }
  }
}

// 生成唯一ID（兼容处理）
const generateUUID = () => {
  // 优先使用现代浏览器的原生方法
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 兼容性 fallback 实现（UUID v4 格式）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 生成当前日期字符串 (YYYY-MM-DD)
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

// 轮询任务状态
const pollTaskStatus = async (promptId: string, generationId: string) => {
  let statusCheckInterval: number | null = null

  try {
    await new Promise<void>((resolve, reject) => {
      statusCheckInterval = setInterval(async () => {
        try {
          const statusResponse = await getTaskStatus(promptId)
          console.log('Task status:', statusResponse)

          const progressItemIndex = generationResults.value.findIndex(
            (item) => item.id === generationId,
          )

          if (progressItemIndex !== -1) {
            const currentItem = generationResults.value[progressItemIndex]
            if (currentItem && currentItem.type === 'progress') {
              currentItem.progress = statusResponse.progress
              currentItem.status = statusResponse.status
            }

            if (statusResponse.status === TaskStatusE.COMPLETED) {
              clearInterval(statusCheckInterval!)
              console.log('AI 图片生成成功 statusResponse:', statusResponse)
              const imageUrls = statusResponse?.imgUrls || []

              if (imageUrls.length > 0) {
                const newImageResult: ImageResult = {
                  id: generationId,
                  type: 'image',
                  url: imageUrls[0]!,
                }
                generationResults.value[progressItemIndex] = newImageResult

                if (imageUrls.length > 1) {
                  const additionalImages: ImageResult[] = imageUrls.slice(1).map((url, index) => ({
                    id: `${generationId}-${index + 1}`,
                    type: 'image' as const,
                    url,
                  }))
                  generationResults.value.push(...additionalImages)
                }
              } else {
                const currentItem = generationResults.value[progressItemIndex]
                if (currentItem && currentItem.type === 'progress') {
                  currentItem.status = TaskStatusE.FAILED
                }
              }

              resolve()
            } else if (statusResponse.status === TaskStatusE.FAILED) {
              clearInterval(statusCheckInterval!)
              const currentItem = generationResults.value[progressItemIndex]
              if (currentItem && currentItem.type === 'progress') {
                currentItem.status = TaskStatusE.FAILED
              }
              console.error(`AI 图片生成失败: ${statusResponse.failedReason}`)
              reject(new Error(statusResponse.failedReason))
            } else if (
              statusResponse.status === TaskStatusE.PENDING ||
              statusResponse.status === TaskStatusE.RUNNING
            ) {
              console.log(`Task in progress: ${statusResponse.progress}%`)
            }
          }
        } catch (error) {
          console.error('Error checking task status:', error)
        }
      }, 5000)
    })
  } finally {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
    }
    isAIGCLoading.value = false
  }
}

// 调用 AIGC 接口生成图片
const generateAIGCImage = async (prompt: string, size: string) => {
  userPrompt.value = prompt
  imageSize.value = size

  if (resultList.value.length === 0) {
    alert('请先上传或生成图片到结果列表')
    return
  }

  try {
    isAIGCLoading.value = true

    const uuid = generateUUID()
    const currentDate = getCurrentDate()

    const dashedElement = canvasElements.value.find((el) => el.type === 'dashed')

    let aspectRatio = '1:1'
    if (dashedElement?.aspectRatio) {
      const ratio = dashedElement.aspectRatio
      if (ratio === 1) aspectRatio = '1:1'
      else if (ratio === 3 / 4) aspectRatio = '3:4'
      else if (ratio === 4 / 3) aspectRatio = '4:3'
      else if (ratio === 9 / 16) aspectRatio = '9:16'
      else if (ratio === 16 / 9) aspectRatio = '16:9'
    }

    const request = {
      taskId: Math.random() * 100000000000000000,
      taskName: 'text2imgv2',
      prompt: {
        zh: userPrompt.value,
      },
      lora: 'nano-pro',
      trigger_prompt: {
        zh: '去掉网格线',
      },
      nano_pro: {
        imgUrls: resultList.value.slice(0, 6),
        aspectRatio,
        imageSize: imageSize.value,
      },
      cosPath: `/aigc/text2imgv2/${currentDate}/${uuid}.png`,
      exifContent: [{ label: 1 }],
    }

    const response = await generateImage(request)

    if (response.code === 200 && response?.prompt_id) {
      const promptId = response.prompt_id
      console.log('AIGC API Response:', response)

      const generationId = generateUUID()

      const progressItem: GenerationResult = {
        id: generationId,
        type: 'progress',
        progress: 0,
        status: TaskStatusE.RUNNING,
      }
      generationResults.value.push(progressItem)

      await pollTaskStatus(promptId, generationId)
    } else {
      alert(`AI 图片生成失败: ${response.message || '未知错误'}`)
      isAIGCLoading.value = false
    }

    console.log('AIGC API Response:', response)
  } catch (error) {
    console.error('Error calling AIGC API:', error)
    alert('AI 图片生成失败，请检查控制台日志')
  } finally {
    isAIGCLoading.value = false
  }
}

// 截图并发送给后端
const captureAndSendScreenshot = async (dashedElement: CanvasElement) => {
  if (!canvasRef.value?.canvasRef) return

  try {
    isScreenshotLoading.value = true

    const html2canvas = (await import('html2canvas')).default

    const rect = {
      left: dashedElement.left,
      top: dashedElement.top,
      width: dashedElement.width || 0,
      height: dashedElement.height || 0,
    }

    const canvas = await html2canvas(canvasRef.value.canvasRef, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    })

    const imageData = canvas.toDataURL('image/png')

    dashedElement.screenshot = imageData

    const base64ToFile = (dataUrl: string, filename: string) => {
      const arr = dataUrl.split(',') as [string, string]
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], filename, { type: mime })
    }

    const screenshotFile = base64ToFile(imageData, `screenshot-${Date.now()}.png`)

    const uploadInfo = await uploadFile({
      filename: screenshotFile.name,
      file: screenshotFile,
    })

    resultList.value.push(uploadInfo.previewUrl)

    console.log('截图数据:', {
      image: uploadInfo.previewUrl,
      rect: rect,
      aspectRatio: dashedElement.aspectRatio,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('截图失败:', error)
  } finally {
    isScreenshotLoading.value = false
  }
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
