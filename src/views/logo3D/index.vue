<script setup lang="ts">
import { Color } from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { ShapeWithColor, ModelSize } from './types'

// Component imports
import ThreeD from './components/3D.vue'
import Tools from './components/Tools.vue'

// Constants
const RELIEF_DEPTH = 2
const DEFAULT_SIZE = 37

// Reactive state
const svgShapes = ref<ShapeWithColor[]>([])
const modelSize = ref<ModelSize>({ width: 0, height: 0, depth: 0 })
const fileName = ref('点击上传 SVG 文件')
const fileData = ref<File>()
const scale = ref(1)
const modelRef = ref()
const isLoading = ref(false)
const loadError = ref('')

// 模型计算和更新处理
const updateModelSize = (size: ModelSize) => {
  modelSize.value = size
}

// 使用防抖优化频繁计算
const recalculateModel = useDebounceFn(() => {
  modelRef.value?.calculateModelSize()
}, 100)

// 提取关键属性的计算属性，用于监视
const shapeProperties = computed(() =>
  svgShapes.value.map(s => ({
    id: s.shape.uuid, // 假设shape有uuid，如果没有可以使用其他唯一标识
    depth: s.depth,
    startZ: s.startZ
  }))
)

// 使用计算属性进行监视，避免深层比较的性能开销
watch(
  [scale, shapeProperties, () => svgShapes.value.length],
  recalculateModel,
  { deep: false } // 由于我们已经提取了关键属性，不需要深度监视
)

// 组件挂载后初始化计算
onMounted(recalculateModel)

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
  // 防止除以零的情况
  if (currentSize === 0) return currentScale

  // 更准确的比例计算
  return currentScale * (targetSize / currentSize)
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
    parseSVG(e.target?.result as string)
  }
  reader.readAsText(file)
})

/**
 * Parse SVG data and convert to 3D shapes
 */
function parseSVG(svgData: string): void {
  try {
    isLoading.value = true
    loadError.value = ''

    const loader = new SVGLoader()
    const svgParsed = loader.parse(svgData)

    // 使用computed函数优化大型数据处理
    const processShapes = () => {
      return svgParsed.paths
        .flatMap((path) => {
          const shapes = SVGLoader.createShapes(path)

          // 提取和标准化颜色
          const style = path.userData?.style || {}
          const color = (style.fill && style.fill !== 'none')
            ? style.fill
            : (style.stroke || '#FFA500')
          const fillOpacity = style.fillOpacity ?? 1

          return shapes.map((shape) => ({
            shape: markRaw(shape),
            color: markRaw(new Color().setStyle(color)),
            depth: RELIEF_DEPTH,
            startZ: 0,
            opacity: fillOpacity,
            polygonOffset: 0,
          } as ShapeWithColor))
        })
    }

    // 分配处理结果
    svgShapes.value = processShapes()

    // 确保深度值有效
    if (svgShapes.value.length && !svgShapes.value.some(s => s.depth > 0)) {
      svgShapes.value.forEach(s => s.depth = RELIEF_DEPTH)
    }

    // 处理模型初始大小
    nextTick(async () => {
      try {
        // 先设置一个合理的初始缩放值
        scale.value = 1

        // 触发模型尺寸计算
        modelRef.value?.calculateModelSize()

        // 等待尺寸计算完成
        await nextTick()

        // 计算并设置为期望的大小
        if (modelSize.value.width > 0) {
          scale.value = DEFAULT_SIZE / modelSize.value.width
        }
      } catch (err) {
        console.error('设置默认大小时出错:', err)
      }
    })

    isLoading.value = false
  } catch (error) {
    isLoading.value = false
    loadError.value = '无法解析SVG文件，请检查文件格式'
    console.error('SVG解析错误:', error)
  }
}

/**
 * Update the Z position of a shape
 */
function updateStartZ(e: { index: number, value: Event }): void {
  const { index, value } = e
  const shape = svgShapes.value[index]

  if (!shape) return

  const input = value.target as HTMLInputElement
  const numValue = Number(input.value)

  if (!isNaN(numValue)) {
    // 创建新对象以确保响应性
    svgShapes.value[index] = { ...shape, startZ: numValue }
  }
}

/**
 * Update the depth of a shape
 */
function updateDepth(e: { index: number, value: Event }): void {
  const { index, value } = e
  const shape = svgShapes.value[index]

  if (!shape) return

  const input = value.target as HTMLInputElement
  const numValue = Number(input.value)

  if (!isNaN(numValue)) {
    // 创建新对象以确保响应性
    svgShapes.value[index] = { ...shape, depth: numValue }
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex">
    <div class="fixed left-10 top-10 z-50">
    </div>
    <Tools :svg-shapes="svgShapes" :file-name="fileName" :model-size="modelSize" @open="open" v-model:size="size"
      @update-start-z="updateStartZ" @update-depth="updateDepth" />
    <ThreeD ref="modelRef" :svg-shapes="svgShapes" :scale="scale" @update:model-size="updateModelSize" />
  </div>
</template>
