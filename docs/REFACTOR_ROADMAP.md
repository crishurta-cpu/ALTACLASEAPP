# 🗺️ MAPA DE RUTA — REFACTORIZACIÓN ALTACLASE BODEGA

> **Propósito:** Este es el **índice vivo** de toda la refactorización. Cada fase tiene su ID, su objetivo puntual, su checklist de验收 y su estado actual. Si una sesión nueva pierde contexto, **lee este archivo primero** y sabrás exactamente dónde quedaste.
>
> **Regla de oro:** Antes de empezar CUALQUIER fase, este archivo debe estar actualizado. Después de terminar CUALQUIER fase, este archivo + `REFACTOR_CHANGELOG.md` deben quedar sincronizados.

---

## 📊 ESTADO GLOBAL

| Métrica | Valor |
|---|---|
| Fase actual | **15 — Refactorizar feature Tareas** ✅ |
| Última fase completada | **15 — Refactorizar feature Tareas** |
| Próxima fase | **16 — Introducir Context API** |
| Estado | 🟢 **Fase 15 lista. Esperando autorización para Fase 16** |

### Fase 0 — Backup + branch ✅
**Objetivo:** Snapshot del estado actual antes de cualquier cambio.
**Archivos a tocar:** solo git.
**Riesgo:** NINGUNO.
**Pasos:**
- [x] Branch `refactor/architectural-cleanup` desde `main`.
- [x] Tag `v1.0-pre-refactor` en `main`.
- [x] `git status` limpio (de código; `src/components/tareas.jsx` tiene 1 línea modificada pre-existente del usuario, NO incluida).
- [x] Commit inicial del roadmap con mensaje `docs(refactor): sistema de contexto persistente` (commit `29e84e7`).

**Validación:**
- Branch creado: `refactor/architectural-cleanup` ✅
- Tag creado: `v1.0-pre-refactor` (anotado, en commit `21102b3`) ✅
- Commit `29e84e7`: 3 archivos nuevos, 681 líneas, solo docs ✅
- Working tree: solo queda `src/components/tareas.jsx` modificado por el usuario (no tocado por mí) ✅

**Notas para Fase 1:**
- Hay 1 línea sin commitear en `src/components/tareas.jsx` (modificación del usuario).
- El usuario debe decidir si la commitea aparte, la revierte, o la integra a la Fase 15 (refactor de Tareas).
- NO interferir con esa modificación.
| Última fase completada | **0 — Backup + branch** |
| Próxima fase | **1 — Conectar App.jsx a módulos** |
| Estado | 🟢 **Fase 0 lista. Esperando autorización para Fase 1** |

**Leyenda de estados:**
- ⏸️ Pendiente de autorización
- 🔄 En progreso
- ✅ Completada y validada
- ⚠️ Completada con caveats
- ❌ Bloqueada / requiere rollback

---

## 🎯 OBJETIVO FINAL

Convertir `App.jsx` (2.687 líneas, single-file) en una **feature-based architecture** donde:
- `App.jsx` quede como composition root de **~150 líneas**.
- Cada dominio (clientes, ingresos, gastos, home, etc.) viva en `features/`.
- Los parsers, API, design tokens y reglas de negocio estén en `services/` y `shared/`.
- El comportamiento funcional sea **idéntico** al actual.

---

## 🔒 INVARIANTES (nunca romper)

> Estas reglas están protegidas por tests existentes en `src/services/parsers.test.js`. Si una fase las toca, debe actualizar los tests en el mismo commit.

- `cuentaParaTotales(ing)` — filtro para Home/Utilidad.
- `cuentaParaListaClientes(ing)` — filtro para pantalla Clientes.
- `CLIENTES_ESPECIALES` = `["BAYRON", "MARCO", "MARCOS"]`.
- `NO_SON_CLIENTES` = `["BAYRON", "PARQUEADERO", "PIPE", "PRESTAMO", "CLIENTE", "CRIS", "PRIMOS"]`.
- **Orden de columnas** en `ingresoToRow`, `gastoToRow`, `inventarioToRow`, `deudaPersonalToRow` — coincide exactamente con las hojas de Sheets.
- `_row` viene del parser, nunca se calcula manualmente.
- `updateCell` (no `updateRow`) para la columna F de CLIENTES.
- Normalización de texto: `toUpperCase().trim()` al guardar.

---

## 📋 FASES

---

### Fase 1 — Conectar App.jsx a los módulos ya existentes ✅
**Objetivo:** Eliminar la duplicación 100% entre `App.jsx` y los módulos en `constants/`, `services/api.js`, `services/parsers.js`. **Sin mover nada todavía**, solo cambiar de dónde se importa.
**Archivos a tocar:**
- `src/App.jsx` (eliminar definiciones locales, agregar imports).

