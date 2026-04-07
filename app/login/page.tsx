"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import type { ApiError } from "@/lib/api";

function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string,React.ReactNode> = {
    wallet:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
    mail:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    lock:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    eye:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,
    google:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

function AuthInput({ label, type="text", placeholder, value, onChange, icon }: { label:string; type?:string; placeholder?:string; value:string; onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void; icon:string }) {
  const [showPw, setShowPw] = useState(false);
  const realType = type==="password" ? (showPw?"text":"password") : type;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:12,fontWeight:700,color:"#475569",letterSpacing:"0.04em"}}>{label}</label>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ico name={icon} size={15} color="#94a3b8"/></div>
        <input type={realType} placeholder={placeholder} value={value} onChange={onChange}
          style={{width:"100%",boxSizing:"border-box",paddingLeft:38,paddingRight:type==="password"?52:14,paddingTop:12,paddingBottom:12,border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,color:"#0f172a",background:"#f8fafc",outline:"none",transition:"border-color .15s",fontFamily:"inherit"}}
          onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
        {type==="password" && <button type="button" onClick={()=>setShowPw(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",padding:2}}><Ico name={showPw?"eyeOff":"eye"} size={17} color="#94a3b8"/></button>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]   = useState("");
  const [pw,    setPw]      = useState("");
  const [err,   setErr]     = useState("");
  const [loading,setLoading]= useState(false);

  const handleSubmit = async () => {
    if (!email||!pw) { setErr("Completá todos los campos."); return; }
    setLoading(true); setErr("");
    try {
      const { token, user } = await authService.login({ email, password: pw });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/dashboard");
    } catch(e: unknown) {
      const err = e as ApiError;
      setErr(err.status===401 ? "Email o contraseña incorrectos." : err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#f0f6ff 0%,#f1f5f9 60%,#fdf4ff 100%)",padding:"24px 16px"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <button onClick={()=>router.push("/")} style={{background:"none",border:"none",cursor:"pointer",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(59,130,246,.4)"}}><Ico name="wallet" size={24} color="white"/></div>
          <span style={{fontWeight:800,fontSize:20,color:"#0f172a"}}>Gasto<span style={{color:"#3b82f6"}}>Control</span></span>
        </div>
      </button>
      <div style={{width:"100%",maxWidth:420,background:"white",borderRadius:24,padding:"36px 32px",boxShadow:"0 8px 40px rgba(0,0,0,.1)",animation:"fadeUp .3s ease"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:900,color:"#0f172a",margin:0}}>Bienvenido de vuelta</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"6px 0 0"}}>Iniciá sesión para continuar</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <button style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"13px",borderRadius:14,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontWeight:700,fontSize:14,color:"#374151",boxShadow:"0 1px 3px rgba(0,0,0,.07)",fontFamily:"inherit"}}><Ico name="google" size={18}/> Continuar con Google</button>
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
            <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
            <span style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>o continuá con email</span>
            <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
          </div>
          <AuthInput label="Email"      type="email"    placeholder="tu@email.com" icon="mail" value={email} onChange={e=>setEmail(e.target.value)}/>
          <AuthInput label="Contraseña" type="password" placeholder="••••••••"    icon="lock" value={pw}    onChange={e=>setPw(e.target.value)}/>
          {err && <p style={{fontSize:12,color:"#ef4444",fontWeight:600,margin:0}}>⚠ {err}</p>}
          <div style={{textAlign:"right",marginTop:-6}}><span style={{fontSize:12,color:"#3b82f6",fontWeight:700,cursor:"pointer"}}>¿Olvidaste tu contraseña?</span></div>
          <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:800,fontSize:15,cursor:loading?"wait":"pointer",boxShadow:"0 4px 16px rgba(59,130,246,.4)",opacity:loading?.7:1,fontFamily:"inherit"}}>
            {loading?"Ingresando...":"Iniciar sesión"}
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:13,color:"#64748b",marginTop:22,marginBottom:0}}>
          ¿No tenés cuenta?{" "}<span onClick={()=>router.push("/register")} style={{color:"#3b82f6",fontWeight:700,cursor:"pointer"}}>Crear cuenta</span>
        </p>
      </div>
    </div>
  );
}
