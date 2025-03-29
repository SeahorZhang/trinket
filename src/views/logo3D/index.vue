<script setup lang="ts">
import type { Group, Shape } from 'three'
import ThreeD from './components/3D.vue'
import Tools from './components/Tools.vue'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { Color } from 'three'

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

const reliefDepth = 2
const defaultSize = 37


const svgShapes = ref<ShapeWithColor[]>([])
const modelSize = ref<ModelSize>({ width: 0, height: 0, depth: 0 })
const fileName = ref('点击上传 SVG 文件')
const fileData = ref<File>()
const scale = ref(1) // 添加缩放控制变量

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


function calcScale(nowScale: number, nowSize: number, targetSize: number) {
  return targetSize / (nowSize / nowScale)
}

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
    console.log('加载的SVG数据:', svgData) // 调试原始SVG
    parseSVG(svgData)
  }
  reader.readAsText(file)
})

function parseSVG(svgData: string) {
  const loader = new SVGLoader()
  const svgParsed = loader.parse(svgData)
  console.log('SVG解析结果:', svgParsed) // 调试解析结果

  // 确保SVG中有填充区域
  svgShapes.value = svgParsed.paths.map((path, pathIndex) => {
    // 尝试创建形状
    const shapes = SVGLoader.createShapes(path)
    console.log(`Path ${pathIndex} 创建的形状:`, shapes)

    // 获取颜色，优先使用fill
    let color = path.userData?.style?.fill
    // 如果没有fill颜色，尝试使用stroke颜色
    if (!color || color === 'none') {
      color = path.userData?.style?.stroke || '#FFA500'
      console.log(`Path ${pathIndex} 没有填充颜色，使用描边颜色:`, color)
    }

    const fillOpacity = path.userData?.style?.fillOpacity ?? 1

    // 创建带有颜色的形状
    const shapesWithColor = shapes.map((shape) => {
      return {
        shape: markRaw(shape),
        color: markRaw(new Color().setStyle(color)),
        depth: reliefDepth || 2, // 确保深度不为零
        startZ: 0,
        opacity: fillOpacity,
        polygonOffset: 0,
      } as ShapeWithColor
    })

    return shapesWithColor
  }).flat(1)

  // 确保至少有一个形状并且有深度
  if (svgShapes.value.length && !svgShapes.value.some(s => s.depth > 0)) {
    console.warn('所有形状深度为0, 设置默认深度')
    svgShapes.value.forEach(s => s.depth = reliefDepth || 2)
  }

  nextTick(async () => {
    await nextTick()
    size.value = defaultSize
  })
}


// 添加更新startZ的函数
function updateStartZ(e: { index: number, value: Event }) {
  if (svgShapes.value[e.index]) {
    // Get the numeric value from the event target
    const numValue = Number((e.value.target as HTMLInputElement).value)
    svgShapes.value[e.index].startZ = numValue
  }
}

function updateDepth(e: { index: number, value: Event }) {
  if (svgShapes.value[e.index]) {
    // Get the numeric value from the event target
    const numValue = Number((e.value.target as HTMLInputElement).value)
    svgShapes.value[e.index].depth = numValue
  }
}

</script>

<template>
  <div class="min-h-screen w-full flex">
    <Tools :svgShapes="svgShapes" v-model:size="size" :fileName="fileName" :modelSize="modelSize" @open="open"
      @updateStartZ="updateStartZ" @updateDepth="updateDepth" />
    <ThreeD :svg-shapes="svgShapes" :scale="scale" v-model:modelSize="modelSize"/>
  </div>
</template>
