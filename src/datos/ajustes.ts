import { useSyncExternalStore } from 'react'

const CLAVE = 'nuevasPorDia'
export const NUEVAS_POR_DIA_OPCIONES = [5, 10, 20, 30, 50]
const POR_DEFECTO = 20
const oyentes = new Set<() => void>()

function leer(): number {
  try {
    const n = Number(localStorage.getItem(CLAVE))
    return Number.isInteger(n) && n > 0 ? n : POR_DEFECTO
  } catch {
    return POR_DEFECTO
  }
}

export function guardarNuevasPorDia(n: number) {
  try {
    localStorage.setItem(CLAVE, String(n))
  } catch {
    // Sin almacenamiento: se queda el valor por defecto.
  }
  oyentes.forEach((f) => f())
}

/** Cuántas tarjetas nuevas se enseñan al día como máximo. */
export function useNuevasPorDia(): number {
  return useSyncExternalStore((f) => {
    oyentes.add(f)
    return () => oyentes.delete(f)
  }, leer)
}