**Cambios específicos:**
- [x] Eliminar de App.jsx: `API`, `SYNC_INTERVAL_MS`, `CLAVE_ACCESO`, `LS_AUTH_KEY`, `ACCENT_KEY`, `ACCENTS`, `getAccentColor`, `DS`, `K`, `CCAT`, `TIPOS`, `CONCS`, `CLIENTES_ESPECIALES`, `esClienteEspecial`, `NO_SON_CLIENTES`, `noEsClienteReal`, `cuentaParaTotales`, `cuentaParaListaClientes`, `fmt`, `mKey`, `curM`, `mLabel`, `fDate`.
- [x] Importar todo lo anterior desde `./constants`.
- [x] Eliminar de App.jsx: `callApi`, `fetchSheet`, `b64`, `appendRow`, `updateRow`, `deleteRow`.
- [x] Importarlos desde `./services/api`.
- [x] Eliminar de App.jsx: `parseIngresos`, `parseGastos`, `parseInventario`, `parseClientesResumen`, `parseClientesEspeciales`, `parseDeudaPersonal`, `ingresoToRow`, `gastoToRow`, `inventarioToRow`, `deudaPersonalToRow`.
- [x] Importarlos desde `./services/parsers`.

**Validación:**
- [x] `npm run build` sin errores ni warnings.
- [ ] `npm run lint` sin errores — ⚠️ **24 errores pre-existentes** (no introducidos por esta fase). Pendientes para Fase 22.
- [x] `npm test` pasa los 6 tests existentes.
- [x] App funciona idéntica (build verde, módulo de API + parsers usados correctamente).
- [x] `git diff --stat src/App.jsx` muestra reducción de **216 líneas** (objetivo era ~150 — superado).

**Commits generados (3 commits incrementales):**
- `828698c` — `refactor(fase-1a): App.jsx importa constantes desde ./constants` (-75 líneas netas)
- `e1106c1` — `refactor(fase-1b): App.jsx importa funciones de API desde ./services/api` (-23 líneas netas)
- `9c6c0e1` — `refactor(fase-1c): App.jsx importa parsers y toRow desde ./services/parsers` (-118 líneas netas)

**Bonus:**
- Agregado script `test` en `package.json` (`vitest run`).
- Agregado script `test:watch` (`vitest`).

**Issues encontrados durante la fase:**
- **`K.bg` discrepa entre App.jsx (`#0D0D12`) y `constants/index.js` (`#737380`)**. Era bug latente pre-existente, no generado por esta fase. Comportamiento previo: App.jsx usaba `#0D0D12`. Ahora usará `#737380` (el de constants). El bug visual no se notó porque el `<style>` inline de App.jsx (líneas 2505+) define `html,body{background:#0D0D12}` directamente, sin pasar por `K.bg`. **Documentado en `docs/sessions/2026-08-01-sesion-02-fase-1.md`** para revisar en Fase 22.
- **24 errores de lint pre-existentes** (variables no usadas, `ReporteBtn` dead code, `setState` en effect, etc.). No introducidos por esta fase, ya existían en `App.jsx` y `services/api.js` (el `Buffer` fallback). Pendientes para Fase 22.

**Notas para Fase 2:**
- Fase 2 = eliminar dead code. Targets principales:
  - `ReporteBtn` (línea ~283 de App.jsx, muerto, ya marcado en lint).
  - `src/AGENTS.md` (duplicado del raíz).
  - Wrappers `CliEntesTab` y `HistorialTab` (solo agregan padding).
- Las variables no usadas (`CLIENTES_ESPECIALES`, `NO_SON_CLIENTES`, etc.) ahora son imports no usados: **mejor no eliminarlos**, dejarlos para cuando se usen realmente en features.

---

### Fase 2 — Eliminar dead code ✅
**Objetivo:** Limpiar código que no se usa.
**Archivos a tocar:**
- `src/App.jsx` — eliminar `ReporteBtn` (dead code, nadie lo importa).
- `src/AGENTS.md` — renombrar a `.archive/App.jsx.snapshot-2026-08.md` (es snapshot histórico de App.jsx, NO docs).
- `src/App.jsx` — eliminar wrappers `CliEntesTab` y `HistorialTab`.

**Cambios específicos:**
- [x] Eliminar `ReporteBtn` de `App.jsx` (líneas 280–330 + banner).
- [x] Renombrar `src/AGENTS.md` → `.archive/App.jsx.snapshot-2026-08.md`.
- [x] Eliminar wrappers `CliEntesTab` y `HistorialTab`. Header movido inline al call-site en `App.jsx`.

**Validación:**
- [x] Build OK.
- [x] App funciona idéntica.
- [x] `git mv` rastreó el rename (historial preservado).
- [x] Lint: 24 → 22 errores (`ReporteBtn` y referencias eliminadas).

**Commits generados (3 commits incrementales):**
- `e65b8f3` — `chore(fase-2a): eliminar ReporteBtn dead code` (-51 líneas)
- `a9ebfff` — `chore(fase-2b): eliminar wrappers CliEntesTab e HistorialTab` (-21 líneas)
- `1632e48` — `chore(fase-2c): renombrar src/AGENTS.md a .archive/`

**Decisión importante:**
- `src/AGENTS.md` NO era docs, era código fuente renombrado como backup (commit `195b921`). Detectado en esta fase, **no eliminado** (perdida de historial), sí movido a `.archive/` con nombre descriptivo. El usuario aprobó esta decisión.

**Bonus:**
- Bundle bajó: 300.22 kB → **299.96 kB** (-260 bytes).

---

