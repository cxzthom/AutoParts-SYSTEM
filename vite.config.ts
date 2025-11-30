import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRUCIAL para Electron: permite carregar assets com caminho relativo
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});