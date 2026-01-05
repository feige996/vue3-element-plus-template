<template>
  <div
    class="human-figure"
    :style="{
      transform: `rotate(${rotation}deg)`,
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative',
      cursor: 'move',
    }"
    @click.stop="$emit('select')"
  >
    <!-- 人物主体 -->
    <div class="figure-main" :class="figureType" :style="figureStyle">
      <!-- 躯干 -->
      <div class="torso" :style="getPartStyle('torso')"></div>

      <!-- 头部 -->
      <div class="head" :style="getPartStyle('head')"></div>

      <!-- 左臂 -->
      <div class="arm left-arm" :style="getPartStyle('left-arm')">
        <div
          class="arm-part upper-arm"
          :style="{
            transform: `rotate(${leftArmRotation}deg)`,
            transformOrigin: 'top center',
          }"
          @mousedown.stop="onJointMouseDown($event, 'left-arm')"
        >
          <div
            class="arm-part lower-arm"
            :style="{
              transform: `rotate(${leftLowerArmRotation}deg)`,
              transformOrigin: 'top center',
            }"
            @mousedown.stop="onJointMouseDown($event, 'left-lower-arm')"
          ></div>
        </div>
      </div>

      <!-- 右臂 -->
      <div class="arm right-arm" :style="getPartStyle('right-arm')">
        <div
          class="arm-part upper-arm"
          :style="{
            transform: `rotate(${rightArmRotation}deg)`,
            transformOrigin: 'top center',
          }"
          @mousedown.stop="onJointMouseDown($event, 'right-arm')"
        >
          <div
            class="arm-part lower-arm"
            :style="{
              transform: `rotate(${rightLowerArmRotation}deg)`,
              transformOrigin: 'top center',
            }"
            @mousedown.stop="onJointMouseDown($event, 'right-lower-arm')"
          ></div>
        </div>
      </div>

      <!-- 左腿 -->
      <div class="leg left-leg" :style="getPartStyle('left-leg')">
        <div
          class="leg-part upper-leg"
          :style="{
            transform: `rotate(${leftLegRotation}deg)`,
            transformOrigin: 'top center',
          }"
          @mousedown.stop="onJointMouseDown($event, 'left-leg')"
        >
          <div
            class="leg-part lower-leg"
            :style="{
              transform: `rotate(${leftLowerLegRotation}deg)`,
              transformOrigin: 'top center',
            }"
            @mousedown.stop="onJointMouseDown($event, 'left-lower-leg')"
          ></div>
        </div>
      </div>

      <!-- 右腿 -->
      <div class="leg right-leg" :style="getPartStyle('right-leg')">
        <div
          class="leg-part upper-leg"
          :style="{
            transform: `rotate(${rightLegRotation}deg)`,
            transformOrigin: 'top center',
          }"
          @mousedown.stop="onJointMouseDown($event, 'right-leg')"
        >
          <div
            class="leg-part lower-leg"
            :style="{
              transform: `rotate(${rightLowerLegRotation}deg)`,
              transformOrigin: 'top center',
            }"
            @mousedown.stop="onJointMouseDown($event, 'right-lower-leg')"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  left: number
  top: number
  width: number
  height: number
  rotation: number
  figureType: string
  pose: string
}

const props = withDefaults(defineProps<Props>(), {
  left: 0,
  top: 0,
  width: 150,
  height: 250,
  rotation: 0,
  figureType: 'cartoon',
  pose: 'standing',
})

const emit = defineEmits<{
  (e: 'update:rotation', value: number): void
  (e: 'update:pose', pose: string): void
  (e: 'select'): void
  (e: 'jointMousedown', event: MouseEvent, jointId: string): void
}>()

// 手臂和腿部旋转角度
const leftArmRotation = ref(0)
const rightArmRotation = ref(0)
const leftLowerArmRotation = ref(0)
const rightLowerArmRotation = ref(0)
const leftLegRotation = ref(0)
const rightLegRotation = ref(0)
const leftLowerLegRotation = ref(0)
const rightLowerLegRotation = ref(0)

// 预设姿势定义
const poseDefinitions = {
  standing: {
    leftArmRotation: 0,
    rightArmRotation: 0,
    leftLowerArmRotation: 0,
    rightLowerArmRotation: 0,
    leftLegRotation: 0,
    rightLegRotation: 0,
    leftLowerLegRotation: 0,
    rightLowerLegRotation: 0,
  },
  waving: {
    leftArmRotation: 0,
    rightArmRotation: 45,
    leftLowerArmRotation: 0,
    rightLowerArmRotation: 90,
    leftLegRotation: 0,
    rightLegRotation: 0,
    leftLowerLegRotation: 0,
    rightLowerLegRotation: 0,
  },
  sitting: {
    leftArmRotation: 15,
    rightArmRotation: 15,
    leftLowerArmRotation: 0,
    rightLowerArmRotation: 0,
    leftLegRotation: -90,
    rightLegRotation: -90,
    leftLowerLegRotation: 90,
    rightLowerLegRotation: 90,
  },
  thinking: {
    leftArmRotation: 45,
    rightArmRotation: 0,
    leftLowerArmRotation: -45,
    rightLowerArmRotation: 0,
    leftLegRotation: 0,
    rightLegRotation: 0,
    leftLowerLegRotation: 0,
    rightLowerLegRotation: 0,
  },
  running: {
    leftArmRotation: 60,
    rightArmRotation: -60,
    leftLowerArmRotation: -60,
    rightLowerArmRotation: 60,
    leftLegRotation: -45,
    rightLegRotation: 45,
    leftLowerLegRotation: 45,
    rightLowerLegRotation: -45,
  },
  jumping: {
    leftArmRotation: -30,
    rightArmRotation: -30,
    leftLowerArmRotation: -30,
    rightLowerArmRotation: -30,
    leftLegRotation: 45,
    rightLegRotation: 45,
    leftLowerLegRotation: -45,
    rightLowerLegRotation: -45,
  },
}

