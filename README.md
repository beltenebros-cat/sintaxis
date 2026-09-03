# Sintaxis

Web personal para organizar y consultar material de Lengua y Literatura
Castellanas (ESO y Bachillerato). Es un sitio estático publicado con
GitHub Pages: no depende de ningún asistente de IA para subir documentos
ni para actualizarse.

## Cómo funciona

- Los archivos viven en `materiales/<curso>/<bloque>/<tipo>/archivo.ext`.
- Cada vez que se hace push a `main`, una GitHub Action
  (`.github/workflows/deploy.yml`) escanea `materiales/`, regenera
  `data/manifest.json` y publica la web en GitHub Pages automáticamente.
- La portada (`index.html`) lee ese manifiesto y construye el índice con
  buscador y filtros por curso, bloque temático y tipo de recurso.
- No hay que editar ningún índice a mano: basta con que el archivo esté
  en la carpeta correcta.

## Dos formas de subir material (sin usar la IA)

1. **Directamente en GitHub, desde el navegador**: entra en la carpeta
   `materiales/<curso>/<bloque>/<tipo>/` en la web de GitHub → *Add
   file* → *Upload files* → arrastra el documento → *Commit changes*.
   Puedes escribir una ruta nueva si la carpeta no existe todavía; GitHub
   la crea sola. Ver `materiales/README.md` para la lista de nombres de
   carpeta válidos.

2. **Panel de administración** en `/admin`: un formulario con
   desplegables (curso, bloque, tipo) y selector de archivo que sube el
   documento directamente al repositorio usando un token personal de
   GitHub que solo se guarda en tu navegador. Instrucciones para crear el
   token dentro del propio panel.

En ambos casos, el archivo llega al repositorio de la misma forma (un
commit en la ruta correcta) y la Action se encarga del resto.

## Puesta en marcha (una sola vez)

1. En **Settings → Pages** del repositorio, en "Build and deployment",
   selecciona **Source: GitHub Actions**.
2. Haz merge/push de este contenido a la rama `main`.
3. La Action se ejecutará sola y publicará la web en la URL que GitHub
   Pages indique en Settings → Pages.

## Estructura del repositorio

```
index.html                  Portada con buscador y filtros
admin/index.html            Panel de subida (usa un token de GitHub)
assets/css/style.css        Estilos
assets/js/site.js           Lógica de la portada
assets/js/admin.js          Lógica de subida del panel admin
data/manifest.json          Índice generado automáticamente (no editar a mano)
materiales/                 Los documentos, organizados por curso/bloque/tipo
scripts/generate-manifest.mjs  Script que genera data/manifest.json
.github/workflows/deploy.yml   Regenera el índice y publica en Pages
```

## Desarrollo local

No hace falta ningún framework ni instalación. Para ver los cambios:

```bash
node scripts/generate-manifest.mjs   # regenera data/manifest.json
python3 -m http.server 8000          # o cualquier servidor estático
```

Y abre `http://localhost:8000`.
