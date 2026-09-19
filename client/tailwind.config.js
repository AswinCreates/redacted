/**
 * MVFRWD official design tokens.
 *
 * Single source of truth for the brand palette - every component references
 * these tokens (or the CSS variables in index.css), never raw hex values.
 *
 *   primary    #FF6B00  CTAs, active states, highlights, accents
 *   night      #0A0A0A  primary dark background
 *   coal       #1A1A1A  cards, panels, secondary surfaces
 *   bone       #F5F5F0  primary text on dark backgrounds
 *   white      #FFFFFF  high-contrast text / clean surfaces
 *   mist       #A1A1A1  secondary text, metadata, inactive states
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent with a small ramp for hover/active/glow states.
        brand: {
          300: '#FFA25E',
          400: '#FF8433',
          500: '#FF6B00',
          600: '#E05E00',
          700: '#B34C00',
        },
        night: '#0A0A0A',
        coal: '#1A1A1A',
        bone: '#F5F5F0',
        mist: '#A1A1A1',
        // Legacy surface scale kept as an alias of the official surfaces so
        // older utility classes keep working while new code uses night/coal.
        ink: {
          950: '#0A0A0A',
          900: '#101010',
          800: '#1A1A1A',
          700: '#242424',
          600: '#333333',
        },
      },
      fontFamily: {
        display: ['"Segoe UI Variable Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        body: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Cascadia Mono"', '"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--float-rot, 0deg))' },
          '50%': { transform: 'translateY(-10px) rotate(var(--float-rot, 0deg))' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(.92)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '.45' },
          '50%': { opacity: '.95' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-130%)' },
          '100%': { transform: 'translateX(230%)' },
        },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'float-soft': 'floatSoft 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp .45s ease-out both',
        'pop-in': 'popIn .35s cubic-bezier(.34, 1.56, .64, 1) both',
        'slide-in-left': 'slideInLeft .35s ease-out both',
        'rise-in': 'riseIn .5s ease-out both',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2.6s ease-in-out infinite',
        'spin-slow': 'spinSlow 14s linear infinite',
      },
    },
  },
  plugins: [],
};

