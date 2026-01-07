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
          :icon="showDeleteButtons ? Hide : View"
          size="small"
          @click="showDeleteButtons = !showDeleteButtons"
        >
          {{ showDeleteButtons ? '隐藏删除' : '显示删除' }}
        </el-button>
        <el-button
          :icon="isExpanded ? ArrowUp : ArrowDown"
          size="small"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </el-button>
      </div>
    </div>

    <!-- 资产列表 -->
    <div v-show="isExpanded" class="flex gap-4 px-2 overflow-x-auto whitespace-nowrap">
      <!-- 上传控件 -->
      <el-upload
        class="w-24 h-24 flex-shrink-0 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center"
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
import { uploadFile } from '../utils/upload'
import type { Pose, Asset, CombinedAsset } from '../typing'
import { defaultPoseAssets, defaultImageAssets } from '../data'

// 展开收起状态
const isExpanded = ref(true)

// 显示删除按钮状态
const showDeleteButtons = ref(false)

// 从 localStorage 加载资产
const loadAssetsFromLocalStorage = <T,>(key: string, defaultValue: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('从 localStorage 加载资产失败:', error)
  }
  return defaultValue
}

// 保存资产到 localStorage
const saveAssetsToLocalStorage = <T,>(key: string, assets: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(assets))
  } catch (error) {
    console.error('保存资产到 localStorage 失败:', error)
  }
}

// 人物姿势库
const poseAssets = ref<Pose[]>(loadAssetsFromLocalStorage('poseAssets', defaultPoseAssets))

// 图片资产
const imageAssets = ref<Asset[]>(loadAssetsFromLocalStorage('imageAssets', defaultImageAssets))

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
  // { label: '图片资源', value: 'images' },
  // { label: '人物姿势', value: 'poses' },
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

// 拖拽开始处理（含自定义预览图大小设置）
const onDragStart = (event: DragEvent, asset: CombinedAsset) => {
  if (event.dataTransfer) {
    // 获取鼠标在缩略图上的相对位置
    const target = event.target as HTMLElement
    const rect = target.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const relativeY = event.clientY - rect.top

    // 获取图片的真实尺寸和URL
    let realWidth = rect.width
    let realHeight = rect.height
    let imageUrl = ''

    if (asset.type === 'image') {
      imageUrl = (asset as Asset).url
    } else if (asset.type === 'pose') {
      imageUrl = (asset as Pose).thumbnail
    }

    // 创建图片对象获取真实尺寸
    const img = new Image()
    if (imageUrl) {
      img.src = imageUrl
      if (img.complete) {
        realWidth = img.naturalWidth
        realHeight = img.naturalHeight
      } else {
        // 图片未加载完成时，使用默认尺寸
        img.onload = () => {
          realWidth = img.naturalWidth
          realHeight = img.naturalHeight
        }
      }
    }

    // 计算缩略图尺寸：高度固定为200px，宽度按比例计算
    const thumbnailHeight = 200
    const thumbnailWidth = Math.round((realWidth / realHeight) * thumbnailHeight)

    // 创建自定义拖拽预览图
    if (imageUrl) {
      const tempImg = new Image()
      tempImg.src = imageUrl

      // 设置预览图尺寸：高度200px，宽度按比例计算
      tempImg.width = thumbnailWidth
      tempImg.height = thumbnailHeight

      // 隐藏临时图片
      tempImg.style.position = 'absolute'
      tempImg.style.left = '-9999px'
      document.body.appendChild(tempImg)

      // 设置拖拽预览图
      event.dataTransfer.setDragImage(tempImg, tempImg.width / 2, tempImg.height / 2)

      // 拖拽结束后移除临时图片
      setTimeout(() => document.body.removeChild(tempImg), 0)
    }

    // 将资产信息、相对位置和缩略图尺寸一起存储
    const dragData = {
      asset,
      relativeX,
      relativeY,
      thumbnailWidth: thumbnailWidth,
      thumbnailHeight: thumbnailHeight,
      realWidth,
      realHeight,
    }
    event.dataTransfer.setData('asset', JSON.stringify(dragData))
    emit('drag-start', event, asset)
  }
}

// 处理上传
const handleUpload = async (file: UploadFile) => {
  if (file?.raw && file.raw instanceof File) {
    try {
      const uploadInfo = await uploadFile({
        filename: file.raw.name,
        file: file.raw,
      })

      if (currentTab.value === 'images') {
        const newAsset: Asset = {
          id: Date.now(),
          name: file.raw.name,
          type: 'image',
          url: uploadInfo.previewUrl,
        }
        imageAssets.value.unshift(newAsset)
        // 保存所有资产到 localStorage，保持当前顺序
        saveAssetsToLocalStorage('imageAssets', imageAssets.value)
      } else {
        const newPose: Pose = {
          id: Date.now(),
          name: file.raw.name,
          type: 'pose',
          poseId: `custom-${Date.now()}`,
          thumbnail: uploadInfo.previewUrl,
        }
        poseAssets.value.unshift(newPose)
        // 保存所有资产到 localStorage，保持当前顺序
        saveAssetsToLocalStorage('poseAssets', poseAssets.value)
      }
    } catch (error) {
      console.error('上传失败:', error)
    }
  }
}

// 处理删除资产
const handleDeleteAsset = (index: number) => {
  if (currentTab.value === 'images') {
    imageAssets.value.splice(index, 1)
    // 保存所有资产到 localStorage，保持当前顺序
    saveAssetsToLocalStorage('imageAssets', imageAssets.value)
  } else {
    poseAssets.value.splice(index, 1)
    // 保存所有资产到 localStorage，保持当前顺序
    saveAssetsToLocalStorage('poseAssets', poseAssets.value)
  }
}

// 处理拖拽放下
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  if (event.dataTransfer) {
    try {
      // 尝试解析拖拽数据
      const dragData = JSON.parse(event.dataTransfer.getData('image'))
      if (dragData && dragData.url) {
        if (currentTab.value === 'images') {
          const newAsset: Asset = {
            id: Date.now(),
            name: `dragged-image-${Date.now()}`,
            type: 'image',
            url: dragData.url,
            isUserUploaded: true,
          }
          imageAssets.value.unshift(newAsset)
          saveAssetsToLocalStorage('imageAssets', imageAssets.value)
        } else if (currentTab.value === 'poses') {
          const newPose: Pose = {
            id: Date.now(),
            name: `dragged-pose-${Date.now()}`,
            type: 'pose',
            poseId: `custom-${Date.now()}`,
            thumbnail: dragData.url,
            isUserUploaded: true,
          }
          poseAssets.value.unshift(newPose)
          saveAssetsToLocalStorage('poseAssets', poseAssets.value)
        }
      }
    } catch (error) {
      console.error('解析拖拽数据失败:', error)
    }
  }
}
</script>
