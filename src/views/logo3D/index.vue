<script setup lang="ts">
// Imports - grouped by source
import type { Group, Shape } from 'three'
import { Color } from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'

// Component imports
import ThreeD from './components/3D.vue'
import Tools from './components/Tools.vue'

// Types and interfaces
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

// Constants
const RELIEF_DEPTH = 2
const DEFAULT_SIZE = 37

// Reactive state
const svgShapes = ref<ShapeWithColor[]>([])
const modelSize = ref<ModelSize>({ width: 0, height: 0, depth: 0 })
const fileName = ref('点击上传 SVG 文件')
const fileData = ref<File>()
const scale = ref(1)

// Computed properties
const size = computed({
  get() {
    if (svgShapes.value.length === 0) return 0
    return modelSize.value.width
  },
  set(value) {
    if (svgShapes.value.length === 0) return
    scale.value = calcScale(scale.value, modelSize.value.width, value)
  },
})

/**
 * Calculate scale factor based on current and target sizes
 */
function calcScale(currentScale: number, currentSize: number, targetSize: number): number {
  return targetSize / (currentSize / currentScale)
}

// File handling
const { open, onChange } = useFileDialog({
  accept: '.svg',
})

onChange((files: FileList | null) => {
  const file = files?.[0]
  if (!file) return

  fileName.value = file.name
  fileData.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    const svgData = e.target?.result as string
    console.log('加载的SVG数据:', svgData)
    parseSVG(svgData)
  }
  reader.readAsText(file)
})

/**
 * Parse SVG data and convert to 3D shapes
 */
function parseSVG(svgData: string): void {
  const loader = new SVGLoader()
  const svgParsed = loader.parse(svgData)
  console.log('SVG解析结果:', svgParsed)

  // Convert SVG paths to 3D shapes with color
  svgShapes.value = svgParsed.paths.map((path, pathIndex) => {
    // Create shapes from path
    const shapes = SVGLoader.createShapes(path)
    console.log(`Path ${pathIndex} 创建的形状:`, shapes)

    // Get color, prioritize fill over stroke
    let color = path.userData?.style?.fill
    if (!color || color === 'none') {
      color = path.userData?.style?.stroke || '#FFA500'
      console.log(`Path ${pathIndex} 没有填充颜色，使用描边颜色:`, color)
    }

    const fillOpacity = path.userData?.style?.fillOpacity ?? 1

    // Create shapes with color and properties
    return shapes.map((shape) => ({
      shape: markRaw(shape),
      color: markRaw(new Color().setStyle(color)),
      depth: RELIEF_DEPTH,
      startZ: 0,
      opacity: fillOpacity,
      polygonOffset: 0,
    } as ShapeWithColor))
  }).flat(1)

  // Ensure shapes have proper depth
  if (svgShapes.value.length && !svgShapes.value.some(s => s.depth > 0)) {
    console.warn('所有形状深度为0, 设置默认深度')
    svgShapes.value.forEach(s => s.depth = RELIEF_DEPTH)
  }

  // Update size after rendering
  nextTick(async () => {
    await nextTick()
    size.value = DEFAULT_SIZE
  })
}

/**
 * Update the Z position of a shape
 */
function updateStartZ(e: { index: number, value: Event }): void {
  if (svgShapes.value[e.index]) {
    const input = e.value.target as HTMLInputElement
    const numValue = Number(input.value)

    if (!isNaN(numValue)) {
      svgShapes.value[e.index].startZ = numValue
    }
  }
}

/**
 * Update the depth of a shape
 */
function updateDepth(e: { index: number, value: Event }): void {
  if (svgShapes.value[e.index]) {
    const input = e.value.target as HTMLInputElement
    const numValue = Number(input.value)

    if (!isNaN(numValue)) {
      svgShapes.value[e.index].depth = numValue
    }
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex">
    <Tools
      :svg-shapes="svgShapes"
      :file-name="fileName"
      :model-size="modelSize"
      @open="open"
      v-model:size="size"
      @update-start-z="updateStartZ"
      @update-depth="updateDepth"
    />
    <ThreeD
      :svg-shapes="svgShapes"
      :scale="scale"
      v-model:model-size="modelSize"
    />
  </div>
</template>
