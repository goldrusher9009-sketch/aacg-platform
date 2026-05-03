/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        foreground: 'hsl(var(--foreground))',
        background: 'hsl(var(--background))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        input: 'hsl(var(--input))',
        border: 'hsl(var(--border))',
      },
    },
  },
  plugins: [],
};
