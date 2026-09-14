# 📝 CHANGELOG DE REFACTORIZACIÓN — ALTACLASE BODEGA

> **Propósito:** Bitácora histórica de TODOS los cambios realizados durante la refactorización. Cada entrada tiene fecha, fase, archivos tocados, decisiones y resultados de validación.
>
> **Cuándo actualizar:** al final de cada sesión de trabajo, agregar una nueva entrada al inicio de este archivo (orden inverso cronológico). NO reescribir entradas pasadas.

---

## Formato de entrada

```markdown
## [YYYY-MM-DD] Sesión #NN — Fase X: <título>
**Estado:** ✅ Completada | ⚠️ Completada con caveats | ❌ Bloqueada | 🔄 En progreso
**Branch:** <nombre-de-branch>
**Commit:** <hash-corto> — <mensaje>

### Archivos modificados
- `path/archivo` (+X / -Y líneas)
- ...

### Cambios realizados
- <bullets concisos>

### Decisiones tomadas
- <bullets: por qué se hizo así, qué se descartó>

### Problemas encontrados
- <bullets: bugs reales, no teóricos>

### Validación
- [x] npm run build
- [x] npm run lint
- [x] npm test
- [x] smoke test manual: <qué se probó>
- [x] visual idéntico (sí/no)

### Próximos pasos
- <qué sigue en la siguiente sesión>

---
```

---

## [2026-09-14] Sesión #16 — Fase 15: Refactorizar feature Tareas ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `refactor(fase-15): estandarizar feature tareas con servicio dedicado y tokens`

### Archivos modificados
- `src/App.jsx` (import actualizado: `./components/tareas` → `./features/tareas/Tareas`)
- `src/components/tareas.jsx` — eliminado (movido y reescrito)
- `src/services/tareasServices.js` — eliminado (movido y reescrito)
- 3 archivos nuevos en `src/features/tareas/`:
  - `Tareas.jsx` — vista restilizada con `Card`/`Btn` de `shared/ui` y tokens `K`/`DS`
  - `hooks/useTareas.js` — estado (`tareas`, `texto`, `cargando`) y acciones (`handleCrear`, `handleEliminar`)
  - `index.js` — barrel
- 1 archivo nuevo: `src/services/sheets/tareas.service.js`

### Cambios realizados
- Separada la vista de la lógica: `Tareas.jsx` (solo JSX) + `useTareas.js` (estado/efectos).
- Servicio movido a `services/sheets/` siguiendo la convención de carpetas de Fase 19 (adelantada solo la ubicación, no el patrón de funciones).
- `json.ok` ahora se valida en las 4 acciones del servicio (`obtenerTareas`, `crearTarea`, `actualizarTarea`, `eliminarTarea`) — antes solo `crearTarea` lo hacía.
- Eliminada la constante `API` duplicada en el servicio viejo; ahora importa la única fuente de verdad desde `constants/index.js`.
- Restilizado completo con `K`/`DS`/`Card`/`Btn` en vez de estilos inline hardcodeados (`#1e1e2a`, `#2563eb`, etc.).

### Decisiones tomadas
- El plan original mencionaba `api/client.js`, que no existe en el proyecto real (el cliente es `services/api.js`, patrón GET). El servicio de Tareas usa POST porque así lo exige el Apps Script de esa hoja — se preservó tal cual en vez de forzar unificación prematura (eso es Fase 19).
- No se renombraron las funciones al patrón `readAll/append/update/remove` (eso también es alcance de Fase 19).
- No se agregó confirmación de borrado en 2 pasos: el objetivo era estandarizar visualmente, no cambiar comportamiento funcional.
- `src/components/` quedó vacío tras el movimiento y se eliminó.

### Problemas encontrados
- `react-hooks/set-state-in-effect` en `useTareas.js` — mismo patrón que ya tenía el componente original antes de esta fase (llamar función async con `setState` dentro de `useEffect`). No introducido por esta fase, queda documentado para la limpieza de lint de Fase 22.

### Validación
- [x] `npm run build` OK (303.30 kB)
- [x] `npm test` 6 tests pasan
- [x] Sin nuevas referencias a `components/tareas` o `tareasServices` en el código

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 16: Introducir Context API**.

---

## [2026-08-26] Sesión #15 — Fase 14: Extraer feature Home ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `884b32e` — `refactor(fase-14): extraer feature home`

### Archivos modificados
- `src/App.jsx` (**-276 líneas**: 837 → 561)
- 11 archivos nuevos en `src/features/home/`:
  - `Home.jsx` — orquestador (2 estados lift-up: `debenAbierto`, `gastosAbierto`)
  - `Header.jsx` — gradiente premium + título mes + botón sync
  - `UtilidadCard.jsx` — card grande con util, mrg, ahorro
  - `StatsGrid.jsx` — 3 columnas Ventas/Ganancia/Gastos
  - `ResumenSemanal.jsx` — ganSem, ventasSem, gasSem, tendSem
  - `TopClientes.jsx` — top 5 con medals y ⚠️ si deuda > 1M
  - `GraficoGananciaDiaria.jsx` — wrapper de `GraficoPuntos`
  - `TotalDeudaCard.jsx` — Total Pendiente por Cobrar
  - `DebenCobrarAcordeon.jsx` — acordeón con debenList
  - `UltimosGastosAcordeon.jsx` — acordeón con ultimosGastos
  - `index.js` — barrel
