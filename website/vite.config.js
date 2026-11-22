import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/climarisk-tunisia/
export default defineConfig({
  base: '/climarisk-tunisia/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 }
});
