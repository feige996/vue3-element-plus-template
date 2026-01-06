<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左侧资产列表 -->
    <div class="w-64 bg-white border-r border-gray-200 overflow-hidden">
      <h2 class="p-4 text-lg font-semibold bg-gray-50 border-b border-gray-200">资产列表</h2>

      <!-- 资产类型标签页 -->
      <div class="border-b border-gray-200 flex">
        <button
          v-for="tab in assetTabs"
          :key="tab.value"
          :class="[
            'flex-1 py-2 px-4 text-sm font-medium transition-colors',
            currentAssetTab === tab.value
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
          ]"
          @click="currentAssetTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 资产列表 -->
      <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-104px)]">
        <div
          v-for="(asset, index) in filteredAssets"
          :key="index"
          class="cursor-move border border-gray-200 rounded hover:shadow-md transition-shadow mb-2"
          draggable="true"
          @dragstart="onDragStart($event, asset as any)"
        >
          <div class="h-[128px] flex items-center justify-center p-2 bg-gray-50">
            <img
              :src="asset.type === 'image' ? (asset as Asset).url : (asset as Pose).thumbnail"
              :alt="asset.name"
              :class="
                asset.type === 'image'
                  ? 'h-full w-auto object-contain'
                  : 'w-full h-full object-cover'
              "
            />
          </div>
          <div class="p-2 text-sm text-center">
            {{ asset.name }}
          </div>
          <div class="text-xs text-gray-500 pb-2 text-center">
            {{ asset.type === 'pose' ? '预设姿势' : '图片' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 中间画布区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 工具栏 -->
      <div
        ref="toolbarRef"
        class="h-12 bg-white border-b border-gray-200 flex items-center px-4 space-x-2"
      >
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'text' ? null : 'text'"
          :class="{
            'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'text',
          }"
        >
          文本框
        </button>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'rect' ? null : 'rect'"
          :class="{
            'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'rect',
          }"
        >
          矩形框
        </button>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="activeTool = activeTool === 'number' ? null : 'number'"
          :class="{
            'bg-green-600 text-white ring-2 hover:bg-green-600': activeTool === 'number',
          }"
        >
          数字标
        </button>
        <div class="w-px h-6 bg-gray-300 mx-2"></div>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="editMode = !editMode"
          :class="{ 'ring-2 ring-blue-400': editMode }"
        >
          {{ editMode ? '编辑' : '浏览' }}
        </button>
        <button
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ml-2"
          @click="clearCanvas"
        >
          清空画布
        </button>
      </div>

      <!-- 画布和结果列表区域 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- 画布区域 -->
        <div class="flex-1 bg-gray-200 p-4 overflow-hidden">
          <div
            ref="canvasRef"
            class="w-full h-full bg-white border border-gray-300 relative"
            @dragover.prevent
            @drop="onDrop"
            @click="onCanvasClick"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseUp"
          >
            <!-- 画布元素 -->
            <div
              v-for="element in canvasElements"
              :key="element.id"
              :class="['absolute', { 'ring-2 ring-blue-400': selectedElementId === element.id }]"
              :style="getElementStyle(element)"
              @click="activeTool ? onElementClick($event) : selectElement(element.id)"
              @mousedown="onElementMouseDown($event, element)"
            >
              <!-- 图片元素 -->
              <img
                v-if="element.type === 'image'"
                :src="element.url"
                :alt="element.name"
                class="w-full h-full object-cover"
                draggable="false"
              />
              <!-- 文本框元素 -->
              <div
                v-else-if="element.type === 'text'"
                :data-element-id="element.id"
                contenteditable="true"
                class="w-full h-full p-2 outline-none cursor-text"
                :placeholder="'输入文字'"
                @input="updateTextContent($event, element.id)"
                @compositionstart="onCompositionStart"
                @compositionend="onCompositionEnd($event, element.id)"
              ></div>
              <!-- 矩形框元素 -->
              <div
                v-else-if="element.type === 'rect'"
                class="w-full h-full border-2 border-solid"
                :style="{ borderColor: element.color, backgroundColor: 'transparent' }"
              ></div>
              <!-- 虚线框元素 -->
              <div
                v-else-if="element.type === 'dashed'"
                class="w-full h-full border-2"
                :style="{
                  borderColor: '#000000',
                  borderStyle: 'dashed',
                  backgroundColor: 'transparent',
                }"
              ></div>
              <!-- 数字标元素 -->
              <div
                v-else-if="element.type === 'number'"
                class="flex items-center justify-center text-white rounded-full font-bold"
                :style="{
                  width: `${element.size || 32}px`,
                  height: `${element.size || 32}px`,
                  backgroundColor: element.backgroundColor || '#ef4444',
                }"
              >
                {{ element.number }}
              </div>

              <!-- 人物元素 -->
              <HumanFigure
                v-else-if="element.type === 'human'"
                :left="element.left"
                :top="element.top"
                :width="element.width || 150"
                :height="element.height || 250"
                :rotation="element.rotation || 0"
                :figureType="element.figureType || 'cartoon'"
                :pose="element.pose || 'standing'"
                @select="selectElement(element.id)"
                @jointMousedown="onHumanJointMouseDown($event, element)"
              />

              <!-- 缩放控制点 -->
              <!-- 精简控制点，只保留右下侧se时的控制点 -->
              <!--
              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ left: '-6px', top: '-6px', cursor: 'nwse-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'nw')"
              ></div>
              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ left: 'calc(50% - 6px)', top: '-6px', cursor: 'ns-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'n')"
              ></div>
              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ right: '-6px', top: '-6px', cursor: 'nesw-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'ne')"
              ></div>
              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ left: '-6px', bottom: '-6px', cursor: 'nesw-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'sw')"
              ></div>
              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ left: '-6px', top: 'calc(50% - 6px)', cursor: 'ew-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'w')"
              ></div>

              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ right: '-6px', top: 'calc(50% - 6px)', cursor: 'ew-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'e')"
              ></div>
               <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ left: 'calc(50% - 6px)', bottom: '-6px', cursor: 'ns-resize' }"
                @mousedown.stop="onResizeStart($event, element, 's')"
              ></div>
              -->
              <div
                v-if="selectedElementId === element.id && editMode && element.type !== 'number'"
                class="absolute w-3 h-3 bg-blue-600 border border-white rounded-full"
                :style="{ right: '-6px', bottom: '-6px', cursor: 'nwse-resize' }"
                @mousedown.stop="onResizeStart($event, element, 'se')"
              ></div>
            </div>

            <!-- 临时绘制的矩形框 -->
            <div
              v-if="tempRect && isDrawingRect"
              class="absolute border-2 border-dashed pointer-events-none"
              :style="{
                left: `${tempRect.left}px`,
                top: `${tempRect.top}px`,
                width: `${tempRect.width}px`,
                height: `${tempRect.height}px`,
                borderColor: colorList[currentColorIndex],
                backgroundColor: 'transparent',
              }"
            ></div>
          </div>
        </div>

        <!-- 结果列表区域 -->
        <div class="bg-white border-t border-gray-200 p-4 overflow-y-auto">
          <div class="flex gap-4 items-center mb-2">
            <h3 class="text-sm font-medium text-gray-700">传递给算法的图片列表</h3>
            <button
              class="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              @click="generateScreenshot"
              :disabled="isScreenshotLoading"
            >
              <span v-if="isScreenshotLoading" class="flex items-center">
                <span class="animate-spin mr-1">⏳</span> 生成中...
              </span>
              <span v-else>生成截图</span>
            </button>
          </div>
          <div class="flex flex-wrap gap-4">
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
              <span class="text-xs text-gray-400">+上传图片</span>
            </el-upload>

            <!-- 结果列表项 -->
            <div
              v-for="(result, index) in resultList"
              :key="index"
              class="flex flex-col items-center relative"
            >
              <div class="relative">
                <el-image
                  :src="result"
                  :preview-src-list="[result]"
                  class="w-24 h-24 border border-gray-200 rounded bg-gray-50"
                  fit="contain"
                ></el-image>
                <button
                  class="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-gray-400 text-white rounded-full outline-none border-none hover:bg-gray-500 transition-colors z-10 text-xs cursor-pointer"
                  @click.stop="deleteResult(index)"
                  title="删除"
                >
                  ×
                </button>
              </div>
              <span class="text-xs text-gray-500 mt-1">{{ `图片 ${index + 1}` }}</span>
            </div>
          </div>
        </div>
        <!-- 生成结果区域 -->
        <div class="h-80 bg-white border-t border-gray-200 p-4 overflow-y-auto">
          <!-- 提示语输入框 -->
          <div class="mb-4">
            <span class="block text-xs font-medium text-gray-700 mb-1">提示词：</span>
            <el-input
              v-model="userPrompt"
              type="textarea"
              placeholder="请输入提示语"
              :rows="4"
              class="w-full text-xs"
            ></el-input>
          </div>

          <!-- 图片大小选择 -->
          <div class="mb-4">
            <span class="block text-xs font-medium text-gray-700 mb-1">图片大小：</span>
            <el-select v-model="imageSize" class="w-32 text-xs">
              <el-option label="1K" value="1K"></el-option>
              <el-option label="2K" value="2K"></el-option>
              <el-option label="4K" value="4K"></el-option>
            </el-select>
          </div>

          <!-- AI生成按钮 -->
          <div class="mb-4">
            <button
              class="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
              @click="generateAIGCImage"
              :disabled="isAIGCLoading || resultList.length === 0"
            >
              <span v-if="isAIGCLoading" class="flex items-center">
                <span class="animate-spin mr-1">⏳</span> 生成中...
              </span>
              <span v-else>AI生成</span>
            </button>
          </div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">生成结果图片列表</h3>

          <!-- 生成结果列表 -->
          <div class="flex flex-wrap gap-4">
            <div
              v-for="(result, index) in generationResults"
              :key="result.id"
              class="flex flex-col items-center relative"
            >
              <div class="relative">
                <!-- 进度项 -->
                <div
                  v-if="result.type === 'progress'"
                  class="w-24 h-24 border border-gray-200 rounded bg-gray-50 flex flex-col items-center justify-center"
                >
                  <div class="w-20 h-20 relative">
                    <!-- 进度环 -->
                    <svg class="w-full h-full" viewBox="0 0 36 36">
                      <!-- 背景圆 -->
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e6e6e6"
                        stroke-width="3"
                      />
                      <!-- 进度圆 -->
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#6366f1"
                        stroke-width="3"
                        :stroke-dasharray="`${result.progress * 0.628} 31.831`"
                        stroke-linecap="round"
                      />
                    </svg>
                    <!-- 进度文本 -->
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-sm font-medium">{{ `${result.progress}%` }}</span>
                    </div>
                  </div>
                  <!-- 状态文本 -->
                  <div class="mt-2 text-xs text-gray-500">
                    {{
                      result.status === TaskStatusE.PENDING
                        ? '未开始'
                        : result.status === TaskStatusE.RUNNING
                          ? '生成中...'
                          : result.status === TaskStatusE.COMPLETED
                            ? '完成'
                            : '失败'
                    }}
                  </div>
                </div>

                <!-- 图片项 -->
                <div
                  v-else-if="result.type === 'image'"
                  class="w-24 h-24 border border-gray-200 rounded bg-gray-50 overflow-hidden"
                >
                  <el-image
                    :src="result.url"
                    :preview-src-list="[result.url!]"
                    class="w-full h-full"
                    fit="contain"
                  ></el-image>
                </div>

                <!-- 删除按钮 -->
                <button
                  class="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-gray-500 text-white rounded-full -mt-1.5 -mr-1.5 hover:bg-gray-600 transition-colors z-10 text-xs"
                  @click.stop="deleteGenerationResult(index)"
                  title="删除"
                >
                  ×
                </button>
              </div>
              <span class="text-xs text-gray-500 mt-1">{{ `生成结果 ${index + 1}` }}</span>
            </div>
            <div v-if="generationResults.length === 0" class="text-center text-gray-500 py-4">
              暂无生成结果
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <div class="w-64 bg-white border-l border-gray-200 overflow-hidden">
      <h2 class="p-4 text-lg font-semibold bg-gray-50 border-b border-gray-200">属性面板</h2>
      <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
        <!-- 属性面板内容 -->
        <div v-if="selectedElement">
          <!-- 删除按钮 -->
          <div class="mb-4">
            <button
              class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              @click="deleteElement"
            >
              删除元素
            </button>
          </div>

          <!-- 矩形框属性 -->
          <div v-if="selectedElement.type === 'rect'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <select
                v-model="selectedElement.color"
                class="w-full p-1 border border-gray-300 rounded"
              >
                <option v-for="color in colorList" :key="color" :value="color">
                  {{ color }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
                <input
                  type="number"
                  v-model.number="selectedElement.width"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">高度</label>
                <input
                  type="number"
                  v-model.number="selectedElement.height"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <!-- 文本框属性 -->
          <div v-else-if="selectedElement.type === 'text'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <input
                type="color"
                v-model="selectedElement.color"
                class="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">字体大小</label>
              <div class="flex items-center gap-2">
                <input
                  type="range"
                  v-model.number="selectedElement.fontSize"
                  min="8"
                  max="72"
                  step="1"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  v-model.number="selectedElement.fontSize"
                  min="8"
                  max="72"
                  class="w-16 p-1 border border-gray-300 rounded"
                />
                <span class="text-sm text-gray-500">px</span>
              </div>
            </div>
          </div>

          <!-- 数字标属性 -->
          <div v-else-if="selectedElement.type === 'number'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">数值</label>
              <input
                type="number"
                v-model.number="selectedElement.number"
                class="w-full p-1 border border-gray-300 rounded"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">背景色</label>
              <input
                type="color"
                v-model="selectedElement.backgroundColor"
                class="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">大小</label>
              <div class="flex items-center gap-2">
                <input
                  type="range"
                  v-model.number="selectedElement.size"
                  min="16"
                  max="100"
                  step="1"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  v-model.number="selectedElement.size"
                  min="16"
                  max="100"
                  class="w-16 p-1 border border-gray-300 rounded"
                />
                <span class="text-sm text-gray-500">px</span>
              </div>
            </div>
          </div>

          <!-- 虚线框属性 -->
          <div v-else-if="selectedElement.type === 'dashed'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">比例</label>
              <select
                v-model="selectedElement.aspectRatio"
                class="w-full p-1 border border-gray-300 rounded"
                @change="updateDashedHeight"
              >
                <option :value="1">1:1</option>
                <option :value="16 / 9">16:9</option>
                <option :value="9 / 16">9:16</option>
                <option :value="4 / 3">4:3</option>
                <option :value="3 / 4">3:4</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">左偏移</label>
                <input
                  type="number"
                  v-model.number="selectedElement.left"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">上偏移</label>
                <input
                  type="number"
                  v-model.number="selectedElement.top"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
              <input
                type="number"
                v-model.number="selectedElement.width"
                class="w-full p-1 border border-gray-300 rounded"
                @input="updateDashedHeight"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">高度（自适应）</label>
              <input
                type="number"
                :value="(selectedElement.width || 100) / (selectedElement.aspectRatio || 1)"
                class="w-full p-1 border border-gray-300 rounded bg-gray-50"
                readonly
              />
            </div>
          </div>

          <!-- 图片属性 -->
          <div v-else-if="selectedElement.type === 'image'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <div class="text-sm text-gray-600">{{ selectedElement.name }}</div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
                <input
                  type="number"
                  v-model.number="selectedElement.width"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">高度</label>
                <input
                  type="number"
                  v-model.number="selectedElement.height"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <!-- 通用属性 -->
          <div v-if="selectedElement.type !== 'dashed'" class="mt-4">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">层级 (z-index)</label>
              <input
                type="number"
                v-model.number="selectedElement.zIndex"
                class="w-full p-1 border border-gray-300 rounded"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">左偏移</label>
                <input
                  type="number"
                  v-model.number="selectedElement.left"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">上偏移</label>
                <input
                  type="number"
                  v-model.number="selectedElement.top"
                  class="w-full p-1 border border-gray-300 rounded"
                />
              </div>
            </div>

            <!-- 图片和矩形框的旋转角度 -->
            <div
              v-if="selectedElement.type === 'image' || selectedElement.type === 'rect'"
              class="mt-4"
            >
              <label class="block text-sm font-medium text-gray-700 mb-1">旋转角度</label>
              <div class="flex items-center gap-2">
                <input
                  type="range"
                  v-model.number="selectedElement.rotation"
                  min="0"
                  max="360"
                  step="1"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  v-model.number="selectedElement.rotation"
                  min="0"
                  max="360"
                  class="w-16 p-1 border border-gray-300 rounded"
                />
                <span class="text-sm text-gray-500">°</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-8">请选择一个元素</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* contenteditable元素的placeholder样式 */
:deep([contenteditable='true']):empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import HumanFigure from './components/HumanFigure.vue'
import type { UploadFile } from 'element-plus'
import { uploadFile } from './utils/upload'
import { generateImage, getTaskStatus, TaskStatusE } from './utils/aigc'

// 资产数据类型定义
interface Asset {
  id: number
  name: string
  type: 'image'
  url: string
}

// 画布元素数据类型定义
interface CanvasElement {
  id: string
  type: 'image' | 'text' | 'rect' | 'dashed' | 'number' | 'human'
  left: number
  top: number
  width?: number
  height?: number
  size?: number // 大小，用于数字标
  url?: string
  name?: string
  content?: string
  color?: string
  backgroundColor?: string // 背景色
  number?: number
  fontSize?: number // 字体大小
  aspectRatio?: number // 宽高比，仅用于图片和虚线框元素
  screenshot?: string // 截图数据，仅用于虚线框元素
  rotation?: number // 旋转角度，单位：度
  figureType?: string // 人物类型
  pose?: string // 人物姿势
  zIndex?: number // 层级
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

// 画布元素列表
const canvasElements = ref<CanvasElement[]>([])

// 当前选中的元素ID
const selectedElementId = ref<string | null>(null)

// 活跃工具
const activeTool = ref<'text' | 'rect' | 'number' | null>(null)

// 编辑模式
const editMode = ref(true)

// 主虚线框引用
const mainDashedElement = ref<CanvasElement | null>(null)

// 截图loading状态
const isScreenshotLoading = ref(false)

// AIGC 生成loading状态
const isAIGCLoading = ref(false)

// 中文输入状态
const isComposing = ref(false)

// 用户输入的提示语
const userPrompt = ref('根据参考图片生成高质量图像')

// 生成结果项类型
interface GenerationResult {
  id: string
  type: 'progress' | 'image'
  url?: string
  progress: number
  status: TaskStatusE // 任务状态
}

// 生成结果列表
const generationResults = ref<GenerationResult[]>([])

// 图片大小选择
const imageSize = ref('2K') // 默认值为2K

// 画布引用
const canvasRef = ref<HTMLElement | null>(null)

// 颜色列表
const colorList = ref<string[]>(['red', 'green', 'blue', 'yellow', 'purple', 'black'])

// 当前颜色索引
const currentColorIndex = ref(0)

// 当前数字标序号
const currentNumber = ref(1)

// 结果列表
const resultList = ref<string[]>([])

// 文件上传处理
const handleUpload = async (file: UploadFile) => {
  // 确保file.raw存在且是File类型
  if (file?.raw && file.raw instanceof File) {
    try {
      // 使用uploadFile函数上传文件
      const uploadInfo = await uploadFile({
        filename: file.raw.name,
        file: file.raw,
      })

      // 将线上地址添加到结果列表
      resultList.value.push(uploadInfo.previewUrl)
    } catch (error) {
      console.error('上传失败:', error)
    }
  }
}

// 生成截图
const generateScreenshot = () => {
  // 找到虚线框元素
  const dashedElement = canvasElements.value.find((el) => el.type === 'dashed')
  if (dashedElement) {
    captureAndSendScreenshot(dashedElement)
  }
}

// 删除结果列表中的图片
const deleteResult = (index: number) => {
  resultList.value.splice(index, 1)
}

// 删除生成结果列表中的图片
const deleteGenerationResult = (index: number) => {
  generationResults.value.splice(index, 1)
}

// 拖拽状态管理
const isDragging = ref(false)
const isResizing = ref(false)
const isDrawingRect = ref(false)
const currentDragElement = ref<CanvasElement | null>(null)
const currentResizeElement = ref<CanvasElement | null>(null)
const resizeDirection = ref<'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// 矩形框绘制状态
const drawStartPos = ref({ x: 0, y: 0 })
const tempRect = ref<{ left: number; top: number; width: number; height: number } | null>(null)

// 工具栏引用
const toolbarRef = ref<HTMLElement | null>(null)

// 资产库标签页配置
const assetTabs = ref<{ label: string; value: 'images' | 'poses' }[]>([
  { label: '图片资源', value: 'images' },
  { label: '人物姿势', value: 'poses' },
])

// 当前选中的标签页
const currentAssetTab = ref<'images' | 'poses'>('images')

// 根据当前标签页过滤资产
const filteredAssets = computed(() => {
  if (currentAssetTab.value === 'images') {
    return imageAssets.value
  } else {
    return poseAssets.value
  }
})

// 组件挂载时添加全局事件监听器
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)

  // 初始化时自动生成一个1:1比例的虚线框
  initializeDashedElement()
})

