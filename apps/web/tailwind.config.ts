import type { Config } from 'tailwindcss';

import { tailwindPreset } from '@collab/ui/tailwind-preset';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
