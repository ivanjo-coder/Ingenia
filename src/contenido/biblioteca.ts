import type { z } from 'zod'
import {
  asignaturaArchivoSchema,
  asignaturasArchivoSchema,
  temaArchivoSchema,
  type Asignatura,
  type Biblioteca,
  type Incidencia,
  type Tarjeta,
} from './esquema'

function comprobar<T>(schema: z.ZodType<T>, datos: unknown, archivo: string, errores: Incidencia[]): T | undefined {
  const r = schema.safeParse(datos)
  if (r.success) return r.data
  for (const issue of r.error.issues) {
    // Si el fallo está dentro de una tarjeta, decimos cuál.
    const indice = typeof issue.path[0] === 'number' ? issue.path[0] : undefined
    const tarjeta =
      indice !== undefined && Array.isArray(datos) ? (datos[indice] as { id?: unknown } | null)?.id : undefined
    const donde = issue.path.slice(indice !== undefined ? 1 : 0).join('.')
    errores.push({
      archivo,
      tarjeta: typeof tarjeta === 'string' ? tarjeta : indice !== undefined ? `tarjeta nº ${indice + 1}` : undefined,
      mensaje: donde ? `${donde}: ${issue.message}` : issue.message,
    })
  }
  return undefined
}

/**
 * Monta la biblioteca (asignaturas → temas → tarjetas) a partir de los archivos de contenido.
 * @param archivos  ruta relativa a la carpeta contenido/ → datos ya leídos del YAML
 * @param figuras   rutas (relativas a contenido/) de las figuras que existen
 */
export function construirBiblioteca(
  archivos: Record<string, unknown>,
  figuras: string[] = [],
): { biblioteca: Biblioteca; errores: Incidencia[] } {
  const errores: Incidencia[] = []
  const biblioteca: Biblioteca = { asignaturas: [] }
  const usados = new Set<string>(['asignaturas.yaml'])
  const idsVistos = new Map<string, string>()

  if (!('asignaturas.yaml' in archivos)) {
    errores.push({ archivo: 'asignaturas.yaml', mensaje: 'falta este archivo' })
    return { biblioteca, errores }
  }
  const lista = comprobar(asignaturasArchivoSchema, archivos['asignaturas.yaml'], 'asignaturas.yaml', errores) ?? []

  for (const a of lista) {
    const asignatura: Asignatura = { ...a, temas: [] }
    biblioteca.asignaturas.push(asignatura)
    if (biblioteca.asignaturas.filter((x) => x.id === a.id).length > 1)
      errores.push({ archivo: 'asignaturas.yaml', mensaje: `la asignatura "${a.id}" está repetida` })

    const rutaAsig = `${a.id}/asignatura.yaml`
    if (!(rutaAsig in archivos)) {
      if (a.estado === 'disponible')
        errores.push({ archivo: rutaAsig, mensaje: 'la asignatura está marcada como disponible pero falta este archivo' })
      continue
    }
    usados.add(rutaAsig)
    const datos = comprobar(asignaturaArchivoSchema, archivos[rutaAsig], rutaAsig, errores)

    for (const t of datos?.temas ?? []) {
      const rutaTema = `${a.id}/${t.id}.yaml`
      usados.add(rutaTema)
      if (asignatura.temas.some((x) => x.id === t.id)) {
        errores.push({ archivo: rutaAsig, mensaje: `el tema "${t.id}" está repetido` })
        continue
      }
      if (!(rutaTema in archivos)) {
        errores.push({ archivo: rutaTema, mensaje: `el tema "${t.id}" está en la lista pero falta su archivo` })
        continue
      }
      const tarjetas: Tarjeta[] = comprobar(temaArchivoSchema, archivos[rutaTema], rutaTema, errores) ?? []
      for (const tarjeta of tarjetas) {
        const anterior = idsVistos.get(tarjeta.id)
        if (anterior)
          errores.push({ archivo: rutaTema, tarjeta: tarjeta.id, mensaje: `id repetido (ya se usa en ${anterior})` })
        idsVistos.set(tarjeta.id, rutaTema)

        for (const lado of ['pregunta', 'respuesta'] as const) {
          const nombre = tarjeta.figura?.[lado]
          if (!nombre) continue
          const ruta = `${a.id}/figuras/${nombre}`
          if (!figuras.includes(ruta))
            errores.push({ archivo: rutaTema, tarjeta: tarjeta.id, mensaje: `no existe la figura contenido/${ruta}` })
        }
      }
      asignatura.temas.push({ ...t, tarjetas })
    }
  }

  for (const ruta of Object.keys(archivos))
    if (!usados.has(ruta))
      errores.push({ archivo: ruta, mensaje: 'este archivo no aparece en ninguna lista de temas, así que no se usa' })

  return { biblioteca, errores }
}

/** Ruta (relativa a contenido/) de la figura de una tarjeta. */
export function rutaFigura(asignaturaId: string, nombre: string): string {
  return `${asignaturaId}/figuras/${nombre}`
}
