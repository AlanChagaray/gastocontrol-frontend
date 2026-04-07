"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { DARK, LIGHT, toYMD } from "@/lib/constants";
import { expensesService, categoriesService } from "@/lib/services";
import type { CategoryResponse } from "@/types/api";

const MONTHS_ES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
function fmtDate(d: string) { return new Date(d+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}); }

function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string,React.ReactNode> = {
    comida:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
    supermercado:<svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
    transporte:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M8 6v6M15 6v6M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>,
    servicios:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    ocio:        <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>,
    salud:       <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    otros:       <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41Z"/><circle cx="7" cy="7" r="1.5" fill={color} stroke="none"/></svg>,
    check:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
    cal:         <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    chevLeft:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m15 18-6-6 6-6"/></svg>,
    chevRight:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

function DatePicker({ value, onChange, dark }: { value:string; onChange:(v:string)=>void; dark:boolean }) {
  const t   = dark ? DARK : LIGHT;
  const [open,setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ini = value ? new Date(value+"T12:00:00") : new Date();
  const [vm,setVm] = useState(ini.getMonth());
  const [vy,setVy] = useState(ini.getFullYear());
  useEffect(()=>{ const fn=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false); }; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[]);
  const first=new Date(vy,vm,1).getDay(); const days=new Date(vy,vm+1,0).getDate();
  const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)];
  const isSel=(d:number|null)=>d&&value===`${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isTod=(d:number|null)=>{ const n=new Date(); return d===n.getDate()&&vm===n.getMonth()&&vy===n.getFullYear(); };
  const prevM=()=>vm===0?(setVm(11),setVy(y=>y-1)):setVm(m=>m-1);
  const nextM=()=>vm===11?(setVm(0),setVy(y=>y+1)):setVm(m=>m+1);
  const pick=(d:number|null)=>{ if(!d)return; onChange(`${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`); setOpen(false); };
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:t.input,border:`2px solid ${open?"#3b82f6":t.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",color:t.text,fontSize:14,fontWeight:600,transition:"border-color .15s",fontFamily:"inherit"}}>
        <Ico name="cal" size={15} color={open?"#3b82f6":t.muted}/>
        <span style={{flex:1,textAlign:"left"}}>{value?fmtDate(value):"Seleccionar fecha"}</span>
        <span style={{fontSize:11,color:t.muted,fontWeight:700}}>{MONTHS_ES[vm].slice(0,3)} {vy}</span>
        <Ico name={open?"chevLeft":"chevRight"} size={13} color={t.muted}/>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,zIndex:300,background:t.card,border:`1px solid ${t.border}`,borderRadius:18,boxShadow:"0 20px 48px rgba(0,0,0,.22)",padding:"16px",animation:"dpIn .15s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={prevM} style={{width:30,height:30,borderRadius:9,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name="chevLeft" size={14} color={t.text}/></button>
            <span style={{fontWeight:800,fontSize:13,color:t.text}}>{MONTHS_ES[vm]} {vy}</span>
            <button onClick={nextM} style={{width:30,height:30,borderRadius:9,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name="chevRight" size={14} color={t.text}/></button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:800,color:t.muted,padding:"3px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {cells.map((d,i)=>(
              <button key={i} onClick={()=>pick(d)} disabled={!d} className={d&&!isSel(d)?"dpd":""} style={{width:"100%",aspectRatio:"1",borderRadius:8,border:"none",background:isSel(d)?"#3b82f6":isTod(d)?(dark?"#1e3a5f":"#dbeafe"):"transparent",color:isSel(d)?"white":isTod(d)?"#2563eb":d?t.text:"transparent",fontWeight:isSel(d)||isTod(d)?800:400,fontSize:12,cursor:d?"pointer":"default",outline:"none",transition:"all .1s",fontFamily:"inherit"}}>
                {d||""}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${t.border}`}}>
            {[{l:"Hoy",d:toYMD(new Date())},{l:"Ayer",d:toYMD(new Date(Date.now()-864e5))}].map(({l,d})=>(
              <button key={l} className="dpq" onClick={()=>{onChange(d);setOpen(false);}} style={{flex:1,padding:"7px",borderRadius:9,border:`1px solid ${t.border}`,background:"transparent",color:t.muted,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .1s",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgregarPage() {
  const router = useRouter();
  const { dark, wide, token, setExpenses, setSelectedMonth } = useApp();
  const t   = dark ? DARK : LIGHT;
  const pad = wide ? "28px" : "16px";

  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState<CategoryResponse|null>(null);
  const [merchant, setMerchant] = useState("");
  const [date,     setDate]     = useState(toYMD(new Date()));
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    categoriesService.getCategories(token)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));
  }, [token]);

  const raw      = amount.replace(/\D/g,"");
  const display  = raw ? Number(raw).toLocaleString("es-AR") : "";
  const isValid  = Number(raw)>0 && category!==null;
  const btnLabel = !Number(raw)?"Ingresá un monto para continuar":!category?"Seleccioná una categoría":"Guardar gasto";

  const handleSave = async () => {
    if (!isValid || !category) return;
    setLoading(true);
    try {
      const created = await expensesService.create({
        amount: Number(raw),
        category_id: category.id,
        merchant: merchant || category.name,
        expense_date: date,
      }, token);
      setExpenses(prev => [created, ...prev]);
      setSelectedMonth(date.slice(0,7));
      setDone(true);
      setTimeout(()=>{ setDone(false); router.push("/dashboard"); }, 1300);
    } catch { setLoading(false); }
  };

  if (done) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:40}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:dark?"#052e16":"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name="check" size={40} color="#22c55e"/></div>
      <div style={{fontSize:20,fontWeight:800,color:t.text}}>¡Gasto registrado!</div>
      <div style={{fontSize:13,color:t.muted}}>Volviendo al inicio...</div>
    </div>
  );

  return (
    <div style={{flex:1,padding:pad,paddingBottom:"24px",overflowY:"auto",display:"flex",flexDirection:"column",gap:18}}>
      <div>
        <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Nuevo registro</div>
        <div style={{fontSize:wide?26:22,fontWeight:900,color:t.text,marginTop:2}}>Agregar gasto</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:wide?"1fr 1fr":"1fr",gap:16,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"18px"}}>
            <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>¿Cuánto gastaste?</div>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:24,fontWeight:800,color:t.muted}}>$</span>
              <input type="text" inputMode="numeric" placeholder="0" autoFocus value={display} onChange={e=>setAmount(e.target.value.replace(/\D/g,""))}
                style={{width:"100%",boxSizing:"border-box",background:t.input,border:`2px solid ${Number(raw)>0?"#3b82f6":t.border}`,borderRadius:14,paddingLeft:46,paddingRight:14,paddingTop:16,paddingBottom:16,fontSize:30,fontWeight:900,color:t.text,outline:"none",fontVariantNumeric:"tabular-nums",transition:"border-color .15s",fontFamily:"inherit"}}/>
            </div>
            {raw!==""&&Number(raw)===0&&<div style={{fontSize:11,color:"#ef4444",marginTop:8,fontWeight:600}}>⚠ El monto debe ser mayor a $0</div>}
          </div>
          <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"18px",display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Comercio (opcional)</div>
              <input type="text" placeholder="Nombre del comercio..." value={merchant} onChange={e=>setMerchant(e.target.value)}
                style={{width:"100%",boxSizing:"border-box",background:t.input,border:`2px solid ${t.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:t.text,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Fecha</div>
              <DatePicker value={date} onChange={setDate} dark={dark}/>
            </div>
          </div>
        </div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"18px"}}>
          <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Categoría</div>
          {categoriesLoading ? (
            <div style={{textAlign:"center",padding:"20px",color:t.muted}}>Cargando categorías...</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:`repeat(${wide?6:3},1fr)`,gap:8}}>
              {categories.map(cat=>{
                const sel=category?.id===cat.id;
                return (
                  <button key={cat.id} onClick={()=>setCategory(cat)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 4px",borderRadius:14,border:`2px solid ${sel?cat.color+"60":t.border}`,background:sel?cat.color+"18":t.card,cursor:"pointer",transition:"all .14s",transform:sel?"scale(1.05)":"scale(1)",boxShadow:sel?`0 4px 12px ${cat.color}30`:"none",fontFamily:"inherit"}}>
                    <div style={{width:38,height:38,borderRadius:11,background:sel?cat.color+"25":(dark?"rgba(255,255,255,.05)":"#f1f5f9"),display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name={cat.icon} size={18} color={sel?cat.color:t.muted}/></div>
                    <span style={{fontSize:10,fontWeight:sel?800:600,color:sel?cat.color:t.label,whiteSpace:"nowrap"}}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <button onClick={handleSave} disabled={!isValid||loading} style={{padding:"16px",borderRadius:16,border:"none",cursor:isValid?"pointer":"not-allowed",background:isValid?"linear-gradient(135deg,#3b82f6,#1d4ed8)":(dark?"#1e2130":"#e8edf2"),color:isValid?"white":t.muted,fontSize:15,fontWeight:800,opacity:isValid?1:.5,boxShadow:isValid?"0 4px 16px rgba(59,130,246,.4)":"none",transition:"all .2s",fontFamily:"inherit"}}>
        {loading?"Guardando...":btnLabel}
      </button>
    </div>
  );
}
