import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { elegir } from '../contenido/texto'
import { guardarExamen } from '../datos/db'
import { useIdioma } from '../i18n'
import { corregirExamen, estaContestada, reloj, type Pregunta, type Respuesta } from '../motor/examen'
import { formatear, leerNumero, rellenar } from '../motor/problema'
import { Aviso } from './Marco'
import { Texto } from './Texto'
import { EtiquetaTipo, Figura } from './VistaTarjeta'

interface Props {
  preguntas: Pregunta[]
  tipo: 'rapido' | 'simulacro'
  /** Tiempo límite en minutos. Sin valor = sin límite. */
  minutos?: number
  volver: string
  onRepetir: () => void
}

const BOTON = 'min-h-12 rounded-xl px-4 font-semibold'
const PRIMARIO = `${BOTON} bg-marca-700 text-white hover:bg-marca-800`
const SECUNDARIO = `${BOTON} border-2 border-slate-300 hover:border-marca-600 disabled:opacity-40 dark:border-slate-700`

function Enunciado({ p }: { p: Pregunta }) {
  const idioma = useIdioma()
  const texto =
    p.tipo === 'test'
      ? elegir(p.tarjeta.pregunta, idioma)
      : rellenar(elegir(p.tarjeta.enunciado, idioma), p.intento.valores, p.tarjeta.respuesta.decimales)
  return (
    <>
      <p className="mt-3 text-lg font-medium">
        <Texto>{texto}</Texto>
      </p>
      <Figura asignaturaId={p.asignaturaId} nombre={p.tarjeta.figura?.pregunta} alt={p.tarjeta.figura?.alt ? elegir(p.tarjeta.figura.alt, idioma) : ''} />
    </>
  )
}

