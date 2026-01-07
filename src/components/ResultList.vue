<template>
  <div class="bg-white border-t border-gray-200 p-4 overflow-y-auto">
    <div class="flex gap-4 items-center mb-2">
      <h3 class="text-sm font-medium text-gray-700">传递给算法的图片列表</h3>
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
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        @dragleave.prevent
      >
        <span class="text-xs text-gray-400">+上传图片</span>
      </el-upload>

      <!-- 结果列表项 -->
      <div
        v-for="(result, index) in resultList"
        :key="index"
        class="flex flex-col items-center relative cursor-move"
        draggable="true"
        @dragstart="onDragStart($event, result)"
      >
        <div class="relative">
          <el-image
            :src="result"
            :preview-src-list="[result]"
            class="w-24 h-24 border border-gray-200 rounded bg-gray-50"
            fit="contain"
          ></el-image>
          <div
            class="absolute top-0 right-0 -mt-1.5 -mr-1.5 z-10 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
            @click.stop="handleDeleteResult(index)"
          >
            <CircleClose class="w-4 h-4" />
          </div>
        </div>
        <span class="text-xs text-gray-500 mt-1">{{ `图片 ${index + 1}` }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件名称：ResultListContainer（避免单词组件名警告）
import { CircleClose } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import type { CombinedAsset } from '../typing'

// Props 定义
interface Props {
  resultList: string[]
}

const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  upload: [file: UploadFile]
  'delete-result': [index: number]
  'drop-asset': [asset: CombinedAsset]
}>()

// 处理上传
const handleUpload = (file: UploadFile) => {
  emit('upload', file)
}

// 处理删除结果
const handleDeleteResult = (index: number) => {
  emit('delete-result', index)
}

// 处理拖拽放下
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  if (event.dataTransfer) {
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('asset'))
      if (dragData && dragData.asset) {
        emit('drop-asset', dragData.asset as CombinedAsset)
      }
    } catch (error) {
      console.error('解析拖拽数据失败:', error)
    }
  }
}

// 处理拖拽开始
const onDragStart = (event: DragEvent, imageUrl: string) => {
  if (event.dataTransfer) {
    // 存储图片URL到拖拽数据
    const dragData = {
      url: imageUrl,
    }
    event.dataTransfer.setData('image', JSON.stringify(dragData))
  }
}
</script>
