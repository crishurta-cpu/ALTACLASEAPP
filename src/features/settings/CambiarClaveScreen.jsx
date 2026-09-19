import { useState } from "react";
import { K } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";
import { useAuth } from "../../app/hooks/useAuth";

/**
 * Pantalla interna (no visible desde el menú principal, solo accesible por
 * un link discreto en Configuración) para cambiar la contraseña. Exige
 * verificar un código de 6 dígitos enviado al correo de la cuenta antes de
 * permitir definir la nueva contraseña.
 *
 * Pasos: "codigo" (pedir/verificar código) → "clave" (definir nueva).
 */
function CambiarClaveScreen({ onBack }) {
  const { email, sendPasswordChangeCode, verifyPasswordChangeCode, updatePassword } = useAuth();
  const [paso, setPaso] = useState("codigo");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState(null);

  const enviarCodigo = async () => {
    setCargando(true);
    setMsg(null);
    try {
      await sendPasswordChangeCode(email);
      setEnviado(true);
      setMsg({ texto: "✓ Código enviado a " + email, color: K.green });
    } catch (e) {
      setMsg({ texto: e.message, color: K.red });
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async () => {
    if (codigo.length < 6) {
      setMsg({ texto: "El código tiene 6 dígitos", color: K.red });
      return;
    }
    setCargando(true);
    setMsg(null);
    try {
      await verifyPasswordChangeCode(email, codigo);
      setPaso("clave");
      setMsg(null);
    } catch (e) {
      setMsg({ texto: e.message, color: K.red });
    } finally {
      setCargando(false);
    }
  };

  const cambiarClave = async () => {
    if (nuevaClave.length < 6) {
      setMsg({ texto: "Mínimo 6 caracteres", color: K.red });
      return;
    }
    if (nuevaClave !== confirmarClave) {
      setMsg({ texto: "Las contraseñas no coinciden", color: K.red });
      return;
    }
    setCargando(true);
    setMsg(null);
    try {
      await updatePassword(nuevaClave);
      setMsg({ texto: "✓ Contraseña actualizada", color: K.green });
      setTimeout(onBack, 1200);
    } catch (e) {
      setMsg({ texto: e.message, color: K.red });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: "0 0 16px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: K.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Volver a Configuración</button>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cambiar contraseña</div>
      <div style={{ fontSize: 12, color: K.muted, marginBottom: 16 }}>{email}</div>

      {paso === "codigo" && (
        <Card
          ch={
            <>
              <div style={{ fontSize: 13, color: K.muted, marginBottom: 14 }}>
                Por seguridad, primero verificamos tu identidad con un código de 6 dígitos enviado a tu correo.
              </div>
              {!enviado ? (
                <Btn label="Enviar código de verificación" onClick={enviarCodigo} loading={cargando} />
              ) : (
                <>
                  <FInput label="Código de 6 dígitos" value={codigo} onChange={setCodigo} type="text" placeholder="123456" />
                  <Btn label="Verificar código" onClick={verificarCodigo} loading={cargando} dis={codigo.length < 6} />
                  <button onClick={enviarCodigo} disabled={cargando} style={{ width: "100%", background: "none", border: "none", color: K.muted, fontSize: 12, marginTop: 10, cursor: "pointer" }}>
                    Reenviar código
                  </button>
                </>
              )}
            </>
          }
        />
      )}

      {paso === "clave" && (
        <Card
          ch={
            <>
              <div style={{ fontSize: 13, color: K.green, marginBottom: 14 }}>✓ Identidad verificada. Define tu nueva contraseña.</div>
              <FInput label="Nueva contraseña" value={nuevaClave} onChange={setNuevaClave} type="password" />
              <FInput label="Confirmar contraseña" value={confirmarClave} onChange={setConfirmarClave} type="password" />
              <Btn label="Guardar nueva contraseña" onClick={cambiarClave} loading={cargando} dis={!nuevaClave || !confirmarClave} />
            </>
          }
        />
      )}

      {msg && (
        <div style={{ fontSize: 12, color: msg.color, fontWeight: 600, marginTop: 10, textAlign: "center" }}>
          {msg.texto}
        </div>
      )}
    </div>
  );
}

export default CambiarClaveScreen;
