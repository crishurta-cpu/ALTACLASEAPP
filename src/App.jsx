import { useState } from "react";
import Tareas from "./features/tareas/Tareas";
import {
  CLAVE_ACCESO,
  ACCENT_KEY,
  ACCENTS,
  getAccentColor,
  DS,
  K,
  TIPOS,
  CONCS,
  CLIENTES_ESPECIALES,
  NO_SON_CLIENTES,
  noEsClienteReal,
  fmt,
} from "./constants";
import Historial from "./features/history/Historial";
import Divider from "./shared/ui/Divider";
import ConfirmDelete from "./shared/ui/ConfirmDelete";
import Pill from "./shared/ui/Pill";
import Btn from "./shared/ui/Btn";
import ChipGroup from "./shared/ui/ChipGroup";
import AutocompleteInput from "./shared/ui/AutocompleteInput";
import GraficoCircular from "./shared/charts/GraficoCircular";
import Configuracion from "./features/settings/Configuracion";
import LoginScreen from "./features/auth/LoginScreen";
import IngresoForm from "./features/ingresos/IngresoForm";
import IngresoBloqueForm from "./features/ingresos/IngresoBloqueForm";
import EditIngreso from "./features/ingresos/EditIngreso";
import GastoForm from "./features/gastos/GastoForm";
import EditGasto from "./features/gastos/EditGasto";
import Inventario from "./features/inventario/Inventario";
import Personal from "./features/personal/Personal";
import BusquedaGlobal from "./features/search/BusquedaGlobal";
import Clientes from "./features/clients/Clientes";
import Home from "./features/home/Home";
import { useAuth } from "./app/hooks/useAuth";
import { useData } from "./app/hooks/useData";
import { useNav } from "./app/hooks/useNav";


// ═══ UI ATOMS ═════════════════════════════════════════════════
// GraficoPuntos: ver ./features/home/GraficoGananciaDiaria.jsx

// Home: ver ./features/home/Home.jsx

// ═══ AUTOCOMPLETE INPUT ══════════════════════════════════════════
// Ver: ./shared/ui/AutocompleteInput.jsx



