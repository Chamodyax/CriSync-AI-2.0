export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Instrument Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        brand: ['"Outfit"', '"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        glass: '0 20px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        glow: '0 0 35px -5px rgba(99, 102, 241, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
        emeraldGlow: '0 0 30px -5px rgba(16, 185, 129, 0.35)',
        crimsonGlow: '0 0 30px -5px rgba(244, 63, 94, 0.35)'
      }
    }
  },
  plugins: []
};
