import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { BloqueRepaso } from '../componentes/BloqueRepaso'
import { Aviso, Volver } from '../componentes/Marco'
import { VistaTarjeta } from '../componentes/VistaTarjeta'
import { biblioteca } from '../contenido/cargar'
import type { TipoTarjeta } from '../contenido/esquema'
import { elegir } from '../contenido/texto'
import { useIdioma } from '../i18n'
import { NoEncontrado } from './NoEncontrado'

const TIPOS: TipoTarjeta[] = ['concepto', 'formula', 'test', 'problema']

export function Tema() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const { asignaturaId, temaId } = useParams()
  const [filtro, setFiltro] = useState<TipoTarjeta | 'todas'>('todas')
  const asignatura = biblioteca.asignaturas.find((a) => a.id === asignaturaId)
  const tema = asignatura?.temas.find((x) => x.id === temaId)
  if (!asignatura || !tema) return <NoEncontrado />

  const cuenta = (tipo: TipoTarjeta) => tema.tarjetas.filter((x) => x.tipo === tipo).length
  const visibles = tema.tarjetas.filter((x) => filtro === 'todas' || x.tipo === filtro)
  const boton = (activo: boolean) =>
    `min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold transition-colors ${
      activo
        ? 'border-marca-700 bg-marca-700 text-white'
        : 'border-slate-300 bg-white text-slate-700 hover:border-marca-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
    }`

  return (
    <>
      <Volver a={`/asignatura/${asignatura.id}`} texto={elegir(asignatura.nombre, idioma)} />
      <h1 className="text-2xl font-bold tracking-tight">{elegir(tema.nombre, idioma)}</h1>

      <BloqueRepaso tarjetas={tema.tarjetas} a={`/repaso/${asignatura.id}/${tema.id}`} textoBoton={t('repaso.estudiar')} conFases />
      <Link to={`/test/${asignatura.id}/${tema.id}`} className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-marca-700 bg-white px-4 py-2 hover:bg-marca-50 dark:bg-slate-900 dark:hover:bg-marca-900/40">
        <span>
          <span className="block font-bold text-marca-800 dark:text-marca-300">{t('examen.rapido')}</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">{t('examen.rapidoTexto')}</span>
        </span>
        <span aria-hidden="true" className="text-2xl text-marca-700 dark:text-marca-300">›</span>
      </Link>

      <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('repaso.todasLasTarjetas')}</h2>
      <div role="group" aria-label={t('tema.filtro')} className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 py-1">
        <button type="button" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')} className={boton(filtro === 'todas')}>
          {t('tema.todas')} ({tema.tarjetas.length})
        </button>
        {TIPOS.filter((tipo) => cuenta(tipo) > 0).map((tipo) => (
          <button key={tipo} type="button" aria-pressed={filtro === tipo} onClick={() => setFiltro(tipo)} className={boton(filtro === tipo)}>
            {t(`tipoPlural.${tipo}`)} ({cuenta(tipo)})
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {visibles.map((tarjeta) => (
          <li key={tarjeta.id}>
            <VistaTarjeta tarjeta={tarjeta} asignaturaId={asignatura.id} />
          </li>
        ))}
      </ul>
      <Aviso />
    </>
  )
}