// 组件卸载时移除全局事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
})

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否按下了删除键或退格键
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId.value) {
    // 调用删除元素函数
    deleteElement()
  }
}

// 初始化虚线框
const initializeDashedElement = () => {
  if (!canvasRef.value) return

  // 获取画布尺寸
  const rect = canvasRef.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const size = 600 // 3倍于原来的200px

  // 创建默认的1:1虚线框
  const dashedElement: CanvasElement = {
    id: 'main-dashed-element',
    type: 'dashed',
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
    aspectRatio: 1,
    screenshot: undefined,
    zIndex: 1, // 虚线框固定在最底层
  }

  canvasElements.value.push(dashedElement)
  mainDashedElement.value = dashedElement
  selectedElementId.value = dashedElement.id

  // 不再自动截图，只有在用户点击"重新截图"按钮时才截图
}

// 全局点击事件处理，点击画布以外区域取消工具激活
const handleGlobalClick = (event: MouseEvent) => {
  // 如果没有激活的工具，不处理
  if (!activeTool.value) return

  // 检查点击是否发生在工具栏区域
  if (toolbarRef.value && toolbarRef.value.contains(event.target as Node)) {
    // 点击发生在工具栏内，不取消工具激活
    return
  }

  // 如果画布存在，检查点击是否发生在画布以外
  if (canvasRef.value) {
    const isClickInsideCanvas = canvasRef.value.contains(event.target as Node)
    if (!isClickInsideCanvas) {
      activeTool.value = null
    }
  }
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
  }
}

