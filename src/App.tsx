import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { Marco } from './componentes/Marco'
import { erroresContenido } from './contenido/cargar'
import { Ajustes } from './pantallas/Ajustes'
import { Asignatura } from './pantallas/Asignatura'
import { ErrorContenido } from './pantallas/ErrorContenido'
import { Inicio } from './pantallas/Inicio'
import { NoEncontrado } from './pantallas/NoEncontrado'
import { Sobre } from './pantallas/Sobre'

// La pantalla de tarjetas lleva las fórmulas y la calculadora: se descarga solo al entrar en un tema.
const Repaso = lazy(() => import('./pantallas/Repaso').then((m) => ({ default: m.Repaso })))
const Tema = lazy(() => import('./pantallas/Tema').then((m) => ({ default: m.Tema })))

export function App() {
  if (erroresContenido.length > 0) return <ErrorContenido errores={erroresContenido} />
  return (
    <HashRouter>
      <Routes>
        <Route element={<Marco />}>
          <Route index element={<Inicio />} />
          <Route path="asignatura/:asignaturaId" element={<Asignatura />} />
          <Route path="asignatura/:asignaturaId/tema/:temaId" element={<Suspense fallback={null}><Tema /></Suspense>} />
          {['repaso', 'repaso/:asignaturaId', 'repaso/:asignaturaId/:temaId'].map((ruta) => (
            <Route key={ruta} path={ruta} element={<Suspense fallback={null}><Repaso /></Suspense>} />
          ))}
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
