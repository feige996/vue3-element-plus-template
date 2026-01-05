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
      <div
        class="arm left-arm"
        :style="getPartStyle('left-arm')"
        @mousedown.stop="onJointMouseDown($event, 'left-arm')"
      >
        <div class="arm-part upper-arm"></div>
        <div
          class="arm-part lower-arm"
          :style="{
            transform: `rotate(${leftArmRotation}deg)`,
            transformOrigin: 'top center',
          }"
        ></div>
      </div>

      <!-- 右臂 -->
      <div
        class="arm right-arm"
        :style="getPartStyle('right-arm')"
        @mousedown.stop="onJointMouseDown($event, 'right-arm')"
      >
        <div class="arm-part upper-arm"></div>
        <div
          class="arm-part lower-arm"
          :style="{
            transform: `rotate(${rightArmRotation}deg)`,
            transformOrigin: 'top center',
          }"
        ></div>
      </div>

      <!-- 左腿 -->
      <div
        class="leg left-leg"
        :style="getPartStyle('left-leg')"
        @mousedown.stop="onJointMouseDown($event, 'left-leg')"
      >
        <div class="leg-part upper-leg"></div>
        <div
          class="leg-part lower-leg"
          :style="{
            transform: `rotate(${leftLegRotation}deg)`,
            transformOrigin: 'top center',
          }"
        ></div>
      </div>

      <!-- 右腿 -->
      <div
        class="leg right-leg"
        :style="getPartStyle('right-leg')"
        @mousedown.stop="onJointMouseDown($event, 'right-leg')"
      >
        <div class="leg-part upper-leg"></div>
        <div
          class="leg-part lower-leg"
          :style="{
            transform: `rotate(${rightLegRotation}deg)`,
            transformOrigin: 'top center',
          }"
        ></div>
      </div>

      <!-- 关节控制点 -->
      <div
        v-for="joint in joints"
        :key="joint.id"
        class="joint-control"
        :style="getJointStyle(joint)"
        @mousedown.stop="onJointMouseDown($event, joint.id)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  left: number
  top: number
  width: number
  height: number
  rotation: number
  figureType: string
  pose: string
}

withDefaults(defineProps<Props>(), {
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
const leftLegRotation = ref(0)
const rightLegRotation = ref(0)

// 关节点定义
const joints = ref([
  { id: 'head', x: 50, y: 15 },
  { id: 'left-arm', x: 25, y: 30 },
  { id: 'right-arm', x: 75, y: 30 },
  { id: 'left-leg', x: 35, y: 75 },
  { id: 'right-leg', x: 65, y: 75 },
])

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
        width: '20%',
        height: '40%',
        left: part === 'left-arm' ? '5%' : '75%',
        top: '20%',
        backgroundColor: 'transparent',
        border: 'none',
      }
    case 'left-leg':
    case 'right-leg':
      return {
        ...baseStyle,
        width: '20%',
        height: '40%',
        left: part === 'left-leg' ? '25%' : '55%',
        top: '65%',
        backgroundColor: 'transparent',
        border: 'none',
      }
    default:
      return baseStyle
  }
}

// 获取关节点样式
const getJointStyle = (joint: { id: string; x: number; y: number }) => {
  return {
    position: 'absolute' as const,
    width: '12px',
    height: '12px',
    backgroundColor: '#e74c3c',
    borderRadius: '50%',
    left: `${joint.x}%`,
    top: `${joint.y}%`,
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer' as const,
    zIndex: 10,
  }
}

// 关节点鼠标按下事件
const onJointMouseDown = (event: MouseEvent, jointId: string) => {
  emit('jointMousedown', event, jointId)
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
  position: absolute;
  background-color: #3498db;
  border: 2px solid #2980b9;
  transition: transform 0.1s ease;
}

.upper-arm,
.upper-leg {
  height: 50%;
  border-radius: 8px;
}

.lower-arm,
.lower-leg {
  height: 50%;
  top: 50%;
  border-radius: 8px;
}

.joint-control {
  transition: all 0.2s ease;
}

.joint-control:hover {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.3);
}
</style>
