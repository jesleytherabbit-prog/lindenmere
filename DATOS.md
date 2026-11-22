# Estructura de los datos del tracker

El tracker guarda **un solo objeto** con todo el estado. Es el mismo formato en los tres lugares:

- `lindenmere/privado` en Firestore (solo la máster lo lee);
- el botón «Exportar JSON» / «Importar JSON» de la vista de máster;
- `datos.ejemplo.json` (ejemplo sin trama real, se puede ver con `tracker/?prueba`).

A partir de ese objeto, el tracker arma solo la versión pública (`lindenmere/publico`), que
**no** incluye: lugares ocultos, nombre y descripción de lugares con niebla, pistas sin revelar,
vecinos ocultos, tiradas privadas o sin revisar, `trama`, el Desgaste exacto, `privado` ni
`memoriaPendiente` de los personajes.

Los archivos con la trama real se nombran `*.privado.json` para que git los ignore.

## Campos

### `estado`
| Campo | Tipo | Qué es |
|---|---|---|
| `repeticion` | número ≥ 1 | Número de repetición del día (se ve en la cabecera). |
| `franja` | 0, 1, 2 | 0 Mañana, 1 Tarde, 2 Medianoche. |
| `desgaste` | 0 a 20 | Exacto, solo máster. Los jugadores solo ven la niebla del mapa, en 5 niveles. |
| `revelacion` | sí/no | Muestra, intermitente, el mapa alternativo. |

### `lugares[]`
| Campo | Qué es |
|---|---|
| `id` | `l1` a `l9`. No cambiar: las posiciones del mapa dependen de esto. |
| `x`, `y`, `r` | Posición (en % del mapa) y tamaño de la nube. |
| `estado` | `oculto` (no aparece), `niebla` (punto sin nombre), `despejado` (se ve todo). |
| `nombre`, `desc` | Solo llegan a los jugadores cuando el lugar está `despejado`. |

### `pjs[]` (máximo 9)
| Campo | Qué es |
|---|---|
| `id` | Identificador interno (lo crea el tracker). |
| `nombre`, `lema`, `retrato`, `grupo`, `color`, `ficha` | Identidad. `retrato` y `ficha` son enlaces. `color` se toma del grupo. |
| `lugar` | `id` del lugar donde está ahora. |
| `arraigo` | 0 a 10, visible para el jugador. |
| `pa`, `heridas`, `pociones`, `rituales` | `[actual, máximo]`. Inconsciente cuando `heridas[0]` llega a `heridas[1]`. |
| `pd` | `[usados, total]` de Puntos de Destino. |
| `inventario[]` | `{t: nombre, d: descripción, img: enlace de Imgur, i: icono, ancla: sí/no}`. Hasta 6. |
| `encargos[]` | `{t: encargo, r: recompensa, usado: sí/no}`. |
| `pistas[]`, `olvidadas[]` | Claves de `pistas` que conoce y las que olvidó. |
| `memoriaPendiente` | Solo máster. Lo marca el botón Medianoche. |
| `privado` | Solo máster: `porque`, `recuerdo`, `miedo`, `canto`, `aventuras`, `fechas`, `notas`. |

Iconos posibles en `i`: `reloj`, `camara`, `foto`, `libreta`, `prismaticos`, `varita`, `bolsa`, `billete`, `caja`, `otro`.

### `pistas{}`
Clave → `{t: texto, lugar: id de lugar, dia: número, revelada: sí/no}`. Solo las reveladas llegan a los jugadores.

### `vecinos[]`
`{id, nombre, rol, paso: 0 a 3, visible: sí/no}`. `paso` es el hilo: 1 déjà vu, 2 confianza, 3 recuerda.

### `registro[]`
`{turno: texto, tiradas: [...]}`. Cada tirada:
`{pj, acc, atr: {n, v}, hab: {n, v}, mod, d, dif, privada}`. El resultado y los grados se calculan solos.
Las que llegan del foro traen además `revisar: true`, `pid`, `url` (no las ven los jugadores hasta que las guardes).

### `trama` (solo máster)
| Campo | Qué es |
|---|---|
| `indicadores[]` | `{id, nombre, opciones: [...], valor}`. Aparecen como selectores en el panel de máster. |
| `finales[]` | `{nombre, requisitos: [...]}`. Un final aparece como disponible si cumple todos sus requisitos. |
| `memoria` | `{texto, base}`. Si existe, la ficha muestra la dificultad de la tirada de medianoche: `base + Arraigo`. |
| `notas` | Texto libre que se muestra en el panel de máster. |

Requisitos posibles:
- `{"tipo": "indicador", "id": "...", "min": n}`: el indicador tiene que estar en la opción `n` o más.
- `{"tipo": "despiertos", "min": n}`: al menos `n` vecinos con el hilo en 3.
