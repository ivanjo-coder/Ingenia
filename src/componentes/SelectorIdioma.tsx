import { useTranslation } from 'react-i18next'
import type { Idioma } from '../contenido/esquema'
import { cambiarIdioma, useIdioma } from '../i18n'

const IDIOMAS: Idioma[] = ['ca', 'es']

export function SelectorIdioma({ grande = false }: { grande?: boolean }) {
  const { t } = useTranslation()
  const actual = useIdioma()
  return (
    <div role="group" aria-label={t('idioma.cambiar')} className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
      {IDIOMAS.map((idioma) => (
        <button
          key={idioma}
          type="button"
          lang={idioma}
          aria-pressed={actual === idioma}
          onClick={() => cambiarIdioma(idioma)}
          className={`rounded-md font-semibold transition-colors ${grande ? 'min-h-11 px-4 text-base' : 'min-h-9 px-2.5 text-sm'} ${
            actual === idioma
              ? 'bg-marca-700 text-white'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {grande ? t(`idioma.${idioma}`) : idioma.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