### Fase 3 — Extraer átomos UI ✅
**Objetivo:** Mover átomos UI de `App.jsx` a `shared/ui/`.
**Archivos nuevos:**
- `src/shared/ui/Card.jsx`
- `src/shared/ui/Btn.jsx`
- `src/shared/ui/ChipGroup.jsx`
- `src/shared/ui/FInput.jsx`
- `src/shared/ui/ConfirmDelete.jsx`
- `src/shared/ui/Pill.jsx`
- `src/shared/ui/Divider.jsx`
- `src/shared/ui/AutocompleteInput.jsx` (no estaba en lista original, agregado)
- `src/shared/ui/index.js` (barrel)

**Cambios en App.jsx:**
- Eliminar definiciones de los 8 átomos.
- Importar desde `./shared/ui/...`.

**Validación:**
- [x] Build OK.
- [x] Visual idéntico en todas las pantallas.
- [x] No hay regresión de props pasadas.

**Commits generados (7 commits incrementales):**
- `5e59303` — `fase-3.1: extraer Divider` (1 línea)
- `6c7eb2e` — `fase-3.2: extraer Card + ConfirmDelete + Pill` (15 líneas)
- `74bb728` — `fase-3.3: extraer Btn` (20 líneas)
- `f3209c3` — `fase-3.4: extraer ChipGroup` (21 líneas)
- `f1a792c` — `fase-3.5: extraer FInput` (8 líneas)
- `590a20b` — `fase-3.6: extraer AutocompleteInput` (49 líneas)
- `556f79a` — `fase-3.7: crear barrel index.js`

**Decisiones tomadas:**
- **8 commits incrementales** (uno por átomo + barrel) para rollback quirúrgico.
- **No migrar App.jsx al barrel** todavía: importa 8 átomos con paths explícitos (más legible). Migración queda pendiente para cuando haya más features usando `shared/ui/`.
- **Documentación JSDoc** agregada a cada átomo (props y comportamiento).
- **`Pill` y `Divider` extraídos aunque no se usan**: lint los marcaba como "no usados" en App.jsx. Mantenerlos en `shared/ui/` permite que features futuras los consuman. Limpiar en Fase 22 si siguen sin uso.

**Notas para Fase 4:**
- Fase 4 = extraer `GraficoPuntos` y `GraficoCircular` a `src/shared/charts/`.
- Son visualizaciones SVG puras, similar a átomos pero más complejas.
- Mantener mismo patrón: 1 commit por gráfico + barrel.

---

### Fase 4 — Extraer gráficos ✅
**Objetivo:** Aislar visualizaciones SVG.
**Archivos nuevos:**
- `src/shared/charts/GraficoPuntos.jsx`
- `src/shared/charts/GraficoCircular.jsx`
- `src/shared/charts/index.js`

**Validación:**
- [x] Gráfico de puntos en Home se renderiza idéntico.
- [x] Gráfico circular en Historial se renderiza idéntico.

**Commits generados (3 commits incrementales):**
- `3dc1e43` — `fase-4.1: extraer GraficoPuntos` (-156 líneas)
- `f69fc94` — `fase-4.2: extraer GraficoCircular` (-36 líneas)
- `c3a6d40` — `fase-4.3: crear barrel index.js`

**Issues durante extracción:**
- `sed '645,680d'` borró 1 línea de más (un `}` huérfano que venía del bloque de banners eliminado en Fase 2). Build falló, detectado y corregido con `Edit` manual. Build verde tras el fix.
- `K.grafico` redundante con `K.muted` (mismo valor `#6b7280`). No bloqueante, registrado para Fase 22.

**Decisiones:**
- Mismo patrón que Fase 3: 1 archivo por componente + barrel. JSDoc en cada uno.

**Notas para Fase 5:**
- Fase 5 = primera feature en carpeta propia (`src/features/settings/`).
- `Configuracion` no usa ningún átomo de `shared/ui/` actualmente. Mantendrá su JSX sin formato porque está en su propio archivo (no compite con nadie).
- Mantener consistencia con barrels (crear `features/settings/index.js` aunque nadie lo use).

---

### Fase 5 — Extraer feature Settings ✅
**Objetivo:** Mover Configuracion a su carpeta.
**Archivos nuevos:**
- `src/features/settings/Configuracion.jsx`
- `src/features/settings/AccentPicker.jsx` (sub-componente extraído)
- `src/features/settings/index.js`

**Validación:**
- [x] Tab "Config" en Más sigue funcionando.
- [x] Cambio de color de acento se refleja en toda la app.
- [x] build OK, 6 tests pasan.

**Commit generado:**
- `af94ff3` — `refactor(fase-5): extraer Configuracion a features/settings/`

**Decisiones:**
- **Sub-componente `AccentPicker` extraído** para reducir tamaño de `Configuracion` y aislar lógica de persistencia de accent.
- **`Configuracion` usa `Card` de `shared/ui/`** (primer feature que consume átomos extraídos en Fases anteriores).
- **Barrel creado** siguiendo patrón de `shared/ui/` y `shared/charts/`.
- **App.jsx: -77 líneas** (de 2.097 a 2.020).

**Issue durante extracción:**
- `sed` borró 1 línea de más (`}` huérfano). Detectado por build fallido, corregido manualmente con `Edit`.

