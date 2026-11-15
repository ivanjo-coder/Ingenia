import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { parse } from 'yaml'
import type { Incidencia } from '../src/contenido/esquema'

/** Lee del disco todos los archivos de la carpeta de contenido. */
export function leerContenido(carpeta: string): { archivos: Record<string, unknown>; figuras: string[]; errores: Incidencia[] } {
  const archivos: Record<string, unknown> = {}
  const figuras: string[] = []
  const errores: Incidencia[] = []

  for (const entrada of readdirSync(carpeta, { recursive: true, withFileTypes: true })) {
    if (!entrada.isFile()) continue
    const ruta = relative(carpeta, join(entrada.parentPath, entrada.name)).split(sep).join('/')
    if (/\.ya?ml$/.test(ruta)) {
      try {
        archivos[ruta] = parse(readFileSync(join(carpeta, ruta), 'utf8'))
      } catch (e) {
        errores.push({ archivo: ruta, mensaje: `error de escritura YAML: ${(e as Error).message}` })
      }
    } else if (ruta.includes('/figuras/')) {
      figuras.push(ruta)
    }
  }
  return { archivos, figuras, errores }
}
