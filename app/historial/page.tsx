"use client";
import { useApp } from "../dashboard/layout";
import { DARK, LIGHT, fmt, keyLabel, CATEGORIES } from "@/lib/constants";
import { expensesService } from "@/lib/services";

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
    receipt:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8M16 12H8M12 16H8"/></svg>,
    chevLeft:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m15 18-6-6 6-6"/></svg>,
    chevRight:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m9 18 6-6-6-6"/></svg>,
    x:           <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

const NOW_KEY = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; })();

export default function HistorialPage() {
  const { dark, wide, token, selectedMonth, setSelectedMonth, expenses, setExpenses, loadingExp, errorExp, refetchExp } = useApp();
  const t   = dark ? DARK : LIGHT;
  const pad = wide ? "28px" : "16px";

  const monthExpenses = expenses.filter(e => e.expense_date.startsWith(selectedMonth));
  const total         = monthExpenses.reduce((a,e) => a+Number(e.amount), 0);

  const availableMonths = [...new Set(expenses.map(e=>e.expense_date.slice(0,7)))].sort();
  if (!availableMonths.includes(selectedMonth)) availableMonths.push(selectedMonth);
  const sortedKeys = [...availableMonths].sort();
  const idx     = sortedKeys.indexOf(selectedMonth);
  const canPrev = idx > 0;
  const canNext = idx < sortedKeys.length - 1;

  const grouped: Record<string, typeof monthExpenses> = {};
  monthExpenses.forEach(e => { if(!grouped[e.expense_date]) grouped[e.expense_date]=[]; grouped[e.expense_date].push(e); });
  const dates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  const handleRemove = async (id: number) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    try {
      await expensesService.remove(id, token);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch { /* ignorar */ }
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
                const cat = CATEGORIES.find(c=>c.id===exp.category.icon)||CATEGORIES[6];
                return (
                  <div key={exp.id} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,.04)"}}>
                    <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:dark?cat.darkBg:cat.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name={cat.id} size={19} color={cat.color}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.merchant||exp.category.name}</div>
                      <div style={{fontSize:11,color:t.muted,marginTop:2,fontWeight:600}}>{exp.category.name}</div>
                    </div>
                    <div style={{fontWeight:800,fontSize:14,color:t.text,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(exp.amount))}</div>
                    <button onClick={()=>handleRemove(exp.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center",opacity:.4,transition:"opacity .15s"}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".4"}><Ico name="x" size={14} color="#ef4444"/></button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
