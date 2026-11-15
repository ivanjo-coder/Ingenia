import type { Idioma, TextoBilingue } from './esquema'

/** Devuelve el texto en el idioma pedido; si falta, el del otro idioma. */
export function elegir<T>(texto: { ca?: T; es?: T }, idioma: Idioma): T {
  return (texto[idioma] ?? texto.ca ?? texto.es) as T
}

export type Trozo = { tipo: 'texto' | 'formula' | 'formula-bloque'; valor: string }

const FORMULAS = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g

/** Separa un texto en trozos de texto normal y fórmulas ($...$ en línea, $$...$$ centrada). */
export function trocear(texto: string): Trozo[] {
  const trozos: Trozo[] = []
  let ultimo = 0
  for (const m of texto.matchAll(FORMULAS)) {
    if (m.index > ultimo) trozos.push({ tipo: 'texto', valor: texto.slice(ultimo, m.index) })
    trozos.push(m[1] !== undefined ? { tipo: 'formula-bloque', valor: m[1] } : { tipo: 'formula', valor: m[2] })
    ultimo = m.index + m[0].length
  }
  if (ultimo < texto.length) trozos.push({ tipo: 'texto', valor: texto.slice(ultimo) })
  return trozos
}

export type { TextoBilingue }
