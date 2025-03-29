<script lang="ts" setup>
import type { Group, Shape } from 'three'
import { OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { Box3, Color, DoubleSide, Vector3 } from 'three'

// Interfaces with clear property types
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

// Emits with type safety
const emit = defineEmits<{
  (e: 'update:modelSize', value: ModelSize): void
}>()

// Props with proper typing
const props = defineProps<{
  svgShapes: ShapeWithColor[]
  scale: number
}>()

// Reactive state
const isDark = useDark()
const groupRef = useTemplateRef<Group>('group')
const curveSegments = ref(64)
const modelOffset = ref({ x: 0, y: 0, z: 0 })

// Computed properties
const modelGroup = computed(() => toRaw(groupRef.value))
const shownShapes = computed(() => suppressZFighting(props.svgShapes).filter(i => i.depth))

/**
 * Z-fighting prevention
 * Adjust depth values slightly to prevent flickering when shapes overlap
 */
function suppressZFighting(shapes: ShapeWithColor[], scale = 0.001): ShapeWithColor[] {
  const depths = new Map<number, number>()
  const offsets = new Map<number, number>()

  // First pass: adjust based on starting Z position
  const firstPass = shapes.map((shape) => {
    if (!shape.depth)
      return shape

    const offset = shape.startZ
    let offsetCount = offsets.get(offset) || 0

    if (offsetCount) {
      const newOffset = fixFloat(offsetCount * scale)
      shape = {
        ...shape,
        depth: fixFloat(shape.depth + newOffset),
        startZ: fixFloat(shape.startZ - newOffset),
      }
    }

    offsets.set(offset, offsetCount + 1)
    return shape
  })

  // Second pass: adjust based on ending depth
  return firstPass.map((shape) => {
    if (!shape.depth)
      return shape

    const depth = fixFloat(shape.startZ + shape.depth)
    let depthCount = depths.get(depth) || 0

    if (depthCount) {
      shape = {
        ...shape,
        depth: fixFloat(shape.depth + depthCount * scale),
      }
    }
    depths.set(depth, depthCount + 1)
    return shape
  })
}

/**
 * Calculate model size from the 3D object
 */
function calculateModelSize(): void {
  const group = modelGroup.value
  if (!group)
    return

  // Delay to ensure the model is rendered
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

// 移除原有的 watch, 改为暴露计算方法供父组件调用
defineExpose({
  calculateModelSize
})

// Camera and controls configuration
const cameraPosition: [number, number, number] = [-50, 50, 100]
const controlsConfig = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 0,
  maxDistance: 1000,
}

// Material configuration for proper rendering
const materialConfig = ref({
  shininess: 100,
  specular: '#ffffff',
  transparent: true,
  wireframe: false,
  side: DoubleSide,
  flatShading: false,
})

/**
 * Fix floating point precision issues
 */
function fixFloat(num: number): number {
  return Number.parseFloat(num.toFixed(10))
}
</script>

<template>
  <TresCanvas
    window-size
    :clear-color="isDark ? '#437568' : '#82DBC5'"
    :logarithmic-depth-buffer="true"
  >
    <!-- Camera setup -->
    <TresPerspectiveCamera :position="cameraPosition" :look-at="[0, 0, 0]" />
    <OrbitControls v-bind="controlsConfig" />

    <!-- 3D model group -->
    <TresGroup
      v-if="svgShapes.length"
      ref="group"
      :scale="[scale, -scale, 1]"
    >
      <!-- Individual shape meshes -->
      <TresMesh
        v-for="(item, index) in shownShapes"
        :key="index"
        :position="[modelOffset.x, modelOffset.y, modelOffset.z + item.startZ]"
        :render-order="index + 1"
      >
        <TresExtrudeGeometry
          :args="[
            item.shape,
            {
              depth: item.depth,
              bevelEnabled: false,
              curveSegments,
              steps: 1,
            }
          ]"
        />
        <TresMeshPhongMaterial
          v-bind="materialConfig"
          :color="item.color"
          :opacity="item.opacity"
          :polygon-offset="!!item.polygonOffset"
          :polygon-offset-factor="item.polygonOffset"
        />
      </TresMesh>
    </TresGroup>

    <!-- Lighting system -->
    <TresDirectionalLight :position="[100, 100, 50]" :intensity="1" />
    <TresDirectionalLight :position="[-50, 20, 50]" :intensity="0.4" />
    <TresAmbientLight :intensity="0.4" />
    <TresHemisphereLight :args="['#ffffff', '#4444ff', 0.5]" :position="[0, 100, 0]" />
  </TresCanvas>
</template>
