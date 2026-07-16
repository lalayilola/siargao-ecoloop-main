export interface ThemePreferences {
  font: string;
  color_theme: string;
  header_background: string;
  dark_mode: boolean;
  border_radius: string;
  font_size: string;
  pagehero_design: string;
  pagehero_background_url: string | null;
}

export const FONTS = [
  { value: 'Figtree', label: 'Figtree (Default)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' },
] as const;

export const COLOR_THEMES = [
  {
    value: 'default',
    label: 'Eco Green (Default)',
    colors: {
      primary: '#16a34a',
      secondary: '#86efac',
      background: '#f0fdf4',
      foreground: '#14532d',
    },
    darkColors: {
      primary: '#22c55e',
      secondary: '#4ade80',
      background: '#0a0f0d',
      foreground: '#dcfce7',
    },
  },
  {
    value: 'ocean',
    label: 'Ocean Blue',
    colors: {
      primary: '#0ea5e9',
      secondary: '#7dd3fc',
      background: '#f0f9ff',
      foreground: '#0c4a6e',
    },
    darkColors: {
      primary: '#38bdf8',
      secondary: '#7dd3fc',
      background: '#0c1929',
      foreground: '#e0f2fe',
    },
  },
  {
    value: 'sunset',
    label: 'Sunset Orange',
    colors: {
      primary: '#f97316',
      secondary: '#fdba74',
      background: '#fff7ed',
      foreground: '#7c2d12',
    },
    darkColors: {
      primary: '#fb923c',
      secondary: '#fdba74',
      background: '#1a0f0a',
      foreground: '#ffedd5',
    },
  },
  {
    value: 'purple',
    label: 'Purple Haze',
    colors: {
      primary: '#8b5cf6',
      secondary: '#c4b5fd',
      background: '#faf5ff',
      foreground: '#581c87',
    },
    darkColors: {
      primary: '#a78bfa',
      secondary: '#c4b5fd',
      background: '#0f0a1a',
      foreground: '#f3e8ff',
    },
  },
  {
    value: 'forest',
    label: 'Forest Green',
    colors: {
      primary: '#15803d',
      secondary: '#86efac',
      background: '#f0fdf4',
      foreground: '#14532d',
    },
    darkColors: {
      primary: '#22c55e',
      secondary: '#4ade80',
      background: '#0a1f0d',
      foreground: '#dcfce7',
    },
  },
] as const;

export const HEADER_BACKGROUNDS = [
  {
    value: 'default',
    label: 'Default Gradient',
    gradient: 'bg-gradient-to-r from-secondary/20 via-white/80 to-sand/20',
  },
  {
    value: 'solid-primary',
    label: 'Solid Primary',
    gradient: 'bg-primary',
  },
  {
    value: 'ocean-gradient',
    label: 'Ocean Gradient',
    gradient: 'bg-gradient-to-r from-blue-500/20 via-white/80 to-cyan-500/20',
  },
  {
    value: 'sunset-gradient',
    label: 'Sunset Gradient',
    gradient: 'bg-gradient-to-r from-orange-500/20 via-white/80 to-red-500/20',
  },
  {
    value: 'minimal-white',
    label: 'Minimal White',
    gradient: 'bg-white',
  },
] as const;

export const PAGEHERO_DESIGNS = [
  {
    value: 'default',
    label: 'Floating Icons (Default)',
    description: 'Animated floating vegetable, fruit, and loop icons',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean design with subtle gradients only',
  },
  {
    value: 'nature',
    label: 'Nature Focus',
    description: 'More leaf and plant icons with green tones',
  },
  {
    value: 'vibrant',
    label: 'Vibrant',
    description: 'More colorful icons with brighter gradients',
  },
] as const;

export const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'None (Sharp)', cssValue: '0' },
  { value: 'small', label: 'Small', cssValue: '0.25rem' },
  { value: 'medium', label: 'Medium (Default)', cssValue: '0.5rem' },
  { value: 'large', label: 'Large', cssValue: '0.75rem' },
  { value: 'extra-large', label: 'Extra Large', cssValue: '1rem' },
] as const;

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small', multiplier: 0.875 },
  { value: 'medium', label: 'Medium (Default)', multiplier: 1 },
  { value: 'large', label: 'Large', multiplier: 1.125 },
  { value: 'extra-large', label: 'Extra Large', multiplier: 1.25 },
] as const;

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  font: 'Figtree',
  color_theme: 'default',
  header_background: 'default',
  dark_mode: false,
  border_radius: 'medium',
  font_size: 'medium',
  pagehero_design: 'default',
  pagehero_background_url: null,
};

export function getThemeColors(themeValue: string, darkMode: boolean = false) {
  const theme = COLOR_THEMES.find(t => t.value === themeValue);
  if (darkMode && theme?.darkColors) {
    return theme.darkColors;
  }
  return theme?.colors || COLOR_THEMES[0].colors;
}

export function getHeaderBackground(bgValue: string) {
  const bg = HEADER_BACKGROUNDS.find(b => b.value === bgValue);
  return bg?.gradient || HEADER_BACKGROUNDS[0].gradient;
}

export function getBorderRadius(radiusValue: string) {
  const option = BORDER_RADIUS_OPTIONS.find(o => o.value === radiusValue);
  return option?.cssValue || BORDER_RADIUS_OPTIONS[2].cssValue;
}

export function getFontSizeMultiplier(sizeValue: string) {
  const option = FONT_SIZE_OPTIONS.find(o => o.value === sizeValue);
  return option?.multiplier || FONT_SIZE_OPTIONS[1].multiplier;
}
