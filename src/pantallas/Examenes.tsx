import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { Examen } from '../componentes/Examen'
import { Volver } from '../componentes/Marco'
import { biblioteca } from '../contenido/cargar'
import { elegir } from '../contenido/texto'
import { useIdioma } from '../i18n'
import { elegirPreguntas, type Candidata, type Pregunta } from '../motor/examen'
import { NoEncontrado } from './NoEncontrado'

const N_RAPIDO = 10

function SinPreguntas({ volver }: { volver: string }) {
  const { t } = useTranslation()
  return (
    <div className="py-8 text-center">
      <p className="text-slate-700 dark:text-slate-300">{t('examen.sinPreguntas')}</p>
      <Link to={volver} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-marca-700 px-4 font-semibold text-white">
        {t('volver')}
      </Link>
    </div>
  )
}

/** Test rápido: hasta 10 preguntas tipo test de un tema. */
export function TestRapido() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const { asignaturaId, temaId } = useParams()
  const [vuelta, setVuelta] = useState(0)
  const asignatura = biblioteca.asignaturas.find((a) => a.id === asignaturaId)
  const tema = asignatura?.temas.find((x) => x.id === temaId)

  const preguntas = useMemo(
    () => (tema && asignatura ? elegirPreguntas(tema.tarjetas.map((tarjeta) => ({ tarjeta, asignaturaId: asignatura.id })), N_RAPIDO, ['test']) : []),
    // "vuelta" cambia al pulsar Repetir, para sortear preguntas nuevas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tema, asignatura, vuelta],
  )
  if (!asignatura || !tema) return <NoEncontrado />
  const volver = `/asignatura/${asignatura.id}/tema/${tema.id}`

  return (
    <>
      <Volver a={volver} texto={elegir(tema.nombre, idioma)} />
      <h1 className="sr-only">{t('examen.rapido')}</h1>
      {preguntas.length === 0 ? (
        <SinPreguntas volver={volver} />
      ) : (
        <Examen key={vuelta} preguntas={preguntas} tipo="rapido" volver={volver} onRepetir={() => setVuelta((v) => v + 1)} />
      )}
    </>
  )
}

const OPCIONES_N = [5, 10, 20, 30]
const OPCIONES_TIEMPO = [0, 15, 30, 60, 90]

/** Simulacro: el estudiante elige temas, número de preguntas y tiempo. */
export function Simulacro() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const { asignaturaId } = useParams()
  const asignatura = biblioteca.asignaturas.find((a) => a.id === asignaturaId)
  const [temas, setTemas] = useState<Set<string>>(() => new Set(asignatura?.temas.map((x) => x.id)))
  const [n, setN] = useState(10)
  const [minutos, setMinutos] = useState(0)
  const [examen, setExamen] = useState<{ preguntas: Pregunta[]; clave: number } | null>(null)

  if (!asignatura) return <NoEncontrado />
  const volver = `/asignatura/${asignatura.id}`

  const candidatas: Candidata[] = asignatura.temas
    .filter((x) => temas.has(x.id))
    .flatMap((x) => x.tarjetas.map((tarjeta) => ({ tarjeta, asignaturaId: asignatura.id })))
  const disponibles = candidatas.filter((c) => c.tarjeta.tipo === 'test' || c.tarjeta.tipo === 'problema').length

  const empezar = () => {
    setExamen({ preguntas: elegirPreguntas(candidatas, n, ['test', 'problema']), clave: Date.now() })
    window.scrollTo(0, 0)
  }

  if (examen)
    return (
      <>
        <button type="button" onClick={() => setExamen(null)} className="-ml-1 mb-3 inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-sm font-medium text-marca-700 hover:underline dark:text-marca-300">
          <span aria-hidden="true">←</span> {t('examen.simulacro')}
        </button>
        <Examen key={examen.clave} preguntas={examen.preguntas} tipo="simulacro" minutos={minutos || undefined} volver={volver} onRepetir={empezar} />
      </>
    )

  const cambiarTema = (id: string) =>
    setTemas((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  const select = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-950'

  return (
    <>
      <Volver a={volver} texto={elegir(asignatura.nombre, idioma)} />
      <h1 className="text-2xl font-bold tracking-tight">{t('examen.simulacro')}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{t('examen.simulacroTexto')}</p>

      <fieldset className="mt-5">
        <legend className="font-semibold">{t('examen.temas')}</legend>
        <div className="mt-2 space-y-2">
          {asignatura.temas.map((x) => (
            <label key={x.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
              <input type="checkbox" checked={temas.has(x.id)} onChange={() => cambiarTema(x.id)} className="size-5 accent-marca-700" />
              {elegir(x.nombre, idioma)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="font-semibold">
          {t('examen.cuantas')}
          <select value={n} onChange={(e) => setN(Number(e.target.value))} className={select}>
            {OPCIONES_N.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="font-semibold">
          {t('examen.tiempo')}
          <select value={minutos} onChange={(e) => setMinutos(Number(e.target.value))} className={select}>
            {OPCIONES_TIEMPO.map((x) => (
              <option key={x} value={x}>
                {x === 0 ? t('examen.sinLimite') : t('intervalo.min', { count: x })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
        {disponibles === 0 ? t('examen.eligeTema') : disponibles < n ? t('examen.soloHay', { count: disponibles }) : t('examen.sinPenalizacion')}
      </p>
      <button type="button" onClick={empezar} disabled={disponibles === 0} className="mt-3 min-h-12 w-full rounded-xl bg-marca-700 text-base font-semibold text-white hover:bg-marca-800 disabled:opacity-50">
        {t('examen.empezar')}
      </button>
    </>
  )
}
