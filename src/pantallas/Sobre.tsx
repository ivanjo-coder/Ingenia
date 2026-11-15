import { useTranslation } from 'react-i18next'
import { Aviso } from '../componentes/Marco'
import { MARCA } from '../marca'

export function Sobre() {
  const { t } = useTranslation()
  const nombre = MARCA.nombre
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t('sobre.titulo', { nombre })}</h1>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{t('sobre.intro', { nombre })}</p>

      <h2 className="mt-6 text-lg font-semibold">{t('sobre.promesas')}</h2>
      <ol className="mt-3 space-y-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-marca-700 font-bold text-white">
              {n}
            </span>
            <div>
              <h3 className="font-semibold">{t(`sobre.p${n}t`)}</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">{t(`sobre.p${n}`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-6 text-lg font-semibold">{t('sobre.privacidad')}</h2>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{t('sobre.privacidadTexto')}</p>

      <h2 className="mt-6 text-lg font-semibold">{t('sobre.contenido')}</h2>
      <div className="-mt-5">
        <Aviso />
      </div>
    </>
  )
}