/** Un test rápido o simulacro: se contesta todo, se entrega y al final salen la nota y los fallos. */
export function Examen({ preguntas, tipo, minutos, volver, onRepetir }: Props) {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const idCampo = useId()
  const [respuestas, setRespuestas] = useState<Respuesta[]>(() => preguntas.map(() => null))
  const [actual, setActual] = useState(0)
  const [entregado, setEntregado] = useState(false)
  const [restante, setRestante] = useState(minutos ? minutos * 60 : null)
  const [confirmar, setConfirmar] = useState(false)
  const guardado = useRef(false)

  const resultado = useMemo(() => (entregado ? corregirExamen(preguntas, respuestas) : null), [entregado, preguntas, respuestas])
  const enBlanco = respuestas.filter((r) => !estaContestada(r)).length

  const entregar = useCallback(() => {
    setEntregado(true)
    window.scrollTo(0, 0)
  }, [])

  // Cuenta atrás: al llegar a cero se entrega solo.
  useEffect(() => {
    if (!minutos || entregado) return
    const fin = Date.now() + minutos * 60_000
    const reloj = setInterval(() => {
      const quedan = (fin - Date.now()) / 1000
      setRestante(quedan)
      if (quedan <= 0) entregar()
    }, 500)
    return () => clearInterval(reloj)
  }, [minutos, entregado, entregar])

  useEffect(() => {
    if (!resultado || guardado.current) return
    guardado.current = true
    void guardarExamen(tipo, resultado.nota, preguntas.map((p, i) => ({ tarjetaId: p.tarjeta.id, correcta: resultado.correctas[i] })))
  }, [resultado, tipo, preguntas])

  const responder = (valor: Respuesta) => setRespuestas((r) => r.map((x, i) => (i === actual ? valor : x)))

  if (resultado) {
    const aprobado = resultado.nota >= 5
    return (
      <>
        <section className={`rounded-2xl p-5 text-center text-white ${aprobado ? 'bg-emerald-700' : 'bg-rose-700'}`}>
          <h1 className="text-sm font-semibold uppercase tracking-wide">{t('examen.tuNota')}</h1>
          <p className="mt-1 text-5xl font-bold tabular-nums">{formatear(resultado.nota, 1)}</p>
          <p className="mt-1">{t('examen.aciertos', { aciertos: resultado.aciertos, total: resultado.total })}</p>
        </section>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onRepetir} className={SECUNDARIO}>
            {t('examen.repetir')}
          </button>
          <Link to={volver} className={`${PRIMARIO} flex items-center justify-center`}>
            {t('volver')}
          </Link>
        </div>

        <h2 className="mt-7 text-lg font-bold">{resultado.aciertos === resultado.total ? t('examen.sinFallos') : t('examen.repaso')}</h2>
        <ol className="mt-3 space-y-3">
          {preguntas.map((p, i) => {
            const bien = resultado.correctas[i]
            const r = respuestas[i]
            return (
              <li key={i} className={`rounded-xl border-2 bg-white p-4 dark:bg-slate-900 ${bien ? 'border-emerald-600/50' : 'border-rose-600'}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${bien ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {i + 1}. {bien ? `✓ ${t('tema.correcta')}` : `✗ ${estaContestada(r) ? t('tema.incorrecta') : t('examen.enBlanco')}`}
                  </span>
                  <EtiquetaTipo tipo={p.tipo} />
                </div>
                <Enunciado p={p} />
                {p.tipo === 'test' ? (
                  <ul className="mt-3 space-y-2">
                    {p.opciones.map((o, j) => {
                      const mostrar = !bien || o.correcta
                      if (!mostrar) return null
                      return (
                        <li key={j} className="text-sm">
                          <strong className={o.correcta ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                            {o.correcta ? '✓' : '✗'} <Texto>{elegir(o.texto, idioma)}</Texto>
                            {r === j ? ` (${t('estudio.tuRespuesta')})` : ''}
                          </strong>
                          <span className="block text-slate-700 dark:text-slate-300">
                            <Texto>{elegir(o.explicacion, idioma)}</Texto>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="mt-3 text-sm">
                    <p>
                      {t('examen.tuRespuesta')}: <strong>{estaContestada(r) ? `${r} ${p.tarjeta.respuesta.unidad}` : '—'}</strong>
                    </p>
                    <p>
                      {t('estudio.solucion')}:{' '}
                      <strong>
                        {formatear(p.intento.resultado, p.tarjeta.respuesta.decimales)} {p.tarjeta.respuesta.unidad}
                      </strong>
                    </p>
                    {!bien && (
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                        {elegir(p.tarjeta.resolucion, idioma).map((paso, k) => (
                          <li key={k}>
                            <Texto>{rellenar(paso, p.intento.valores, p.tarjeta.respuesta.decimales)}</Texto>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <Aviso />
      </>
    )
  }

  const p = preguntas[actual]
  const r = respuestas[actual]
  const ultima = actual === preguntas.length - 1
  const numeroMal = p.tipo === 'problema' && typeof r === 'string' && r !== '' && leerNumero(r) === null

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('examen.pregunta', { n: actual + 1, total: preguntas.length })}</p>
        {restante !== null && (
          <p
            role="timer"
            aria-label={t('examen.tiempo')}
            className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${restante < 60 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-slate-200 dark:bg-slate-800'}`}
          >
            ⏱ {reloj(restante)}
          </p>
        )}
      </div>

      <nav aria-label={t('examen.irA')} className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 py-1">
        {preguntas.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActual(i)}
            aria-current={i === actual ? 'step' : undefined}
            aria-label={`${t('examen.pregunta', { n: i + 1, total: preguntas.length })}${estaContestada(respuestas[i]) ? '' : ` (${t('examen.enBlanco')})`}`}
            className={`size-10 shrink-0 rounded-lg border-2 text-sm font-semibold tabular-nums ${
              i === actual ? 'border-marca-700 ' : 'border-transparent '
            }${estaContestada(respuestas[i]) ? 'bg-marca-700 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <EtiquetaTipo tipo={p.tipo} />
        <Enunciado p={p} />
        {p.tipo === 'test' ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">{t('examen.elige')}</legend>
            {p.opciones.map((o, j) => (
              <label
                key={j}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 has-focus-visible:outline-2 has-focus-visible:outline-marca-600 ${
                  r === j ? 'border-marca-700 bg-marca-50 dark:bg-marca-900/40' : 'border-slate-300 hover:border-marca-600 dark:border-slate-700'
                }`}
              >
                <input type="radio" name={`${idCampo}-${actual}`} checked={r === j} onChange={() => responder(j)} className="size-5 shrink-0 accent-marca-700" />
                <span>
                  <Texto>{elegir(o.texto, idioma)}</Texto>
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="mt-4">
            <label htmlFor={idCampo} className="text-sm font-semibold">
              {t('estudio.tuResultado')}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id={idCampo}
                key={actual}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={typeof r === 'string' ? r : ''}
                aria-invalid={numeroMal}
                onChange={(e) => responder(e.target.value)}
                className="min-h-12 w-full min-w-0 flex-1 rounded-xl border-2 border-slate-300 bg-white px-3 text-lg dark:border-slate-700 dark:bg-slate-950"
              />
              {p.tarjeta.respuesta.unidad && <span className="shrink-0 text-lg font-semibold">{p.tarjeta.respuesta.unidad}</span>}
            </div>
            {numeroMal && (
              <p role="alert" className="mt-1 text-sm font-medium text-rose-700 dark:text-rose-400">
                {t('estudio.noEsNumero')}
              </p>
            )}
          </div>
        )}
      </article>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setActual(actual - 1)} disabled={actual === 0} className={SECUNDARIO}>
          ← {t('examen.anterior')}
        </button>
        {ultima ? (
          <button type="button" onClick={() => (enBlanco > 0 ? setConfirmar(true) : entregar())} className={PRIMARIO}>
            {t('examen.entregar')}
          </button>
        ) : (
          <button type="button" onClick={() => setActual(actual + 1)} className={PRIMARIO}>
            {t('examen.siguiente')} →
          </button>
        )}
      </div>
      {!ultima && (
        <button type="button" onClick={() => (enBlanco > 0 ? setConfirmar(true) : entregar())} className="mt-2 min-h-11 w-full text-sm font-semibold text-slate-600 hover:underline dark:text-slate-400">
          {t('examen.entregarYa')}
        </button>
      )}

      {confirmar && (
        <div role="alertdialog" aria-labelledby={`${idCampo}-conf`} className="mt-3 rounded-xl border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/40">
          <p id={`${idCampo}-conf`} className="font-semibold">
            {t('examen.confirmar', { count: enBlanco })}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmar(false)} className={SECUNDARIO} autoFocus>
              {t('examen.seguir')}
            </button>
            <button type="button" onClick={entregar} className={PRIMARIO}>
              {t('examen.entregar')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
