// Constants and utility functions for design and business logic

export const API = "https://script.google.com/macros/s/AKfycbySGO0LtHtnT7SBEHF22TfsDUmz3kqmz3C2a-tZk6zL3_ZFuEoUF485h4QWvxq4H_S7/exec";
export const SYNC_INTERVAL_MS = 120000; // 2 minutos
export const CLAVE_ACCESO = "ClaudeAlta";
export const LS_AUTH_KEY = "altaclase_auth_ok";

export const ACCENT_KEY = "altaclase_accent";
export const ACCENTS = [
  { id: "gold", label: "Dorado", color: "#D4A843" },
  { id: "blue", label: "Azul", color: "#3B82F6" },
  { id: "green", label: "Verde", color: "#10B981" },
  { id: "purple", label: "Púrpura", color: "#8B5CF6" },
  { id: "orange", label: "Naranja", color: "#F59E0B" },
  { id: "teal", label: "Teal", color: "#06B6D4" },
  { id: "rose", label: "Rosa", color: "#F43F5E" },
  { id: "white", label: "Blanco", color: "#F1F5F9" },
];

export const getAccentColor = () => {
  if (typeof window === "undefined" || !window.localStorage) return "#D4A843";
  const saved = localStorage.getItem(ACCENT_KEY);
  const found = ACCENTS.find(a => a.id === saved);
  return found ? found.color : "#D4A843";
};

// Sombras y radios del sistema
export const DS = {
  r: { sm: 10, md: 16, lg: 20, xl: 24, xxl: 28 },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,.4)",
    md: "0 4px 16px rgba(0,0,0,.5)",
    lg: "0 8px 32px rgba(0,0,0,.6)",
    xl: "0 16px 48px rgba(0,0,0,.7)",
    glow: (col) => `0 4px 20px ${col}33`,
  },
  glass: "rgba(28,28,35,.85)",
  glassBorder: "rgba(255,255,255,.06)",
};

export const K = {
  bg: "#0D0D12",            // negro azulado profundo — más rico que negro puro
  card: "#16161F",          // tarjeta nivel 1 — ligero tinte índigo
  card2: "#1E1E2A",         // tarjeta nivel 2
  card3: "#252533",         // input y elementos interactivos
  card4: "#2E2E3D",         // hover y activos
  get gold() { return getAccentColor(); },
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
  orange: "#F97316",
  teal: "#06B6D4",
  border: "rgba(255,255,255,.07)",
  borderStrong: "rgba(255,255,255,.12)",
  muted: "#6B7280",
  mutedLighter: "#9CA3AF",
  text: "#F1F5F9",
  white: "#FFFFFF",
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