// ═══ NUEVO MOVIMIENTO ════════════════════════════════════════════
function NuevoMovimiento({
  onSaveIngreso,
  onSaveGasto,
  clientes,
  proveedores,
}) {
    const [modo,setModo]=useState("ingreso");
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <button onClick={()=>setModo("ingreso")} style={{flex:1,background:modo==="ingreso"?`${K.gold}18`:K.card,border:`1.5px solid ${modo==="ingreso"?K.gold:K.border}`,color:modo==="ingreso"?K.gold:K.muted,borderRadius:DS.r.md,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Ingreso</button>
        <button onClick={()=>setModo("lote")} style={{flex:1,background:modo==="lote"?`${K.gold}18`:K.card,border:`1.5px solid ${modo==="lote"?K.gold:K.border}`,color:modo==="lote"?K.gold:K.muted,borderRadius:DS.r.md,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Lote</button>
        <button onClick={()=>setModo("gasto")} style={{flex:1,background:modo==="gasto"?`${K.red}22`:K.card,border:`1.5px solid ${modo==="gasto"?K.red:K.border}`,color:modo==="gasto"?K.red:K.muted,borderRadius:DS.r.md,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Gasto</button>
      </div>
      {modo==="ingreso"&&<IngresoForm onSave={onSaveIngreso} clientes={clientes} proveedores={proveedores}/>}
      {modo==="lote"&&<IngresoBloqueForm onSave={onSaveIngreso} clientes={clientes}/>}
      {modo==="gasto"&&<GastoForm onSave={onSaveGasto}/>}
    </div>
  );
}


// GraficoCircular: ver ./shared/charts/GraficoCircular.jsx

// Historial: ver ./features/history/Historial.jsx

// ═══ CLIENTES ══════════════════════════════════════════════════
// ═══ MARCAR PAGADO ═══════════════════════════════════════════════
// Actualiza DEBE?=NO en CADA fila de INGRESOS de ese cliente que tenga deuda.
// Esto es lo único que persiste de verdad: la hoja CLIENTES se recalcula sola con
// fórmulas, así que escribirle ahí se perdería en el próximo recálculo.
// ═══ ABONO MODAL ═════════════════════════════════════════════════
// Registra un abono en la columna F de CLIENTES buscando por nombre.
// El valor que se guarda es el TOTAL acumulado de abonos (el que ya había + el nuevo),
// porque la hoja espera el total, no el incremento.


// Clientes: ver ./features/clients/Clientes.jsx

// ═══ BÚSQUEDA GLOBAL ═════════════════════════════════════════════

// BusquedaGlobal: ver ./features/search/BusquedaGlobal.jsx

// ═══ MÁS ═══════════════════════════════════════════════════════

// ═══ MÁS ═══════════════════════════════════════════════════════
// Sub-tabs de Más (no es un wrapper, tiene estado y dispatch).
function Mas({db,onEditIngreso,onEditGasto,onMarcarPagado,onRegistrarAbono,onAddInv,onEditInv,onDeleteInv,onAddDeuda,onEditDeuda,onDeleteDeuda}){
  const [v,setV]=useState("clientes");
  const tabs=[["buscar","🔍","Buscar"],["tareas","🤖","Tareas"],["inv","📦","Inventario"],["personal","📓","Personal"],["config","⚙️","Config"]];
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:14}}>Más</div>
      <div style={{display:"flex",gap:0,marginBottom:16,background:K.card2,borderRadius:DS.r.md,overflow:"hidden",border:`1px solid ${K.border}`}}>
        {tabs.map(([id,icon,label],i)=>(
          <button key={id} onClick={()=>setV(id)} style={{flex:1,background:v===id?K.card:"transparent",border:"none",color:v===id?K.text:K.muted,padding:"10px 4px",fontSize:10,fontWeight:700,cursor:"pointer",borderRight:i<tabs.length-1?`1px solid ${K.border}`:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{textTransform:"uppercase",letterSpacing:.5,fontSize:9}}>{label}</span>
          </button>
        ))}
      </div>
      {v==="buscar"&&<BusquedaGlobal db={db} onEditIngreso={onEditIngreso} onEditGasto={onEditGasto}/>}
      {v==="inv"&&<Inventario db={db} onAdd={onAddInv} onEdit={onEditInv} onDelete={onDeleteInv}/>}
      {v==="tareas" && (<Tareas />)}
      {v==="personal"&&<Personal db={db} onAdd={onAddDeuda} onEdit={onEditDeuda} onDelete={onDeleteDeuda}/>}
      {v==="config"&&<Configuracion/>}
    </div>
  );
}
// LoginScreen: ver ./features/auth/LoginScreen.jsx

export default function App(){
  const {autenticado,login}=useAuth();
  const {tab,setTab,showNuevo,setShowNuevo,editIng,setEditIng,editGas,setEditGas}=useNav();
  const {
    db,loading,initDone,initError,lastSync,clientes,proveedores,loadData,
    saveIngreso,saveGasto,updateIngreso,updateGasto,removeIngreso,removeGasto,
    addInventario,editInventario,removeInventario,
    addDeuda,editDeuda,removeDeuda,
    marcarPagado,registrarAbono,
  }=useData();

  const NAV=[
    {id:"home",icon:"⌂",label:""},
    {id:"clientes",icon:"",label:"Clientes"},
    {id:"historial",icon:"",label:"Historial"},
    {id:"mas",icon:"",label:"Más"},
  ];

  if(!autenticado){
    return <LoginScreen onSuccess={()=>{login();setTab("home");}}/>;
  }

  if(!initDone){
    return(
      <div style={{background:K.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:K.text,fontFamily:"-apple-system,sans-serif"}}>
        <span style={{fontSize:56}}>👟</span>
        <div style={{color:K.gold,fontWeight:700,fontSize:18}}>Altaclase Bodega</div>
        <div style={{color:K.muted,fontSize:13}}>Conectando con Google Sheets...</div>
        <div style={{width:40,height:4,background:K.border,borderRadius:2,overflow:"hidden",marginTop:8}}>
          <div style={{width:"60%",height:"100%",background:K.gold,borderRadius:2}}/>
        </div>
      </div>
    );
  }

  if(initError&&db.ingresos.length===0&&db.gastos.length===0){
    return(
      <div style={{background:K.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,color:K.text,fontFamily:"-apple-system,sans-serif",padding:24,textAlign:"center"}}>
        <span style={{fontSize:48}}>⚠️</span>
        <div style={{color:K.red,fontWeight:700,fontSize:17}}>No conectó con Sheets</div>
        <div style={{color:K.muted,fontSize:13,maxWidth:300}}>{initError}</div>
        <div style={{maxWidth:280,width:"100%"}}><Btn label="Reintentar" onClick={()=>loadData(false)} loading={loading}/></div>
      </div>
    );
  }

  const acc=K.gold;
  return(
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
      background:K.bg,minHeight:"100dvh",color:K.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      WebkitFontSmoothing:"antialiased",width:"100%",overflowX:"hidden",
    }}>
    <div style={{display:"flex",minHeight:"100dvh"}}>
      {/* Sidebar — desktop only via CSS class */}
      <div className="ac-sidebar">
        <>
          <div style={{marginBottom:32,padding:"0 8px"}}>
            <div style={{
              width:44,height:44,
              background:`linear-gradient(135deg,${K.gold} 0%,${K.gold}99 100%)`,
              borderRadius:DS.r.md,marginBottom:12,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:20,fontWeight:700,color:"#000",
              boxShadow:DS.shadow.glow(K.gold),
            }}>A</div>
            <div style={{fontSize:13,fontWeight:700,color:K.text}}>Altaclase Bodega</div>
            <div style={{fontSize:10,color:K.muted,marginTop:2}}>Control B2B</div>
          </div>
          {[
            {id:"home",label:"Inicio",icon:"⌂"},
            {id:"clientes",label:"Clientes",icon:"◎"},
            {id:"historial",label:"Historial",icon:"≡"},
            {id:"mas",label:"Más",icon:"···"},
          ].map(({id,label,icon})=>{
            const active=tab===id;
            return(
              <button key={id} onClick={()=>setTab(id)} style={{
                width:"100%",background:active?`${K.gold}14`:"transparent",
                border:`1px solid ${active?K.gold+"44":"transparent"}`,
                borderRadius:DS.r.md,padding:"10px 12px",
                display:"flex",alignItems:"center",gap:10,
                cursor:"pointer",marginBottom:4,textAlign:"left",
                WebkitTapHighlightColor:"transparent",transition:"all .15s",
              }}>
                <span style={{fontSize:14,color:active?K.gold:K.muted,width:20,textAlign:"center"}}>{icon}</span>
                <span style={{fontSize:13,fontWeight:active?600:400,color:active?K.gold:K.mutedLighter}}>{label}</span>
              </button>
            );
                    })}
        </>
      </div>
      {/* Contenido principal — CSS controla el layout responsive */}
<div style={{
  flex:1,
  minWidth:0,
  overflowX:"hidden",
  overflowY:"auto",
  height:"100vh",
  WebkitOverflowScrolling:"touch",
  paddingBottom:"calc(68px + env(safe-area-inset-bottom,0px))"
}}>
          <div className="ac-main-inner">
      {/* Toast: ver ./app/providers/ToastProvider.jsx (ToastHost) — se renderiza
          fuera de este árbol a propósito, para no re-renderizar toda la app. */}
      {/* Contenido principal — scroll nativo */}
<div style={{}}>
          {tab==="home"&&<Home db={db} onRefresh={()=>loadData(false)} loading={loading} lastSync={lastSync}/>}
        {tab==="clientes"&&<div style={{padding:"0 0 0"}}><div style={{padding:"16px 16px 0"}}><div style={{fontSize:28,fontWeight:700,letterSpacing:-.5,marginBottom:16,color:K.text}}>Clientes</div><Clientes db={db} onEditIngreso={setEditIng} onMarcarPagado={marcarPagado} onRegistrarAbono={registrarAbono}/></div></div>}
        {tab==="historial"&&<div style={{padding:"0 0 0"}}><div style={{padding:"16px 16px 0"}}><div style={{fontSize:28,fontWeight:700,letterSpacing:-.5,marginBottom:16,color:K.text}}>Historial</div><Historial db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas}/></div></div>}
        {tab==="mas"&&<Mas db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas} onMarcarPagado={marcarPagado} onRegistrarAbono={registrarAbono} onAddInv={addInventario} onEditInv={editInventario} onDeleteInv={removeInventario} onAddDeuda={addDeuda} onEditDeuda={editDeuda} onDeleteDeuda={removeDeuda}/>}
      </div>

      {/* FAB premium */}
      {(tab==="home"||tab==="clientes"||tab==="historial")&&(
        <button
          onClick={()=>setShowNuevo(true)}
          style={{
            position:"fixed",
            bottom:`calc(80px + env(safe-area-inset-bottom,0px))`,
            right:`calc(20px + env(safe-area-inset-right,0px))`,
            width:58,height:58,
            background:`linear-gradient(135deg, ${K.gold} 0%, ${K.gold}CC 100%)`,
            border:"none",
            borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 6px 24px ${K.gold}55, 0 2px 8px rgba(0,0,0,.4)`,
            cursor:"pointer",zIndex:150,
            WebkitTapHighlightColor:"transparent",
            fontSize:28,color:"#000",fontWeight:300,lineHeight:1,
            transition:"transform .15s, box-shadow .15s",
          }}>
          +
        </button>
      )}

      {/* Modal de nuevo movimiento — slide up con blur */}
      {showNuevo&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",zIndex:500,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowNuevo(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:DS.glass,
            backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
            width:"100%",maxWidth:430,margin:"0 auto",
            borderRadius:"24px 24px 0 0",
            border:`1px solid ${DS.glassBorder}`,
            borderBottom:"none",
            maxHeight:"92dvh",overflowY:"auto",
            paddingBottom:"env(safe-area-inset-bottom,0px)",
            boxShadow:"0 -8px 40px rgba(0,0,0,.6)",
          }}>
            <div style={{width:40,height:4,background:K.card4,borderRadius:2,margin:"12px auto 0"}}/>
            <NuevoMovimiento
              onSaveIngreso={async r=>{await saveIngreso(r);setShowNuevo(false);}}
              onSaveGasto={async r=>{await saveGasto(r);setShowNuevo(false);}}
              clientes={clientes}
              proveedores={proveedores}
            />
          </div>
        </div>
      )}

      {/* Nav — CSS oculta en desktop */}
      <nav className="ac-nav">
        {NAV.map(({id,label})=>{
          const active=tab===id;
          const acc=K.gold;
          const icons={
            home:<svg width="20" height="20" viewBox="0 0 24 24" fill={active?acc:"none"} stroke={active?acc:K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>,
            clientes:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?acc:K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
            historial:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?acc:K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3"/></svg>,
            mas:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?acc:K.muted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>,
          };
          const labels={home:"Inicio",clientes:"Clientes",historial:"Historial",mas:"Más"};
          return <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"none",border:"none",padding:"10px 0 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,WebkitTapHighlightColor:"transparent"}}>
            {icons[id]}
            <span style={{fontSize:10,fontWeight:active?600:400,color:active?acc:K.muted}}>{labels[id]}</span>
          </button>;
        })}
      </nav>

      {/* FAB — CSS posiciona correctamente */}
      {(tab==="home"||tab==="clientes"||tab==="historial")&&(
        <div className="ac-fab">
          <button onClick={()=>setShowNuevo(true)} style={{width:56,height:56,background:K.gold,border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${K.gold}50`,cursor:"pointer",fontSize:26,color:"#000",fontWeight:300,WebkitTapHighlightColor:"transparent"}}>+</button>
        </div>
      )}

      {editIng&&<EditIngreso item={editIng} onClose={()=>setEditIng(null)} onSave={updateIngreso} onDelete={removeIngreso}/>}
      {editGas&&<EditGasto item={editGas} onClose={()=>setEditGas(null)} onSave={updateGasto} onDelete={removeGasto}/>}
        </div>{/* fin ac-main-inner */}
      </div>{/* fin flex col */}
    </div>{/* fin flex row */}
    </div>{/* fin wrapper */}
    </>
  );
}
