import { describe, expect, it } from 'vitest'
import type { Tarjeta } from '../src/contenido/esquema'
import { deserializar, serializar } from '../src/datos/copia'
import { calcularRacha, puntosDebiles } from '../src/motor/estadisticas'
import { corregirExamen, elegirPreguntas, reloj, type Candidata } from '../src/motor/examen'
import { azarConSemilla } from '../src/motor/problema'
import { estadoNuevo, puntuar } from '../src/motor/repaso'

const t = { ca: 'x', es: 'x' }
const test = (id: string): Tarjeta => ({
  id,
  tipo: 'test',
  pregunta: t,
  opciones: [
    { texto: { es: 'buena' }, correcta: true, explicacion: t },
    { texto: { es: 'mala1' }, explicacion: t },
    { texto: { es: 'mala2' }, explicacion: t },
  ],
})
const problema: Tarjeta = {
  id: 'p1',
  tipo: 'problema',
  enunciado: t,
  variables: { a: { min: 1, max: 9, paso: 1 } },
  respuesta: { expresion: '10 * a', unidad: 'm' },
  resolucion: { es: ['x'] },
  casos_prueba: [{ a: 1, resultado: 10 }],
}
const concepto: Tarjeta = { id: 'c1', tipo: 'concepto', pregunta: t, respuesta: t }
const candidatas: Candidata[] = [test('t1'), test('t2'), test('t3'), problema, concepto].map((tarjeta) => ({ tarjeta, asignaturaId: 'fis' }))

describe('tests y simulacros', () => {
  it('elige solo tests y problemas, sin repetir y sin pasar de n', () => {
    const todas = elegirPreguntas(candidatas, 20, ['test', 'problema'], azarConSemilla(1))
    expect(todas.map((p) => p.tarjeta.id).sort()).toEqual(['p1', 't1', 't2', 't3'])
    expect(elegirPreguntas(candidatas, 2, ['test', 'problema'], azarConSemilla(1))).toHaveLength(2)
    expect(elegirPreguntas(candidatas, 20, ['test'], azarConSemilla(1)).every((p) => p.tipo === 'test')).toBe(true)
  })

  it('corrige y pone nota sobre 10; en blanco cuenta como fallo y los fallos no restan', () => {
    const preguntas = elegirPreguntas(candidatas, 20, ['test', 'problema'], azarConSemilla(2))
    const perfectas = preguntas.map((p) =>
      p.tipo === 'test' ? p.opciones.findIndex((o) => o.correcta) : String(p.intento.resultado).replace('.', ','),
    )
    expect(corregirExamen(preguntas, perfectas)).toMatchObject({ aciertos: 4, total: 4, nota: 10 })

    const unaMal = [...perfectas]
    const i = preguntas.findIndex((p) => p.tipo === 'test')
    unaMal[i] = preguntas[i].tipo === 'test' ? (preguntas[i] as { opciones: { correcta?: boolean }[] }).opciones.findIndex((o) => !o.correcta) : 0
    expect(corregirExamen(preguntas, unaMal)).toMatchObject({ aciertos: 3, nota: 7.5 })

    expect(corregirExamen(preguntas, preguntas.map(() => null))).toMatchObject({ aciertos: 0, nota: 0 })
    expect(corregirExamen(preguntas, preguntas.map(() => 'abc')).aciertos).toBe(0)
  })

  it('muestra el tiempo como minutos:segundos', () => {
    expect(reloj(725)).toBe('12:05')
    expect(reloj(59)).toBe('0:59')
    expect(reloj(-3)).toBe('0:00')
  })
})

describe('estadísticas', () => {
  const hoy = new Date(2026, 0, 10, 12)

  it('cuenta la racha de días seguidos', () => {
    expect(calcularRacha(new Set(), hoy)).toBe(0)
    expect(calcularRacha(new Set(['2026-01-10']), hoy)).toBe(1)
    expect(calcularRacha(new Set(['2026-01-08', '2026-01-09', '2026-01-10']), hoy)).toBe(3)
  })

  it('la racha no se pierde si hoy todavía no has estudiado, pero sí si ayer tampoco', () => {
    expect(calcularRacha(new Set(['2026-01-08', '2026-01-09']), hoy)).toBe(2)
    expect(calcularRacha(new Set(['2026-01-07', '2026-01-08']), hoy)).toBe(0)
    expect(calcularRacha(new Set(['2026-01-06', '2026-01-09', '2026-01-10']), hoy)).toBe(2)
  })

  it('la racha pasa bien de un mes a otro', () => {
    expect(calcularRacha(new Set(['2025-12-31', '2026-01-01']), new Date(2026, 0, 1))).toBe(2)
  })

  it('ordena los puntos débiles por número de fallos y quita las que nunca se fallan', () => {
    const lista = puntosDebiles([
      { id: 'a', fallos: 1, intentos: 5 },
      { id: 'b', fallos: 4, intentos: 6 },
      { id: 'c', fallos: 0, intentos: 9 },
      { id: 'd', fallos: 4, intentos: 4 },
    ])
    expect(lista.map((p) => p.id)).toEqual(['d', 'b', 'a'])
    expect(puntosDebiles([{ id: 'a', fallos: 1, intentos: 1 }, { id: 'b', fallos: 2, intentos: 2 }], 1)).toHaveLength(1)
  })
})

describe('exportar e importar el progreso', () => {
  const t0 = new Date(2026, 0, 10, 10)
  const progreso = {
    estados: [puntuar(estadoNuevo('a', t0), 3, t0), puntuar(estadoNuevo('b', t0), 1, t0)],
    revisiones: [{ id: 7, tarjetaId: 'a', fecha: t0.getTime(), dia: '2026-01-10', nota: 3 as const, nueva: true }],
    examenes: [{ id: 2, fecha: t0.getTime(), dia: '2026-01-10', tipo: 'rapido' as const, nota: 7.5, respuestas: [{ tarjetaId: 'a', correcta: true }] }],
  }

  it('lo exportado se recupera igual al importarlo', () => {
    const recuperado = deserializar(JSON.stringify(serializar(progreso)))
    expect(recuperado.estados).toEqual(progreso.estados)
    expect(recuperado.estados[0].ficha.due).toBeInstanceOf(Date)
    expect(recuperado.revisiones).toEqual([{ tarjetaId: 'a', fecha: t0.getTime(), dia: '2026-01-10', nota: 3, nueva: true }])
    expect(recuperado.examenes[0].nota).toBe(7.5)
  })

  it('rechaza archivos que no son una copia del progreso', () => {
    expect(() => deserializar('hola')).toThrow()
    expect(() => deserializar('{"app":"otra"}')).toThrow()
    expect(() => deserializar(JSON.stringify({ ...serializar(progreso), estados: [{ id: 'a' }] }))).toThrow()
  })
})
