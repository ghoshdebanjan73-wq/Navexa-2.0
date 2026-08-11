/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#172554',
          50: '#EEF2FB',
          100: '#D6E0F5',
          400: '#3A5AA0',
          600: '#22397A',
          700: '#1A295C',
          900: '#172554',
        },
        accent: {
          DEFAULT: '#2563EB',
          50: '#EFF4FE',
          100: '#DCE8FD',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#0F172A',
          soft: '#64748B',
        },
        line: '#E2E8F0',
        info: {
          DEFAULT: '#0EA5E9',
          bg: '#F0F9FF',
        },
        success: {
          DEFAULT: '#16A34A',
          bg: '#EEFBF3',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFAEB',
        },
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 12px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 4px 10px rgba(15, 23, 42, 0.06), 0 2px 20px rgba(15, 23, 42, 0.05)',
        pop: '0 8px 24px rgba(23, 37, 84, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        modalPop: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '70%': { transform: 'scale(1.01) translateY(-1px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)', boxShadow: '0 0 0 6px rgba(37, 99, 235, 0)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        fadeIn: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        scaleUp: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        modalPop: 'modalPop 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        slideUp: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        slideDown: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        slideInRight: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        pulseGlow: 'pulseGlow 2.5s infinite ease-in-out',
        floatSubtle: 'floatSubtle 3s infinite ease-in-out',
        shimmer: 'shimmer 1.8s infinite linear',
      },
    },
  },
  plugins: [],
}
