<template>
  <div class="bg-white border-b border-gray-200 overflow-hidden">
    <div class="flex items-center gap-4 px-2 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center">
        <h2 class="text-lg font-semibold">资产列表</h2>

        <!-- 资产类型标签页 -->
        <div class="ml-8 flex">
          <el-button-group>
            <el-button
              v-for="tab in assetTabs"
              :key="tab.value"
              :type="currentTab === tab.value ? 'primary' : 'default'"
              size="small"
              @click="handleTabChange(tab.value)"
            >
              {{ tab.label }}
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 展开收起按钮 -->
      <el-button
        :icon="isExpanded ? ArrowUp : ArrowDown"
        size="small"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? '收起' : '展开' }}
      </el-button>
    </div>

    <!-- 资产列表 -->
    <div v-show="isExpanded" class="flex flex-wrap gap-4">
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
        <span class="text-xs text-gray-400">{{
          currentTab === 'images' ? '+上传图片' : '+上传姿势'
        }}</span>
      </el-upload>

      <!-- 资产列表项 -->
      <div
        v-for="(asset, index) in filteredAssets"
        :key="index"
        class="flex flex-col items-center relative"
      >
        <div class="relative">
          <el-image
            :src="asset.type === 'image' ? (asset as Asset).url : (asset as Pose).thumbnail"
            :preview-src-list="[
              asset.type === 'image' ? (asset as Asset).url : (asset as Pose).thumbnail,
            ]"
            class="w-24 h-24 border border-gray-200 rounded bg-gray-50"
            :fit="asset.type === 'image' ? 'contain' : 'cover'"
          ></el-image>
          <!-- <div
            class="absolute top-0 right-0 -mt-1.5 -mr-1.5 z-10 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
            @click.stop="handleDeleteAsset(index)"
          >
            <CircleClose class="w-4 h-4" />
          </div> -->
        </div>
        <span class="text-xs text-gray-500 mt-1">{{
          currentTab === 'images' ? `图片 ${index + 1}` : `姿势 ${index + 1}`
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, CircleClose } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

// 展开收起状态
const isExpanded = ref(true)

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
  imageAssets: Asset[]
  poseAssets: Pose[]
  currentTab?: 'images' | 'poses'
}

const props = withDefaults(defineProps<Props>(), {
  currentTab: 'images',
})

// Emits 定义
const emit = defineEmits<{
  'tab-change': [tab: 'images' | 'poses']
  upload: [file: UploadFile]
  'delete-asset': [index: number]
}>()

// 资产库标签页配置
const assetTabs = ref<{ label: string; value: 'images' | 'poses' }[]>([
  { label: '图片资源', value: 'images' },
  { label: '人物姿势', value: 'poses' },
])

// 当前选中的标签页
const currentTab = ref<'images' | 'poses'>(props.currentTab)

// 根据当前标签页过滤资产
const filteredAssets = computed(() => {
  if (currentTab.value === 'images') {
    return props.imageAssets
  } else {
    return props.poseAssets
  }
})

// 处理标签页切换
const handleTabChange = (tab: 'images' | 'poses') => {
  currentTab.value = tab
  emit('tab-change', tab)
}

// 处理上传
const handleUpload = (file: UploadFile) => {
  emit('upload', file)
}

// 处理删除资产
const handleDeleteAsset = (index: number) => {
  emit('delete-asset', index)
}
</script>
