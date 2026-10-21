import { defineConfig } from 'vite';
export default defineConfig({ base: './', preview: { allowedHosts: true }, build: { outDir: 'dist', target: 'es2019' } });