// 元素拖拽开始
const onElementMouseDown = (event: MouseEvent, element: CanvasElement) => {
  if (!editMode.value) return
  event.stopPropagation()

  // 如果有活跃工具，不执行拖拽操作，允许创建新元素
  if (activeTool.value) return

  // 如果点击的是元素内容而不是缩放控制点，开始拖拽
  if (event.target instanceof HTMLElement && !event.target.classList.contains('resize-handle')) {
    isDragging.value = true
    currentDragElement.value = element
    dragStartPos.value = { x: event.clientX, y: event.clientY }
    selectElement(element.id)

    // 添加全局事件监听
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
  }
}

// 人物关节鼠标按下事件
const onHumanJointMouseDown = (event: MouseEvent, element: CanvasElement) => {
  if (!editMode.value) return
  event.stopPropagation()

  // 这里可以添加人物关节旋转的逻辑
  console.log('人物关节被点击:', element.id, event)

  // 例如：显示旋转辅助线，添加旋转事件监听等
  selectElement(element.id)
}

// 拖拽移动
const onDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !currentDragElement.value || !canvasRef.value) return

  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  currentDragElement.value.left += deltaX
  currentDragElement.value.top += deltaY

  dragStartPos.value = { x: event.clientX, y: event.clientY }
}

// 拖拽结束
const onDragEnd = () => {
  isDragging.value = false
  currentDragElement.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// 缩放开始
const onResizeStart = (
  event: MouseEvent,
  element: CanvasElement,
  direction: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
) => {
  if (!editMode.value) return
  event.stopPropagation()

  isResizing.value = true
  currentResizeElement.value = element
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { width: element.width || 0, height: element.height || 0 }
  selectElement(element.id)

  // 添加全局事件监听
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

// 缩放移动
const onResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !currentResizeElement.value || !resizeDirection.value) return

  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y

  const element = currentResizeElement.value
  const startWidth = resizeStartSize.value.width
  const startHeight = resizeStartSize.value.height

  // 保存原始宽高比
  const aspectRatio = element.aspectRatio || startWidth / startHeight

  switch (resizeDirection.value) {
    case 'nw':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newWidth = Math.max(10, startWidth - deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += deltaX
        element.top += newHeight - startHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth - deltaX)
        element.height = Math.max(10, startHeight - deltaY)
        element.left += deltaX
        element.top += deltaY
      }
      break
    case 'n':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newHeight = Math.max(10, startHeight - deltaY)
        const newWidth = newHeight * aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.top += deltaY
        element.left += (startWidth - newWidth) / 2
      } else {
        // 其他元素自由缩放
        element.height = Math.max(10, startHeight - deltaY)
        element.top += deltaY
      }
      break
    case 'ne':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newWidth = Math.max(10, startWidth + deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.top += newHeight - startHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth + deltaX)
        element.height = Math.max(10, startHeight - deltaY)
        element.top += deltaY
      }
      break
    case 'e':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newWidth = Math.max(10, startWidth + deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth + deltaX)
      }
      break
    case 'se':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newWidth = Math.max(10, startWidth + deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth + deltaX)
        element.height = Math.max(10, startHeight + deltaY)
      }
      break
    case 's':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newHeight = Math.max(10, startHeight + deltaY)
        const newWidth = newHeight * aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += (startWidth - newWidth) / 2
      } else {
        // 其他元素自由缩放
        element.height = Math.max(10, startHeight + deltaY)
      }
      break
    case 'sw':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newWidth = Math.max(10, startWidth - deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += deltaX
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth - deltaX)
        element.height = Math.max(10, startHeight + deltaY)
        element.left += deltaX
      }
      break
    case 'w':
      if ((element.type === 'image' || element.type === 'dashed') && element.aspectRatio) {
        // 图片和虚线框保持宽高比
        const newWidth = Math.max(10, startWidth - deltaX)
        const newHeight = newWidth / aspectRatio
        element.width = newWidth
        element.height = newHeight
        element.left += deltaX
      } else {
        // 其他元素自由缩放
        element.width = Math.max(10, startWidth - deltaX)
        element.left += deltaX
      }
      break
  }
}

