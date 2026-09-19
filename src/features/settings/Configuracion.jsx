import { useState } from "react";
import { DS, K, getAccentColor } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";
import AccentPicker from "./AccentPicker";
import { useAuth } from "../../app/hooks/useAuth";

/**
 * Panel de configuración. Sub-secciones:
 * - Info de la app (versión)
 * - Color de acento (delegado a AccentPicker)
 * - Sesión (auto-cierre, etc.)
 * - Datos (sincronización)
 * - Cerrar sesión
 *
 * Diseñado para crecer: aquí irán preferencias de diseño,
 * notificaciones, etc.
 */
function Configuracion() {
  const { cerrarSesion, updatePassword, email } = useAuth();
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [claveMsg, setClaveMsg] = useState(null); // { texto, color }

  const cambiarClave = async () => {
    if (nuevaClave.length < 6) {
      setClaveMsg({ texto: "Mínimo 6 caracteres", color: K.red });
      return;
    }
    if (nuevaClave !== confirmarClave) {
      setClaveMsg({ texto: "Las contraseñas no coinciden", color: K.red });
      return;
    }
    setCambiando(true);
    setClaveMsg(null);
    try {
      await updatePassword(nuevaClave);
      setNuevaClave("");
      setConfirmarClave("");
      setClaveMsg({ texto: "✓ Contraseña actualizada", color: K.green });
    } catch (e) {
      setClaveMsg({ texto: e.message, color: K.red });
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* App info */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 52, height: 52, background: getAccentColor(),
            borderRadius: DS.r.lg, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26, fontWeight: 700,
            color: "#000", flexShrink: 0
          }}>A</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: K.text }}>Altaclase Bodega</div>
            <div style={{ fontSize: 13, color: K.muted }}>Control financiero B2B</div>
          </div>
        </div>
        <div style={{ height: "0.5px", background: K.border, margin: "0 -16px 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: K.muted }}>Versión</span>
          <span style={{ fontSize: 13, color: K.text, fontWeight: 500 }}>2.1</span>
        </div>
      </>} />

      {/* Color de acento */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{
          fontSize: 12, color: K.muted, textTransform: "uppercase",
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 12
        }}>
          Color de acento
        </div>
        <AccentPicker />
      </>} />

      {/* Sesión */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{
          fontSize: 12, color: K.muted, textTransform: "uppercase",
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 10
        }}>
          Sesión
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 15, color: K.text }}>Auto-cierre por inactividad</span>
          <span style={{ fontSize: 13, color: K.muted, fontWeight: 500 }}>3 min</span>
        </div>
        <div style={{ height: "0.5px", background: K.border, margin: "0 -16px 10px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: K.text }}>Persiste al cerrar navegador</span>
          <span style={{ fontSize: 13, color: K.green, fontWeight: 600 }}>Activo</span>
        </div>
      </>} />

      {/* Datos */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{
          fontSize: 12, color: K.muted, textTransform: "uppercase",
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 10
        }}>
          Datos
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 15, color: K.text }}>Sincronización automática</span>
          <span style={{ fontSize: 13, color: K.muted }}>Cada 2 min</span>
        </div>
        <div style={{ height: "0.5px", background: K.border, margin: "0 -16px 10px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: K.text }}>Fuente de datos</span>
          <span style={{ fontSize: 13, color: K.muted }}>Supabase</span>
        </div>
      </>} />

      {/* Cuenta / contraseña */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{
          fontSize: 12, color: K.muted, textTransform: "uppercase",
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 10
        }}>
          Cuenta
        </div>
        <div style={{ fontSize: 13, color: K.muted, marginBottom: 12 }}>{email}</div>
        <FInput label="Nueva contraseña" value={nuevaClave} onChange={setNuevaClave} type="password" />
        <FInput label="Confirmar contraseña" value={confirmarClave} onChange={setConfirmarClave} type="password" />
        {claveMsg && (
          <div style={{ fontSize: 12, color: claveMsg.color, fontWeight: 600, marginBottom: 10, textAlign: "center" }}>
            {claveMsg.texto}
          </div>
        )}
        <Btn label="Cambiar contraseña" onClick={cambiarClave} loading={cambiando} dis={!nuevaClave || !confirmarClave} sm />
      </>} />

      {/* Cerrar sesión */}
      <button
        onClick={cerrarSesion}
        style={{
          width: "100%", background: "transparent", border: "none",
          color: K.red, fontSize: 17, fontWeight: 500,
          padding: "14px 0", cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default Configuracion;