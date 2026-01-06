<template>
  <el-upload
    :class="uploadClass"
    action="#"
    :auto-upload="false"
    :on-change="handleUpload"
    :draggable="true"
    :show-file-list="false"
    accept="image/*"
  >
    <span class="text-xs text-gray-400">{{ uploadText }}</span>
  </el-upload>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UploadFile } from 'element-plus'

// Props 定义
interface Props {
  width?: string
  height?: string
  uploadText?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 'w-24',
  height: 'h-24',
  uploadText: '+上传图片',
})

// Emits 定义
const emit = defineEmits<{
  upload: [file: UploadFile]
}>()

// 计算上传组件的类名
const uploadClass = computed(() => {
  return `${props.width} ${props.height} border border-dashed border-gray-300 rounded flex flex-col items-center justify-center`
})

// 处理上传
const handleUpload = (file: UploadFile) => {
  emit('upload', file)
}
</script>
