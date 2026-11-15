import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { leerContenido } from '../scripts/leer-contenido'
import { construirBiblioteca } from '../src/contenido/biblioteca'
import { validarAFondo } from '../src/contenido/validacion'
import { elegir, trocear } from '../src/contenido/texto'
import { idiomaInicial } from '../src/i18n'

const base = {
  'asignaturas.yaml': [{ id: 'fisica', nombre: { ca: 'Física', es: 'Física' }, estado: 'disponible' }],
  'fisica/asignatura.yaml': { temas: [{ id: 'fluidos', nombre: { ca: 'Fluids', es: 'Fluidos' } }] },
}
const concepto = { id: 'c1', tipo: 'concepto', pregunta: { ca: 'P', es: 'P' }, respuesta: { ca: 'R', es: 'R' } }
const problema = {
  id: 'p1',
  tipo: 'problema',
  enunciado: { ca: 'Dada {a}', es: 'Dato {a}' },
  variables: { a: { min: 1, max: 5, paso: 1 } },
  respuesta: { expresion: '2 * a', unidad: 'm' },
  resolucion: { ca: ['$2 \\cdot \\val{a}$ = {resultado}'], es: ['$2 \\cdot \\val{a}$ = {resultado}'] },
  casos_prueba: [{ a: 3, resultado: 6 }],
}

/** Monta un contenido de prueba con las tarjetas dadas y devuelve los mensajes de error y aviso. */
function revisar(tarjetas: unknown[], extra: Record<string, unknown> = {}) {
  const { biblioteca, errores } = construirBiblioteca({ ...base, 'fisica/fluidos.yaml': tarjetas, ...extra })
  const fondo = validarAFondo(biblioteca)
  return {
    errores: [...errores, ...fondo.errores].map((e) => e.mensaje),
    avisos: fondo.avisos.map((e) => e.mensaje),
  }
}

describe('contenido real del repositorio', () => {
  const leido = leerContenido(fileURLToPath(new URL('../contenido', import.meta.url)))
  const { biblioteca, errores } = construirBiblioteca(leido.archivos, leido.figuras)

  it('no tiene errores', () => {
    expect([...leido.errores, ...errores, ...validarAFondo(biblioteca).errores]).toEqual([])
  })

  it('muestra las siete asignaturas y la primera está disponible', () => {
    expect(biblioteca.asignaturas).toHaveLength(7)
    expect(biblioteca.asignaturas[0]).toMatchObject({ id: 'fisica-aplicada', estado: 'disponible' })
    expect(biblioteca.asignaturas[0].temas.length).toBeGreaterThan(0)
  })
})

describe('validación del contenido', () => {
  it('acepta tarjetas bien escritas', () => {
    expect(revisar([concepto, problema])).toEqual({ errores: [], avisos: [] })
  })

  it('detecta ids repetidos', () => {
    expect(revisar([concepto, concepto]).errores.join()).toMatch(/id repetido/)
  })

  it('detecta campos mal escritos o que faltan', () => {
    expect(revisar([{ ...concepto, respuestaa: { es: 'x' } }]).errores).not.toEqual([])
    expect(revisar([{ id: 'c2', tipo: 'concepto', pregunta: { es: 'P' } }]).errores).not.toEqual([])
    expect(revisar([{ ...concepto, tipo: 'otro' }]).errores).not.toEqual([])
  })

  it('exige exactamente una opción correcta en los tests', () => {
    const opcion = (correcta: boolean) => ({ texto: { es: 'a', ca: 'a' }, explicacion: { es: 'b', ca: 'b' }, correcta })
    const test = (correctas: boolean[]) => ({ id: 't1', tipo: 'test', pregunta: { es: 'P', ca: 'P' }, opciones: correctas.map(opcion) })
    expect(revisar([test([true, false, false])]).errores).toEqual([])
    expect(revisar([test([true, true, false])]).errores.join()).toMatch(/exactamente una/)
    expect(revisar([test([false, false, false])]).errores.join()).toMatch(/exactamente una/)
  })

  it('detecta LaTeX roto y $ sin cerrar', () => {
    expect(revisar([{ ...concepto, respuesta: { ca: 'R', es: '$\\frac{1}{2$' } }]).errores.join()).toMatch(/LaTeX roto/)
    expect(revisar([{ ...concepto, respuesta: { ca: 'R', es: 'vale $x' } }]).errores.join()).toMatch(/sin cerrar/)
  })

  it('detecta huecos y variables sin definir', () => {
    expect(revisar([{ ...problema, enunciado: { ca: 'Dada {b}', es: 'Dato {a}' } }]).errores.join()).toMatch(/\{b\} no está definido/)
    expect(revisar([{ ...problema, respuesta: { expresion: '2 * z', unidad: 'm' } }]).errores.join()).toMatch(/no se puede calcular/)
  })

  it('comprueba el caso resuelto a mano', () => {
    expect(revisar([{ ...problema, casos_prueba: [{ a: 3, resultado: 7 }] }]).errores.join()).toMatch(/a mano sale 7/)
    expect(revisar([{ ...problema, casos_prueba: [{ resultado: 6 }] }]).errores.join()).toMatch(/falta el valor de a/)
    expect(revisar([{ ...problema, casos_prueba: [] }]).errores).not.toEqual([])
  })

  it('avisa (sin dar error) de traducciones que faltan y de tarjetas por revisar', () => {
    const r = revisar([{ ...concepto, respuesta: { es: 'R' }, revisar: true }])
    expect(r.errores).toEqual([])
    expect(r.avisos.join()).toMatch(/falta la traducción \(ca\)/)
    expect(r.avisos.join()).toMatch(/revisar/)
  })

  it('detecta temas sin archivo, archivos sueltos y figuras que no existen', () => {
    const sinArchivo = construirBiblioteca(base)
    expect(sinArchivo.errores.map((e) => e.mensaje).join()).toMatch(/falta su archivo/)
    expect(revisar([concepto], { 'fisica/suelto.yaml': [concepto] }).errores.join()).toMatch(/no se usa/)
    expect(revisar([{ ...concepto, figura: { pregunta: 'no-existe.svg' } }]).errores.join()).toMatch(/no existe la figura/)
  })
})

describe('texto e idioma', () => {
  it('separa texto y fórmulas', () => {
    expect(trocear('La tensión $\\sigma$ vale $$F/A$$ siempre')).toEqual([
      { tipo: 'texto', valor: 'La tensión ' },
      { tipo: 'formula', valor: '\\sigma' },
      { tipo: 'texto', valor: ' vale ' },
      { tipo: 'formula-bloque', valor: 'F/A' },
      { tipo: 'texto', valor: ' siempre' },
    ])
  })

  it('si falta un idioma muestra el otro', () => {
    expect(elegir({ es: 'hola' }, 'ca')).toBe('hola')
    expect(elegir({ ca: 'hola', es: 'hola2' }, 'es')).toBe('hola2')
  })

  it('elige el idioma guardado, luego el del dispositivo y si no catalán', () => {
    expect(idiomaInicial('es', ['ca'])).toBe('es')
    expect(idiomaInicial(null, ['en-GB', 'es-ES'])).toBe('es')
    expect(idiomaInicial(null, ['ca-ES'])).toBe('ca')
    expect(idiomaInicial(null, ['en-US'])).toBe('ca')
  })
})
