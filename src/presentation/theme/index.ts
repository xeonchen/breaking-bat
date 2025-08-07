import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

// Custom color palette for softball/sports theme
const colors = {
  brand: {
    50: '#E6F3FF',
    100: '#B3DBFF',
    200: '#80C4FF',
    300: '#4DACFF',
    400: '#1A94FF',
    500: '#4A90E2', // Primary brand color
    600: '#3A7BC8',
    700: '#2A66AE',
    800: '#1A5194',
    900: '#0A3C7A',
  },
  softball: {
    field: '#4A7C59', // Green for field
    dirt: '#D2B48C', // Tan for infield
    warning: '#FF8C00', // Orange for warnings
  },
  success: {
    50: '#F0FFF4',
    500: '#38A169',
    600: '#2F855A',
  },
  error: {
    50: '#FED7D7',
    500: '#E53E3E',
    600: '#C53030',
  },
};

// Typography scale optimized for mobile/tablet scoring
const fonts = {
  heading: `'Inter', system-ui, sans-serif`,
  body: `'Inter', system-ui, sans-serif`,
  mono: `'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`,
};

const fontSizes = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  md: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
};

// Component customizations for better mobile UX
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
      _focus: {
        boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.6)',
      },
    },
    sizes: {
      sm: {
        fontSize: 'sm',
        px: 4,
        py: 2,
        h: '32px',
        minW: '32px',
      },
      md: {
        fontSize: 'md',
        px: 6,
        py: 3,
        h: '40px',
        minW: '40px',
      },
      lg: {
        fontSize: 'lg',
        px: 8,
        py: 4,
        h: '48px',
        minW: '48px',
      },
      // Custom size for scoring buttons
      scoring: {
        fontSize: 'xl',
        fontWeight: 'bold',
        px: 6,
        py: 4,
        h: '56px',
        minW: '56px',
        borderRadius: 'lg',
      },
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500',
          },
        },
        _active: {
          bg: 'brand.700',
        },
      },
      // Custom variant for batting result buttons
      battingResult: {
        bg: 'white',
        color: 'brand.600',
        border: '2px solid',
        borderColor: 'brand.200',
        _hover: {
          bg: 'brand.50',
          borderColor: 'brand.300',
        },
        _active: {
          bg: 'brand.100',
          borderColor: 'brand.400',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'md',
        bg: 'white',
        _dark: {
          bg: 'gray.800',
        },
      },
    },
  },
  Input: {
    sizes: {
      md: {
        field: {
          h: '44px', // Minimum touch target for mobile
        },
      },
    },
  },
  Select: {
    sizes: {
      md: {
        field: {
          h: '44px', // Minimum touch target for mobile
        },
      },
    },
  },
};

// Spacing scale
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Breakpoints for responsive design
const breakpoints = {
  base: '0em', // 0px
  sm: '30em', // 480px
  md: '48em', // 768px
  lg: '62em', // 992px
  xl: '80em', // 1280px
  '2xl': '96em', // 1536px
};

// Custom theme
const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  components,
  space,
  breakpoints,
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
        _dark: {
          bg: 'gray.900',
          color: 'gray.50',
        },
      },
    },
  },
});

export default theme;
