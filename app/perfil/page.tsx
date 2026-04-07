"use client";
import { useState, useEffect } from "react";
import { useApp } from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { DARK, LIGHT, fmt, currentMonthKey } from "@/lib/constants";
import { authService, usersService } from "@/lib/services";
import type { UserResponse, MonthlyIncomeResponse } from "@/types/api";
import type { ApiError } from "@/lib/api";
import { User, Mail, Lock, Shield, LogOut, Pencil, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

function PwInput({ field, label, placeholder, pw, setPw, showPw, setShowPw, t }: { field:string; label:string; placeholder:string; pw:Record<string,string>; setPw:(p:Record<string,string>)=>void; showPw:Record<string,boolean>; setShowPw:(p:Record<string,boolean>)=>void; t:typeof LIGHT }) {
  const match = field==="confirm" && pw.next && pw.confirm && pw.next!==pw.confirm;
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:t.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{label}</div>
      <div style={{position:"relative"}}>
        <input type={showPw[field]?"text":"password"} placeholder={placeholder} value={pw[field]||""} onChange={e=>setPw({...pw,[field]:e.target.value})}
          style={{width:"100%",boxSizing:"border-box",background:t.input,border:`2px solid ${match?"#ef4444":t.border}`,borderRadius:12,padding:"11px 40px 11px 14px",fontSize:14,color:t.text,outline:"none",transition:"border-color .15s",fontFamily:"inherit"}}/>
        <button type="button" onClick={()=>setShowPw({...showPw,[field]:!showPw[field]})} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",padding:2}}>
          {showPw[field] ? <EyeOff size={17} color="#64748b"/> : <Eye size={17} color="#64748b"/>}
        </button>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const router  = useRouter();
  const { dark, wide, token, expenses } = useApp();
  const t   = dark ? DARK : LIGHT;
  const pad = wide ? "28px" : "16px";

  const [profile,      setProfile]      = useState<UserResponse|null>(null);
  const [income,       setIncome]       = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [showPwSection,setShowPwSection]= useState(false);
  const [pw,           setPw]           = useState<Record<string,string>>({current:"",next:"",confirm:""});
  const [showPw,       setShowPw]       = useState<Record<string,boolean>>({current:false,next:false,confirm:false});
  const [pwSaved,      setPwSaved]      = useState(false);

  useEffect(()=>{
    if(!token)return;
    const month = currentMonthKey();
    Promise.all([
      usersService.getProfile(token).then(p=>{ setProfile(p[0]); }),
      usersService.getIncome(month, token).then(i => setIncome(Number(i.amount))).catch(() => setIncome(0))
    ]).finally(()=>setLoading(false));
  },[token]);

  if(loading) return <div style={{flex:1,padding:pad,display:"flex",flexDirection:"column",gap:14}}>{[1,2,3].map(i=><div key={i} style={{height:80,borderRadius:20,background:t.card,border:`1px solid ${t.border}`,animation:"pulse 1.5s infinite"}}/>)}</div>;
  if(!profile) return null;

  const isGoogle   = profile.provider==="google";
  const totalSpent = expenses.reduce((a,e)=>a+Number(e.amount),0);
  const totalMonths= [...new Set(expenses.map(e=>e.expense_date.slice(0,7)))].length;
  const joined     = new Date(profile.created_at).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});
  const initials   = `${profile.first_name}${profile.last_name}`.toUpperCase();

  const pwValid = pw.next.length>=6 && pw.next===pw.confirm;

  const saveName = async () => {
    if(!nameVal.trim())return;
    const [first_name,...rest] = nameVal.trim().split(" ");
    const last_name = rest.join(" ")||profile.last_name;
    try { const updated=await usersService.updateProfile({first_name,last_name},token); setProfile(updated); setNameSaved(true); setEditName(false); setTimeout(()=>setNameSaved(false),2000); } catch{}
  };

  const savePw = async () => {
    if(!pwValid) return;
    try {
      await usersService.changePassword({current_password:pw.current||"",password:pw.next,password_confirmation:pw.confirm},token);
      setPwSaved(true); setPw({current:"",next:"",confirm:""}); setShowPwSection(false);
      setTimeout(()=>setPwSaved(false),2500);
    } catch(e:unknown){ alert((e as ApiError)?.message||"Error al cambiar contraseña"); }
  };

  const handleLogout = async () => {
    try { await authService.logout(token); } finally { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/"); }
  };

  const Row = ({icon,label,value}:{icon:string;label:string;value:string}) => {
    const IconComponent = icon === "user" ? User : icon === "mail" ? Mail : icon === "lock" ? Lock : Shield;
    return (
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:`1px solid ${t.border}`}}>
        <div style={{width:36,height:36,borderRadius:10,background:dark?"rgba(255,255,255,.05)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IconComponent size={16} color={t.muted}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:t.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
          <div style={{fontSize:14,fontWeight:600,color:t.text,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{flex:1,padding:pad,paddingBottom:"28px",overflowY:"auto",display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Mi cuenta</div>
        <div style={{fontSize:wide?26:22,fontWeight:900,color:t.text,marginTop:2}}>Perfil</div>
      </div>

      {/* Avatar card */}
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,padding:"24px",display:"flex",alignItems:"center",gap:18}}>
        <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 6px 20px rgba(59,130,246,.35)"}}>
          {/* <span style={{fontSize:22,fontWeight:900,color:"white"}}>{initials}</span> */}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:18,fontWeight:900,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.first_name + ' ' + profile.last_name }</div>
          <div style={{fontSize:13,color:t.muted,marginTop:3}}>{profile.email}</div>
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:dark?"rgba(255,255,255,.06)":"#f1f5f9",fontSize:11,fontWeight:700,color:t.muted,border:`1px solid ${t.border}`}}>
              {isGoogle?<><svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google</>:<><Mail size={12} color={t.muted}/> Email</>}
            </span>
            <span style={{fontSize:11,color:t.muted}}>Desde {joined}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Total registrado</div>
          <div style={{fontSize:20,fontWeight:900,color:t.text,fontVariantNumeric:"tabular-nums"}}>{fmt(totalSpent)}</div>
          <div style={{fontSize:11,color:t.muted,marginTop:2}}>{expenses.length} gastos</div>
        </div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Meses activos</div>
          <div style={{fontSize:20,fontWeight:900,color:t.text}}>{totalMonths}</div>
          <div style={{fontSize:11,color:t.muted,marginTop:2}}>meses con registros</div>
        </div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Ingreso mensual</div>
          <div style={{fontSize:20,fontWeight:900,color:t.text,fontVariantNumeric:"tabular-nums"}}>{fmt(income)}</div>
          <div style={{fontSize:11,color:t.muted,marginTop:2}}>este mes</div>
        </div>
      </div>

      {/* Info */}
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,padding:"0 20px"}}>
        <div style={{padding:"14px 0",borderBottom:`1px solid ${t.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:36,height:36,borderRadius:10,background:dark?"rgba(255,255,255,.05)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><User size={16} color={t.muted}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:t.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Nombre</div>
              <div style={{fontSize:14,fontWeight:600,color:t.text,marginTop:2}}>{profile.full_name}</div>
            </div>
          </div>
        </div>
        <Row icon="mail"   label="Email"            value={profile.email}/>
        <Row icon="shield" label="Método de acceso" value={isGoogle?"Google (OAuth)":"Email y contraseña"}/>
      </div>

      {/* Password section */}
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,overflow:"hidden"}}>
        <button onClick={()=>setShowPwSection(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px 20px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <div style={{width:36,height:36,borderRadius:10,background:dark?"rgba(255,255,255,.05)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Lock size={16} color={isGoogle?"#f59e0b":t.muted}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:t.text}}>Cambiar contraseña</div>
            <div style={{fontSize:11,color:t.muted,marginTop:2}}>{isGoogle?"Tu cuenta usa Google — podés establecer una contraseña adicional":"Actualizá tu contraseña de acceso"}</div>
          </div>
          {showPwSection ? <ChevronLeft size={15} color={t.muted}/> : <ChevronRight size={15} color={t.muted}/>}
        </button>
        {showPwSection&&(
          <div style={{padding:"0 20px 16px"}}>
            {isGoogle&&<div style={{borderRadius:14,padding:"14px 16px",background:dark?"rgba(251,191,36,.08)":"#fffbeb",border:"1px solid #fde68a",marginBottom:16}}><div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:4}}>⚠ Cuenta vinculada con Google</div><div style={{fontSize:12,color:"#92400e",lineHeight:1.5}}>Si establecés una contraseña manual, podrás iniciar sesión también con email + contraseña.</div></div>}
            {!isGoogle&&<PwInput field="current" label="Contraseña actual" placeholder="••••••••" pw={pw} setPw={setPw} showPw={showPw} setShowPw={setShowPw} t={t}/>}
            <PwInput field="next"    label="Nueva contraseña"    placeholder="Mínimo 6 caracteres"       pw={pw} setPw={setPw} showPw={showPw} setShowPw={setShowPw} t={t}/>
            <PwInput field="confirm" label="Confirmar contraseña" placeholder="Repetí la nueva contraseña" pw={pw} setPw={setPw} showPw={showPw} setShowPw={setShowPw} t={t}/>
            {pw.next&&pw.confirm&&pw.next!==pw.confirm&&<div style={{fontSize:11,color:"#ef4444",fontWeight:600,marginTop:-8,marginBottom:8}}>⚠ Las contraseñas no coinciden</div>}
            {pw.next.length>0&&pw.next.length<6&&<div style={{fontSize:11,color:"#f59e0b",fontWeight:600,marginBottom:8}}>Mínimo 6 caracteres</div>}
            <button onClick={savePw} disabled={!pwValid||(!isGoogle&&!pw.current)} style={{width:"100%",marginTop:4,padding:"13px",borderRadius:12,border:"none",background:(pwValid&&(isGoogle||pw.current))?"linear-gradient(135deg,#3b82f6,#1d4ed8)":(dark?"#1e2130":"#e8edf2"),color:(pwValid&&(isGoogle||pw.current))?"white":t.muted,fontWeight:800,fontSize:14,cursor:(pwValid&&(isGoogle||pw.current))?"pointer":"not-allowed",transition:"all .2s",fontFamily:"inherit"}}>
              {isGoogle?"Establecer contraseña":"Guardar nueva contraseña"}
            </button>
          </div>
        )}
        {pwSaved&&<div style={{padding:"0 20px 16px",fontSize:12,color:"#22c55e",fontWeight:700}}>✓ Contraseña actualizada correctamente</div>}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",borderRadius:16,border:`1px solid ${dark?"#3f1a1a":"#fee2e2"}`,background:dark?"rgba(239,68,68,.08)":"#fef2f2",color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}}>
        <LogOut size={16} color="#ef4444"/> Cerrar sesión
      </button>
    </div>
  );
}
