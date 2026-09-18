# ✅ CHECKLIST DE VALIDACIÓN — FASE 23 (Deploy)

> Este archivo lo ejecuta una persona, en el navegador, contra la app real con login de producción. No es algo que Claude pueda correr de forma autónoma (requiere las credenciales del negocio y una acción de deploy que afecta la app en vivo).

## 1. Verificación automática (ya hecha en Fase 22, repetir antes de dar el visto bueno)

```bash
npm run build     # debe terminar sin errores ni warnings
npm run lint      # debe salir con 0 errores (exit code 0)
npm test          # 36 tests deben pasar
npm run test:coverage   # ≥80% en parsers.js, http.js y los 3 hooks testeados en Fase 20
```

## 2. Smoke test manual (login real)

Login:
- [ ] Entrar con la clave real. Sesión queda activa.
- [ ] Refrescar la página — sigue autenticado (localStorage).
- [ ] Esperar el timeout de inactividad (3 min sin tocar nada) — cierra sesión sola.

Home:
- [ ] Carga el mes en curso: ventas, ganancia, gastos, ahorro, utilidad, margen.
- [ ] Top 5 clientes del mes se ve correcto (medallas, ⚠️ si alguien debe >$1.000.000).
- [ ] Gráfico de ganancia diaria se ve.
- [ ] Acordeón "Deben cobrar" abre/cierra y lista clientes con deuda.
- [ ] Acordeón "Últimos gastos" abre/cierra.
- [ ] Botón de sync manual (⟳) recarga y muestra el toast "✓ N ingresos · M gastos".

Nuevo movimiento (FAB +):
- [ ] Crear un **ingreso individual** — se guarda en Sheets (verificar la fila en INGRESOS).
- [ ] Crear un **ingreso por lote** (2+ filas) — cada fila se guarda como fila independiente y correcta en INGRESOS (este es el flujo que tenía el bug corregido en Fase 19 — **verificar con especial atención** que las columnas queden en el orden correcto, no como un objeto serializado).
- [ ] En el lote, probar el autocompletado de Cliente (nuevo en Fase 22) y confirmar que el campo Proveedor guarda lo escrito (typo corregido en Fase 22).
- [ ] Crear un **gasto** — se guarda en Sheets.

Clientes:
- [ ] Lista de clientes carga, con filtro por letra y búsqueda por texto.
- [ ] Abrir el detalle de un cliente: historial de compras, stats, deuda.
- [ ] Swipe izquierda/derecha en una venta cambia el estado "debe" (verificar en Sheets).
- [ ] Tap en una venta abre el editor.
- [ ] Registrar un abono — se refleja en la columna F de CLIENTES.
- [ ] "Marcar pagado" en el panel de deuda — actualiza las filas de INGRESOS correspondientes.
- [ ] Reporte WhatsApp de un cliente con deuda — copia el texto al portapapeles.

Historial:
- [ ] Acordeón por mes abre/cierra, con stats correctos.
- [ ] Tabs Ingresos/Gastos, búsqueda, filtro por categoría, orden por fecha/monto.
- [ ] Gráfico circular de categorías de gasto se ve.
- [ ] Editar/borrar un ingreso o gasto desde el historial.

Más:
- [ ] **Buscar**: búsqueda global con 2+ caracteres, resultados de ingresos y gastos, click abre el editor.
- [ ] **Tareas**: crear tarea, verla en la lista, eliminarla.
- [ ] **Inventario**: agregar item, editarlo, borrarlo (confirmación en 2 pasos).
- [ ] **Personal** (Deuda Valen): agregar movimiento, ver saldo actualizado, editar/borrar.
- [ ] **Config**: cambiar color de acento (se refleja en toda la app), cerrar sesión (ya no debería recargar la página completa — arreglado en Fase 16).

Responsive:
- [ ] Mobile (~390px): nav inferior, FAB flotante, sidebar oculto.
- [ ] Desktop (≥768px): sidebar fijo, sin nav inferior, layout de 2 columnas en Home.

Red / resiliencia (Fase 18):
- [ ] Simular red lenta (DevTools → Network → Slow 3G) y confirmar que una lectura reintenta una vez si falla, y que una escritura (crear ingreso) NO se duplica si tarda.

## 3. Si todo lo anterior pasa

```bash
git tag -a v2.0-post-refactor -m "Refactor completo: App.jsx monolítico -> arquitectura por features"
git push origin v2.0-post-refactor
```

Luego el deploy a Vercel (automático en push a `main`, o manual con `vercel --prod` si se prefiere controlarlo).

## 4. Si algo falla

Anotar el fallo en una nueva entrada de `docs/REFACTOR_CHANGELOG.md` (Sesión siguiente, Fase 23 con estado ⚠️ o ❌) antes de taggear. No taggear `v2.0-post-refactor` sobre una regresión conocida.
