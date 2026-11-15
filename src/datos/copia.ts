import { z } from 'zod'
import type { EstadoTarjeta } from '../motor/repaso'
import { db, type ExamenHecho, type Revision } from './db'

/** Formato del archivo de copia de seguridad. */
const copiaSchema = z.object({
  app: z.literal('ingenia-progreso'),
  version: z.literal(1),
  exportado: z.string(),
  estados: z.array(
    z.object({
      id: z.string(),
      repasos: z.number(),
      fallos: z.number(),
      ficha: z.object({
        due: z.string(),
        last_review: z.string().nullable(),
        stability: z.number(),
        difficulty: z.number(),
        elapsed_days: z.number(),
        scheduled_days: z.number(),
        reps: z.number(),
        lapses: z.number(),
        learning_steps: z.number(),
        state: z.number().int().min(0).max(3),
      }),
    }),
  ),
  revisiones: z.array(
    z.object({ tarjetaId: z.string(), fecha: z.number(), dia: z.string(), nota: z.number().int().min(1).max(4), nueva: z.boolean() }),
  ),
  examenes: z.array(
    z.object({
      fecha: z.number(),
      dia: z.string(),
      tipo: z.enum(['rapido', 'simulacro']),
      nota: z.number(),
      respuestas: z.array(z.object({ tarjetaId: z.string(), correcta: z.boolean() })),
    }),
  ),
})
export type Copia = z.infer<typeof copiaSchema>

export interface Progreso {
  estados: EstadoTarjeta[]
  revisiones: Revision[]
  examenes: ExamenHecho[]
}

/** Convierte el progreso en un objeto que se puede guardar en un archivo (las fechas pasan a texto). */
export function serializar(p: Progreso, ahora = new Date()): Copia {
  return {
    app: 'ingenia-progreso',
    version: 1,
    exportado: ahora.toISOString(),
    estados: p.estados.map((e) => ({
      id: e.id,
      repasos: e.repasos,
      fallos: e.fallos,
      ficha: { ...e.ficha, due: e.ficha.due.toISOString(), last_review: e.ficha.last_review?.toISOString() ?? null },
    })),
    revisiones: p.revisiones.map(({ id: _, ...r }) => r),
    examenes: p.examenes.map(({ id: _, ...e }) => e),
  }
}

/** Lee un archivo de copia. Lanza un error si no es un archivo de progreso válido. */
export function deserializar(texto: string): Progreso {
  const copia = copiaSchema.parse(JSON.parse(texto))
  return {
    estados: copia.estados.map((e) => ({
      ...e,
      ficha: { ...e.ficha, due: new Date(e.ficha.due), last_review: e.ficha.last_review ? new Date(e.ficha.last_review) : undefined },
    })),
    revisiones: copia.revisiones as Revision[],
    examenes: copia.examenes,
  }
}

export async function exportarProgreso(): Promise<string> {
  const [estados, revisiones, examenes] = await Promise.all([db.estados.toArray(), db.revisiones.toArray(), db.examenes.toArray()])
  return JSON.stringify(serializar({ estados, revisiones, examenes }))
}

/** Sustituye TODO el progreso del dispositivo por el del archivo. */
export async function importarProgreso(texto: string): Promise<number> {
  const p = deserializar(texto)
  await db.transaction('rw', db.estados, db.revisiones, db.examenes, async () => {
    await Promise.all([db.estados.clear(), db.revisiones.clear(), db.examenes.clear()])
    await db.estados.bulkAdd(p.estados)
    await db.revisiones.bulkAdd(p.revisiones)
    await db.examenes.bulkAdd(p.examenes)
  })
  return p.estados.length
}

export async function borrarProgreso() {
  await db.transaction('rw', db.estados, db.revisiones, db.examenes, () =>
    Promise.all([db.estados.clear(), db.revisiones.clear(), db.examenes.clear()]),
  )
}
