/**
 * SayItBetter Design Tokens
 * 基于 OpenAI 设计语言的极简风格
 */

export const tokens = {
  // ========== 色彩系统 ==========
  colors: {
    // 主色 - 极致黑白
    white: '#FFFFFF',
    black: '#0A0A0A',

    // 灰度阶梯 - 用于层次
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      150: '#EAEAEA',
      200: '#E5E5E5',  // 边框色
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // 强调色 - 仅用于交互状态
    primary: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      400: '#38BDF8',
      500: '#0EA5E9',  // 主强调色
      600: '#0284C7',
      700: '#0369A1',
    },

    // 语义色
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // ========== 字体系统 ==========
  typography: {
    // 字体家族 - Inter 优先，系统字体兜底
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    // 字号阶梯 - 基于比例
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },

    // 字重
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    // 行高
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // ========== 间距系统 ==========
  // 4px 基准，符合 OpenAI 风格
  spacing: {
    0: '0',
    px: '1px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  // ========== 圆角系统 ==========
  // 小圆角，技术感
  radius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  // ========== 阴影系统 ==========
  // 极简阴影，几乎不可见
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.03)',
    sm: '0 1px 3px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.04)',
    lg: '0 10px 15px rgba(0,0,0,0.04)',
    xl: '0 20px 25px rgba(0,0,0,0.04)',
  },

  // ========== 边框系统 ==========
  border: {
    width: {
      thin: '1px',
      normal: '1px',
      thick: '2px',
    },
    color: {
      default: '#E5E5E5',
      hover: '#D4D4D4',
      focus: '#0EA5E9',
    },
  },

  // ========== 动效系统 ==========
  easing: {
    // OpenAI 风格：快速线性过渡
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'cubic-bezier(0, 0, 0.2, 1)',      // ingress
    slow: 'cubic-bezier(0.4, 0, 1, 1)',      // egress
  },

  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  // ========== z-index 分层 ==========
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
}

// ========== 组件级 Token ==========

export const buttonTokens = {
  // Primary 按钮
  primary: {
    background: tokens.colors.black,
    color: tokens.colors.white,
    hover: tokens.colors.gray[800],
    active: tokens.colors.gray[700],
    disabled: tokens.colors.gray[300],
  },

  // Secondary 按钮
  secondary: {
    background: tokens.colors.white,
    color: tokens.colors.black,
    border: tokens.colors.gray[200],
    hover: tokens.colors.gray[50],
    active: tokens.colors.gray[100],
  },

  // Ghost 按钮
  ghost: {
    background: 'transparent',
    color: tokens.colors.gray[600],
    hover: tokens.colors.gray[100],
    active: tokens.colors.gray[200],
  },
}

export const inputTokens = {
  default: {
    background: tokens.colors.white,
    border: tokens.colors.gray[200],
    color: tokens.colors.black,
    placeholder: tokens.colors.gray[400],
  },

  focus: {
    border: tokens.colors.primary[500],
    ring: 'rgba(14, 165, 233, 0.1)',
  },

  error: {
    border: tokens.colors.error,
    ring: 'rgba(239, 68, 68, 0.1)',
  },
}

export const cardTokens = {
  background: tokens.colors.white,
  border: tokens.colors.gray[200],
  shadow: tokens.shadow.sm,
  radius: tokens.radius.lg,
}

export const modalTokens = {
  backdrop: 'rgba(10, 10, 10, 0.4)',
  background: tokens.colors.white,
  radius: tokens.radius.xl,
  shadow: tokens.shadow.xl,
}

// ========== CSS 变量导出 ==========
// 用于在 CSS 中使用
export const cssVars = {
  // 色彩
  '--color-white': tokens.colors.white,
  '--color-black': tokens.colors.black,
  '--color-gray-50': tokens.colors.gray[50],
  '--color-gray-100': tokens.colors.gray[100],
  '--color-gray-200': tokens.colors.gray[200],
  '--color-gray-300': tokens.colors.gray[300],
  '--color-gray-400': tokens.colors.gray[400],
  '--color-gray-500': tokens.colors.gray[500],
  '--color-gray-600': tokens.colors.gray[600],
  '--color-gray-700': tokens.colors.gray[700],
  '--color-gray-800': tokens.colors.gray[800],
  '--color-gray-900': tokens.colors.gray[900],

  '--color-primary': tokens.colors.primary[500],
  '--color-primary-hover': tokens.colors.primary[600],

  '--color-success': tokens.colors.success,
  '--color-warning': tokens.colors.warning,
  '--color-error': tokens.colors.error,

  // 间距
  '--spacing-1': tokens.spacing[1],
  '--spacing-2': tokens.spacing[2],
  '--spacing-3': tokens.spacing[3],
  '--spacing-4': tokens.spacing[4],
  '--spacing-6': tokens.spacing[6],
  '--spacing-8': tokens.spacing[8],

  // 圆角
  '--radius-sm': tokens.radius.sm,
  '--radius-md': tokens.radius.md,
  '--radius-lg': tokens.radius.lg,
  '--radius-xl': tokens.radius.xl,
  '--radius-full': tokens.radius.full,

  // 阴影
  '--shadow-sm': tokens.shadow.sm,
  '--shadow-md': tokens.shadow.md,
  '--shadow-lg': tokens.shadow.lg,

  // 字体
  '--font-family': tokens.typography.fontFamily,
} as const

// ========== 暗色模式 Token ==========
export const darkTokens = {
  colors: {
    white: '#0A0A0A',      // 反转
    black: '#FAFAFA',      // 反转

    gray: {
      50: '#171717',       // 反转
      100: '#262626',      // 反转
      200: '#404040',      // 反转
      300: '#525252',      // 反转
      400: '#737373',      // 反转
      500: '#A3A3A3',      // 反转
      600: '#D4D4D4',      // 反转
      700: '#E5E5E5',      // 反转
      800: '#F5F5F5',      // 反转
      900: '#FAFAFA',      // 反转
    },

    primary: {
      500: '#0EA5E9',      // 保持不变
      600: '#38BDF8',      // 调亮
    },
  },
}

export default tokens
