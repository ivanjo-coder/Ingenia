import { useTranslation } from 'react-i18next'
import { SelectorIdioma } from '../componentes/SelectorIdioma'

export function Ajustes() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t('ajustes.titulo')}</h1>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-semibold">{t('idioma.titulo')}</h2>
        <SelectorIdioma grande />
      </section>
    </>
  )
}
