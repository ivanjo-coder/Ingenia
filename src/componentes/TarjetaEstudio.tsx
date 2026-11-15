import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Idioma, Tarjeta, TarjetaProblema, TarjetaTest } from '../contenido/esquema'
import { elegir } from '../contenido/texto'
import { useIdioma } from '../i18n'
import { MARCA } from '../marca'
import { barajar, corregir, formatear, generarIntento, rellenar } from '../motor/problema'
import { Texto } from './Texto'
import { EtiquetaTipo, Figura, ReversoFormula } from './VistaTarjeta'

/** visto: el estudiante decide si se la sabía · acierto / fallo: lo ha corregido la app. */
export type Resultado = 'visto' | 'acierto' | 'fallo'

interface Props<T> {
  tarjeta: T
  idioma: Idioma
  asignaturaId: string
  /** Se llama una vez, cuando se enseña la respuesta. */
  onRevelar: (r: Resultado) => void
}

const BOTON_PRINCIPAL =
  'min-h-12 w-full rounded-xl bg-marca-700 px-4 text-base font-semibold text-white hover:bg-marca-800 disabled:opacity-50'

function Veredicto({ acierto }: { acierto: boolean }) {
  const { t } = useTranslation()
  return (
    <p role="status" className={`mt-4 text-lg font-bold ${acierto ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
      {acierto ? `✓ ${t('estudio.acierto')}` : `✗ ${t('estudio.fallo')}`}
    </p>
  )
}

function Test({ tarjeta, idioma, asignaturaId, onRevelar }: Props<TarjetaTest>) {
  const { t } = useTranslation()
  // Las opciones salen cada vez en un orden distinto.
  const opciones = useMemo(() => barajar(tarjeta.opciones), [tarjeta])
  const [elegida, setElegida] = useState<number | null>(null)
  const respondida = elegida !== null

  const responder = (i: number) => {
    if (respondida) return
    setElegida(i)
    onRevelar(opciones[i].correcta ? 'acierto' : 'fallo')
  }

  return (
    <>
      <p className="mt-3 text-lg font-medium">
        <Texto>{elegir(tarjeta.pregunta, idioma)}</Texto>
      </p>
      <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.pregunta} alt={tarjeta.figura?.alt ? elegir(tarjeta.figura.alt, idioma) : ''} />
      <ol className="mt-4 space-y-2">
        {opciones.map((o, i) => {
          const marcada = respondida && (o.correcta || i === elegida)
          const color = !marcada
            ? 'border-slate-300 dark:border-slate-700'
            : o.correcta
              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-rose-600 bg-rose-50 dark:bg-rose-950/40'
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => responder(i)}
                aria-disabled={respondida}
                className={`flex min-h-12 w-full gap-2 rounded-xl border-2 px-3 py-2.5 text-left ${color} ${respondida ? 'cursor-default' : 'hover:border-marca-600'}`}
              >
                <span className="font-semibold text-slate-500 dark:text-slate-400">{String.fromCharCode(97 + i)})</span>
                <span className="flex-1">
                  <Texto>{elegir(o.texto, idioma)}</Texto>
                  {respondida && (
                    <span className="mt-1 block text-sm text-slate-700 dark:text-slate-300">
                      <strong className={o.correcta ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                        {o.correcta ? `✓ ${t('tema.correcta')}` : `✗ ${t('tema.incorrecta')}`}
                        {i === elegida ? ` (${t('estudio.tuRespuesta')})` : ''}.
                      </strong>{' '}
                      <Texto>{elegir(o.explicacion, idioma)}</Texto>
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {respondida && <Veredicto acierto={!!opciones[elegida].correcta} />}
    </>
  )
}

function Problema({ tarjeta, idioma, asignaturaId, onRevelar }: Props<TarjetaProblema>) {
  const { t } = useTranslation()
  const idCampo = useId()
  // Datos nuevos cada vez que sale el problema.
  const [intento] = useState(() => generarIntento(tarjeta))
  const [texto, setTexto] = useState('')
  const [noValida, setNoValida] = useState(false)
  const [correcta, setCorrecta] = useState<boolean | null>(null)
  const campo = useRef<HTMLInputElement>(null)
  const dec = tarjeta.respuesta.decimales
  const corregido = correcta !== null

  useEffect(() => campo.current?.focus(), [])

  const comprobar = (e: React.FormEvent) => {
    e.preventDefault()
    if (corregido) return
    const c = corregir(texto, intento.resultado, tarjeta.respuesta)
    if (!c.valida) return setNoValida(true)
    setCorrecta(c.correcta)
    onRevelar(c.correcta ? 'acierto' : 'fallo')
  }

  const rendirse = () => {
    setCorrecta(false)
    onRevelar('fallo')
  }

  return (
    <>
      <p className="mt-3 text-lg">
        <Texto>{rellenar(elegir(tarjeta.enunciado, idioma), intento.valores, dec)}</Texto>
      </p>
      <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.pregunta} alt={tarjeta.figura?.alt ? elegir(tarjeta.figura.alt, idioma) : ''} />

      <form onSubmit={comprobar} className="mt-4" noValidate>
        <label htmlFor={idCampo} className="text-sm font-semibold">
          {t('estudio.tuResultado')}
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            ref={campo}
            id={idCampo}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            readOnly={corregido}
            aria-invalid={noValida}
            aria-describedby={noValida ? `${idCampo}-error` : undefined}
            onChange={(e) => {
              setTexto(e.target.value)
              setNoValida(false)
            }}
            className="min-h-12 w-full min-w-0 flex-1 rounded-xl border-2 border-slate-300 bg-white px-3 text-lg dark:border-slate-700 dark:bg-slate-950"
          />
          {tarjeta.respuesta.unidad && <span className="shrink-0 text-lg font-semibold">{tarjeta.respuesta.unidad}</span>}
        </div>
        {noValida && (
          <p id={`${idCampo}-error`} role="alert" className="mt-1 text-sm font-medium text-rose-700 dark:text-rose-400">
            {t('estudio.noEsNumero')}
          </p>
        )}
        {!corregido && (
          <div className="mt-3 space-y-2">
            <button type="submit" className={BOTON_PRINCIPAL}>
              {t('estudio.comprobar')}
            </button>
            <button type="button" onClick={rendirse} className="min-h-11 w-full rounded-xl text-sm font-semibold text-slate-600 hover:underline dark:text-slate-400">
              {t('estudio.noLoSe')}
            </button>
          </div>
        )}
      </form>

      {corregido && (
        <>
          <Veredicto acierto={correcta} />
          <p className="mt-1 font-semibold">
            {t('estudio.solucion')}: {formatear(intento.resultado, dec)} {tarjeta.respuesta.unidad}
          </p>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('estudio.resolucion')}</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            {elegir(tarjeta.resolucion, idioma).map((paso, i) => (
              <li key={i}>
                <Texto>{rellenar(paso, intento.valores, dec)}</Texto>
              </li>
            ))}
          </ol>
          <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.respuesta} alt="" />
        </>
      )}
    </>
  )
}

/** Una tarjeta en modo estudio: se responde y después se enseña la solución. */
export function TarjetaEstudio({ tarjeta, asignaturaId, onRevelar }: { tarjeta: Tarjeta; asignaturaId: string; onRevelar: (r: Resultado) => void }) {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const [girada, setGirada] = useState(false)
  const comun = { idioma, asignaturaId, onRevelar }

  const girar = () => {
    setGirada(true)
    onRevelar('visto')
  }

  const asunto = encodeURIComponent(`[${MARCA.nombre}] ${t('estudio.errorAsunto')} ${tarjeta.id}`)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaTipo tipo={tarjeta.tipo} />
        {tarjeta.revisar && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900 dark:bg-rose-950 dark:text-rose-200">{t('revisar')}</span>
        )}
      </div>

      {tarjeta.tipo === 'test' && <Test tarjeta={tarjeta} {...comun} />}
      {tarjeta.tipo === 'problema' && <Problema tarjeta={tarjeta} {...comun} />}
      {(tarjeta.tipo === 'concepto' || tarjeta.tipo === 'formula') && (
        <>
          <p className="mt-3 text-lg font-medium">
            <Texto>{elegir(tarjeta.pregunta, idioma)}</Texto>
          </p>
          <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.pregunta} alt={tarjeta.figura?.alt ? elegir(tarjeta.figura.alt, idioma) : ''} />
          {!girada ? (
            <button type="button" onClick={girar} autoFocus className={`${BOTON_PRINCIPAL} mt-5`}>
              {t('estudio.verRespuesta')}
            </button>
          ) : (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              {tarjeta.tipo === 'concepto' ? (
                <p className="text-lg">
                  <Texto>{elegir(tarjeta.respuesta, idioma)}</Texto>
                </p>
              ) : (
                <ReversoFormula tarjeta={tarjeta} idioma={idioma} />
              )}
              <Figura asignaturaId={asignaturaId} nombre={tarjeta.figura?.respuesta} alt="" />
            </div>
          )}
        </>
      )}

      {MARCA.correoErrores && (
        <p className="mt-5 text-right">
          <a href={`mailto:${MARCA.correoErrores}?subject=${asunto}`} className="text-xs text-slate-600 underline dark:text-slate-400">
            {t('estudio.avisarError')}
          </a>
        </p>
      )}
    </article>
  )
}
