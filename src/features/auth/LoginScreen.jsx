import { useState } from "react";
import { DS, K, getAccentColor } from "../../constants";
import { useAuth } from "../../app/hooks/useAuth";

/**
 * Pantalla de login con Supabase Auth real (email + contraseña).
 * Reemplaza la clave de acceso hardcodeada (Fase M5, cutover).
 */
function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [modo, setModo] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [entrando, setEntrando] = useState(false);

  const accent = getAccentColor();

  const intentar = async () => {
    if (!email || !password) return;
    setEntrando(true);
    setError("");
    setAviso("");
    try {
      if (modo === "signup") {
        const data = await signUp(email, password);
        if (!data.session) {
          setAviso("Cuenta creada — revisa tu correo para confirmarla antes de entrar.");
        }
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setEntrando(false);
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
            style={{ color: K.white, fontWeight: 700, fontSize: 24, letterSpacing: -0.5, marginBottom: 4 }}
          >
            Altaclase Bodega
          </div>
          <div style={{ color: K.muted, fontSize: 13 }}>Control financiero B2B</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Email"
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
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && intentar()}
            placeholder="Contraseña"
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
              WebkitAppearance: "none",
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
            {error}
          </div>
        )}

        {aviso && (
          <div
            style={{
              color: K.green,
              fontSize: 12,
              textAlign: "center",
              marginBottom: 12,
              background: `${K.green}12`,
              borderRadius: DS.r.sm,
              padding: "7px",
            }}
          >
            {aviso}
          </div>
        )}

        <button
          onClick={intentar}
          disabled={!email || !password || entrando}
          style={{
            width: "100%",
            padding: "15px",
            background: !email || !password || entrando ? K.card3 : accent,
            border: "none",
            borderRadius: DS.r.md,
            color: !email || !password || entrando ? K.muted : "#000",
            fontSize: 15,
            fontWeight: 600,
            cursor: !email || !password || entrando ? "not-allowed" : "pointer",
            opacity: !email || !password || entrando ? 0.5 : 1,
            boxShadow: !email || !password || entrando ? "none" : `0 4px 20px ${accent}40`,
            transition: "all .2s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {entrando ? "..." : modo === "signup" ? "Crear cuenta →" : "Entrar →"}
        </button>

        <button
          onClick={() => {
            setModo((m) => (m === "signup" ? "login" : "signup"));
            setError("");
          }}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: K.muted,
            fontSize: 12,
            marginTop: 16,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          {modo === "signup" ? "Ya tengo cuenta — iniciar sesión" : "Primera vez — crear cuenta"}
        </button>

        <div style={{ textAlign: "center", fontSize: 11, color: K.muted, marginTop: 16, lineHeight: 1.6 }}>
          Sesión se cierra automáticamente en 3 minutos de inactividad
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
