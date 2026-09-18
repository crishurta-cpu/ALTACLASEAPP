import { useState } from "react";
import { CLAVE_ACCESO, LS_AUTH_KEY, DS, K, getAccentColor } from "../../constants";

/**
 * Pantalla de login con clave de acceso.
 *
 * Props:
 * - onSuccess: () => void, callback al autenticarse correctamente
 *
 * Comportamiento:
 * - Valida contra CLAVE_ACCESO (hardcoded en constants).
 * - Al éxito: guarda LS_AUTH_KEY en localStorage y llama onSuccess.
 * - Al error: muestra mensaje y limpia el input.
 * - Auto-cierre por inactividad se maneja en App (useEffect separado).
 */
function LoginScreen({ onSuccess }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const intentar = () => {
    if (clave === CLAVE_ACCESO) {
      setEntrando(true);
      setTimeout(() => {
        localStorage.setItem(LS_AUTH_KEY, "1");
        onSuccess();
      }, 350);
    } else {
      setError(true);
      setClave("");
    }
  };

  const accent = getAccentColor();

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
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `${accent}06`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
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
          boxShadow:
            "0 24px 64px rgba(0,0,0,.75), 0 1px 0 rgba(255,255,255,.05) inset",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 76,
              height: 76,
              background: `linear-gradient(145deg, ${accent} 0%, ${accent}BB 100%)`,
              borderRadius: DS.r.xl,
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
              color: "#000",
              boxShadow: `0 8px 28px ${accent}45, 0 2px 8px rgba(0,0,0,.4)`,
            }}
          >
            A
          </div>
          <div
            style={{
              color: K.white,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: -0.5,
              marginBottom: 4,
            }}
          >
            Altaclase Bodega
          </div>
          <div style={{ color: K.muted, fontSize: 13 }}>
            Control financiero B2B
          </div>
        </div>

        {/* Input clave */}
        <div style={{ marginBottom: error ? 8 : 16 }}>
          <input
            type="password"
            value={clave}
            onChange={(e) => {
              setClave(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && intentar()}
            placeholder="Clave de acceso"
            autoFocus
            style={{
              width: "100%",
              background: K.card3,
              border: `1px solid ${error ? K.red + "88" : K.border}`,
              borderRadius: DS.r.md,
              color: K.text,
              padding: "15px 18px",
              fontSize: 17,
              outline: "none",
              boxSizing: "border-box",
              textAlign: "center",
              letterSpacing: 2,
              WebkitAppearance: "none",
              boxShadow: error ? `0 0 0 3px ${K.red}22` : "none",
              transition: "border .15s, box-shadow .15s",
            }}
          />
        </div>
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
            Clave incorrecta — inténtalo de nuevo
          </div>
        )}
        <button
          onClick={intentar}
          disabled={!clave || entrando}
          style={{
            width: "100%",
            padding: "15px",
            background: !clave || entrando ? K.card3 : accent,
            border: "none",
            borderRadius: DS.r.md,
            color: !clave || entrando ? K.muted : "#000",
            fontSize: 15,
            fontWeight: 600,
            cursor: !clave || entrando ? "not-allowed" : "pointer",
            opacity: !clave || entrando ? 0.5 : 1,
            boxShadow: !clave || entrando ? "none" : `0 4px 20px ${accent}40`,
            transition: "all .2s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {entrando ? "Entrando..." : "Entrar →"}
        </button>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: K.muted,
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Sesión se cierra automáticamente en 3 minutos
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;