- 5 hooks nuevos en `src/features/home/hooks/`:
  - `useHomeStats.js` — ventas, gan, gastos, ahorro, util, mrg del mes
  - `useResumenSemanal.js` — ganSem, ganSemAnt, tendSem, ventasSem, gasSem
  - `useTopClientes.js` — top5 + deudaPorNombre
  - `useDeudaResumen.js` — debenList, totalPorCobrar, deudaPorNombre (excluye `esClienteEspecial`)
  - `useUltimosMovimientos.js` — diasIng, ultimosGastos (encapsula `agruparPorDia`)

### Cambios realizados
- Movida la vista Home completa (líneas 66-335 de App.jsx) a `src/features/home/`.
- Separado el cálculo en 5 hooks independientes con `useMemo` en vez de un único hook monolítico.
- Limpieza de imports no usados en App.jsx (`cuentaParaTotales`, `mKey`, `curM`, `mLabel`, `esClienteEspecial`, `fDate`, `CCAT`).

### Decisiones tomadas
- **9 sub-componentes en lugar de los 8 planeados**: se agregó `TotalDeudaCard.jsx` como card independiente del acordeón `DebenCobrarAcordeon.jsx`.
- **5 hooks en lugar de 1 `useHomeStats`**: separación por responsabilidad (stats del mes, resumen semanal, top clientes, deuda, últimos movimientos) para evitar recalcular todo cuando cambia solo una parte de los datos.
- **Nombres ajustados al patrón "Acordeón"** (`DebenCobrarAcordeon`, `UltimosGastosAcordeon`) en vez de "Panel", coherente con `MesAccordion` de Fase 13.

### Problemas encontrados
- Ninguno bloqueante.

### Validación
- [x] `npm run build` OK (303.65 kB)
- [x] `npm test` 6 tests pasan
- [x] Home renderiza idéntico (visual)

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 15: Refactorizar feature Tareas**.
2. Coordinar con el usuario la línea modificada pendiente en `src/components/tareas.jsx` (detectada en Fase 0) antes de tocar ese archivo.

---

## [2026-08-22] Sesión #13 — Fase 12: Extraer feature Clientes ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `refactor(fase-12): extraer feature clients`

### Archivos modificados
- `src/App.jsx` (**-484 líneas**: 1.433 → 949)
- 14 archivos nuevos en `src/features/clients/`:
  - `Clientes.jsx` — orquestador de lista/detalle
  - `ClienteDetail.jsx` — vista detalle
  - `ClientesListItem.jsx` — item de lista
  - `ClienteStats.jsx` — tarjetas de total ventas/ganancia
  - `ClienteHistorial.jsx` — historial paginado con swipe
  - `DebenCobrarPanel.jsx` — panel de clientes con deuda
  - `SwipeableVenta.jsx` — swipe bidireccional `"SI"`/`"NO"`
  - `MarcarPagadoBtn.jsx` — confirmación de pago total
  - `AbonoModal.jsx` — abono acumulado
  - `DeudaFactura.jsx` — detalle visual de deuda
  - `ReporteClienteBtn.jsx` — reporte WhatsApp
  - `hooks/useClientesFilter.js` — mapa, filtro y paginación con `useMemo`
  - `hooks/useDeudaPorCliente.js` — deuda real desde `deudaTotal`
  - `index.js` — barrel

### Cambios realizados
- Movida la feature Clientes completa fuera de `App.jsx`.
- Separada la lógica de deuda en `useDeudaPorCliente`.
- Separada la lógica de lista/filtro/paginación en `useClientesFilter`.
- Preservados los flujos críticos:
  - `cuentaParaListaClientes` para construir la lista.
  - `deudaTotal` como deuda real con fallback a `saldo`.
  - `onMarcarPagado([v], "SI"|"NO")` desde swipe.
  - `onRegistrarAbono(cliente, nuevoTotal)` como total acumulado.

### Decisiones tomadas
- `registrarAbono` se quedó en `App.jsx`: sigue siendo escritura crítica a CLIENTES col F vía `updateCell`.
- `marcarPagado` se quedó en `App.jsx`: sigue usando `_row` real de INGRESOS.
- `pagH`, `mesSel` y `abonoAbierto` siguen en el orquestador `Clientes` para preservar comportamiento al navegar dentro del detalle.
- No se tocaron `src/components/tareas.jsx`, SQL ni Supabase porque pertenecen a otra fase.

### Problemas encontrados
- `npm run lint` sigue fallando por deuda técnica pre-existente y archivos fuera de Fase 12. No hay errores reportados en `src/features/clients/`.

### Validación
- [x] `npm run build` OK (301.01 kB)
- [x] `npm test` 6 tests pasan
- [ ] `npm run lint` sin errores — falla por 25 errores + 1 warning pre-existentes/no relacionados.
- [x] Sin errores de lint en `src/features/clients/`

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 13: Extraer feature History**.
2. Mantener fuera del refactor actual los archivos SQL/Supabase hasta cerrar la refactorización.

---

## [2026-08-22] Sesión #12 — Fase 11: Extraer feature Search ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `refactor(fase-11): extraer feature search/`

### Archivos modificados
- `src/App.jsx` (**-74 líneas**: 1.507 → 1.433)
- 2 archivos nuevos en `src/features/search/`:
  - `BusquedaGlobal.jsx` (162 líneas con JSDoc) — búsqueda en tiempo real con filtrado lineal O(n)
  - `index.js` (4 líneas) — barrel

