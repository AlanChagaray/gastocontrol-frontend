"use client";
import { useState, useRef, useEffect } from "react";
import { DARK, LIGHT, toYMD } from "@/lib/constants";

const MONTHS_ES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

function fmtDate(d: string) { return new Date(d+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}); }

function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string,React.ReactNode> = {
    cal:         <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    chevLeft:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m15 18-6-6 6-6"/></svg>,
    chevRight:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

export function DatePicker({ value, onChange, dark }: { value:string; onChange:(v:string)=>void; dark:boolean }) {
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