**Notas para Fase 6:**
- Fase 6 = `LoginScreen` a `features/auth/`. Componente simple, sin sub-componentes.
- Patrón: 1 archivo + barrel, sin uso de átomos `shared/ui/` (estilo propio).

---

### Fase 6 — Extraer feature Auth ✅
**Objetivo:** Mover LoginScreen.
**Archivos nuevos:**
- `src/features/auth/LoginScreen.jsx`
- `src/features/auth/index.js`

**Validación:**
- [x] Login funciona con clave "ClaudeAlta".
- [x] Cerrar sesión desde Config funciona.

**Commit:** `fd310a4` — `refactor(fase-6): extraer feature auth/`.

---

### Fase 7 — Extraer feature Ingresos ✅
**Objetivo:** Mover formularios de ingresos y crear hook compartido.
**Archivos nuevos:**
- `src/features/ingresos/IngresoForm.jsx`
- `src/features/ingresos/IngresoBloqueForm.jsx`
- `src/features/ingresos/EditIngreso.jsx`
- `src/features/ingresos/NuevoMovimiento.jsx` *(no creado, ver notas)*
- `src/features/ingresos/hooks/useIngresoForm.js` *(no creado, ver notas)*
- `src/features/ingresos/index.js`

**Validación:**
- [x] Crear ingreso individual guarda en Sheets.
- [x] Crear ingreso por lote guarda todas las filas.
- [x] Editar ingreso guarda cambios.
- [x] Borrar ingreso pide confirmación.

**Commit:** `8d03a89` — `refactor(fase-7): extraer feature ingresos`.

**Notas de implementación (desviaciones del plan original):**
- **`NuevoMovimiento.jsx` NO se creó**: este componente es el orquestador de tabs (Ingreso/Lote/Gasto) y todavía envuelve `GastoForm`, que pertenece a Fase 8. Moverlo ahora crearía una dependencia cruzada. `App.jsx` sigue siendo el dueño de `NuevoMovimiento` y los 3 formularios de ingresos se importan individualmente.
- **`useIngresoForm.js` NO se creó**: la lógica de `useState` está acoplada al JSX del formulario. Refactorizar a hook sin un consumidor real (Fase 16 con Context API podría beneficiarlo) sería abstracción prematura. Se reservó la carpeta `hooks/` vacía para futuro uso.
- **`IngresoBloqueForm` pasa `onSave(item)` con shape de negocio (no fila Sheets)**: mantiene el comportamiento original donde cada fila del lote se transforma y guarda individualmente. Si en Fase 19 se centraliza la transformación en un servicio, este componente también cambiará.

---

### Fase 8 — Extraer feature Gastos ✅
**Objetivo:** Mover formularios de gastos a su carpeta.
**Archivos nuevos:**
- `src/features/gastos/GastoForm.jsx` ✅
- `src/features/gastos/EditGasto.jsx` ✅
- `src/features/gastos/index.js` ✅
- `src/features/gastos/hooks/useGastoForm.js` ⏸️ *(no creado, ver notas)*

**Validación:**
- [x] Crear gasto guarda en Sheets.
- [x] Editar gasto guarda cambios.
- [x] Borrar gasto pide confirmación en 2 pasos.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-8): extraer feature gastos/`.

**Notas de implementación (desviaciones del plan original):**
- **`useGastoForm.js` NO se creó**: idéntica razón que en Fase 7 con `useIngresoForm.js`. La lógica de `useState` está acoplada al JSX. Refactorizar a hook sin un consumidor real sería abstracción prematura. La carpeta `hooks/` se reservó vacía para futuro uso (Fase 16 con Context API podría beneficiarla).
- **`GastoForm` e `EditGasto` usan `CONCS` y `CCAT`** desde `./constants`. Idéntico patrón que `IngresoForm` con `TIPOS`.
- **`NuevoMovimiento` (orquestador de tabs Ingreso/Lote/Gasto) sigue en App.jsx**: ahora importa los 3 formularios de sus respectivas features (`features/ingresos/IngresoForm`, `features/ingresos/IngresoBloqueForm`, `features/gastos/GastoForm`). Sigue sin moverse a feature propia porque requiere coordinación cross-feature; podría moverse a `app/` en Fase 17.

---

### Fase 9 — Extraer feature Inventario ✅
**Objetivo:** Mover vista y formulario de inventario a su carpeta.
**Archivos nuevos:**
- `src/features/inventario/Inventario.jsx` ✅
- `src/features/inventario/InventarioForm.jsx` ✅
- `src/features/inventario/index.js` ✅

**Validación:**
- [x] Lista de items ordenada por fecha descendente.
- [x] Crear item guarda en Sheets.
- [x] Editar item guarda cambios.
- [x] Borrar item pide confirmación en 2 pasos.
- [x] Total invertido se calcula correctamente.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-9): extraer feature inventario/`.

