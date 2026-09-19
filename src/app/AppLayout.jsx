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

const NAV_ICONS = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>,
  clientes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
  historial: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  mas: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>,
};

/** Item de la barra flotante inferior: icono + label, con pill de acento cuando está activo. */
function NavItem({ id, active, onClick }) {
  const labels = { home: "Inicio", clientes: "Clientes", historial: "Historial", mas: "Más" };
  const color = active ? K.gold : "#7A7A7E";
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: active ? `${K.gold}22` : "none", border: "none",
        padding: "8px 4px", borderRadius: DS.r.md, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ color, display: "flex" }}>{NAV_ICONS[id]}</span>
      <span style={{ fontSize: 9, fontWeight: active ? 700 : 600, color }}>{labels[id]}</span>
    </button>
  );
}

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
        html,body{margin:0;padding:0;background:${K.bg};width:100%;max-width:100vw;overflow-x:hidden;overscroll-behavior:none;}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        .ac-sidebar{display:none;flex-direction:column;width:220px;min-height:100dvh;
          background:rgba(20,20,22,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-right:1px solid rgba(255,255,255,.07);padding:48px 16px 24px;
          position:static;top:0;left:0;bottom:0;z-index:100;}
        .ac-main-inner{width:100%;max-width:430px;margin:0 auto;}
        .ac-nav-wrap{position:fixed;left:0;right:0;bottom:0;z-index:200;}
        .ac-nav{display:flex;align-items:center;justify-content:space-around;height:68px;
          padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:content-box;
          background:${K.ink};border-radius:${DS.r.xl}px ${DS.r.xl}px 0 0;padding-left:6px;padding-right:6px;
          box-shadow:0 -8px 30px rgba(0,0,0,.5);}
        @media(min-width:768px) and (min-height:600px){
          .ac-sidebar{display:flex!important;}
          .ac-main-inner{max-width:none!important;margin-left:0!important;}
          .ac-nav-wrap{display:none!important;}
          .ac-fab-desktop{display:flex!important;}
          .ac-desktop-2col{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;align-items:start!important;}
        }
        /* Celular en horizontal: pantalla ancha pero baja (a diferencia de
           un desktop real), asi que NO se activa el sidebar/FAB de escritorio
           arriba (quedaria un layout roto de "computador" en un telefono).
           Solo se le da mas ancho al contenido y se parten los modulos del
           Home en 2 columnas para que no queden diminutos. */
        @media (orientation:landscape) and (max-height:600px){
          .ac-main-inner{max-width:680px!important;}
          .ac-desktop-2col{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;align-items:start!important;}
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
            paddingBottom: "calc(96px + env(safe-area-inset-bottom,0px))",
          }}>
            <div className="ac-main-inner">
              {/* Toast: ver ./providers/ToastProvider.jsx (ToastHost) — se renderiza
                  fuera de este árbol a propósito, para no re-renderizar toda la app. */}
              <div style={{}}>{children}</div>

              {/* FAB de escritorio: en mobile vive integrado a la barra inferior (ver .ac-nav) */}
              {mostrarFab && (
                <button
                  onClick={() => setShowNuevo(true)}
                  className="ac-fab-desktop"
                  style={{
                    display: "none",
                    position: "fixed",
                    bottom: 32,
                    right: 32,
                    width: 58, height: 58,
                    background: `linear-gradient(135deg, ${K.gold} 0%, ${K.gold}CC 100%)`,
                    border: "none",
                    borderRadius: "50%",
                    alignItems: "center", justifyContent: "center",
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

              {/* Nav flotante — CSS oculta en desktop. El FAB de "nuevo movimiento"
                  vive integrado al centro de la barra (antes eran 2 botones
                  flotantes distintos casi superpuestos — se unificó en uno). */}
              <div className="ac-nav-wrap">
                <nav className="ac-nav">
                  {NAV.slice(0, 2).map(({ id }) => (
                    <NavItem key={id} id={id} active={tab === id} onClick={() => setTab(id)} />
                  ))}

                  {mostrarFab ? (
                    <button
                      onClick={() => setShowNuevo(true)}
                      aria-label="Nuevo movimiento"
                      style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: K.gold, border: `5px solid ${K.ink}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transform: "translateY(-16px)", boxShadow: `0 8px 18px ${K.gold}55`,
                        cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent",
                      }}>
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#0A0A0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  ) : (
                    <div style={{ width: 52, flexShrink: 0 }} />
                  )}

                  {NAV.slice(2).map(({ id }) => (
                    <NavItem key={id} id={id} active={tab === id} onClick={() => setTab(id)} />
                  ))}
                </nav>
              </div>

              {editIng && <EditIngreso item={editIng} onClose={() => setEditIng(null)} onSave={updateIngreso} onDelete={removeIngreso} />}
              {editGas && <EditGasto item={editGas} onClose={() => setEditGas(null)} onSave={updateGasto} onDelete={removeGasto} />}
            </div>{/* fin ac-main-inner */}
          </div>{/* fin flex col */}
        </div>{/* fin flex row */}
      </div>{/* fin wrapper */}
    </>
  );
}
