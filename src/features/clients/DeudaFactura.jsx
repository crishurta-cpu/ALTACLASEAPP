import { K, DS } from "../../constants";

/**
 * Detalle visual de deuda pendiente para un cliente.
 */
function DeudaFactura({ cliente, ventasDeudoras, abonos = 0, totalDeuda = null }) {
  if (!ventasDeudoras || ventasDeudoras.length === 0) return null;

  const fmt2 = (n) => "$" + Number(n || 0).toLocaleString("es-CO");
  // totalDeuda es el balance real (ventas - pagos) calculado en Supabase.
  // No se recalcula localmente: si el cliente tiene ventas viejas ya
  // marcadas como pagadas, sus abonos ya se usaron ahí y restarlos de
  // nuevo aquí subestima la deuda pendiente (ver ReporteClienteBtn.jsx).
  const totalNeto = totalDeuda !== null ? Math.max(0, totalDeuda) : Math.max(0, ventasDeudoras.reduce((s, v) => s + v.precioVenta, 0) - abonos);
  const sorted = [...ventasDeudoras].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ background: K.card, borderRadius: 16, padding: "16px", marginBottom: 10, border: `1px solid ${K.red}33` }}>
      <div style={{ borderBottom: `1px solid ${K.border}`, paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: K.text, marginBottom: 1 }}>⚠️ Detalle de deuda pendiente</div>
        <div style={{ fontSize: 11, color: K.muted, marginTop: 3 }}>
          <span style={{ fontWeight: 700, color: K.text }}>{cliente}</span>  ·  {fechaStr}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        {sorted.map((v, i) => {
          const d = new Date(v.fecha);
          const fStr = `${d.getDate()}/${d.getMonth() + 1}`;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 7, marginBottom: i < sorted.length - 1 ? 7 : 0, borderBottom: i < sorted.length - 1 ? `0.5px solid ${K.border}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: K.muted, marginRight: 6 }}>{fStr}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: K.text }}>{v.producto}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: K.red, flexShrink: 0 }}>{fmt2(v.precioVenta)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: K.card2, borderRadius: DS.r.sm, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: K.text }}>Total deuda</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: K.red }}>{fmt2(totalNeto)}</span>
      </div>
    </div>
  );
}

export default DeudaFactura;
