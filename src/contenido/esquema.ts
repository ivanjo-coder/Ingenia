import { z } from 'zod'

z.config(z.locales.es())

/** Identificadores: minúsculas, números y guiones. Ej.: fis-flu-p01 */
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'solo minúsculas, números y guiones (ej.: fis-flu-p01)')

/** Texto en catalán y/o castellano. Tiene que estar al menos uno. */
export const textoSchema = z
  .strictObject({ ca: z.string().min(1).optional(), es: z.string().min(1).optional() })
  .refine((t) => t.ca || t.es, 'hace falta el texto en al menos un idioma (ca o es)')

const pasosSchema = z
  .strictObject({ ca: z.array(z.string().min(1)).min(1).optional(), es: z.array(z.string().min(1)).min(1).optional() })
  .refine((t) => t.ca || t.es, 'hace falta la resolución en al menos un idioma (ca o es)')

const comun = {
  id,
  /** true = tarjeta dudosa, pendiente de que alguien la compruebe. */
  revisar: z.boolean().optional(),
  /** Nombre de archivo dentro de la carpeta figuras/ de la asignatura. */
  figura: z
    .strictObject({ pregunta: z.string().optional(), respuesta: z.string().optional(), alt: textoSchema.optional() })
    .optional(),
}

const conceptoSchema = z.strictObject({
  ...comun,
  tipo: z.literal('concepto'),
  pregunta: textoSchema,
  respuesta: textoSchema,
})

const formulaSchema = z.strictObject({
  ...comun,
  tipo: z.literal('formula'),
  pregunta: textoSchema,
  /** La fórmula en LaTeX, sin los símbolos $. */
  expresion: z.string().min(1),
  simbolos: z
    .array(z.strictObject({ simbolo: z.string().min(1), significado: textoSchema, unidad: z.string().optional() }))
    .min(1),
  nota: textoSchema.optional(),
})

const testSchema = z.strictObject({
  ...comun,
  tipo: z.literal('test'),
  pregunta: textoSchema,
  opciones: z
    .array(z.strictObject({ texto: textoSchema, correcta: z.boolean().optional(), explicacion: textoSchema }))
    .min(3)
    .max(4)
    .refine((ops) => ops.filter((o) => o.correcta).length === 1, 'tiene que haber exactamente una opción con "correcta: true"'),
})

const nombreVariable = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'nombre de variable no válido (letras, números y _)')

const problemaSchema = z.strictObject({
  ...comun,
  tipo: z.literal('problema'),
  enunciado: textoSchema,
  variables: z.record(
    nombreVariable,
    z
      .strictObject({ min: z.number(), max: z.number(), paso: z.number().positive() })
      .refine((v) => v.max >= v.min, 'max no puede ser menor que min'),
  ),
  /** Cálculos intermedios, en orden: cada uno puede usar las variables y los anteriores. */
  intermedios: z.record(nombreVariable, z.string().min(1)).optional(),
  /** Condiciones que deben cumplir los datos sorteados (ej.: "d2 < d1"). */
  condiciones: z.array(z.string().min(1)).optional(),
  respuesta: z.strictObject({
    expresion: z.string().min(1),
    unidad: z.string(),
    tolerancia_relativa: z.number().positive().max(0.5).optional(),
    tolerancia_absoluta: z.number().positive().optional(),
    /** Decimales con los que se muestra el resultado. Si falta, 5 cifras significativas. */
    decimales: z.number().int().min(0).max(8).optional(),
  }),
  resolucion: pasosSchema,
  /** Casos resueltos a mano: valores de las variables y el resultado esperado. */
  casos_prueba: z.array(z.record(z.string(), z.number())).min(1),
})

export const tarjetaSchema = z.discriminatedUnion('tipo', [conceptoSchema, formulaSchema, testSchema, problemaSchema])
export const temaArchivoSchema = z.array(tarjetaSchema).min(1)

export const asignaturasArchivoSchema = z
  .array(z.strictObject({ id, nombre: textoSchema, estado: z.enum(['disponible', 'proximamente']) }))
  .min(1)

export const asignaturaArchivoSchema = z.strictObject({
  temas: z.array(z.strictObject({ id, nombre: textoSchema })).min(1),
})

export type Idioma = 'ca' | 'es'
export type TextoBilingue = z.infer<typeof textoSchema>
export type Tarjeta = z.infer<typeof tarjetaSchema>
export type TipoTarjeta = Tarjeta['tipo']
export type TarjetaConcepto = z.infer<typeof conceptoSchema>
export type TarjetaFormula = z.infer<typeof formulaSchema>
export type TarjetaTest = z.infer<typeof testSchema>
export type TarjetaProblema = z.infer<typeof problemaSchema>

export interface Tema {
  id: string
  nombre: TextoBilingue
  tarjetas: Tarjeta[]
}
export interface Asignatura {
  id: string
  nombre: TextoBilingue
  estado: 'disponible' | 'proximamente'
  temas: Tema[]
}
export interface Biblioteca {
  asignaturas: Asignatura[]
}

/** Aviso o error encontrado en el contenido. */
export interface Incidencia {
  archivo: string
  tarjeta?: string
  mensaje: string
}
