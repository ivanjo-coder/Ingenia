import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs'

/** Nota que pone el estudiante: 1 Otra vez, 2 Difícil, 3 Bien, 4 Fácil. */
export type Nota = 1 | 2 | 3 | 4
export const NOTAS: Nota[] = [1, 2, 3, 4]

/** Lo que recordamos de cada tarjeta. */
export interface EstadoTarjeta {
  /** id de la tarjeta */
  id: string
  /** Datos del algoritmo de repaso espaciado (FSRS). */
  ficha: Card
  /** Veces que se ha respondido y veces que se ha fallado (nota "Otra vez"). */
  repasos: number
  fallos: number
}

const planificador = fsrs(generatorParameters({ enable_fuzz: false }))
const GRADOS: Record<Nota, Grade> = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy }

export function estadoNuevo(id: string, ahora: Date): EstadoTarjeta {
  return { id, ficha: createEmptyCard(ahora), repasos: 0, fallos: 0 }
}

/** Aplica una nota y devuelve el nuevo estado, con la fecha del próximo repaso en ficha.due. */
export function puntuar(estado: EstadoTarjeta, nota: Nota, ahora: Date): EstadoTarjeta {
  const { card } = planificador.next(estado.ficha, ahora, GRADOS[nota])
  return { id: estado.id, ficha: card, repasos: estado.repasos + 1, fallos: estado.fallos + (nota === 1 ? 1 : 0) }
}

/** Cuándo volvería a salir la tarjeta con cada nota (para enseñarlo en los botones). */
export function proximasFechas(estado: EstadoTarjeta, ahora: Date): Record<Nota, Date> {
  const p = planificador.repeat(estado.ficha, ahora)
  return { 1: p[Rating.Again].card.due, 2: p[Rating.Hard].card.due, 3: p[Rating.Good].card.due, 4: p[Rating.Easy].card.due }
}

/** Minutos por debajo de los cuales una tarjeta vuelve a salir en la misma sesión. */
const MINUTOS_MISMA_SESION = 30

export function vuelveEnEstaSesion(estado: EstadoTarjeta, ahora: Date): boolean {
  return estado.ficha.due.getTime() - ahora.getTime() <= MINUTOS_MISMA_SESION * 60_000
}

export type Fase = 'nueva' | 'aprendiendo' | 'dominada'

/** Una tarjeta cuenta como dominada cuando su próximo repaso ya está a una semana o más. */
const DIAS_DOMINADA = 7

/** nueva: nunca vista · aprendiendo: vista, pero aún con repasos cortos · dominada: repasos de una semana o más. */
export function faseDe(estado: EstadoTarjeta | undefined): Fase {
  if (!estado || estado.ficha.state === State.New) return 'nueva'
  return estado.ficha.state === State.Review && estado.ficha.scheduled_days >= DIAS_DOMINADA ? 'dominada' : 'aprendiendo'
}

/** Día (hora local) en formato 2026-01-31. */
export function diaDe(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

function finDelDia(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1).getTime()
}

/**
 * Decide qué tarjetas tocan hoy.
 * Primero los repasos que vencen hoy (los más atrasados delante) y después
 * tarjetas nuevas, en el orden del temario, sin pasar del cupo diario.
 */
export function construirCola(
  ids: string[],
  estados: Map<string, EstadoTarjeta>,
  ahora: Date,
  nuevasDisponibles: number,
): { repasos: string[]; nuevas: string[] } {
  const limite = finDelDia(ahora)
  const repasos: string[] = []
  const nuevas: string[] = []
  for (const id of ids) {
    const estado = estados.get(id)
    if (faseDe(estado) === 'nueva') {
      if (nuevas.length < nuevasDisponibles) nuevas.push(id)
    } else if (estado!.ficha.due.getTime() < limite) {
      repasos.push(id)
    }
  }
  repasos.sort((a, b) => estados.get(a)!.ficha.due.getTime() - estados.get(b)!.ficha.due.getTime())
  return { repasos, nuevas }
}

/** Texto corto para un intervalo: "10 min", "3 h", "8 d", "2 meses". */
export function intervaloCorto(desde: Date, hasta: Date): { n: number; unidad: 'min' | 'h' | 'd' | 'mes' } {
  const minutos = Math.max(1, Math.round((hasta.getTime() - desde.getTime()) / 60_000))
  if (minutos < 60) return { n: minutos, unidad: 'min' }
  if (minutos < 60 * 24) return { n: Math.round(minutos / 60), unidad: 'h' }
  const dias = Math.round(minutos / (60 * 24))
  if (dias < 60) return { n: dias, unidad: 'd' }
  return { n: Math.round(dias / 30), unidad: 'mes' }
}
