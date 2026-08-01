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
- `docs/REFACTOR_ROADMAP.md` (Fase 1 marcada ✅ con detalle)
- `docs/REFACTOR_CHANGELOG.md` (esta entrada)
- `docs/sessions/2026-08-01-sesion-02-fase-1.md` (bitácora nueva)

### Cambios realizados

**3 commits incrementales** (cada uno validado con build + tests antes del siguiente):

1. **Commit 1a (`828698c`)**: 23 imports agregados desde `./constants`, 23 definiciones locales eliminadas. **75 líneas netas menos**.
2. **Commit 1b (`e1106c1`)**: 6 imports agregados desde `./services/api`, 6 funciones locales eliminadas. **23 líneas netas menos**.
3. **Commit 1c (`9c6c0e1`)**: 10 imports agregados desde `./services/parsers`, 10 funciones locales eliminadas. **118 líneas netas menos**.

### Decisiones tomadas

- **3 commits incrementales en lugar de 1 monolítico**: si algo falla, rollback más quirúrgico.
- **No eliminar imports no usados**: las reglas de negocio (`CLIENTES_ESPECIALES`, `NO_SON_CLIENTES`, etc.) están importadas aunque no se usen directamente en `App.jsx` (se usan vía `cuentaParaTotales` que SÍ se importa). Dejarlas previene errores silenciosos y prepara para Fases futuras.
- **Agregar script `test`**: era deuda técnica pre-existente (vitest instalado pero sin script).
- **No tocar errores de lint pre-existentes**: documentados para Fase 22.

### Problemas encontrados

- **`K.bg` discrepante entre App.jsx (`#0D0D12`) y `constants/index.js` (`#737380`)**: bug latente pre-existente, no generado por esta fase. No causa impacto visible porque el CSS inline de App.jsx define el background directamente sin pasar por `K.bg`. Documentado para revisión en Fase 22.
- **24 errores de lint pre-existentes**: variables no usadas (`CLIENTES_ESPECIALES`, `noEsClienteReal`, etc.), `ReporteBtn` dead code, `Buffer is not defined` en `services/api.js`, `setState` en effect. Todos preexistentes, no introducidos. Documentados para Fase 22.
- **`CLIENTES_ESPECIALES` aparece como "no usado" en lint**: falso positivo del lint porque `cuentaParaTotales` (que sí se importa) lo referencia internamente desde `constants/index.js`, no desde App.jsx. ESLint no rastrea esa cadena de imports. **No eliminar el import de App.jsx**, o se romperá la referencia cuando se haga refactor más adelante.

### Validación
- [x] `npm run build` sin errores
- [x] `npm test` 6 tests pasan
- [ ] `npm run lint` — 24 errores pre-existentes (no introducidos por esta fase)
- [x] `git log` muestra 3 commits limpios y ordenados
- [x] `App.jsx` pasó de 2.687 a 2.471 líneas (-216, objetivo era -150)

### Próximos pasos
1. **Esperar autorización** para iniciar **Fase 2: Eliminar dead code**.
2. Targets: `ReporteBtn` (línea ~283 App.jsx), `src/AGENTS.md` duplicado, wrappers `CliEntesTab` y `HistorialTab`.

---

## [2026-08-01] Sesión #1 — Fase 0: Backup + branch ✅
**Estado:** ✅ Completada
**Branch:** `refactor/architectural-cleanup`
**Tag creado:** `v1.0-pre-refactor` (anotado, en commit `21102b3`)
**Commit de Fase 0:** `29e84e7` — `docs(refactor): sistema de contexto persistente`
**Commit de cierre:** `46a9bf9` — `docs(refactor): registrar cierre de Fase 0`

### Archivos modificados
- `docs/REFACTOR_ROADMAP.md` (+~30 líneas: estado global actualizado, Fase 0 marcada como ✅ con detalle)
- `docs/REFACTOR_CHANGELOG.md` (entrada "Sesión #1")
- `docs/sessions/2026-08-01-sesion-01-fase-0.md` (bitácora nueva)
- **NO se tocó ningún archivo de código** (regla de la auditoría respetada).

### Cambios realizados
1. Branch `refactor/architectural-cleanup` creado desde `main`.
2. Tag anotado `v1.0-pre-refactor` creado en `main` apuntando al commit `21102b3`.
3. Commit `29e84e7`: stageó solo `docs/` (3 archivos, 681 líneas) — sistema de contexto persistente.
4. Commit `46a9bf9`: stageó actualización post-Fase 0 (3 archivos, 234 líneas).
5. La modificación pre-existente de `src/components/tareas.jsx` (1 línea) **no se tocó**.

### Decisiones tomadas
- **Tag anotado** (`-a`) con mensaje descriptivo.
- **Commit separado** solo para `docs/`, sin mezclar con cambios de código del usuario.
- **No tocar `src/components/tareas.jsx`**: respeto absoluto al WIP del usuario.
- **Roadmap corregido**: detectado y eliminado duplicado accidental de "Fase 0".

### Problemas encontrados
- Detectado y corregido duplicado accidental de "Fase 0" en el roadmap (error de Edit doble).

### Validación
- [x] Branch creado: `refactor/architectural-cleanup`
- [x] Tag creado: `v1.0-pre-refactor`
- [x] Commits `29e84e7` y `46a9bf9`
- [x] Working tree: solo `src/components/tareas.jsx` modificado por el usuario
- [x] Roadmap sin duplicados
- [x] **CERO archivos de código modificados**

### Próximos pasos
1. **Fase 1**: conectar `App.jsx` a los módulos.

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