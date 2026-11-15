/** Comando "npm run validar": revisa todo el contenido y avisa de tarjetas mal escritas. */
import { fileURLToPath } from 'node:url'
import { construirBiblioteca } from '../src/contenido/biblioteca'
import type { Incidencia } from '../src/contenido/esquema'
import { validarAFondo } from '../src/contenido/validacion'
import { leerContenido } from './leer-contenido'

const carpeta = fileURLToPath(new URL('../contenido', import.meta.url))
const leido = leerContenido(carpeta)
const { biblioteca, errores: estructura } = construirBiblioteca(leido.archivos, leido.figuras)
const fondo = validarAFondo(biblioteca)

const errores = [...leido.errores, ...estructura, ...fondo.errores]
const avisos = fondo.avisos

const linea = (i: Incidencia) => `  contenido/${i.archivo}${i.tarjeta ? ` [${i.tarjeta}]` : ''}\n      ${i.mensaje}`

const tarjetas = biblioteca.asignaturas.flatMap((a) => a.temas.flatMap((t) => t.tarjetas))
const porTipo = (tipo: string) => tarjetas.filter((t) => t.tipo === tipo).length
console.log(
  `\nContenido: ${biblioteca.asignaturas.filter((a) => a.temas.length).length} asignatura(s) con contenido, ` +
    `${tarjetas.length} tarjetas (${porTipo('concepto')} concepto, ${porTipo('formula')} fórmula, ` +
    `${porTipo('test')} test, ${porTipo('problema')} problema)\n`,
)

if (avisos.length) console.log(`AVISOS (${avisos.length}) — no impiden usar la app:\n${avisos.map(linea).join('\n')}\n`)
if (errores.length) {
  console.log(`ERRORES (${errores.length}) — hay que arreglarlos:\n${errores.map(linea).join('\n')}\n`)
  process.exit(1)
}
console.log('Todo correcto: no hay errores en el contenido.\n')
