"use client";
// Landing page — copia exacta del demo
import { useState } from "react";
import { useRouter } from "next/navigation";

const DARK_LIGHT = { bg:"#0f1117", card:"#1a1d27", border:"#1e2130", text:"#f1f5f9", muted:"#64748b", label:"#475569", input:"#0d0f16" };

function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string,React.ReactNode> = {
    wallet:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
    shield:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    barChart: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/><line x1="2" x2="22" y1="20" y2="20"/></svg>,
    history:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>,
    plus:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>,
    receipt:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8M16 12H8M12 16H8"/></svg>,
    comida:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
    supermercado:<svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
    servicios:<svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    ocio:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>,
    google:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

function LogoMark({ size="md", onClick }: { size?:"md"|"lg"; onClick?:()=>void }) {
  const s = size==="lg" ? {box:52,ico:24,fs:20,gap:12,r:14} : {box:34,ico:17,fs:15,gap:9,r:10};
  const content = (
    <div style={{display:"flex",alignItems:"center",gap:s.gap}}>
      <div style={{width:s.box,height:s.box,borderRadius:s.r,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(59,130,246,.4)",flexShrink:0}}>
        <Ico name="wallet" size={s.ico} color="white"/>
      </div>
      <span style={{fontWeight:800,fontSize:s.fs,color:"#0f172a",lineHeight:1}}>Gasto<span style={{color:"#3b82f6"}}>Control</span></span>
    </div>
  );
  if (onClick) return <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>{content}</button>;
  return content;
}

function LegalModal({ type, onClose }: { type:"terminos"|"privacidad"; onClose:()=>void }) {
  const isT = type==="terminos";
  return (
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:"100%",maxWidth:640,background:"white",borderRadius:"20px 20px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 -8px 40px rgba(0,0,0,.15)",animation:"sheetUp .25s ease"}}>
        <div style={{padding:"14px 24px 0",flexShrink:0}}>
          <div style={{width:40,height:4,borderRadius:2,background:"#e2e8f0",margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:14,borderBottom:"1px solid #f1f5f9"}}>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:"#eff6ff",marginBottom:6}}>
                <Ico name="shield" size={11} color="#3b82f6"/>
                <span style={{fontSize:10,fontWeight:700,color:"#2563eb",letterSpacing:".05em"}}>Documento legal</span>
              </div>
              <h2 style={{fontSize:17,fontWeight:900,color:"#0f172a",margin:0}}>{isT?"Términos de uso":"Política de privacidad"}</h2>
              <p style={{fontSize:11,color:"#94a3b8",margin:"4px 0 0"}}>Última actualización: Marzo 2025</p>
            </div>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"20px 24px 32px",flex:1}} className="lm">
          {isT ? <>
            <h2>1. Introducción</h2><p>GastoControl es una aplicación web para registrar y visualizar gastos personales. Al acceder o usar este servicio, aceptás los presentes Términos de uso.</p>
            <h2>2. Uso permitido</h2><p>GastoControl está pensado exclusivamente para uso personal. No usar para actividades ilegales o que perjudiquen a terceros.</p>
            <h2>3. Limitación de responsabilidad</h2><p>GastoControl no brinda asesoramiento financiero ni garantiza la exactitud de los análisis. El servicio se provee "tal como está".</p>
            <h2>4. Contacto</h2><p>Consultas: <span style={{color:"#3b82f6",fontWeight:600}}>hola@gastocontrol.app</span></p>
          </> : <>
            <h2>1. Información que recopilamos</h2><p>Nombre, email y gastos ingresados por vos.</p>
            <h2>2. Para qué usamos tus datos</h2><p>Exclusivamente para permitirte registrar y analizar tus gastos.</p>
            <h2>3. No vendemos tus datos</h2><p>Tus datos <strong>no son vendidos ni compartidos con terceros</strong> con fines comerciales.</p>
            <h2>4. Contacto</h2><p>Consultas: <span style={{color:"#3b82f6",fontWeight:600}}>hola@gastocontrol.app</span></p>
          </>}
        </div>
        <div style={{padding:"14px 24px 24px",borderTop:"1px solid #f1f5f9",flexShrink:0}}>
          <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
            Entendido, volver al registro
          </button>
        </div>
      </div>
    </div>
  );
}

