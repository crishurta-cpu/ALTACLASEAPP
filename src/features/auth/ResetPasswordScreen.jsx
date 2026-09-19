import { useState } from "react";
import { DS, K, getAccentColor } from "../../constants";
import { useAuth } from "../../app/hooks/useAuth";

/**
 * Se muestra cuando Supabase dispara PASSWORD_RECOVERY (usuario vino del
 * link de "olvidé mi contraseña"). Pide la nueva contraseña una sola vez
 * y llama updatePassword — al terminar, App vuelve a su flujo normal.
 */
function ResetPasswordScreen() {
  const { updatePassword, cerrarSesion } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const accent = getAccentColor();

  const guardar = async () => {
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await updatePassword(password);
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        background: `radial-gradient(ellipse at 35% 25%, ${accent}0A 0%, transparent 55%), #0D0D12`,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "rgba(22,22,31,.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: DS.r.xxl,
          padding: "40px 28px 32px",
          border: `1px solid rgba(255,255,255,.07)`,
          boxShadow: "0 24px 64px rgba(0,0,0,.75), 0 1px 0 rgba(255,255,255,.05) inset",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ color: K.white, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
            Definir nueva contraseña
          </div>
          <div style={{ color: K.muted, fontSize: 13 }}>Escríbela dos veces para confirmar</div>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Nueva contraseña"
          autoFocus
          style={{
            width: "100%",
            background: K.card3,
            border: `1px solid ${error ? K.red + "88" : K.border}`,
            borderRadius: DS.r.md,
            color: K.text,
            padding: "15px 18px",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 10,
            WebkitAppearance: "none",
          }}
        />
        <input
          type="password"
          value={confirmar}
          onChange={(e) => {
            setConfirmar(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          placeholder="Confirmar contraseña"
          style={{
            width: "100%",
            background: K.card3,
            border: `1px solid ${error ? K.red + "88" : K.border}`,
            borderRadius: DS.r.md,
            color: K.text,
            padding: "15px 18px",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: error ? 8 : 16,
            WebkitAppearance: "none",
          }}
        />

        {error && (
          <div
            style={{
              color: K.red,
              fontSize: 12,
              textAlign: "center",
              marginBottom: 12,
              background: `${K.red}12`,
              borderRadius: DS.r.sm,
              padding: "7px",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={guardar}
          disabled={!password || !confirmar || guardando}
          style={{
            width: "100%",
            padding: "15px",
            background: !password || !confirmar || guardando ? K.card3 : accent,
            border: "none",
            borderRadius: DS.r.md,
            color: !password || !confirmar || guardando ? K.muted : "#000",
            fontSize: 15,
            fontWeight: 600,
            cursor: !password || !confirmar || guardando ? "not-allowed" : "pointer",
            opacity: !password || !confirmar || guardando ? 0.5 : 1,
            transition: "all .2s",
          }}
        >
          {guardando ? "..." : "Guardar contraseña"}
        </button>

        <button
          onClick={cerrarSesion}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: K.muted,
            fontSize: 12,
            marginTop: 16,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default ResetPasswordScreen;