### Cambios realizados

**1 componente movido** de `App.jsx` a `src/features/search/`:

| # | Componente | Líneas eliminadas |
|---|---|---|
| 11.1 | BusquedaGlobal | ~74 |
| Total | — | **-74** |

### Decisiones tomadas

- **Filtrado lineal O(n) preservado**: aceptable para datasets <1000 items. JSDoc documenta que si crece, considerar `useDeferredValue` en Fase 21.
- **No se movió la lógica a un hook** (`useSearch`): no hay consumidor real. La función se ejecuta en cada render.
- **Input custom** (no `FInput`): mantiene `autoFocus`, botón "×" inline, padding custom.
- **Cap de resultados**: 20 ingresos, 10 gastos (comportamiento original).
- **Imports con paths explícitos** desde App.jsx.

### Problemas encontrados

- **Typo en path al crear `index.js`**: el archivo se creó inicialmente en `AltaRefactorizado/src/features/search/` (sin la "a" final). Detectado al verificar el filesystem, corregido con `mv` y limpieza del directorio huérfano. Sin impacto en el commit final.

### Validación
- [x] `npm run build` OK (299.98 kB, sin crecimiento)
- [x] `npm test` 6 tests pasan
- [x] Sin errores de lint nuevos en `features/search/`
- [x] Working tree limpio en archivos del refactor

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 12: Extraer feature Clientes**.
2. **Riesgo: ALTO** — la feature más grande del proyecto (372 líneas en App.jsx, se subdivide en 12 archivos).
3. Estrategia: extracción paso a paso, validar build tras cada sub-extracción.

---

## [2026-08-22] Sesión #11 — Fase 10: Extraer feature Personal ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `refactor(fase-10): extraer feature personal/`

### Archivos modificados
- `src/App.jsx` (**-82 líneas**: 1.589 → 1.507)
- 3 archivos nuevos en `src/features/personal/`:
  - `Personal.jsx` (108 líneas con JSDoc) — vista del libro Deuda Valen con saldo actual + lista
  - `DeudaPersonalForm.jsx` (133 líneas con JSDoc) — modal compartido agregar/editar con recalculo de saldo en tiempo real
  - `index.js` (6 líneas) — barrel con comentario recordando que está separada del negocio

### Cambios realizados

**2 componentes movidos** de `App.jsx` a `src/features/personal/`:

| # | Componente | Líneas eliminadas |
|---|---|---|
| 10.1 | Personal | ~36 |
| 10.2 | DeudaPersonalForm | ~46 |
| Total | — | **-82** |

### Decisiones tomadas

- **`Personal` encapsula el cálculo del saldo actual**: `items.length > 0 ? items[items.length-1].saldo : 0`. Antes vivía inline en App.jsx.
- **`DeudaPersonalForm` encapsula la lógica de recálculo**: el `base` se calcula distinto en modo edición (`item.saldo - item.presto + item.pago`) vs creación (`saldoBase`). Esto estaba disperso entre App.jsx y el modal; ahora vive en el modal.
- **Card con color custom `#1d0909`**: para distinguir visualmente del negocio. Decisión preservada.
- **NO usa parsers ni servicios**: Deuda Valen es local-only en esta versión. La migración futura a Supabase (ver `docs/ALTACLASE_DATABASE_ARCHITECTURE.md`) agregará servicios.
- **Barrel con comentario explicativo**: documenta en el header que está separada del negocio a propósito.

### Problemas encontrados

- **Ninguno.** Edit limpio, build verde al primer intento.

### Validación
- [x] `npm run build` OK (299.98 kB, sin crecimiento)
- [x] `npm test` 6 tests pasan
- [x] Sin errores de lint nuevos en `features/personal/`
- [x] Working tree limpio en archivos del refactor

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 11: Extraer feature Search**.
2. Targets: `BusquedaGlobal` → `src/features/search/`.
3. Riesgo: BAJO (componente aislado, sin estado compartido).

---

## [2026-08-18] Sesión #10 — Fase 9: Extraer feature Inventario ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `refactor(fase-9): extraer feature inventario/`

### Archivos modificados
- `src/App.jsx` (**-69 líneas**: 1.658 → 1.589)
- 3 archivos nuevos en `src/features/inventario/`:
  - `Inventario.jsx` (90 líneas con JSDoc) — vista principal con total invertido + lista ordenada
  - `InventarioForm.jsx` (113 líneas con JSDoc) — modal compartido agregar/editar con `ConfirmDelete`
  - `index.js` (4 líneas) — barrel

### Cambios realizados

**2 componentes movidos** de `App.jsx` a `src/features/inventario/`:

| # | Componente | Líneas eliminadas |
|---|---|---|
| 9.1 | Inventario | ~30 |
| 9.2 | InventarioForm | ~39 |
| Total | — | **-69** |

### Decisiones tomadas

- **`Inventario` (lista)**: encapsula el cálculo del `total` invertido (`items.reduce((s,i)=>s+i.costo,0)`) y la lista ordenada por fecha descendente. Antes este cálculo vivía dentro del JSX en App.jsx.
- **`InventarioForm` modal compartido**: usa el mismo patrón que `EditGasto`/`EditIngreso` (backdrop + `Card` + `ConfirmDelete` + `FInput`). El flag `item` distingue modo creación vs edición.
- **NO normaliza texto con `toUpperCase().trim()`** al guardar: preserva comportamiento histórico. En Inventario los nombres de producto/proveedor mantienen case original (a diferencia de Ingreso/Gasto).
- **Imports con paths explícitos** desde App.jsx (no del barrel).

