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
    <div v-show="isExpanded" class="flex gap-4 overflow-x-auto">
      <div
        v-for="(asset, index) in filteredAssets"
        :key="index"
        class="flex-shrink-0 cursor-move border border-gray-200 rounded hover:shadow-md transition-shadow"
        draggable="true"
        @dragstart="onDragStart($event, asset as any)"
      >
        <div class="h-[100px] w-[100px] flex items-center justify-center p-2 bg-gray-50">
          <img
            :src="asset.type === 'image' ? (asset as Asset).url : (asset as Pose).thumbnail"
            :alt="asset.name"
            :class="
              asset.type === 'image' ? 'h-full w-auto object-contain' : 'w-full h-full object-cover'
            "
          />
        </div>
        <div class="p-2 text-sm text-center truncate w-[100px]">
          {{ asset.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

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
</script>
