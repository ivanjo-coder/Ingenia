import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import type { Tarjeta } from '../contenido/esquema'
import { construirCola, diaDe, faseDe, type Fase } from '../motor/repaso'
import { useNuevasPorDia } from './ajustes'
import { leerEstados, nuevasEmpezadas } from './db'

export interface Resumen {
  /** Tarjetas que tocan hoy: repasos + nuevas dentro del cupo. */
  pendientes: number
  fases: Record<Fase, number>
}

/** Resumen en vivo de un grupo de tarjetas. undefined mientras se leen los datos. */
export function useResumen(tarjetas: Tarjeta[]): Resumen | undefined {
  const nuevasPorDia = useNuevasPorDia()
  const datos = useLiveQuery(async () => ({ estados: await leerEstados(), empezadas: await nuevasEmpezadas(diaDe(new Date())) }), [])
  return useMemo(() => {
    if (!datos) return undefined
    const ids = tarjetas.map((t) => t.id)
    const cola = construirCola(ids, datos.estados, new Date(), Math.max(0, nuevasPorDia - datos.empezadas))
    const fases: Record<Fase, number> = { nueva: 0, aprendiendo: 0, dominada: 0 }
    for (const id of ids) fases[faseDe(datos.estados.get(id))]++
    return { pendientes: cola.repasos.length + cola.nuevas.length, fases }
  }, [datos, tarjetas, nuevasPorDia])
}
