import { describe, expect, it } from 'vitest'
import {
  construirCola,
  diaDe,
  estadoNuevo,
  faseDe,
  intervaloCorto,
  proximasFechas,
  puntuar,
  vuelveEnEstaSesion,
  type EstadoTarjeta,
} from '../src/motor/repaso'

const t0 = new Date(2026, 0, 10, 10, 0)
const masDias = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
const mapa = (...estados: EstadoTarjeta[]) => new Map(estados.map((e) => [e.id, e]))

describe('repaso espaciado', () => {
  it('una tarjeta nueva marcada "Otra vez" vuelve en la misma sesión', () => {
    const e = puntuar(estadoNuevo('a', t0), 1, t0)
    expect(vuelveEnEstaSesion(e, t0)).toBe(true)
    expect(faseDe(e)).toBe('aprendiendo')
    expect(e).toMatchObject({ repasos: 1, fallos: 1 })
  })

  it('una tarjeta nueva marcada "Fácil" pasa directamente a repasos de días', () => {
    const e = puntuar(estadoNuevo('a', t0), 4, t0)
    expect(vuelveEnEstaSesion(e, t0)).toBe(false)
    expect(faseDe(e)).toBe('dominada')
    expect(e.ficha.due.getTime()).toBeGreaterThan(masDias(t0, 2).getTime())
    expect(e.fallos).toBe(0)
  })

  it('acertar una vez no basta para darla por dominada; hace falta llegar a repasos de una semana', () => {
    let e = puntuar(puntuar(estadoNuevo('a', t0), 3, t0), 3, t0)
    expect(vuelveEnEstaSesion(e, t0)).toBe(false)
    expect(faseDe(e)).toBe('aprendiendo')
    e = puntuar(e, 3, e.ficha.due)
    e = puntuar(e, 3, e.ficha.due)
    expect(faseDe(e)).toBe('dominada')
  })

  it('cuanto mejor la nota, más tarde vuelve a salir', () => {
    const f = proximasFechas(estadoNuevo('a', t0), t0)
    expect(f[1].getTime()).toBeLessThan(f[2].getTime())
    expect(f[2].getTime()).toBeLessThan(f[3].getTime())
    expect(f[3].getTime()).toBeLessThan(f[4].getTime())
  })

  it('los intervalos crecen al acertar varias veces seguidas', () => {
    let e = puntuar(estadoNuevo('a', t0), 3, t0)
    let ahora = e.ficha.due
    const intervalos: number[] = []
    for (let i = 0; i < 5; i++) {
      e = puntuar(e, 3, ahora)
      intervalos.push(e.ficha.due.getTime() - ahora.getTime())
      ahora = e.ficha.due
    }
    for (let i = 1; i < intervalos.length; i++) expect(intervalos[i]).toBeGreaterThan(intervalos[i - 1])
    expect(intervalos[4]).toBeGreaterThan(20 * 86_400_000)
  })

  it('fallar una tarjeta dominada la devuelve a aprendizaje y acorta el intervalo', () => {
    let e = puntuar(estadoNuevo('a', t0), 4, t0)
    const cuando = e.ficha.due
    e = puntuar(e, 1, cuando)
    expect(faseDe(e)).toBe('aprendiendo')
    expect(vuelveEnEstaSesion(e, cuando)).toBe(true)
    expect(e.fallos).toBe(1)
  })
})

describe('qué toca hoy', () => {
  const ids = ['a', 'b', 'c', 'd', 'e']

  it('sin progreso, salen tarjetas nuevas en orden y sin pasar del cupo', () => {
    expect(construirCola(ids, new Map(), t0, 3)).toEqual({ repasos: [], nuevas: ['a', 'b', 'c'] })
    expect(construirCola(ids, new Map(), t0, 0)).toEqual({ repasos: [], nuevas: [] })
  })

  it('los repasos vencidos salen (los más atrasados primero) y los futuros no', () => {
    const facil = puntuar(estadoNuevo('a', t0), 4, t0) // vuelve en varios días
    const bien = puntuar(puntuar(estadoNuevo('b', t0), 3, t0), 3, t0) // vuelve antes que "a"
    const estados = mapa(facil, bien)

    expect(construirCola(ids, estados, masDias(t0, 1), 0).repasos).toEqual([])
    const tarde = masDias(facil.ficha.due, 1)
    expect(construirCola(ids, estados, tarde, 1)).toEqual({ repasos: ['b', 'a'], nuevas: ['c'] })
  })

  it('un repaso que vence hoy más tarde ya cuenta como pendiente de hoy', () => {
    const e = puntuar(estadoNuevo('a', t0), 4, t0)
    const mismoDiaTemprano = new Date(e.ficha.due.getFullYear(), e.ficha.due.getMonth(), e.ficha.due.getDate(), 0, 5)
    expect(construirCola(['a'], mapa(e), mismoDiaTemprano, 0).repasos).toEqual(['a'])
  })
})

describe('fechas', () => {
  it('escribe el día en hora local', () => {
    expect(diaDe(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('resume los intervalos', () => {
    const en = (min: number) => intervaloCorto(t0, new Date(t0.getTime() + min * 60_000))
    expect(en(10)).toEqual({ n: 10, unidad: 'min' })
    expect(en(180)).toEqual({ n: 3, unidad: 'h' })
    expect(en(8 * 1440)).toEqual({ n: 8, unidad: 'd' })
    expect(en(90 * 1440)).toEqual({ n: 3, unidad: 'mes' })
  })
})
