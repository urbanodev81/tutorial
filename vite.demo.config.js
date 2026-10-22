import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// A demonstração (GitHub Pages) usa o pacote pela FONTE, como um sistema que
// o instala: o alias aponta o nome publicado para `src/`.
export default defineConfig({
    root: 'demo',
    base: './',
    plugins: [vue()],
    resolve: {
        alias: { '@urbanodev/tutorial': fileURLToPath(new URL('./src/index.js', import.meta.url)) },
    },
    build: { outDir: '../dist-demo', emptyOutDir: true },
});
