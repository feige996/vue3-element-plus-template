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

      <!-- 展开收起按钮和显示删除按钮 -->
      <div class="flex gap-2">
        <el-button
          :icon="isExpanded ? ArrowUp : ArrowDown"
          size="small"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </el-button>
        <el-button
          :icon="showDeleteButtons ? Hide : View"
          size="small"
          @click="showDeleteButtons = !showDeleteButtons"
        >
          {{ showDeleteButtons ? '隐藏删除' : '显示删除' }}
        </el-button>
      </div>
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
        class="flex flex-col items-center relative cursor-move"
        draggable="true"
        @dragstart="onDragStart($event, asset as any)"
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
          <div
            v-if="showDeleteButtons"
            class="absolute top-0 right-0 -mt-1.5 -mr-1.5 z-10 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
            @click.stop="handleDeleteAsset(index)"
          >
            <CircleClose class="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, CircleClose, View, Hide } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

// 展开收起状态
const isExpanded = ref(true)

// 显示删除按钮状态
const showDeleteButtons = ref(false)

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

// 人物姿势库
const poseAssets = ref<Pose[]>([
  {
    id: 1,
    name: '站立姿势',
    type: 'pose',
    poseId: 'standing',
    thumbnail: 'https://picsum.photos/800/800?random=21',
  },
  {
    id: 2,
    name: '挥手姿势',
    type: 'pose',
    poseId: 'waving',
    thumbnail: 'https://picsum.photos/1920/1080?random=22',
  },
  {
    id: 3,
    name: '坐姿',
    type: 'pose',
    poseId: 'sitting',
    thumbnail: 'https://picsum.photos/1080/1920?random=23',
  },
  {
    id: 4,
    name: '思考姿势',
    type: 'pose',
    poseId: 'thinking',
    thumbnail: 'https://picsum.photos/1600/1200?random=24',
  },
  {
    id: 5,
    name: '跑步姿势',
    type: 'pose',
    poseId: 'running',
    thumbnail: 'https://picsum.photos/1200/1600?random=25',
  },
  {
    id: 6,
    name: '跳跃姿势',
    type: 'pose',
    poseId: 'jumping',
    thumbnail: 'https://picsum.photos/300/300?random=26',
  },
])

// 图片资产
const imageAssets = ref<Asset[]>([
  {
    id: 1,
    name: '示例图片1',
    type: 'image',
    url: 'https://picsum.photos/800/800?random=1',
  },
  {
    id: 2,
    name: '示例图片2',
    type: 'image',
    url: 'https://picsum.photos/1920/1080?random=2',
  },
  {
    id: 3,
    name: '示例图片3',
    type: 'image',
    url: 'https://picsum.photos/1080/1920?random=3',
  },
  {
    id: 4,
    name: '示例图片4',
    type: 'image',
    url: 'https://picsum.photos/1600/1200?random=4',
  },
  {
    id: 5,
    name: '示例图片5',
    type: 'image',
    url: 'https://picsum.photos/1200/1600?random=5',
  },
])

// Props 定义
interface Props {
  currentTab?: 'images' | 'poses'
}

const props = withDefaults(defineProps<Props>(), {
  currentTab: 'images',
})

// Emits 定义
const emit = defineEmits<{
  'tab-change': [tab: 'images' | 'poses']
  'drag-start': [event: DragEvent, asset: CombinedAsset]
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
    return imageAssets.value
  } else {
    return poseAssets.value
  }
})

// 处理标签页切换
const handleTabChange = (tab: 'images' | 'poses') => {
  currentTab.value = tab
  emit('tab-change', tab)
}

// 拖拽开始处理
const onDragStart = (event: DragEvent, asset: CombinedAsset) => {
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
    emit('drag-start', event, asset)
  }
}

// 处理上传
const handleUpload = (file: UploadFile) => {
  // 这里可以添加上传逻辑，目前只需要处理本地状态
  // 实际项目中可能需要上传到服务器
  if (file.raw) {
    const previewUrl = URL.createObjectURL(file.raw)
    if (currentTab.value === 'images') {
      const newAsset: Asset = {
        id: Date.now(),
        name: file.raw.name,
        type: 'image',
        url: previewUrl,
      }
      imageAssets.value.unshift(newAsset)
    } else {
      const newPose: Pose = {
        id: Date.now(),
        name: file.raw.name,
        type: 'pose',
        poseId: `custom-${Date.now()}`,
        thumbnail: previewUrl,
      }
      poseAssets.value.unshift(newPose)
    }
  }
}

// 处理删除资产
const handleDeleteAsset = (index: number) => {
  if (currentTab.value === 'images') {
    imageAssets.value.splice(index, 1)
  } else {
    poseAssets.value.splice(index, 1)
  }
}
</script>
