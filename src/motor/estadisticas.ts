import { diaDe } from './repaso'

/** Días seguidos estudiando. Cuenta hasta hoy; si hoy aún no has estudiado, hasta ayer. */
export function calcularRacha(dias: Set<string>, hoy: Date): number {
  const cursor = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  if (!dias.has(diaDe(cursor))) cursor.setDate(cursor.getDate() - 1)
  let racha = 0
  while (dias.has(diaDe(cursor))) {
    racha++
    cursor.setDate(cursor.getDate() - 1)
  }
  return racha
}

export interface PuntoDebil {
  id: string
  fallos: number
  intentos: number
}

/** Las tarjetas que más se fallan, de más a menos fallos. */
export function puntosDebiles(recuento: Iterable<PuntoDebil>, maximo = 10): PuntoDebil[] {
  return [...recuento]
    .filter((p) => p.fallos > 0)
    .sort((a, b) => b.fallos - a.fallos || b.fallos / b.intentos - a.fallos / a.intentos || a.id.localeCompare(b.id))
    .slice(0, maximo)
}
