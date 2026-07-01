import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://script.google.com/macros/s/AKfycbySGO0LtHtnT7SBEHF22TfsDUmz3kqmz3C2a-tZk6zL3_ZFuEoUF485h4QWvxq4H_S7/exec";
const SYNC_INTERVAL_MS = 120000; // 2 minutos

// Clave de acceso simple: bloquea curiosos casuales con el link, no es seguridad
// criptográfica real (vive en el código del navegador). Suficiente para un solo
// operador; si la app crece a multi-usuario, esto debe pasar a un backend real.
const CLAVE_ACCESO = "ClaudeAlta";
const LS_AUTH_KEY = "altaclase_auth_ok";

// ═══ DESIGN SYSTEM ALTACLASE 3.0 ═══════════════════════════════
// Soft UI Premium: sombras profundas, gradientes, glassmorphism sutil.
// Inspirado en Linear, Stripe, Arc Browser, Apple.
const ACCENT_KEY="altaclase_accent";
const ACCENTS=[
  {id:"gold",label:"Dorado",color:"#D4A843"},
  {id:"blue",label:"Azul",color:"#3B82F6"},
  {id:"green",label:"Verde",color:"#10B981"},
  {id:"purple",label:"Púrpura",color:"#8B5CF6"},
  {id:"orange",label:"Naranja",color:"#F59E0B"},
  {id:"teal",label:"Teal",color:"#06B6D4"},
  {id:"rose",label:"Rosa",color:"#F43F5E"},
  {id:"white",label:"Blanco",color:"#F1F5F9"},
];
const getAccentColor=()=>{
  const saved=localStorage.getItem(ACCENT_KEY);
  const found=ACCENTS.find(a=>a.id===saved);
  return found?found.color:"#D4A843";
};
// Sombras y radios del sistema
const DS={
  r:{sm:10,md:16,lg:20,xl:24,xxl:28},
  shadow:{
    sm:"0 1px 3px rgba(0,0,0,.4)",
    md:"0 4px 16px rgba(0,0,0,.5)",
    lg:"0 8px 32px rgba(0,0,0,.6)",
    xl:"0 16px 48px rgba(0,0,0,.7)",
    glow:(col)=>`0 4px 20px ${col}33`,
  },
  glass:"rgba(28,28,35,.85)",
  glassBorder:"rgba(255,255,255,.06)",
};
const K={
  bg:"#0D0D12",            // negro azulado profundo — más rico que negro puro
  card:"#16161F",          // tarjeta nivel 1 — ligero tinte índigo
  card2:"#1E1E2A",         // tarjeta nivel 2
  card3:"#252533",         // input y elementos interactivos
  card4:"#2E2E3D",         // hover y activos
  get gold(){return getAccentColor();},
  green:"#10B981",
  red:"#EF4444",
  blue:"#3B82F6",
  yellow:"#F59E0B",
  purple:"#8B5CF6",
  orange:"#F97316",
  teal:"#06B6D4",
  border:"rgba(255,255,255,.07)",
  borderStrong:"rgba(255,255,255,.12)",
  muted:"#6B7280",
  mutedLighter:"#9CA3AF",
  text:"#F1F5F9",
  white:"#FFFFFF",
};
const CCAT={"AHORRO":K.blue,"DEUDA - BANCOS":K.red,"GASTO FIJO":K.yellow,"MERCADO":"#4CAF7D","NEGOCIO":K.purple,"PERSONALES":K.orange,"SALIDA / DOMICILIO":"#C47EB8"};
const TIPOS=["VENTA","COMISION","COMPRA CON SALDO","OCASIONALES","RECIBIDO CLIENTE"];
const CONCS=["NEGOCIO","GASTO FIJO","SALIDA / DOMICILIO","AHORRO","MERCADO","PERSONALES","DEUDA - BANCOS"];

// Bayron y Marco son clientes especiales: sus filas en INGRESOS NO deben afectar
// ningún total general (Home, ranking de clientes, historial agregado) salvo
// cuando el TIPO sea VENTA o COMISION — esos sí cuentan como ganancia real tuya.
const CLIENTES_ESPECIALES=["BAYRON","MARCO","MARCOS"];
const esClienteEspecial=nombre=>CLIENTES_ESPECIALES.includes(String(nombre||"").toUpperCase().trim());

// Estos nombres NO son clientes reales (son movimientos internos: parqueadero,
// préstamos a Pipe, capital propio, etc.) — exactamente la misma exclusión que usa
// la fórmula UNIQUE/FILTER de la hoja CLIENTES en tu Excel real.
const NO_SON_CLIENTES=["BAYRON","PARQUEADERO","PIPE","PRESTAMO","CLIENTE","CRIS","PRIMOS"];
const noEsClienteReal=nombre=>NO_SON_CLIENTES.includes(String(nombre||"").toUpperCase().trim());

// Filtro para TOTALES DEL NEGOCIO (Home, Utilidad del mes, Historial agregado).
// Solo aplica la regla de Bayron/Marco. CRIS, PRESTAMO, etc. SÍ cuentan aquí porque
// ese dinero entró y sí afecta tu ganancia real — solo no deben listarse como "clientes".
const cuentaParaTotales=ing=>{
  if(!esClienteEspecial(ing.cliente))return true;
  return ing.tipo==="VENTA"||ing.tipo==="COMISION";
};

// Filtro para la LISTA DE CLIENTES (pantalla Clientes). Aquí sí se excluyen los
// movimientos internos (CRIS, PRESTAMO, etc.) además de la regla Bayron/Marco,
// porque esos nombres no son revendedores reales.
const cuentaParaListaClientes=ing=>{
  if(noEsClienteReal(ing.cliente)&&!esClienteEspecial(ing.cliente))return false;
  if(!esClienteEspecial(ing.cliente))return true;
  return ing.tipo==="VENTA"||ing.tipo==="COMISION";
};

const fmt=n=>"$"+Number(n||0).toLocaleString("es-CO");
const mKey=d=>{if(!d)return"";try{const dt=new Date(d);if(isNaN(dt))return"";return`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;}catch{return"";}};
const curM=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
const mLabel=ym=>{if(!ym)return"";const[y,m]=ym.split("-");return["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][+m-1]+" "+y;};
const fDate=d=>{try{return new Date(d).toLocaleDateString("es-CO",{day:"2-digit",month:"short"});}catch{return"";}};

// ═══ API CALLS ════════════════════════════════════════════════
// GET con todo en query string + row en base64. Esto evita problemas de
// longitud de URL y de caracteres especiales (tildes, comas) en nombres
// largos de cliente/producto/proveedor.
async function callApi(params){
  const qs=new URLSearchParams(params).toString();
  const res=await fetch(`${API}?${qs}`,{method:"GET",redirect:"follow"});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const json=await res.json();
  if(!json.ok)throw new Error(json.error||"Error de script");
  return json;
}

async function fetchSheet(sheetName){
  const json=await callApi({action:"read",sheet:sheetName});
  return json.data;
}
// Codificamos el row en base64 antes de mandarlo: así nombres con tildes, comas o
// textos largos (cliente, producto, proveedor) no rompen la query string del GET.
const b64=str=>btoa(unescape(encodeURIComponent(str)));
async function appendRow(sheetName,row){
  const json=await callApi({action:"append",sheet:sheetName,rowB64:b64(JSON.stringify(row))});
  return json.row; // número de fila real recién creada
}
async function updateRow(sheetName,rowNum,row){
  await callApi({action:"update",sheet:sheetName,rowNum:String(rowNum),rowB64:b64(JSON.stringify(row))});
}
async function deleteRow(sheetName,rowNum){
  await callApi({action:"delete",sheet:sheetName,rowNum:String(rowNum)});
}

// ═══ PARSERS ══════════════════════════════════════════════════
// Cada registro guarda _row = número de fila real en Sheets, necesario para editar/borrar.
function parseIngresos(rows){
  return rows.map(r=>{
    const ts=r["Marca temporal"];
    if(!ts)return null;
    const fecha=new Date(ts);
    if(isNaN(fecha))return null;
    const tipo=String(r["TIPO"]||"").trim();
    if(!tipo)return null;
    const costo=Number(r["COSTO"])||0;
    const pv=Number(r["PRECIO VENTA"])||0;
    const gan=Number(r["GANANCIA"])||pv-costo;
    return{
      id:"i"+r._row, _row:r._row, fecha:fecha.toISOString(), tipo,
      producto:String(r["PRODUCTO"]||"").trim(),
      cliente:String(r["CLIENTE"]||"").trim(),
      proveedor:String(r["PROVEEDOR"]||"").trim(),
      costo, precioVenta:pv,
      debe:String(r["DEBE?"]||"NO").toUpperCase().trim(),
      ganancia:gan,
      margen:pv>0?Math.round(gan/pv*100)+"%":"0%",
    };
  }).filter(r=>r&&r.tipo&&r.producto);
}

function parseGastos(rows){
  return rows.map(r=>{
    const ts=r["Marca temporal"];
    if(!ts)return null;
    const fecha=new Date(ts);
    if(isNaN(fecha))return null;
    const concepto=String(r["CONCEPTO"]||"").toUpperCase().trim();
    const costo=Number(r["COSTO"])||0;
    const ref=String(r["REFERENCIA DE GASTO"]||"").trim();
    if(!concepto||!costo)return null;
    return{id:"g"+r._row, _row:r._row, fecha:fecha.toISOString(), concepto, costo, referencia:ref};
  }).filter(r=>r&&r.concepto);
}

// Reconstruye el array de columnas en el MISMO orden que espera la hoja, a partir de un registro parseado.
function ingresoToRow(it){
  const d=new Date(it.fecha);
  const ts=`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}:00`;
  return [ts,it.tipo,it.producto,it.cliente,it.proveedor,it.costo,it.precioVenta,it.debe,it.ganancia,it.margen];
}
function gastoToRow(it){
  const d=new Date(it.fecha);
  const ts=`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}:00`;
  return [ts,it.concepto,it.costo,it.referencia];
}
// INVENTARIO: FECHA, PRODUCTO, PROVEEDOR, COSTO
function inventarioToRow(it){
  const d=new Date(it.fecha);
  const fechaStr=`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  return [fechaStr,it.producto,it.proveedor,it.costo];
}
// DEUDA VALEN: FECHA, MOVIMIENTO, PRESTO, PAGO, SALDO
function deudaPersonalToRow(it){
  return [it.fecha,it.movimiento,it.presto||"",it.pago||"",it.saldo];
}

// INVENTARIO: FECHA, PRODUCTO, PROVEEDOR, COSTO — lista simple de compras, sin cantidades.
function parseInventario(rows){
  return rows.map(r=>{
    const fecha=new Date(r["FECHA"]);
    if(isNaN(fecha))return null;
    const producto=String(r["PRODUCTO"]||"").trim();
    if(!producto)return null;
    return{
      id:"inv"+r._row, _row:r._row, fecha:fecha.toISOString(),
      producto, proveedor:String(r["PROVEEDOR"]||"").trim(),
      costo:Number(r["COSTO"])||0,
    };
  }).filter(Boolean);
}

// CLIENTES: resumen ya armado en Sheets por cliente. Lo usamos como referencia,
// pero los totales del Home se recalculan en JS sumando INGRESOS reales para que
// editar/borrar un registro se refleje al instante sin depender de fórmulas.
function parseClientesResumen(rows){
  return rows.map(r=>{
    const cliente=String(r["CLIENTE"]||"").trim();
    if(!cliente)return null;
    return{
      cliente,
      totalVenta:Number(r["TOTAL VENTA"])||0,
      totalIngresos:Number(r["TOTAL INGRESOS"])||0,
      saldo:Number(r["SALDO"])||0,
      debe:String(r["DEBE?"]||"NO").toUpperCase().trim(),
      abonos:Number(r["ABONOS"])||0,
      deudaTotal:Number(r["DEUDA TOTAL"])||0,
      gananciaSheet:Number(r["GANANCIA X CLIENTE"])||0,
    };
  }).filter(Boolean);
}

// CLIENTES ESPECIALES: Bayron y Marco con su sistema de saldo tipo cuenta corriente.
function parseClientesEspeciales(rows){
  return rows.map(r=>{
    const cliente=String(r["CLIENTE LIMPIO"]||r["CLIENTE"]||"").trim();
    if(!cliente)return null;
    return{
      cliente,
      saldoInicial:Number(r["SALDO INICIAL"])||0,
      recargas:Number(r["RECARGAS"])||0,
      compras:Number(r["COMPRAS"])||0,
      comisiones:Number(r["COMISIONES"])||0,
      saldo:Number(r["SALDO"])||0,
      debe:String(r["DEBE?"]||"NO").toUpperCase().trim(),
    };
  }).filter(Boolean);
}

// DEUDA VALEN: libro personal, FECHA, MOVIMIENTO, PRESTO, PAGO, SALDO. Vive separado del negocio.
function parseDeudaPersonal(rows){
  return rows.map(r=>{
    const mov=String(r["MOVIMIENTO"]||"").trim();
    if(!mov)return null;
    return{
      id:"dp"+r._row, _row:r._row,
      fecha:r["FECHA"]?String(r["FECHA"]):"",
      movimiento:mov,
      presto:Number(r["PRESTO"])||0,
      pago:Number(r["PAGO"])||0,
      saldo:Number(r["SALDO"])||0,
    };
  }).filter(Boolean);
}

