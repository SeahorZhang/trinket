<script setup lang="ts">
import type { ShapeWithColor, ModelSize } from '../types'

// Props definition with proper typing
defineProps<{
  svgShapes: ShapeWithColor[]
  fileName: string
  modelSize: ModelSize
}>()

// Emits with type safety
const emit = defineEmits<{
  (e: 'open'): void
  (e: 'update:size', size: number): void
  (e: 'update-start-z', { index, value }: { index: number, value: Event }): void
  (e: 'update-depth', { index, value }: { index: number, value: Event }): void
}>()

// Default model value with description
const size = defineModel<number>('size', { default: 37 })
</script>

<template>
  <div
    class="flex flex-col gap-4 p-4 rounded-xl bg-white/50 w-96 fixed left-10 top-10 z-50 overflow-y-auto  dark:bg-black/50 max-h-[calc(100vh-160px)]">
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-medium">
        Logo 3D
      </h1>
      <p class="opacity-80">
        将 SVG Logo 转换为 3D 小饼干
      </p>
    </div>
    <button
      class="flex items-center p-2 border rounded cursor-pointer relative bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30"
      @click="emit('open')">
      {{ fileName }}
    </button>

    <template v-if="svgShapes.length">
      <label class="flex flex-1 items-center">
        <span>大小：</span>
        <input v-model.lazy.number="size" type="number" class="border-b flex-1">
        毫米（mm）
      </label>

      <div class="flex flex-col gap-4">
        <div v-for="(item, index) in svgShapes" :key="index" class="flex gap-4">
          <div class="flex gap-2 items-center" :title="`Shape ${index + 1}`">
            <div class="border rounded h-5 min-h-5 min-w-5 w-5"
              :style="{ background: `#${item.color.getHexString()}` }" />
            <pre class="min-w-5">{{ index + 1 }}</pre>
          </div>

          <label class="flex gap-2 items-center" title="起点位置">
            距离：
            <input type="number" min="-10" step="0.1" max="10" :value="item.startZ"
              class="px-1 border-b w-20 inline-block" @change="emit('update-start-z', { index, value: $event })">
          </label>
          <label class="flex gap-2 items-center" title="拉伸深度">
            深度：
            <input type="number" min="0" step="0.1" max="10" :value="item.depth" class="px-1 border-b w-20 inline-block"
              @change="emit('update-depth', { index, value: $event })">
          </label>
        </div>
      </div>

      <div v-if="modelSize.width" class="flex gap-2 items-center">
        尺寸：
        <div>W: {{ modelSize.width }}</div>
        <div>H: {{ modelSize.height }}</div>
        <div>L: {{ modelSize.depth }}</div>
      </div>

    </template>
  </div>
</template>
