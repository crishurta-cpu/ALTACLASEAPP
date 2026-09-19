import { Component } from "react";
import { K, DS } from "../constants";

/**
 * Los sub-tabs de "Más" (Buscar, Inventario, Config, etc.) se cargan con
 * `lazy()` — si la app quedó abierta desde antes de un deploy nuevo, el
 * navegador intenta pedir un chunk .js con un hash que ya no existe en el
 * server (Vercel solo sirve los assets del último build) y el import
 * dinámico falla. Sin este boundary, ese error no lo atrapa nadie: React
 * desmonta el árbol y queda pantalla negra (bug real reportado 2026-09-19,
 * "se bloquea al entrar a Configuración/Buscar").
 */
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    if (this.state.fallo) {
      return (
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
          <div style={{ color: K.text, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Hay una versión nueva de la app</div>
          <div style={{ color: K.muted, fontSize: 13, marginBottom: 18 }}>Recarga para seguir usándola.</div>
          <button
            onClick={() => window.location.reload()}
            style={{ background: K.gold, border: "none", borderRadius: DS.r.md, color: "#000", fontWeight: 700, fontSize: 14, padding: "12px 28px", cursor: "pointer" }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
