/**
 * CSS 变量类型定义
 * 与 globals.css 中的 CSS 变量保持一致
 */

export type CSSVarName = `--${string}`

/**
 * 获取 CSS 变量值的类型安全方法
 */
export function getCSSVar(name: keyof typeof cssVars): string {
  return `var(${cssVars[name]})`
}

/**
 * 所有 CSS 变量的名称映射
 */
export const cssVars = {
  // 色彩
  'color-white': '--color-white' as const,
  'color-black': '--color-black' as const,
  'color-gray-50': '--color-gray-50' as const,
  'color-gray-100': '--color-gray-100' as const,
  'color-gray-150': '--color-gray-150' as const,
  'color-gray-200': '--color-gray-200' as const,
  'color-gray-300': '--color-gray-300' as const,
  'color-gray-400': '--color-gray-400' as const,
  'color-gray-500': '--color-gray-500' as const,
  'color-gray-600': '--color-gray-600' as const,
  'color-gray-700': '--color-gray-700' as const,
  'color-gray-800': '--color-gray-800' as const,
  'color-gray-900': '--color-gray-900' as const,
  'color-primary-500': '--color-primary-500' as const,
  'color-primary-600': '--color-primary-600' as const,
  'color-success': '--color-success' as const,
  'color-warning': '--color-warning' as const,
  'color-error': '--color-error' as const,

  // 间距
  'spacing-1': '--spacing-1' as const,
  'spacing-2': '--spacing-2' as const,
  'spacing-3': '--spacing-3' as const,
  'spacing-4': '--spacing-4' as const,
  'spacing-6': '--spacing-6' as const,
  'spacing-8': '--spacing-8' as const,

  // 圆角
  'radius-sm': '--radius-sm' as const,
  'radius-md': '--radius-md' as const,
  'radius-lg': '--radius-lg' as const,
  'radius-xl': '--radius-xl' as const,
  'radius-full': '--radius-full' as const,

  // 阴影
  'shadow-sm': '--shadow-sm' as const,
  'shadow-md': '--shadow-md' as const,
  'shadow-lg': '--shadow-lg' as const,

  // 字体
  'font-family': '--font-family' as const,
  'font-size-xs': '--font-size-xs' as const,
  'font-size-sm': '--font-size-sm' as const,
  'font-size-base': '--font-size-base' as const,
  'font-size-lg': '--font-size-lg' as const,

  // 动效
  'duration-fast': '--duration-fast' as const,
  'duration-normal': '--duration-normal' as const,
  'easing-default': '--easing-default' as const,
} as const

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark'

/**
 * 获取当前主题
 */
export function getCurrentTheme(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * 设置主题
 */
export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * 监听主题变化
 */
export function onThemeChange(callback: (theme: Theme) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }

  mediaQuery.addEventListener('change', handler)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

/**
 * 样式工具函数
 */
export const styleUtils = {
  /**
   * 获取 CSS 变量值
   */
  var: (name: keyof typeof cssVars) => `var(${cssVars[name]})`,

  /**
   * 创建过渡样式
   */
  transition: (
    properties: string[],
    duration: keyof typeof cssVars = 'duration-normal',
    easing: keyof typeof cssVars = 'easing-default'
  ) => {
    const durationVar = cssVars[duration]
    const easingVar = cssVars[easing]
    return properties.map(p => `${p} var(${durationVar}) var(${easingVar})`).join(', ')
  },

  /**
   * 创建阴影样式
   */
  shadow: (level: 'sm' | 'md' | 'lg' = 'md') => `var(${cssVars[`shadow-${level}`]})`,

  /**
   * 创建间距样式
   */
  spacing: (level: 1 | 2 | 3 | 4 | 6 | 8) => `var(${cssVars[`spacing-${level}`]})`,

  /**
   * 创建圆角样式
   */
  radius: (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => `var(${cssVars[`radius-${size}`]})`,
}
