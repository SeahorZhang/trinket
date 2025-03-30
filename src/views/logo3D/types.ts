import type { Color } from 'three'

/**
 * 表示具有颜色的形状
 */
export interface ShapeWithColor {
  /** three.js颜色对象 */
  color: Color
  /** 形状深度 */
  depth: number
  /** Z轴起始位置 */
  startZ: number
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