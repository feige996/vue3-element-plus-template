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
