import type { Config } from 'tailwindcss';

// Shared "Live Canvas" design tokens. Apps extend this preset — never duplicate
// tokens. Colors use CSS variables so runtime theming (light/dark) works without
// a rebuild. See globals.css for the variable definitions.
export const tailwindPreset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        // Presence — real collaborators. These are brand colors, true to the product.
        presence: {
          iris: 'hsl(var(--presence-iris))',
          amber: 'hsl(var(--presence-amber))',
          teal: 'hsl(var(--presence-teal))',
          rose: 'hsl(var(--presence-rose))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 0.25rem)',
        sm: 'calc(var(--radius) - 0.5rem)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Soft, believable elevation — no harsh drop shadows.
        elevate: '0 1px 2px hsl(224 22% 9% / 0.04), 0 8px 24px -8px hsl(224 22% 9% / 0.12)',
        float: '0 2px 6px hsl(224 22% 9% / 0.06), 0 24px 48px -16px hsl(224 22% 9% / 0.22)',
        'glow-iris': '0 0 0 1px hsl(var(--primary) / 0.35), 0 12px 40px -8px hsl(var(--primary) / 0.45)',
      },
      backgroundImage: {
        'iris-amber': 'linear-gradient(120deg, hsl(var(--primary)), hsl(var(--accent)))',
        'canvas-grid':
          'linear-gradient(hsl(var(--border) / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.6) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'caret-blink': { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        'cursor-drift': {
          '0%,100%': { transform: 'translate(0,0)' },
          '33%': { transform: 'translate(4px,-6px)' },
          '66%': { transform: 'translate(-5px,3px)' },
        },
        'presence-pop': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        sheen: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'slide-up': 'slide-up 320ms cubic-bezier(0.2,0.7,0.2,1) both',
        'caret-blink': 'caret-blink 1.1s steps(1) infinite',
        'cursor-drift': 'cursor-drift 6s ease-in-out infinite',
        'presence-pop': 'presence-pop 360ms cubic-bezier(0.2,0.9,0.2,1) both',
        sheen: 'sheen 2.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default tailwindPreset;
