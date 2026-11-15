# Cómo escribir contenido

Todo el contenido está en la carpeta `contenido/`. Son archivos de texto con extensión `.yaml` que puedes abrir con el Bloc de notas (mejor con [VS Code](https://code.visualstudio.com), que colorea el texto).

Después de cualquier cambio ejecuta:

```bash
npm run validar
```

Te dirá en qué archivo y en qué tarjeta hay un fallo.

## Reglas de escritura (YAML)

1. **La sangría importa.** Lo que va "dentro" de algo se escribe con 2 espacios más a la izquierda. Usa espacios, nunca el tabulador.
2. **Nunca uses comillas dobles `"`** alrededor de un texto: rompen las fórmulas.
3. Si un texto es largo, o contiene dos puntos seguidos de espacio (`: `) o una almohadilla (`#`), escríbelo así, con `>-` y el texto debajo:

   ```yaml
   es: >-
     Aquí puedes escribir lo que quieras: dos puntos, símbolos, varias
     líneas… Se junta todo en un solo párrafo.
   ```
4. Las líneas que empiezan por `#` son notas para ti; la app las ignora.
5. Cada texto va en los dos idiomas: `es:` (castellano) y `ca:` (catalán). Si falta uno, la app muestra el otro y el validador te avisa.

## Fórmulas

Las fórmulas se escriben en LaTeX entre símbolos de dólar: `$E = \rho g V$`. Con doble dólar, `$$...$$`, la fórmula sale centrada en su propia línea.

Los decimales dentro de una fórmula se escriben `9{,}81` (para que la coma no deje un hueco raro).

## Añadir una asignatura

1. En `contenido/asignaturas.yaml` añade o edita su entrada. `estado: proximamente` la muestra en gris; `estado: disponible` la abre.
2. Crea una carpeta con el mismo `id` y dentro un archivo `asignatura.yaml` con la lista de temas.

## Añadir un tema

1. En `contenido/<asignatura>/asignatura.yaml` añade el tema a la lista:

   ```yaml
   temas:
     - id: fluidos
       nombre: { ca: Fluids, es: Fluidos }
   ```
2. Crea el archivo `contenido/<asignatura>/fluidos.yaml` (mismo nombre que el `id`). Dentro van las tarjetas, una detrás de otra, cada una empezando por `- id:`.

## Lo que tienen todas las tarjetas

| Campo | Obligatorio | Qué es |
| --- | --- | --- |
| `id` | sí | Nombre único: minúsculas, números y guiones. Ej.: `fis-flu-c01`. **No lo cambies después**: el progreso de los estudiantes va ligado a él |
| `tipo` | sí | `concepto`, `formula`, `test` o `problema` |
| `revisar: true` | no | Marca la tarjeta como dudosa |
| `figura` | no | Imagen en la pregunta y/o la respuesta (ver abajo) |

## Tipo 1: concepto

```yaml
- id: fis-flu-c01
  tipo: concepto
  pregunta:
    es: ¿Qué dice el principio de Arquímedes?
    ca: Què diu el principi d'Arquimedes?
  respuesta:
    es: >-
      Todo cuerpo sumergido recibe un empuje hacia arriba igual al peso
      del fluido que desaloja: $E = \rho_f \, g \, V_{sum}$.
    ca: >-
      Tot cos submergit rep una empenta cap amunt igual al pes
      del fluid que desallotja: $E = \rho_f \, g \, V_{sub}$.
```

## Tipo 2: fórmula

`expresion` y `simbolo` van en LaTeX **sin** los dólares.

```yaml
- id: fis-flu-f01
  tipo: formula
  pregunta:
    es: ¿Cuál es la expresión de la presión a una profundidad $h$?
    ca: Quina és l'expressió de la pressió a una profunditat $h$?
  expresion: p = p_0 + \rho \, g \, h
  simbolos:
    - simbolo: p_0
      significado: { es: presión en la superficie, ca: pressió a la superfície }
      unidad: Pa
    - simbolo: \rho
      significado: { es: densidad del líquido, ca: densitat del líquid }
      unidad: kg/m³
  nota:                       # opcional
    es: Solo vale para líquidos en reposo.
    ca: Només val per a líquids en repòs.
```

## Tipo 3: test

Tres o cuatro opciones, **exactamente una** con `correcta: true`, y todas con su `explicacion`.

```yaml
- id: fis-flu-t02
  tipo: test
  pregunta:
    es: Una tubería horizontal se estrecha. ¿Qué le pasa a la presión en el estrechamiento?
    ca: Una canonada horitzontal s'estreny. Què li passa a la pressió a l'estrenyiment?
  opciones:
    - texto: { es: Disminuye., ca: Disminueix. }
      correcta: true
      explicacion:
        es: La velocidad aumenta y, por Bernoulli, la presión baja.
        ca: La velocitat augmenta i, per Bernoulli, la pressió baixa.
    - texto: { es: Aumenta., ca: Augmenta. }
      explicacion:
        es: Es al revés.
        ca: És al revés.
    - texto: { es: No cambia., ca: No canvia. }
      explicacion:
        es: Solo si la velocidad no cambiara.
        ca: Només si la velocitat no canviés.
```

## Tipo 4: problema paramétrico

```yaml
- id: fis-flu-p02
  tipo: problema
  enunciado:
    es: >-
      Por una tubería de {d1} mm de diámetro circula agua a {v1} m/s. Se estrecha
      hasta {d2} mm. Calcula la velocidad en el tramo estrecho.
    ca: >-
      Per una canonada de {d1} mm de diàmetre circula aigua a {v1} m/s. S'estreny
      fins a {d2} mm. Calcula la velocitat al tram estret.
  variables:
    d1: { min: 60, max: 200, paso: 20 }     # saldrá 60, 80, 100… 200
    d2: { min: 20, max: 100, paso: 10 }
    v1: { min: 0.5, max: 3, paso: 0.5 }
  condiciones:                               # opcional
    - d2 < d1
    - v1 * (d1 / d2)^2 <= 20
  intermedios:                               # opcional, se calculan en orden
    razon: d1 / d2
  respuesta:
    expresion: v1 * razon^2
    unidad: m/s
    tolerancia_relativa: 0.01                # 1 %
  resolucion:
    es:
      - Relación de diámetros $d_1 / d_2$ = {razon}
      - Velocidad $v_2 = \val{v1} \cdot \val{razon}^2$ = {resultado} m/s
    ca:
      - Relació de diàmetres $d_1 / d_2$ = {razon}
      - Velocitat $v_2 = \val{v1} \cdot \val{razon}^2$ = {resultado} m/s
  casos_prueba:
    - { d1: 100, d2: 50, v1: 2, resultado: 8 }
```

Cómo funciona cada parte:

- **`variables`**: cada una sale al azar entre `min` y `max`, de `paso` en `paso`.
- **`condiciones`**: si los datos sorteados no las cumplen, se sortean otros. Sirven para evitar combinaciones absurdas.
- **`intermedios`**: cálculos previos. Cada uno puede usar las variables y los intermedios anteriores.
- **`respuesta.expresion`**: la cuenta final. Operaciones: `+ - * / ^`, paréntesis, `pi`, `sqrt()`, `sin()`, `cos()`, `tan()`, `log()` (neperiano), `log10()`, `exp()`, `abs()`. Los ángulos van en radianes.
- **Tolerancia**: `tolerancia_relativa` (0.01 = 1 %) y/o `tolerancia_absoluta` (útil si el resultado puede ser 0). Si no pones ninguna, 1 %.
- **`respuesta.decimales`** (opcional): decimales con que se muestra el resultado. Si falta, 5 cifras significativas.
- **`casos_prueba`**: al menos un caso **resuelto a mano**, con el valor de cada variable y el `resultado`. El validador comprueba que la expresión da lo mismo.

### Cómo poner los números en el texto

| Dónde | Se escribe | Ejemplo |
| --- | --- | --- |
| En texto normal | `{nombre}` | `Diámetro de {d1} mm` |
| Dentro de una fórmula `$...$` | `\val{nombre}` | `$v_2 = \val{v1} \cdot 4$` |

Dentro de las fórmulas las llaves `{}` son de LaTeX, por eso ahí hace falta `\val`. Puedes usar cualquier variable, cualquier intermedio y `resultado`.

Un paso de la resolución no puede contener `: ` (dos puntos y espacio). Si lo necesitas, usa la forma `>-` de la regla 3.

## Figuras

Guarda la imagen (mejor SVG; también PNG o JPG) en `contenido/<asignatura>/figuras/` y añade a la tarjeta:

```yaml
  figura:
    pregunta: estrechamiento.svg      # sale con la pregunta
    respuesta: solucion.svg           # sale con la respuesta (opcional)
    alt:                              # descripción para quien no ve la imagen
      es: Tubería que se estrecha.
      ca: Canonada que s'estreny.
```

## Normas del contenido

- Redacta con tus palabras y con problemas originales. No copies apuntes, diapositivas ni exámenes.
- Sistema Internacional y notación habitual.
- Si dudas de una tarjeta, ponle `revisar: true`. Mejor pocas tarjetas correctas que muchas dudosas.