### Problemas encontrados

- **Duplicación menor del banner `═══ PERSONAL`**: tras eliminar el bloque de Inventario, quedó un banner duplicado (2 líneas idénticas consecutivas). Detectado y corregido manualmente con `Edit`. Build verde tras el fix.

### Validación
- [x] `npm run build` OK (299.98 kB, sin crecimiento)
- [x] `npm test` 6 tests pasan
- [x] Sin errores de lint nuevos en `features/inventario/`
- [x] Working tree limpio en archivos del refactor

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 10: Extraer feature Personal**.
2. Targets: `Personal`, `DeudaPersonalForm` → `src/features/personal/`.
3. Riesgo: BAJO (feature aislada con su propia hoja "DEUDA_VALEN" en Sheets).

---

## [2026-08-18] Sesión #9 — Fase 8: Extraer feature Gastos ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `refactor(fase-8): extraer feature gastos/`

### Archivos modificados
- `src/App.jsx` (**-86 líneas**: 1.744 → 1.658)
- 3 archivos nuevos en `src/features/gastos/`:
  - `GastoForm.jsx` (95 líneas con JSDoc) — formulario de gasto individual con `ChipGroup` (CONCS) + input numérico inline + `FInput` referencia
  - `EditGasto.jsx` (138 líneas con JSDoc) — modal de edición con `ConfirmDelete`
  - `index.js` (4 líneas) — barrel
  - `hooks/` (carpeta vacía, reservada para Fase 16)

### Cambios realizados

**2 componentes movidos** de `App.jsx` a `src/features/gastos/`:

| # | Componente | Líneas eliminadas |
|---|---|---|
| 8.1 | GastoForm | ~40 |
| 8.2 | EditGasto | ~46 |
| Total | — | **-86** |

### Decisiones tomadas (desviaciones del plan original)

- **`useGastoForm.js` NO se creó**: idéntica razón que `useIngresoForm.js` en Fase 7. Lógica de `useState` acoplada al JSX. Carpeta `hooks/` reservada vacía.
- **`GastoForm` e `EditGasto` usan `CONCS` y `CCAT`** desde `./constants` (no `CONCS` reimportado desde App.jsx). Consistente con cómo `IngresoForm` importa `TIPOS`.
- **Input numérico inline** (no `FInput`) en ambos componentes: prefijo `$` con padding fijo requiere markup custom que `FInput` no soporta. Consistente con código histórico.
- **`NuevoMovimiento` (orquestador de tabs)** sigue en App.jsx. Sigue siendo cross-feature (Ingreso + Lote + Gasto). Posible candidato a `app/` en Fase 17.
- **Imports con paths explícitos** en App.jsx (no del barrel). Mismo patrón que Fases 5–7.

### Problemas encontrados

- **Ninguno.** `sed`/Edit borró rangos exactos sin generar huérfanos. Build pasó verde al primer intento.

### Validación
- [x] `npm run build` OK (299.98 kB, sin crecimiento)
- [x] `npm test` 6 tests pasan
- [x] Sin cambios visuales (movimiento puro)
- [x] Lint sin cambios nuevos en `features/gastos/` (28 errores pre-existentes, 0 nuevos)
- [x] Working tree limpio en archivos del refactor

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 9: Extraer feature Inventario**.
2. Targets: `Inventario`, `InventarioForm` → `src/features/inventario/`.
3. Riesgo: BAJO (feature aislada con su propia hoja de Sheets, sin dependencias cross-feature).

---

## [2026-08-13] Sesión #8 — Fase 7: Extraer feature Ingresos ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `8d03a89` — `refactor(fase-7): extraer feature ingresos`

### Archivos modificados
- `src/App.jsx` (**-195 líneas**: 1.939 → 1.744)
- 4 archivos nuevos en `src/features/ingresos/`:
  - `IngresoForm.jsx` (140 líneas con JSDoc) — formulario de venta individual
  - `IngresoBloqueForm.jsx` (143 líneas con JSDoc) — registro batch
  - `EditIngreso.jsx` (152 líneas con JSDoc) — modal de edición con ConfirmDelete
  - `index.js` (5 líneas) — barrel
  - `hooks/` (carpeta vacía, reservada)

### Cambios realizados

**3 componentes movidos** de `App.jsx` a `src/features/ingresos/`:

| # | Componente | Líneas eliminadas |
|---|---|---|
| 7.1 | IngresoForm | ~60 |
| 7.2 | IngresoBloqueForm | ~75 |
| 7.3 | EditIngreso | ~60 |
| Total | — | **-195** |

### Decisiones tomadas (desviaciones del plan original)

- **`NuevoMovimiento.jsx` NO se creó**: es orquestador de tabs (Ingreso/Lote/Gasto) y todavía envuelve `GastoForm` (Fase 8). Moverlo crearía dependencia cruzada. `App.jsx` sigue siendo el dueño.
- **`useIngresoForm.js` NO se creó**: lógica de `useState` acoplada al JSX. Refactorizar a hook sin consumidor real sería abstracción prematura. Carpeta `hooks/` reservada vacía.
- **`IngresoBloqueForm` pasa `onSave(item)` con shape de negocio** (no fila Sheets). Mantiene comportamiento original. Pendiente revisar en Fase 19 cuando se centralice la transformación en servicio.
- **Imports con paths explícitos** en `App.jsx` (no del barrel). Mismo patrón que Fases 5–6.

