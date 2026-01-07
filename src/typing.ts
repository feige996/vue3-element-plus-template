// 资产数据类型定义
export interface Asset {
  id: number
  name: string
  type: 'image'
  url: string
  isUserUploaded?: boolean // 是否是用户上传的
}

// 预设姿势类型定义
export interface Pose {
  id: number
  name: string
  type: 'pose'
  poseId: string
  thumbnail: string
  isUserUploaded?: boolean // 是否是用户上传的
}

// 合并资产类型
export type CombinedAsset = Asset | Pose

// 工具类型
export type ToolType = 'text' | 'rect' | 'number' | 'brush' | 'eraser' | 'arrow' | 'circle' | 'line'

// 画布元素数据类型定义
export interface CanvasElement {
  id: string
  type: 'image' | 'dashed' | 'human' | ToolType
  left: number
  top: number
  width?: number
  height?: number
  size?: number
  url?: string
  name?: string
  content?: string
  color?: string
  backgroundColor?: string
  number?: number
  fontSize?: number
  aspectRatio?: number
  screenshot?: string
  rotation?: number
  figureType?: string
  pose?: string
  zIndex?: number
  // 画笔相关属性
  points?: { x: number; y: number }[]
  strokeWidth?: number
  // 箭头相关属性
  endX?: number
  endY?: number
  // 圆形相关属性
  radiusX?: number
  radiusY?: number
  // 直线相关属性
  startX?: number
  startY?: number
}
