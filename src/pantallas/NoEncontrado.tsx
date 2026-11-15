import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NoEncontrado() {
  const { t } = useTranslation()
  return (
    <div className="py-10 text-center">
      <h1 className="text-2xl font-bold">{t('noEncontrado.titulo')}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{t('noEncontrado.texto')}</p>
      <Link to="/" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-marca-700 px-4 font-semibold text-white hover:bg-marca-800">
        {t('noEncontrado.inicio')}
      </Link>
    </div>
  )
}
