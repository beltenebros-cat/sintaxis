# Cómo añadir materiales

Cada archivo va dentro de una ruta con esta forma:

```
materiales/<curso>/<bloque>/<tipo>/nombre-del-archivo.ext
```

La web genera el índice automáticamente a partir de esta estructura de
carpetas, así que **no hace falta editar nada más**: basta con subir el
archivo en la carpeta correcta (desde la web de GitHub o desde el panel
`/admin`) y la página se actualiza sola en un par de minutos.

## Cursos válidos

- `1-eso`, `2-eso`, `3-eso`, `4-eso`
- `1-bach`, `2-bach`

## Bloques temáticos válidos

- `gramatica` — Gramática
- `literatura` — Literatura
- `comentario-texto` — Comentario de texto
- `ortografia` — Ortografía
- `lecturas` — Lecturas
- `expresion-escrita` — Expresión escrita
- `otros` — Otros

## Tipos de recurso válidos

- `apuntes`
- `ejercicios`
- `examenes`
- `presentaciones`
- `otros`

## Ejemplo

Un examen de sintaxis de 3º ESO se guardaría en:

```
materiales/3-eso/gramatica/examenes/examen-sintaxis-tema-4.pdf
```

## Contenido escrito (recomendado)

En vez de subir un PDF, se recomienda escribir el material directamente
desde el panel `/admin`, pestaña "Escribir contenido". Esto genera un
archivo `.md` (texto con formato sencillo) en la carpeta correcta, y la
web lo muestra como una página normal — sin descargas — que se actualiza
para todo el mundo en cuanto se publica.

Si subes un archivo a una carpeta con un nombre que no está en las listas
de arriba, la web lo clasificará igualmente en "Otros" dentro de ese
curso, así que nunca se pierde ni da error — pero para mantener el
buscador y los filtros ordenados, intenta usar siempre estos nombres de
carpeta exactos.

Puedes crear las subcarpetas que falten directamente al subir un archivo:
tanto en la web de GitHub como en el panel `/admin` se pueden escribir
rutas nuevas y GitHub las crea solas.
