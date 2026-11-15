import Dexie, { type EntityTable } from 'dexie'
import { diaDe, estadoNuevo, puntuar, type EstadoTarjeta, type Nota } from '../motor/repaso'

/** Cada respuesta que da el estudiante en el repaso (sirve para la racha y las estadísticas). */
export interface Revision {
  id?: number
  tarjetaId: string
  /** Momento de la respuesta, en milisegundos. */
  fecha: number
  /** Día local, ej. 2026-01-31. */
  dia: string
  nota: Nota
  /** true si era la primera vez que se veía la tarjeta. */
  nueva: boolean
}

/** Un test rápido o simulacro terminado. */
export interface ExamenHecho {
  id?: number
  fecha: number
  dia: string
  tipo: 'rapido' | 'simulacro'
  nota: number
  respuestas: { tarjetaId: string; correcta: boolean }[]
}

/** Base de datos del navegador (IndexedDB). Todo se queda en el dispositivo. */
export const db = new Dexie('ingenia') as Dexie & {
  estados: EntityTable<EstadoTarjeta, 'id'>
  revisiones: EntityTable<Revision, 'id'>
  examenes: EntityTable<ExamenHecho, 'id'>
}

db.version(1).stores({
  estados: 'id',
  revisiones: '++id, tarjetaId, dia',
})
db.version(2).stores({
  examenes: '++id, dia',
})

/** Guarda una respuesta: actualiza la tarjeta y apunta la revisión. Devuelve el nuevo estado. */
export async function guardarRespuesta(tarjetaId: string, nota: Nota, ahora = new Date()): Promise<EstadoTarjeta> {
  return db.transaction('rw', db.estados, db.revisiones, async () => {
    const anterior = await db.estados.get(tarjetaId)
    const nuevo = puntuar(anterior ?? estadoNuevo(tarjetaId, ahora), nota, ahora)
    await db.estados.put(nuevo)
    await db.revisiones.add({ tarjetaId, fecha: ahora.getTime(), dia: diaDe(ahora), nota, nueva: !anterior })
    return nuevo
  })
}

export async function guardarExamen(tipo: ExamenHecho['tipo'], nota: number, respuestas: ExamenHecho['respuestas'], ahora = new Date()) {
  await db.examenes.add({ fecha: ahora.getTime(), dia: diaDe(ahora), tipo, nota, respuestas })
}

export async function leerEstados(): Promise<Map<string, EstadoTarjeta>> {
  return new Map((await db.estados.toArray()).map((e) => [e.id, e]))
}

/** Cuántas tarjetas nuevas se han empezado hoy. */
export function nuevasEmpezadas(dia: string): Promise<number> {
  return db.revisiones.where('dia').equals(dia).filter((r) => r.nueva).count()
}
