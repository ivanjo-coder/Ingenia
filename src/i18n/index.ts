import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import type { Idioma } from '../contenido/esquema'
import ca from './ca.json'
import es from './es.json'

const CLAVE = 'idioma'

/** Idioma guardado; si no hay, el del dispositivo; y si no es ninguno de los dos, catalán. */
export function idiomaInicial(guardado: string | null, delDispositivo: readonly string[]): Idioma {
  if (guardado === 'ca' || guardado === 'es') return guardado
  for (const l of delDispositivo) {
    const codigo = l.toLowerCase().slice(0, 2)
    if (codigo === 'ca' || codigo === 'es') return codigo
  }
  return 'ca'
}

function leerGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

const inicial = idiomaInicial(leerGuardado(), typeof navigator === 'undefined' ? [] : navigator.languages)

void i18n.use(initReactI18next).init({
  resources: { ca: { translation: ca }, es: { translation: es } },
  lng: inicial,
  fallbackLng: 'ca',
  interpolation: { escapeValue: false },
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = inicial
  i18n.on('languageChanged', (l) => (document.documentElement.lang = l))
}

export function cambiarIdioma(idioma: Idioma) {
  try {
    localStorage.setItem(CLAVE, idioma)
  } catch {
    // Sin almacenamiento (modo privado): el cambio vale solo para esta visita.
  }
  void i18n.changeLanguage(idioma)
}

/** Idioma actual de la interfaz y del contenido. */
export function useIdioma(): Idioma {
  const { i18n: instancia } = useTranslation()
  return instancia.language === 'es' ? 'es' : 'ca'
}

export default i18n
