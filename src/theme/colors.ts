// Base palette primitive colors
const primitives = {
  teal600: '#0D9488',
  teal800: '#115E59',
  sky500: '#0BA5EC',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF', // muted
  gray800: '#1F2937', // text
  gray900: '#111827',
  black: '#000000',
  green600: '#079455',
  red500: '#EF4444',
  // Luxury Dark & Gold Pattern (Reference Image)
  luxuryBlack: '#050505',   // Deepest black for background end
  luxuryCharcoal: '#121212', // Slightly lighter for background start
  luxuryCard: '#1C1C1E',     // Card background
  luxuryGold: '#D4AF37',     // Metallic Gold
  luxuryGoldBright: '#F59E0B', // Bright Amber for active states/text
};

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceHighlight: string;
  border: string;
  text: string;
  textInverted: string;
  textMuted: string;
  muted: string;
  success: string;
  cardOverlay: string;
  tabBarActive: string;
  tabBarInactive: string;
  gradients: {
    background: string[];
    primary: string[];
    card: string[];
  };
};

export const lightTheme: ThemeColors = {
  primary: primitives.teal600,
  primaryDark: primitives.teal800,
  secondary: primitives.sky500,
  background: primitives.white, // or gray50? adhering to previous file which said #FFFFFF
  surface: primitives.white,
  surfaceHighlight: primitives.gray50,
  border: primitives.gray100,
  text: primitives.gray800,
  textInverted: primitives.white,
  muted: primitives.gray400,
  textMuted: primitives.gray400,
  success: primitives.green600,
  cardOverlay: 'rgba(0,0,0,0.2)',
  tabBarActive: primitives.teal600,
  tabBarInactive: primitives.gray400,
  gradients: {
    background: [primitives.white, primitives.gray50],
    primary: [primitives.teal600, primitives.teal800],
    card: [primitives.white, primitives.white],
  },
};

export const darkTheme: ThemeColors = {
  primary: primitives.luxuryGold,
  primaryDark: primitives.luxuryGoldBright,
  secondary: primitives.luxuryGold, // Secondary accent also gold per theme
  background: 'transparent', // Transparent to reveal global gradient
  surface: primitives.luxuryCard, // Solid card color or slightly transparent
  surfaceHighlight: '#2A2A2C',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textInverted: primitives.black,
  muted: '#9CA3AF', // Gray-400
  textMuted: '#9CA3AF',
  success: primitives.green600,
  cardOverlay: 'rgba(0,0,0,0.6)',
  tabBarActive: primitives.luxuryGold,
  tabBarInactive: '#6B7280',
  gradients: {
    background: [primitives.luxuryCharcoal, primitives.luxuryBlack], // Subtle dark gradient
    primary: [primitives.luxuryGold, primitives.luxuryGoldBright],
    card: [primitives.luxuryCard, primitives.luxuryCard], // Mostly solid, maybe subtle gradient later
  },
};

// Default export for backward compatibility during refactor
// TODO: Remove this once all components are migrated to useTheme()
export default lightTheme;
