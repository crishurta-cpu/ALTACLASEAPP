


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE TYPE "public"."estado_deuda" AS ENUM (
    'pendiente',
    'pagada'
);


ALTER TYPE "public"."estado_deuda" OWNER TO "postgres";


CREATE TYPE "public"."estado_inventario" AS ENUM (
    'disponible',
    'vendido'
);


ALTER TYPE "public"."estado_inventario" OWNER TO "postgres";


CREATE TYPE "public"."estado_venta" AS ENUM (
    'pagada',
    'debe',
    'abono'
);


ALTER TYPE "public"."estado_venta" OWNER TO "postgres";


CREATE TYPE "public"."origen_caja" AS ENUM (
    'venta',
    'pago_cliente',
    'gasto',
    'inventario',
    'ocasional',
    'deuda',
    'comision',
    'manual'
);


ALTER TYPE "public"."origen_caja" OWNER TO "postgres";


CREATE TYPE "public"."tipo_comision" AS ENUM (
    'manejo_dinero',
    'compra_par',
    'diferencia_precio',
    'manual'
);


ALTER TYPE "public"."tipo_comision" OWNER TO "postgres";


CREATE TYPE "public"."tipo_movimiento_caja" AS ENUM (
    'entrada',
    'salida'
);


ALTER TYPE "public"."tipo_movimiento_caja" OWNER TO "postgres";


CREATE TYPE "public"."tipo_movimiento_inventario" AS ENUM (
    'entrada',
    'salida'
);


ALTER TYPE "public"."tipo_movimiento_inventario" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_estado_venta"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

declare

total_pagado numeric;

begin


select coalesce(sum(monto),0)

into total_pagado

from pagos

where venta_id = NEW.venta_id;



if total_pagado >= 
(
select precio_venta 
from ventas 
where id = NEW.venta_id
)

then

update ventas

set estado='pagada'

where id = NEW.venta_id;



elsif total_pagado > 0

then

update ventas

set estado='abono'

where id = NEW.venta_id;



else

update ventas

set estado='debe'

where id = NEW.venta_id;


end if;


return NEW;


end;

$$;


ALTER FUNCTION "public"."actualizar_estado_venta"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."caja_comision"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

begin


insert into movimientos_caja

(
tipo,
origen,
referencia_id,
descripcion,
entrada
)


values

(
'entrada',
'comision',
NEW.id,
NEW.concepto,
NEW.monto
);


return NEW;


end;

$$;


ALTER FUNCTION "public"."caja_comision"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."caja_compra_inventario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

begin


insert into movimientos_caja

(
tipo,
origen,
referencia_id,
descripcion,
salida
)


values

(
'salida',
'inventario',
NEW.id,
'Compra inventario ' || NEW.producto,
NEW.cantidad * NEW.costo_unitario
);



return NEW;


end;

$$;


ALTER FUNCTION "public"."caja_compra_inventario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."caja_gasto"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

begin


insert into movimientos_caja

(
tipo,
origen,
referencia_id,
descripcion,
salida
)


values

(
'salida',
'gasto',
NEW.id,
NEW.descripcion,
NEW.monto
);



return NEW;


end;

$$;


ALTER FUNCTION "public"."caja_gasto"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."caja_ocasional"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

begin


insert into movimientos_caja

(
tipo,
origen,
referencia_id,
descripcion,
entrada
)


values

(
'entrada',
'ocasional',
NEW.id,
NEW.concepto,
NEW.monto
);


return NEW;


end;

$$;


ALTER FUNCTION "public"."caja_ocasional"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."caja_pago_cliente"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

begin


insert into movimientos_caja

(
tipo,
origen,
referencia_id,
descripcion,
entrada
)


values

(
'entrada',
'pago_cliente',
NEW.id,
'Pago cliente',
NEW.monto
);



return NEW;


end;

$$;


ALTER FUNCTION "public"."caja_pago_cliente"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."descontar_inventario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$


declare

producto_id uuid;


begin


select id

into producto_id

from inventario

where producto = NEW.producto

and estado='disponible'

limit 1;



