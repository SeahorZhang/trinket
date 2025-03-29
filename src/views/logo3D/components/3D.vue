<script lang="ts" setup>
import type { Group, Shape } from 'three'
import { OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { Box3, Color, DoubleSide, Vector3 } from 'three'

interface ShapeWithColor {
  shape: Shape
  color: Color
  opacity: number
  depth: number
  startZ: number
  polygonOffset: number
}

interface ModelSize {
  width: number
  height: number
  depth: number
}

const emit = defineEmits<{
  (e: 'update:modelSize', value: ModelSize): void
}>()

const props = defineProps<{
  svgShapes: ShapeWithColor[]
  scale: number
}>()

const isDark = useDark()
const groupRef = useTemplateRef<Group>('group')
const curveSegments = ref(64)
const modelOffset = ref({ x: 0, y: 0, z: 0 })

const modelGroup = computed(() => toRaw(groupRef.value))
const shownShapes = computed(() => suppressZFighting(props.svgShapes).filter(i => i.depth))

/**
 * 解决 Z-fighting 问题
 * 通过微调深度值来解决拉伸方向上面重叠时的闪烁问题
 * @param shapes
 * @param scale
 */
function suppressZFighting(shapes: ShapeWithColor[], scale = 0.001) {
  const depths = new Map<number, number>()
  const offsets = new Map<number, number>()

  return shapes.map((shape) => {
    if (!shape.depth)
      return shape

    const offset = shape.startZ
    let offsetCount = 0

    // eslint-disable-next-line no-cond-assign
    if ((offsetCount = offsets.get(offset) || 0)) {
      const newOffset = fixFloat(offsetCount * scale)
      shape = {
        ...shape,
        depth: fixFloat(shape.depth + newOffset),
        startZ: fixFloat(shape.startZ - newOffset),
      }
    }

    offsets.set(offset, offsetCount + 1)
    return shape
  }).map((shape) => {
    if (!shape.depth)
      return shape

    const depth = fixFloat(shape.startZ + shape.depth)
    let depthCount = 0

    // eslint-disable-next-line no-cond-assign
    if ((depthCount = depths.get(depth) || 0)) {
      shape = {
        ...shape,
        depth: fixFloat(shape.depth + depthCount * scale),
      }
    }
    depths.set(depth, depthCount + 1)
    return shape
  })
}

function calculateModelSize() {
  const group = modelGroup.value
  if (!group)
    return

  // 延迟执行以确保模型已渲染
  nextTick(() => {
    try {
      const box = (new Box3()).setFromObject(group, true)
      const size = new Vector3()
      box.getSize(size)

      modelOffset.value = {
        x: size.x / props.scale / -2,
        y: size.y / props.scale / -2,
        z: 0,
      }

      emit('update:modelSize', {
        width: Number(size.x.toFixed(2)),
        height: Number(size.y.toFixed(2)),
        depth: Number(size.z.toFixed(2)),
      })
    }
    catch (error) {
      console.error('计算模型尺寸失败:', error)
    }
  })
}

// 监听 group 和 scale 的变化
watch([() => groupRef.value, () => props.scale, () => props.svgShapes.map(i => [i.depth, i.startZ])], () => {
  calculateModelSize()
})

// 调整相机参数
const cameraPosition: [number, number, number] = [-50, 50, 100]
const controlsConfig = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 0,
  maxDistance: 1000,
}

// 修改材质配置，确保能够正确渲染平面
const materialConfig = ref({
  shininess: 100,
  specular: '#ffffff',
  transparent: true,
  wireframe: false,
  side: DoubleSide,
  flatShading: false, // 确保平滑渲染
})

function fixFloat(num: number) {
  return Number.parseFloat(num.toFixed(10))
}
</script>

<template>
  <TresCanvas window-size :clear-color="isDark ? '#437568' : '#82DBC5'" :logarithmic-depth-buffer="true">
    <TresPerspectiveCamera :position="cameraPosition" :look-at="[0, 0, 0]" />
    <OrbitControls v-bind="controlsConfig" />
    <TresGroup v-if="svgShapes.length" ref="group" :scale="[scale, -scale, 1]">
      <TresMesh v-for="(item, index) in shownShapes" :key="index"
        :position="[modelOffset.x, modelOffset.y, modelOffset.z + item.startZ]" :render-order="index + 1">
        <TresExtrudeGeometry :args="[item.shape, {
          depth: item.depth,
          bevelEnabled: false,
          curveSegments,
          steps: 1,
        }]" />
        <TresMeshPhongMaterial v-bind="materialConfig" :color="item.color" :opacity="item.opacity"
          :polygon-offset="!!item.polygonOffset" :polygon-offset-factor="item.polygonOffset" />
      </TresMesh>
    </TresGroup>

    <!-- 移除原来的 Torus 默认显示 -->

    <!-- 重新设计的光照系统 -->
    <!-- 主光源：从右上方打光 -->
    <TresDirectionalLight :position="[100, 100, 50]" :intensity="1" />
    <!-- 侧面补光：从左侧打光 -->
    <TresDirectionalLight :position="[-50, 20, 50]" :intensity="0.4" />
    <!-- 正面补光：轻微的正面打光 -->
    <!-- <TresDirectionalLight :position="[0, 0, 100]" :intensity="0.5" /> -->
    <!-- 柔和的环境光 -->
    <TresAmbientLight :intensity="0.4" />
    <!-- 半球光：提供更自然的环境光照 -->
    <TresHemisphereLight :args="['#ffffff', '#4444ff', 0.5]" :position="[0, 100, 0]" />
  </TresCanvas>
</template>
