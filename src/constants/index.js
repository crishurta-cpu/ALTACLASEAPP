// Constants and utility functions for design and business logic

export const SYNC_INTERVAL_MS = 120000; // 2 minutos

export const ACCENT_KEY = "altaclase_accent";
export const ACCENTS = [
  { id: "orange", label: "Naranja", color: "#FF7A1A" },
  { id: "gold", label: "Dorado", color: "#D4A843" },
  { id: "blue", label: "Azul", color: "#3B82F6" },
  { id: "green", label: "Verde", color: "#10B981" },
  { id: "purple", label: "Púrpura", color: "#8B5CF6" },
  { id: "teal", label: "Teal", color: "#06B6D4" },
  { id: "rose", label: "Rosa", color: "#F43F5E" },
  { id: "white", label: "Blanco", color: "#F1F5F9" },
];

export const THEME_KEY = "altaclase_theme";
export const THEME_DEFAULTS = {
  bg: "#0A0A0B", card: "#141416", card2: "#1B1B1E", card3: "#222225",
  text: "#F1F5F9", muted: "#6B7280", green: "#10B981", red: "#EF4444",
};
export const THEME_PRESETS = [
  { id: "default", label: "Negro clásico", colors: {} },
  { id: "graphite", label: "Grafito", colors: { bg: "#111318", card: "#1A1D24", card2: "#222630", card3: "#2A2F3B" } },
  { id: "midnight", label: "Azul medianoche", colors: { bg: "#070B14", card: "#0F1626", card2: "#152036", card3: "#1B2A45" } },
  { id: "forest", label: "Verde bosque", colors: { bg: "#08100C", card: "#0F1A14", card2: "#15251C", card3: "#1B3024" } },
  { id: "wine", label: "Vino", colors: { bg: "#0F080A", card: "#1A0F12", card2: "#25151A", card3: "#301B22" } },
];

// Cache en memoria: K.* se lee cientos de veces por render, no se puede
// parsear localStorage en cada acceso.
let themeCache = null;
const readTheme = () => {
  if (themeCache) return themeCache;
  try {
    themeCache = JSON.parse(localStorage.getItem(THEME_KEY)) || {};
  } catch {
    themeCache = {};
  }
  return themeCache;
};
export const getThemeOverrides = () => ({ ...readTheme() });
export const setThemeOverrides = (next) => {
  themeCache = { ...next };
  try { localStorage.setItem(THEME_KEY, JSON.stringify(themeCache)); } catch { /* sin storage */ }
  window.dispatchEvent(new Event("accentchange"));
};
const tv = (k) => readTheme()[k] || THEME_DEFAULTS[k];

// Mezcla dos colores hex (t=0 → a, t=1 → b) para derivar degradados del tema.
const mixHex = (a, b, t) => {
  const p = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = (i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
};

export const getAccentColor = () => {
  if (typeof window === "undefined" || !window.localStorage) return "#FF7A1A";
  const custom = readTheme().accent;
  if (custom) return custom;
  const saved = localStorage.getItem(ACCENT_KEY);
  const found = ACCENTS.find(a => a.id === saved);
  return found ? found.color : "#FF7A1A";
};

// Sombras y radios del sistema — esquinas mas redondeadas (rediseño 2026-09-19)
export const DS = {
  r: { sm: 12, md: 18, lg: 22, xl: 26, xxl: 30 },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,.4)",
    md: "0 4px 16px rgba(0,0,0,.5)",
    lg: "0 8px 32px rgba(0,0,0,.6)",
    xl: "0 16px 48px rgba(0,0,0,.7)",
    glow: (col) => `0 4px 20px ${col}33`,
  },
  glass: "rgba(24,24,26,.85)",
  glassBorder: "rgba(255,255,255,.06)",
};

