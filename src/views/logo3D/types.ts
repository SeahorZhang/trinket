import type { Color, Shape } from 'three'

/**
 * 表示具有颜色的形状
 */
export interface ShapeWithColor {
  shape: Shape
  color: Color
  opacity: number
  depth: number
  startZ: number
  polygonOffset: number
}

/**
 * 模型尺寸
 */
export interface ModelSize {
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 深度 */
  depth: number
}
