/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        bg:      '#0a0e1a',
        surface: '#111827',
        card:    '#161d2e',
        border:  '#1e2d45',
        stack:   { DEFAULT: '#3b82f6', dim: '#1e3a5f', glow: '#60a5fa' },
        heap:    { DEFAULT: '#10b981', dim: '#064e3b', glow: '#34d399' },
        meta:    { DEFAULT: '#f59e0b', dim: '#451a03', glow: '#fbbf24' },
        accent:  '#8b5cf6',
        muted:   '#64748b',
        text:    '#e2e8f0',
      },
      boxShadow: {
        'stack-glow': '0 0 20px rgba(59,130,246,0.3)',
        'heap-glow':  '0 0 20px rgba(16,185,129,0.3)',
        'meta-glow':  '0 0 20px rgba(245,158,11,0.3)',
        'accent-glow':'0 0 30px rgba(139,92,246,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-stack': 'glowStack 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glowStack: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59,130,246,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(59,130,246,0.5)' },
        }
      }
    }
  },
  plugins: []
}