// Paleta rediseño 2026-09-19, revisada el mismo día: negro/gris oscuro de
// base + naranja de acento. Las tarjetas claras de la primera pasada se
// sintieron con demasiado contraste — se volvió a tarjetas oscuras, con
// degradados sutiles entre 2 tonos cercanos en vez de un solo color plano.
export const K = {
  get bg() { return tv("bg"); },
  get card() { return tv("card"); },
  get card2() { return tv("card2"); },
  get card3() { return tv("card3"); },
  card4: "#2B2B2F",         // hover y activos
  get gold() { return getAccentColor(); },
  get green() { return tv("green"); },
  grafico: "#6b7280",
  get red() { return tv("red"); },
  blue: "#3B82F6",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
  orange: "#F97316",
  teal: "#06B6D4",
  border: "rgba(255,255,255,.07)",
  borderStrong: "rgba(255,255,255,.12)",
  get muted() { return tv("muted"); },
  mutedLighter: "#9CA3AF",
  get text() { return tv("text"); },
  white: "#FFFFFF",
  // Degradado sutil para tarjetas de contenido (listas, resúmenes) —
  // reemplaza el fondo plano K.card donde antes se probó una tarjeta clara.
  get cardGrad() { return `linear-gradient(160deg, ${mixHex(tv("card"), "#ffffff", 0.03)} 0%, ${mixHex(tv("card"), tv("bg"), 0.5)} 100%)`; },
  get cardGradRed() { return `linear-gradient(160deg, ${mixHex(tv("card"), "#EF4444", 0.12)} 0%, ${mixHex(tv("bg"), "#EF4444", 0.06)} 100%)`; },
  // Fondo oscuro de la barra de navegación inferior (mas negro que K.card).
  ink: "#17100A",
};

export const CCAT = {
  "AHORRO": K.blue,
  "DEUDA - BANCOS": K.red,
  "GASTO FIJO": K.yellow,
  "MERCADO": "#4CAF7D",
  "NEGOCIO": K.purple,
  "PERSONALES": K.orange,
  "SALIDA / DOMICILIO": "#C47EB8"
};

export const TIPOS = ["VENTA", "COMISION", "COMPRA CON SALDO", "OCASIONALES", "RECIBIDO CLIENTE"];
export const CONCS = ["NEGOCIO", "GASTO FIJO", "SALIDA / DOMICILIO", "AHORRO", "MERCADO", "PERSONALES", "DEUDA - BANCOS"];

// Bayron y Marco son clientes especiales: sus filas en INGRESOS NO deben afectar
// ningún total general (Home, ranking de clientes, historial agregado) salvo
// cuando el TIPO sea VENTA o COMISION — esos sí cuentan como ganancia real tuya.
export const CLIENTES_ESPECIALES = ["BAYRON", "MARCO", "MARCOS"];
export const esClienteEspecial = nombre => CLIENTES_ESPECIALES.includes(String(nombre || "").toUpperCase().trim());

// Estos nombres NO son clientes reales (son movimientos internos: parqueadero,
// préstamos a Pipe, capital propio, etc.) — exactamente la misma exclusión que usa
// la fórmula UNIQUE/FILTER de la hoja CLIENTES en tu Excel real.
export const NO_SON_CLIENTES = ["BAYRON", "PARQUEADERO", "PIPE", "PRESTAMO", "CLIENTE", "CRIS", "PRIMOS"];
export const noEsClienteReal = nombre => NO_SON_CLIENTES.includes(String(nombre || "").toUpperCase().trim());

// Filtro para TOTALES DEL NEGOCIO (Home, Utilidad del mes, Historial agregado).
// Solo aplica la regla de Bayron/Marco. CRIS, PRESTAMO, etc. SÍ cuentan aquí porque
// ese dinero entró y sí afecta tu ganancia real — solo no deben listarse como "clientes".
export const cuentaParaTotales = ing => {
  if (!esClienteEspecial(ing.cliente)) return true;
  return ing.tipo === "VENTA" || ing.tipo === "COMISION";
};

// Filtro para la LISTA DE CLIENTES (pantalla Clientes). Aquí sí se excluyen los
// movimientos internos (CRIS, PRESTAMO, etc.) además de la regla Bayron/Marco,
// porque esos nombres no son revendedores reales.
export const cuentaParaListaClientes = ing => {
  if (noEsClienteReal(ing.cliente) && !esClienteEspecial(ing.cliente)) return false;
  if (!esClienteEspecial(ing.cliente)) return true;
  return ing.tipo === "VENTA" || ing.tipo === "COMISION";
};

export const fmt = n => "$" + Number(n || 0).toLocaleString("es-CO");
export const mKey = d => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  } catch {
    return "";
  }
};
export const curM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const mLabel = ym => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][+m - 1] + " " + y;
};
export const fDate = d => {
  try {
    return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
};
