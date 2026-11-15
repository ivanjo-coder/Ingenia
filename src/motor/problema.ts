import { evaluate } from 'mathjs/number'
import type { TarjetaProblema } from '../contenido/esquema'
import { trocear } from '../contenido/texto'

export type Valores = Record<string, number>
export type Azar = () => number

/** Generador de números aleatorios repetible (para tests): misma semilla, mismos números. */
export function azarConSemilla(semilla: number): Azar {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Devuelve una copia de la lista en orden aleatorio (todas las ordenaciones igual de probables). */
export function barajar<T>(lista: readonly T[], azar: Azar = Math.random): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function decimalesDe(n: number): number {
  const texto = String(n)
  if (texto.includes('e-')) return Number(texto.split('e-')[1])
  return texto.includes('.') ? texto.split('.')[1].length : 0
}

/** Sortea un valor para cada variable: min, min+paso, min+2·paso… hasta max. */
export function sortearVariables(variables: TarjetaProblema['variables'], azar: Azar = Math.random): Valores {
  const valores: Valores = {}
  for (const [nombre, { min, max, paso }] of Object.entries(variables)) {
    const saltos = Math.floor((max - min) / paso + 1e-9)
    const k = Math.floor(azar() * (saltos + 1))
    // Redondeo para evitar cosas como 0.30000000000000004
    valores[nombre] = Number((min + k * paso).toFixed(Math.max(decimalesDe(min), decimalesDe(paso))))
  }
  return valores
}

/** Calcula los intermedios y el resultado de un problema para unos valores concretos. */
export function calcular(problema: TarjetaProblema, variables: Valores): { valores: Valores; resultado: number } {
  const valores: Valores = { ...variables }
  for (const [nombre, expresion] of Object.entries(problema.intermedios ?? {})) {
    valores[nombre] = Number(evaluate(expresion, { ...valores }))
  }
  const resultado = Number(evaluate(problema.respuesta.expresion, { ...valores }))
  return { valores: { ...valores, resultado }, resultado }
}

export function cumpleCondiciones(problema: TarjetaProblema, valores: Valores): boolean {
  return (problema.condiciones ?? []).every((c) => evaluate(c, { ...valores }) === true)
}

export interface Intento {
  /** Variables sorteadas, intermedios y "resultado". */
  valores: Valores
  resultado: number
}

/** Genera un intento nuevo: sortea datos (respetando las condiciones) y calcula la solución. */
export function generarIntento(problema: TarjetaProblema, azar: Azar = Math.random): Intento {
  for (let i = 0; i < 500; i++) {
    const variables = sortearVariables(problema.variables, azar)
    const { valores, resultado } = calcular(problema, variables)
    if (Number.isFinite(resultado) && cumpleCondiciones(problema, valores)) return { valores, resultado }
  }
  throw new Error(`No se han encontrado datos válidos para el problema ${problema.id}: revisa rangos y condiciones`)
}

/** Escribe un número con coma decimal. Sin "decimales", usa 5 cifras significativas. */
export function formatear(n: number, decimales?: number): string {
  if (!Number.isFinite(n)) return '—'
  let texto: string
  if (decimales !== undefined) {
    texto = n.toFixed(decimales)
  } else if (Number.isInteger(n)) {
    texto = String(n)
  } else {
    const magnitud = Math.floor(Math.log10(Math.abs(n)))
    texto = n.toFixed(Math.min(10, Math.max(0, 4 - magnitud)))
    if (texto.includes('.')) texto = texto.replace(/0+$/, '').replace(/\.$/, '')
  }
  return texto.replace('.', ',')
}

const HUECO_TEXTO = /\{([A-Za-z][A-Za-z0-9_]*)\}/g
const HUECO_FORMULA = /\\val\{([A-Za-z][A-Za-z0-9_]*)\}/g

/**
 * Sustituye los huecos por números.
 * - Fuera de las fórmulas: {nombre}
 * - Dentro de $...$: \val{nombre}  (porque ahí las llaves {} son de LaTeX)
 */
export function rellenar(texto: string, valores: Valores, decimalesResultado?: number): string {
  const numero = (nombre: string, original: string, enFormula: boolean) => {
    if (!(nombre in valores)) return original
    const t = formatear(valores[nombre], nombre === 'resultado' ? decimalesResultado : undefined)
    return enFormula ? t.replace(',', '{,}') : t
  }
  return trocear(texto)
    .map((trozo) => {
      if (trozo.tipo === 'texto') return trozo.valor.replace(HUECO_TEXTO, (o, n) => numero(n, o, false))
      const formula = trozo.valor.replace(HUECO_FORMULA, (o, n) => numero(n, o, true))
      return trozo.tipo === 'formula' ? `$${formula}$` : `$$${formula}$$`
    })
    .join('')
}

/** Nombres de los huecos que aparecen en un texto (para comprobar que todos existen). */
export function huecosDe(texto: string): string[] {
  const nombres: string[] = []
  for (const trozo of trocear(texto)) {
    const patron = trozo.tipo === 'texto' ? HUECO_TEXTO : HUECO_FORMULA
    for (const m of trozo.valor.matchAll(patron)) nombres.push(m[1])
  }
  return nombres
}

/** Convierte lo que escribe el estudiante en un número. Acepta coma o punto decimal. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, '').replace('−', '-')
  if (limpio.includes(',') && limpio.includes('.')) return null
  const normal = limpio.replace(',', '.')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(normal)) return null
  return Number(normal)
}

export interface Tolerancia {
  tolerancia_relativa?: number
  tolerancia_absoluta?: number
}

/** ¿Está el valor dentro de la tolerancia? Por defecto, un 1 % del resultado correcto. */
export function dentroDeTolerancia(valor: number, correcto: number, t: Tolerancia = {}): boolean {
  const diferencia = Math.abs(valor - correcto)
  if (t.tolerancia_absoluta !== undefined && diferencia <= t.tolerancia_absoluta) return true
  const relativa = t.tolerancia_relativa ?? (t.tolerancia_absoluta === undefined ? 0.01 : undefined)
  if (relativa !== undefined && diferencia <= relativa * Math.abs(correcto) + 1e-12) return true
  return false
}

export type Correccion = { valida: false } | { valida: true; valor: number; correcta: boolean }

/** Corrige la respuesta escrita por el estudiante. */
export function corregir(texto: string, correcto: number, t: Tolerancia = {}): Correccion {
  const valor = leerNumero(texto)
  if (valor === null) return { valida: false }
  return { valida: true, valor, correcta: dentroDeTolerancia(valor, correcto, t) }
}