if producto_id is not null then


update inventario

set cantidad = cantidad - NEW.cantidad

where id = producto_id;



insert into movimientos_inventario

(
inventario_id,
tipo,
cantidad,
referencia_id,
descripcion
)


values

(
producto_id,
'salida',
NEW.cantidad,
NEW.id,
'Venta producto'
);



end if;



return NEW;


end;

$$;


ALTER FUNCTION "public"."descontar_inventario"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categorias_gastos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."categorias_gastos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nombre" "text" NOT NULL,
    "telefono" "text",
    "ciudad" "text",
    "notas" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comisiones" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fecha" timestamp without time zone DEFAULT "now"(),
    "concepto" "text",
    "tipo" "public"."tipo_comision" NOT NULL,
    "monto" numeric(12,2) NOT NULL,
    "referencia_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."comisiones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gastos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "categoria_id" "uuid",
    "fecha" timestamp without time zone DEFAULT "now"(),
    "descripcion" "text" NOT NULL,
    "monto" numeric(12,2) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."gastos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fecha_compra" timestamp without time zone DEFAULT "now"(),
    "producto" "text" NOT NULL,
    "descripcion" "text",
    "cantidad" integer NOT NULL,
    "costo_unitario" numeric(12,2) NOT NULL,
    "proveedor" "text",
    "estado" "public"."estado_inventario" DEFAULT 'disponible'::"public"."estado_inventario",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimientos_caja" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fecha" timestamp without time zone DEFAULT "now"(),
    "tipo" "public"."tipo_movimiento_caja" NOT NULL,
    "origen" "public"."origen_caja" NOT NULL,
    "referencia_id" "uuid",
    "descripcion" "text",
    "entrada" numeric(12,2) DEFAULT 0,
    "salida" numeric(12,2) DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."movimientos_caja" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ocasionales" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fecha" timestamp without time zone DEFAULT "now"(),
    "concepto" "text" NOT NULL,
    "categoria" "text",
    "monto" numeric(12,2) NOT NULL,
    "notas" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ocasionales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ventas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cliente_id" "uuid",
    "fecha" timestamp without time zone DEFAULT "now"(),
    "producto" "text" NOT NULL,
    "descripcion" "text",
    "cantidad" integer DEFAULT 1,
    "precio_venta" numeric(12,2) NOT NULL,
    "costo_producto" numeric(12,2) NOT NULL,
    "ganancia" numeric(12,2) GENERATED ALWAYS AS (("precio_venta" - "costo_producto")) STORED,
    "estado" "public"."estado_venta" DEFAULT 'debe'::"public"."estado_venta",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ventas" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_caja_actual" AS
 SELECT (COALESCE("sum"("entrada"), (0)::numeric) - COALESCE("sum"("salida"), (0)::numeric)) AS "caja_actual"
   FROM "public"."movimientos_caja";


ALTER VIEW "public"."vista_caja_actual" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_altaclase" AS
 SELECT ( SELECT "vista_caja_actual"."caja_actual"
           FROM "public"."vista_caja_actual") AS "caja_actual",
    ( SELECT "count"(*) AS "count"
           FROM "public"."ventas") AS "total_ventas",
    ( SELECT COALESCE("sum"("ventas"."ganancia"), (0)::numeric) AS "coalesce"
           FROM "public"."ventas") AS "utilidad_ventas",
    ( SELECT COALESCE("sum"("comisiones"."monto"), (0)::numeric) AS "coalesce"
           FROM "public"."comisiones") AS "ingresos_comisiones",
    ( SELECT COALESCE("sum"("ocasionales"."monto"), (0)::numeric) AS "coalesce"
           FROM "public"."ocasionales") AS "ingresos_ocasionales",
    ( SELECT COALESCE("sum"("gastos"."monto"), (0)::numeric) AS "coalesce"
           FROM "public"."gastos") AS "total_gastos",
    ( SELECT COALESCE("sum"((("inventario"."cantidad")::numeric * "inventario"."costo_unitario")), (0)::numeric) AS "coalesce"
           FROM "public"."inventario"
          WHERE ("inventario"."estado" = 'disponible'::"public"."estado_inventario")) AS "valor_inventario";


