/**
 * Fixed category palette. Every color keeps white text at WCAG AA (>= 4.5:1)
 * and the hues are spread out so slices stay distinguishable on the wheel.
 */
export const CATEGORY_COLORS = [
  '#C62828', // red
  '#BF360C', // deep orange
  '#827717', // olive
  '#2E7D32', // green
  '#00796B', // teal
  '#1565C0', // blue
  '#3949AB', // indigo
  '#6A1B9A', // purple
  '#AD1457', // pink
  '#5D4037', // brown
] as const

export type CategoryColor = (typeof CATEGORY_COLORS)[number]

export function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value)
}

/** WCAG contrast ratio between two `#rrggbb` colors. */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)]
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
