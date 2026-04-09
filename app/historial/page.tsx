"use client";
import { useState } from "react";
import { useApp } from "../dashboard/layout";
import { DARK, LIGHT, fmt, keyLabel, CATEGORIES } from "@/lib/constants";
import { expensesService } from "@/lib/services";
import { getLucideIcon } from "@/lib/lucide-icons";

function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string,React.ReactNode> = {
    receipt:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8M16 12H8M12 16H8"/></svg>,
    chevLeft:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m15 18-6-6 6-6"/></svg>,
    chevRight:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m9 18 6-6-6-6"/></svg>,
    x:           <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

function CategoryIcon({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const Icon = getLucideIcon(name);
  return <Icon size={size} color={color} />;
}

const NOW_KEY = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; })();

export default function HistorialPage() {
  const { dark, wide, token, selectedMonth, setSelectedMonth, expenses, setExpenses, loadingExp, errorExp, refetchExp } = useApp();
  const t   = dark ? DARK : LIGHT;
  const pad = wide ? "28px" : "16px";

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number|null>(null);
  const [deleting, setDeleting] = useState(false);

  const monthExpenses = expenses.filter(e => e.expense_date.startsWith(selectedMonth));
  const total         = monthExpenses.reduce((a,e) => a+Number(e.amount), 0);

  const availableMonthsSet = new Set(expenses.map(e=>e.expense_date.slice(0,7)));
  const availableMonths = Array.from(availableMonthsSet).sort();
  if (!availableMonths.includes(selectedMonth)) availableMonths.push(selectedMonth);
  const sortedKeys = [...availableMonths].sort();
  const idx     = sortedKeys.indexOf(selectedMonth);
  const canPrev = idx > 0;
  const canNext = idx < sortedKeys.length - 1;

  const grouped: Record<string, typeof monthExpenses> = {};
  monthExpenses.forEach(e => { if(!grouped[e.expense_date]) grouped[e.expense_date]=[]; grouped[e.expense_date].push(e); });
  const dates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  const openDeleteModal = (id: number) => {
    setExpenseToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setExpenseToDelete(null);
    setDeleting(false);
  };

  const handleRemove = async () => {
    if (!expenseToDelete || !token) return;
    setDeleting(true);
    try {
      await expensesService.remove(expenseToDelete, token);
      setExpenses(prev => prev.filter(e => e.id !== expenseToDelete));
      closeDeleteModal();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div style={{flex:1,padding:pad,paddingBottom:"24px",overflowY:"auto",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Registros</div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>canPrev&&setSelectedMonth(sortedKeys[idx-1])} disabled={!canPrev} style={{width:32,height:32,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:canPrev?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",opacity:canPrev?1:.3}}><Ico name="chevLeft" size={15} color={t.text}/></button>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:wide?22:18,fontWeight:900,color:t.text}}>{keyLabel(selectedMonth)}</div></div>
          <button onClick={()=>canNext&&setSelectedMonth(sortedKeys[idx+1])} disabled={!canNext} style={{width:32,height:32,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:canNext?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",opacity:canNext?1:.3}}><Ico name="chevRight" size={15} color={t.text}/></button>
          {selectedMonth!==NOW_KEY&&<button onClick={()=>setSelectedMonth(NOW_KEY)} style={{padding:"5px 12px",borderRadius:20,border:"none",background:"#3b82f6",color:"white",fontSize:11,fontWeight:700,cursor:"pointer"}}>Mes actual</button>}
        </div>
      </div>

      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:dark?"#172554":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico name="receipt" size={18} color="#3b82f6"/></div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:t.muted}}>{monthExpenses.length} transacciones · {keyLabel(selectedMonth)}</div>
          <div style={{fontSize:20,fontWeight:900,color:t.text,fontVariantNumeric:"tabular-nums"}}>{fmt(total)}</div>
        </div>
      </div>

      {loadingExp && <div style={{display:"flex",flexDirection:"column",gap:8}}>{[1,2,3,4].map(i=><div key={i} style={{height:60,borderRadius:14,background:t.card,border:`1px solid ${t.border}`,animation:"pulse 1.5s infinite"}}/>)}</div>}
      {errorExp && <div style={{background:dark?"rgba(239,68,68,.08)":"#fef2f2",border:"1px solid #fee2e2",borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:600,color:"#ef4444"}}>⚠ {errorExp}</span><button onClick={refetchExp} style={{fontSize:13,fontWeight:700,color:"#ef4444",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>Reintentar</button></div>}

      {!loadingExp && !errorExp && monthExpenses.length===0 && (
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"40px",textAlign:"center"}}><Ico name="receipt" size={32} color={t.muted}/><div style={{fontSize:14,color:t.muted,marginTop:12,fontWeight:600}}>Sin gastos en {keyLabel(selectedMonth)}</div></div>
      )}

      {dates.map(date => {
        const items    = grouped[date];
        const dayTotal = items.reduce((a,e)=>a+Number(e.amount),0);
        const fmtG     = new Date(date+"T12:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
        return (
          <div key={date}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"capitalize"}}>{fmtG}</span>
              <span style={{fontSize:11,fontWeight:700,color:t.muted,fontVariantNumeric:"tabular-nums"}}>{fmt(dayTotal)}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {items.map(exp => {
                return (
                  <div key={exp.id} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,.04)"}}>
                    <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",display:"flex",alignItems:"center",justifyContent:"center"}}><CategoryIcon name={exp.category.icon} size={19} color={exp.category.color}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.merchant||exp.category.name}</div>
                      <div style={{fontSize:11,color:t.muted,marginTop:2,fontWeight:600}}>{exp.category.name}</div>
                    </div>
                    <div style={{fontWeight:800,fontSize:14,color:t.text,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(exp.amount))}</div>
                    <button onClick={()=>openDeleteModal(exp.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center",opacity:.4,transition:"opacity .15s"}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".4"}><CategoryIcon name="trash-2" size={14} color="#ef4444"/></button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {deleteModalOpen && (
        <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,.54)",padding:16}}>
          <div style={{width:"min(400px,100%)",background:t.card,border:`1px solid ${t.border}`,borderRadius:24,boxShadow:"0 28px 80px rgba(15,23,42,.22)",padding:24,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:18}}>
              <div>
                <div style={{fontSize:18,fontWeight:900,color:t.text}}>Eliminar gasto</div>
                <div style={{fontSize:13,color:t.muted,marginTop:6}}>¿Estás seguro de que querés eliminar este gasto? Esta acción no se puede deshacer.</div>
              </div>
              <button type="button" onClick={closeDeleteModal} style={{width:38,height:38,borderRadius:12,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Ico name="x" size={18} color={t.muted}/></button>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button type="button" onClick={closeDeleteModal} disabled={deleting} style={{flex:1,padding:"14px 16px",borderRadius:16,border:`1px solid ${t.border}`,background:"transparent",color:t.muted,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
              <button type="button" onClick={handleRemove} disabled={deleting} style={{flex:1,padding:"14px 16px",borderRadius:16,border:"none",background:"#ef4444",color:"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{deleting ? "Eliminando..." : "Eliminar gasto"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
