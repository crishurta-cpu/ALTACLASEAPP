# Altaclase Bodega — App Web

App de control financiero de Altaclase Bodega, conectada en vivo a tu Google Sheet.

## Por qué esto ya NO es un artifact de Claude

Los artifacts dentro de claude.ai tienen una política de seguridad del navegador (CSP)
que bloquea conexiones a dominios externos como `script.google.com`, sin excepción.
Por eso la app nunca pudo sincronizar estando ahí, sin importar el código.

Esta carpeta es un proyecto web normal (Vite + React). Corriendo como página web
de verdad, esa restricción no existe y el `fetch()` a tu Apps Script funciona tal cual.

## Cómo subirla GRATIS a internet (Vercel)

Necesitas una cuenta de GitHub y una de Vercel (ambas gratis, puedes crearlas con tu
mismo correo de Google).

### Paso 1 — Subir el código a GitHub

1. Entra a https://github.com/new y crea un repositorio nuevo, por ejemplo
   `altaclase-bodega`. Déjalo público o privado, no importa.
2. En tu computador, abre una terminal dentro de esta carpeta (`altaclase-web`) y
   corre, uno por uno:

```bash
git init
git add .
git commit -m "primera version"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/altaclase-bodega.git
git push -u origin main
```

(Reemplaza `TU_USUARIO` por tu usuario real de GitHub, y el nombre del repo si
le pusiste otro.)

### Paso 2 — Conectar con Vercel

1. Entra a https://vercel.com y crea cuenta con "Continue with GitHub".
2. Click en "Add New..." → "Project".
3. Busca el repositorio `altaclase-bodega` y dale "Import".
4. Vercel detecta automáticamente que es Vite. No cambies nada, solo dale "Deploy".
5. Espera ~1 minuto. Te da una URL tipo `altaclase-bodega.vercel.app`.

Esa URL ya es tu app, viva, en internet, sincronizando con tu Sheet real.

### Paso 3 — Instalarla en el celular como app

- **iPhone:** abre la URL en Safari → botón de compartir → "Agregar a pantalla de inicio".
- **Android:** abre la URL en Chrome → menú (3 puntitos) → "Instalar app" o
  "Agregar a pantalla de inicio".

Queda con ícono propio, pantalla completa, sin barra de navegador — se siente como
una app normal.

## Actualizar la app después

Cada vez que quieras cambiarle algo:

1. Edita los archivos (o pídeme a mí los cambios y yo te dejo el archivo actualizado).
2. Reemplaza `src/App.jsx` con la versión nueva.
3. En la terminal, dentro de la carpeta:

```bash
git add .
git commit -m "actualizacion"
git push
```

Vercel detecta el push automáticamente y redespliega solo, en menos de 1 minuto,
sin que tengas que volver a hacer nada en su web.

## Si algo no conecta con Sheets

1. Primero verifica que la URL de tu Apps Script (variable `API` en `src/App.jsx`)
   sea la última implementación activa.
2. Verifica que en Apps Script, "Quién tiene acceso" esté en "Cualquier usuario"
   (no "Solo yo").
3. Abre la consola del navegador (F12 → Console) en la app desplegada y mira si
   hay errores en rojo. Si dice "Failed to fetch" o un error de red, copia el
   texto completo, ya no debería ser un problema de CSP (eso solo pasaba dentro
   de Claude), así que probablemente sea la URL del script o el "quién tiene acceso".
