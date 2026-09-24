// src/utils/placeholderImage.ts (do not remove this comment)
// src/utils/placeholderImage.ts

const placeholders = {
  light: require('../../assets/images/placeholder-light.png'),
  dark: require('../../assets/images/placeholder-dark.png'),
} as const;

export function getPlaceholder(isDark: boolean) {
  return isDark ? placeholders.dark : placeholders.light;
}