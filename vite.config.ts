import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Allow overriding base path via env for hosting targets (e.g., itch.io requires relative base)
const base = process.env.VITE_BASE ?? '/ai-twon';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    allowedHosts: ['ai-town-your-app-name.fly.dev', 'localhost', '127.0.0.1'],
  },
});
