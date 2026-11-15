import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Texto } from '../componentes/Texto'
import { EtiquetaTipo } from '../componentes/VistaTarjeta'
import { biblioteca } from '../contenido/cargar'
import type { Tarjeta } from '../contenido/esquema'
import { elegir } from '../contenido/texto'
import { db } from '../datos/db'
import { useResumen } from '../datos/usePendientes'
import { useIdioma } from '../i18n'
import { calcularRacha, puntosDebiles, type PuntoDebil } from '../motor/estadisticas'
import { calcular, rellenar } from '../motor/problema'
import { faseDe, type Fase } from '../motor/repaso'

const TEMAS = biblioteca.asignaturas.flatMap((a) => a.temas.map((tema) => ({ asignatura: a, tema })))
const TODAS = TEMAS.flatMap((x) => x.tema.tarjetas)
const POR_ID = new Map(TEMAS.flatMap((x) => x.tema.tarjetas.map((c) => [c.id, { tarjeta: c, ...x }] as const)))

const COLOR_FASE: Record<Fase, string> = { dominada: 'bg-emerald-600', aprendiendo: 'bg-amber-500', nueva: 'bg-slate-300 dark:bg-slate-700' }
const CLAVE_FASE: Record<Fase, string> = { dominada: 'repaso.dominadas', aprendiendo: 'repaso.aprendiendo', nueva: 'repaso.nuevas' }
const FASES: Fase[] = ['dominada', 'aprendiendo', 'nueva']

function textoPregunta(tarjeta: Tarjeta, idioma: 'ca' | 'es'): string {
  if (tarjeta.tipo !== 'problema') return elegir(tarjeta.pregunta, idioma)
  const { resultado: _, ...datos } = tarjeta.casos_prueba[0]
  return rellenar(elegir(tarjeta.enunciado, idioma), calcular(tarjeta, datos).valores)
}

function Dato({ valor, texto }: { valor: string | number; texto: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <dd className="text-3xl font-bold tabular-nums">{valor}</dd>
      <dt className="text-sm text-slate-600 dark:text-slate-400">{texto}</dt>
    </div>
  )
}

export function Progreso() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const resumen = useResumen(TODAS)
  const datos = useLiveQuery(async () => ({
    estados: await db.estados.toArray(),
    diasRepaso: (await db.revisiones.orderBy('dia').uniqueKeys()) as string[],
    examenes: await db.examenes.toArray(),
  }))

  const calculado = useMemo(() => {
    if (!datos) return null
    const estados = new Map(datos.estados.map((e) => [e.id, e]))
    const dias = new Set([...datos.diasRepaso, ...datos.examenes.map((e) => e.dia)])

    // Fallos de cada tarjeta: los del repaso más los de tests y simulacros.
    const recuento = new Map<string, PuntoDebil>()
    const sumar = (id: string, fallos: number, intentos: number) => {
      const p = recuento.get(id) ?? { id, fallos: 0, intentos: 0 }
      recuento.set(id, { id, fallos: p.fallos + fallos, intentos: p.intentos + intentos })
    }
    for (const e of datos.estados) sumar(e.id, e.fallos, e.repasos)
    for (const ex of datos.examenes) for (const r of ex.respuestas) sumar(r.tarjetaId, r.correcta ? 0 : 1, 1)

    return {
      racha: calcularRacha(dias, new Date()),
      diasTotales: dias.size,
      debiles: puntosDebiles(recuento.values()).filter((p) => POR_ID.has(p.id)),
      temas: TEMAS.map(({ asignatura, tema }) => {
        const fases: Record<Fase, number> = { nueva: 0, aprendiendo: 0, dominada: 0 }
        for (const c of tema.tarjetas) fases[faseDe(estados.get(c.id))]++
        return { asignatura, tema, fases }
      }),
    }
  }, [datos])

  if (!calculado || !resumen) return null

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t('progreso.titulo')}</h1>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Dato valor={`${calculado.racha} 🔥`} texto={t('progreso.racha', { count: calculado.racha })} />
        <Dato valor={resumen.pendientes} texto={t('progreso.paraHoy')} />
        <Dato valor={calculado.diasTotales} texto={t('progreso.diasEstudiados', { count: calculado.diasTotales })} />
      </dl>

      <h2 className="mt-7 text-lg font-bold">{t('progreso.porTema')}</h2>
      <ul aria-label={t('progreso.leyenda')} className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        {FASES.map((f) => (
          <li key={f} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-full ${COLOR_FASE[f]}`} /> {t(CLAVE_FASE[f])}
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-3">
        {calculado.temas.map(({ asignatura, tema, fases }) => (
          <li key={`${asignatura.id}/${tema.id}`}>
            <Link to={`/asignatura/${asignatura.id}/tema/${tema.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-marca-600 dark:border-slate-800 dark:bg-slate-900">
              <span className="block text-sm text-slate-600 dark:text-slate-400">{elegir(asignatura.nombre, idioma)}</span>
              <span className="font-semibold">{elegir(tema.nombre, idioma)}</span>
              <span aria-hidden="true" className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full">
                {FASES.filter((f) => fases[f] > 0).map((f) => (
                  <span key={f} className={COLOR_FASE[f]} style={{ flexGrow: fases[f] }} />
                ))}
              </span>
              <span className="mt-1 block text-sm text-slate-700 dark:text-slate-300">
                {FASES.map((f) => `${fases[f]} ${t(CLAVE_FASE[f]).toLowerCase()}`).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-7 text-lg font-bold">{t('progreso.debiles')}</h2>
      {calculado.debiles.length === 0 ? (
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t('progreso.sinDebiles')}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {calculado.debiles.map((p) => {
            const { tarjeta, asignatura, tema } = POR_ID.get(p.id)!
            return (
              <li key={p.id}>
                <Link to={`/asignatura/${asignatura.id}/tema/${tema.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-marca-600 dark:border-slate-800 dark:bg-slate-900">
                  <span className="flex flex-wrap items-center gap-2">
                    <EtiquetaTipo tipo={tarjeta.tipo} />
                    <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">{t('progreso.fallos', { count: p.fallos, intentos: p.intentos })}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-3 block">
                    <Texto>{textoPregunta(tarjeta, idioma)}</Texto>
                  </span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{elegir(tema.nombre, idioma)}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
