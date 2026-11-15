import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { rutaFigura } from '../contenido/biblioteca'
import { urlFigura } from '../contenido/cargar'
import type { Idioma, Tarjeta, TarjetaFormula, TarjetaProblema, TarjetaTest, TipoTarjeta } from '../contenido/esquema'
import { elegir } from '../contenido/texto'
import { useIdioma } from '../i18n'
import { calcular, formatear, rellenar } from '../motor/problema'
import { Formula, Texto } from './Texto'

const COLORES: Record<TipoTarjeta, string> = {
  concepto: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  formula: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  test: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  problema: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
}

export function EtiquetaTipo({ tipo }: { tipo: TipoTarjeta }) {
  const { t } = useTranslation()
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLORES[tipo]}`}>{t(`tipo.${tipo}`)}</span>
}

function Figura({ asignaturaId, nombre, alt }: { asignaturaId: string; nombre?: string; alt: string }) {
  const url = nombre ? urlFigura(rutaFigura(asignaturaId, nombre)) : undefined
  if (!url) return null
  return <img src={url} alt={alt} loading="lazy" className="mt-3 max-h-64 w-full rounded-lg border border-slate-200 bg-white object-contain dark:border-slate-700" />
}

function ReversoFormula({ tarjeta, idioma }: { tarjeta: TarjetaFormula; idioma: Idioma }) {
  const { t } = useTranslation()
  return (
    <>
      <Formula bloque>{tarjeta.expresion}</Formula>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="sr-only">
          <tr>
            <th>{t('formula.simbolo')}</th>
            <th>{t('formula.significado')}</th>
            <th>{t('formula.unidad')}</th>
          </tr>
        </thead>
        <tbody>
          {tarjeta.simbolos.map((s) => (
            <tr key={s.simbolo} className="border-t border-slate-200 dark:border-slate-700">
              <td className="w-12 py-1.5 pr-2">
                <Formula>{s.simbolo}</Formula>
              </td>
              <td className="py-1.5 pr-2">
                <Texto>{elegir(s.significado, idioma)}</Texto>
              </td>
              <td className="whitespace-nowrap py-1.5 text-right text-slate-600 dark:text-slate-400">{s.unidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {tarjeta.nota && (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          <Texto>{elegir(tarjeta.nota, idioma)}</Texto>
        </p>
      )}
    </>
  )
}

function Opciones({ tarjeta, idioma, conExplicacion }: { tarjeta: TarjetaTest; idioma: Idioma; conExplicacion: boolean }) {
  const { t } = useTranslation()
  return (
    <ol className="mt-3 space-y-2">
      {tarjeta.opciones.map((o, i) => (
        <li key={i} className="flex gap-2">
          <span className="font-semibold text-slate-500 dark:text-slate-400" aria-hidden="true">
            {String.fromCharCode(97 + i)})
          </span>
          <div>
            <Texto>{elegir(o.texto, idioma)}</Texto>
            {conExplicacion && (
              <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                <strong className={o.correcta ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                  {o.correcta ? `✓ ${t('tema.correcta')}` : `✗ ${t('tema.incorrecta')}`}.
                </strong>{' '}
                <Texto>{elegir(o.explicacion, idioma)}</Texto>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Datos del primer caso resuelto a mano, para enseñar el problema con números. */
function useEjemplo(tarjeta: TarjetaProblema) {
  return useMemo(() => {
    const { resultado: _, ...datos } = tarjeta.casos_prueba[0]
    return calcular(tarjeta, datos)
  }, [tarjeta])
}

function Problema({ tarjeta, idioma, asignaturaId }: { tarjeta: TarjetaProblema; idioma: Idioma; asignaturaId: string }) {
  const { t } = useTranslation()
  const { valores, resultado } = useEjemplo(tarjeta)
  const dec = tarjeta.respuesta.decimales
  return (
    <>
      <p className="mt-2">
        <Texto>{rellenar(elegir(tarjeta.enunciado, idioma), valores, dec)}</Texto>
      </p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t('tema.ejemplo')}</p>
      <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.pregunta} alt={tarjeta.figura?.alt ? elegir(tarjeta.figura.alt, idioma) : ''} />
      <Desplegable titulo={t('tema.verResolucion')}>
        <ol className="list-decimal space-y-2 pl-5">
          {elegir(tarjeta.resolucion, idioma).map((paso, i) => (
            <li key={i}>
              <Texto>{rellenar(paso, valores, dec)}</Texto>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-semibold">
          {t('tema.resultado')}: {formatear(resultado, dec)} {tarjeta.respuesta.unidad}
        </p>
        <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.respuesta} alt="" />
      </Desplegable>
    </>
  )
}

function Desplegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
      <summary className="-mx-1 flex min-h-9 cursor-pointer list-none items-center gap-1 rounded-md px-1 text-sm font-semibold text-marca-700 dark:text-marca-300 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
        {titulo}
      </summary>
      <div className="pt-2">{children}</div>
    </details>
  )
}

/** Una tarjeta en la lista del tema: pregunta a la vista y respuesta desplegable. */
export function VistaTarjeta({ tarjeta, asignaturaId }: { tarjeta: Tarjeta; asignaturaId: string }) {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const alt = tarjeta.figura?.alt ? elegir(tarjeta.figura.alt, idioma) : ''

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaTipo tipo={tarjeta.tipo} />
        {tarjeta.revisar && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900 dark:bg-rose-950 dark:text-rose-200">{t('revisar')}</span>
        )}
      </div>

      {tarjeta.tipo === 'problema' ? (
        <Problema tarjeta={tarjeta} idioma={idioma} asignaturaId={asignaturaId} />
      ) : (
        <>
          <p className="mt-2 font-medium">
            <Texto>{elegir(tarjeta.pregunta, idioma)}</Texto>
          </p>
          <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.pregunta} alt={alt} />
          {tarjeta.tipo === 'test' && <Opciones tarjeta={tarjeta} idioma={idioma} conExplicacion={false} />}
          <Desplegable titulo={t('tema.verRespuesta')}>
            {tarjeta.tipo === 'concepto' && (
              <p>
                <Texto>{elegir(tarjeta.respuesta, idioma)}</Texto>
              </p>
            )}
            {tarjeta.tipo === 'formula' && <ReversoFormula tarjeta={tarjeta} idioma={idioma} />}
            {tarjeta.tipo === 'test' && <Opciones tarjeta={tarjeta} idioma={idioma} conExplicacion />}
            <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.respuesta} alt="" />
          </Desplegable>
        </>
      )}
    </article>
  )
}
