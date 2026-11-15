import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { parse } from 'yaml'
import { MARCA } from './src/marca.ts'

/** Convierte los archivos .yaml de contenido en datos que la app puede importar. */
function contenidoYaml(): Plugin {
  return {
    name: 'ingenia-yaml',
    transform(codigo, id) {
      if (!/\.ya?ml$/.test(id)) return null
      try {
        return { code: `export default ${JSON.stringify(parse(codigo))}`, map: null }
      } catch (e) {
        this.error(`Error de escritura en ${id}: ${(e as Error).message}`)
      }
    },
  }
}

/** Pone el nombre de la app (src/marca.ts) en index.html. */
function nombreEnHtml(): Plugin {
  return {
    name: 'ingenia-marca',
    transformIndexHtml: (html) => html.replaceAll('%NOMBRE%', MARCA.nombre),
  }
}

export default defineConfig({
  // Rutas relativas: la app funciona igual en la raíz de un dominio o en una subcarpeta.
  base: './',
  plugins: [react(), tailwindcss(), contenidoYaml(), nombreEnHtml()],
  build: { chunkSizeWarningLimit: 700 },
  test: { include: ['tests/**/*.test.ts'] },
})
