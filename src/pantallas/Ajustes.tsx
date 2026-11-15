import { useTranslation } from 'react-i18next'
import { guardarNuevasPorDia, NUEVAS_POR_DIA_OPCIONES, useNuevasPorDia } from '../datos/ajustes'
import { SelectorIdioma } from '../componentes/SelectorIdioma'

export function Ajustes() {
  const { t } = useTranslation()
  const nuevasPorDia = useNuevasPorDia()
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t('ajustes.titulo')}</h1>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-semibold">{t('idioma.titulo')}</h2>
        <SelectorIdioma grande />
      </section>
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="nuevas" className="font-semibold">
          {t('ajustes.nuevasTitulo')}
        </label>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('ajustes.nuevasTexto')}</p>
        <select
          id="nuevas"
          value={nuevasPorDia}
          onChange={(e) => guardarNuevasPorDia(Number(e.target.value))}
          className="mt-3 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-950"
        >
          {NUEVAS_POR_DIA_OPCIONES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </section>
    </>
  )
}
