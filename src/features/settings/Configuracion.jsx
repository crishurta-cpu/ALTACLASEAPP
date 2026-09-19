import { useEffect, useState } from "react";
import { DS, K, getAccentColor } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";
import AccentPicker from "./AccentPicker";
import CambiarClaveScreen from "./CambiarClaveScreen";
import { useAuth } from "../../app/hooks/useAuth";
import * as organizationService from "../../services/supabase/organization.service";

/**
 * Panel de configuración. Sub-secciones:
 * - Info de la app (versión)
 * - Color de acento (delegado a AccentPicker)
 * - Sesión (auto-cierre, etc.)
 * - Datos de la empresa (nombre, NIT, dirección, ciudad)
 * - Cuenta (email + link discreto a CambiarClaveScreen)
 * - Cerrar sesión
 *
 * El cambio de contraseña vive en una pantalla interna aparte
 * (CambiarClaveScreen) — aquí solo hay un link de texto, no visible como
 * una acción principal.
 */
function Configuracion() {
  const { cerrarSesion, email, organizationId } = useAuth();
  const [vista, setVista] = useState("principal"); // "principal" | "clave"

  const [empresa, setEmpresa] = useState(null); // null = aún no cargado, nunca "" para no arriesgar sobrescribir con vacío
  const [cargandoEmpresa, setCargandoEmpresa] = useState(true);
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);
  const [empresaMsg, setEmpresaMsg] = useState(null);

  useEffect(() => {
    if (!organizationId) return;
    organizationService
      .readCompanyInfo(organizationId)
      .then((data) => setEmpresa({ name: data.name || "", nit: data.nit || "", address: data.address || "", city: data.city || "" }))
      .catch((e) => setEmpresaMsg({ texto: "No se pudieron cargar los datos: " + e.message, color: K.red }))
      .finally(() => setCargandoEmpresa(false));
  }, [organizationId]);

  const guardarEmpresa = async () => {
    setGuardandoEmpresa(true);
    setEmpresaMsg(null);
    try {
      await organizationService.updateCompanyInfo(organizationId, empresa);
      setEmpresaMsg({ texto: "✓ Datos guardados", color: K.green });
    } catch (e) {
      setEmpresaMsg({ texto: e.message, color: K.red });
    } finally {
      setGuardandoEmpresa(false);
    }
  };

  if (vista === "clave") {
    return <CambiarClaveScreen onBack={() => setVista("principal")} />;
  }

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

      {/* Datos de la empresa */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{
          fontSize: 12, color: K.muted, textTransform: "uppercase",
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 10
        }}>
          Datos de la empresa
        </div>
        {cargandoEmpresa && <div style={{ fontSize: 13, color: K.muted, padding: "8px 0" }}>Cargando...</div>}
        {!cargandoEmpresa && !empresa && empresaMsg && (
          <div style={{ fontSize: 12, color: empresaMsg.color, fontWeight: 600, textAlign: "center", padding: "8px 0" }}>{empresaMsg.texto}</div>
        )}
        {!cargandoEmpresa && empresa && (
          <>
            <FInput label="Nombre" value={empresa.name} onChange={(v) => setEmpresa((p) => ({ ...p, name: v }))} placeholder="ej: Altaclase Bodega" />
            <FInput label="NIT" value={empresa.nit} onChange={(v) => setEmpresa((p) => ({ ...p, nit: v }))} placeholder="opcional" />
            <FInput label="Dirección" value={empresa.address} onChange={(v) => setEmpresa((p) => ({ ...p, address: v }))} placeholder="opcional" />
            <FInput label="Ciudad" value={empresa.city} onChange={(v) => setEmpresa((p) => ({ ...p, city: v }))} placeholder="opcional" />
            {empresaMsg && (
              <div style={{ fontSize: 12, color: empresaMsg.color, fontWeight: 600, marginBottom: 10, textAlign: "center" }}>
                {empresaMsg.texto}
              </div>
            )}
            <Btn label="Guardar datos" onClick={guardarEmpresa} loading={guardandoEmpresa} dis={!empresa.name.trim()} sm />
          </>
        )}
      </>} />

      {/* Cuenta */}
      <Card s={{ marginBottom: 8 }} ch={<>
        <div style={{
          fontSize: 12, color: K.muted, textTransform: "uppercase",
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 10
        }}>
          Cuenta
        </div>
        <div style={{ fontSize: 13, color: K.muted, marginBottom: 12 }}>{email}</div>
        <button
          onClick={() => setVista("clave")}
          style={{ background: "none", border: "none", color: K.muted, fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          Cambiar contraseña
        </button>
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
