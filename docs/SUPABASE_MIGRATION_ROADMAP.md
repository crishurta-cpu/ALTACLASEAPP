# 🗺️ ROADMAP — MIGRACIÓN A SUPABASE

> Índice vivo de la migración de Altaclase Bodega de Google Sheets a Supabase PostgreSQL.
> Es un roadmap **separado** de `REFACTOR_ROADMAP.md` (ese es sobre la app actual contra Sheets, ya en Fase 22/23). Esta migración es la iniciativa **futura** que `docs/ALTACLASE_DATABASE_ARCHITECTURE.md` describía como "aún no iniciada" — arrancó el 2026-09-15.

---

## 📊 ESTADO GLOBAL

| Métrica | Valor |
|---|---|
| Fase actual | **M3 (parcial) — Tablas de mapeo pendientes creadas** ✅ |
| Próxima fase | **M2 — Autenticación real (Supabase Auth)** |
| Estado | 🟢 Cliente conectado. Mapeo de DEUDA VALEN y TAREAS resuelto y aplicado. Entrando a implementar login real. |

---

## 🎯 DECISIONES YA TOMADAS (no reabrir sin razón nueva)

1. **Proyecto Supabase: `ALTAREFACTORIZADA`** (ref `ipekysprglakoxblzxqg`), NO `ALTACLASE APP` (ref `nsswmdwybpcjjpueeqop`, que tenía un esquema en español sin RLS — se descarta, ver análisis de Fase M0 más abajo).
2. **Esquema: el que ya existía en inglés** (`customers`, `orders`, `order_items`, `products`, `suppliers`, `purchases`, `payments`, `expenses`, `other_income`, `transfers`, `organizations`, `organization_members` + 8 vistas). Ganó sobre el esquema español de `BASE DE DATOS COPIA.sql` por: RLS ya activo con políticas `is_org_member`, modelo de pagos parciales (`v_order_balances`) que resuelve el hack actual de `registrarAbono`, `expenses.type` unifica gasto negocio/personal, `customers.credit_enabled` encaja con la decisión ya tomada sobre Bayron/Marco/Marcos (dejan de tener caja propia, quedan como clientes normales con un flag distintivo).
3. **Una sola organización** ("Altaclase Bodega"), un solo `organization_member` (owner) — negocio de un solo operador, no se necesita multi-tenant real hoy (aunque el esquema ya lo soporta si algún día hace falta).
4. **`webaltaclase` (catálogo mayorista) NO comparte esta organización por ahora** — decisión reversible, no descartada para el futuro, pero no se diseña nada especial para eso todavía.
5. **Login: email + contraseña** vía Supabase Auth (reemplaza `CLAVE_ACCESO` hardcodeada).
6. **`BASE DE DATOS COPIA.sql`, `docs/ALTACLASE_DATABASE_ARCHITECTURE.md` y el proyecto `ALTACLASE APP`** quedan como referencia histórica del análisis — no se usan ni se tocan más.

---

## 📋 FASES

### Fase M0 — Descubrimiento y decisión de esquema ✅
**Qué se hizo:**
- Se encontraron 3 proyectos Supabase en la organización: `ALTACLASE APP` (pausado, esquema español sin RLS), `ALTAREFACTORIZADA` (pausado, esquema inglés con RLS completo), `WEB ALTACLASE` (activo — pertenece al otro proyecto, `webaltaclase`, no se toca).
- Se reactivó `ALTAREFACTORIZADA` desde el dashboard (acción del usuario) y se vinculó con `supabase link --project-ref ipekysprglakoxblzxqg`.
- Se comparó el esquema español (`BASE DE DATOS COPIA.sql`, 11 tablas, sin RLS, sin auth) contra el esquema inglés ya existente en `ALTAREFACTORIZADA` (12 tablas + 8 vistas, RLS completo con `is_org_member(organization_id)`, función `create_organization()` para onboarding, triggers de validación de pagos y `updated_at`).
- **Se recomendó y confirmó usar el esquema inglés** — es objetivamente más maduro: seguridad ya resuelta, modelo de pagos parciales ya resuelto, y encaja con la decisión ya tomada de eliminar la caja paralela de clientes especiales.

