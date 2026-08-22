import { useState } from "react";
import { K, DS } from "../../constants";

/**
 * Genera y copia al portapapeles el reporte de deuda para WhatsApp.
 */
function ReporteClienteBtn({ cliente, ventasDeudoras = [], abonos = 0 }) {
  const [copiado, setCopiado] = useState(false);
  const fmt2 = (n) => "$" + Number(n || 0).toLocaleString("es-CO");

  if (ventasDeudoras.length === 0) return null;

  const generar = () => {
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const sorted = [...ventasDeudoras].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const totalBruto = sorted.reduce((s, v) => s + v.precioVenta, 0);
    const totalNeto = Math.max(0, totalBruto - abonos);
    const lineas = [
      `📋 *REPORTE ACTUALIZADO CLIENTE:*`,
      `      *• ${cliente}*`,
      `📅 ${fechaStr}`,
      ``,
      `⚠️ *Productos en deuda a la fecha:*`,
    ];

    sorted.forEach((v) => {
      const d = new Date(v.fecha);
      const fStr = `${d.getDate()}/${d.getMonth() + 1}`;
      lineas.push(`• ${fStr} - ${v.producto} — ${fmt2(v.precioVenta)}`);
    });
    lineas.push(``);
    if (abonos > 0) lineas.push(`✅ Abonos aplicados: ${fmt2(abonos)}`, ``);
    lineas.push(`*Total de deuda: ${fmt2(totalNeto)} COP*`);
    lineas.push(``, `────────────────────────`, ``);
    lineas.push(`📌 *INFORMACIÓN PARA PAGOS:*`, ``);
    lineas.push(`Si vas a realizar una transferencia, puedes utilizar cualquiera de los siguientes datos:`, ``);
    lineas.push(`🏦 Banco:
Bancolombia`, ``);
    lineas.push(`👤 Titular:
CRISTHIAN HURTADO`, ``);
    lineas.push(`💳 Cuenta de ahorros:
74500048704`, ``);
    lineas.push(`⚡ Llave Bre-B:
@cristhianh7600`, ``);
    lineas.push(`Una vez realizado el pago o abono, envía el comprobante para registrar el abono y mantener tu estado de cuenta actualizado.`, ``);
    lineas.push(`CRISTHIAN HURTADO
ALTACLASE BODEGA
CALI - COLOMBIA`);

    const texto = lineas.join("\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      });
    } else {
      const el = document.createElement("textarea");
      el.value = texto;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <button onClick={generar} style={{ width: "100%", background: copiado ? `${K.green}15` : K.card2, border: `1.5px solid ${copiado ? K.green : K.border}`, borderRadius: DS.r.md, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, WebkitTapHighlightColor: "transparent", transition: "all .2s" }}>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: copiado ? K.green : K.text }}>{copiado ? "✓ Copiado para WhatsApp" : "📋 GENERAR REPORTE DE DEUDA"}</div>
        <div style={{ fontSize: 10, color: K.muted, marginTop: 2 }}>Incluye datos de pago</div>
      </div>
      <span style={{ fontSize: 18, color: copiado ? K.green : K.muted, marginLeft: 8 }}>→</span>
    </button>
  );
}

export default ReporteClienteBtn;
