// Namespaceado a propósito: todos los servicios exportan `readAll`/`append`/
// `update`/`remove` con el mismo nombre, así que un barrel plano (`export *`)
// colisionaría entre ellos.
export * as ingresosService from "./ingresos.service";
export * as gastosService from "./gastos.service";
export * as clientesService from "./clientes.service";
export * as clientesEspecialesService from "./clientesEspeciales.service";
export * as inventarioService from "./inventario.service";
export * as deudaPersonalService from "./deudaPersonal.service";
export * as tareasService from "./tareas.service";