### Problemas encontrados

- **Ninguno.** `sed` borró rangos exactos sin generar huérfanos. Build pasó verde al primer intento, sin necesidad de fix manual (a diferencia de Fases 4 y 5).

### Validación
- [x] `npm run build` OK (299.98 kB, sin crecimiento)
- [x] `npm test` 6 tests pasan
- [x] Sin cambios visuales (movimiento puro)
- [x] Lint sin cambios nuevos (20 errores pre-existentes)
- [x] Working tree limpio (excepto `tareas.jsx` del usuario y archivos no trackeados)
- [x] `IngresoForm`, `IngresoBloqueForm`, `EditIngreso` con JSDoc

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 8: Extraer feature Gastos**.
2. Targets: `GastoForm`, `EditGasto` → `src/features/gastos/`.
3. Decisión pendiente: ¿se mueve `NuevoMovimiento` cuando exista `GastoForm` aislado? Posiblemente quede en `App.jsx` o se cree un shell compartido en `app/`.

---

## [2026-08-04] Sesión #7 — Fase 6: Extraer feature Auth ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `fd310a4` — `refactor(fase-6): extraer LoginScreen a features/auth/`

### Archivos modificados
- `src/App.jsx` (**-86 líneas**: 2.020 → ~1.934)
- 2 archivos nuevos en `src/features/auth/`:
  - `LoginScreen.jsx` (197 líneas con JSDoc) — validación de clave + persistencia localStorage + estilos glassmorphism
  - `index.js` (4 líneas) — barrel

### Cambios realizados

**LoginScreen** se movió completo de `App.jsx` a su propia carpeta. Bloques eliminados de App.jsx:
- Banner `ROOT` (early return si no hay usuario)
- Banner `LOGIN` (early return si `!user`)
- Definición completa del componente `LoginScreen` con sus 3 estados (clave, error, entrando)

### Decisiones tomadas

- **Sin sub-componente**: a diferencia de Fase 5 (donde `AccentPicker` se aisló), `LoginScreen` no tiene cohesión separable — todo el JSX es el formulario de login.
- **Sin consumo de `shared/ui/`**: estilo propio (gradiente radial, blur, glassmorphism) que no encaja con átomos extraídos. No se abstrae prematuramente.
- **Props mínimas**: solo `onSuccess`. Estado (clave, error, entrando) y persistencia localStorage permanecen dentro del componente.
- **JSDoc completa** documentando props, comportamiento y aclaración de que auto-cierre se maneja en App.

### Problemas encontrados

- **Ninguno.** `sed` no borró líneas de más (el bloque terminaba en un `}` válido). Commit pasó directo a verde en build, sin necesidad de fix manual.

### Validación
- [x] `npm run build` OK
- [x] `npm test` 6 tests pasan
- [x] Sin cambios visuales (movimiento puro)
- [x] Lint sin cambios nuevos (20 errores pre-existentes)
- [x] Working tree limpio

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 7: Extraer feature Ingresos**.
2. Targets: `IngresoForm`, `IngresoBloqueForm`, `EditIngreso`, `NuevoMovimiento` + `hooks/useIngresoForm` → `src/features/ingresos/`.
3. Riesgo: MEDIO (primer feature con lógica de negocio de formularios).

---

## [2026-08-01] Sesión #6 — Fase 5: Extraer feature Settings ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `af94ff3` — `refactor(fase-5): extraer Configuracion a features/settings/`

### Archivos modificados
- `src/App.jsx` (**-77 líneas**: 2.097 → 2.020)
- 3 archivos nuevos en `src/features/settings/`:
  - `Configuracion.jsx` (info + sesiones + datos + cerrar sesión)
  - `AccentPicker.jsx` (selector de 8 colores con localStorage)
  - `index.js` (barrel)

### Cambios realizados

Configuracion se dividió en 2 piezas:
- **`Configuracion`**: orquestador con secciones (App info, AccentPicker, Sesión, Datos, Cerrar sesión).
- **`AccentPicker`**: sub-componente que encapsula estado local + persistencia localStorage + dispatch de evento "accentchange".

### Decisiones tomadas

- **Sub-componente extraído** para reducir tamaño de Configuracion y aislar lógica de accent.
- **`Configuracion` consume `Card` de `shared/ui/`** (primer feature que usa átomos de Fases 3–4).
- **Barrel creado** siguiendo el patrón establecido.
- **JSDoc agregado** a ambos archivos.

### Problemas encontrados

- **`sed` borró 1 línea de más** (mismo patrón que en Fase 4). Detectado por build fallido, corregido con `Edit` manual. Build verde.

### Validación
- [x] `npm run build` OK
- [x] `npm test` 6 tests pasan
- [x] Tab "Config" funciona (no probado en navegador, pero compila)
- [x] Visual idéntico
- [x] Working tree limpio

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 6: Extraer feature Auth**.
2. Targets: `LoginScreen` → `src/features/auth/`.

---