ALTER VIEW "public"."dashboard_altaclase" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deudas_personales" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "persona" "text" NOT NULL,
    "concepto" "text",
    "monto_inicial" numeric(12,2) NOT NULL,
    "saldo_actual" numeric(12,2) NOT NULL,
    "estado" "public"."estado_deuda" DEFAULT 'pendiente'::"public"."estado_deuda",
    "fecha" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."deudas_personales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimientos_inventario" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "inventario_id" "uuid",
    "tipo" "public"."tipo_movimiento_inventario" NOT NULL,
    "cantidad" integer NOT NULL,
    "fecha" timestamp without time zone DEFAULT "now"(),
    "referencia_id" "uuid",
    "descripcion" "text"
);


ALTER TABLE "public"."movimientos_inventario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venta_id" "uuid",
    "cliente_id" "uuid",
    "fecha" timestamp without time zone DEFAULT "now"(),
    "monto" numeric(12,2) NOT NULL,
    "metodo_pago" "text",
    "notas" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."pagos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_cartera_clientes" AS
 SELECT "c"."id" AS "cliente_id",
    "c"."nombre",
    "count"("v"."id") AS "ventas_pendientes",
    ("sum"("v"."precio_venta") - COALESCE("sum"("p"."total_pagado"), (0)::numeric)) AS "saldo_pendiente"
   FROM (("public"."clientes" "c"
     JOIN "public"."ventas" "v" ON (("v"."cliente_id" = "c"."id")))
     LEFT JOIN ( SELECT "pagos"."venta_id",
            "sum"("pagos"."monto") AS "total_pagado"
           FROM "public"."pagos"
          GROUP BY "pagos"."venta_id") "p" ON (("p"."venta_id" = "v"."id")))
  WHERE ("v"."estado" <> 'pagada'::"public"."estado_venta")
  GROUP BY "c"."id", "c"."nombre";


ALTER VIEW "public"."vista_cartera_clientes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_comisiones" AS
 SELECT "tipo",
    "sum"("monto") AS "total"
   FROM "public"."comisiones"
  GROUP BY "tipo";


ALTER VIEW "public"."vista_comisiones" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_gastos_categoria" AS
 SELECT "cg"."nombre",
    "sum"("g"."monto") AS "total_gastado"
   FROM ("public"."gastos" "g"
     JOIN "public"."categorias_gastos" "cg" ON (("cg"."id" = "g"."categoria_id")))
  GROUP BY "cg"."nombre";


ALTER VIEW "public"."vista_gastos_categoria" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_inventario" AS
 SELECT "producto",
    "descripcion",
    "sum"("cantidad") AS "cantidad_disponible",
    "avg"("costo_unitario") AS "costo_promedio",
    "sum"((("cantidad")::numeric * "costo_unitario")) AS "valor_inventario"
   FROM "public"."inventario"
  WHERE ("estado" = 'disponible'::"public"."estado_inventario")
  GROUP BY "producto", "descripcion";


ALTER VIEW "public"."vista_inventario" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_patrimonio" AS
 SELECT (( SELECT "vista_caja_actual"."caja_actual"
           FROM "public"."vista_caja_actual") + ( SELECT COALESCE("sum"((("inventario"."cantidad")::numeric * "inventario"."costo_unitario")), (0)::numeric) AS "coalesce"
           FROM "public"."inventario"
          WHERE ("inventario"."estado" = 'disponible'::"public"."estado_inventario"))) AS "patrimonio_total";


ALTER VIEW "public"."vista_patrimonio" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_utilidad" AS
 SELECT COALESCE("sum"("ganancia"), (0)::numeric) AS "utilidad_ventas"
   FROM "public"."ventas";


ALTER VIEW "public"."vista_utilidad" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vista_ventas" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::timestamp without time zone AS "fecha",
    NULL::"text" AS "cliente",
    NULL::"text" AS "producto",
    NULL::numeric(12,2) AS "precio_venta",
    NULL::numeric(12,2) AS "costo_producto",
    NULL::numeric(12,2) AS "ganancia",
    NULL::"public"."estado_venta" AS "estado",
    NULL::numeric AS "pagado",
    NULL::numeric AS "pendiente";


