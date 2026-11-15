import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { MARCA } from '../marca'
import { SelectorIdioma } from './SelectorIdioma'

const ICONOS = {
  inicio: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  progreso: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  ajustes: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h10M18 18h2M16 4v4M8 10v4M16 16v4',
  sobre: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
}

function Pestana({ a, icono, texto }: { a: string; icono: keyof typeof ICONOS; texto: string }) {
  return (
    <NavLink
      to={a}
      end={a === '/'}
      className={({ isActive }) =>
        `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
          isActive ? 'text-marca-700 dark:text-marca-300' : 'text-slate-600 dark:text-slate-400'
        }`
      }
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ICONOS[icono]} />
      </svg>
      {texto}
    </NavLink>
  )
}

/** Cabecera, contenido y barra de navegación inferior: lo que comparten todas las pantallas. */
export function Marco() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900">
        {t('nav.saltar')}
      </a>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <img src="./icono.svg" alt="" className="size-7" />
            {MARCA.nombre}
          </Link>
          <SelectorIdioma />
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-5">
        <Outlet />
      </main>
      <nav aria-label={t('nav.principal')} className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-2xl">
          <Pestana a="/" icono="inicio" texto={t('nav.inicio')} />
          <Pestana a="/progreso" icono="progreso" texto={t('nav.progreso')} />
          <Pestana a="/ajustes" icono="ajustes" texto={t('nav.ajustes')} />
          <Pestana a="/sobre" icono="sobre" texto={t('nav.sobre')} />
        </div>
      </nav>
    </div>
  )
}

export function Volver({ a, texto }: { a: string; texto: string }) {
  return (
    <Link to={a} className="-ml-1 mb-3 inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-sm font-medium text-marca-700 hover:underline dark:text-marca-300">
      <span aria-hidden="true">←</span> {texto}
    </Link>
  )
}

export function Aviso() {
  const { t } = useTranslation()
  return (
    <p className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      {t('aviso')}
    </p>
  )
}