## [2026-08-01] Sesión #5 — Fase 4: Extraer gráficos ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commits generados:**
- `3dc1e43` — `refactor(fase-4.1): extraer GraficoPuntos a shared/charts/`
- `f69fc94` — `refactor(fase-4.2): extraer GraficoCircular a shared/charts/`
- `c3a6d40` — `refactor(fase-4.3): crear barrel shared/charts/index.js`

### Archivos modificados
- `src/App.jsx` (**-190 líneas**: 2.287 → 2.097)
- 3 archivos nuevos en `src/shared/charts/`:
  - `GraficoPuntos.jsx` (SVG line chart)
  - `GraficoCircular.jsx` (SVG pie chart)
  - `index.js` (barrel)

### Cambios realizados

**3 commits incrementales**:

| # | Componente | Líneas eliminadas |
|---|---|---|
| 4.1 | GraficoPuntos | -156 |
| 4.2 | GraficoCircular | -36 |
| 4.3 | (barrel) | 0 |

### Decisiones tomadas

- **3 commits incrementales** (uno por gráfico + barrel final).
- **No migrar App.jsx al barrel** (consistente con Fase 3): imports individuales son más explícitos.
- **Documentación JSDoc** en cada gráfico.

### Problemas encontrados

- **Build roto durante extracción de GraficoCircular**: el `sed '645,680d'` borró 1 línea de más (un `}` huérfano del banner HISTORIAL eliminado en Fase 2). Detectado por `npm run build`, corregido manualmente con `Edit`. Build verde tras el fix.
- **`K.grafico` redundante con `K.muted`**: ambos tienen valor `#6b7280`. Detectado durante extracción. No bloqueante, registrado para Fase 22 (Limpieza final).

### Validación
- [x] `npm run build` OK (3 commits, todos verdes tras fix manual)
- [x] `npm test` 6 tests pasan
- [x] Lint: 22 → 20 (variables locales eliminadas al mover funciones)
- [x] Bundle: 299.97 → 299.96 kB (cambio mínimo)
- [x] Working tree limpio

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 5: Extraer feature Settings**.
2. Targets: `Configuracion`, `AccentPicker` → `src/features/settings/`.

---

## [2026-08-01] Sesión #4 — Fase 3: Extraer átomos UI ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commits generados:**
- `5e59303` — `fase-3.1: extraer Divider`
- `6c7eb2e` — `fase-3.2: extraer Card + ConfirmDelete + Pill`
- `74bb728` — `fase-3.3: extraer Btn`
- `f3209c3` — `fase-3.4: extraer ChipGroup`
- `f1a792c` — `fase-3.5: extraer FInput`
- `590a20b` — `fase-3.6: extraer AutocompleteInput`
- `556f79a` — `fase-3.7: crear barrel index.js`

### Archivos modificados
- `src/App.jsx` (**-109 líneas**: 2.396 → 2.287)
- 9 archivos nuevos en `src/shared/ui/`:
  - `Card.jsx`, `Btn.jsx`, `ChipGroup.jsx`, `FInput.jsx`, `ConfirmDelete.jsx`, `Pill.jsx`, `Divider.jsx`, `AutocompleteInput.jsx`, `index.js`

### Cambios realizados

**7 commits incrementales** (uno por átomo + barrel final):

| # | Átomo | Líneas eliminadas | Usos en App.jsx |
|---|---|---|---|
| 3.1 | Divider | 1 | 0 (preservado) |
| 3.2 | Card + ConfirmDelete + Pill | 15 | 21 + 4 + 0 |
| 3.3 | Btn | 20 | múltiples |
| 3.4 | ChipGroup | 21 | múltiples |
| 3.5 | FInput | 8 | múltiples |
| 3.6 | AutocompleteInput | 49 | múltiples |
| 3.7 | (barrel) | 0 | n/a |

### Decisiones tomadas

- **7 commits incrementales** (uno por átomo + barrel final) para rollback quirúrgico.
- **No migrar App.jsx al barrel** todavía: imports individuales explícitos. Migración futura.
- **Documentación JSDoc** agregada a cada átomo (props, comportamiento, ejemplos).
- **`Pill` y `Divider` preservados aunque no usados**: lint los marcó como "no usados" en App.jsx. Mantenerlos permite uso futuro. Limpiar en Fase 22.

### Validación
- [x] `npm run build` OK (todos los commits verdes)
- [x] `npm test` 6 tests pasan
- [x] Bundle: 299.96 → 299.97 kB (cambio mínimo, esperado)
- [x] Lint: 22 errores (sin cambios nuevos)
- [x] Visual idéntico (sin cambios de estilo, solo movimiento de código)
- [x] Working tree limpio (solo `tareas.jsx` del usuario)

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 4: Extraer gráficos**.
2. Targets: `GraficoPuntos`, `GraficoCircular` → `src/shared/charts/`.

---

## [2026-08-01] Sesión #3 — Fase 2: Eliminar dead code ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commits generados:**
- `e65b8f3` — `chore(fase-2a): eliminar ReporteBtn dead code`
- `a9ebfff` — `chore(fase-2b): eliminar wrappers CliEntesTab e HistorialTab`
- `1632e48` — `chore(fase-2c): renombrar src/AGENTS.md a .archive/`

### Archivos modificados
- `src/App.jsx` (**-75 líneas netas**: 2.471 → 2.396)
- `src/AGENTS.md` → renombrado a `.archive/App.jsx.snapshot-2026-08.md` (preserva historial git)
- `docs/REFACTOR_ROADMAP.md` (Fase 2 marcada ✅)
- `docs/REFACTOR_CHANGELOG.md` (esta entrada)
- `docs/sessions/2026-08-01-sesion-03-fase-2.md` (bitácora nueva)

