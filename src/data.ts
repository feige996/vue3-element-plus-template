import type { Pose, Asset } from './typing'

const isUseDemoAssets = false
// 默认人物姿势库
const defaultPoseAssets: Pose[] = isUseDemoAssets
  ? [
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
    ]
  : []

// 默认图片资产
const defaultImageAssets: Asset[] = isUseDemoAssets
  ? [
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
    ]
  : []

export { defaultPoseAssets, defaultImageAssets }
