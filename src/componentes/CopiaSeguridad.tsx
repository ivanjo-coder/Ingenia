import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { borrarProgreso, exportarProgreso, importarProgreso } from '../datos/copia'
import { diaDe } from '../motor/repaso'

const BOTON = 'min-h-11 w-full rounded-lg border-2 border-slate-300 px-3 font-semibold hover:border-marca-600 dark:border-slate-700'

/** Botones para guardar el progreso en un archivo, recuperarlo o borrarlo. */
export function CopiaSeguridad() {
  const { t } = useTranslation()
  const selector = useRef<HTMLInputElement>(null)
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null)

  const exportar = async () => {
    const url = URL.createObjectURL(new Blob([await exportarProgreso()], { type: 'application/json' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `ingenia-progreso-${diaDe(new Date())}.json`
    enlace.click()
    URL.revokeObjectURL(url)
    setMensaje({ texto: t('copia.exportado') })
  }

  const importar = async (archivo: File | undefined) => {
    if (!archivo) return
    if (!window.confirm(t('copia.confirmarImportar'))) return
    try {
      const n = await importarProgreso(await archivo.text())
      setMensaje({ texto: t('copia.importado', { count: n }) })
    } catch {
      setMensaje({ texto: t('copia.archivoMalo'), error: true })
    }
    if (selector.current) selector.current.value = ''
  }

  const borrar = async () => {
    if (!window.confirm(t('copia.confirmarBorrar'))) return
    await borrarProgreso()
    setMensaje({ texto: t('copia.borrado') })
  }

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-semibold">{t('copia.titulo')}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('copia.texto')}</p>
      <div className="mt-3 space-y-2">
        <button type="button" onClick={() => void exportar()} className={BOTON}>
          {t('copia.exportar')}
        </button>
        <button type="button" onClick={() => selector.current?.click()} className={BOTON}>
          {t('copia.importar')}
        </button>
        <input ref={selector} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void importar(e.target.files?.[0])} />
        <button type="button" onClick={() => void borrar()} className="min-h-11 w-full rounded-lg px-3 text-sm font-semibold text-rose-700 hover:underline dark:text-rose-400">
          {t('copia.borrar')}
        </button>
      </div>
      {mensaje && (
        <p role="status" className={`mt-3 text-sm font-semibold ${mensaje.error ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
          {mensaje.texto}
        </p>
      )}
    </section>
  )
}
