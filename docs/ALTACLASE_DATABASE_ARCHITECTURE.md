# ALTACLASE_DATABASE_ARCHITECTURE.md

## Arquitectura de Base de Datos - ALTACLASE

Documento oficial de arquitectura para la nueva aplicación ALTACLASE después de la refactorización.

## 1. Fuente de verdad

La nueva aplicación utilizará Supabase PostgreSQL como única fuente de información.

El sistema anterior dependía de Google Sheets con hojas separadas para:
- ventas
- clientes
- gastos
- inventario
- tareas
- reportes

La nueva arquitectura centraliza la operación mediante tablas relacionadas.

---

# 2. Análisis del esquema actual Supabase

Tablas existentes detectadas:

| Tabla | Función |
|---|---|
| clientes | Información de compradores |
| ventas | Registro de ventas realizadas |
| pagos | Abonos y pagos de clientes |
| gastos | Salidas de dinero |
| categorias_gastos | Clasificación de gastos |
| inventario | Productos disponibles |
| movimientos_inventario | Historial de entradas y salidas |
| movimientos_caja | Control financiero central |
| comisiones | Comisiones generadas |
| ocasionales | Ingresos extraordinarios |
| deudas_personales | Obligaciones personales |

---

# 3. Módulo eliminado

## CLIENTES ESPECIALES

La hoja antigua:

`CLIENTES ESPECIALES`

NO existirá en la nueva aplicación.

No se debe crear:

- tabla clientes_especiales
- componentes frontend relacionados
- servicios relacionados
- lógica de negocio relacionada

Motivo:

La funcionalidad se reemplaza mediante la relación normal:

Cliente → Venta → Pago → Movimiento de caja

Esto evita tener un flujo financiero paralelo.

---

# 4. Modelo financiero principal

## Clientes

Representan compradores del negocio.

Relaciones:

clientes
↓
ventas
↓
pagos

---

## Ventas

Cada venta debe almacenar:

- cliente
- producto
- proveedor
- costo
- precio venta
- ganancia
- estado
- fecha

Estados:

- pagada
- debe
- abono

---

## Pagos

Los pagos modifican automáticamente el estado financiero de una venta.

Reglas:

Pago total:
```
estado = pagada
```

Pago parcial:
```
estado = abono
```

Sin pago:
```
estado = debe
```

---

# 5. Control de caja

La tabla movimientos_caja será el libro financiero principal.

Todo movimiento económico debe generar registro:

## Entradas

- ventas pagadas
- pagos recibidos
- ingresos ocasionales
- comisiones

## Salidas

- gastos
- compras inventario
- ajustes financieros

Nunca modificar saldos manualmente.

---

# 6. Inventario

El inventario debe manejar:

Producto disponible:

inventario

Historial:

movimientos_inventario

Ejemplo:

Compra producto:

Inventario aumenta.

Venta producto:

Inventario disminuye.

---

# 7. Gastos

Migración desde hoja:

GASTOS

Nueva estructura:

gastos
+
categorias_gastos
+
movimientos_caja

Cada gasto debe afectar caja automáticamente.

---

# 8. Migración desde Excel actual

Hojas analizadas:

- RESUMEN MENSUAL
- DEUDA VALEN
- CLIENTES
- INGRESOS
- TAREAS
- GASTOS
- REPORTE CLIENTE
- CLIENTES ESPECIALES
- INVENTARIO

Migrar:

✓ CLIENTES  
✓ INGRESOS → ventas  
✓ pagos/deudas existentes  
✓ GASTOS  
✓ INVENTARIO  
✓ TAREAS  

No migrar:

✗ CLIENTES ESPECIALES

---

# 9. Reglas de desarrollo

## Ningún módulo financiero debe trabajar aislado.

Ejemplo correcto:

Venta:
```
ventas
↓
movimiento_caja
↓
reportes
```

Pago:
```
pagos
↓
actualización venta
↓
movimiento_caja
```

Gasto:
```
gastos
↓
movimiento_caja
```

---

# 10. Objetivo de la arquitectura

La base debe permitir:

- múltiples usuarios
- control financiero real
- auditoría completa
- reportes automáticos
- crecimiento del negocio
- separación clara de módulos

Esta estructura será la base oficial para la refactorización ALTACLASE.
