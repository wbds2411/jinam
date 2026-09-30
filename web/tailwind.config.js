/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--nd-canvas)',
        surface: 'var(--nd-surface)',
        content: 'var(--nd-text)',
        muted: 'var(--nd-muted)',
        primary: 'var(--nd-primary)',
        'on-primary': 'var(--nd-on-primary)',
        link: 'var(--nd-link)',
        success: 'var(--nd-success)',
        warning: 'var(--nd-warning)',
        danger: 'var(--nd-danger)',
        control: 'var(--nd-control-border)',
        line: 'var(--nd-border)',
        // 오방색 (정보 시각화용)
        wood: { DEFAULT: '#4ade80', dark: '#166534' },    // 청록/녹색 (목)
        fire: { DEFAULT: '#f87171', dark: '#991b1b' },     // 적색 (화)
        earth: { DEFAULT: '#fbbf24', dark: '#92400e' },    // 황색 (토)
        metal: { DEFAULT: '#e2e8f0', dark: '#475569' },    // 백색/회색 (금)
        water: { DEFAULT: '#60a5fa', dark: '#1e40af' },    // 흑색/남색 (수)
        // UI 톤
        ink: '#2d3748',
        paper: '#f7fafc',
        sand: '#e2d5c5',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif'],
        display: ['"Noto Serif KR"', 'serif'],
      },
    },
  },
  plugins: [],
};
