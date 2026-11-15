import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { Aviso, Volver } from '../componentes/Marco'
import { TarjetaEstudio, type Resultado } from '../componentes/TarjetaEstudio'
import { biblioteca } from '../contenido/cargar'
import { elegir } from '../contenido/texto'
import { useNuevasPorDia } from '../datos/ajustes'
import { guardarRespuesta, leerEstados, nuevasEmpezadas } from '../datos/db'
import { useIdioma } from '../i18n'
import {
  construirCola,
  diaDe,
  estadoNuevo,
  intervaloCorto,
  NOTAS,
  proximasFechas,
  vuelveEnEstaSesion,
  type EstadoTarjeta,
  type Nota,
} from '../motor/repaso'
import { NoEncontrado } from './NoEncontrado'

const ESTILO_NOTA: Record<Nota, string> = {
  1: 'border-rose-600 text-rose-800 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/50',
  2: 'border-amber-600 text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/50',
  3: 'border-emerald-600 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
  4: 'border-sky-600 text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/50',
}

/** Notas que se pueden poner según cómo haya ido la tarjeta. */
function notasPosibles(r: Resultado): Nota[] {
  if (r === 'fallo') return [1]
  if (r === 'acierto') return [2, 3, 4]
  return NOTAS
}

export function Repaso() {
  const { t } = useTranslation()
  const idioma = useIdioma()
  const { asignaturaId, temaId } = useParams()
  const nuevasPorDia = useNuevasPorDia()

  // Tarjetas que entran en esta sesión: un tema, una asignatura o todo.
  const { tarjetas, asignaturaDe, volver, titulo, existe } = useMemo(() => {
    const asignaturas = biblioteca.asignaturas.filter((a) => !asignaturaId || a.id === asignaturaId)
    const asignatura = asignaturaId ? asignaturas[0] : undefined
    const tema = temaId ? asignatura?.temas.find((x) => x.id === temaId) : undefined
    const asignaturaDe = new Map<string, string>()
    const tarjetas = asignaturas.flatMap((a) =>
      a.temas
        .filter((x) => !temaId || x.id === temaId)
        .flatMap((x) => {
          x.tarjetas.forEach((c) => asignaturaDe.set(c.id, a.id))
          return x.tarjetas
        }),
    )
    return {
      tarjetas,
      asignaturaDe,
      existe: (!asignaturaId || !!asignatura) && (!temaId || !!tema),
      volver: tema ? `/asignatura/${asignaturaId}/tema/${temaId}` : asignatura ? `/asignatura/${asignaturaId}` : '/',
      titulo: tema ? elegir(tema.nombre, idioma) : asignatura ? elegir(asignatura.nombre, idioma) : t('repaso.todo'),
    }
  }, [asignaturaId, temaId, idioma, t])

  const porId = useMemo(() => new Map(tarjetas.map((c) => [c.id, c])), [tarjetas])
  const estados = useRef(new Map<string, EstadoTarjeta>())
  const [cola, setCola] = useState<string[] | null>(null)
  const [posicion, setPosicion] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [hechas, setHechas] = useState(0)
  const [quedanNuevas, setQuedanNuevas] = useState(false)

  const preparar = useCallback(
    async (sinCupo: boolean) => {
      const leidos = await leerEstados()
      const empezadas = sinCupo ? 0 : await nuevasEmpezadas(diaDe(new Date()))
      const ids = tarjetas.map((c) => c.id)
      const { repasos, nuevas } = construirCola(ids, leidos, new Date(), Math.max(0, nuevasPorDia - empezadas))
      estados.current = leidos
      setQuedanNuevas(ids.filter((id) => !leidos.has(id)).length > nuevas.length)
      setCola([...repasos, ...nuevas])
      setPosicion(0)
      setResultado(null)
    },
    [tarjetas, nuevasPorDia],
  )

  // La cola se prepara una sola vez al entrar (no cambia aunque se guarden respuestas).
  const preparada = useRef(false)
  useEffect(() => {
    if (preparada.current) return
    preparada.current = true
    void preparar(false)
  }, [preparar])

  const id = cola?.[posicion]
  const tarjeta = id ? porId.get(id) : undefined

  const puntuar = useCallback(
    async (nota: Nota) => {
      if (!id || !resultado || !notasPosibles(resultado).includes(nota)) return
      const nuevo = await guardarRespuesta(id, nota)
      estados.current.set(id, nuevo)
      // Si toca volver a verla en pocos minutos, se pone al final de esta misma sesión.
      if (vuelveEnEstaSesion(nuevo, new Date())) setCola((c) => [...(c ?? []), id])
      setHechas((n) => n + 1)
      setResultado(null)
      setPosicion((p) => p + 1)
      window.scrollTo(0, 0)
    },
    [id, resultado],
  )

  // Atajos de teclado: 1 a 4 para poner nota.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (['1', '2', '3', '4'].includes(e.key)) void puntuar(Number(e.key) as Nota)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [puntuar])

  if (!existe) return <NoEncontrado />
  if (!cola) return null

  const ahora = new Date()
  const fechas = id && resultado ? proximasFechas(estados.current.get(id) ?? estadoNuevo(id, ahora), ahora) : null

  return (
    <>
      <Volver a={volver} texto={titulo} />

      {tarjeta ? (
        <>
          <div className="mb-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label={t('repaso.progreso')}
              aria-valuemin={0}
              aria-valuemax={cola.length}
              aria-valuenow={posicion}
              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            >
              <div className="h-full rounded-full bg-marca-600 transition-all" style={{ width: `${(posicion / cola.length) * 100}%` }} />
            </div>
            <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400">{t('repaso.quedan', { count: cola.length - posicion })}</span>
          </div>

          <TarjetaEstudio key={`${posicion}-${tarjeta.id}`} tarjeta={tarjeta} asignaturaId={asignaturaDe.get(tarjeta.id)!} onRevelar={setResultado} />

          {resultado && fechas && (
            <div className="mt-4">
              <p className="mb-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t(resultado === 'visto' ? 'repaso.comoHaIdo' : resultado === 'acierto' ? 'repaso.comoHaCostado' : 'repaso.volvera')}
              </p>
              <div className="flex gap-2">
                {notasPosibles(resultado).map((nota) => {
                  const { n, unidad } = intervaloCorto(ahora, fechas[nota])
                  return (
                    <button
                      key={nota}
                      type="button"
                      onClick={() => void puntuar(nota)}
                      className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-xl border-2 bg-white px-1 font-semibold dark:bg-slate-900 ${ESTILO_NOTA[nota]}`}
                    >
                      <span>{t(`nota.${nota}`)}</span>
                      <span className="text-xs font-normal opacity-80">{t(`intervalo.${unidad}`, { count: n })}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <Aviso />
        </>
      ) : (
        <div className="py-10 text-center">
          <p aria-hidden="true" className="text-5xl">{hechas > 0 ? '🎉' : '✅'}</p>
          <h1 className="mt-3 text-2xl font-bold">{t(hechas > 0 ? 'repaso.terminado' : 'repaso.nadaPendiente')}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {hechas > 0 ? t('repaso.respuestas', { count: hechas }) : t('repaso.nadaPendienteTexto')}
          </p>
          <div className="mx-auto mt-6 max-w-xs space-y-2">
            {quedanNuevas && (
              <button type="button" onClick={() => void preparar(true)} className="min-h-12 w-full rounded-xl border-2 border-marca-700 font-semibold text-marca-800 hover:bg-marca-50 dark:text-marca-300 dark:hover:bg-marca-900/40">
                {t('repaso.masNuevas')}
              </button>
            )}
            <Link to={volver} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-marca-700 font-semibold text-white hover:bg-marca-800">
              {t('volver')}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
