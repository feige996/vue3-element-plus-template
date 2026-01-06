<template>
  <div class="bg-white border-t border-gray-200 p-4 overflow-y-auto">
    <div class="flex gap-4 items-center mb-2">
      <h3 class="text-sm font-medium text-gray-700">传递给算法的图片列表</h3>
      <button
        class="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
        @click="handleGenerateScreenshot"
        :disabled="isScreenshotLoading"
      >
        <span v-if="isScreenshotLoading" class="flex items-center">
          <span class="animate-spin mr-1">⏳</span> 生成中...
        </span>
        <span v-else>生成截图</span>
      </button>
    </div>
    <div class="flex flex-wrap gap-4">
      <!-- 上传控件 -->
      <el-upload
        class="w-24 h-24 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center"
        action="#"
        :auto-upload="false"
        :on-change="handleUpload"
        :draggable="true"
        :show-file-list="false"
        accept="image/*"
      >
        <span class="text-xs text-gray-400">+上传图片</span>
      </el-upload>

      <!-- 结果列表项 -->
      <div
        v-for="(result, index) in resultList"
        :key="index"
        class="flex flex-col items-center relative"
      >
        <div class="relative">
          <el-image
            :src="result"
            :preview-src-list="[result]"
            class="w-24 h-24 border border-gray-200 rounded bg-gray-50"
            fit="contain"
          ></el-image>
          <button
            class="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-gray-400 text-white rounded-full outline-none border-none hover:bg-gray-500 transition-colors z-10 text-xs cursor-pointer"
            @click.stop="handleDeleteResult(index)"
            title="删除"
          >
            ×
          </button>
        </div>
        <span class="text-xs text-gray-500 mt-1">{{ `图片 ${index + 1}` }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件名称：ResultListContainer（避免单词组件名警告）
import type { UploadFile } from 'element-plus'

// Props 定义
interface Props {
  resultList: string[]
  isScreenshotLoading?: boolean
}

 
const props = withDefaults(defineProps<Props>(), {
  isScreenshotLoading: false,
})

// Emits 定义
const emit = defineEmits<{
  'generate-screenshot': []
  upload: [file: UploadFile]
  'delete-result': [index: number]
}>()

// 处理生成截图
const handleGenerateScreenshot = () => {
  emit('generate-screenshot')
}

// 处理上传
const handleUpload = (file: UploadFile) => {
  emit('upload', file)
}

// 处理删除结果
const handleDeleteResult = (index: number) => {
  emit('delete-result', index)
}
</script>