const FEATS = [
  {icon:"plus",     color:"#3b82f6",bg:"#eff6ff",title:"Registrá en segundos",          desc:"Agregá un gasto con pocos toques. Sin formularios complicados."},
  {icon:"barChart", color:"#8b5cf6",bg:"#f5f3ff",title:"Visualizá tus categorías",      desc:"Gráficos claros que muestran dónde va tu dinero cada mes."},
  {icon:"history",  color:"#22c55e",bg:"#f0fdf4",title:"Historial por mes",              desc:"Navegá entre meses y compará tu evolución de gastos."},
  {icon:"wallet",   color:"#f97316",bg:"#fff7ed",title:"En cualquier dispositivo",      desc:"Diseño responsivo para celular, tablet y escritorio."},
];

export default function LandingPage() {
  const router = useRouter();
  const [legalModal, setLegalModal] = useState<"terminos"|"privacidad"|null>(null);

  return (
    <div style={{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"white",minHeight:"100vh"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes sheetUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        .lhov:hover{opacity:.88!important} .lsec:hover{background:#f1f5f9!important} .feat:hover{transform:translateY(-4px)!important;box-shadow:0 12px 32px rgba(0,0,0,.1)!important}
      `}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(255,255,255,.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid #e2e8f0",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <LogoMark/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>router.push("/login")}    className="lsec" style={{padding:"9px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"transparent",color:"#374151",fontWeight:700,fontSize:13,cursor:"pointer",transition:"background .15s",fontFamily:"inherit"}}>Iniciar sesión</button>
          <button onClick={()=>router.push("/register")} className="lhov" style={{padding:"9px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 3px 10px rgba(59,130,246,.35)",opacity:1,transition:"opacity .15s",fontFamily:"inherit"}}>Crear cuenta</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"80px 24px 60px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:60,alignItems:"center"}}>
        <div style={{animation:"fadeUp .5s ease"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 12px",borderRadius:20,background:"#eff6ff",border:"1px solid #bfdbfe",marginBottom:20}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#3b82f6"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>MVP · Versión 1.0</span>
          </div>
          <h1 style={{fontSize:46,fontWeight:900,color:"#0f172a",lineHeight:1.1,margin:"0 0 18px"}}>Controlá tus gastos<br/><span style={{color:"#3b82f6"}}>de forma simple.</span></h1>
          <p style={{fontSize:17,color:"#64748b",lineHeight:1.65,margin:"0 0 32px",maxWidth:460}}>Registrá tus gastos diarios, visualizá en qué categorías gastás más y tomá el control de tus finanzas personales.</p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button onClick={()=>router.push("/register")} className="lhov" style={{padding:"14px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 6px 20px rgba(59,130,246,.4)",opacity:1,transition:"opacity .15s",fontFamily:"inherit"}}>Empezar gratis</button>
            <button onClick={()=>router.push("/login")}    className="lsec" style={{padding:"14px 24px",borderRadius:14,border:"1.5px solid #e2e8f0",background:"transparent",color:"#374151",fontWeight:700,fontSize:15,cursor:"pointer",transition:"background .15s",fontFamily:"inherit"}}>Ya tengo cuenta →</button>
          </div>
        </div>
        {/* Hero mock */}
        <div style={{background:"white",borderRadius:18,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,.12)",border:"1px solid #e2e8f0",animation:"fadeUp .6s ease .1s both"}}>
          <div style={{background:"#f1f5f9",padding:"10px 14px",display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid #e2e8f0"}}>
            {["#ef4444","#f59e0b","#22c55e"].map(c=><div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}}/>)}
            <span style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginLeft:4}}>GastoControl · Dashboard</span>
          </div>
          <div style={{padding:16}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:10}}>
              {[{l:"Gastado este mes",v:"$35.320",c:"#3b82f6"},{l:"Balance",v:"$114.680",c:"#22c55e"}].map(k=>(
                <div key={k.l} style={{background:`linear-gradient(135deg,${k.c},${k.c}cc)`,borderRadius:14,padding:"14px 16px",color:"white"}}>
                  <div style={{fontSize:10,fontWeight:700,opacity:.75,textTransform:"uppercase" as const,letterSpacing:".06em"}}>{k.l}</div>
                  <div style={{fontSize:20,fontWeight:900,marginTop:4}}>{k.v}</div>
                </div>
              ))}
            </div>
            {[{cat:"supermercado",name:"Coto",amt:"$7.600",color:"#22c55e",bg:"#f0fdf4"},{cat:"servicios",name:"Edesur",amt:"$12.500",color:"#8b5cf6",bg:"#f5f3ff"},{cat:"comida",name:"McDonald's",amt:"$1.850",color:"#f97316",bg:"#fff7ed"}].map(r=>(
              <div key={r.name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{width:34,height:34,borderRadius:10,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico name={r.cat} size={16} color={r.color}/></div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{r.name}</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{r.cat}</div></div>
                <div style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>{r.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{background:"#f8fafc",padding:"72px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:11,fontWeight:800,color:"#3b82f6",textTransform:"uppercase" as const,letterSpacing:".1em",marginBottom:10}}>Características</div>
            <h2 style={{fontSize:32,fontWeight:900,color:"#0f172a",margin:0}}>Todo lo que necesitás</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20}}>
            {FEATS.map(f=>(
              <div key={f.title} className="feat" style={{background:"white",borderRadius:20,padding:"28px 24px",border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.05)",transition:"transform .2s,box-shadow .2s"}}>
                <div style={{width:48,height:48,borderRadius:14,background:f.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Ico name={f.icon} size={22} color={f.color}/></div>
                <h3 style={{fontSize:15,fontWeight:800,color:"#0f172a",margin:"0 0 8px"}}>{f.title}</h3>
                <p style={{fontSize:13,color:"#64748b",lineHeight:1.6,margin:0}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8,#2563eb)",padding:"72px 24px"}}>
        <div style={{maxWidth:640,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:28,fontWeight:900,color:"white",margin:"0 0 16px"}}>Una herramienta para entender mejor tus finanzas</h2>
          <p style={{fontSize:15,color:"rgba(255,255,255,.8)",lineHeight:1.7,margin:"0 0 28px"}}>GastoControl nació como un proyecto independiente para ayudar a las personas a entender mejor sus gastos diarios. Sin suscripciones, sin complejidades.</p>
          <button onClick={()=>router.push("/register")} className="lhov" style={{padding:"14px 28px",borderRadius:14,border:"none",background:"white",color:"#1d4ed8",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,.2)",opacity:1,transition:"opacity .15s",fontFamily:"inherit"}}>Empezar gratis →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#0f172a",padding:"40px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap" as const,gap:24,marginBottom:28,paddingBottom:24,borderBottom:"1px solid #1e293b"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name="wallet" size={14} color="white"/></div>
                <span style={{fontWeight:800,fontSize:14,color:"white"}}>Gasto<span style={{color:"#60a5fa"}}>Control</span></span>
              </div>
              <p style={{fontSize:12,color:"#64748b",margin:0,lineHeight:1.6}}>Proyecto independiente<br/>Alan Chagaray</p>
            </div>
            <div style={{display:"flex",gap:40,flexWrap:"wrap" as const}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:"#475569",textTransform:"uppercase" as const,letterSpacing:".08em",marginBottom:10}}>Cuenta</div>
                <div style={{display:"flex",flexDirection:"column" as const,gap:7}}>
                  <span onClick={()=>router.push("/login")}    style={{fontSize:13,fontWeight:600,color:"#94a3b8",cursor:"pointer"}}>Iniciar sesión</span>
                  <span onClick={()=>router.push("/register")} style={{fontSize:13,fontWeight:600,color:"#94a3b8",cursor:"pointer"}}>Crear cuenta</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:"#475569",textTransform:"uppercase" as const,letterSpacing:".08em",marginBottom:10}}>Legal</div>
                <div style={{display:"flex",flexDirection:"column" as const,gap:7}}>
                  <span onClick={()=>setLegalModal("terminos")}   style={{fontSize:13,fontWeight:600,color:"#94a3b8",cursor:"pointer"}}>Términos de uso</span>
                  <span onClick={()=>setLegalModal("privacidad")} style={{fontSize:13,fontWeight:600,color:"#94a3b8",cursor:"pointer"}}>Política de privacidad</span>
                </div>
              </div>
            </div>
          </div>
          <p style={{fontSize:12,color:"#334155",margin:0,textAlign:"center"}}>© 2025 GastoControl · Proyecto independiente · Todos los derechos reservados</p>
        </div>
      </footer>
      {legalModal && <LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
    </div>
  );
}
