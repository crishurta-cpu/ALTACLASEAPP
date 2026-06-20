import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://script.google.com/macros/s/AKfycbySGO0LtHtnT7SBEHF22TfsDUmz3kqmz3C2a-tZk6zL3_ZFuEoUF485h4QWvxq4H_S7/exec";
const SYNC_INTERVAL_MS = 120000; // 2 minutos

// Clave de acceso simple: bloquea curiosos casuales con el link, no es seguridad
// criptográfica real (vive en el código del navegador). Suficiente para un solo
// operador; si la app crece a multi-usuario, esto debe pasar a un backend real.
const CLAVE_ACCESO = "ClaudeAlta";
const LS_AUTH_KEY = "altaclase_auth_ok";

const K={bg:"#0c0c0c",card:"#181818",card2:"#222",green:"#4ade80",red:"#f87171",blue:"#60a5fa",yellow:"#fbbf24",purple:"#a78bfa",orange:"#fb923c",border:"#2a2a2a",muted:"#585858",text:"#f0f0f0"};
const CCAT={"AHORRO":K.blue,"DEUDA - BANCOS":K.red,"GASTO FIJO":K.yellow,"MERCADO":"#34d399","NEGOCIO":K.purple,"PERSONALES":K.orange,"SALIDA / DOMICILIO":"#e879f9"};
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
const Card=({ch,s={}})=><div style={{background:K.card,borderRadius:14,padding:14,marginBottom:10,...s}}>{ch}</div>;
const Pill=({text,color})=><span style={{background:`${color}22`,color,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>{text}</span>;
const Btn=({label,onClick,col=K.green,dis,outline,sm,loading})=>(
  <button onClick={onClick} disabled={dis||loading} style={{width:sm?"auto":"100%",padding:sm?"8px 16px":"14px",background:outline?"transparent":(dis||loading)?K.card2:col,color:outline?col:(dis||loading)?K.muted:"#000",border:`1.5px solid ${outline?col:(dis||loading)?K.border:col}`,borderRadius:sm?10:13,fontSize:sm?12:15,fontWeight:700,cursor:(dis||loading)?"not-allowed":"pointer",opacity:(dis||loading)?.6:1}}>
    {loading?"⏳ Guardando...":label}
  </button>
);
const ChipGroup=({label,options,value,onChange,colorMap={}})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:11,color:K.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>{label}</div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {options.map(o=>{const col=colorMap[o]||K.green,sel=value===o;return <button key={o} onClick={()=>onChange(o)} style={{background:sel?`${col}22`:"transparent",border:`1.5px solid ${sel?col:K.border}`,color:sel?col:K.muted,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{o}</button>;})}
    </div>
  </div>
);
const FInput=({label,value,onChange,type="text",placeholder,prefix})=>(
  <div style={{marginBottom:12,minWidth:0}}>
    {label&&<div style={{fontSize:11,color:K.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.8}}>{label}</div>}
    <div style={{display:"flex",alignItems:"center",background:K.card2,border:`1px solid ${K.border}`,borderRadius:10,overflow:"hidden",minWidth:0}}>
      {prefix&&<span style={{padding:"0 10px",color:K.muted,fontSize:13,flexShrink:0}}>{prefix}</span>}
      <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{flex:1,minWidth:0,width:"100%",background:"transparent",border:"none",color:K.text,padding:"11px 12px",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
    </div>
  </div>
);

// Confirmación inline de borrado (sin window.confirm, que no anda bien en el artifact)
function ConfirmDelete({onConfirm,onCancel}){
  return(
    <div style={{display:"flex",gap:6,marginTop:8}}>
      <button onClick={onConfirm} style={{flex:1,background:`${K.red}22`,border:`1.5px solid ${K.red}`,color:K.red,borderRadius:8,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sí, borrar</button>
      <button onClick={onCancel} style={{flex:1,background:"transparent",border:`1.5px solid ${K.border}`,color:K.muted,borderRadius:8,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
    </div>
  );
}

// ═══ HOME ═════════════════════════════════════════════════════
function Home({db,onRefresh,loading,lastSync}){
  const m=curM();
  // cuentaParaTotales aplica la regla: Bayron/Marco solo cuentan si TIPO=VENTA o COMISION.
  const ingTodos=db.ingresos.filter(i=>mKey(i.fecha)===m);
  const ing=ingTodos.filter(cuentaParaTotales);
  const gas=db.gastos.filter(g=>mKey(g.fecha)===m);
  const ventas=ing.reduce((s,i)=>s+i.precioVenta,0);
  const gan=ing.reduce((s,i)=>s+i.ganancia,0);
  // Gastos incluye TODOS los conceptos, incluyendo AHORRO — así calcula tu Excel real
  // la Utilidad del mes (SUMIFS de GASTOS!C:C sin excluir ningún concepto).
  const gastos=gas.reduce((s,g)=>s+g.costo,0);
  const ahorro=gas.filter(g=>g.concepto==="AHORRO").reduce((s,g)=>s+g.costo,0); // solo informativo
  const util=gan-gastos;
  const mrg=ventas>0?(util/ventas*100).toFixed(1):0;
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
  const diasIng=agruparPorDia(db.ingresos.filter(cuentaParaTotales),"ganancia");
  // Últimos gastos: movimientos individuales (no agrupados), últimos 5.
  const ultimosGastos=[...db.gastos].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,5);
  const syncTxt=lastSync?lastSync.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}):"—";
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:K.muted,letterSpacing:1,textTransform:"uppercase"}}>Altaclase Bodega</div>
          <div style={{fontSize:30,fontWeight:900,letterSpacing:-0.5}}>{mLabel(m)}</div>
        </div>
        <button onClick={onRefresh} disabled={loading} style={{background:"none",border:`1px solid ${K.border}`,borderRadius:10,padding:"6px 14px",color:loading?K.muted:K.green,fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer"}}>
          {loading?"⏳":"🔄"} Sync
        </button>
      </div>

      <div style={{background:util>=0?"#091d10":"#1d0909",border:`1px solid ${util>=0?"#1a4a2a":"#4a1a1a"}`,borderRadius:16,padding:"18px 16px",marginBottom:10}}>
        <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Utilidad del mes</div>
        <div style={{fontSize:36,fontWeight:900,color:util>=0?K.green:K.red,letterSpacing:-1}}>{fmt(util)}</div>
        <div style={{display:"flex",gap:14,marginTop:6,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:K.muted}}>Margen <b style={{color:util>=0?K.green:K.red}}>{mrg}%</b></span>
          {ahorro>0&&<span style={{fontSize:12,color:K.muted}}>Ahorro <b style={{color:K.blue}}>{fmt(ahorro)}</b></span>}
          {debenList.length>0&&<span style={{fontSize:12,color:K.red}}>⚠️ {debenList.length} deben</span>}
        </div>
      </div>

      <Card ch={
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
          {[["Ventas",ventas,K.green],["Ganancia",gan,K.blue],["Gastos",gastos,K.red]].map(([l,v,col],i)=>(
            <div key={l} style={{textAlign:"center",borderRight:i<2?`1px solid ${K.border}`:""}}>
              <div style={{fontSize:9,color:K.muted,textTransform:"uppercase",marginBottom:2}}>{l}</div>
              <div style={{fontSize:14,fontWeight:800,color:col}}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      }/>

      {top5.length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,paddingLeft:2}}>🏆 Top Clientes del Mes</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollSnapType:"x mandatory"}}>
            {top5.map(([nom,st],i)=>{
              const debeMucho=(deudaPorNombre[nom]||0)>1000000;
              return(
                <div key={nom} style={{flexShrink:0,scrollSnapAlign:"start",width:108,height:108,background:K.card,border:`1.5px solid ${i===0?"#ffd700":K.border}`,borderRadius:14,padding:10,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:["#ffd700","#c0c0c0","#cd7f32","#444","#444"][i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:i<3?"#000":K.muted}}>{i+1}</div>
                    {debeMucho&&<span style={{fontSize:14}}>⚠️</span>}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nom}</div>
                    <div style={{fontSize:13,fontWeight:800,color:K.green}}>{fmt(st.g)}</div>
                    <div style={{fontSize:9,color:K.muted}}>{st.n} venta{st.n!==1?"s":""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {debenList.length>0&&<Card s={{background:"#1a0808",border:`1px solid #4a1a1a`}} ch={<>
        <div style={{fontSize:11,color:K.red,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>⚠️ Deben cobrar</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {debenList.map(c=><span key={c.cliente} style={{background:`${K.red}18`,border:`1px solid ${K.red}`,color:K.red,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700}}>{c.cliente} · {fmt(c.saldo)}</span>)}
        </div>
      </>}/>}

      {diasIng.length>0&&<Card ch={<>
        <div style={{fontSize:11,color:K.green,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⬆️ Últimos ingresos · por día</div>
        {diasIng.map((d,i)=>(
          <div key={d.fecha} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<diasIng.length-1?9:0,marginBottom:i<diasIng.length-1?9:0,borderBottom:i<diasIng.length-1?`1px solid ${K.border}`:"none"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600}}>{fDate(d.fecha)}</div>
              <div style={{fontSize:10,color:K.muted}}>{d.n} venta{d.n!==1?"s":""}</div>
            </div>
            <div style={{textAlign:"right",marginLeft:8}}>
              <div style={{fontSize:14,fontWeight:800,color:K.green}}>{fmt(d.total)}</div>
            </div>
          </div>
        ))}
      </>}/>}

      {ultimosGastos.length>0&&<Card ch={<>
        <div style={{fontSize:11,color:K.red,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⬇️ Últimos gastos</div>
        {ultimosGastos.map((g,i)=>(
          <div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<ultimosGastos.length-1?9:0,marginBottom:i<ultimosGastos.length-1?9:0,borderBottom:i<ultimosGastos.length-1?`1px solid ${K.border}`:"none"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.referencia}</div>
              <div style={{fontSize:10,color:K.muted}}>{g.concepto} · {fDate(g.fecha)}</div>
            </div>
            <div style={{textAlign:"right",marginLeft:8}}>
              <div style={{fontSize:14,fontWeight:800,color:CCAT[g.concepto]||K.red}}>-{fmt(g.costo)}</div>
            </div>
          </div>
        ))}
      </>}/>}

      <div style={{textAlign:"center",fontSize:10,color:K.muted,paddingBottom:8}}>
        📊 {db.ingresos.length} ingresos · {db.gastos.length} gastos · última sync {syncTxt}
      </div>
    </div>
  );
}

// ═══ INGRESO FORM ══════════════════════════════════════════════
// ═══ NUEVO MOVIMIENTO (un solo botón, selector interno) ═════════
function NuevoMovimiento({onSaveIngreso,onSaveGasto}){
  const [modo,setModo]=useState("ingreso");
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <button onClick={()=>setModo("ingreso")} style={{flex:1,background:modo==="ingreso"?`${K.green}22`:K.card,border:`1.5px solid ${modo==="ingreso"?K.green:K.border}`,color:modo==="ingreso"?K.green:K.muted,borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:800,cursor:"pointer"}}>⬆️ Ingreso</button>
        <button onClick={()=>setModo("gasto")} style={{flex:1,background:modo==="gasto"?`${K.red}22`:K.card,border:`1.5px solid ${modo==="gasto"?K.red:K.border}`,color:modo==="gasto"?K.red:K.muted,borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:800,cursor:"pointer"}}>⬇️ Gasto</button>
      </div>
      {modo==="ingreso"?<IngresoForm onSave={onSaveIngreso}/>:<GastoForm onSave={onSaveGasto}/>}
    </div>
  );
}

function IngresoForm({onSave}){
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
      const item={fecha:new Date().toISOString(),tipo:f.tipo,producto:f.producto,cliente:f.cliente,proveedor:f.proveedor,costo:Number(f.costo)||0,precioVenta:Number(f.pv)||0,debe:f.debe?"SI":"NO",ganancia:gan,margen:mrg+"%"};
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
        <div><div style={{fontSize:10,color:K.muted}}>NUEVO · SE GUARDA EN SHEETS</div><div style={{fontSize:20,fontWeight:800,color:K.green}}>Ingreso</div></div>
      </div>
      <Card ch={<>
        <ChipGroup label="Tipo" options={TIPOS} value={f.tipo} onChange={up("tipo")}/>
        <FInput label="Producto" value={f.producto} onChange={up("producto")} placeholder="ej: NIKE TN, SAMBA..."/>
        <FInput label="Cliente" value={f.cliente} onChange={up("cliente")} placeholder="ej: ALEJANDRA"/>
        <FInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")} placeholder="ej: LIDER, BOA, FYM..."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$" placeholder="0"/>
          <FInput label="Precio venta" value={f.pv} onChange={up("pv")} type="number" prefix="$" placeholder="0"/>
        </div>
        {(f.costo||f.pv)&&<div style={{background:K.bg,borderRadius:10,padding:"10px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",border:`1px solid ${K.border}`}}>
          <div><div style={{fontSize:9,color:K.muted,marginBottom:1}}>GANANCIA</div><div style={{fontSize:17,fontWeight:800,color:gan>=0?K.green:K.red}}>{fmt(gan)}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:9,color:K.muted,marginBottom:1}}>MARGEN</div><div style={{fontSize:17,fontWeight:800,color:gan>=0?K.green:K.red}}>{mrg}%</div></div>
        </div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,color:K.muted}}>¿El cliente debe?</span>
          <button onClick={()=>up("debe")(!f.debe)} style={{background:f.debe?`${K.red}22`:"transparent",border:`1.5px solid ${f.debe?K.red:K.border}`,color:f.debe?K.red:K.muted,borderRadius:20,padding:"6px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{f.debe?"SÍ ✓":"NO"}</button>
        </div>
      </>}/>
      {ok&&<div style={{textAlign:"center",color:K.green,fontWeight:700,marginBottom:8,fontSize:14}}>✅ ¡Guardado en Google Sheets!</div>}
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
      const item={fecha:new Date().toISOString(),concepto:f.concepto,costo:Number(f.costo)||0,referencia:f.ref};
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
        <div><div style={{fontSize:10,color:K.muted}}>NUEVO · SE GUARDA EN SHEETS</div><div style={{fontSize:20,fontWeight:800,color:K.red}}>Gasto</div></div>
      </div>
      <Card ch={<>
        <ChipGroup label="Concepto" options={CONCS} value={f.concepto} onChange={up("concepto")} colorMap={CCAT}/>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:K.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:.8}}>Valor</div>
          <div style={{display:"flex",alignItems:"center",background:K.card2,border:`1px solid ${K.border}`,borderRadius:10}}>
            <span style={{padding:"0 14px",color:K.muted,fontSize:14}}>$</span>
            <input type="number" value={f.costo} onChange={e=>up("costo")(e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",color:K.text,padding:"12px 8px 12px 0",fontSize:16,outline:"none",fontWeight:700}}/>
          </div>
        </div>
        <FInput label="Referencia" value={f.ref} onChange={up("ref")} placeholder="ej: ARRIENDO, MERCADO..."/>
      </>}/>
      {ok&&<div style={{textAlign:"center",color:K.green,fontWeight:700,marginBottom:8,fontSize:14}}>✅ ¡Guardado en Google Sheets!</div>}
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
          <div style={{fontSize:17,fontWeight:800}}>Editar ingreso</div>
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
          <div style={{background:K.bg,borderRadius:10,padding:"10px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",border:`1px solid ${K.border}`}}>
            <div><div style={{fontSize:9,color:K.muted}}>GANANCIA</div><div style={{fontSize:17,fontWeight:800,color:gan>=0?K.green:K.red}}>{fmt(gan)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:K.muted}}>MARGEN</div><div style={{fontSize:17,fontWeight:800,color:gan>=0?K.green:K.red}}>{mrg}%</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:K.muted}}>¿El cliente debe?</span>
            <button onClick={()=>up("debe")(!f.debe)} style={{background:f.debe?`${K.red}22`:"transparent",border:`1.5px solid ${f.debe?K.red:K.border}`,color:f.debe?K.red:K.muted,borderRadius:20,padding:"6px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{f.debe?"SÍ ✓":"NO"}</button>
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
          <div style={{fontSize:17,fontWeight:800}}>Editar gasto</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <Card ch={<>
          <ChipGroup label="Concepto" options={CONCS} value={f.concepto} onChange={up("concepto")} colorMap={CCAT}/>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:K.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:.8}}>Valor</div>
            <div style={{display:"flex",alignItems:"center",background:K.card2,border:`1px solid ${K.border}`,borderRadius:10}}>
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
function Historial({db,onEditIngreso,onEditGasto}){
  const [open,setOpen]=useState(curM()); // abre el mes actual por defecto, más fácil de leer al entrar
  const [filter,setFilter]=useState("ingresos");
  const [buscar,setBuscar]=useState("");
  const months=[...new Set([...db.ingresos.map(i=>mKey(i.fecha)),...db.gastos.map(g=>mKey(g.fecha))].filter(Boolean))].sort().reverse();
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>📅 Historial</div>
      <div style={{fontSize:12,color:K.muted,marginBottom:16}}>{months.length} meses registrados · toca un movimiento para editar</div>
      {months.map(m=>{
        // Bayron/Marco filtrados de los totales del mes (regla cuentaParaTotales), igual que en Home.
        const ing=db.ingresos.filter(i=>mKey(i.fecha)===m&&cuentaParaTotales(i));
        const gas=db.gastos.filter(g=>mKey(g.fecha)===m);
        const ventas=ing.reduce((s,i)=>s+i.precioVenta,0);
        const gan=ing.reduce((s,i)=>s+i.ganancia,0);
        // Gastos incluye AHORRO, igual que el cálculo real de Utilidad en tu Excel.
        const gastos=gas.reduce((s,g)=>s+g.costo,0);
        const ahorro=gas.filter(g=>g.concepto==="AHORRO").reduce((s,g)=>s+g.costo,0); // solo informativo
        const util=gan-gastos;
        const isOpen=open===m;
        const allTx=isOpen?[...ing.map(x=>({...x,t:"i"})),...gas.map(x=>({...x,t:"g"}))].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)):[];
        let filtered=filter==="ingresos"?allTx.filter(x=>x.t==="i"):allTx.filter(x=>x.t==="g");
        if(buscar.trim()){
          const q=buscar.toUpperCase().trim();
          filtered=filtered.filter(x=>x.t==="i"
            ?(x.producto||"").toUpperCase().includes(q)||(x.cliente||"").toUpperCase().includes(q)||(x.proveedor||"").toUpperCase().includes(q)
            :(x.referencia||"").toUpperCase().includes(q)||(x.concepto||"").toUpperCase().includes(q));
        }
        return(
          <div key={m} style={{marginBottom:8}}>
            <button onClick={()=>{setOpen(isOpen?null:m);setFilter("ingresos");setBuscar("");}} style={{width:"100%",background:K.card,border:`1px solid ${isOpen?K.green:K.border}`,borderRadius:isOpen?"14px 14px 0 0":14,padding:14,cursor:"pointer",textAlign:"left"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:800,fontSize:16,color:K.text}}>{mLabel(m)}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontWeight:900,fontSize:18,color:util>=0?K.green:K.red}}>{fmt(util)}</div>
                  <span style={{color:K.muted}}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4}}>
                {[["Ventas",ventas,K.green],["Gan.",gan,K.blue],["Gastos",gastos,K.red],["Ahorro",ahorro,K.blue]].map(([l,v,col])=>(
                  <div key={l} style={{background:K.bg,borderRadius:8,padding:"5px 4px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:K.muted,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:11,fontWeight:700,color:col}}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:6,fontSize:10,color:K.muted}}>
                Margen <b style={{color:util>=0?K.green:K.red}}>{ventas>0?(util/ventas*100).toFixed(1):0}%</b>
                {"  ·  "}{ing.length} ingresos · {gas.length} gastos
              </div>
            </button>
            {isOpen&&(
              <div style={{background:K.card2,border:`1px solid ${K.green}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:12}}>
                <input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="🔍 Buscar producto, cliente, concepto..." style={{width:"100%",background:K.bg,border:`1px solid ${K.border}`,borderRadius:10,color:K.text,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{display:"flex",gap:6,marginBottom:12}}>
                  {[["ingresos","Ingresos",K.green],["gastos","Gastos",K.red]].map(([v,l,col])=>(
                    <button key={v} onClick={()=>setFilter(v)} style={{flex:1,background:filter===v?`${col}22`:"transparent",border:`1px solid ${filter===v?col:K.border}`,color:filter===v?col:K.muted,borderRadius:8,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
                {filtered.length===0&&<div style={{textAlign:"center",color:K.muted,padding:16,fontSize:13}}>Sin registros</div>}
                {filtered.map((item,i)=>{
                  const isI=item.t==="i",val=isI?item.ganancia:item.costo,col=isI?(val>=0?K.green:K.muted):CCAT[item.concepto]||K.red;
                  return(
                    <button key={i} onClick={()=>isI?onEditIngreso(item):onEditGasto(item)} style={{width:"100%",background:"none",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<filtered.length-1?`1px solid ${K.border}`:"none",cursor:"pointer",textAlign:"left"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:K.text}}>{isI?(item.producto||item.tipo):item.referencia}</div>
                        <div style={{fontSize:10,color:K.muted}}>{isI?`${item.tipo}${item.cliente?" · "+item.cliente:""}`:item.concepto} · {fDate(item.fecha)}</div>
                      </div>
                      <div style={{textAlign:"right",marginLeft:8}}>
                        <div style={{fontSize:13,fontWeight:800,color:col}}>{isI?(val>=0?"+":"")+fmt(val):"-"+fmt(val)}</div>
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
        <button onClick={()=>setConfirmar(true)} style={{width:"100%",background:`${K.green}18`,border:`1.5px solid ${K.green}`,color:K.green,borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:800,cursor:"pointer"}}>
          ✓ YA PAGÓ ({pendientes.length} pendiente{pendientes.length!==1?"s":""})
        </button>
      ):(
        <div style={{background:K.card,border:`1.5px solid ${K.green}`,borderRadius:12,padding:12}}>
          <div style={{fontSize:13,color:K.text,marginBottom:10,textAlign:"center"}}>¿Confirmar que {cliente} ya pagó las {pendientes.length} compra{pendientes.length!==1?"s":""} pendientes?</div>
          {error&&<div style={{color:K.red,fontSize:12,textAlign:"center",marginBottom:8}}>{error}</div>}
          <div style={{display:"flex",gap:6}}>
            <button onClick={confirmarPago} disabled={cargando} style={{flex:1,background:K.green,border:"none",color:"#000",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:800,cursor:cargando?"not-allowed":"pointer",opacity:cargando?.6:1}}>{cargando?"⏳ Guardando...":"Sí, ya pagó"}</button>
            <button onClick={()=>setConfirmar(false)} disabled={cargando} style={{flex:1,background:"transparent",border:`1.5px solid ${K.border}`,color:K.muted,borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Clientes({db,onEditIngreso,onMarcarPagado}){
  const [sel,setSel]=useState(null);
  const [q,setQ]=useState("");
  const [mesSel,setMesSel]=useState("todos"); // filtro de mes dentro del detalle de un cliente
  const [pagina,setPagina]=useState(1);
  const PORPAGINA=15;
  const map={};
  // CRIS, PRESTAMO y demás movimientos internos se excluyen AQUÍ (lista de clientes),
  // pero siguen sumando en la Ganancia/Utilidad general del Home, porque ese dinero sí
  // entró al negocio — solo no deben listarse como si fueran un revendedor real.
  db.ingresos.filter(cuentaParaListaClientes).forEach(i=>{
    const k=(i.cliente||"").toUpperCase().trim();
    if(!k)return;
    if(!map[k])map[k]={ventas:[],gan:0,debe:false};
    map[k].ventas.push(i);map[k].gan+=i.ganancia;
  });
  // El estado real de "debe" viene de la hoja CLIENTES (más confiable que inferirlo fila por fila).
  // BUGFIX: en tu Sheet real hay nombres duplicados por espacios extra (ej. "ALEJANDRA"
  // y "ALEJANDRA " son dos filas distintas). Antes esto sobreescribía una fila con la
  // otra y se perdía la deuda. Ahora se combinan: si CUALQUIERA de las filas duplicadas
  // debe, el cliente combinado queda marcado como que debe, y el saldo se suma.
  const deudaPorCliente={};
  (db.clientesResumen||[]).forEach(c=>{
    const k=c.cliente.toUpperCase().trim();
    const prev=deudaPorCliente[k];
    deudaPorCliente[k]={
      debe:(prev?.debe||false)||c.debe==="SI",
      saldo:(prev?.saldo||0)+c.saldo,
    };
  });
  Object.keys(map).forEach(k=>{map[k].debe=deudaPorCliente[k]?.debe||false; map[k].saldo=deudaPorCliente[k]?.saldo||0;});

  const lista=Object.entries(map).filter(([k])=>!q||k.includes(q.toUpperCase())).sort((a,b)=>b[1].gan-a[1].gan);
  const totalPaginas=Math.max(1,Math.ceil(lista.length/PORPAGINA));
  const paginaSegura=Math.min(pagina,totalPaginas);
  const listaPagina=lista.slice((paginaSegura-1)*PORPAGINA,paginaSegura*PORPAGINA);

  if(sel){
    const{ventas,gan}=map[sel]||{ventas:[],gan:0};
    const meses=[...new Set(ventas.map(v=>mKey(v.fecha)))].sort().reverse();
    const ventasFiltradas=mesSel==="todos"?ventas:ventas.filter(v=>mKey(v.fecha)===mesSel);
    const tv=ventasFiltradas.reduce((s,v)=>s+v.precioVenta,0);
    const ganF=ventasFiltradas.reduce((s,v)=>s+v.ganancia,0);
    return(
      <div>
        <button onClick={()=>{setSel(null);setMesSel("todos");}} style={{background:"none",border:"none",color:K.blue,fontSize:15,cursor:"pointer",marginBottom:16,padding:0}}>← Todos</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:18,fontWeight:800}}>{sel}</div>
          {map[sel]?.debe&&<Pill text={`DEBE ${fmt(map[sel].saldo)}`} color={K.red}/>}
        </div>
        {map[sel]?.debe&&<MarcarPagadoBtn cliente={sel} ventas={ventas} onMarcarPagado={onMarcarPagado}/>}
        {meses.length>1&&(
          <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
            <button onClick={()=>setMesSel("todos")} style={{flexShrink:0,background:mesSel==="todos"?`${K.green}22`:"transparent",border:`1.5px solid ${mesSel==="todos"?K.green:K.border}`,color:mesSel==="todos"?K.green:K.muted,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Todos</button>
            {meses.map(mk=>(
              <button key={mk} onClick={()=>setMesSel(mk)} style={{flexShrink:0,background:mesSel===mk?`${K.green}22`:"transparent",border:`1.5px solid ${mesSel===mk?K.green:K.border}`,color:mesSel===mk?K.green:K.muted,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{mLabel(mk)}</button>
            ))}
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <Card s={{marginBottom:0}} ch={<><div style={{fontSize:9,color:K.muted,marginBottom:2}}>TOTAL VENTAS</div><div style={{fontSize:18,fontWeight:800,color:K.green}}>{fmt(tv)}</div></>}/>
          <Card s={{marginBottom:0}} ch={<><div style={{fontSize:9,color:K.muted,marginBottom:2}}>GANANCIA</div><div style={{fontSize:18,fontWeight:800,color:K.blue}}>{fmt(ganF)}</div></>}/>
        </div>
        <Card ch={<>
          <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Historial ({ventasFiltradas.length}) · toca para editar</div>
          {ventasFiltradas.length===0&&<div style={{textAlign:"center",color:K.muted,padding:16,fontSize:13}}>Sin compras este mes</div>}
          {ventasFiltradas.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((v,i,arr)=>{
            const debe=v.debe==="SI";
            return(
            <button key={i} onClick={()=>onEditIngreso(v)} style={{width:"100%",background:debe?"#2a0f0f":"none",border:debe?`1px solid ${K.red}`:"none",borderRadius:debe?10:0,padding:debe?"8px 10px":"0",textAlign:"left",cursor:"pointer",paddingBottom:i<arr.length-1?10:(debe?8:0),marginBottom:i<arr.length-1?10:0,borderBottom:!debe&&i<arr.length-1?`1px solid ${K.border}`:(debe?`1px solid ${K.red}`:"none")}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,fontWeight:700,color:K.text}}>{v.producto}{debe&&<span style={{marginLeft:6,fontSize:9,background:`${K.red}33`,color:K.red,borderRadius:5,padding:"2px 6px",fontWeight:700}}>DEBE</span>}</div><div style={{fontSize:10,color:K.muted}}>{v.tipo} · {fDate(v.fecha)} · {v.proveedor}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:800,color:K.green}}>+{fmt(v.ganancia)}</div><div style={{fontSize:10,color:debe?K.red:K.muted,fontWeight:debe?700:400}}>{fmt(v.precioVenta)}</div></div>
              </div>
            </button>
            );
          })}
        </>}/>
      </div>
    );
  }
  return(
    <div>
      {lista.filter(([,v])=>v.debe).length>0&&(
        <Card s={{background:"#1a0808",border:`1px solid #4a1a1a`,marginBottom:10}} ch={<>
          <div style={{fontSize:11,color:K.red,fontWeight:700,marginBottom:6}}>⚠️ DEBEN COBRAR</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {lista.filter(([,v])=>v.debe).map(([n])=><button key={n} onClick={()=>setSel(n)} style={{background:`${K.red}18`,border:`1px solid ${K.red}`,color:K.red,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{n}</button>)}
          </div>
        </>}/>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:14,fontWeight:700,color:K.muted}}>{lista.length} clientes</div>
      </div>
      <input value={q} onChange={e=>{setQ(e.target.value);setPagina(1);}} placeholder="🔍 Buscar..." style={{width:"100%",background:K.card,border:`1px solid ${K.border}`,borderRadius:12,color:K.text,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
      {listaPagina.map(([nom,st])=>(
        <button key={nom} onClick={()=>setSel(nom)} style={{width:"100%",background:st.debe?"#2a0f0f":K.card,border:`1px solid ${st.debe?K.red:K.border}`,borderRadius:14,padding:"12px 14px",marginBottom:8,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:K.text,marginBottom:3}}>
              {nom}{st.debe&&<span style={{marginLeft:6,fontSize:9,background:`${K.red}33`,color:K.red,borderRadius:5,padding:"2px 6px",fontWeight:700}}>DEBE</span>}
            </div>
            <div style={{fontSize:11,color:K.muted}}>{st.ventas.length} compra{st.ventas.length!==1?"s":""}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:16,fontWeight:800,color:K.green}}>{fmt(st.gan)}</div>
            <div style={{fontSize:10,color:K.muted}}>ganancia</div>
          </div>
        </button>
      ))}
      {totalPaginas>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:12,marginTop:8,marginBottom:8}}>
          <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={paginaSegura===1} style={{background:"none",border:`1px solid ${K.border}`,color:paginaSegura===1?K.muted:K.text,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:paginaSegura===1?"not-allowed":"pointer",opacity:paginaSegura===1?.4:1}}>← Atrás</button>
          <span style={{fontSize:12,color:K.muted}}>Página {paginaSegura} de {totalPaginas}</span>
          <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={paginaSegura===totalPaginas} style={{background:"none",border:`1px solid ${K.border}`,color:paginaSegura===totalPaginas?K.muted:K.text,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:paginaSegura===totalPaginas?"not-allowed":"pointer",opacity:paginaSegura===totalPaginas?.4:1}}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}

// ═══ INVENTARIO ════════════════════════════════════════════════
// Lista simple de compras a proveedor, tal cual la hoja: sin cruzar con ventas.
function Inventario({db,onAdd,onEdit,onDelete}){
  const items=[...(db.inventario||[])].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const total=items.reduce((s,i)=>s+i.costo,0);
  const [agregar,setAgregar]=useState(false);
  const [editar,setEditar]=useState(null);
  return(
    <div>
      <Card ch={<>
        <div style={{fontSize:11,color:K.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Total invertido</div>
        <div style={{fontSize:24,fontWeight:900,color:K.purple}}>{fmt(total)}</div>
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
            <div style={{fontSize:13,fontWeight:800,color:K.purple}}>{fmt(it.costo)}</div>
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
          <div style={{fontSize:17,fontWeight:800}}>{item?"Editar inventario":"Agregar al inventario"}</div>
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
        <div style={{fontSize:24,fontWeight:900,color:K.red}}>{fmt(saldoActual)}</div>
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
              {it.pago>0&&<div style={{fontSize:13,fontWeight:800,color:K.green}}>-{fmt(it.pago)}</div>}
              {it.presto>0&&<div style={{fontSize:13,fontWeight:800,color:K.red}}>+{fmt(it.presto)}</div>}
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
          <div style={{fontSize:17,fontWeight:800}}>{item?"Editar movimiento":"Agregar movimiento"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:K.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <Card ch={<>
          <FInput label="Descripción" value={f.movimiento} onChange={up("movimiento")} placeholder="ej: Cadena, Mercado..."/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <FInput label="Presto (suma deuda)" value={f.presto} onChange={up("presto")} type="number" prefix="$"/>
            <FInput label="Pago (resta deuda)" value={f.pago} onChange={up("pago")} type="number" prefix="$"/>
          </div>
          <div style={{background:K.bg,borderRadius:10,padding:"10px 12px",marginTop:4,marginBottom:12,border:`1px solid ${K.border}`}}>
            <div style={{fontSize:9,color:K.muted}}>NUEVO SALDO</div>
            <div style={{fontSize:17,fontWeight:800,color:K.red}}>{fmt(nuevoSaldo)}</div>
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
function Mas({db,onEditIngreso,onEditGasto,onMarcarPagado,onAddInv,onEditInv,onDeleteInv,onAddDeuda,onEditDeuda,onDeleteDeuda}){
  const [v,setV]=useState("clientes");
  const tabs=[["clientes","👥","Clientes"],["hist","📅","Historial"],["inv","📦","Inventario"],["personal","📓","Personal"]];
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>Más</div>
      <div style={{display:"flex",gap:0,marginBottom:16,background:K.card2,borderRadius:12,overflow:"hidden",border:`1px solid ${K.border}`}}>
        {tabs.map(([id,icon,label],i)=>(
          <button key={id} onClick={()=>setV(id)} style={{flex:1,background:v===id?K.card:"transparent",border:"none",color:v===id?K.text:K.muted,padding:"10px 4px",fontSize:10,fontWeight:700,cursor:"pointer",borderRight:i<tabs.length-1?`1px solid ${K.border}`:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{textTransform:"uppercase",letterSpacing:.5,fontSize:9}}>{label}</span>
          </button>
        ))}
      </div>
      {v==="clientes"&&<Clientes db={db} onEditIngreso={onEditIngreso} onMarcarPagado={onMarcarPagado}/>}
      {v==="hist"&&<Historial db={db} onEditIngreso={onEditIngreso} onEditGasto={onEditGasto}/>}
      {v==="inv"&&<Inventario db={db} onAdd={onAddInv} onEdit={onEditInv} onDelete={onDeleteInv}/>}
      {v==="personal"&&<Personal db={db} onAdd={onAddDeuda} onEdit={onEditDeuda} onDelete={onDeleteDeuda}/>}
    </div>
  );
}

// ═══ ROOT ══════════════════════════════════════════════════════
// ═══ LOGIN ════════════════════════════════════════════════════
function LoginScreen({onSuccess}){
  const [clave,setClave]=useState("");
  const [error,setError]=useState(false);
  const intentar=()=>{
    if(clave===CLAVE_ACCESO){
      localStorage.setItem(LS_AUTH_KEY,"1");
      onSuccess();
    }else{
      setError(true);
      setClave("");
    }
  };
  return(
    <div style={{background:K.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,color:K.text,fontFamily:"-apple-system,sans-serif",padding:24}}>
      <span style={{fontSize:56}}>👟</span>
      <div style={{color:K.green,fontWeight:800,fontSize:20}}>Altaclase Bodega</div>
      <div style={{maxWidth:280,width:"100%"}}>
        <input
          type="password"
          value={clave}
          onChange={e=>{setClave(e.target.value);setError(false);}}
          onKeyDown={e=>e.key==="Enter"&&intentar()}
          placeholder="Clave de acceso"
          autoFocus
          style={{width:"100%",background:K.card,border:`1.5px solid ${error?K.red:K.border}`,borderRadius:12,color:K.text,padding:"13px 16px",fontSize:16,outline:"none",boxSizing:"border-box",textAlign:"center"}}
        />
        {error&&<div style={{color:K.red,fontSize:12,textAlign:"center",marginTop:8}}>Clave incorrecta</div>}
        <div style={{marginTop:14}}>
          <Btn label="Entrar" onClick={intentar} dis={!clave}/>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [autenticado,setAutenticado]=useState(()=>localStorage.getItem(LS_AUTH_KEY)==="1");
  const [tab,setTab]=useState("home");
  const [db,setDb]=useState({ingresos:[],gastos:[],inventario:[],clientesResumen:[],clientesEspeciales:[],deudaPersonal:[]});
  const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState(null);
  const [initDone,setInitDone]=useState(false);
  const [initError,setInitError]=useState(null);
  const [lastSync,setLastSync]=useState(null);
  const [editIng,setEditIng]=useState(null);
  const [editGas,setEditGas]=useState(null);
  const intervalRef=useRef(null);

  const flash=(msg,col=K.green)=>{setToast({msg,col});setTimeout(()=>setToast(null),2500);};

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
  const marcarPagado=async(pendientes)=>{
    for(const v of pendientes){
      const actualizado={...v,debe:"NO"};
      await updateRow("INGRESOS",v._row,ingresoToRow(actualizado));
    }
    await loadData(true);
    flash(`✓ ${pendientes.length} pago${pendientes.length!==1?"s":""} registrado${pendientes.length!==1?"s":""}`);
  };

  const NAV=[
    {id:"home",icon:"🏠",label:"Inicio"},
    {id:"nuevo",icon:"➕",label:"Nuevo",col:K.green},
    {id:"mas",icon:"☰",label:"Más"},
  ];

  if(!autenticado){
    return <LoginScreen onSuccess={()=>setAutenticado(true)}/>;
  }

  if(!initDone){
    return(
      <div style={{background:K.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:K.text,fontFamily:"-apple-system,sans-serif"}}>
        <span style={{fontSize:56}}>👟</span>
        <div style={{color:K.green,fontWeight:700,fontSize:18}}>Altaclase Bodega</div>
        <div style={{color:K.muted,fontSize:13}}>Conectando con Google Sheets...</div>
        <div style={{width:40,height:4,background:K.border,borderRadius:2,overflow:"hidden",marginTop:8}}>
          <div style={{width:"60%",height:"100%",background:K.green,borderRadius:2}}/>
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
    <div style={{background:K.bg,minHeight:"100vh",color:K.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",maxWidth:430,margin:"0 auto",paddingBottom:82}}>
      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.col,color:"#000",padding:"8px 20px",borderRadius:20,fontWeight:700,zIndex:9999,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,.5)",whiteSpace:"nowrap"}}>
          {toast.msg}
        </div>
      )}
      <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {tab==="home"&&<Home db={db} onRefresh={()=>loadData(false)} loading={loading} lastSync={lastSync}/>}
        {tab==="nuevo"&&<NuevoMovimiento onSaveIngreso={saveIngreso} onSaveGasto={saveGasto}/>}
        {tab==="mas"&&<Mas db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas} onMarcarPagado={marcarPagado} onAddInv={addInventario} onEditInv={editInventario} onDeleteInv={removeInventario} onAddDeuda={addDeuda} onEditDeuda={editDeuda} onDeleteDeuda={removeDeuda}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(12,12,12,.97)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderTop:`1px solid ${K.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {NAV.map(({id,icon,label,col})=>{
          const active=tab===id;
          return(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"none",border:"none",padding:"10px 0 13px",cursor:"pointer",color:active?(col||K.green):K.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:3,borderTop:`2.5px solid ${active?(col||K.green):"transparent"}`,transition:"all .15s"}}>
              <span style={{fontSize:20}}>{icon}</span>
              <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{label}</span>
            </button>
          );
        })}
      </div>
      {editIng&&<EditIngreso item={editIng} onClose={()=>setEditIng(null)} onSave={updateIngreso} onDelete={removeIngreso}/>}
      {editGas&&<EditGasto item={editGas} onClose={()=>setEditGas(null)} onSave={updateGasto} onDelete={removeGasto}/>}
    </div>
  );
}