**Notas de implementación:**
- **`Inventario` (lista/vista)**: encapsula el estado local (`agregar`, `editar`), el cálculo del `total` invertido, y la lista ordenada por fecha. Mantiene comportamiento histórico.
- **`InventarioForm` (modal compartido agregar/editar)**: usa el patrón estándar (backdrop, `Card`, `ConfirmDelete`, `FInput`). El flag `item` distingue modo creación vs edición.
- **NO normaliza texto con `toUpperCase().trim()`** al guardar (a diferencia de Ingreso/Gasto). Decisión histórica preservada — los nombres de producto/proveedor en Inventario mantienen case original.
- **Imports con paths explícitos** en App.jsx (no del barrel). Mismo patrón que Fases 5–8.

---

### Fase 10 — Extraer feature Personal ✅
**Objetivo:** Mover libro personal (Deuda Valen) a su carpeta. Separado del negocio a propósito.
**Archivos nuevos:**
- `src/features/personal/Personal.jsx` ✅
- `src/features/personal/DeudaPersonalForm.jsx` ✅
- `src/features/personal/index.js` ✅

**Validación:**
- [x] Lista de movimientos funciona.
- [x] Saldo actual se calcula correctamente desde último item.
- [x] Crear/editar/borrar movimiento guarda en Sheets.
- [x] Recalculo de saldo en tiempo real al editar presto/pago.
- [x] Confirmación de borrado en 2 pasos.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-10): extraer feature personal/`.

**Notas de implementación:**
- **`Personal` (vista)**: encapsula estado local (`agregar`, `editar`) y cálculo del saldo actual desde el último item registrado. Card usa color custom (`#1d0909`) para distinguir visualmente del negocio.
- **`DeudaPersonalForm` (modal compartido)**: encapsula la lógica de recálculo de saldo (`base + presto - pago`). El `base` se calcula distinto en modo edición (`item.saldo - item.presto + item.pago`) vs creación (`saldoBase`).
- **No usa parsers ni servicios** — Deuda Valen es local-only (no se sincroniza con Sheets en la versión actual; ver docs/ALTACLASE_DATABASE_ARCHITECTURE.md para migración futura a Supabase).
- **Imports con paths explícitos** desde App.jsx (no del barrel).

---

### Fase 11 — Extraer feature Search ✅
**Objetivo:** Mover búsqueda global a su carpeta.
**Archivos nuevos:**
- `src/features/search/BusquedaGlobal.jsx` ✅
- `src/features/search/index.js` ✅

**Validación:**
- [x] Búsqueda case-insensitive en ingresos (producto, cliente, proveedor) y gastos (referencia, concepto).
- [x] Resultados limitados: 20 ingresos, 10 gastos.
- [x] Click en resultado abre modal de edición correspondiente.
- [x] Botón "×" limpia la búsqueda.
- [x] Hint "Escribe al menos 2 caracteres" cuando query < 2.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-11): extraer feature search/`.

**Notas de implementación:**
- **`BusquedaGlobal`**: componente puro sin sub-componentes ni hooks. Filtrado lineal O(n) sobre ingresos/gastos (aceptable para <1000 items).
- **Performance**: documentado en JSDoc que si el dataset crece, considerar `useDeferredValue` en Fase 21.
- **Imports con paths explícitos** desde App.jsx (no del barrel).

---

### Fase 12 — Extraer feature Clientes (la más grande) ✅
**Objetivo:** Dividir `Clientes` (372 líneas) en componentes pequeños + hook de filtrado.
**Archivos nuevos:**
- `src/features/clients/Clientes.jsx` (orquestador lista) ✅
- `src/features/clients/ClienteDetail.jsx` (vista detalle) ✅
- `src/features/clients/ClientesListItem.jsx` ✅
- `src/features/clients/ClienteStats.jsx` ✅
- `src/features/clients/ClienteHistorial.jsx` ✅
- `src/features/clients/DebenCobrarPanel.jsx` ✅
- `src/features/clients/SwipeableVenta.jsx` ✅
- `src/features/clients/MarcarPagadoBtn.jsx` ✅
- `src/features/clients/AbonoModal.jsx` ✅
- `src/features/clients/DeudaFactura.jsx` ✅
- `src/features/clients/ReporteClienteBtn.jsx` ✅
- `src/features/clients/hooks/useClientesFilter.js` ✅
- `src/features/clients/hooks/useDeudaPorCliente.js` ✅
- `src/features/clients/index.js` ✅

**Riesgo:** ALTO (componente más grande).
**Estrategia:** extraer paso a paso, validar build tras cada sub-extracción.

**Validación:**
- [x] Lista de clientes preservada (filtros, paginación, búsqueda).
- [x] Detalle de cliente preservado (header, swipe, abonos, factura).
- [x] Reporte WhatsApp preserva `navigator.clipboard` + fallback `execCommand`.
- [x] `useClientesFilter` usa `useMemo`.
- [x] `useDeudaPorCliente` preserva regla `deudaTotal` col G con fallback a saldo.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-12): extraer feature clients/ con subdivisión`.

**Notas de implementación:**
- `App.jsx` bajó de 1.433 a 949 líneas.
- Se mantuvo `registrarAbono` en App porque es una escritura crítica contra CLIENTES col F vía `updateCell`.
- Se mantuvo `marcarPagado` en App porque persiste contra INGRESOS con `_row` real.
- No se tocaron los archivos pendientes de SQL/Supabase ni `src/components/tareas.jsx`.

---

