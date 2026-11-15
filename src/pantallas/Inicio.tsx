import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { BloqueRepaso } from '../componentes/BloqueRepaso'
import { biblioteca } from '../contenido/cargar'
import { elegir } from '../contenido/texto'
import { useIdioma } from '../i18n'

const TODAS = biblioteca.asignaturas.flatMap((a) => a.temas.flatMap((tema) => tema.tarjetas))

export function Inicio() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  return (
    <div className="-mt-4">
      <BloqueRepaso tarjetas={TODAS} a="/repaso" textoBoton={t('repaso.repasarAhora')} />
      <h1 className="mt-7 text-2xl font-bold tracking-tight">{t('inicio.titulo')}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{t('inicio.subtitulo')}</p>
      <ul className="mt-5 space-y-3">
        {biblioteca.asignaturas.map((a) => {
          const nombre = elegir(a.nombre, idioma)
          const tarjetas = a.temas.reduce((n, tema) => n + tema.tarjetas.length, 0)
          return (
            <li key={a.id}>
              {a.estado === 'disponible' ? (
                <Link
                  to={`/asignatura/${a.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-marca-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-marca-400"
                >
                  <span>
                    <span className="block text-lg font-semibold">{nombre}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {a.temas.length} {t('asignatura.temas').toLowerCase()} · {t('asignatura.tarjetas', { count: tarjetas })}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-2xl text-marca-700 dark:text-marca-300">›</span>
                </Link>
              ) : (
                <div className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 dark:border-slate-700">
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">{nombre}</span>
                  <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {t('inicio.proximamente')}
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
