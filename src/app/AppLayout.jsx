import { K, DS } from "../constants";
import { useNav } from "./hooks/useNav";
import { useData } from "./hooks/useData";
import NuevoMovimiento from "./NuevoMovimiento";
import EditIngreso from "../features/ingresos/EditIngreso";
import EditGasto from "../features/gastos/EditGasto";

const NAV = [
  { id: "home", label: "Inicio" },
  { id: "clientes", label: "Clientes" },
  { id: "historial", label: "Historial" },
  { id: "mas", label: "Más" },
];

/**
 * Shell visual de la app: estilos globales, sidebar desktop, nav inferior
 * mobile, FAB, modal de "nuevo movimiento" y modales de edición de
 * ingreso/gasto. `children` es el contenido del tab activo — lo decide
 * `App.jsx` (composition root). Extraído de App.jsx en Fase 17.
 */
export default function AppLayout({ children }) {
  const { tab, setTab, showNuevo, setShowNuevo, editIng, setEditIng, editGas, setEditGas } = useNav();
  const { updateIngreso, removeIngreso, updateGasto, removeGasto } = useData();

  const mostrarFab = tab === "home" || tab === "clientes" || tab === "historial";

  return (
    <>
      <style>{`
        html,body{margin:0;padding:0;background:#0D0D12;width:100%;max-width:100vw;overflow-x:hidden;overscroll-behavior:none;}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        .ac-sidebar{display:none;flex-direction:column;width:220px;min-height:100dvh;
          background:rgba(22,22,30,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-right:1px solid rgba(255,255,255,.07);padding:48px 16px 24px;
          position:static;top:0;left:0;bottom:0;z-index:100;}
        .ac-main-inner{width:100%;max-width:430px;margin:0 auto;}
        .ac-nav{position:fixed;bottom:0;left:0;right:0;display:flex;z-index:200;
          background:rgba(13,13,18,.95);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
          border-top:1px solid rgba(255,255,255,.07);
          padding-bottom:env(safe-area-inset-bottom,0px);}
        .ac-fab{position:fixed;bottom:calc(78px + env(safe-area-inset-bottom,0px));right:20px;z-index:150;}
        @media(min-width:768px){
          .ac-sidebar{display:flex!important;}
          .ac-main-inner{max-width:none!important;margin-left:0!important;}
          .ac-nav{display:none!important;}
          .ac-fab{right:32px!important;}
          .ac-desktop-2col{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;align-items:start!important;}
        }
      `}</style>
      <div style={{
        background: K.bg, minHeight: "100dvh", color: K.text,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
        WebkitFontSmoothing: "antialiased", width: "100%", overflowX: "hidden",
      }}>
        <div style={{ display: "flex", minHeight: "100dvh" }}>
          {/* Sidebar — desktop only via CSS class */}
          <div className="ac-sidebar">
            <>
              <div style={{ marginBottom: 32, padding: "0 8px" }}>
                <div style={{
                  width: 44, height: 44,
                  background: `linear-gradient(135deg,${K.gold} 0%,${K.gold}99 100%)`,
                  borderRadius: DS.r.md, marginBottom: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#000",
                  boxShadow: DS.shadow.glow(K.gold),
                }}>A</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: K.text }}>Altaclase Bodega</div>
                <div style={{ fontSize: 10, color: K.muted, marginTop: 2 }}>Control B2B</div>
              </div>
              {[
                { id: "home", label: "Inicio", icon: "⌂" },
                { id: "clientes", label: "Clientes", icon: "◎" },
                { id: "historial", label: "Historial", icon: "≡" },
                { id: "mas", label: "Más", icon: "···" },
              ].map(({ id, label, icon }) => {
                const active = tab === id;
                return (
                  <button key={id} onClick={() => setTab(id)} style={{
                    width: "100%", background: active ? `${K.gold}14` : "transparent",
                    border: `1px solid ${active ? K.gold + "44" : "transparent"}`,
                    borderRadius: DS.r.md, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", marginBottom: 4, textAlign: "left",
                    WebkitTapHighlightColor: "transparent", transition: "all .15s",
                  }}>
                    <span style={{ fontSize: 14, color: active ? K.gold : K.muted, width: 20, textAlign: "center" }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? K.gold : K.mutedLighter }}>{label}</span>
                  </button>
                );
              })}
            </>
          </div>

          {/* Contenido principal — CSS controla el layout responsive */}
          <div style={{
            flex: 1,
            minWidth: 0,
            overflowX: "hidden",
            overflowY: "auto",
            height: "100vh",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "calc(68px + env(safe-area-inset-bottom,0px))",
          }}>
            <div className="ac-main-inner">
              {/* Toast: ver ./providers/ToastProvider.jsx (ToastHost) — se renderiza
                  fuera de este árbol a propósito, para no re-renderizar toda la app. */}
              <div style={{}}>{children}</div>

              {/* FAB premium */}
              {mostrarFab && (
                <button
                  onClick={() => setShowNuevo(true)}
                  style={{
                    position: "fixed",
                    bottom: `calc(80px + env(safe-area-inset-bottom,0px))`,
                    right: `calc(20px + env(safe-area-inset-right,0px))`,
                    width: 58, height: 58,
                    background: `linear-gradient(135deg, ${K.gold} 0%, ${K.gold}CC 100%)`,
                    border: "none",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 6px 24px ${K.gold}55, 0 2px 8px rgba(0,0,0,.4)`,
                    cursor: "pointer", zIndex: 150,
                    WebkitTapHighlightColor: "transparent",
                    fontSize: 28, color: "#000", fontWeight: 300, lineHeight: 1,
                    transition: "transform .15s, box-shadow .15s",
                  }}>
                  +
                </button>
              )}

              {/* Modal de nuevo movimiento — slide up con blur */}
              {showNuevo && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 500, display: "flex", alignItems: "flex-end" }} onClick={() => setShowNuevo(false)}>
                  <div onClick={e => e.stopPropagation()} style={{
                    background: DS.glass,
                    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                    width: "100%", maxWidth: 430, margin: "0 auto",
                    borderRadius: "24px 24px 0 0",
                    border: `1px solid ${DS.glassBorder}`,
                    borderBottom: "none",
                    maxHeight: "92dvh", overflowY: "auto",
                    paddingBottom: "env(safe-area-inset-bottom,0px)",
                    boxShadow: "0 -8px 40px rgba(0,0,0,.6)",
                  }}>
                    <div style={{ width: 40, height: 4, background: K.card4, borderRadius: 2, margin: "12px auto 0" }} />
                    <NuevoMovimiento />
                  </div>
                </div>
              )}

              {/* Nav — CSS oculta en desktop */}
              <nav className="ac-nav">
                {NAV.map(({ id }) => {
                  const active = tab === id;
                  const acc = K.gold;
                  const icons = {
                    home: <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? acc : "none"} stroke={active ? acc : K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
                    clientes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? acc : K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
                    historial: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? acc : K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" /></svg>,
                    mas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? acc : K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
                  };
                  const labels = { home: "Inicio", clientes: "Clientes", historial: "Historial", mas: "Más" };
                  return <button key={id} onClick={() => setTab(id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, WebkitTapHighlightColor: "transparent" }}>
                    {icons[id]}
                    <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? acc : K.muted }}>{labels[id]}</span>
                  </button>;
                })}
              </nav>

              {/* FAB — CSS posiciona correctamente */}
              {mostrarFab && (
                <div className="ac-fab">
                  <button onClick={() => setShowNuevo(true)} style={{ width: 56, height: 56, background: K.gold, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${K.gold}50`, cursor: "pointer", fontSize: 26, color: "#000", fontWeight: 300, WebkitTapHighlightColor: "transparent" }}>+</button>
                </div>
              )}

              {editIng && <EditIngreso item={editIng} onClose={() => setEditIng(null)} onSave={updateIngreso} onDelete={removeIngreso} />}
              {editGas && <EditGasto item={editGas} onClose={() => setEditGas(null)} onSave={updateGasto} onDelete={removeGasto} />}
            </div>{/* fin ac-main-inner */}
          </div>{/* fin flex col */}
        </div>{/* fin flex row */}
      </div>{/* fin wrapper */}
    </>
  );
}