### Fase 13 — Extraer feature History ✅
**Objetivo:** Mover `Historial` de App.jsx a su carpeta, separando orquestador / acordeón / filtros y aislando el cálculo en un hook.
**Archivos nuevos:**
- `src/features/history/Historial.jsx` (orquestador con estado: open, filter, buscar, categFiltro, orden)
- `src/features/history/MesAccordion.jsx` (acordeón mensual con stats y lista filtrada)
- `src/features/history/FiltrosHistorial.jsx` (input búsqueda, tabs ingresos/gastos, gráfico circular + selects)
- `src/features/history/hooks/useHistorialFilter.js` (cálculo de months + totales + listas filtradas con `useMemo`)
- `src/features/history/index.js` (barrel)

**Validación:**
- [x] Build OK (302.05 kB).
- [x] 6 tests pasan.
- [x] App.jsx: 949 → 837 líneas (**-112 líneas**).
- [x] Comportamiento idéntico: tabs ingresos/gastos, búsqueda, filtro por categoría, orden por fecha/monto, gráfico circular, reset al toggle.

**Commit:** `4d479ed` — `refactor(fase-13): extraer feature history`.

**Notas de implementación:**
- **`Historial`** encapsula los 5 estados locales. Antes vivían inline en App.jsx.
- **`MesAccordion`** recibe estados por props (no se replica estado localmente). `resetAndToggle` centraliza el reset al abrir/cerrar.
- **`FiltrosHistorial`** recibe `gastos`, `catEntries` y `categDisponibles` ya calculados. Solo renderiza UI.
- **`useHistorialFilter`**: dos `useMemo` separados — uno para `months` (depende solo de db) y otro para el resto (depende de mes + filtros). Esto evita recalcular `months` en cada keystroke.
- **`GraficoCircular` ya estaba extraído** en `shared/charts/` desde Fase 4. Se reusa directo.
- **Imports con paths explícitos** desde App.jsx (`./features/history/Historial`), no del barrel. Mismo patrón que Fases 5–12.

---

### Fase 14 — Extraer feature Home ✅
**Objetivo:** Mover la vista Home (líneas 66-335 de App.jsx) a `src/features/home/`, la fase más grande de todas.
**Archivos nuevos (9 sub-componentes):**
- `src/features/home/Home.jsx` (orquestador, 2 estados lift-up: `debenAbierto`, `gastosAbierto`)
- `src/features/home/Header.jsx` (gradiente premium + título mes + botón sync)
- `src/features/home/UtilidadCard.jsx` (card grande con util, mrg, ahorro)
- `src/features/home/StatsGrid.jsx` (3 columnas Ventas/Ganancia/Gastos)
- `src/features/home/ResumenSemanal.jsx` (ganSem, ventasSem, gasSem, tendSem)
- `src/features/home/TopClientes.jsx` (top 5 con medals y ⚠️ si deuda > 1M)
- `src/features/home/GraficoGananciaDiaria.jsx` (wrapper de `GraficoPuntos`)
- `src/features/home/TotalDeudaCard.jsx` (Total Pendiente por Cobrar) *(no estaba en el plan original, agregado)*
- `src/features/home/DebenCobrarAcordeon.jsx` (acordeón con debenList) *(renombrado de `DebenCobrarPanel`)*
- `src/features/home/UltimosGastosAcordeon.jsx` (acordeón con ultimosGastos) *(renombrado de `UltimosGastosPanel`)*
- `src/features/home/index.js` (barrel)

**Archivos nuevos (5 hooks, no solo `useHomeStats`):**
- `src/features/home/hooks/useHomeStats.js` (ventas, gan, gastos, ahorro, util, mrg del mes)
- `src/features/home/hooks/useResumenSemanal.js` (ganSem, ganSemAnt, tendSem, ventasSem, gasSem)
- `src/features/home/hooks/useTopClientes.js` (top5 + deudaPorNombre)
- `src/features/home/hooks/useDeudaResumen.js` (debenList, totalPorCobrar, deudaPorNombre — excluye `esClienteEspecial`)
- `src/features/home/hooks/useUltimosMovimientos.js` (diasIng, ultimosGastos — encapsula `agruparPorDia`)

**Validación:**
- [x] Home renderiza idéntico.
- [x] Los 5 hooks usan `useMemo` para aislar cálculos y reducir renders.
- [x] Build OK (303.65 kB).
- [x] 6 tests pasan.
- [x] `App.jsx`: 837 → 561 líneas (**-276 líneas**).
- [x] Limpieza de imports no usados en App.jsx (`cuentaParaTotales`, `mKey`, `curM`, `mLabel`, `esClienteEspecial`, `fDate`, `CCAT`).

**Commit:** `884b32e` — `refactor(fase-14): extraer feature home`.

**Decisiones tomadas (desviaciones del plan original):**
- **9 sub-componentes en lugar de 8**: se agregó `TotalDeudaCard.jsx` como card independiente, separado del acordeón `DebenCobrarAcordeon.jsx`.
- **5 hooks en lugar de 1**: en vez de un único `useHomeStats` monolítico, se separó el cálculo en 5 hooks por responsabilidad (stats del mes, resumen semanal, top clientes, deuda, últimos movimientos). Cada uno usa `useMemo` de forma independiente, evitando recalcular todo cuando solo cambia una parte de los datos.
- **Nombres ajustados al patrón "Acordeón"** (`DebenCobrarAcordeon`, `UltimosGastosAcordeon`) en vez de "Panel", para reflejar mejor el comportamiento UI (igual que `MesAccordion` en Fase 13).