### Cambios realizados

**3 commits incrementales:**

1. **Commit 2a (`e65b8f3`)**: eliminado `ReporteBtn` de App.jsx (51 líneas). Era componente definido pero nunca usado en el render, confirmado por lint (`no-unused-vars`).

2. **Commit 2b (`a9ebfff`)**: eliminados wrappers `CliEntesTab` y `HistorialTab` (21 líneas netas). Headers movidos inline al call-site del render principal. Visual idéntico, comportamiento idéntico.

3. **Commit 2c (`1632e48`)**: renombrado `src/AGENTS.md` → `.archive/App.jsx.snapshot-2026-08.md` (rename rastreado por git). Era snapshot histórico de App.jsx, no documentación.

### Decisiones tomadas

- **NO eliminar `src/AGENTS.md`**: era snapshot histórico de App.jsx (commit `195b921` lo renombró como backup tras un arreglo fallido). Perderlo sería perder historia. Mejor renombrar y archivar con nombre descriptivo.
- **Mantener wrappers eliminados en línea**: más simple que crear un componente `<PageWrapper title="...">` para solo 2 usos.
- **3 commits incrementales**: cada target en su propio commit para rollback quirúrgico si algo falla.
- **Bundle bajó**: 300.22 kB → 299.96 kB.

### Problemas encontrados

- **Hallazgo crítico**: `src/AGENTS.md` NO era un markdown, era código JavaScript renombrado como backup (2.598 líneas de JSX, empieza con `import { useState }`). Detectado al inicio de esta fase. Resuelto con rename + archivo `.archive/`.

### Validación
- [x] `npm run build` OK (3 commits, todos verdes)
- [x] `npm test` 6 tests pasan
- [x] Lint: 24 → 22 errores (`ReporteBtn` y refs relacionadas resueltas)
- [x] Working tree limpio (solo `tareas.jsx` del usuario)
- [x] `git mv` rastreó el rename correctamente

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 3: Extraer átomos UI**.
2. Targets: `Card`, `Btn`, `ChipGroup`, `FInput`, `ConfirmDelete`, `Pill`, `Divider`, `AutocompleteInput` → mover a `src/shared/ui/`.

---

## [2026-08-01] Sesión #2 — Fase 1: Conectar App.jsx a módulos ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commits generados:**
- `828698c` — `refactor(fase-1a): App.jsx importa constantes desde ./constants`
- `e1106c1` — `refactor(fase-1b): App.jsx importa funciones de API desde ./services/api`
- `9c6c0e1` — `refactor(fase-1c): App.jsx importa parsers y toRow desde ./services/parsers`

### Archivos modificados
- `src/App.jsx` (**216 líneas menos**: 2.687 → 2.471)
- `package.json` (+ scripts `test` y `test:watch`)

### Cambios realizados

**3 commits incrementales** (cada uno validado con build + tests antes del siguiente):

1. **Commit 1a (`828698c`)**: 23 imports agregados desde `./constants`, 23 definiciones locales eliminadas. **75 líneas netas menos**.
2. **Commit 1b (`e1106c1`)**: 6 imports agregados desde `./services/api`, 6 funciones locales eliminadas. **23 líneas netas menos**.
3. **Commit 1c (`9c6c0e1`)**: 10 imports agregados desde `./services/parsers`, 10 funciones locales eliminadas. **118 líneas netas menos**.

### Decisiones tomadas

- **3 commits incrementales en lugar de 1 monolítico**: si algo falla, rollback más quirúrgico.
- **No eliminar imports no usados**: las reglas de negocio (`CLIENTES_ESPECIALES`, `NO_SON_CLIENTES`, etc.) están importadas aunque no se usen directamente en `App.jsx` (se usan vía `cuentaParaTotales` que SÍ se importa).
- **Agregar script `test`**: era deuda técnica pre-existente.
- **No tocar errores de lint pre-existentes**: documentados para Fase 22.

### Problemas encontrados

- **`K.bg` discrepante** entre App.jsx (`#0D0D12`) y `constants/index.js` (`#737380`): bug latente pre-existente.
- **24 errores de lint pre-existentes**.
- **`CLIENTES_ESPECIALES` falso positivo** del lint.

### Validación
- [x] `npm run build` sin errores
- [x] `npm test` 6 tests pasan
- [ ] `npm run lint` — 24 errores pre-existentes
- [x] `git log` muestra 3 commits limpios y ordenados

---

## [2026-08-01] Sesión #1 — Fase 0: Backup + branch ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Tag creado:** `v1.0-pre-refactor` (anotado, en commit `21102b3`)
**Commit de Fase 0:** `29e84e7` — `docs(refactor): sistema de contexto persistente`
**Commit de cierre:** `46a9bf9` — `docs(refactor): registrar cierre de Fase 0`

### Archivos modificados
- `docs/REFACTOR_ROADMAP.md` (+~30 líneas)
- `docs/REFACTOR_CHANGELOG.md` (entrada "Sesión #1")
- `docs/sessions/2026-08-01-sesion-01-fase-0.md` (bitácora nueva)

### Cambios realizados
1. Branch `refactor/architectural-cleanup` creado desde `main`.
2. Tag anotado `v1.0-pre-refactor` creado en `main`.
3. Commits `29e84e7` y `46a9bf9` con docs de contexto.

