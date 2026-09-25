import { K, DS, THEME_DEFAULTS, THEME_PRESETS, getThemeOverrides, setThemeOverrides, getAccentColor } from "../../constants";
import { useAccentColor } from "../../app/hooks/useAccentColor";

const CAMPOS = [
  { key: "accent", label: "Acento", hint: "Botones, títulos y detalles" },
  { key: "bg", label: "Fondo", hint: "Fondo general de la app" },
  { key: "card", label: "Tarjetas", hint: "Módulos y listas" },
  { key: "card2", label: "Tarjetas internas", hint: "Filas y bloques anidados" },
  { key: "card3", label: "Campos", hint: "Inputs y selectores" },
  { key: "text", label: "Texto", hint: "Texto principal" },
  { key: "muted", label: "Texto secundario", hint: "Etiquetas y detalles" },
  { key: "green", label: "Positivo", hint: "Pagado, ganancia" },
  { key: "red", label: "Alerta", hint: "Deudas, eliminar" },
];

/**
 * Editor de colores de la app: presets de fondo + selector por cada color.
 * Se guarda por dispositivo (localStorage) y se aplica al instante.
 */
function ThemeEditor() {
  useAccentColor(); // re-render cuando cambia el tema
  const overrides = getThemeOverrides();
  const valor = (key) => (key === "accent" ? getAccentColor() : overrides[key] || THEME_DEFAULTS[key]);
  const personalizado = Object.keys(overrides).length > 0;

  const cambiar = (key, val) => setThemeOverrides({ ...getThemeOverrides(), [key]: val });
  const aplicarPreset = (colors) => {
    const { accent, green, red, text, muted } = getThemeOverrides();
    const conservar = { accent, green, red, text, muted };
    Object.keys(conservar).forEach((k) => conservar[k] === undefined && delete conservar[k]);
    setThemeOverrides({ ...conservar, ...colors });
  };
  const restaurar = () => setThemeOverrides({});

  const presetActivo = (p) => Object.keys(THEME_DEFAULTS).filter((k) => ["bg", "card", "card2", "card3"].includes(k)).every((k) => (p.colors[k] || THEME_DEFAULTS[k]).toLowerCase() === valor(k).toLowerCase());

  return (
    <>
      <div style={{ fontSize: 12, color: K.muted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 12 }}>
        Colores de la app
      </div>
      <div style={{ fontSize: 11, color: K.muted, marginBottom: 8 }}>Estilo de fondo</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {THEME_PRESETS.map((p) => {
          const c = { ...THEME_DEFAULTS, ...p.colors };
          const activo = presetActivo(p);
          return (
            <button key={p.id} onClick={() => aplicarPreset(p.colors)} style={{ background: c.bg, border: `2px solid ${activo ? K.gold : K.border}`, borderRadius: DS.r.md, padding: 10, cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[c.card, c.card2, c.card3].map((x, i) => <span key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: x }} />)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: activo ? K.gold : "#F1F5F9" }}>{p.label}</div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: K.muted, marginBottom: 8 }}>Ajuste fino</div>
      {CAMPOS.map((c, i) => (
        <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${K.border}` : "none", cursor: "pointer" }}>
          <input type="color" value={valor(c.key)} onChange={(e) => cambiar(c.key, e.target.value)} style={{ width: 38, height: 38, padding: 0, border: `2px solid ${K.borderStrong}`, borderRadius: 10, background: "none", cursor: "pointer", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: K.text }}>{c.label}</div>
            <div style={{ fontSize: 11, color: K.muted }}>{c.hint}</div>
          </div>
          <span style={{ fontSize: 11, color: K.muted, fontFamily: "ui-monospace,monospace" }}>{valor(c.key).toUpperCase()}</span>
        </label>
      ))}
      {personalizado && (
        <button onClick={restaurar} style={{ width: "100%", marginTop: 12, background: "none", border: `1px solid ${K.border}`, borderRadius: DS.r.sm, padding: "11px 0", color: K.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Restaurar colores originales
        </button>
      )}
    </>
  );
}

export default ThemeEditor;
