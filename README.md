# Lindenmere, 1924

Herramientas web del Acontecimiento «Lindenmere, 1924» del foro Avada Kedavra.

- `index.html`: portada.
- `creacion/`: asistente de creación de personaje (genera el código de la ficha de excursionista para el foro).
- `tracker/`: tracker en vivo. Lo ve cualquiera; solo la máster, con sesión iniciada, puede cambiarlo.
- `userscript/lindenmere.user.js`: userscript de Tampermonkey para pasar dados y fichas del foro al tracker.

## Cómo funciona el tracker

Los datos viven en Firestore (proyecto `appsavada`):

- `lindenmere/publico`: lo que ven los jugadores. Lectura pública, escritura solo de la máster.
- `lindenmere/privado`: todo el estado. Solo la máster lo lee y lo escribe.

El código no trae datos de la trama. La máster entra con su cuenta («Vista de máster») y, la primera vez,
carga su JSON privado con «Importar JSON». Cada cambio se guarda en los dos documentos.
La estructura del JSON está en [DATOS.md](DATOS.md) y hay un ejemplo en [datos.ejemplo.json](datos.ejemplo.json).

**Modo prueba:** `tracker/?prueba` abre la vista de máster con los datos de ejemplo, sin conectarse para guardar.

## Configurar Firebase (una sola vez)

1. Consola de Firebase, proyecto `appsavada` → **Authentication** → *Sign-in method* → activar **Correo electrónico/contraseña**.
2. **Authentication → Users → Agregar usuario**: el correo y la contraseña de la máster. Copiar su **UID**.
3. **Firestore → Reglas**: agregar los dos bloques de [firestore.rules](firestore.rules) (sin borrar las reglas de Magic Chef), con el UID del paso 2, y publicar.
