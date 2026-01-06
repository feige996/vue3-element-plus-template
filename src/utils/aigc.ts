// 定义请求参数类型
export interface AIGCPromptRequest {
  taskId: number // 工程侧任务id
  taskName: string // 任务名称，固定为"text2imgv2"
  prompt: {
    zh: string // 中文提示词
  }
  lora: string
  trigger_prompt: {
    zh: string // 默认前缀提示词
  }
  nano_pro: {
    imgUrls: string[] // 不超过6张
    aspectRatio: string // 支持"1:1"、"3:4"、"4:3"、"9:16" 和 "16:9"。默认值"1:1"
    imageSize: string // 支持"1K"、"2K"、"4K"
  }
  cosPath: string // 生成的图片上传路径
  exifContent: Array<{ label: number }> // [dict]
}

// 定义响应类型
export interface AIGCPromptResponse extends TaskStatusResponse {
  code: number
  message: string
  prompt_id: string
}

// 定义任务状态响应类型
export interface TaskStatusResponse {
  taskId: number
  status: number // 任务状态 0-未开始，1-进行中，2-已完成，3-失败
  code: number // 错误码，正常为200
  progress: number // 进度，0~100
  pendingNumbers: number // 排队数
  predictProcessSec: number // 处理任务预估还需要的时间
  failedReason: string // 失败原因
  cosPath: string // 上传路径
  previewUrl: string // 预览地址
}

/**
 * 查询 AIGC 任务状态
 * @param promptId 任务的 prompt_id
 * @returns 任务状态响应
 */
export async function getTaskStatus(promptId: string): Promise<TaskStatusResponse> {
  try {
    const response = await fetch(`/api/v2/image_generation/history/${promptId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const data = (await response.json()) as TaskStatusResponse
    return data
  } catch (error) {
    console.error('Error calling AIGC status API:', error)
    throw error
  }
}

/**
 * 调用 AIGC 图片生成接口
 * @param request 请求参数
 * @returns 响应结果
 */
export async function generateImage(request: AIGCPromptRequest): Promise<AIGCPromptResponse> {
  try {
    const response = await fetch('/api/v2/image_generation/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const data = (await response.json()) as AIGCPromptResponse
    console.log(data)
    return data
  } catch (error) {
    console.error('Error calling AIGC API:', error)
    throw error
  }
}
