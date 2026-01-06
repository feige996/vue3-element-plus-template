<template>
  <div class="h-80 bg-white border-t border-gray-200 p-4 overflow-y-auto">
    <!-- 提示语输入框 -->
    <div class="mb-4">
      <span class="block text-xs font-medium text-gray-700 mb-1">提示词：</span>
      <el-input
        v-model="userPrompt"
        type="textarea"
        placeholder="请输入提示语"
        :rows="1"
        class="w-full text-xs"
      ></el-input>
    </div>

    <!-- 图片大小选择 -->
    <div class="mb-4">
      <span class="block text-xs font-medium text-gray-700 mb-1">图片大小：</span>
      <el-select v-model="imageSize" class="w-32 text-xs">
        <el-option label="1K" value="1K"></el-option>
        <el-option label="2K" value="2K"></el-option>
        <el-option label="4K" value="4K"></el-option>
      </el-select>
    </div>

    <!-- AI生成按钮 -->
    <div class="mb-4">
      <el-button
        type="primary"
        size="small"
        @click="handleGenerateAIGCImage"
        :loading="isAIGCLoading"
        :disabled="resultList.length === 0"
      >
        AI生成
      </el-button>
    </div>
    <h3 class="text-sm font-medium text-gray-700 mb-2">生成结果图片列表</h3>

    <!-- 生成结果列表 -->
    <div class="flex flex-wrap gap-4">
      <div
        v-for="(result, index) in generationResults"
        :key="result.id"
        class="flex flex-col items-center relative"
      >
        <div class="relative">
          <!-- 进度项 -->
          <div
            v-if="result.type === 'progress'"
            class="w-24 h-24 border border-gray-200 rounded bg-gray-50 flex flex-col items-center justify-center"
          >
            <div class="w-20 h-20 relative">
              <!-- 进度环 -->
              <svg class="w-full h-full" viewBox="0 0 36 36">
                <!-- 背景圆 -->
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e6e6e6"
                  stroke-width="3"
                />
                <!-- 进度圆 -->
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6366f1"
                  stroke-width="3"
                  :stroke-dasharray="`${result.progress * 0.628} 31.831`"
                  stroke-linecap="round"
                />
              </svg>
              <!-- 进度文本 -->
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-sm font-medium">{{ `${result.progress}%` }}</span>
              </div>
            </div>
            <!-- 状态文本 -->
            <div class="mt-2 text-xs text-gray-500">
              {{
                result.status === TaskStatusE.PENDING
                  ? '未开始'
                  : result.status === TaskStatusE.RUNNING
                    ? '生成中...'
                    : result.status === TaskStatusE.COMPLETED
                      ? '完成'
                      : '失败'
              }}
            </div>
          </div>

          <!-- 图片项 -->
          <div
            v-else-if="result.type === 'image'"
            class="w-24 h-24 border border-gray-200 rounded bg-gray-50 overflow-hidden"
          >
            <el-image
              :src="result.url"
              :preview-src-list="[result.url!]"
              class="w-full h-full"
              fit="contain"
            ></el-image>
          </div>

          <!-- 删除按钮 -->
          <div
            class="absolute top-0 right-0 -mt-1.5 -mr-1.5 z-10 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
            @click.stop="handleDeleteGenerationResult(index)"
          >
            <CircleClose class="w-4 h-4" />
          </div>
        </div>
        <span class="text-xs text-gray-500 mt-1">{{ `生成结果 ${index + 1}` }}</span>
      </div>
      <div v-if="generationResults.length === 0" class="text-center text-gray-500 py-4">
        暂无生成结果
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件名称：GenerationResultContainer（避免单词组件名警告）
import { CircleClose } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { TaskStatusE } from '../utils/aigc'

// 生成结果类型定义
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

// Props 定义
interface Props {
  resultList: string[]
  isAIGCLoading?: boolean
  generationResults?: GenerationResult[]
}

const props = withDefaults(defineProps<Props>(), {
  isAIGCLoading: false,
  generationResults: () => [],
})

// Emits 定义
const emit = defineEmits<{
  'generate-aigc-image': [prompt: string, imageSize: string]
  'delete-generation-result': [index: number]
}>()

// 提示词
const userPrompt = ref('')
// 图片大小
const imageSize = ref('1K')

// 处理AI生成
const handleGenerateAIGCImage = () => {
  emit('generate-aigc-image', userPrompt.value, imageSize.value)
}

// 处理删除生成结果
const handleDeleteGenerationResult = (index: number) => {
  emit('delete-generation-result', index)
}
</script>