**Tablas y vistas del esquema elegido:**
```
organizations, organization_members          — multi-tenant (1 sola org en uso)
customers                                     — id, organization_id, name, document_number,
                                                 phone, address, city, notes, credit_enabled
suppliers                                     — id, organization_id, name, phone, city, notes
products                                      — id, organization_id, name, brand, default_size,
                                                 default_sale_price, active
orders, order_items                           — una orden puede tener varios productos
purchases                                     — compras a proveedores (product_id, supplier_id)
payments                                      — abonos/pagos de una orden (valida monto con trigger)
expenses                                      — type: 'business' | 'personal'
other_income                                  — type: 'commission' | 'occasional' | 'other' | 'loan'
transfers                                     — direction: 'business_to_personal' | 'personal_to_business'

Vistas: v_order_totals, v_order_profitability, v_order_balances (paid/balance/payment_status),
        v_customer_balances, v_monthly_business, v_monthly_personal, v_financing, v_business_summary
```

**Funciones clave:**
- `create_organization(p_name text) returns uuid` — `SECURITY DEFINER`, crea la organización + membership `owner` para `auth.uid()`. Es el paso de onboarding tras el primer signup.
- `is_org_member(p_organization_id uuid) returns boolean` — usado por todas las políticas RLS.

---

### Fase M1 — Conexión base ✅
**Archivos nuevos:**
- `.env.local` (gitignorado, ya en `*.local`) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (clave `publishable`, segura para el bundle).
- `.env.example` — plantilla sin valores reales, con el comando para obtenerlos.
- `src/services/supabase/client.js` — cliente único (`createClient`), lanza error claro si faltan las env vars.
- Dependencia nueva: `@supabase/supabase-js`.

**Validación:**
- [x] `.env.local` confirmado ignorado por git (`git check-ignore -v .env.local`).
- [ ] Falta probar el cliente en el navegador (Fase M2, junto con el login).

**Decisiones:**
- Se usó la clave `publishable` (`sb_publishable_...`), NO la `secret`/`service_role` — esa nunca debe vivir en el bundle del navegador. Toda escritura pasa por RLS con el usuario autenticado.
- No se tocó `AuthProvider.jsx`/`DataProvider.jsx` todavía — la app en vivo sigue funcionando 100% contra Sheets hasta que Fase M2+ esté lista y probada.

---

### Fase M2 — Autenticación real (Supabase Auth) ⏸️
**Objetivo:** Reemplazar `CLAVE_ACCESO` por login real (email + contraseña) y resolver el onboarding de la organización.
**Cambios previstos:**
- Nuevo `src/features/auth/SupabaseLoginScreen.jsx` (o adaptar `LoginScreen.jsx`): formulario de signup/login con `supabase.auth.signUp`/`signInWithPassword`.
- Tras el primer signup exitoso: si el usuario no tiene `organization_members`, llamar `create_organization('Altaclase Bodega')` una sola vez.
- Nuevo hook `useOrganization()` (o extender `AuthProvider`) para exponer `organizationId` una vez resuelto — todas las queries a Supabase necesitan filtrar por él (aunque RLS ya protege, conviene no depender solo de eso para las queries del cliente).
- **No se toca `AuthProvider` de Sheets todavía** — se construye en paralelo, se decide el cutover en Fase M5.

**Validación pendiente:**
- [ ] Signup crea el usuario en Supabase Auth.
- [ ] `create_organization` se llama una sola vez (no duplica organización en logins subsecuentes).
- [ ] Login persiste sesión (Supabase maneja su propio storage, no `localStorage` manual como hoy).
- [ ] Logout limpia sesión de Supabase correctamente.