ALTER VIEW "public"."vista_ventas" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categorias_gastos"
    ADD CONSTRAINT "categorias_gastos_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."categorias_gastos"
    ADD CONSTRAINT "categorias_gastos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comisiones"
    ADD CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deudas_personales"
    ADD CONSTRAINT "deudas_personales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gastos"
    ADD CONSTRAINT "gastos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario"
    ADD CONSTRAINT "inventario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimientos_caja"
    ADD CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimientos_inventario"
    ADD CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ocasionales"
    ADD CONSTRAINT "ocasionales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagos"
    ADD CONSTRAINT "pagos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_comisiones_fecha" ON "public"."comisiones" USING "btree" ("fecha");



CREATE INDEX "idx_gastos_fecha" ON "public"."gastos" USING "btree" ("fecha");



CREATE INDEX "idx_inventario_producto" ON "public"."inventario" USING "btree" ("producto");



CREATE INDEX "idx_movimientos_caja_fecha" ON "public"."movimientos_caja" USING "btree" ("fecha");



CREATE INDEX "idx_pagos_venta" ON "public"."pagos" USING "btree" ("venta_id");



CREATE INDEX "idx_ventas_cliente" ON "public"."ventas" USING "btree" ("cliente_id");



CREATE OR REPLACE VIEW "public"."vista_ventas" AS
 SELECT "v"."id",
    "v"."fecha",
    "c"."nombre" AS "cliente",
    "v"."producto",
    "v"."precio_venta",
    "v"."costo_producto",
    "v"."ganancia",
    "v"."estado",
    COALESCE("sum"("p"."monto"), (0)::numeric) AS "pagado",
    ("v"."precio_venta" - COALESCE("sum"("p"."monto"), (0)::numeric)) AS "pendiente"
   FROM (("public"."ventas" "v"
     JOIN "public"."clientes" "c" ON (("c"."id" = "v"."cliente_id")))
     LEFT JOIN "public"."pagos" "p" ON (("p"."venta_id" = "v"."id")))
  GROUP BY "v"."id", "c"."nombre";



CREATE OR REPLACE TRIGGER "trigger_actualizar_estado_venta" AFTER INSERT OR UPDATE ON "public"."pagos" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_estado_venta"();



CREATE OR REPLACE TRIGGER "trigger_caja_comisiones" AFTER INSERT ON "public"."comisiones" FOR EACH ROW EXECUTE FUNCTION "public"."caja_comision"();



CREATE OR REPLACE TRIGGER "trigger_caja_gastos" AFTER INSERT ON "public"."gastos" FOR EACH ROW EXECUTE FUNCTION "public"."caja_gasto"();



CREATE OR REPLACE TRIGGER "trigger_caja_inventario" AFTER INSERT ON "public"."inventario" FOR EACH ROW EXECUTE FUNCTION "public"."caja_compra_inventario"();



CREATE OR REPLACE TRIGGER "trigger_caja_ocasional" AFTER INSERT ON "public"."ocasionales" FOR EACH ROW EXECUTE FUNCTION "public"."caja_ocasional"();



CREATE OR REPLACE TRIGGER "trigger_caja_pago" AFTER INSERT ON "public"."pagos" FOR EACH ROW EXECUTE FUNCTION "public"."caja_pago_cliente"();



CREATE OR REPLACE TRIGGER "trigger_descuento_inventario" AFTER INSERT ON "public"."ventas" FOR EACH ROW EXECUTE FUNCTION "public"."descontar_inventario"();



ALTER TABLE ONLY "public"."gastos"
    ADD CONSTRAINT "gastos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_gastos"("id");



ALTER TABLE ONLY "public"."movimientos_inventario"
    ADD CONSTRAINT "movimientos_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventario"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagos"
    ADD CONSTRAINT "pagos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pagos"
    ADD CONSTRAINT "pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT;



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";