watch(
  () => props.pose,
  (newPose) => {
    const pose =
      poseDefinitions[newPose as keyof typeof poseDefinitions] || poseDefinitions.standing
    leftArmRotation.value = pose.leftArmRotation
    rightArmRotation.value = pose.rightArmRotation
    leftLowerArmRotation.value = pose.leftLowerArmRotation
    rightLowerArmRotation.value = pose.rightLowerArmRotation
    leftLegRotation.value = pose.leftLegRotation
    rightLegRotation.value = pose.rightLegRotation
    leftLowerLegRotation.value = pose.leftLowerLegRotation
    rightLowerLegRotation.value = pose.rightLowerLegRotation
  },
  { immediate: true },
)

// 人物样式
const figureStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  }
})

// 获取部件样式
const getPartStyle = (part: string) => {
  const baseStyle = {
    position: 'absolute' as const,
    backgroundColor: '#3498db',
    border: '2px solid #2980b9',
  }

  switch (part) {
    case 'torso':
      return {
        ...baseStyle,
        width: '50%',
        height: '50%',
        left: '25%',
        top: '20%',
        borderRadius: '10px',
      }
    case 'head':
      return {
        ...baseStyle,
        width: '30%',
        height: '20%',
        left: '35%',
        top: '0%',
        borderRadius: '50%',
      }
    case 'left-arm':
    case 'right-arm':
      return {
        ...baseStyle,
        width: '12%',
        height: '40%',
        left: part === 'left-arm' ? '15%' : '73%',
        top: '20%',
        backgroundColor: 'transparent',
        border: 'none',
      }
    case 'left-leg':
    case 'right-leg':
      return {
        ...baseStyle,
        width: '15%',
        height: '40%',
        left: part === 'left-leg' ? '30%' : '55%',
        top: '65%',
        backgroundColor: 'transparent',
        border: 'none',
      }
    default:
      return baseStyle
  }
}

// 拖拽旋转状态
const isRotating = ref(false)
const currentJoint = ref<string | null>(null)
const startMousePos = ref({ x: 0, y: 0 })
const startRotation = ref(0)

// 肢体旋转事件处理
const onJointMouseDown = (event: MouseEvent, jointId: string) => {
  event.stopPropagation()
  isRotating.value = true
  currentJoint.value = jointId
  startMousePos.value = { x: event.clientX, y: event.clientY }

  // 记录初始旋转角度
  switch (jointId) {
    case 'left-arm':
      startRotation.value = leftArmRotation.value
      break
    case 'right-arm':
      startRotation.value = rightArmRotation.value
      break
    case 'left-lower-arm':
      startRotation.value = leftLowerArmRotation.value
      break
    case 'right-lower-arm':
      startRotation.value = rightLowerArmRotation.value
      break
    case 'left-leg':
      startRotation.value = leftLegRotation.value
      break
    case 'right-leg':
      startRotation.value = rightLegRotation.value
      break
    case 'left-lower-leg':
      startRotation.value = leftLowerLegRotation.value
      break
    case 'right-lower-leg':
      startRotation.value = rightLowerLegRotation.value
      break
  }

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mouseleave', onMouseUp)

  emit('jointMousedown', event, jointId)
}

