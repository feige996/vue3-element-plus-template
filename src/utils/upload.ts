export interface UploadCosReqI {
  bizType: string // 支持text2img_style、audio_style、segment_mask、face_swap、gcimg-editrole、cooperator、attachment
  filename: string // 文件名称
  taskId?: string // 任务id,有就传,没有不传
}

export interface UploadCosResI {
  cosPath: string // cos存储路径
  previewUrl: string // 预览地址
  uploadUrl: string // 上传地址
}
const baseUrl = 'http://10.200.16.100:8080'
// 获取COS上传URL
export function getPresignedUrl(data: UploadCosReqI) {
  // 创建查询参数
  const params = new URLSearchParams()
  if (data.bizType) params.append('bizType', data.bizType)
  if (data.filename) params.append('filename', data.filename)
  if (data.taskId) params.append('taskId', data.taskId)

  // 拼接到URL上
  const url = `${baseUrl}/api/v1/upload/cos/getPresignedUrl?${params.toString()}`

  return fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
  }).then((res) => res.json() as Promise<UploadCosResI>)
}

export interface UploadOptionsI {
  filename: string
  file: File
}

// 简单上传
export async function uploadFile(options: UploadOptionsI): Promise<UploadCosResI> {
  // 获取上传地址和基本信息
  const uploadInfo = await getPresignedUrl({
    bizType: 'attachment',
    filename: options.filename,
  })

  // 使用 fetch 上传文件
  const response = await fetch(uploadInfo.uploadUrl, {
    method: 'PUT',
    body: options.file,
    headers: {
      'content-type': options.file.type,
    },
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status: ${response.status}`)
  }

  return uploadInfo
}
