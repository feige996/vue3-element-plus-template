// 定义请求参数类型
export interface AIGCPromptRequest {
  taskId: number // 工程侧任务id
  taskName: 'text2imgv2'
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
export interface AIGCPromptResponse {
  code: number
  message: string
  data?: {
    imageUrl: string
    taskId: number
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