---

### Fase M3 — Capa de servicios Supabase ⏸️
**Objetivo:** Mirror del patrón `services/sheets/*.service.js` pero contra Supabase.
**Archivos previstos:** `src/services/supabase/customers.service.js`, `orders.service.js`, `expenses.service.js`, `products.service.js`, `suppliers.service.js`, `purchases.service.js`, `otherIncome.service.js`, `transfers.service.js` — mismo patrón `readAll/append/update/remove` donde aplique, usando `supabase.from(tabla)...`.
**Mapeo de campos pendiente de decidir** (Sheets → Supabase), por dominio:
- INGRESOS → `orders` + `order_items` (una fila de Sheets = una orden con 1 item, salvo que se decida agrupar).
- GASTOS → `expenses` (`type='business'`).
- DEUDA VALEN → **decidido 2026-09-18**: tabla nueva `personal_loans` (una fila por prestamista/deuda) + columna `loan_id` en `other_income` y `expenses` para enlazar cada movimiento. Un préstamo recibido se registra en `other_income` (`type='loan'`, ya excluido de la ganancia en `v_monthly_business`, solo suma en `v_financing`). Un pago se registra en `expenses` (`type='personal'`, ya sumado en `v_monthly_personal`). Vista nueva `v_personal_loan_balances` calcula el saldo restante por deuda (`total_borrowed - total_paid`). Migración: `supabase/migrations/20260918000000_personal_loans_and_tasks.sql`.
- CLIENTES → `customers`; `CLIENTES_ESPECIALES` (Bayron/Marco/Marcos) → `customers.credit_enabled = true`, sin tabla aparte.
- INVENTARIO → `products` + `purchases`.
- TAREAS → **decidido 2026-09-18**: tabla nueva `tasks` (`title`, `done`, `organization_id`) en el mismo proyecto Supabase, mismo patrón RLS que el resto. Migración: `supabase/migrations/20260918000000_personal_loans_and_tasks.sql`.

---

### Fase M4 — Migración de datos reales ⏸️
**Objetivo:** Mover los datos reales del negocio de Sheets a Supabase.
**Riesgo:** ALTO — datos financieros reales, requiere validación exhaustiva antes y después.
**Pendiente de decidir antes de escribir el script:**
- Mapeo exacto de DEUDA VALEN (ver Fase M3).
- Qué pasa con `TAREAS` (sin tabla en el esquema elegido).
- Orden de inserción respetando FKs: `customers`/`suppliers`/`products` primero, luego `orders`+`order_items`, luego `payments`, `purchases`, `expenses`, `other_income`, `transfers`.
- Estrategia de validación: comparar totales (suma de ventas, gastos, deuda pendiente) entre Sheets y Supabase antes de dar la migración por buena.

---

### Fase M5 — Cutover ⏸️
**Objetivo:** La app deja de leer/escribir Sheets y pasa a usar Supabase como fuente de verdad.
**Estrategia:** por decidir — ¿corte total, o correr ambos en paralelo un tiempo con Sheets de respaldo?

---

### Fase M6 — Retiro de Sheets ⏸️
**Objetivo:** Una vez validado el cutover en producción por un tiempo razonable, retirar el código de `services/api.js`, `services/sheets/`, y el Apps Script deja de recibir escrituras (puede quedar de solo lectura como respaldo histórico).

---

## 🧭 CÓMO CONTINUAR DESDE UNA SESIÓN NUEVA

1. Leer este archivo primero — dice en qué fase se quedó la migración.
2. Leer también `REFACTOR_ROADMAP.md` — la app sobre Sheets sigue siendo la que corre en producción hasta Fase M5.
3. Antes de escribir código de una fase nueva, confirmar con el usuario cualquier decisión de mapeo de datos que no esté ya en la sección "Decisiones ya tomadas".

---

*Mantener sincronizado con cada cambio relevante de esta migración.*
