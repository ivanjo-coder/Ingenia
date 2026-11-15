import katex from 'katex'
import { azarConSemilla, calcular, dentroDeTolerancia, generarIntento, huecosDe } from '../motor/problema'
import type { Biblioteca, Incidencia, Tarjeta } from './esquema'
import { trocear } from './texto'

type Bilingue = { ca?: string | string[]; es?: string | string[] }

/** Todos los textos de una tarjeta, con el nombre del campo donde están. */
function textosDe(t: Tarjeta): { campo: string; texto: Bilingue }[] {
  const figura = t.figura?.alt ? [{ campo: 'figura.alt', texto: t.figura.alt }] : []
  switch (t.tipo) {
    case 'concepto':
      return [{ campo: 'pregunta', texto: t.pregunta }, { campo: 'respuesta', texto: t.respuesta }, ...figura]
    case 'formula':
      return [
        { campo: 'pregunta', texto: t.pregunta },
        ...t.simbolos.map((s, i) => ({ campo: `simbolos.${i + 1}.significado`, texto: s.significado })),
        ...(t.nota ? [{ campo: 'nota', texto: t.nota }] : []),
        ...figura,
      ]
    case 'test':
      return [
        { campo: 'pregunta', texto: t.pregunta },
        ...t.opciones.flatMap((o, i) => [
          { campo: `opciones.${i + 1}.texto`, texto: o.texto },
          { campo: `opciones.${i + 1}.explicacion`, texto: o.explicacion },
        ]),
        ...figura,
      ]
    case 'problema':
      return [{ campo: 'enunciado', texto: t.enunciado }, { campo: 'resolucion', texto: t.resolucion }, ...figura]
  }
}

function errorLatex(formula: string): string | null {
  try {
    katex.renderToString(formula.replace(/\\val\{[^}]*\}/g, '1'), { throwOnError: true, strict: 'ignore' })
    return null
  } catch (e) {
    return (e as Error).message.replace('KaTeX parse error: ', '')
  }
}

function revisarTexto(texto: string): string[] {
  const fallos: string[] = []
  if ((texto.match(/\$/g) ?? []).length % 2 !== 0) fallos.push('hay un símbolo $ sin cerrar')
  for (const trozo of trocear(texto)) {
    if (trozo.tipo === 'texto') continue
    const e = errorLatex(trozo.valor)
    if (e) fallos.push(`LaTeX roto en "$${trozo.valor}$": ${e}`)
  }
  return fallos
}

/**
 * Revisión a fondo del contenido: fórmulas, huecos, expresiones, casos resueltos a mano y traducciones.
 * Los errores impiden publicar; los avisos son cosas pendientes (traducciones, tarjetas por revisar).
 */
export function validarAFondo(biblioteca: Biblioteca): { errores: Incidencia[]; avisos: Incidencia[] } {
  const errores: Incidencia[] = []
  const avisos: Incidencia[] = []

  for (const asignatura of biblioteca.asignaturas) {
    if (!asignatura.nombre.ca || !asignatura.nombre.es)
      avisos.push({ archivo: 'asignaturas.yaml', mensaje: `a la asignatura "${asignatura.id}" le falta el nombre en un idioma` })

    for (const tema of asignatura.temas) {
      const archivo = `${asignatura.id}/${tema.id}.yaml`
      if (!tema.nombre.ca || !tema.nombre.es)
        avisos.push({ archivo: `${asignatura.id}/asignatura.yaml`, mensaje: `al tema "${tema.id}" le falta el nombre en un idioma` })

      for (const t of tema.tarjetas) {
        const error = (mensaje: string) => errores.push({ archivo, tarjeta: t.id, mensaje })
        const aviso = (mensaje: string) => avisos.push({ archivo, tarjeta: t.id, mensaje })

        if (t.revisar) aviso('marcada con "revisar: true"')

        const huecosValidos =
          t.tipo === 'problema'
            ? new Set([...Object.keys(t.variables), ...Object.keys(t.intermedios ?? {}), 'resultado'])
            : new Set<string>()

        for (const { campo, texto } of textosDe(t)) {
          for (const idioma of ['ca', 'es'] as const) {
            const valor = texto[idioma]
            if (valor === undefined) {
              aviso(`${campo}: falta la traducción (${idioma})`)
              continue
            }
            for (const linea of Array.isArray(valor) ? valor : [valor]) {
              for (const fallo of revisarTexto(linea)) error(`${campo} (${idioma}): ${fallo}`)
              if (t.tipo === 'problema')
                for (const hueco of huecosDe(linea))
                  if (!huecosValidos.has(hueco)) error(`${campo} (${idioma}): el hueco {${hueco}} no está definido`)
            }
          }
        }

        if (t.tipo === 'formula') {
          const e = errorLatex(t.expresion)
          if (e) error(`expresion: LaTeX roto: ${e}`)
          t.simbolos.forEach((s, i) => {
            const es = errorLatex(s.simbolo)
            if (es) error(`simbolos.${i + 1}.simbolo: LaTeX roto: ${es}`)
          })
        }

        if (t.tipo === 'problema') {
          const variables = Object.keys(t.variables)
          for (const nombre of Object.keys(t.intermedios ?? {}))
            if (nombre in t.variables || nombre === 'resultado')
              error(`intermedios: el nombre "${nombre}" ya está usado`)

          t.casos_prueba.forEach((caso, i) => {
            const n = i + 1
            const faltan = variables.filter((v) => !(v in caso))
            const sobran = Object.keys(caso).filter((k) => k !== 'resultado' && !(k in t.variables))
            if (faltan.length) return error(`casos_prueba ${n}: falta el valor de ${faltan.join(', ')}`)
            if (sobran.length) return error(`casos_prueba ${n}: "${sobran.join(', ')}" no es una variable del problema`)
            if (!('resultado' in caso)) return error(`casos_prueba ${n}: falta "resultado"`)
            try {
              const { resultado: esperado, ...datos } = caso
              const { resultado } = calcular(t, datos)
              if (!dentroDeTolerancia(esperado, resultado, t.respuesta))
                error(`casos_prueba ${n}: a mano sale ${esperado} pero la expresión da ${resultado}`)
            } catch (e) {
              error(`casos_prueba ${n}: no se puede calcular (${(e as Error).message})`)
            }
          })

          try {
            const azar = azarConSemilla(1)
            for (let i = 0; i < 50; i++) generarIntento(t, azar)
          } catch (e) {
            error((e as Error).message)
          }
        }
      }
    }
  }
  return { errores, avisos }
}
