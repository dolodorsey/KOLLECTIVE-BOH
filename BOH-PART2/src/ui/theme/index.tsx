import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// 48 Semantic Color Tokens
export const colors = {
  light: {
    // Primary
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    primaryActive: '#4338CA',
    primarySubtle: '#EEF2FF',
    
    // Secondary
    secondary: '#8B5CF6',
    secondaryHover: '#7C3AED',
    secondaryActive: '#6D28D9',
    secondarySubtle: '#F5F3FF',
    
    // Success
    success: '#10B981',
    successHover: '#059669',
    successActive: '#047857',
    successSubtle: '#D1FAE5',
    
    // Warning
    warning: '#F59E0B',
    warningHover: '#D97706',
    warningActive: '#B45309',
    warningSubtle: '#FEF3C7',
    
    // Error
    error: '#EF4444',
    errorHover: '#DC2626',
    errorActive: '#B91C1C',
    errorSubtle: '#FEE2E2',
    
    // Info
    info: '#3B82F6',
    infoHover: '#2563EB',
    infoActive: '#1D4ED8',
    infoSubtle: '#DBEAFE',
    
    // Neutral
    neutral50: '#FAFAFA',
    neutral100: '#F5F5F5',
    neutral200: '#E5E5E5',
    neutral300: '#D4D4D4',
    neutral400: '#A3A3A3',
    neutral500: '#737373',
    neutral600: '#525252',
    neutral700: '#404040',
    neutral800: '#262626',
    neutral900: '#171717',
    
    // Semantic UI
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceElevated: '#FFFFFF',
    border: '#E5E7EB',
    borderSubtle: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textPlaceholder: '#D1D5DB',
  },
  dark: {
    // Primary
    primary: '#818CF8',
    primaryHover: '#A5B4FC',
    primaryActive: '#C7D2FE',
    primarySubtle: '#312E81',
    
    // Secondary
    secondary: '#A78BFA',
    secondaryHover: '#C4B5FD',
    secondaryActive: '#DDD6FE',
    secondarySubtle: '#4C1D95',
    
    // Success
    success: '#34D399',
    successHover: '#6EE7B7',
    successActive: '#A7F3D0',
    successSubtle: '#064E3B',
    
    // Warning
    warning: '#FBBF24',
    warningHover: '#FCD34D',
    warningActive: '#FDE68A',
    warningSubtle: '#78350F',
    
    // Error
    error: '#F87171',
    errorHover: '#FCA5A5',
    errorActive: '#FECACA',
    errorSubtle: '#7F1D1D',
    
    // Info
    info: '#60A5FA',
    infoHover: '#93C5FD',
    infoActive: '#BFDBFE',
    infoSubtle: '#1E3A8A',
    
    // Neutral
    neutral50: '#18181B',
    neutral100: '#27272A',
    neutral200: '#3F3F46',
    neutral300: '#52525B',
    neutral400: '#71717A',
    neutral500: '#A1A1AA',
    neutral600: '#D4D4D8',
    neutral700: '#E4E4E7',
    neutral800: '#F4F4F5',
    neutral900: '#FAFAFA',
    
    // Semantic UI
    background: '#09090B',
    surface: '#18181B',
    surfaceElevated: '#27272A',
    border: '#3F3F46',
    borderSubtle: '#27272A',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    textPlaceholder: '#52525B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

type Theme = {
  colors: typeof colors.light;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const theme: Theme = {
    colors: isDark ? colors.dark : colors.light,
    spacing,
    typography,
    borderRadius,
    shadows,
    isDark,
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export type { Theme, ThemeContextType };
