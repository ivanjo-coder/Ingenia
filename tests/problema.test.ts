import { describe, expect, it } from 'vitest'
import type { TarjetaProblema } from '../src/contenido/esquema'
import {
  azarConSemilla,
  calcular,
  corregir,
  dentroDeTolerancia,
  formatear,
  generarIntento,
  huecosDe,
  leerNumero,
  rellenar,
  sortearVariables,
} from '../src/motor/problema'

/** El ejemplo del brief: barra de acero a tracción. */
const barra: TarjetaProblema = {
  id: 'mat-t2-p01',
  tipo: 'problema',
  enunciado: { es: 'Barra de diámetro {d} mm con una tracción de {F} kN.' },
  variables: { d: { min: 10, max: 32, paso: 2 }, F: { min: 20, max: 120, paso: 5 } },
  intermedios: { A: 'pi * d^2 / 4', F_N: 'F * 1000' },
  respuesta: { expresion: 'F_N / A', unidad: 'MPa', tolerancia_relativa: 0.01 },
  resolucion: { es: ['Área: {A} mm²'] },
  casos_prueba: [{ d: 20, F: 50, resultado: 159.15 }],
}

describe('cálculo de problemas', () => {
  it('coincide con el caso resuelto a mano (d = 20 mm, F = 50 kN)', () => {
    const { valores, resultado } = calcular(barra, { d: 20, F: 50 })
    expect(valores.A).toBeCloseTo(314.16, 2)
    expect(valores.F_N).toBe(50000)
    expect(resultado).toBeCloseTo(159.15, 2)
    expect(valores.resultado).toBe(resultado)
  })

  it('sortea valores dentro del rango y respetando el paso', () => {
    const azar = azarConSemilla(7)
    const vistos = new Set<number>()
    for (let i = 0; i < 300; i++) {
      const { d, F } = sortearVariables(barra.variables, azar)
      expect(d).toBeGreaterThanOrEqual(10)
      expect(d).toBeLessThanOrEqual(32)
      expect(d % 2).toBe(0)
      expect(F % 5).toBe(0)
      vistos.add(d)
    }
    expect(vistos.has(10)).toBe(true)
    expect(vistos.has(32)).toBe(true)
  })

  it('da números limpios con pasos decimales', () => {
    const azar = azarConSemilla(3)
    for (let i = 0; i < 100; i++) {
      const { x } = sortearVariables({ x: { min: 0.5, max: 2, paso: 0.1 } }, azar)
      expect(String(x).length).toBeLessThanOrEqual(3)
    }
  })

  it('respeta las condiciones entre variables', () => {
    const tubo: TarjetaProblema = {
      ...barra,
      variables: { d1: { min: 20, max: 100, paso: 10 }, d2: { min: 20, max: 100, paso: 10 } },
      intermedios: undefined,
      condiciones: ['d2 < d1'],
      respuesta: { expresion: 'd1 / d2', unidad: '' },
    }
    const azar = azarConSemilla(1)
    for (let i = 0; i < 100; i++) {
      const { valores } = generarIntento(tubo, azar)
      expect(valores.d2).toBeLessThan(valores.d1)
    }
  })

  it('avisa si las condiciones son imposibles', () => {
    const imposible: TarjetaProblema = { ...barra, condiciones: ['d > 1000'] }
    expect(() => generarIntento(imposible, azarConSemilla(1))).toThrow(/mat-t2-p01/)
  })

  it('la misma semilla da siempre el mismo intento', () => {
    expect(generarIntento(barra, azarConSemilla(42))).toEqual(generarIntento(barra, azarConSemilla(42)))
  })
})

describe('corrección de la respuesta', () => {
  it('acepta coma o punto decimal', () => {
    expect(leerNumero('159,15')).toBe(159.15)
    expect(leerNumero('159.15')).toBe(159.15)
    expect(leerNumero('  -0,5 ')).toBe(-0.5)
    expect(leerNumero('1,2e3')).toBe(1200)
    expect(leerNumero('.5')).toBe(0.5)
  })

  it('rechaza lo que no es un número', () => {
    for (const texto of ['', 'abc', '12 MPa', '1.234,5', '1,2,3', '--3'])
      expect(leerNumero(texto), texto).toBeNull()
  })

  it('aplica la tolerancia relativa', () => {
    expect(dentroDeTolerancia(160, 159.15, { tolerancia_relativa: 0.01 })).toBe(true)
    expect(dentroDeTolerancia(157.6, 159.15, { tolerancia_relativa: 0.01 })).toBe(true)
    expect(dentroDeTolerancia(161, 159.15, { tolerancia_relativa: 0.01 })).toBe(false)
    expect(dentroDeTolerancia(-159.15, 159.15, { tolerancia_relativa: 0.01 })).toBe(false)
  })

  it('usa un 1 % si el problema no dice nada', () => {
    expect(dentroDeTolerancia(100.9, 100)).toBe(true)
    expect(dentroDeTolerancia(101.1, 100)).toBe(false)
  })

  it('aplica la tolerancia absoluta (útil cuando el resultado es 0)', () => {
    expect(dentroDeTolerancia(0.004, 0, { tolerancia_absoluta: 0.005 })).toBe(true)
    expect(dentroDeTolerancia(0.006, 0, { tolerancia_absoluta: 0.005 })).toBe(false)
    expect(dentroDeTolerancia(0, 0)).toBe(true)
  })

  it('corrige una respuesta escrita', () => {
    expect(corregir('159,2', 159.15, barra.respuesta)).toEqual({ valida: true, valor: 159.2, correcta: true })
    expect(corregir('200', 159.15, barra.respuesta)).toEqual({ valida: true, valor: 200, correcta: false })
    expect(corregir('no sé', 159.15)).toEqual({ valida: false })
  })
})

describe('texto con números', () => {
  it('escribe los números con coma y 5 cifras significativas', () => {
    expect(formatear(314.159265)).toBe('314,16')
    expect(formatear(159.1549)).toBe('159,15')
    expect(formatear(50000)).toBe('50000')
    expect(formatear(0.000123456)).toBe('0,00012346')
    expect(formatear(2.5)).toBe('2,5')
    expect(formatear(98.1, 2)).toBe('98,10')
    expect(formatear(101324.6)).toBe('101325')
  })

  it('rellena los huecos sin tocar las llaves de LaTeX', () => {
    const texto = 'Tensión $\\sigma = \\frac{F}{A} = \\frac{\\val{F_N}}{\\val{A}}$ = {resultado} MPa con d = {d} mm'
    const { valores } = calcular(barra, { d: 20, F: 50 })
    expect(rellenar(texto, valores)).toBe(
      'Tensión $\\sigma = \\frac{F}{A} = \\frac{50000}{314{,}16}$ = 159,15 MPa con d = 20 mm',
    )
  })

  it('encuentra los huecos de un texto', () => {
    expect(huecosDe('Con {d} mm: $\\frac{F}{A} = \\val{x}$ y {otro}')).toEqual(['d', 'x', 'otro'])
  })
})
