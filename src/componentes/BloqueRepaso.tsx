import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Tarjeta } from '../contenido/esquema'
import { useResumen } from '../datos/usePendientes'

/** Cuántas tarjetas tocan hoy, con el botón para empezar a estudiar. */
export function BloqueRepaso({ tarjetas, a, textoBoton, conFases = false }: { tarjetas: Tarjeta[]; a: string; textoBoton: string; conFases?: boolean }) {
  const { t } = useTranslation()
  const resumen = useResumen(tarjetas)
  if (!resumen) return <div className="mt-4 h-32" />
  const hay = resumen.pendientes > 0
  return (
    <section className="mt-4 rounded-2xl bg-marca-700 p-4 text-white dark:bg-marca-800">
      <p className="text-xl font-bold">{hay ? t('repaso.pendientes', { count: resumen.pendientes }) : t('repaso.alDia')}</p>
      {!hay && <p className="text-sm text-marca-100">{t('repaso.alDiaTexto')}</p>}
      {conFases && (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {(['nueva', 'aprendiendo', 'dominada'] as const).map((fase) => (
            <div key={fase} className="rounded-lg bg-white/15 px-1 py-2">
              <dd className="text-xl font-bold tabular-nums">{resumen.fases[fase]}</dd>
              <dt className="text-xs">{t(`repaso.${fase === 'nueva' ? 'nuevas' : fase === 'dominada' ? 'dominadas' : 'aprendiendo'}`)}</dt>
            </div>
          ))}
        </dl>
      )}
      <Link to={a} className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-white text-base font-bold text-marca-900 hover:bg-marca-50">
        {textoBoton}
      </Link>
    </section>
  )
}
