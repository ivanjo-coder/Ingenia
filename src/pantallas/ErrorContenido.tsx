import { useTranslation } from 'react-i18next'
import type { Incidencia } from '../contenido/esquema'

/** Se muestra en lugar de la app cuando algún archivo de contenido está mal escrito. */
export function ErrorContenido({ errores }: { errores: Incidencia[] }) {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-400">{t('errorContenido.titulo')}</h1>
      <p className="mt-2">{t('errorContenido.texto')}</p>
      <ul className="mt-4 space-y-2">
        {errores.map((e, i) => (
          <li key={i} className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm dark:border-rose-800 dark:bg-rose-950/40">
            <code className="font-semibold">
              contenido/{e.archivo}
              {e.tarjeta ? ` [${e.tarjeta}]` : ''}
            </code>
            <p className="mt-1">{e.mensaje}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