// 缩放结束
const onResizeEnd = () => {
  isResizing.value = false
  currentResizeElement.value = null
  resizeDirection.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// 拖拽结束处理
const onDrop = (event: DragEvent) => {
  if (!canvasRef.value || !event.dataTransfer) return

  const dragDataStr = event.dataTransfer.getData('asset')
  if (dragDataStr) {
    const dragData = JSON.parse(dragDataStr)
    const asset = dragData.asset
    const rect = canvasRef.value.getBoundingClientRect()
    const dropX = event.clientX - rect.left
    const dropY = event.clientY - rect.top

    if (asset.type === 'pose') {
      // 处理姿势拖拽 - 直接创建人物元素并应用姿势
      const initialWidth = 150
      const initialHeight = 250

      // 计算缩放比例
      const scaleX = initialWidth / dragData.thumbnailWidth
      const scaleY = initialHeight / dragData.thumbnailHeight

      // 计算鼠标在大图上的相对位置
      const scaledRelativeX = dragData.relativeX * scaleX
      const scaledRelativeY = dragData.relativeY * scaleY

      // 计算大图的左上角位置
      const left = dropX - scaledRelativeX
      const top = dropY - scaledRelativeY

      // 添加人物元素到画布
      addCanvasElement({
        type: 'human',
        name: asset.name,
        left,
        top,
        width: initialWidth,
        height: initialHeight,
        figureType: 'cartoon', // 默认卡通风格
        pose: asset.poseId, // 应用拖拽的姿势
      })
    } else if (asset.type === 'image') {
      // 原有图片拖拽处理
      const img = new Image()
      img.onload = () => {
        const aspectRatio = img.width / img.height
        const initialHeight = 128 // 固定高度，跟左侧的图片资产高度一致
        const initialWidth = initialHeight * aspectRatio // 宽度根据宽高比计算

        // 计算缩放比例
        const scaleX = initialWidth / dragData.thumbnailWidth
        const scaleY = initialHeight / dragData.thumbnailHeight

        // 计算鼠标在大图上的相对位置
        const scaledRelativeX = dragData.relativeX * scaleX
        const scaledRelativeY = dragData.relativeY * scaleY

        // 计算大图的左上角位置
        const left = dropX - scaledRelativeX
        const top = dropY - scaledRelativeY

        // 添加图片元素到画布
        addCanvasElement({
          type: 'image',
          url: asset.url,
          name: asset.name,
          left,
          top,
          width: initialWidth,
          height: initialHeight,
          aspectRatio, // 保存宽高比
        })
      }
      img.src = asset.url
    }
  }
}

// 元素点击处理
const onElementClick = (event: MouseEvent) => {
  if (!canvasRef.value || !editMode.value || !activeTool.value) return
  event.stopPropagation()

  const rect = canvasRef.value.getBoundingClientRect()
  const left = event.clientX - rect.left
  const top = event.clientY - rect.top

  switch (activeTool.value) {
    case 'text':
      addCanvasElement({
        type: 'text',
        content: '',
        color: '#000000',
        left,
        top,
        width: 150,
        height: 50,
      })
      break
    case 'rect':
      addCanvasElement({
        type: 'rect',
        color: colorList.value[currentColorIndex.value],
        left,
        top,
        width: 100,
        height: 100,
      })
      // 更新颜色索引
      currentColorIndex.value = (currentColorIndex.value + 1) % colorList.value.length
      break
    case 'number':
      const numberSize = 32
      addCanvasElement({
        type: 'number',
        number: currentNumber.value,
        left: left - numberSize / 2,
        top: top - numberSize / 2,
        width: numberSize,
        height: numberSize,
      })
      // 更新数字标序号
      currentNumber.value++
      break
  }
}

// 画布鼠标按下处理
const onCanvasMouseDown = (event: MouseEvent) => {
  if (!canvasRef.value || !editMode.value || !activeTool.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 如果当前工具是矩形框，开始绘制
  if (activeTool.value === 'rect') {
    isDrawingRect.value = true
    drawStartPos.value = { x, y }
    tempRect.value = { left: x, top: y, width: 0, height: 0 }
  }
}

// 画布鼠标移动处理
const onCanvasMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 更新矩形框绘制
  if (isDrawingRect.value && tempRect.value) {
    const left = Math.min(drawStartPos.value.x, x)
    const top = Math.min(drawStartPos.value.y, y)
    const width = Math.abs(x - drawStartPos.value.x)
    const height = Math.abs(y - drawStartPos.value.y)
    tempRect.value = { left, top, width, height }
  }
}

// 画布鼠标释放处理
const onCanvasMouseUp = () => {
  // 矩形框绘制结束
  if (isDrawingRect.value && tempRect.value) {
    if (tempRect.value.width > 5 && tempRect.value.height > 5) {
      addCanvasElement({
        type: 'rect',
        color: colorList.value[currentColorIndex.value],
        left: tempRect.value.left,
        top: tempRect.value.top,
        width: tempRect.value.width,
        height: tempRect.value.height,
      })
      currentColorIndex.value = (currentColorIndex.value + 1) % colorList.value.length
    }
    isDrawingRect.value = false
    tempRect.value = null
  }
}

// 画布点击处理
const onCanvasClick = (event: MouseEvent) => {
  // 如果正在绘制矩形，不处理点击事件
  if (isDrawingRect.value) return

  if (!canvasRef.value || !editMode.value || !activeTool.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const left = event.clientX - rect.left
  const top = event.clientY - rect.top

  switch (activeTool.value) {
    case 'text':
      addCanvasElement({
        type: 'text',
        content: '',
        color: '#000000',
        left,
        top,
        width: 150,
        height: 50,
      })
      break
    case 'rect':
      // 矩形框现在通过拖拽绘制，点击不再生成
      break
    case 'number':
      const numberSize = 32
      addCanvasElement({
        type: 'number',
        number: currentNumber.value,
        left: left - numberSize / 2,
        top: top - numberSize / 2,
        width: numberSize,
        height: numberSize,
      })
      // 更新数字标序号
      currentNumber.value++
      break
  }
}

// 当前最大zIndex值
const currentMaxZIndex = ref(100)

// 添加画布元素
const addCanvasElement = (element: Partial<CanvasElement>) => {
  // 为新元素分配zIndex
  const elementZIndex = element.zIndex || currentMaxZIndex.value
  // 更新最大zIndex值
  if (elementZIndex >= currentMaxZIndex.value) {
    currentMaxZIndex.value = elementZIndex + 1
  }

  const newElement: CanvasElement = {
    id: `element-${Date.now()}`,
    type: element.type || 'text',
    left: element.left || 0,
    top: element.top || 0,
    width: element.width || 100,
    height: element.height || 100,
    size: element.size || (element.type === 'number' ? 32 : undefined), // 数字标默认大小
    content: element.content || '',
    rotation: element.rotation || 0,
    fontSize: element.fontSize || 16, // 默认字体大小
    backgroundColor: element.backgroundColor || '#ef4444', // 默认背景色
    zIndex: elementZIndex,
    ...element,
  }
  canvasElements.value.push(newElement)
  selectedElementId.value = newElement.id

  // 如果是文本框、矩形框或数字标，生成后取消工具激活状态
  if (newElement.type === 'text' || newElement.type === 'rect' || newElement.type === 'number') {
    activeTool.value = null
  }

  // 如果是文本框，自动聚焦光标
  if (newElement.type === 'text') {
    nextTick(() => {
      const el = document.querySelector(`[data-element-id="${newElement.id}"]`) as HTMLElement
      if (el) {
        el.focus()
      }
    })
  }
}

// 选择元素
const selectElement = (id: string) => {
  selectedElementId.value = id
}

// 获取选中的元素
const selectedElement = computed(() => {
  return canvasElements.value.find((el) => el.id === selectedElementId.value) || null
})

// 更新虚线框高度
const updateDashedHeight = () => {
  if (!selectedElement.value) return

  // 根据宽度和比例自动计算高度
  const width = selectedElement.value.width || 100
  const aspectRatio = selectedElement.value.aspectRatio || 1
  selectedElement.value.height = width / aspectRatio
}

// 删除元素
const deleteElement = () => {
  if (!selectedElementId.value) return

  // 获取要删除的元素
  const elementToDelete = canvasElements.value.find((el) => el.id === selectedElementId.value)
  if (elementToDelete) {
    // 如果是主虚线框，重置引用
    if (mainDashedElement.value?.id === elementToDelete.id) {
      mainDashedElement.value = null
    }
  }

  // 从画布元素列表中移除当前选中的元素
  const index = canvasElements.value.findIndex((el) => el.id === selectedElementId.value)
  if (index !== -1) {
    canvasElements.value.splice(index, 1)
  }

  // 清空选中状态
  selectedElementId.value = null
}

// 清空画布
const clearCanvas = () => {
  // 清空画布元素列表
  canvasElements.value = []
  // 清空选中状态
  selectedElementId.value = null
  // 重置主虚线框引用
  mainDashedElement.value = null
  // 重新初始化虚线框
  initializeDashedElement()
}

// 获取元素样式
const getElementStyle = (element: CanvasElement) => {
  // 数字标使用size属性
  const elementWidth = element.type === 'number' ? element.size || 32 : element.width
  const elementHeight = element.type === 'number' ? element.size || 32 : element.height

  const baseStyle = {
    left: `${element.left}px`,
    top: `${element.top}px`,
    width: `${elementWidth}px`,
    height: `${elementHeight}px`,
    color: element.color,
    position: 'absolute' as const,
    transform: `rotate(${element.rotation || 0}deg)`,
    transformOrigin: 'center',
    zIndex: element.zIndex,
  }

  // 为文本元素添加字体大小
  if (element.type === 'text') {
    return {
      ...baseStyle,
      fontSize: `${element.fontSize || 16}px`,
    }
  }

  return baseStyle
}

// 更新文本内容
const updateTextContent = (event: Event, id: string) => {
  // 中文输入过程中不更新内容
  if (isComposing.value) return

  const element = canvasElements.value.find((el) => el.id === id)
  if (element && element.type === 'text') {
    // 获取元素的实际文本内容
    const target = event.target as HTMLElement
    element.content = target.textContent || ''
  }
}

// 中文输入开始
const onCompositionStart = () => {
  isComposing.value = true
}

// 中文输入结束
const onCompositionEnd = (event: CompositionEvent, id: string) => {
  isComposing.value = false

  const element = canvasElements.value.find((el) => el.id === id)
  if (element && element.type === 'text') {
    // 使用compositionend事件中的数据更新内容
    const target = event.target as HTMLElement
    element.content = target.textContent || ''
  }
}

// 生成唯一ID
const generateUUID = () => {
  return crypto.randomUUID()
}

// 生成当前日期字符串 (YYYY-MM-DD)
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

// 轮询任务状态
const pollTaskStatus = async (promptId: string, generationId: string) => {
  let statusCheckInterval: number | null = null

  try {
    // 创建一个Promise来处理轮询
    await new Promise<void>((resolve, reject) => {
      statusCheckInterval = setInterval(async () => {
        try {
          // 查询任务状态
          const statusResponse = await getTaskStatus(promptId)
          console.log('Task status:', statusResponse)

          // 找到对应的进度项
          const progressItemIndex = generationResults.value.findIndex(
            (item) => item.id === generationId,
          )

          if (progressItemIndex !== -1) {
            if (generationResults.value?.[progressItemIndex]) {
              // 更新进度
              generationResults.value[progressItemIndex].progress = statusResponse.progress
              // 更新状态
              generationResults.value[progressItemIndex].status = statusResponse.status
            }
            // 检查任务状态
            if (statusResponse.status === TaskStatusE.COMPLETED) {
              // 任务已完成
              clearInterval(statusCheckInterval!)
              // 使用返回的预览地址
              console.log('AI 图片生成成功 statusResponse:', statusResponse)
              const imageUrls = statusResponse?.imgUrls || []

              // 替换进度项为图片项
              if (imageUrls.length > 0) {
                // 如果有多张图片，替换第一个，然后添加其他的
                generationResults.value[progressItemIndex] = {
                  id: generationId,
                  type: 'image',
                  url: imageUrls[0],
                  progress: 100,
                  status: TaskStatusE.COMPLETED,
                }

                // 添加剩余的图片
                if (imageUrls.length > 1) {
                  const additionalImages = imageUrls.slice(1).map((url, index) => ({
                    id: `${generationId}-${index + 1}`,
                    type: 'image' as const,
                    url,
                    progress: 100,
                    status: TaskStatusE.COMPLETED,
                  }))
                  generationResults.value.push(...additionalImages)
                }
              } else {
                // 如果没有图片，标记为失败
                if (generationResults.value?.[progressItemIndex]) {
                  generationResults.value[progressItemIndex].status = TaskStatusE.FAILED
                }
              }

              resolve()
            } else if (statusResponse.status === TaskStatusE.FAILED) {
              // 任务失败
              clearInterval(statusCheckInterval!)
              // 更新进度项为失败状态
              if (generationResults.value?.[progressItemIndex]) {
                generationResults.value[progressItemIndex].status = TaskStatusE.FAILED
              }
              console.error(`AI 图片生成失败: ${statusResponse.failedReason}`)
              reject(new Error(statusResponse.failedReason))
            } else if (
              statusResponse.status === TaskStatusE.PENDING ||
              statusResponse.status === TaskStatusE.RUNNING
            ) {
              // 任务未开始或进行中，继续轮询
              console.log(`Task in progress: ${statusResponse.progress}%`)
            }
          }
        } catch (error) {
          console.error('Error checking task status:', error)
          // 继续轮询，不中断
        }
      }, 5000) // 每5秒查询一次
    })
  } finally {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
    }
    isAIGCLoading.value = false
  }
}

// 调用 AIGC 接口生成图片
const generateAIGCImage = async () => {
  // 检查结果列表是否为空
  if (resultList.value.length === 0) {
    alert('请先上传或生成图片到结果列表')
    return
  }

  try {
    isAIGCLoading.value = true

    // 生成唯一ID
    const uuid = generateUUID()
    const currentDate = getCurrentDate()

    // 找到虚线框元素
    const dashedElement = canvasElements.value.find((el) => el.type === 'dashed')

    // 获取虚线框的比例
    let aspectRatio = '1:1'
    if (dashedElement?.aspectRatio) {
      const ratio = dashedElement.aspectRatio
      if (ratio === 1) aspectRatio = '1:1'
      else if (ratio === 3 / 4) aspectRatio = '3:4'
      else if (ratio === 4 / 3) aspectRatio = '4:3'
      else if (ratio === 9 / 16) aspectRatio = '9:16'
      else if (ratio === 16 / 9) aspectRatio = '16:9'
    }

    // 构建请求参数
    const request = {
      taskId: Math.random() * 100000000000000000,
      taskName: 'text2imgv2',
      prompt: {
        zh: userPrompt.value,
      },
      lora: 'nano-pro',
      trigger_prompt: {
        zh: '去掉网格线',
      },
      nano_pro: {
        imgUrls: resultList.value.slice(0, 6), // 不超过6张
        aspectRatio, // 支持"1:1"、"3:4"、"4:3"、"9:16" 和 "16:9"。默认值"1:1"。
        imageSize: imageSize.value, // 支持"1K"、"2K"、"4K", 注意K要大写，否则算法那边报错
      },
      cosPath: `/aigc/text2imgv2/${currentDate}/${uuid}.png`,
      exifContent: [{ label: 1 }],
    }

    // 调用 AIGC 接口
    const response = await generateImage(request)

    // 处理响应
    if (response.code === 200 && response?.prompt_id) {
      const promptId = response.prompt_id
      console.log('AIGC API Response:', response)

      // 创建一个唯一ID
      const generationId = generateUUID()

      // 添加进度项到生成结果列表
      const progressItem: GenerationResult = {
        id: generationId,
        type: 'progress',
        progress: 0,
        status: TaskStatusE.RUNNING, // 进行中
      }
      generationResults.value.push(progressItem)

      // 开始轮询任务状态
      await pollTaskStatus(promptId, generationId)
    } else {
      alert(`AI 图片生成失败: ${response.message || '未知错误'}`)
      isAIGCLoading.value = false
    }

    console.log('AIGC API Response:', response)
  } catch (error) {
    console.error('Error calling AIGC API:', error)
    alert('AI 图片生成失败，请检查控制台日志')
  } finally {
    isAIGCLoading.value = false
  }
}

// 截图并发送给后端
const captureAndSendScreenshot = async (dashedElement: CanvasElement) => {
  if (!canvasRef.value) return

  try {
    // 开始截图，显示loading
    isScreenshotLoading.value = true

    // 使用 html2canvas 进行截图
    const html2canvas = (await import('html2canvas')).default

    // 从虚线框元素中获取截图区域
    const rect = {
      left: dashedElement.left,
      top: dashedElement.top,
      width: dashedElement.width || 0,
      height: dashedElement.height || 0,
    }

    // 创建一个临时的裁剪区域
    const canvas = await html2canvas(canvasRef.value, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    })

    // 将 canvas 转换为 base64 图片
    const imageData = canvas.toDataURL('image/png')

    // 更新虚线框元素的截图数据
    dashedElement.screenshot = imageData

    // 将 base64 转换为 File 对象
    const base64ToFile = (dataUrl: string, filename: string) => {
      const arr = dataUrl.split(',') as [string, string]
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], filename, { type: mime })
    }

    // 创建截图文件
    const screenshotFile = base64ToFile(imageData, `screenshot-${Date.now()}.png`)

    // 上传截图
    const uploadInfo = await uploadFile({
      filename: screenshotFile.name,
      file: screenshotFile,
    })

    // 将线上地址添加到结果列表
    resultList.value.push(uploadInfo.previewUrl)

    // 发送给后端（这里是一个示例，您需要根据实际后端接口调整）
    console.log('截图数据:', {
      image: uploadInfo.previewUrl,
      rect: rect,
      aspectRatio: dashedElement.aspectRatio,
      timestamp: new Date().toISOString(),
    })

    // 示例：发送到后端 API（根据实际接口修改）
    // const response = await fetch('/api/capture', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     image: uploadInfo.previewUrl,
    //     rect: rect,
    //     aspectRatio: dashedElement.aspectRatio
    //   })
    // })
    // const result = await response.json()
    // console.log('后端返回结果:', result)
  } catch (error) {
    console.error('截图失败:', error)
  } finally {
    // 截图完成，隐藏loading
    isScreenshotLoading.value = false
  }
}
</script>