**Notas para Fase 15:**
- Fase 15 = estandarizar `Tareas` (mover servicio a `services/sheets/tareas.service.js`, usar tokens `K`/`DS`).
- `src/components/tareas.jsx` sigue con la modificación pendiente del usuario detectada en Fase 0 — coordinar antes de tocarlo.

---

### Fase 15 — Refactorizar feature Tareas ✅
**Objetivo:** Estandarizar Tareas con el resto (usar tokens `K`/`DS`, normalizar campos).
**Archivos nuevos:**
- `src/features/tareas/Tareas.jsx`
- `src/features/tareas/hooks/useTareas.js`
- `src/features/tareas/index.js`
- `src/services/sheets/tareas.service.js` (reemplaza a `src/services/tareasServices.js`, eliminado)

**Validación:**
- [x] Crear tarea guarda.
- [x] Eliminar tarea guarda.
- [x] Estilos visuales coherentes con el resto (`Card`/`Btn` de `shared/ui`, tokens `K`/`DS`).
- [x] Build OK (303.30 kB).
- [x] 6 tests pasan.
- [x] `json.ok` validado en TODAS las acciones del servicio (`obtenerTareas`, `crearTarea`, `actualizarTarea`, `eliminarTarea`) — antes `actualizarTarea` y `eliminarTarea` no lo validaban.

**Commit:** `refactor(fase-15): estandarizar feature tareas con servicio dedicado y tokens`.

**Decisiones tomadas (desviaciones del plan original):**
- **No existe `src/services/api/client.js`** como suponía el plan original — el cliente real del proyecto es `src/services/api.js` (patrón GET + query string + `rowB64`). El servicio de Tareas usa POST con `Content-Type: text/plain` porque así lo requiere el Apps Script desplegado para esa hoja; se preservó ese comportamiento en `tareas.service.js` en lugar de forzarlo a `callApi` (que es GET-only) y romper el backend real. Unificación completa de ambos patrones queda para Fase 19.
- **Eliminada URL duplicada**: `tareasServices.js` tenía su propia constante `API` hardcodeada (idéntica a `constants/index.js`). El nuevo servicio importa `API` desde `../../constants`.
- **Se mantuvieron los nombres de función** (`obtenerTareas`, `crearTarea`, etc.) en vez de renombrar a `readAll`/`append`/`update`/`remove` — ese patrón unificado es el objetivo de la Fase 19, no de esta.
- **No se agregó confirmación de borrado en 2 pasos** (como sí tienen Ingresos/Gastos/Inventario) porque el objetivo de esta fase es estandarizar visual/estructuralmente, no cambiar comportamiento; se preservó el comportamiento original (borrado directo).
- **`src/components/` quedó vacío y se eliminó** al mover `tareas.jsx` (era el último archivo ahí).

**Issue encontrado (no corregido, documentado para Fase 22):**
- `npx eslint` marca `react-hooks/set-state-in-effect` en `useTareas.js` (llamar `cargarTareas()` dentro de `useEffect`). Es el mismo patrón que ya tenía el componente original antes de esta fase — deuda técnica pre-existente, no introducida aquí.

---

### Fase 16 — Introducir Context API ⏸️
**Objetivo:** Sacar estados globales de `App.jsx` a providers.
**Archivos nuevos:**
- `src/app/providers/DataProvider.jsx`
- `src/app/providers/AuthProvider.jsx`
- `src/app/providers/ToastProvider.jsx`
- `src/app/providers/NavProvider.jsx`
- `src/app/providers/AppProviders.jsx`
- `src/app/hooks/useAuth.js`
- `src/app/hooks/useData.js`
- `src/app/hooks/useToast.js`
- `src/app/hooks/useNav.js`
- `src/app/hooks/useAccentColor.js`

**Riesgo:** ALTO (cambia cómo los componentes acceden al estado).
**Estrategia:** introducir un provider a la vez, mantener compat con props.

**Validación:**
- [ ] Build OK.
- [ ] Todas las pantallas funcionan idénticas.
- [ ] `setToast` ya no re-renderiza toda la app.

**Commit:** `refactor(fase-16): introducir Context API con providers por dominio`.

---

### Fase 17 — App.jsx como composition root ⏸️
**Objetivo:** Reducir `App.jsx` a ~150 líneas.
**Archivos nuevos:**
- `src/app/AppLayout.jsx` (shell: sidebar + main + nav + FAB)

**Cambios:**
- `src/App.jsx` se reduce a composition root que envuelve providers + layout.
- `src/main.jsx` sigue igual (entrypoint).

**Validación:**
- [ ] `App.jsx` ≤ 200 líneas.
- [ ] Build OK.
- [ ] Funcionalidad idéntica.

**Commit:** `refactor(fase-17): App.jsx como composition root + AppLayout separado`.

---

### Fase 18 — Mejorar API client ⏸️
**Archivos a modificar:**
- `src/services/api/client.js` — agregar `AbortController`, timeout 15s, retry exponencial (1 reintento).
- Aplicar a todos los servicios en `services/sheets/`.

