import { construirBiblioteca } from './biblioteca'

// Vite recoge aquí todos los archivos de la carpeta contenido/.
const modulos = import.meta.glob('../../contenido/**/*.{yaml,yml}', { eager: true, import: 'default' })
const urlsFiguras = import.meta.glob('../../contenido/**/figuras/*', { eager: true, import: 'default', query: '?url' })

const relativa = (ruta: string) => ruta.replace('../../contenido/', '')

const archivos = Object.fromEntries(Object.entries(modulos).map(([ruta, datos]) => [relativa(ruta), datos]))
const figuras = Object.fromEntries(Object.entries(urlsFiguras).map(([ruta, url]) => [relativa(ruta), url as string]))

export const { biblioteca, errores: erroresContenido } = construirBiblioteca(archivos, Object.keys(figuras))

/** Dirección de una figura a partir de su ruta relativa a contenido/. */
export function urlFigura(ruta: string): string | undefined {
  return figuras[ruta]
}
