import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { Volver } from '../componentes/Marco'
import { biblioteca } from '../contenido/cargar'
import { elegir } from '../contenido/texto'
import { useIdioma } from '../i18n'
import { NoEncontrado } from './NoEncontrado'

export function Asignatura() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const { asignaturaId } = useParams()
  const asignatura = biblioteca.asignaturas.find((a) => a.id === asignaturaId)
  if (!asignatura) return <NoEncontrado />

  return (
    <>
      <Volver a="/" texto={t('inicio.titulo')} />
      <h1 className="text-2xl font-bold tracking-tight">{elegir(asignatura.nombre, idioma)}</h1>
      {asignatura.temas.length === 0 ? (
        <p className="mt-4 text-slate-600 dark:text-slate-400">{t('asignatura.sinTemas')}</p>
      ) : (
        <>
          <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('asignatura.temas')}</h2>
          <ol className="mt-2 space-y-3">
            {asignatura.temas.map((tema, i) => (
              <li key={tema.id}>
                <Link
                  to={`/asignatura/${asignatura.id}/tema/${tema.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-marca-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-marca-400"
                >
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marca-100 font-bold text-marca-900 dark:bg-marca-900 dark:text-marca-100">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-lg font-semibold">{elegir(tema.nombre, idioma)}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('asignatura.tarjetas', { count: tema.tarjetas.length })}</span>
                  </span>
                  <span aria-hidden="true" className="text-2xl text-marca-700 dark:text-marca-300">›</span>
                </Link>
              </li>
            ))}
          </ol>
              <Link to={`/simulacro/${asignatura.id}`} className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-marca-700 bg-white px-4 py-2 hover:bg-marca-50 dark:bg-slate-900 dark:hover:bg-marca-900/40">
                <span>
                  <span className="block font-bold text-marca-800 dark:text-marca-300">{t('examen.simulacro')}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('examen.simulacroTexto')}</span>
                    </span>
                <span aria-hidden="true" className="text-2xl text-marca-700 dark:text-marca-300">›</span>
                  </Link>
        </>
      )}
    </>
  )
}
