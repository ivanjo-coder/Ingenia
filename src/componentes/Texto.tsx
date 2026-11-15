import katex from 'katex'
import 'katex/dist/katex.min.css'
import { memo } from 'react'
import { trocear } from '../contenido/texto'

function html(formula: string, bloque: boolean): string {
  return katex.renderToString(formula, { displayMode: bloque, throwOnError: false, strict: 'ignore' })
}

/** Una fórmula suelta en LaTeX (sin los $). */
export const Formula = memo(function Formula({ children, bloque = false }: { children: string; bloque?: boolean }) {
  const Etiqueta = bloque ? 'div' : 'span'
  return <Etiqueta dangerouslySetInnerHTML={{ __html: html(children, bloque) }} />
})

/** Texto que puede llevar fórmulas entre $...$ ($$...$$ para una fórmula centrada). */
export const Texto = memo(function Texto({ children }: { children: string }) {
  return (
    <>
      {trocear(children).map((trozo, i) =>
        trozo.tipo === 'texto' ? (
          <span key={i}>{trozo.valor}</span>
        ) : (
          <Formula key={i} bloque={trozo.tipo === 'formula-bloque'}>
            {trozo.valor}
          </Formula>
        ),
      )}
    </>
  )
})
