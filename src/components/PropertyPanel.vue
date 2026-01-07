<template>
  <div class="w-64 bg-white border-l border-gray-200 overflow-hidden">
    <h2 class="p-4 text-lg font-semibold bg-gray-100 border-b rounded-r border-gray-200 m-0">
      属性面板
    </h2>
    <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
      <div v-if="localElement">
        <div v-if="localElement.type === 'rect'">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
            <select
              v-model="localElement.color"
              class="w-full p-1 border border-gray-300 rounded"
              @change="emitUpdate"
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
                v-model.number="localElement.width"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">高度</label>
              <input
                type="number"
                v-model.number="localElement.height"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
          </div>
        </div>

        <div v-else-if="localElement.type === 'text'">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
            <input
              type="color"
              v-model="localElement.color"
              class="w-full h-8 border border-gray-300 rounded"
              @input="emitUpdate"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">字体大小</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="localElement.fontSize"
                min="8"
                max="72"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                @input="emitUpdate"
              />
              <input
                type="number"
                v-model.number="localElement.fontSize"
                min="8"
                max="72"
                class="w-16 p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
              <span class="text-sm text-gray-500">px</span>
            </div>
          </div>
        </div>

        <div v-else-if="localElement.type === 'number'">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">数值</label>
            <input
              type="number"
              v-model.number="localElement.number"
              class="w-full p-1 border border-gray-300 rounded"
              @input="emitUpdate"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">背景色</label>
            <input
              type="color"
              v-model="localElement.backgroundColor"
              class="w-full h-8 border border-gray-300 rounded"
              @input="emitUpdate"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">大小</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="localElement.size"
                min="16"
                max="100"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                @input="emitUpdate"
              />
              <input
                type="number"
                v-model.number="localElement.size"
                min="16"
                max="100"
                class="w-16 p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
              <span class="text-sm text-gray-500">px</span>
            </div>
          </div>
        </div>

        <div v-else-if="localElement.type === 'dashed'">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">比例</label>
            <select
              v-model="localElement.aspectRatio"
              class="w-full p-1 border border-gray-300 rounded"
              @change="handleUpdateDashedHeight"
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
                v-model.number="localElement.left"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">上偏移</label>
              <input
                type="number"
                v-model.number="localElement.top"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
            <input
              type="number"
              v-model.number="localElement.width"
              class="w-full p-1 border border-gray-300 rounded"
              @input="handleUpdateDashedHeight"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">高度（自适应）</label>
            <input
              type="number"
              :value="(localElement.width || 100) / (localElement.aspectRatio || 1)"
              class="w-full p-1 border border-gray-300 rounded bg-gray-50"
              readonly
            />
          </div>
        </div>

        <div v-else-if="localElement.type === 'image'">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <div class="text-sm text-gray-600">{{ localElement.name }}</div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
              <input
                type="number"
                v-model.number="localElement.width"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">高度</label>
              <input
                type="number"
                v-model.number="localElement.height"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
          </div>
        </div>

        <div v-if="localElement.type !== 'dashed'" class="mt-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">层级 (z-index)</label>
            <input
              type="number"
              v-model.number="localElement.zIndex"
              class="w-full p-1 border border-gray-300 rounded"
              @input="emitUpdate"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">左偏移</label>
              <input
                type="number"
                v-model.number="localElement.left"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">上偏移</label>
              <input
                type="number"
                v-model.number="localElement.top"
                class="w-full p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
            </div>
          </div>

          <div v-if="localElement.type === 'image' || localElement.type === 'rect'" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">旋转角度</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="localElement.rotation"
                min="0"
                max="360"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                @input="emitUpdate"
              />
              <input
                type="number"
                v-model.number="localElement.rotation"
                min="0"
                max="360"
                class="w-16 p-1 border border-gray-300 rounded"
                @input="emitUpdate"
              />
              <span class="text-sm text-gray-500">°</span>
            </div>
          </div>
        </div>

        <div v-if="localElement.type !== 'dashed'" class="mt-4">
          <el-button type="danger" class="w-full" @click="handleDeleteElement">
            删除元素
          </el-button>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-8">请选择一个元素</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CanvasElement } from '../typing'

interface Props {
  selectedElement: CanvasElement | null
  colorList?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  colorList: () => ['red', 'green', 'blue', 'yellow', 'purple', 'black'],
})

const emit = defineEmits<{
  'delete-element': []
  'update-dashed-height': []
  'update-element': [element: CanvasElement]
}>()

const localElement = ref<CanvasElement | null>(null)

watch(
  () => props.selectedElement,
  (newValue) => {
    if (newValue) {
      localElement.value = { ...newValue }
    } else {
      localElement.value = null
    }
  },
  { immediate: true, deep: true },
)

const handleDeleteElement = () => {
  emit('delete-element')
}

const handleUpdateDashedHeight = () => {
  if (localElement.value && localElement.value.type === 'dashed') {
    const width = localElement.value.width || 100
    const aspectRatio = localElement.value.aspectRatio || 1
    localElement.value.height = width / aspectRatio
    emitUpdate()
  }
  emit('update-dashed-height')
}

const emitUpdate = () => {
  if (localElement.value) {
    emit('update-element', { ...localElement.value })
  }
}
</script>