// ═══ UI ATOMS ═════════════════════════════════════════════════
const Card=({ch,s={}})=><div style={{
  background:K.card,
  borderRadius:DS.r.lg,
  padding:"18px",
  marginBottom:12,
  border:`1px solid ${K.border}`,
  boxShadow:DS.shadow.md,
  ...s
}}>{ch}</div>;
const ConfirmDelete=({onConfirm,onCancel})=>(
  <div style={{display:"flex",gap:6,marginTop:10}}>
    <button onClick={onConfirm} style={{flex:1,background:`${K.red}18`,border:`1.5px solid ${K.red}`,color:K.red,borderRadius:DS.r.sm,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:.3}}>Sí, borrar</button>
    <button onClick={onCancel} style={{flex:1,background:"transparent",border:`1.5px solid ${K.border}`,color:K.muted,borderRadius:DS.r.sm,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
  </div>
);
const Btn=({label,onClick,col=K.gold,dis,outline,sm,loading})=>(
  <button onClick={onClick} disabled={dis||loading} style={{
    width:sm?"auto":"100%",
    padding:sm?"10px 20px":"15px",
    background:outline?"transparent":(dis||loading)?K.card3:col,
    color:outline?col:(dis||loading)?K.muted:"#000000",
    border:outline?`1.5px solid ${col}`:"none",
    borderRadius:sm?DS.r.sm:DS.r.md,
    fontSize:sm?13:15,
    fontWeight:600,
    cursor:(dis||loading)?"not-allowed":"pointer",
    opacity:(dis||loading)?.35:1,
    letterSpacing:-.1,
    WebkitTapHighlightColor:"transparent",
    boxShadow:(dis||loading||outline)?"none":DS.shadow.glow(col),
    transition:"opacity .15s, box-shadow .15s, transform .1s",
  }}>
    {loading?"Guardando...":label}
  </button>
);
const ChipGroup=({label,options,value,onChange,colorMap={}})=>(
  <div style={{marginBottom:16}}>
    {label&&<div style={{fontSize:10,color:K.muted,marginBottom:7,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{label}</div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {options.map(o=>{
        const col=colorMap[o]||K.gold,sel=value===o;
        return(
          <button key={o} onClick={()=>onChange(o)} style={{
            background:sel?`${col}18`:"transparent",
            border:`1px solid ${sel?col:K.border}`,
            color:sel?col:K.muted,
            borderRadius:20,padding:"5px 13px",fontSize:11,
            fontWeight:sel?600:400,cursor:"pointer",
            WebkitTapHighlightColor:"transparent",
            transition:"all .15s",
          }}>{o}</button>
        );
      })}
    </div>
  </div>
);
const FInput=({label,value,onChange,type="text",placeholder,prefix})=>(
  <div style={{marginBottom:16,minWidth:0}}>
    {label&&<div style={{fontSize:11,color:K.mutedLighter,marginBottom:6,fontWeight:500,letterSpacing:.3,textTransform:"uppercase"}}>{label}</div>}
    <div style={{display:"flex",alignItems:"center",background:K.card3,borderRadius:DS.r.md,overflow:"hidden",minWidth:0,border:`1px solid ${K.border}`,transition:"border .15s",boxShadow:DS.shadow.sm}}>
      {prefix&&<span style={{padding:"0 14px",color:K.muted,fontSize:15,flexShrink:0,fontWeight:500}}>{prefix}</span>}
      <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{flex:1,minWidth:0,width:"100%",background:"transparent",border:"none",color:K.text,padding:"14px 14px",fontSize:16,outline:"none",boxSizing:"border-box",WebkitAppearance:"none"}}/>
    </div>
  </div>
);

// Confirmación inline de borrado (sin window.confirm, que no anda bien en el artifact)



// ═══ HOME ═════════════════════════════════════════════════════
// ═══ REPORTE BTN ══════════════════════════════════════════════
// Genera un resumen del mes en texto plano, listo para copiar o compartir
// por WhatsApp sin abrir otra app ni formatear nada a mano.
// ═══ GRÁFICO DE PUNTOS ════════════════════════════════════════════
function GraficoPuntos({datos}){
  if(!datos||datos.length<2)return null;
  const W=300,H=90,PADY=14,PADX=48; // PADX izquierdo para etiquetas de escala
  const vals=datos.map(d=>d.total);
  const max=Math.max(...vals)||1;
  // Escala legible: redondear al múltiplo bonito más cercano
  const rango=max;
  const mag=Math.pow(10,Math.floor(Math.log10(rango)));
  const step=rango<=mag?mag/5:rango<=2*mag?mag/2:rango<=5*mag?mag:2*mag;
  const maxEje=Math.ceil(max/step)*step;
  const guias=[0,Math.round(maxEje/2),maxEje];
  const toY=v=>PADY+(1-v/maxEje)*(H-PADY*2);
  const toX=(i)=>PADX+(i/(datos.length-1))*(W-PADX-8);
  const pts=datos.map((d,i)=>({x:toX(i),y:toY(d.total),d}));
  const path="M"+pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
  const accent=getAccentColor();
  const fmtEje=n=>n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${Math.round(n/1000)}k`:String(n);
  return(
    <svg viewBox={`0 0 ${W} ${H+14}`} width="100%" style={{overflow:"visible",display:"block"}}>
      {/* Guías horizontales con etiquetas de escala */}
      {guias.map(g=>{
        const y=toY(g);
        return(
          <g key={g}>
            <line x1={PADX} y1={y} x2={W-4} y2={y} stroke={K.border} strokeWidth="0.5"/>
            <text x={PADX-4} y={y+3} textAnchor="end" fill={K.muted} fontSize="8">{fmtEje(g)}</text>
          </g>
        );
      })}
      {/* Línea de conexión */}
      <path d={path} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Área rellena sutil */}
      <path d={path+` L ${pts[pts.length-1].x} ${toY(0)} L ${pts[0].x} ${toY(0)} Z`} fill={accent} opacity="0.08"/>
      {/* Puntos */}
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={accent}/>
          <text x={p.x} y={H+12} textAnchor="middle" fill={K.muted} fontSize="7">{fDate(p.d.fecha).split(" ")[0]}</text>
        </g>
      ))}
    </svg>
  );
}

function Home({db,onRefresh,loading,lastSync}){
  const m=curM();
  // cuentaParaTotales aplica la regla: Bayron/Marco solo cuentan si TIPO=VENTA o COMISION.
  const ingTodos=db.ingresos.filter(i=>mKey(i.fecha)===m);
  const ing=ingTodos.filter(cuentaParaTotales);
  const gas=db.gastos.filter(g=>mKey(g.fecha)===m);
  const ventas=ing.reduce((s,i)=>s+i.precioVenta,0);
  const gan=ing.reduce((s,i)=>s+i.ganancia,0);
  const gastos=gas.reduce((s,g)=>s+g.costo,0);
  const ahorro=gas.filter(g=>g.concepto==="AHORRO").reduce((s,g)=>s+g.costo,0);
  const util=gan-gastos;
  const mrg=ventas>0?(util/ventas*100).toFixed(1):0;
  // ── Resumen semanal ──────────────────────────────────────────
  const hoy=new Date();
  const dow=(hoy.getDay()+6)%7; // lunes=0 ... domingo=6
  const inicioSem=new Date(hoy); inicioSem.setDate(hoy.getDate()-dow); inicioSem.setHours(0,0,0,0);
  const inicioSemAnt=new Date(inicioSem); inicioSemAnt.setDate(inicioSem.getDate()-7);
  const semActual=db.ingresos.filter(i=>cuentaParaTotales(i)&&new Date(i.fecha)>=inicioSem);
  const semAnt=db.ingresos.filter(i=>cuentaParaTotales(i)&&new Date(i.fecha)>=inicioSemAnt&&new Date(i.fecha)<inicioSem);
  const ganSem=semActual.reduce((s,i)=>s+i.ganancia,0);
  const ganSemAnt=semAnt.reduce((s,i)=>s+i.ganancia,0);
  const tendSem=ganSemAnt>0?Math.round((ganSem-ganSemAnt)/ganSemAnt*100):null;
  const ventasSem=semActual.length;
  const gasSem=db.gastos.filter(g=>new Date(g.fecha)>=inicioSem).reduce((s,g)=>s+g.costo,0);
  const cmap={};
  ing.filter(i=>i.tipo==="VENTA"&&i.cliente).forEach(i=>{
    const k=i.cliente.toUpperCase().trim();
    if(!cmap[k])cmap[k]={g:0,n:0};
    cmap[k].g+=i.ganancia;cmap[k].n++;
  });
  const top5=Object.entries(cmap).sort((a,b)=>b[1].g-a[1].g).slice(0,5);
  // La deuda real viene de la hoja CLIENTES (columna DEBE?). Se combinan duplicados
  // por espacios extra en el nombre (ej. "ALEJANDRA" vs "ALEJANDRA ") para no
  // mostrar al mismo cliente dos veces ni perder su deuda real.
  const debenMap={};
  (db.clientesResumen||[]).forEach(c=>{
    if(esClienteEspecial(c.cliente))return;
    const k=c.cliente.toUpperCase().trim();
    if(!debenMap[k])debenMap[k]={cliente:k,saldo:0,debe:false};
    debenMap[k].saldo+=c.saldo;
    debenMap[k].debe=debenMap[k].debe||c.debe==="SI";
  });
  const debenList=Object.values(debenMap).filter(c=>c.debe);
  // Mapa nombre -> saldo que debe, para marcar con ⚠️ en el Top Clientes si debe más de $1.000.000.
  const deudaPorNombre={};
  Object.values(debenMap).forEach(c=>{deudaPorNombre[c.cliente]=c.saldo;});
  // Últimos movimientos, separados en dos listas como pediste, cada una con su propio top 5.
  // Últimos 5 días con movimiento, agrupados por día (total + cantidad de ventas).
  // Usa TODOS los ingresos/gastos (no solo el mes actual) para que funcione bien
  // incluso los primeros días del mes, cuando el mes en curso aún no tiene 5 días de datos.
  const agruparPorDia=(lista,campoMonto)=>{
    const dias={};
    lista.forEach(item=>{
      const dk=new Date(item.fecha).toDateString();
      if(!dias[dk])dias[dk]={fecha:item.fecha,total:0,n:0};
      dias[dk].total+=item[campoMonto];
      dias[dk].n++;
    });
    return Object.values(dias).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,5);
  };
  const [debenAbierto,setDebenAbierto]=useState(false);
  const [gastosAbierto,setGastosAbierto]=useState(false);
  const diasIng=agruparPorDia(db.ingresos.filter(cuentaParaTotales),"ganancia");
  const ultimosGastos=[...db.gastos].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,5);
  const syncTxt=lastSync?lastSync.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}):"—";
  return(
    <div style={{padding:"0"}}>
      {/* Header — gradiente premium */}
      <div style={{
        padding:"56px 20px 20px",
        background:`linear-gradient(160deg, #16161F 0%, #0D0D12 100%)`,
        borderBottom:`1px solid ${K.border}`,
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Glow decoration */}
        <div style={{position:"absolute",top:-40,right:-20,width:160,height:160,borderRadius:"50%",background:`${K.gold}08`,filter:"blur(40px)",pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
          <div>
            <div style={{fontSize:10,color:K.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:4,opacity:.8}}>Altaclase Bodega</div>
            <div style={{fontSize:32,fontWeight:700,color:K.white,letterSpacing:-.8,lineHeight:1}}>{mLabel(m)}</div>
            <div style={{fontSize:11,color:K.muted,marginTop:4}}>Sync {syncTxt}</div>
          </div>
          <button onClick={onRefresh} disabled={loading} style={{background:K.card3,border:`1px solid ${K.border}`,borderRadius:DS.r.sm,padding:"8px 14px",color:loading?K.muted:K.gold,fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",WebkitTapHighlightColor:"transparent",boxShadow:DS.shadow.sm}}>
            {loading?"···":"↻ Sync"}
          </button>
        </div>
      </div>
      <div style={{padding:"14px 16px 0"}}>
        {/* Utilidad — card premium con glow */}
        <div style={{
          background:util>=0?`linear-gradient(135deg,#1A1810 0%,${K.card} 100%)`:`linear-gradient(135deg,#1A0E0E 0%,${K.card} 100%)`,
          borderRadius:DS.r.xl,padding:"24px 20px 20px",marginBottom:12,textAlign:"center",
          border:`1px solid ${util>=0?K.gold+"22":K.red+"22"}`,
          boxShadow:util>=0?`0 4px 32px ${K.gold}18`:`0 4px 32px ${K.red}12`,
          position:"relative",overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:-30,left:"50%",transform:"translateX(-50%)",width:200,height:100,borderRadius:"50%",background:util>=0?`${K.gold}06`:`${K.red}06`,filter:"blur(30px)"}}/>
          <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:8}}>Utilidad del mes</div>
          <div style={{fontSize:48,fontWeight:700,color:util>=0?K.gold:K.red,letterSpacing:-2,lineHeight:1,marginBottom:8}}>{fmt(util)}</div>
          <div style={{fontSize:12,color:K.muted}}>Margen <span style={{color:util>=0?K.gold:K.red,fontWeight:700}}>{mrg}%</span>{ahorro>0&&<span style={{marginLeft:8}}>· Ahorro <span style={{color:K.blue,fontWeight:600}}>{fmt(ahorro)}</span></span>}</div>
        </div>
        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["Ventas",ventas,K.gold],["Ganancia",gan,K.green],["Gastos",gastos,K.red]].map(([l,v,col])=>(
            <div key={l} style={{background:K.card2,borderRadius:DS.r.md,padding:"14px 8px",textAlign:"center",border:`1px solid ${K.border}`,boxShadow:DS.shadow.sm}}>
              <div style={{fontSize:9,color:K.muted,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              <div style={{fontSize:15,fontWeight:700,color:col}}>{fmt(v)}</div>
            </div>
          ))}
        </div>
        {/* Resumen semanal */}
        <div style={{background:K.card,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600,color:K.text}}>Esta semana</div>
            {tendSem!==null&&<span style={{fontSize:12,fontWeight:600,color:tendSem>=0?K.green:K.red}}>{tendSem>=0?"↑":"↓"} {Math.abs(tendSem)}%</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {[["Ganancia",fmt(ganSem),K.gold],["Ventas",ventasSem,K.text],["Gastos",fmt(gasSem),K.red]].map(([l,v,col])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:K.muted,fontWeight:500,marginBottom:3}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:col}}>{v}</div>
              </div>
            ))}
          </div>
        </div>


        {/* Top Clientes del Mes */}
        {top5.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600,color:K.text,marginBottom:10}}>Top Clientes del Mes</div>
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch"}}>
              {top5.map(([nom,st],i)=>{
                const debeMucho=(deudaPorNombre[nom]||0)>1000000;
                const medals=["#C9A84C","#A8A8A8","#8B6914","#38383A","#38383A"];
                return(
                  <div key={nom} style={{flexShrink:0,scrollSnapAlign:"start",width:88,background:K.card,borderRadius:DS.r.lg,padding:10,display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:88}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:medals[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:i<3?"#000":K.muted}}>{i+1}</div>
                      {debeMucho&&<span style={{fontSize:11}}>⚠️</span>}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{nom}</div>
                      <div style={{fontSize:13,fontWeight:700,color:i===0?K.gold:K.green}}>{fmt(st.g)}</div>
                      <div style={{fontSize:9,color:K.muted}}>{st.n} vta{st.n!==1?"s":""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gráfico de puntos — ganancia por día */}
        {diasIng.length>1&&(
          <div style={{background:K.card,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600,color:K.text,marginBottom:12}}>Ganancia por día</div>
            <GraficoPuntos datos={[...diasIng].reverse()}/>
          </div>
        )}

        {/* Deben cobrar — desplegable */}
        {debenList.length>0&&(
          <div style={{marginBottom:8}}>
            <button onClick={()=>setDebenAbierto(v=>!v)} style={{width:"100%",background:"#1C0808",border:`0.5px solid ${K.red}55`,borderRadius:debenAbierto?"12px 12px 0 0":12,padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:13,color:K.red,fontWeight:600}}>⚠ Deben cobrar <span style={{background:K.red,color:"#fff",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700,marginLeft:4}}>{debenList.length}</span></span>
              <span style={{color:K.muted,fontSize:12}}>{debenAbierto?"▲":"▼"}</span>
            </button>
            {debenAbierto&&(
              <div style={{background:"#160606",border:`0.5px solid ${K.red}55`,borderTop:"none",borderRadius:`0 0 ${DS.r.md}px ${DS.r.md}px`,padding:"10px 14px"}}>
                {debenList.map((c,i)=>(
                  <div key={c.cliente} style={{display:"flex",justifyContent:"space-between",paddingBottom:i<debenList.length-1?8:0,marginBottom:i<debenList.length-1?8:0,borderBottom:i<debenList.length-1?`0.5px solid ${K.red}22`:"none"}}>
                    <span style={{fontSize:13,color:K.text}}>{c.cliente}</span>
                    <span style={{fontSize:13,fontWeight:700,color:K.red}}>{fmt(c.saldo)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Últimos gastos — desplegable */}
        {ultimosGastos.length>0&&(
          <div style={{marginBottom:10}}>
            <button onClick={()=>setGastosAbierto(v=>!v)} style={{width:"100%",background:K.card,border:`0.5px solid ${K.border}`,borderRadius:gastosAbierto?"12px 12px 0 0":12,padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:13,color:K.muted,fontWeight:600}}>Últimos gastos</span>
              <span style={{color:K.muted,fontSize:12}}>{gastosAbierto?"▲":"▼"}</span>
            </button>
            {gastosAbierto&&(
              <div style={{background:K.card,border:`0.5px solid ${K.border}`,borderTop:"none",borderRadius:`0 0 ${DS.r.md}px ${DS.r.md}px`,padding:"10px 14px"}}>
                {ultimosGastos.map((g,i)=>(
                  <div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<ultimosGastos.length-1?9:0,marginBottom:i<ultimosGastos.length-1?9:0,borderBottom:i<ultimosGastos.length-1?`0.5px solid ${K.border}`:"none"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:K.text}}>{g.referencia}</div>
                      <div style={{fontSize:11,color:K.muted}}>{g.concepto} · {fDate(g.fecha)}</div>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:CCAT[g.concepto]||K.red,marginLeft:8}}>-{fmt(g.costo)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{textAlign:"center",fontSize:10,color:K.muted,paddingBottom:8,marginTop:4}}>
          {db.ingresos.length} ingresos · {db.gastos.length} gastos
        </div>
      </div>
    </div>
  );
}

// ═══ AUTOCOMPLETE INPUT ══════════════════════════════════════════
function AutocompleteInput({label,value,onChange,sugerencias=[],placeholder}){
  const [abiertas,setAbiertas]=useState(false);
  const filtradas=sugerencias.filter(s=>s.toUpperCase().includes((value||"").toUpperCase())&&s.toUpperCase()!==(value||"").toUpperCase()).slice(0,7);
  return(
    <div style={{marginBottom:16,minWidth:0,position:"relative"}}>
      {label&&<div style={{fontSize:10,color:K.mutedLighter,marginBottom:6,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{label}</div>}
      <div style={{
        display:"flex",alignItems:"center",
        background:K.card3,
        border:`1px solid ${value?K.gold+"66":K.border}`,
        borderRadius:DS.r.md,overflow:"hidden",minWidth:0,
        boxShadow:value?`0 0 0 3px ${K.gold}14`:"none",
        transition:"border .15s, box-shadow .15s",
      }}>
        <input
          value={value||""}
          onChange={e=>{onChange(e.target.value);setAbiertas(true);}}
          onFocus={()=>setAbiertas(true)}
          onBlur={()=>setTimeout(()=>setAbiertas(false),150)}
          placeholder={placeholder||""}
          autoCapitalize="characters"
          style={{flex:1,minWidth:0,width:"100%",background:"transparent",border:"none",color:K.text,padding:"14px 14px",fontSize:16,outline:"none",boxSizing:"border-box"}}
        />
        {value&&<button onMouseDown={()=>onChange("")} style={{background:"none",border:"none",color:K.muted,padding:"0 12px",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>}
      </div>
      {abiertas&&filtradas.length>0&&(
        <div style={{
          position:"absolute",top:"100%",left:0,right:0,
          background:"rgba(22,22,31,.98)",
          backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
          border:`1px solid rgba(255,255,255,.08)`,
          borderRadius:`0 0 ${DS.r.md}px ${DS.r.md}px`,
          zIndex:600,overflow:"hidden",
          boxShadow:"0 12px 32px rgba(0,0,0,.7)",
        }}>
          {filtradas.map((s,i)=>(
            <button key={s} onMouseDown={()=>{onChange(s);setAbiertas(false);}} style={{
              width:"100%",background:"none",border:"none",
              borderBottom:i<filtradas.length-1?`1px solid ${K.border}`:"none",
              color:K.text,padding:"12px 16px",textAlign:"left",
              cursor:"pointer",fontSize:14,fontWeight:500,
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ NUEVO MOVIMIENTO ════════════════════════════════════════════
function NuevoMovimiento({onSaveIngreso,onSaveGasto,clientes}){
  const [modo,setModo]=useState("ingreso");
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <button onClick={()=>setModo("ingreso")} style={{flex:1,background:modo==="ingreso"?`${K.gold}18`:K.card,border:`1.5px solid ${modo==="ingreso"?K.gold:K.border}`,color:modo==="ingreso"?K.gold:K.muted,borderRadius:DS.r.md,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Ingreso</button>
        <button onClick={()=>setModo("lote")} style={{flex:1,background:modo==="lote"?`${K.gold}18`:K.card,border:`1.5px solid ${modo==="lote"?K.gold:K.border}`,color:modo==="lote"?K.gold:K.muted,borderRadius:DS.r.md,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Lote</button>
        <button onClick={()=>setModo("gasto")} style={{flex:1,background:modo==="gasto"?`${K.red}22`:K.card,border:`1.5px solid ${modo==="gasto"?K.red:K.border}`,color:modo==="gasto"?K.red:K.muted,borderRadius:DS.r.md,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Gasto</button>
      </div>
      {modo==="ingreso"&&<IngresoForm onSave={onSaveIngreso} clientes={clientes}/>}
      {modo==="lote"&&<IngresoBloqueForm onSave={onSaveIngreso} clientes={clientes}/>}
      {modo==="gasto"&&<GastoForm onSave={onSaveGasto}/>}
    </div>
  );
}

// ═══ INGRESO BLOQUE FORM ══════════════════════════════════════════
// Registro rápido de múltiples ventas en una sola entrada.
// Cada fila = un producto vendido a un cliente por un proveedor.
function IngresoBloqueForm({onSave}){
  const [filas,setFilas]=useState([{id:1,producto:"",cliente:"",proveedor:"",costo:"",precio:""}]);
  const [saving,setSaving]=useState(false);
  const [ok,setOk]=useState(false);
  const [err,setErr]=useState(null);
  const nextId=Math.max(...filas.map(f=>f.id||0))+1;
  
  const updateFila=(id,k,v)=>{
    setFilas(f=>f.map(f=>f.id===id?{...f,[k]:v}:f));
  };
  const addFila=()=>setFilas(f=>[...f,{id:nextId,producto:"",cliente:"",proveedor:"",costo:"",precio:""}]);
  const removeFila=(id)=>setFilas(f=>f.filter(f=>f.id!==id));
  
  const guardar=async()=>{
    const validas=filas.filter(f=>f.producto&&f.cliente&&f.precio);
    if(validas.length===0){setErr("Agrega al menos una venta completa");return;}
    setSaving(true);setErr(null);
    try{
      for(const f of validas){
        const costo=Number(f.costo)||0;
        const pv=Number(f.precio)||0;
        const gan=pv-costo;
        const mrg=pv>0?(gan/pv*100).toFixed(1):0;
        const trim=s=>String(s||"").toUpperCase().trim();
        const item={fecha:new Date().toISOString(),tipo:"VENTA",producto:trim(f.producto),cliente:trim(f.cliente),proveedor:trim(f.proveedor),costo,precioVenta:pv,debe:"NO",ganancia:gan,margen:mrg+"%"};
        await onSave(ingresoToRow(item));
      }
      setFilas([{id:nextId+1,producto:"",cliente:"",proveedor:"",costo:"",precio:""}]);
      setOk(true);setTimeout(()=>setOk(false),2500);
    }catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };
  
  const total=filas.reduce((s,f)=>{const p=Number(f.precio)||0;const c=Number(f.costo)||0;return s+(p-c);},0);
  
  return(
    <div>
      {ok&&<div style={{textAlign:"center",color:K.gold,fontWeight:700,marginBottom:12,fontSize:14}}>✓ Lote guardado en Google Sheets!</div>}
      {err&&<div style={{color:K.red,fontSize:13,marginBottom:12}}>{err}</div>}
      
      <div style={{background:K.card2,borderRadius:DS.r.lg,overflow:"hidden",marginBottom:12}}>
        {filas.map((f,i)=>(
          <div key={f.id} style={{borderBottom:i<filas.length-1?`0.5px solid ${K.border}`:"none",padding:"12px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <FInput value={f.producto} onChange={v=>updateFila(f.id,"producto",v)} placeholder="Producto" />
              <FInput value={f.cliente} onChange={v=>updateFila(f.id,"cliente",v)} placeholder="Cliente" />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <FInput value={f.proveedor} onChange={v=>updateFila(f.id,"proveedor",v)} placeholder="Proveedor" />
              <FInput type="number" value={f.costo} onChange={v=>updateFila(f.id,"costo",v)} placeholder="Costo" prefix="$" />
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1,minWidth:0}}>
                <FInput type="number" value={f.precio} onChange={v=>updateFila(f.id,"precio",v)} placeholder="Precio venta" prefix="$" />
              </div>
              <button onClick={()=>removeFila(f.id)} style={{background:"transparent",border:"none",color:K.red,fontSize:18,cursor:"pointer",padding:"0 8px",WebkitTapHighlightColor:"transparent"}}>×</button>
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={addFila} style={{width:"100%",background:"transparent",border:`1.5px dashed ${K.gold}`,borderRadius:DS.r.sm,padding:"10px",fontSize:13,fontWeight:600,color:K.gold,cursor:"pointer",marginBottom:12,WebkitTapHighlightColor:"transparent"}}>+ Agregar otra venta</button>
      
      {total!==0&&(
        <Card ch={<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:K.muted}}>Ganancia total del lote</span>
          <span style={{fontSize:18,fontWeight:700,color:total>0?K.green:K.red}}>{total>0?"+":""}{fmt(total)}</span>
        </div>}/>
      )}
      
      <Btn label={`GUARDAR LOTE (${filas.filter(f=>f.producto&&f.cliente&&f.precio).length} ventas)`} onClick={guardar} loading={saving} dis={filas.length===0}/>
    </div>
  );
}

function IngresoForm({onSave,clientes=[]}){
  const [f,setF]=useState({tipo:"VENTA",producto:"",cliente:"",proveedor:"",costo:"",pv:"",debe:false});
  const [saving,setSaving]=useState(false);
  const [ok,setOk]=useState(false);
  const [err,setErr]=useState(null);
  const up=k=>v=>setF(p=>({...p,[k]:v}));
  const gan=Number(f.pv||0)-Number(f.costo||0);
  const mrg=Number(f.pv)>0?Math.round(gan/Number(f.pv)*100):0;
  const go=async()=>{
    setSaving(true);setErr(null);
    try{
      const trim=s=>String(s||"").toUpperCase().trim();
      const item={fecha:new Date().toISOString(),tipo:f.tipo,producto:trim(f.producto),cliente:trim(f.cliente),proveedor:trim(f.proveedor),costo:Number(f.costo)||0,precioVenta:Number(f.pv)||0,debe:f.debe?"SI":"NO",ganancia:gan,margen:mrg+"%"};
      await onSave(ingresoToRow(item));
      setF({tipo:"VENTA",producto:"",cliente:"",proveedor:"",costo:"",pv:"",debe:false});
      setOk(true);setTimeout(()=>setOk(false),3000);
    }catch(e){setErr("Error al guardar: "+e.message);}
    finally{setSaving(false);}
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <span style={{fontSize:26}}>⬆️</span>
        <div><div style={{fontSize:10,color:K.muted}}>NUEVO · SE GUARDA EN SHEETS</div><div style={{fontSize:20,fontWeight:700,color:K.gold}}>Ingreso</div></div>
      </div>
      <Card ch={<>
        <ChipGroup label="Tipo" options={TIPOS} value={f.tipo} onChange={up("tipo")}/>
        <FInput label="Producto" value={f.producto} onChange={up("producto")} placeholder="ej: NIKE TN, SAMBA..."/>
        <AutocompleteInput label="Cliente" value={f.cliente} onChange={up("cliente")} placeholder="ej: ALEJANDRA" sugerencias={clientes}/>
        <FInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")} placeholder="ej: LIDER, BOA, FYM..."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$" placeholder="0"/>
          <FInput label="Precio venta" value={f.pv} onChange={up("pv")} type="number" prefix="$" placeholder="0"/>
        </div>
        {(f.costo||f.pv)&&<div style={{background:K.bg,borderRadius:DS.r.sm,padding:"10px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",border:`1px solid ${K.border}`}}>
          <div><div style={{fontSize:9,color:K.muted,marginBottom:1}}>GANANCIA</div><div style={{fontSize:17,fontWeight:700,color:gan>=0?K.green:K.red}}>{fmt(gan)}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:9,color:K.muted,marginBottom:1}}>MARGEN</div><div style={{fontSize:17,fontWeight:700,color:gan>=0?K.green:K.red}}>{mrg}%</div></div>
        </div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:.8}}>¿El cliente debe?</span>
          <button onClick={()=>up("debe")(!f.debe)} style={{background:f.debe?K.red:"transparent",border:`2px solid ${f.debe?K.red:K.border}`,color:f.debe?"#0A0A0A":K.muted,borderRadius:DS.r.sm,padding:"8px 20px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:.5,transition:"all .15s"}}>{f.debe?"SÍ — DEBE ✓":"NO DEBE"}</button>
        </div>
      </>}/>
      {ok&&<div style={{textAlign:"center",color:K.gold,fontWeight:700,marginBottom:8,fontSize:14}}>✓ Guardado en Google Sheets!</div>}
      {err&&<div style={{textAlign:"center",color:K.red,fontWeight:700,marginBottom:8,fontSize:13}}>{err}</div>}
      <Btn label="REGISTRAR INGRESO" onClick={go} dis={!f.producto||!f.pv} loading={saving}/>
    </div>
  );
}

// ═══ GASTO FORM ════════════════════════════════════════════════
function GastoForm({onSave}){
  const [f,setF]=useState({concepto:"NEGOCIO",costo:"",ref:""});
  const [saving,setSaving]=useState(false);
  const [ok,setOk]=useState(false);
  const [err,setErr]=useState(null);
  const up=k=>v=>setF(p=>({...p,[k]:v}));
  const go=async()=>{
    setSaving(true);setErr(null);
    try{
      const item={fecha:new Date().toISOString(),concepto:f.concepto,costo:Number(f.costo)||0,referencia:String(f.ref||"").toUpperCase().trim()};
      await onSave(gastoToRow(item));
      setF({concepto:f.concepto,costo:"",ref:""});
      setOk(true);setTimeout(()=>setOk(false),3000);
    }catch(e){setErr("Error al guardar: "+e.message);}
    finally{setSaving(false);}
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <span style={{fontSize:26}}>⬇️</span>
        <div><div style={{fontSize:10,color:K.muted}}>NUEVO · SE GUARDA EN SHEETS</div><div style={{fontSize:20,fontWeight:700,color:K.red}}>Gasto</div></div>
      </div>
      <Card ch={<>
        <ChipGroup label="Concepto" options={CONCS} value={f.concepto} onChange={up("concepto")} colorMap={CCAT}/>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:K.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:.8}}>Valor</div>
          <div style={{display:"flex",alignItems:"center",background:K.card2,border:`1px solid ${K.border}`,borderRadius:DS.r.sm}}>
            <span style={{padding:"0 14px",color:K.muted,fontSize:14}}>$</span>
            <input type="number" value={f.costo} onChange={e=>up("costo")(e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",color:K.text,padding:"12px 8px 12px 0",fontSize:16,outline:"none",fontWeight:700}}/>
          </div>
        </div>
        <FInput label="Referencia" value={f.ref} onChange={up("ref")} placeholder="ej: ARRIENDO, MERCADO..."/>
      </>}/>
      {ok&&<div style={{textAlign:"center",color:K.gold,fontWeight:700,marginBottom:8,fontSize:14}}>✓ Guardado en Google Sheets!</div>}
      {err&&<div style={{textAlign:"center",color:K.red,fontWeight:700,marginBottom:8,fontSize:13}}>{err}</div>}
      <Btn label="REGISTRAR GASTO" onClick={go} col={K.red} dis={!f.costo||!f.ref} loading={saving}/>
    </div>
  );
}

// ═══ EDITAR INGRESO (modal inline) ══════════════════════════════
function EditIngreso({item,onClose,onSave,onDelete}){
  const [f,setF]=useState({tipo:item.tipo,producto:item.producto,cliente:item.cliente,proveedor:item.proveedor,costo:String(item.costo),pv:String(item.precioVenta),debe:item.debe==="SI"});
  const [saving,setSaving]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [err,setErr]=useState(null);
  const up=k=>v=>setF(p=>({...p,[k]:v}));
  const gan=Number(f.pv||0)-Number(f.costo||0);
  const mrg=Number(f.pv)>0?Math.round(gan/Number(f.pv)*100):0;
  const guardar=async()=>{
    setSaving(true);setErr(null);
    try{
      const updated={...item,tipo:f.tipo,producto:f.producto,cliente:f.cliente,proveedor:f.proveedor,costo:Number(f.costo)||0,precioVenta:Number(f.pv)||0,debe:f.debe?"SI":"NO",ganancia:gan,margen:mrg+"%"};
      await onSave(updated);
      onClose();
    }catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  const borrar=async()=>{
    setSaving(true);setErr(null);
    try{await onDelete(item);onClose();}
    catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:K.bg,width:"100%",maxWidth:430,margin:"0 auto",borderRadius:"20px 20px 0 0",padding:"18px 16px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:700}}>Editar ingreso</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <Card ch={<>
          <ChipGroup label="Tipo" options={TIPOS} value={f.tipo} onChange={up("tipo")}/>
          <FInput label="Producto" value={f.producto} onChange={up("producto")}/>
          <FInput label="Cliente" value={f.cliente} onChange={up("cliente")}/>
          <FInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$"/>
            <FInput label="Precio venta" value={f.pv} onChange={up("pv")} type="number" prefix="$"/>
          </div>
          <div style={{background:K.bg,borderRadius:DS.r.sm,padding:"10px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",border:`1px solid ${K.border}`}}>
            <div><div style={{fontSize:9,color:K.muted}}>GANANCIA</div><div style={{fontSize:17,fontWeight:700,color:gan>=0?K.green:K.red}}>{fmt(gan)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:K.muted}}>MARGEN</div><div style={{fontSize:17,fontWeight:700,color:gan>=0?K.green:K.red}}>{mrg}%</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:.8}}>¿El cliente debe?</span>
            <button onClick={()=>up("debe")(!f.debe)} style={{background:f.debe?K.red:"transparent",border:`2px solid ${f.debe?K.red:K.border}`,color:f.debe?"#0A0A0A":K.muted,borderRadius:DS.r.sm,padding:"8px 20px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:.5,transition:"all .15s"}}>{f.debe?"SÍ — DEBE ✓":"NO DEBE"}</button>
          </div>
        </>}/>
        {err&&<div style={{textAlign:"center",color:K.red,fontWeight:700,marginBottom:8,fontSize:13}}>{err}</div>}
        <Btn label="GUARDAR CAMBIOS" onClick={guardar} loading={saving} dis={!f.producto}/>
        {!confirmDel?
          <button onClick={()=>setConfirmDel(true)} style={{width:"100%",background:"none",border:"none",color:K.red,fontSize:13,fontWeight:700,padding:"12px 0 4px",cursor:"pointer"}}>🗑️ Borrar este registro</button>
          :<ConfirmDelete onConfirm={borrar} onCancel={()=>setConfirmDel(false)}/>}
      </div>
    </div>
  );
}

// ═══ EDITAR GASTO (modal inline) ════════════════════════════════
function EditGasto({item,onClose,onSave,onDelete}){
  const [f,setF]=useState({concepto:item.concepto,costo:String(item.costo),ref:item.referencia});
  const [saving,setSaving]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [err,setErr]=useState(null);
  const up=k=>v=>setF(p=>({...p,[k]:v}));
  const guardar=async()=>{
    setSaving(true);setErr(null);
    try{
      const updated={...item,concepto:f.concepto,costo:Number(f.costo)||0,referencia:f.ref};
      await onSave(updated);
      onClose();
    }catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  const borrar=async()=>{
    setSaving(true);setErr(null);
    try{await onDelete(item);onClose();}
    catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:K.bg,width:"100%",maxWidth:430,margin:"0 auto",borderRadius:"20px 20px 0 0",padding:"18px 16px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:700}}>Editar gasto</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <Card ch={<>
          <ChipGroup label="Concepto" options={CONCS} value={f.concepto} onChange={up("concepto")} colorMap={CCAT}/>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:K.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:.8}}>Valor</div>
            <div style={{display:"flex",alignItems:"center",background:K.card2,border:`1px solid ${K.border}`,borderRadius:DS.r.sm}}>
              <span style={{padding:"0 14px",color:K.muted,fontSize:14}}>$</span>
              <input type="number" value={f.costo} onChange={e=>up("costo")(e.target.value)} style={{flex:1,background:"transparent",border:"none",color:K.text,padding:"12px 8px 12px 0",fontSize:16,outline:"none",fontWeight:700}}/>
            </div>
          </div>
          <FInput label="Referencia" value={f.ref} onChange={up("ref")}/>
        </>}/>
        {err&&<div style={{textAlign:"center",color:K.red,fontWeight:700,marginBottom:8,fontSize:13}}>{err}</div>}
        <Btn label="GUARDAR CAMBIOS" onClick={guardar} col={K.red} loading={saving} dis={!f.ref||!f.costo}/>
        {!confirmDel?
          <button onClick={()=>setConfirmDel(true)} style={{width:"100%",background:"none",border:"none",color:K.red,fontSize:13,fontWeight:700,padding:"12px 0 4px",cursor:"pointer"}}>🗑️ Borrar este registro</button>
          :<ConfirmDelete onConfirm={borrar} onCancel={()=>setConfirmDel(false)}/>}
      </div>
    </div>
  );
}

// ═══ HISTORIAL ═════════════════════════════════════════════════
// ═══ GRÁFICO CIRCULAR ═════════════════════════════════════════════
// SVG puro — gastos por categoría como pie chart.
function GraficoCircular({datos,colores,total}){
  if(!datos||datos.length===0||total===0)return null;
  const R=40,CX=50,CY=50;
  const slices=datos.reduce((acc,[cat,val],i)=>{
    const startAng=acc.ang;
    const pct=val/total;
    const endAng=startAng+pct*2*Math.PI;
    const x1=CX+R*Math.cos(startAng),y1=CY+R*Math.sin(startAng);
    const x2=CX+R*Math.cos(endAng),y2=CY+R*Math.sin(endAng);
    const large=pct>0.5?1:0;
    acc.slices.push({cat,val,pct,x1,y1,x2,y2,large,col:colores[i%colores.length]});
    acc.ang=endAng;
    return acc;
  },{ang:-Math.PI/2,slices:[]}).slices;
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,background:K.bg,borderRadius:DS.r.md,padding:10}}>
      <svg viewBox="0 0 100 100" width={80} height={80} style={{flexShrink:0}}>
        {slices.map((s,i)=>(
          <path key={i} d={`M ${CX} ${CY} L ${s.x1.toFixed(2)} ${s.y1.toFixed(2)} A ${R} ${R} 0 ${s.large} 1 ${s.x2.toFixed(2)} ${s.y2.toFixed(2)} Z`} fill={s.col} stroke={K.bg} strokeWidth="1"/>
        ))}
      </svg>
      <div style={{flex:1,minWidth:0}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.col,flexShrink:0}}/>
              <span style={{fontSize:10,color:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80}}>{s.cat}</span>
            </div>
            <span style={{fontSize:10,color:K.muted,flexShrink:0}}>{(s.pct*100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Historial({db,onEditIngreso,onEditGasto}){
  const [open,setOpen]=useState(curM());
  const [filter,setFilter]=useState("ingresos");
  const [buscar,setBuscar]=useState("");
  const [categFiltro,setCategFiltro]=useState(null);
  const [orden,setOrden]=useState("fecha"); // "fecha" | "monto"
  const months=[...new Set([...db.ingresos.map(i=>mKey(i.fecha)),...db.gastos.map(g=>mKey(g.fecha))].filter(Boolean))].sort().reverse();
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{fontSize:28,fontWeight:700,letterSpacing:-.5,marginBottom:16,color:K.text}}>Historial</div>
      {months.map(m=>{
        const ing=db.ingresos.filter(i=>mKey(i.fecha)===m&&cuentaParaTotales(i));
        const gas=db.gastos.filter(g=>mKey(g.fecha)===m);
        const ventas=ing.reduce((s,i)=>s+i.precioVenta,0);
        const gan=ing.reduce((s,i)=>s+i.ganancia,0);
        const gastos=gas.reduce((s,g)=>s+g.costo,0);
        const ahorro=gas.filter(g=>g.concepto==="AHORRO").reduce((s,g)=>s+g.costo,0);
        const util=gan-gastos;
        const isOpen=open===m;

        // Gastos por categoría para filtro y gráfico circular
        const catMap={};
        gas.forEach(g=>{const cat=g.concepto||"OTRO";catMap[cat]=(catMap[cat]||0)+g.costo;});
        const catEntries=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
        const categDisponibles=catEntries.map(([k])=>k);
        const PIE_COLORS=[K.red,K.blue,K.orange,K.purple,K.teal,K.green,"#FF6B6B","#4ECDC4"];

        let gasFiltered=gas;
        if(categFiltro)gasFiltered=gas.filter(g=>g.concepto===categFiltro);
        if(buscar.trim()){const q=buscar.toUpperCase().trim();gasFiltered=gasFiltered.filter(g=>(g.referencia||"").toUpperCase().includes(q)||(g.concepto||"").toUpperCase().includes(q));}
        gasFiltered=[...gasFiltered].sort((a,b)=>orden==="monto"?b.costo-a.costo:new Date(b.fecha)-new Date(a.fecha));

        let ingFiltered=ing;
        if(buscar.trim()){const q=buscar.toUpperCase().trim();ingFiltered=ing.filter(x=>(x.producto||"").toUpperCase().includes(q)||(x.cliente||"").toUpperCase().includes(q)||(x.proveedor||"").toUpperCase().includes(q));}
        ingFiltered=[...ingFiltered].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));

        const filtered=filter==="ingresos"?ingFiltered:gasFiltered;

        return(
          <div key={m} style={{marginBottom:8}}>
            <button onClick={()=>{setOpen(isOpen?null:m);setFilter("ingresos");setBuscar("");setCategFiltro(null);setOrden("fecha");}} style={{width:"100%",background:K.card,border:`1px solid ${isOpen?K.gold+"44":K.border}`,borderRadius:isOpen?"14px 14px 0 0":14,padding:14,cursor:"pointer",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:16,color:K.text}}>{mLabel(m)}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontWeight:700,fontSize:17,color:util>=0?K.gold:K.red}}>{fmt(util)}</div>
                  <span style={{color:K.muted,fontSize:12}}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4}}>
                {[["Ventas",ventas,K.gold],["Gan.",gan,K.green],["Gastos",gastos,K.red],["Ahorro",ahorro,K.blue]].map(([l,v,col])=>(
                  <div key={l} style={{background:K.bg,borderRadius:DS.r.sm,padding:"5px 4px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:K.muted,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:11,fontWeight:700,color:col}}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
            </button>
            {isOpen&&(
              <div style={{background:K.card2,border:`1px solid ${K.border}`,borderTop:"none",borderRadius:`0 0 ${DS.r.lg}px ${DS.r.lg}px`,padding:12}}>
                <input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="🔍 Buscar..." style={{width:"100%",background:K.bg,border:`1px solid ${K.border}`,borderRadius:DS.r.sm,color:K.text,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {[["ingresos","Ingresos",K.gold],["gastos","Gastos",K.red]].map(([v,l,col])=>(
                    <button key={v} onClick={()=>{setFilter(v);setCategFiltro(null);}} style={{flex:1,background:filter===v?`${col}22`:"transparent",border:`1px solid ${filter===v?col:K.border}`,color:filter===v?col:K.muted,borderRadius:DS.r.sm,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>{l}</button>
                  ))}
                </div>

                {/* Controles extra para gastos */}
                {filter==="gastos"&&gastos>0&&(
                  <>
                    {/* Gráfico circular por categoría */}
                    <GraficoCircular datos={catEntries} colores={PIE_COLORS} total={gastos}/>
                    {/* Filtro categoría */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                      <button onClick={()=>setCategFiltro(null)} style={{background:!categFiltro?K.gold:"transparent",border:`1px solid ${!categFiltro?K.gold:K.border}`,color:!categFiltro?"#000":K.muted,borderRadius:DS.r.sm,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>Todos</button>
                      {categDisponibles.map((c,ci)=>(
                        <button key={c} onClick={()=>setCategFiltro(c===categFiltro?null:c)} style={{background:categFiltro===c?PIE_COLORS[ci%PIE_COLORS.length]:"transparent",border:`1px solid ${categFiltro===c?PIE_COLORS[ci%PIE_COLORS.length]:K.border}`,color:categFiltro===c?"#000":K.muted,borderRadius:DS.r.sm,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>{c}</button>
                      ))}
                    </div>
                    {/* Ordenar */}
                    <div style={{display:"flex",gap:4,marginBottom:10}}>
                      <span style={{fontSize:10,color:K.muted,alignSelf:"center"}}>Ordenar:</span>
                      {[["fecha","Fecha"],["monto","Monto"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setOrden(v)} style={{background:orden===v?K.card3:"transparent",border:`1px solid ${orden===v?K.border:K.border}`,color:orden===v?K.text:K.muted,borderRadius:DS.r.sm,padding:"3px 10px",fontSize:10,fontWeight:orden===v?700:400,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>{l}</button>
                      ))}
                    </div>
                  </>
                )}

                {filtered.length===0&&<div style={{textAlign:"center",color:K.muted,padding:16,fontSize:13}}>Sin registros</div>}
                {filtered.map((item,i)=>{
                  const isI=filter==="ingresos";
                  const val=isI?item.ganancia:item.costo;
                  const col=isI?(val>=0?K.gold:K.muted):CCAT[item.concepto]||K.red;
                  return(
                    <button key={i} onClick={()=>isI?onEditIngreso(item):onEditGasto(item)} style={{width:"100%",background:"none",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<filtered.length-1?`0.5px solid ${K.border}`:"none",cursor:"pointer",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:K.text}}>{isI?(item.producto||item.tipo):item.referencia}</div>
                        <div style={{fontSize:11,color:K.muted}}>{isI?`${item.tipo}${item.cliente?" · "+item.cliente:""}`:item.concepto} · {fDate(item.fecha)}</div>
                      </div>
                      <div style={{textAlign:"right",marginLeft:8}}>
                        <div style={{fontSize:13,fontWeight:700,color:col}}>{isI?(val>=0?"+":"")+fmt(val):"-"+fmt(val)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══ CLIENTES ══════════════════════════════════════════════════
// ═══ MARCAR PAGADO ═══════════════════════════════════════════════
// Actualiza DEBE?=NO en CADA fila de INGRESOS de ese cliente que tenga deuda.
// Esto es lo único que persiste de verdad: la hoja CLIENTES se recalcula sola con
// fórmulas, así que escribirle ahí se perdería en el próximo recálculo.
// ═══ ABONO MODAL ═════════════════════════════════════════════════
// Registra un abono en la columna F de CLIENTES buscando por nombre.
// El valor que se guarda es el TOTAL acumulado de abonos (el que ya había + el nuevo),
// porque la hoja espera el total, no el incremento.
function AbonoModal({cliente,abonosActuales,onClose,onRegistrar}){
  const [monto,setMonto]=useState("");
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState(null);
  const nuevoTotal=(abonosActuales||0)+(Number(monto)||0);
  const guardar=async()=>{
    if(!Number(monto)||Number(monto)<=0){setErr("Ingresa un monto válido");return;}
    setSaving(true);setErr(null);
    try{
      await onRegistrar(cliente,nuevoTotal);
      onClose();
    }catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:K.bg,width:"100%",maxWidth:430,margin:"0 auto",borderRadius:"16px 16px 0 0",padding:"18px 16px 32px",border:`1px solid ${K.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:K.muted,textTransform:"uppercase",letterSpacing:1}}>Registrar abono</div>
            <div style={{fontSize:18,fontWeight:700,color:K.white}}>{cliente}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        {abonosActuales>0&&(
          <div style={{background:K.card2,borderRadius:DS.r.sm,padding:"10px 12px",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:K.muted}}>Abonos anteriores</span>
            <span style={{fontSize:13,fontWeight:700,color:K.green}}>{fmt(abonosActuales)}</span>
          </div>
        )}
        <FInput label="Monto del abono" value={monto} onChange={setMonto} type="number" prefix="$" placeholder="0"/>
        {monto&&Number(monto)>0&&(
          <div style={{background:K.card,border:`1px solid ${K.gold}44`,borderRadius:DS.r.sm,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:K.muted}}>Total abonado quedaría</span>
            <span style={{fontSize:16,fontWeight:700,color:K.gold}}>{fmt(nuevoTotal)}</span>
          </div>
        )}
        {err&&<div style={{color:K.red,fontSize:12,marginBottom:8,textAlign:"center"}}>{err}</div>}
        <Btn label="REGISTRAR ABONO" onClick={guardar} loading={saving} dis={!monto||Number(monto)<=0}/>
      </div>
    </div>
  );
}

function MarcarPagadoBtn({cliente,ventas,onMarcarPagado}){
  const [confirmar,setConfirmar]=useState(false);
  const [cargando,setCargando]=useState(false);
  const [error,setError]=useState(null);
  const pendientes=ventas.filter(v=>v.debe==="SI");
  if(pendientes.length===0)return null;
  const confirmarPago=async()=>{
    setCargando(true);setError(null);
    try{
      await onMarcarPagado(pendientes);
      setConfirmar(false);
    }catch(e){
      setError("Error al actualizar: "+e.message);
    }finally{
      setCargando(false);
    }
  };
  return(
    <div style={{marginBottom:14}}>
      {!confirmar?(
        <button onClick={()=>setConfirmar(true)} style={{width:"100%",background:`${K.gold}18`,border:`1.5px solid ${K.gold}`,color:K.gold,borderRadius:DS.r.sm,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          ✓ YA PAGÓ ({pendientes.length} pendiente{pendientes.length!==1?"s":""})
        </button>
      ):(
        <div style={{background:K.card,border:`1.5px solid ${K.gold}`,borderRadius:DS.r.sm,padding:12}}>
          <div style={{fontSize:13,color:K.text,marginBottom:10,textAlign:"center"}}>¿Confirmar que {cliente} ya pagó las {pendientes.length} compra{pendientes.length!==1?"s":""} pendientes?</div>
          {error&&<div style={{color:K.red,fontSize:12,textAlign:"center",marginBottom:8}}>{error}</div>}
          <div style={{display:"flex",gap:6}}>
            <button onClick={confirmarPago} disabled={cargando} style={{flex:1,background:K.gold,border:"none",color:"#0A0A0A",borderRadius:DS.r.sm,padding:"9px 0",fontSize:12,fontWeight:700,cursor:cargando?"not-allowed":"pointer",opacity:cargando?.6:1}}>{cargando?"⏳ Guardando...":"Sí, ya pagó"}</button>
            <button onClick={()=>setConfirmar(false)} disabled={cargando} style={{flex:1,background:"transparent",border:`1.5px solid ${K.border}`,color:K.muted,borderRadius:DS.r.sm,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ SWIPEABLE VENTA ═════════════════════════════════════════════
// ← (>60px) = marcar NO DEBE  |  → (>60px) = marcar DEBE
// Feedback visual en tiempo real: la fila se desplaza con el dedo
// y muestra una etiqueta de acción de fondo antes de soltar.
function SwipeableVenta({v,debe,onEdit,onToggleDebe,isLast}){
  const startX=useRef(null);
  const startY=useRef(null);
  const [offsetX,setOffsetX]=useState(0);
  const [swiping,setSwiping]=useState(false);
  const THRESHOLD=72;

  const onTouchStart=e=>{
    startX.current=e.touches[0].clientX;
    startY.current=e.touches[0].clientY;
    setSwiping(false);
    setOffsetX(0);
  };
  const onTouchMove=e=>{
    if(startX.current===null)return;
    const dx=e.touches[0].clientX-startX.current;
    const dy=e.touches[0].clientY-startY.current;
    // Si el scroll vertical es dominante, no interferimos
    if(!swiping&&Math.abs(dy)>Math.abs(dx)*1.5)return;
    setSwiping(true);
    // Limitar el offset para que no se vaya lejos
    setOffsetX(Math.max(-130,Math.min(130,dx)));
  };
  const onTouchEnd=e=>{
    const dx=e.changedTouches[0].clientX-(startX.current||0);
    const dy=e.changedTouches[0].clientY-(startY.current||0);
    const wasSwiping=swiping;
    startX.current=null; startY.current=null;
    setSwiping(false); setOffsetX(0);
    if(!wasSwiping&&Math.abs(dx)<8&&Math.abs(dy)<8){ onEdit(); return; }
    if(dx<-THRESHOLD){ onToggleDebe("NO"); } // ← marcar NO DEBE
    if(dx>THRESHOLD){ onToggleDebe("SI"); }  // → marcar DEBE
  };

  const actionColor=offsetX<-THRESHOLD?K.green:K.red;

  return(
    <div style={{position:"relative",overflow:"hidden",borderRadius:DS.r.md,marginBottom:isLast?0:8}}>
      {/* Fondo de acción visible durante el swipe */}
      {swiping&&Math.abs(offsetX)>20&&(
        <div style={{
          position:"absolute",inset:0,
          background:offsetX<0?`${K.green}22`:`${K.red}22`,
          display:"flex",alignItems:"center",
          justifyContent:offsetX<0?"flex-end":"flex-start",
          padding:"0 20px",
          borderRadius:DS.r.md,
        }}>
          <span style={{fontSize:11,fontWeight:700,color:actionColor,letterSpacing:.5}}>
            {offsetX<0?"✓ NO DEBE":"⚠ DEBE"}
          </span>
        </div>
      )}
      {/* Fila que se desplaza */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform:`translateX(${offsetX}px)`,
          transition:swiping?"none":"transform .25s cubic-bezier(.4,0,.2,1)",
          background:debe?"#2C0A0A":K.card2,
          borderRadius:DS.r.md,
          padding:"12px 14px",
          display:"flex",justifyContent:"space-between",alignItems:"center",
          cursor:"pointer",
          userSelect:"none",
          WebkitUserSelect:"none",
          WebkitTapHighlightColor:"transparent",
          willChange:"transform",
        }}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600,color:K.text,display:"flex",alignItems:"center",gap:8}}>
            {v.producto}
            {debe&&<span style={{fontSize:10,background:K.red,color:"#fff",borderRadius:4,padding:"1px 6px",fontWeight:700}}>DEBE</span>}
          </div>
          <div style={{fontSize:13,color:K.muted,marginTop:3}}>{v.tipo} · {fDate(v.fecha)}</div>
        </div>
        <div style={{textAlign:"right",marginLeft:12,flexShrink:0}}>
          <div style={{fontSize:15,fontWeight:700,color:K.gold}}>+{fmt(v.ganancia)}</div>
          <div style={{fontSize:13,color:debe?K.red:K.muted}}>{fmt(v.precioVenta)}</div>
        </div>
      </div>
    </div>
  );
}

function Clientes({db,onEditIngreso,onMarcarPagado,onRegistrarAbono}){
  const [sel,setSel]=useState(null);
  const [q,setQ]=useState("");
  const [letraFiltro,setLetraFiltro]=useState(null);
  const [mesSel,setMesSel]=useState("todos");
  const [pagina,setPagina]=useState(1);
  const PORPAGINA=15;
  const [abonoAbierto,setAbonoAbierto]=useState(false);
  const map={};
  db.ingresos.filter(cuentaParaListaClientes).forEach(i=>{
    const k=(i.cliente||"").toUpperCase().trim();
    if(!k)return;
    if(!map[k])map[k]={ventas:[],gan:0,debe:false};
    map[k].ventas.push(i);map[k].gan+=i.ganancia;
  });
  const deudaPorCliente={};
  (db.clientesResumen||[]).forEach(c=>{
    const k=c.cliente.toUpperCase().trim();
    const prev=deudaPorCliente[k];
    // deudaTotal (col G) = SALDO - ABONOS, ya calculado por la fórmula de Sheets.
    // Es el valor real a cobrar. Si no existe, usamos saldo bruto.
    const deudaReal=c.deudaTotal!==undefined?c.deudaTotal:c.saldo;
    deudaPorCliente[k]={
      debe:(prev?.debe||false)||c.debe==="SI",
      saldo:(prev?.saldo||0)+deudaReal,
      abonos:(prev?.abonos||0)+(c.abonos||0),
    };
  });
  Object.keys(map).forEach(k=>{map[k].debe=deudaPorCliente[k]?.debe||false; map[k].saldo=deudaPorCliente[k]?.saldo||0; map[k].abonos=deudaPorCliente[k]?.abonos||0;});

  // Letras disponibles según los clientes reales
  const letrasDisponibles=[...new Set(Object.keys(map).map(k=>k[0]).filter(Boolean))].sort();

  const lista=Object.entries(map).filter(([k])=>{
    if(q&&!k.includes(q.toUpperCase()))return false;
    if(letraFiltro&&k[0]!==letraFiltro)return false;
    return true;
  }).sort((a,b)=>b[1].gan-a[1].gan);
  const totalPaginas=Math.max(1,Math.ceil(lista.length/PORPAGINA));
  const paginaSegura=Math.min(pagina,totalPaginas);
  const listaPagina=lista.slice((paginaSegura-1)*PORPAGINA,paginaSegura*PORPAGINA);
  const [nowTs]=useState(()=>Date.now());

  if(sel){
    const{ventas}=map[sel]||{ventas:[]};
    const meses=[...new Set(ventas.map(v=>mKey(v.fecha)))].sort().reverse();
    const ventasFiltradas=mesSel==="todos"?ventas:ventas.filter(v=>mKey(v.fecha)===mesSel);
    const tv=ventasFiltradas.reduce((s,v)=>s+v.precioVenta,0);
    const ganF=ventasFiltradas.reduce((s,v)=>s+v.ganancia,0);
    const abonos=map[sel]?.abonos||0;
    // Días desde la deuda más antigua sin pagar
    const ventasDeudorasAll=ventas.filter(v=>v.debe==="SI");
    const diasDebe=ventasDeudorasAll.length>0?Math.floor((nowTs-new Date(ventasDeudorasAll.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))[0].fecha))/(1000*60*60*24)):null;
    return(
      <div>
        <button onClick={()=>{setSel(null);setMesSel("todos");}} style={{background:"none",border:"none",color:K.gold,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,padding:0}}>← Volver</button>
        {/* Header del cliente */}
        <div style={{background:map[sel]?.debe?"#1C0808":K.card,border:`1px solid ${map[sel]?.debe?K.red+"44":K.border}`,borderRadius:16,padding:"16px",marginBottom:10}}>
          <div style={{fontSize:10,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Cliente</div>
          <div style={{fontSize:24,fontWeight:700,color:K.white,letterSpacing:-.5,marginBottom:map[sel]?.debe?8:0}}>{sel}</div>
          {map[sel]?.debe&&(
            <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:9,color:K.red,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Deuda actual</div>
                <div style={{fontSize:18,fontWeight:700,color:K.red}}>{fmt(map[sel].saldo)}</div>
              </div>
              {abonos>0&&<div>
                <div style={{fontSize:9,color:K.green,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Abonado</div>
                <div style={{fontSize:18,fontWeight:700,color:K.green}}>{fmt(abonos)}</div>
              </div>}
              {diasDebe!==null&&<div>
                <div style={{fontSize:9,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Tiempo debiendo</div>
                <div style={{fontSize:13,fontWeight:600,color:diasDebe>30?K.red:diasDebe>14?K.orange:K.muted}}>{diasDebe===0?"Hoy":diasDebe===1?"1 día":`${diasDebe} días`}</div>
              </div>}
            </div>
          )}
        </div>
        {/* Botones de acción */}
        {map[sel]?.debe&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <MarcarPagadoBtn cliente={sel} ventas={ventas} onMarcarPagado={onMarcarPagado}/>
              <button onClick={()=>setAbonoAbierto(true)} style={{background:`${K.gold}14`,border:`1px solid ${K.gold}44`,borderRadius:DS.r.md,padding:"13px 0",fontSize:13,fontWeight:600,color:K.gold,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>+ Abono</button>
            </div>
            {abonoAbierto&&<AbonoModal cliente={sel} abonosActuales={abonos} onClose={()=>setAbonoAbierto(false)} onRegistrar={onRegistrarAbono}/>}
          </>
        )}
        {/* Reporte del cliente con filtro de mes */}
        <ReporteClienteBtn cliente={sel} ventas={ventasFiltradas} mes={mesSel} meses={meses} onChangeMes={setMesSel}/>
        {/* Stats del periodo */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <Card s={{marginBottom:0}} ch={<><div style={{fontSize:9,color:K.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:.8}}>Total ventas</div><div style={{fontSize:18,fontWeight:700,color:K.gold}}>{fmt(tv)}</div></>}/>
          <Card s={{marginBottom:0}} ch={<><div style={{fontSize:9,color:K.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:.8}}>Ganancia</div><div style={{fontSize:18,fontWeight:700,color:K.green}}>{fmt(ganF)}</div></>}/>
        </div>
        {/* Historial con swipe */}
        <Card ch={<>
          <div style={{fontSize:10,color:K.gold,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,fontWeight:700}}>Historial ({ventasFiltradas.length}) · desliza para cambiar deuda</div>
          {ventasFiltradas.length===0&&<div style={{textAlign:"center",color:K.muted,padding:16,fontSize:13}}>Sin compras este período</div>}
          {ventasFiltradas.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((v,i,arr)=>{
            const debe=v.debe==="SI";
            return <SwipeableVenta key={v._row||i} v={v} debe={debe} onEdit={()=>onEditIngreso(v)} onToggleDebe={(estado)=>onMarcarPagado([v],estado)} isLast={i===arr.length-1}/>;
          })}
        </>}/>
        {/* Factura de deuda — SIEMPRE al final, no desaparece con filtros */}
        <DeudaFactura cliente={sel} ventasDeudoras={ventas.filter(v=>v.debe==="SI")}/>
      </div>
    );
  }
  return(
    <div>
      {lista.filter(([,v])=>v.debe).length>0&&(
        <Card s={{background:"#1a0808",border:`1px solid #4a1a1a`,marginBottom:10}} ch={<>
          <div style={{fontSize:11,color:K.red,fontWeight:700,marginBottom:6}}>⚠️ DEBEN COBRAR</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {lista.filter(([,v])=>v.debe).map(([n])=><button key={n} onClick={()=>setSel(n)} style={{background:`${K.red}18`,border:`1px solid ${K.red}`,color:K.red,borderRadius:DS.r.sm,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>{n}</button>)}
          </div>
        </>}/>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:600,color:K.muted}}>{lista.length} clientes</div>
      </div>
      <input value={q} onChange={e=>{setQ(e.target.value);setPagina(1);setLetraFiltro(null);}} placeholder="🔍 Buscar..." style={{width:"100%",background:K.card,border:`1px solid ${K.border}`,boxShadow:DS.shadow.sm,borderRadius:DS.r.md,color:K.text,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
      {/* Filtro por inicial — chips pequeños */}
      <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:10}}>
        <button onClick={()=>{setLetraFiltro(null);setPagina(1);}} style={{background:!letraFiltro?K.gold:"transparent",border:`1px solid ${!letraFiltro?K.gold:K.border}`,color:!letraFiltro?"#000":K.muted,borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>Todos</button>
        {letrasDisponibles.map(l=>(
          <button key={l} onClick={()=>{setLetraFiltro(l===letraFiltro?null:l);setPagina(1);}} style={{background:letraFiltro===l?K.gold:"transparent",border:`1px solid ${letraFiltro===l?K.gold:K.border}`,color:letraFiltro===l?"#000":K.muted,borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>{l}</button>
        ))}
      </div>
      {listaPagina.map(([nom,st])=>(
        <div key={nom} style={{background:st.debe?"#1C0808":K.card,border:`1px solid ${st.debe?K.red+"44":K.border}`,borderRadius:16,padding:"14px",marginBottom:8,position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:st.debe?8:0}}>
            <div>
              <div style={{fontWeight:600,fontSize:15,color:K.text,marginBottom:2}}>
                {nom}{st.debe&&<span style={{marginLeft:6,fontSize:9,background:K.red,color:"#fff",borderRadius:4,padding:"1px 6px",fontWeight:700}}>DEBE</span>}
              </div>
              <div style={{fontSize:11,color:K.muted}}>{st.ventas.length} compra{st.ventas.length!==1?"s":""}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:700,color:K.green}}>{fmt(st.gan)}</div>
                <div style={{fontSize:10,color:K.muted}}>ganancia</div>
              </div>
              {/* Menú acción — botón contextual */}
              <button onClick={()=>setSel(nom)} style={{background:K.card2,border:"none",borderRadius:DS.r.sm,padding:"6px 10px",color:K.muted,fontSize:12,cursor:"pointer",WebkitTapHighlightColor:"transparent",flexShrink:0}}>›</button>
            </div>
          </div>
          {st.debe&&(
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSel(nom)} style={{flex:1,background:`${K.red}14`,border:`1px solid ${K.red}44`,borderRadius:DS.r.sm,padding:"6px 0",fontSize:11,fontWeight:600,color:K.red,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>Ver deuda</button>
              <button onClick={()=>setSel(nom)} style={{flex:1,background:`${K.gold}14`,border:`1px solid ${K.gold}44`,borderRadius:DS.r.sm,padding:"6px 0",fontSize:11,fontWeight:600,color:K.gold,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>Reporte</button>
            </div>
          )}
        </div>
      ))}
      {totalPaginas>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:12,marginTop:8,marginBottom:8}}>
          <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={paginaSegura===1} style={{background:"none",border:`1px solid ${K.border}`,color:paginaSegura===1?K.muted:K.text,borderRadius:DS.r.sm,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:paginaSegura===1?"not-allowed":"pointer",opacity:paginaSegura===1?.4:1}}>← Atrás</button>
          <span style={{fontSize:11,color:K.muted}}>{paginaSegura}/{totalPaginas}</span>
          <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={paginaSegura===totalPaginas} style={{background:"none",border:`1px solid ${K.border}`,color:paginaSegura===totalPaginas?K.muted:K.text,borderRadius:DS.r.sm,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:paginaSegura===totalPaginas?"not-allowed":"pointer",opacity:paginaSegura===totalPaginas?.4:1}}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}

// ═══ INVENTARIO ════════════════════════════════════════════════
// Lista simple de compras a proveedor, tal cual la hoja: sin cruzar con ventas.
// ═══ CONFIGURACIÓN ════════════════════════════════════════════════
// Panel de ajustes dentro de Más. Por ahora: info de la app, cerrar sesión.
// Diseñado para crecer: aquí irán preferencias de diseño, notificaciones, etc.
function Configuracion(){
  const [accentId,setAccentId]=useState(()=>localStorage.getItem(ACCENT_KEY)||"gold");
  const cerrar=()=>{localStorage.removeItem(LS_AUTH_KEY);window.location.reload();};
  const cambiarAccent=(id)=>{
    setAccentId(id);
    localStorage.setItem(ACCENT_KEY,id);
    // Forzar re-render sin recargar página completa
    window.dispatchEvent(new Event("accentchange"));
  };
  return(
    <div style={{padding:"0 0 16px"}}>
      {/* App info */}
      <Card s={{marginBottom:8}} ch={<>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <div style={{width:52,height:52,background:getAccentColor(),borderRadius:DS.r.lg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#000",flexShrink:0}}>A</div>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:K.text}}>Altaclase Bodega</div>
            <div style={{fontSize:13,color:K.muted}}>Control financiero B2B</div>
          </div>
        </div>
        <div style={{height:"0.5px",background:K.border,margin:"0 -16px 12px"}}/>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:13,color:K.muted}}>Versión</span>
          <span style={{fontSize:13,color:K.text,fontWeight:500}}>2.1</span>
        </div>
      </>}/>

      {/* Color de acento */}
      <Card s={{marginBottom:8}} ch={<>
        <div style={{fontSize:12,color:K.muted,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,marginBottom:12}}>Color de acento</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {ACCENTS.map(a=>(
            <button key={a.id} onClick={()=>cambiarAccent(a.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",WebkitTapHighlightColor:"transparent",padding:0}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:a.color,border:accentId===a.id?`3px solid ${K.white}`:`3px solid transparent`,boxSizing:"border-box",transition:"border .15s"}}/>
              <span style={{fontSize:9,color:accentId===a.id?K.text:K.muted,fontWeight:accentId===a.id?600:400}}>{a.label}</span>
            </button>
          ))}
        </div>
      </>}/>

      {/* Sesión */}
      <Card s={{marginBottom:8}} ch={<>
        <div style={{fontSize:12,color:K.muted,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,marginBottom:10}}>Sesión</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:15,color:K.text}}>Auto-cierre por inactividad</span>
          <span style={{fontSize:13,color:K.muted,fontWeight:500}}>3 min</span>
        </div>
        <div style={{height:"0.5px",background:K.border,margin:"0 -16px 10px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:15,color:K.text}}>Cerrar al cerrar navegador</span>
          <span style={{fontSize:13,color:K.green,fontWeight:600}}>Activo</span>
        </div>
      </>}/>

      {/* Datos */}
      <Card s={{marginBottom:8}} ch={<>
        <div style={{fontSize:12,color:K.muted,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,marginBottom:10}}>Datos</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:15,color:K.text}}>Sincronización automática</span>
          <span style={{fontSize:13,color:K.muted}}>Cada 2 min</span>
        </div>
        <div style={{height:"0.5px",background:K.border,margin:"0 -16px 10px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:15,color:K.text}}>Fuente de datos</span>
          <span style={{fontSize:13,color:K.muted}}>Google Sheets</span>
        </div>
      </>}/>

      {/* Cerrar sesión */}
      <button onClick={cerrar} style={{width:"100%",background:"transparent",border:"none",color:K.red,fontSize:17,fontWeight:500,padding:"14px 0",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
        Cerrar sesión
      </button>
    </div>
  );
}

// ═══ REPORTE POR CLIENTE ══════════════════════════════════════════
// Genera un resumen de un cliente específico filtrado por mes,
// listo para copiar y compartir por WhatsApp.
// ═══ DEUDA FACTURA ════════════════════════════════════════════════
// Muestra los productos que debe el cliente con fecha y valor.
// Diseño de factura/invoice para imprimir o compartir.
function DeudaFactura({cliente,ventasDeudoras}){
  if(!ventasDeudoras||ventasDeudoras.length===0)return null;
  const totalDebe=ventasDeudoras.reduce((s,v)=>s+v.precioVenta,0);
  const fmt2=n=>"$"+Number(n||0).toLocaleString("es-CO");
  return(
    <div style={{background:K.card,borderRadius:16,padding:"16px",marginBottom:10,border:`1px solid ${K.border}`}}>
      <div style={{fontSize:10,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:600}}>Detalle de deuda</div>
      
      {/* Encabezado tipo invoice */}
      <div style={{borderBottom:`1px solid ${K.border}`,paddingBottom:10,marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:K.text,marginBottom:2}}>📋 Factura de cobro</div>
        <div style={{fontSize:11,color:K.muted}}>Cliente: <span style={{color:K.text,fontWeight:600}}>{cliente}</span></div>
        <div style={{fontSize:11,color:K.muted}}>Fecha: {new Date().toLocaleDateString("es-CO")}</div>
      </div>

      {/* Items */}
      <div style={{marginBottom:10}}>
        {ventasDeudoras.map((v,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:8,marginBottom:i<ventasDeudoras.length-1?8:0,borderBottom:i<ventasDeudoras.length-1?`0.5px solid ${K.border}`:"none"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:K.text,marginBottom:2}}>{v.producto}</div>
              <div style={{fontSize:11,color:K.muted}}>{fDate(v.fecha)}</div>
            </div>
            <div style={{textAlign:"right",marginLeft:10,flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:700,color:K.red}}>{fmt2(v.precioVenta)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{background:K.card2,borderRadius:DS.r.sm,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:700,color:K.text}}>Total a cobrar</span>
        <span style={{fontSize:16,fontWeight:700,color:K.red}}>{fmt2(totalDebe)}</span>
      </div>
    </div>
  );
}

function ReporteClienteBtn({cliente,ventas,mes,meses=[],onChangeMes}){
  const [copiado,setCopiado]=useState(false);
  const fmt2=n=>"$"+Number(n||0).toLocaleString("es-CO");
  const ventasMes=mes==="todos"?ventas:ventas.filter(v=>mKey(v.fecha)===mes);
  const generar=()=>{
    if(ventasMes.length===0)return;
    const hoy=new Date();
    const fechaStr=hoy.toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric"});
    // Ventas solo del mes en curso si hay filtro, sino del mes actual
    const mesActual=curM();
    const ventasMesActual=ventasMes.filter(v=>mKey(v.fecha)===mesActual);
    const totalVMes=ventasMesActual.reduce((s,v)=>s+v.precioVenta,0);
    const deben=ventasMes.filter(v=>v.debe==="SI");
    const totalDebe=deben.reduce((s,v)=>s+v.precioVenta,0);
    const lineas=[
      `📋 REPORTE ACTUALIZADO CLIENTE:`,
      `${cliente}`,
      `📅 ${fechaStr}`,
      ``,
      `🛍 Compras: ${ventasMesActual.length} pedido${ventasMesActual.length!==1?"s":""} este mes`,
      `💰 Total vendido mes: ${fmt2(totalVMes)}`,
    ];
    if(deben.length>0){
      lineas.push(`⚠️ Deuda Actual: ${fmt2(totalDebe)}`);
      deben.forEach(v=>{
        const f=new Date(v.fecha);
        const fStr=`${f.getDate()}/${f.getMonth()+1}`;
        lineas.push(`   • ${fStr} - ${v.producto} — ${fmt2(v.precioVenta)}`);
      });
    }
    lineas.push(``);
    lineas.push(`Cristhian Hurtado`);
    lineas.push(`Altaclase Bodega`);
    const texto=lineas.join("\n");
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(texto).then(()=>{setCopiado(true);setTimeout(()=>setCopiado(false),2500);});
    }else{
      const el=document.createElement("textarea");
      el.value=texto;el.style.cssText="position:fixed;opacity:0";
      document.body.appendChild(el);el.select();
      document.execCommand("copy");document.body.removeChild(el);
      setCopiado(true);setTimeout(()=>setCopiado(false),2500);
    }
  };
  return(
    <div style={{marginBottom:10}}>
      {meses.length>1&&(
        <ChipGroup label="Período" options={meses} value={mes} onChange={onChangeMes} colorMap={{todos:K.gold}}/>
      )}
      <button onClick={generar} disabled={ventasMes.length===0} style={{width:"100%",background:copiado?"#1C2A1C":K.card2,border:`1px solid ${copiado?K.green:K.border}`,borderRadius:DS.r.md,padding:"12px 14px",cursor:ventasMes.length===0?"not-allowed":"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",opacity:ventasMes.length===0?.4:1,WebkitTapHighlightColor:"transparent",transition:"all .2s"}}>
        <span style={{fontSize:13,fontWeight:600,color:copiado?K.green:K.muted}}>{copiado?"✓ Reporte copiado":"📋 Generar reporte del cliente"}</span>
        <span style={{fontSize:11,color:K.muted}}>Para WhatsApp</span>
      </button>
    </div>
  );
}

// ═══ BÚSQUEDA GLOBAL ═════════════════════════════════════════════

// Busca en tiempo real en ingresos (producto, cliente, proveedor) y gastos
// (referencia, concepto). Toca cualquier resultado para editarlo.
function BusquedaGlobal({db,onEditIngreso,onEditGasto}){
  const [q,setQ]=useState("");
  const QU=q.toUpperCase().trim();
  const ingRes=QU.length<2?[]:db.ingresos.filter(i=>
    (i.producto||"").toUpperCase().includes(QU)||
    (i.cliente||"").toUpperCase().includes(QU)||
    (i.proveedor||"").toUpperCase().includes(QU)
  ).slice(0,20);
  const gasRes=QU.length<2?[]:db.gastos.filter(g=>
    (g.referencia||"").toUpperCase().includes(QU)||
    (g.concepto||"").toUpperCase().includes(QU)
  ).slice(0,10);
  const total=ingRes.length+gasRes.length;
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{fontSize:10,color:K.gold,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:12}}>Búsqueda Global</div>
      <div style={{position:"relative",marginBottom:16}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Cliente, producto, proveedor, concepto..."
          autoFocus
          style={{width:"100%",background:K.card,border:`1.5px solid ${q?K.gold:K.border}`,borderRadius:DS.r.sm,color:K.text,padding:"13px 40px 13px 16px",fontSize:14,outline:"none",boxSizing:"border-box"}}
        />
        {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:K.muted,fontSize:18,cursor:"pointer"}}>×</button>}
      </div>
      {QU.length>=2&&(
        <div style={{fontSize:10,color:K.muted,marginBottom:10}}>
          {total===0?"Sin resultados":`${total} resultado${total!==1?"s":""}`}
        </div>
      )}
      {QU.length<2&&(
        <div style={{textAlign:"center",color:K.muted,padding:"40px 0",fontSize:13}}>
          Escribe al menos 2 caracteres para buscar
        </div>
      )}
      {ingRes.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:K.gold,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700}}>Ingresos ({ingRes.length})</div>
          <Card ch={<>
            {ingRes.map((it,i)=>(
              <button key={it.id} onClick={()=>onEditIngreso(it)} style={{width:"100%",background:"none",border:"none",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<ingRes.length-1?10:0,marginBottom:i<ingRes.length-1?10:0,borderBottom:i<ingRes.length-1?`1px solid ${K.border}`:"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.producto}</div>
                  <div style={{fontSize:10,color:K.muted}}>{it.cliente} · {it.proveedor} · {fDate(it.fecha)}</div>
                </div>
                <div style={{textAlign:"right",marginLeft:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:it.debe==="SI"?K.red:K.gold}}>+{fmt(it.ganancia)}</div>
                  {it.debe==="SI"&&<div style={{fontSize:9,color:K.red,fontWeight:700}}>DEBE</div>}
                </div>
              </button>
            ))}
          </>}/>
        </div>
      )}
      {gasRes.length>0&&(
        <div>
          <div style={{fontSize:10,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700}}>Gastos ({gasRes.length})</div>
          <Card ch={<>
            {gasRes.map((g,i)=>(
              <button key={g.id} onClick={()=>onEditGasto(g)} style={{width:"100%",background:"none",border:"none",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<gasRes.length-1?10:0,marginBottom:i<gasRes.length-1?10:0,borderBottom:i<gasRes.length-1?`1px solid ${K.border}`:"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.referencia}</div>
                  <div style={{fontSize:10,color:K.muted}}>{g.concepto} · {fDate(g.fecha)}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:CCAT[g.concepto]||K.red,marginLeft:10}}>-{fmt(g.costo)}</div>
              </button>
            ))}
          </>}/>
        </div>
      )}
    </div>
  );
}

function Inventario({db,onAdd,onEdit,onDelete}){
  const items=[...(db.inventario||[])].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const total=items.reduce((s,i)=>s+i.costo,0);
  const [agregar,setAgregar]=useState(false);
  const [editar,setEditar]=useState(null);
  return(
    <div>
      <Card ch={<>
        <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Total invertido</div>
        <div style={{fontSize:24,fontWeight:700,color:K.purple}}>{fmt(total)}</div>
        <div style={{fontSize:11,color:K.muted,marginTop:2}}>{items.length} compra{items.length!==1?"s":""} registradas</div>
      </>}/>
      <Btn label="+ AGREGAR AL INVENTARIO" onClick={()=>setAgregar(true)} col={K.purple}/>
      <div style={{height:10}}/>
      {items.length===0&&<div style={{textAlign:"center",color:K.muted,padding:24,fontSize:13}}>Sin compras registradas en Inventario</div>}
      {items.length>0&&<Card ch={<>
        <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Toca para editar o borrar</div>
        {items.map((it,i,arr)=>(
          <button key={it.id} onClick={()=>setEditar(it)} style={{width:"100%",background:"none",border:"none",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<arr.length-1?10:0,marginBottom:i<arr.length-1?10:0,borderBottom:i<arr.length-1?`1px solid ${K.border}`:"none"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:K.text}}>{it.producto}</div><div style={{fontSize:10,color:K.muted}}>{it.proveedor} · {fDate(it.fecha)}</div></div>
            <div style={{fontSize:13,fontWeight:700,color:K.purple}}>{fmt(it.costo)}</div>
          </button>
        ))}
      </>}/>}
      {agregar&&<InventarioForm onClose={()=>setAgregar(false)} onSave={onAdd}/>}
      {editar&&<InventarioForm item={editar} onClose={()=>setEditar(null)} onSave={async(data)=>{await onEdit({...editar,...data});}} onDelete={async()=>{await onDelete(editar);}}/>}
    </div>
  );
}

// Modal compartido para agregar/editar un item de Inventario.
function InventarioForm({item,onClose,onSave,onDelete}){
  const [f,setF]=useState({producto:item?.producto||"",proveedor:item?.proveedor||"",costo:String(item?.costo||"")});
  const [saving,setSaving]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [err,setErr]=useState(null);
  const up=k=>v=>setF(p=>({...p,[k]:v}));
  const guardar=async()=>{
    setSaving(true);setErr(null);
    try{
      await onSave({producto:f.producto,proveedor:f.proveedor,costo:Number(f.costo)||0,fecha:item?.fecha||new Date().toISOString()});
      onClose();
    }catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  const borrar=async()=>{
    setSaving(true);setErr(null);
    try{await onDelete();onClose();}
    catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:K.bg,width:"100%",maxWidth:430,margin:"0 auto",borderRadius:"20px 20px 0 0",padding:"18px 16px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:700}}>{item?"Editar inventario":"Agregar al inventario"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <Card ch={<>
          <FInput label="Producto" value={f.producto} onChange={up("producto")} placeholder="ej: NIKE TN"/>
          <FInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")} placeholder="ej: LIDER, BOA..."/>
          <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$"/>
        </>}/>
        {err&&<div style={{textAlign:"center",color:K.red,fontWeight:700,marginBottom:8,fontSize:13}}>{err}</div>}
        <Btn label={item?"GUARDAR CAMBIOS":"AGREGAR"} onClick={guardar} col={K.purple} loading={saving} dis={!f.producto||!f.costo}/>
        {item&&onDelete&&(!confirmDel?
          <button onClick={()=>setConfirmDel(true)} style={{width:"100%",background:"none",border:"none",color:K.red,fontSize:13,fontWeight:700,padding:"12px 0 4px",cursor:"pointer"}}>🗑️ Borrar este registro</button>
          :<ConfirmDelete onConfirm={borrar} onCancel={()=>setConfirmDel(false)}/>)}
      </div>
    </div>
  );
}

// ═══ PERSONAL (Deuda Valen) ══════════════════════════════════════
// Libro personal, separado del negocio a propósito.
function Personal({db,onAdd,onEdit,onDelete}){
  const items=[...(db.deudaPersonal||[])];
  const saldoActual=items.length>0?items[items.length-1].saldo:0;
  const [agregar,setAgregar]=useState(false);
  const [editar,setEditar]=useState(null);
  return(
    <div>
      <Card s={{background:"#1d0909",border:"1px solid #4a1a1a"}} ch={<>
        <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Saldo actual</div>
        <div style={{fontSize:24,fontWeight:700,color:K.red}}>{fmt(saldoActual)}</div>
        <div style={{fontSize:11,color:K.muted,marginTop:2}}>Libro personal · no afecta las métricas del negocio</div>
      </>}/>
      <Btn label="+ AGREGAR MOVIMIENTO" onClick={()=>setAgregar(true)} col={K.red}/>
      <div style={{height:10}}/>
      {items.length===0&&<div style={{textAlign:"center",color:K.muted,padding:24,fontSize:13}}>Sin movimientos registrados</div>}
      {items.length>0&&<Card ch={<>
        <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Toca para editar o borrar</div>
        {[...items].reverse().map((it,i,arr)=>(
          <button key={it.id} onClick={()=>setEditar(it)} style={{width:"100%",background:"none",border:"none",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<arr.length-1?10:0,marginBottom:i<arr.length-1?10:0,borderBottom:i<arr.length-1?`1px solid ${K.border}`:"none"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:K.text}}>{it.movimiento}</div><div style={{fontSize:10,color:K.muted}}>{it.fecha||"—"}</div></div>
            <div style={{textAlign:"right"}}>
              {it.pago>0&&<div style={{fontSize:13,fontWeight:700,color:K.green}}>-{fmt(it.pago)}</div>}
              {it.presto>0&&<div style={{fontSize:13,fontWeight:700,color:K.red}}>+{fmt(it.presto)}</div>}
              <div style={{fontSize:10,color:K.muted}}>saldo {fmt(it.saldo)}</div>
            </div>
          </button>
        ))}
      </>}/>}
      {agregar&&<DeudaPersonalForm saldoBase={saldoActual} onClose={()=>setAgregar(false)} onSave={onAdd}/>}
      {editar&&<DeudaPersonalForm item={editar} onClose={()=>setEditar(null)} onSave={async(data)=>{await onEdit({...editar,...data});}} onDelete={async()=>{await onDelete(editar);}}/>}
    </div>
  );
}

// Modal compartido para agregar/editar un movimiento de Deuda Valen.
// El saldo se recalcula automáticamente: saldoBase + presto - pago.
function DeudaPersonalForm({item,saldoBase=0,onClose,onSave,onDelete}){
  const base=item?(item.saldo-(item.presto||0)+(item.pago||0)):saldoBase; // saldo previo a este movimiento
  const [f,setF]=useState({movimiento:item?.movimiento||"",presto:String(item?.presto||""),pago:String(item?.pago||""),fecha:item?.fecha||""});
  const [saving,setSaving]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [err,setErr]=useState(null);
  const up=k=>v=>setF(p=>({...p,[k]:v}));
  const nuevoSaldo=base+(Number(f.presto)||0)-(Number(f.pago)||0);
  const guardar=async()=>{
    setSaving(true);setErr(null);
    try{
      await onSave({movimiento:f.movimiento,presto:Number(f.presto)||0,pago:Number(f.pago)||0,saldo:nuevoSaldo,fecha:f.fecha||new Date().toLocaleDateString("es-CO")});
      onClose();
    }catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  const borrar=async()=>{
    setSaving(true);setErr(null);
    try{await onDelete();onClose();}
    catch(e){setErr("Error: "+e.message);setSaving(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:K.bg,width:"100%",maxWidth:430,margin:"0 auto",borderRadius:"20px 20px 0 0",padding:"18px 16px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:700}}>{item?"Editar movimiento":"Agregar movimiento"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <Card ch={<>
          <FInput label="Descripción" value={f.movimiento} onChange={up("movimiento")} placeholder="ej: Cadena, Mercado..."/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <FInput label="Presto (suma deuda)" value={f.presto} onChange={up("presto")} type="number" prefix="$"/>
            <FInput label="Pago (resta deuda)" value={f.pago} onChange={up("pago")} type="number" prefix="$"/>
          </div>
          <div style={{background:K.bg,borderRadius:DS.r.sm,padding:"10px 12px",marginTop:4,marginBottom:12,border:`1px solid ${K.border}`}}>
            <div style={{fontSize:9,color:K.muted}}>NUEVO SALDO</div>
            <div style={{fontSize:17,fontWeight:700,color:K.red}}>{fmt(nuevoSaldo)}</div>
          </div>
        </>}/>
        {err&&<div style={{textAlign:"center",color:K.red,fontWeight:700,marginBottom:8,fontSize:13}}>{err}</div>}
        <Btn label={item?"GUARDAR CAMBIOS":"AGREGAR"} onClick={guardar} col={K.red} loading={saving} dis={!f.movimiento}/>
        {item&&onDelete&&(!confirmDel?
          <button onClick={()=>setConfirmDel(true)} style={{width:"100%",background:"none",border:"none",color:K.red,fontSize:13,fontWeight:700,padding:"12px 0 4px",cursor:"pointer"}}>🗑️ Borrar este registro</button>
          :<ConfirmDelete onConfirm={borrar} onCancel={()=>setConfirmDel(false)}/>)}
      </div>
    </div>
  );
}

// ═══ MÁS ═══════════════════════════════════════════════════════
// Wrappers de pantalla completa para los nuevos tabs del nav
function CliEntesTab({db,onEditIngreso,onMarcarPagado,onRegistrarAbono}){
  return(
    <div style={{padding:"0 0 0"}}>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{fontSize:28,fontWeight:700,letterSpacing:-.5,marginBottom:16,color:K.text}}>Clientes</div>
        <Clientes db={db} onEditIngreso={onEditIngreso} onMarcarPagado={onMarcarPagado} onRegistrarAbono={onRegistrarAbono}/>
      </div>
    </div>
  );
}
function HistorialTab({db,onEditIngreso,onEditGasto}){
  return(
    <div style={{padding:"0 0 0"}}>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{fontSize:28,fontWeight:700,letterSpacing:-.5,marginBottom:16,color:K.text}}>Historial</div>
        <Historial db={db} onEditIngreso={onEditIngreso} onEditGasto={onEditGasto}/>
      </div>
    </div>
  );
}

function Mas({db,onEditIngreso,onEditGasto,onAddInv,onEditInv,onDeleteInv,onAddDeuda,onEditDeuda,onDeleteDeuda}){
  const [v,setV]=useState("clientes");
  const tabs=[["buscar","🔍","Buscar"],["inv","📦","Inventario"],["personal","📓","Personal"],["config","⚙️","Config"]];
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
      {v==="personal"&&<Personal db={db} onAdd={onAddDeuda} onEdit={onEditDeuda} onDelete={onDeleteDeuda}/>}
      {v==="config"&&<Configuracion/>}
    </div>
  );
}

// ═══ ROOT ══════════════════════════════════════════════════════
// ═══ LOGIN ════════════════════════════════════════════════════
function LoginScreen({onSuccess}){
  const [clave,setClave]=useState("");
  const [error,setError]=useState(false);
  const [entrando,setEntrando]=useState(false);
  const intentar=()=>{
    if(clave===CLAVE_ACCESO){
      setEntrando(true);
      setTimeout(()=>{localStorage.setItem(LS_AUTH_KEY,"1");onSuccess();},350);
    }else{setError(true);setClave("");}
  };
  const accent=getAccentColor();
  return(
    <div style={{
      background:`radial-gradient(ellipse at 35% 25%, ${accent}0A 0%, transparent 55%), #0D0D12`,
      minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
    }}>
      <div style={{position:"fixed",top:"15%",left:"50%",transform:"translateX(-50%)",width:280,height:280,borderRadius:"50%",background:`${accent}06`,filter:"blur(60px)",pointerEvents:"none"}}/>
      <div style={{
        width:"100%",maxWidth:360,
        background:"rgba(22,22,31,.88)",
        backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
        borderRadius:DS.r.xxl,padding:"40px 28px 32px",
        border:`1px solid rgba(255,255,255,.07)`,
        boxShadow:"0 24px 64px rgba(0,0,0,.75), 0 1px 0 rgba(255,255,255,.05) inset",
        position:"relative",
      }}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{
            width:76,height:76,
            background:`linear-gradient(145deg, ${accent} 0%, ${accent}BB 100%)`,
            borderRadius:DS.r.xl,margin:"0 auto 18px",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:34,fontWeight:700,color:"#000",
            boxShadow:`0 8px 28px ${accent}45, 0 2px 8px rgba(0,0,0,.4)`,
          }}>A</div>
          <div style={{color:K.white,fontWeight:700,fontSize:24,letterSpacing:-.5,marginBottom:4}}>Altaclase Bodega</div>
          <div style={{color:K.muted,fontSize:13}}>Control financiero B2B</div>
        </div>
        {/* Input clave */}
        <div style={{marginBottom:error?8:16}}>
          <input
            type="password" value={clave}
            onChange={e=>{setClave(e.target.value);setError(false);}}
            onKeyDown={e=>e.key==="Enter"&&intentar()}
            placeholder="Clave de acceso"
            autoFocus
            style={{
              width:"100%",
              background:K.card3,
              border:`1px solid ${error?K.red+"88":K.border}`,
              borderRadius:DS.r.md,color:K.text,
              padding:"15px 18px",fontSize:17,outline:"none",
              boxSizing:"border-box",textAlign:"center",letterSpacing:2,
              WebkitAppearance:"none",
              boxShadow:error?`0 0 0 3px ${K.red}22`:"none",
              transition:"border .15s, box-shadow .15s",
            }}
          />
        </div>
        {error&&<div style={{color:K.red,fontSize:12,textAlign:"center",marginBottom:12,background:`${K.red}12`,borderRadius:DS.r.sm,padding:"7px"}}>Clave incorrecta — inténtalo de nuevo</div>}
        <button
          onClick={intentar} disabled={!clave||entrando}
          style={{
            width:"100%",padding:"15px",
            background:!clave||entrando?K.card3:accent,
            border:"none",borderRadius:DS.r.md,
            color:!clave||entrando?K.muted:"#000",
            fontSize:15,fontWeight:600,cursor:!clave||entrando?"not-allowed":"pointer",
            opacity:!clave||entrando?.5:1,
            boxShadow:!clave||entrando?"none":`0 4px 20px ${accent}40`,
            transition:"all .2s",WebkitTapHighlightColor:"transparent",
          }}>
          {entrando?"Entrando...":"Entrar →"}
        </button>
        <div style={{textAlign:"center",fontSize:11,color:K.muted,marginTop:20,lineHeight:1.6}}>
          Sesión se cierra automáticamente en 3 minutos
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [autenticado,setAutenticado]=useState(()=>localStorage.getItem(LS_AUTH_KEY)==="1");
  const [tab,setTab]=useState("home"); // siempre inicia en home
  const [showNuevo,setShowNuevo]=useState(false);
  const [db,setDb]=useState({ingresos:[],gastos:[],inventario:[],clientesResumen:[],clientesEspeciales:[],deudaPersonal:[]});
  const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState(null);
  const [initDone,setInitDone]=useState(false);
  const [initError,setInitError]=useState(null);
  const [lastSync,setLastSync]=useState(null);
  const [editIng,setEditIng]=useState(null);
  const [editGas,setEditGas]=useState(null);
  const intervalRef=useRef(null);
  const inactivityRef=useRef(null);
  const INACTIVITY_MS=3*60*1000; // 3 minutos

  const cerrarSesion=useCallback(()=>{
    localStorage.removeItem(LS_AUTH_KEY);
    setAutenticado(false);
  },[]);

  // Cierra sesión al cerrar/recargar el navegador
  useEffect(()=>{
    const onUnload=()=>localStorage.removeItem(LS_AUTH_KEY);
    window.addEventListener("beforeunload",onUnload);
    return()=>window.removeEventListener("beforeunload",onUnload);
  },[]);

  // Timeout de inactividad: reinicia con cada toque/click/tecla
  useEffect(()=>{
    if(!autenticado)return;
    const reset=()=>{
      clearTimeout(inactivityRef.current);
      inactivityRef.current=setTimeout(cerrarSesion,INACTIVITY_MS);
    };
    const events=["touchstart","mousedown","keydown","scroll"];
    events.forEach(e=>window.addEventListener(e,reset,{passive:true}));
    reset(); // iniciar el timer al autenticarse
    return()=>{
      clearTimeout(inactivityRef.current);
      events.forEach(e=>window.removeEventListener(e,reset));
    };
  },[autenticado,cerrarSesion,INACTIVITY_MS]);

  const flash=(msg,col=K.gold)=>{setToast({msg,col});setTimeout(()=>setToast(null),2500)};

  const loadData=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      // allSettled: si una hoja nueva falla (nombre de columna distinto, etc.) las demás
      // siguen cargando — INGRESOS y GASTOS son las únicas que de verdad no pueden fallar.
      const sheets=["INGRESOS","GASTOS","INVENTARIO","CLIENTES","CLIENTES ESPECIALES","DEUDA VALEN"];
      const results=await Promise.allSettled(sheets.map(fetchSheet));
      const [rIng,rGas,rInv,rCli,rCliEsp,rDeuda]=results;

      if(rIng.status==="rejected")throw rIng.reason; // INGRESOS es crítico, si falla, falla todo
      if(rGas.status==="rejected")throw rGas.reason; // GASTOS también

      const ingresos=parseIngresos(rIng.value);
      const gastos=parseGastos(rGas.value);
      const inventario=rInv.status==="fulfilled"?parseInventario(rInv.value):[];
      const clientesResumen=rCli.status==="fulfilled"?parseClientesResumen(rCli.value):[];
      const clientesEspeciales=rCliEsp.status==="fulfilled"?parseClientesEspeciales(rCliEsp.value):[];
      const deudaPersonal=rDeuda.status==="fulfilled"?parseDeudaPersonal(rDeuda.value):[];

      setDb({ingresos,gastos,inventario,clientesResumen,clientesEspeciales,deudaPersonal});
      setLastSync(new Date());
      setInitError(null);
      if(!silent)flash(`✓ ${ingresos.length} ingresos · ${gastos.length} gastos`);
    }catch(e){
      if(!silent){
        flash("⚠️ Error conectando con Sheets",K.red);
        setInitError(e.message);
      }
      // si falla un sync silencioso (de fondo), no molestamos con toast, solo lo dejamos pasar y se reintenta en el próximo ciclo
    }finally{
      if(!silent)setLoading(false);
      setInitDone(true);
    }
  },[]);

  // Carga inicial
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(autenticado)loadData(false);},[loadData,autenticado]);

  // Auto-sync cada 2 minutos en segundo plano, y al volver a la pestaña/app
  useEffect(()=>{
    if(!autenticado)return;
    intervalRef.current=setInterval(()=>{loadData(true);},SYNC_INTERVAL_MS);
    const onVisible=()=>{if(document.visibilityState==="visible")loadData(true);};
    document.addEventListener("visibilitychange",onVisible);
    return()=>{clearInterval(intervalRef.current);document.removeEventListener("visibilitychange",onVisible);};
  },[loadData,autenticado]);

  const saveIngreso=async(row)=>{
    await appendRow("INGRESOS",row);
    await loadData(true);
  };
  const saveGasto=async(row)=>{
    await appendRow("GASTOS",row);
    await loadData(true);
  };
  const updateIngreso=async(item)=>{
    await updateRow("INGRESOS",item._row,ingresoToRow(item));
    await loadData(true);
    flash("✓ Ingreso actualizado");
  };
  const updateGasto=async(item)=>{
    await updateRow("GASTOS",item._row,gastoToRow(item));
    await loadData(true);
    flash("✓ Gasto actualizado");
  };
  const removeIngreso=async(item)=>{
    await deleteRow("INGRESOS",item._row);
    await loadData(true);
    flash("✓ Ingreso borrado",K.red);
  };
  const removeGasto=async(item)=>{
    await deleteRow("GASTOS",item._row);
    await loadData(true);
    flash("✓ Gasto borrado",K.red);
  };

  // ── Inventario ──
  const addInventario=async(it)=>{
    await appendRow("INVENTARIO",inventarioToRow(it));
    await loadData(true);
    flash("✓ Agregado al inventario",K.purple);
  };
  const editInventario=async(it)=>{
    await updateRow("INVENTARIO",it._row,inventarioToRow(it));
    await loadData(true);
    flash("✓ Inventario actualizado",K.purple);
  };
  const removeInventario=async(it)=>{
    await deleteRow("INVENTARIO",it._row);
    await loadData(true);
    flash("✓ Borrado del inventario",K.red);
  };

  // ── Personal (Deuda Valen) ──
  const addDeuda=async(it)=>{
    await appendRow("DEUDA VALEN",deudaPersonalToRow(it));
    await loadData(true);
    flash("✓ Movimiento agregado");
  };
  const editDeuda=async(it)=>{
    await updateRow("DEUDA VALEN",it._row,deudaPersonalToRow(it));
    await loadData(true);
    flash("✓ Movimiento actualizado");
  };
  const removeDeuda=async(it)=>{
    await deleteRow("DEUDA VALEN",it._row);
    await loadData(true);
    flash("✓ Movimiento borrado",K.red);
  };

  // ── Marcar pagado: actualiza DEBE?=NO en CADA fila pendiente de ese cliente.
  // Secuencial (no Promise.all) para evitar escrituras concurrentes a la misma hoja.
  const marcarPagado=async(pendientes,estado="NO")=>{
    for(const v of pendientes){
      const actualizado={...v,debe:estado};
      await updateRow("INGRESOS",v._row,ingresoToRow(actualizado));
    }
    const msg=estado==="NO"?"pagado":"marcado como debe";
    await loadData(true);
    flash(`✓ ${pendientes.length} ${msg}`);
  };

  // Registra un abono en la columna F de la hoja CLIENTES, buscando por nombre.
  // No usa _row porque las filas de CLIENTES se reordenan solas con fórmulas UNIQUE/FILTER.
  const registrarAbono=async(cliente,montoNuevo)=>{
    const qs=new URLSearchParams({action:"updateCell",sheet:"CLIENTES",lookupValue:cliente,col:"F",value:String(montoNuevo)}).toString();
    const res=await fetch(`${API}?${qs}`,{method:"GET",redirect:"follow"});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||"Error al registrar abono");
    await loadData(true);
    flash(`✓ Abono de ${cliente} registrado`);
  };

  const NAV=[
    {id:"home",icon:"⌂",label:""},
    {id:"clientes",icon:"",label:"Clientes"},
    {id:"historial",icon:"",label:"Historial"},
    {id:"mas",icon:"",label:"Más"},
  ];

  if(!autenticado){
    return <LoginScreen onSuccess={()=>{setAutenticado(true);setTab("home");}}/>;
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

  return(
    <div style={{
      background:K.bg,minHeight:"100dvh",color:K.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',sans-serif",
      WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale",
    }}>
    {/* Vista desktop: sidebar + contenido. Mobile: solo columna */}
    <div style={{
      display:"flex",minHeight:"100dvh",
      maxWidth:"100%",
    }}>
      {/* Sidebar desktop — solo visible en pantallas anchas */}
      <div style={{
        display:"none",
        // Se activa con CSS media query simulado via style
        ...(typeof window!=="undefined"&&window.innerWidth>=768?{
          display:"flex",flexDirection:"column",
          width:220,minHeight:"100dvh",
          background:DS.glass,
          backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
          borderRight:`1px solid ${K.border}`,
          padding:"48px 16px 24px",
          position:"fixed",top:0,left:0,bottom:0,
          zIndex:100,
        }:{}),
      }}>
        {typeof window!=="undefined"&&window.innerWidth>=768&&(<>
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
        </>)}
      </div>
      {/* Contenido principal */}
      <div style={{
        flex:1,
        maxWidth:430,
        margin:"0 auto",
        paddingBottom:"calc(60px + env(safe-area-inset-bottom,16px))",
        ...(typeof window!=="undefined"&&window.innerWidth>=768?{
          marginLeft:220,paddingBottom:0,maxWidth:"none",
        }:{}),
      }}>      {/* Toast premium */}
      {toast&&(
        <div style={{
          position:"fixed",top:"max(24px, env(safe-area-inset-top, 24px))",
          left:"50%",transform:"translateX(-50%)",
          background:"rgba(22,22,31,.95)",
          backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
          color:K.text,padding:"11px 22px",borderRadius:20,fontWeight:600,
          zIndex:9999,fontSize:13,
          boxShadow:`0 8px 32px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.06) inset`,
          whiteSpace:"nowrap",
          border:`1px solid rgba(255,255,255,.08)`,
          display:"flex",alignItems:"center",gap:8,
        }}>
          <span style={{width:6,height:6,borderRadius:"50%",background:K.gold,display:"inline-block",flexShrink:0}}/>
          {toast.msg}
        </div>
      )}
      {/* Contenido principal — scroll nativo */}
      <div style={{WebkitOverflowScrolling:"touch",overscrollBehavior:"none"}}>
        {tab==="home"&&<Home db={db} onRefresh={()=>loadData(false)} loading={loading} lastSync={lastSync}/>}
        {tab==="clientes"&&<CliEntesTab db={db} onEditIngreso={setEditIng} onMarcarPagado={marcarPagado} onRegistrarAbono={registrarAbono}/>}
        {tab==="historial"&&<HistorialTab db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas}/>}
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
              clientes={[...new Set(db.ingresos.filter(cuentaParaListaClientes).map(i=>i.cliente.toUpperCase().trim()).filter(Boolean))].sort()}
            />
          </div>
        </div>
      )}

      {/* Nav bar — glassmorphism premium */}
      <div style={{
        position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:430,
        background:"rgba(13,13,18,.92)",
        backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
        borderTop:`1px solid rgba(255,255,255,.06)`,
        display:"flex",zIndex:200,
        paddingBottom:"env(safe-area-inset-bottom,0px)",
        boxShadow:"0 -8px 32px rgba(0,0,0,.6)",
      }}>
        {NAV.map(({id,label})=>{
          const active=tab===id;
          const accent=K.gold;
          return(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"none",border:"none",padding:"10px 0 13px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,WebkitTapHighlightColor:"transparent",transition:"opacity .15s"}}>
              {id==="home"?(
                <svg width="20" height="20" viewBox="0 0 24 24" fill={active?accent:"none"} stroke={active?accent:K.muted} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                </svg>
              ):id==="clientes"?(
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?accent:K.muted} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                </svg>
              ):id==="historial"?(
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?accent:K.muted} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/>
                </svg>
              ):(
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?accent:K.muted} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                </svg>
              )}
              <span style={{fontSize:10,fontWeight:active?600:400,color:active?accent:K.muted,letterSpacing:-.1}}>{id==="home"?"Inicio":label}</span>
              {active&&<div style={{position:"absolute",bottom:0,width:3,height:3,borderRadius:"50%",background:accent}}/>}
            </button>
          );
        })}
      </div>

      {editIng&&<EditIngreso item={editIng} onClose={()=>setEditIng(null)} onSave={updateIngreso} onDelete={removeIngreso}/>}
      {editGas&&<EditGasto item={editGas} onClose={()=>setEditGas(null)} onSave={updateGasto} onDelete={removeGasto}/>}
    </div>
    </div>
    </div>
  );
}
