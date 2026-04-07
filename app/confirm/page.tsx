"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
function ConfirmContent() {
  const router = useRouter();
  const email  = useSearchParams().get("email") ?? "tu@email.com";
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#f0f6ff,#f1f5f9,#fdf4ff)",padding:"24px 16px"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <button onClick={()=>router.push("/")} style={{background:"none",border:"none",cursor:"pointer",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(59,130,246,.4)"}}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <span style={{fontWeight:800,fontSize:20,color:"#0f172a"}}>Gasto<span style={{color:"#3b82f6"}}>Control</span></span>
        </div>
      </button>
      <div style={{width:"100%",maxWidth:420,background:"white",borderRadius:24,padding:"44px 32px",boxShadow:"0 8px 40px rgba(0,0,0,.1)",textAlign:"center",animation:"fadeUp .3s ease"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#dbeafe,#eff6ff)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:"0 6px 20px rgba(59,130,246,.2)"}}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <h1 style={{fontSize:22,fontWeight:900,color:"#0f172a",margin:"0 0 10px"}}>Revisá tu correo</h1>
        <p style={{fontSize:14,color:"#64748b",lineHeight:1.6,margin:"0 0 6px"}}>Te enviamos un link de confirmación a:</p>
        <p style={{fontSize:14,fontWeight:700,color:"#3b82f6",margin:"0 0 24px",wordBreak:"break-all"}}>{email}</p>
        <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,margin:"0 0 28px"}}>Hacé click en el enlace del correo para activar tu cuenta. Si no lo ves, revisá la carpeta de spam.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>router.push("/login")} style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(59,130,246,.35)",fontFamily:"inherit"}}>Volver al inicio de sesión</button>
          <button style={{width:"100%",padding:"13px",borderRadius:14,border:"1.5px solid #e2e8f0",background:"transparent",color:"#64748b",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Reenviar correo</button>
        </div>
      </div>
    </div>
  );
}
export default function ConfirmPage() { return <Suspense><ConfirmContent/></Suspense>; }
