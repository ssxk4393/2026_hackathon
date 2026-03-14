/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './caption.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 배경
        'surface-0': '#0f0f1a',
        'surface-1': '#1a1a2e',
        'surface-2': '#232340',
        'surface-3': '#2d2d50',
        // 강조
        'accent': '#6366f1',
        'accent-hover': '#818cf8',
        'active-operator': '#10B981',
        'active-glow': '#10B98140',
        'standby': '#6B7280',
        // 텍스트
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        // 보더
        'border-subtle': '#334155',
        'border-active': '#6366f1',
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-accent': '0 0 20px rgba(99, 102, 241, 0.3)',
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