// 鼠标移动事件，计算旋转角度
const onMouseMove = (event: MouseEvent) => {
  if (!isRotating.value || !currentJoint.value) return

  // 获取人物元素
  const figureElement = document.querySelector('.human-figure') as HTMLElement
  if (!figureElement) return

  const rect = figureElement.getBoundingClientRect()

  // 计算鼠标在元素内部的相对位置
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 获取肩部位置（固定位置）
  const leftShoulderX = rect.width * 0.25
  const leftShoulderY = rect.height * 0.2
  const rightShoulderX = rect.width * 0.75
  const rightShoulderY = rect.height * 0.2
  const leftHipX = rect.width * 0.4
  const leftHipY = rect.height * 0.65
  const rightHipX = rect.width * 0.6
  const rightHipY = rect.height * 0.65

  // 计算上臂长度，与CSS中的比例保持一致
  // CSS中upper-arm高度为38%，对应rect.height * 0.38
  // 但实际旋转半径需要考虑从肩部到肘部的距离
  const upperArmLength = rect.height * 0.38
  // CSS中upper-leg高度为38%，对应rect.height * 0.38
  const upperLegLength = rect.height * 0.38

  // 根据当前关节点获取旋转中心
  let jointX = 0
  let jointY = 0

  switch (currentJoint.value) {
    case 'left-arm':
      // 左臂旋转中心：肩部
      jointX = leftShoulderX
      jointY = leftShoulderY
      break
    case 'right-arm':
      // 右臂旋转中心：肩部
      jointX = rightShoulderX
      jointY = rightShoulderY
      break
    case 'left-lower-arm':
      // 左前臂旋转中心：肘部
      // 考虑上臂旋转后的肘部位置
      const leftUpperArmAngle = ((leftArmRotation.value + 90) * Math.PI) / 180
      jointX = leftShoulderX + Math.cos(leftUpperArmAngle) * upperArmLength
      jointY = leftShoulderY + Math.sin(leftUpperArmAngle) * upperArmLength
      break
    case 'right-lower-arm':
      // 右前臂旋转中心：肘部
      // 考虑上臂旋转后的肘部位置
      const rightUpperArmAngle = ((rightArmRotation.value + 90) * Math.PI) / 180
      jointX = rightShoulderX + Math.cos(rightUpperArmAngle) * upperArmLength
      jointY = rightShoulderY + Math.sin(rightUpperArmAngle) * upperArmLength
      break
    case 'left-leg':
      // 左腿旋转中心：髋部
      jointX = leftHipX
      jointY = leftHipY
      break
    case 'right-leg':
      // 右腿旋转中心：髋部
      jointX = rightHipX
      jointY = rightHipY
      break
    case 'left-lower-leg':
      // 左小腿旋转中心：膝盖
      // 考虑大腿旋转后的膝盖位置
      const leftUpperLegAngle = ((leftLegRotation.value + 90) * Math.PI) / 180
      jointX = leftHipX + Math.cos(leftUpperLegAngle) * upperLegLength
      jointY = leftHipY + Math.sin(leftUpperLegAngle) * upperLegLength
      break
    case 'right-lower-leg':
      // 右小腿旋转中心：膝盖
      // 考虑大腿旋转后的膝盖位置
      const rightUpperLegAngle = ((rightLegRotation.value + 90) * Math.PI) / 180
      jointX = rightHipX + Math.cos(rightUpperLegAngle) * upperLegLength
      jointY = rightHipY + Math.sin(rightUpperLegAngle) * upperLegLength
      break
  }

  // 计算鼠标相对于旋转中心的角度
  const deltaX = mouseX - jointX
  const deltaY = mouseY - jointY
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

  // 计算基础角度（使肢体自然下垂）
  const baseAngle = angle - 90

  // 更新对应肢体的旋转角度
  switch (currentJoint.value) {
    case 'left-arm':
      leftArmRotation.value = baseAngle
      break
    case 'right-arm':
      rightArmRotation.value = baseAngle
      break
    case 'left-lower-arm':
      // 左前臂旋转：考虑上臂旋转角度，下臂是上臂的子元素，继承了上臂的旋转
      // 需要减去上臂的旋转角度，确保下臂旋转能正确跟随鼠标
      leftLowerArmRotation.value = baseAngle - leftArmRotation.value
      break
    case 'right-lower-arm':
      // 右前臂旋转：考虑上臂旋转角度
      rightLowerArmRotation.value = baseAngle - rightArmRotation.value
      break
    case 'left-leg':
      leftLegRotation.value = baseAngle
      break
    case 'right-leg':
      rightLegRotation.value = baseAngle
      break
    case 'left-lower-leg':
      // 左小腿旋转：考虑大腿旋转角度
      leftLowerLegRotation.value = baseAngle - leftLegRotation.value
      break
    case 'right-lower-leg':
      // 右小腿旋转：考虑大腿旋转角度
      rightLowerLegRotation.value = baseAngle - rightLegRotation.value
      break
  }
}

// 鼠标释放事件，结束旋转
const onMouseUp = () => {
  isRotating.value = false
  currentJoint.value = null

  // 移除全局鼠标事件监听
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mouseleave', onMouseUp)
}
</script>

<style scoped>
.human-figure {
  user-select: none;
}

.figure-main {
  width: 100%;
  height: 100%;
  position: relative;
}

.figure-main.cartoon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.figure-main.realistic {
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
}

.torso,
.head {
  transition: all 0.2s ease;
}

.arm,
.leg {
  position: absolute;
}

.arm-part,
.leg-part {
  width: 100%;
  background-color: #3498db;
  border: 2px solid #2980b9;
  transition: transform 0.1s ease;
  position: relative;
}

.upper-arm,
.upper-leg {
  height: 60%;
  border-radius: 8px;
  position: relative;
}

.lower-arm,
.lower-leg {
  height: 120%;
  position: absolute;
  bottom: -120%;
  left: 0;
  box-sizing: border-box;
  border-radius: 8px;
}

.arm {
  height: 45% !important;
}

.leg {
  height: 45% !important;
}
</style>