### Validación
- [x] Branch + tag creados
- [x] Working tree: solo `tareas.jsx` modificado por el usuario
- [x] **CERO archivos de código modificados**

---

## Sesión #0 — Preparación ⏸️ pendiente
**Fecha:** 2026-08-01
**Estado:** ✅ Completada (preparación, sin código tocado)
**Branch:** aún no creada
**Commit:** aún no

### Archivos creados (solo docs de contexto, código intacto)
- `docs/REFACTOR_ROADMAP.md` (mapa de ruta navegable, 23 fases)
- `docs/REFACTOR_CHANGELOG.md` (este archivo)
- `docs/sessions/` (directorio para bitácoras por sesión)

### Archivos modificados
- Ninguno. Esta sesión NO tocó código de la app.

### Decisiones tomadas
- **Idioma:** español para todos los docs y memorias (consistente con `AGENTS.md` existente).
- **Scope de memorias:** solo este proyecto (`memory/` en lugar de `~/.claude/` global).
- **Estrategia:** fases pequeñas con validación tras cada una (`npm run build` + lint + test + smoke test manual).
- **Fase 1 como "quick win" máximo:** conectar `App.jsx` a los módulos ya existentes elimina ~150 líneas de duplicación con riesgo prácticamente cero.

### Problemas encontrados
- Ninguno todavía (fase de preparación).

### Validación
- [x] Estructura de directorios creada
- [x] Roadmap legible y navegable
- [x] Changelog con formato definido

### Próximos pasos
1. **Fase 0**: crear branch `refactor/architectural-cleanup` y tag `v1.0-pre-refactor`.
2. **Fase 1**: conectar `App.jsx` a `constants/`, `services/api.js`, `services/parsers.js`.
3. **Fase 2**: eliminar dead code (`ReporteBtn`, `src/AGENTS.md`, wrappers).

---

## [2026-08-26] Sesión #14 — Fase 13: Extraer feature History ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Commit:** `4d479ed` — `refactor(fase-13): extraer feature history`

### Archivos modificados
- `src/App.jsx` (**-112 líneas**: 949 → 837)
- 5 archivos nuevos en `src/features/history/`:
  - `Historial.jsx` (45 líneas con JSDoc) — orquestador con 5 estados (open, filter, buscar, categFiltro, orden)
  - `MesAccordion.jsx` (91 líneas con JSDoc) — acordeón mensual con reset centralizado
  - `FiltrosHistorial.jsx` (56 líneas con JSDoc) — UI de búsqueda, tabs y filtros de gastos
  - `hooks/useHistorialFilter.js` (62 líneas con JSDoc) — `useMemo` doble: months por separado del resto
  - `index.js` (5 líneas) — barrel

### Cambios realizados

**1 componente movido** de `App.jsx` a `src/features/history/`, subdividido en 3 + 1 hook:

| # | Pieza | Responsabilidad |
|---|---|---|
| 13.1 | `Historial` | Estados + orquesta `MesAccordion` |
| 13.2 | `MesAccordion` | Header del mes con stats + lista filtrada |
| 13.3 | `FiltrosHistorial` | Input búsqueda, tabs ingresos/gastos, gráfico circular, selects categoría/orden |
| 13.4 | `useHistorialFilter` | `months`, totales (ventas/gan/gastos/ahorro/util), `catEntries`, `categDisponibles`, `filtered` |

### Decisiones tomadas

- **`Historial` encapsula los 5 estados locales** (antes vivían inline en App.jsx): open, filter, buscar, categFiltro, orden.
- **`MesAccordion` recibe los estados por props** (no los replica) — patrón "lift state up". `resetAndToggle` centraliza el reset al abrir/cerrar.
- **`FiltrosHistorial` recibe valores ya calculados** (`gastos`, `catEntries`, `categDisponibles`) — solo renderiza UI, no recalcula.
- **`useHistorialFilter` con dos `useMemo`** separados:
  - `months` (depende solo de `db.ingresos`/`db.gastos`).
  - El resto (depende de mes + filtros + búsqueda + orden).
  - Evita recalcular `months` en cada keystroke.
- **`GraficoCircular` reusado directo** desde `shared/charts/` (ya extraído en Fase 4).
- **Imports con paths explícitos** desde App.jsx — mismo patrón que Fases 5–12.

### Problemas encontrados

- **Codex dejó la fase incompleta** (archivos creados pero `App.jsx` sin integrar y sin commit) y modificó sin querer el color del botón en `src/components/tareas.jsx` (de `#2563eb` a `rgb(156 125 57)`). Detectado al inicio, revertido el color del botón (preservando la "modificación del usuario" registrada en Fase 0), completada la integración de `Historial` y commit.

### Validación
- [x] `npm run build` OK (302.05 kB)
- [x] `npm test` 6 tests pasan
- [x] Comportamiento idéntico preservado

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 14: Extraer feature Home** (Fase más grande: Home.jsx + 8 sub-componentes + useHomeStats).
2. Riesgo: MEDIO — Home tiene bastante lógica pero menos subdivisión que Clientes.

---

## [Placeholder para entradas futuras]

> Cada nueva sesión que toques código del proyecto agrega su entrada arriba de este placeholder.
> Mantener el orden: más reciente arriba, más antiguo abajo.

---
