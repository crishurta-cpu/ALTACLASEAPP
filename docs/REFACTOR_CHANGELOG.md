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

## Sesión #0 — Preparación ⏸️ pendiente
**Fecha:** 2026-08-01
**Estado:** 🔄 En progreso (solo docs de contexto, sin tocar código)
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