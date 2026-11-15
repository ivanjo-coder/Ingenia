import type { Tarjeta, TarjetaProblema, TarjetaTest } from '../contenido/esquema'
import { barajar, corregir, generarIntento, type Azar, type Intento } from './problema'

/** Una pregunta de un test o simulacro, ya preparada (opciones barajadas o datos sorteados). */
export type Pregunta =
  | { tipo: 'test'; tarjeta: TarjetaTest; asignaturaId: string; opciones: TarjetaTest['opciones'] }
  | { tipo: 'problema'; tarjeta: TarjetaProblema; asignaturaId: string; intento: Intento }

/** Respuesta del estudiante: nº de opción en los tests, texto escrito en los problemas, null si está en blanco. */
export type Respuesta = number | string | null

export interface Candidata {
  tarjeta: Tarjeta
  asignaturaId: string
}

/** Elige al azar hasta n preguntas entre las tarjetas de tipo test y problema. */
export function elegirPreguntas(candidatas: Candidata[], n: number, tipos: ('test' | 'problema')[], azar: Azar = Math.random): Pregunta[] {
  const validas = candidatas.filter((c) => (tipos as string[]).includes(c.tarjeta.tipo))
  return barajar(validas, azar)
    .slice(0, n)
    .map(({ tarjeta, asignaturaId }): Pregunta => {
      if (tarjeta.tipo === 'test') return { tipo: 'test', tarjeta, asignaturaId, opciones: barajar(tarjeta.opciones, azar) }
      return { tipo: 'problema', tarjeta: tarjeta as TarjetaProblema, asignaturaId, intento: generarIntento(tarjeta as TarjetaProblema, azar) }
    })
}

export function estaContestada(r: Respuesta): boolean {
  return r !== null && r !== ''
}

export function esCorrecta(p: Pregunta, r: Respuesta): boolean {
  if (p.tipo === 'test') return typeof r === 'number' && !!p.opciones[r]?.correcta
  if (typeof r !== 'string') return false
  const c = corregir(r, p.intento.resultado, p.tarjeta.respuesta)
  return c.valida && c.correcta
}

export interface ResultadoExamen {
  correctas: boolean[]
  aciertos: number
  total: number
  /** Nota sobre 10 con un decimal. Los fallos no restan. */
  nota: number
}

export function corregirExamen(preguntas: Pregunta[], respuestas: Respuesta[]): ResultadoExamen {
  const correctas = preguntas.map((p, i) => esCorrecta(p, respuestas[i] ?? null))
  const aciertos = correctas.filter(Boolean).length
  const total = preguntas.length
  return { correctas, aciertos, total, nota: total ? Math.round((aciertos / total) * 100) / 10 : 0 }
}

/** Segundos en formato 12:05 */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
