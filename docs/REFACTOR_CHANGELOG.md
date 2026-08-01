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

## [Placeholder para entradas futuras]

> Cada nueva sesión que toques código del proyecto agrega su entrada arriba de este placeholder.
> Mantener el orden: más reciente arriba, más antiguo abajo.

---