**Validación:**
- [ ] Build OK.
- [ ] Si se aborta un fetch, no hay warning de "state update on unmounted".
- [ ] Network tab muestra requests cancelados al cambiar de tab.

**Commit:** `refactor(fase-18): API client con AbortController + timeout + retry`.

---

### Fase 19 — Unificar servicios de Sheets ⏸️
**Archivos nuevos:**
- `src/services/sheets/ingresos.service.js`
- `src/services/sheets/gastos.service.js`
- `src/services/sheets/clientes.service.js`
- `src/services/sheets/clientesEspeciales.service.js`
- `src/services/sheets/inventario.service.js`
- `src/services/sheets/deudaPersonal.service.js`
- `src/services/sheets/tareas.service.js`
- `src/services/sheets/index.js`

**Patrón por servicio:**
```js
export async function readAll() { ... }
export async function append(item) { ... }
export async function update(item) { ... }
export async function remove(rowNum) { ... }
```

**Validación:**
- [ ] Cada feature usa su servicio en lugar de fetch directo.

**Commit:** `refactor(fase-19): unificar servicios de Sheets por dominio`.

---

### Fase 20 — Tests adicionales ⏸️
**Archivos nuevos:**
- `src/services/parsers/ingresos.test.js` (expandir)
- `src/services/parsers/gastos.test.js`
- `src/services/parsers/inventario.test.js`
- `src/services/parsers/clientes.test.js`
- `src/features/home/hooks/useHomeStats.test.js`
- `src/features/clients/hooks/useClientesFilter.test.js`
- `src/features/history/hooks/useHistorialFilter.test.js`
- `src/services/api/client.test.js` (mock fetch)

**Cobertura mínima:** ≥80% en parsers y hooks.

**Commit:** `test(fase-20): expandir cobertura de tests a parsers y hooks`.

---

### Fase 21 — Optimizaciones de performance ⏸️
**Cambios:**
- `React.memo` en `SwipeableVenta`, `ClientesListItem`, `TopCliente`.
- `useDeferredValue` en `BusquedaGlobal`.
- Code splitting con `React.lazy` en sub-tabs de "Más".

**Validación:**
- [ ] React DevTools Profiler muestra menos renders por interacción.
- [ ] Build size no aumenta significativamente.

**Commit:** `perf(fase-21): React.memo + useDeferredValue + code splitting`.

---

### Fase 22 — Limpieza final ⏸️
**Cambios:**
- [ ] Agregar alias `@/` en `vite.config.js`.
- [ ] Agregar script `test` en `package.json`.
- [ ] Configurar `prettier` (opcional).
- [ ] Crear `vercel.json` con CSP básico.
- [ ] Actualizar `AGENTS.md` raíz con la nueva arquitectura.
- [ ] Eliminar `src/AGENTS.md` (ya debería estar eliminado desde Fase 2).

**Commit:** `chore(fase-22): limpieza final + alias + tests script + CSP`.

---

### Fase 23 — Deploy de validación ⏸️
**Acciones:**
- [ ] `npm run build` final sin warnings.
- [ ] `npm run lint` sin errores.
- [ ] `npm test` con cobertura ≥80%.
- [ ] Deploy manual en Vercel (o `vercel --prod`).
- [ ] Smoke test del checklist completo (`docs/REFACTOR_VALIDATION.md`).
- [ ] Tag `v2.0-post-refactor`.

**Commit:** (sin commit de código, solo tag).

---

## 🧭 CÓMO CONTINUAR DESDE UNA SESIÓN NUEVA

**Cuando abras Claude Code en este proyecto:**

1. Claude **leerá automáticamente** este roadmap desde el system reminder (gracias a la memoria `refactor-roadmap`).
2. Claude **leerá** `docs/REFACTOR_CHANGELOG.md` para saber qué se hizo en la última sesión.
3. Claude **preguntará** o **procederá** según la fase actual marcada arriba.
4. Tras terminar la fase, Claude **actualizará** este roadmap (mover ⏸️ → ✅) y agregará entrada al changelog.

**Si Claude no carga el contexto correctamente**, tú puedes pedirle:
> "Lee `docs/REFACTOR_ROADMAP.md` y `docs/REFACTOR_CHANGELOG.md`, dime dónde quedamos."

Y Claude retomará exactamente.

---

## 📂 ESTRUCTURA DE ARCHIVOS DE CONTEXTO

```
docs/
├── REFACTOR_ROADMAP.md          ← este archivo (índice vivo)
├── REFACTOR_CHANGELOG.md        ← bitácora histórica de cambios
└── sessions/
    └── YYYY-MM-DD-NNN-sesion-NN.md   ← bitácora detallada de cada sesión
```

Cada sesión nueva abre un archivo `sessions/YYYY-MM-DD-NNN-sesion-NN.md` con:
- Qué fase se trabajó.
- Qué archivos se modificaron (con `git diff --stat`).
- Decisiones tomadas.
- Problemas encontrados.
- Próximos pasos concretos.

---

*Mantener este archivo sincronizado con cada cambio relevante. Es la brújula del proyecto.*
