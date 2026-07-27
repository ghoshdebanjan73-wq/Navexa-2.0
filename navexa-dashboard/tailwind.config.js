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
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        dash: {
          to: { strokeDashoffset: 0 },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease-out both',
        dash: 'dash 1.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
