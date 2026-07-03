"use client";
/**
 * Dashboard — replica exacta del DashboardPage del demo
 * Lee estado desde AppContext (layout.tsx)
 */
import { useState, useEffect } from "react";
import { useApp } from "./layout";
import { DARK, LIGHT, fmt, keyLabel } from "@/lib/constants";
import { getLucideIcon } from "@/lib/lucide-icons";
import { expensesService, categoriesService } from "@/lib/services";
import type { ExpenseResponse, CategoryResponse } from "@/types/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Clock, TrendingUp, TrendingDown, Pencil, Receipt, BarChart as LucideBarChart, ShoppingCart, Truck, Wrench, UtensilsCrossed, Star, HeartPulse, MoreHorizontal, X } from "lucide-react";

const MONTHS_SHT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const NOW_KEY = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; })();

function keyToDate(k: string) { const [y,m]=k.split("-"); return new Date(Number(y),Number(m)-1,1); }

function Icon({ name, size = 20, color = "currentColor" }: { name:string; size?:number; color?:string }) {
  const map: Record<string, LucideIcon> = {
    comida:      UtensilsCrossed,
    supermercado: ShoppingCart,
    transporte:  Truck,
    servicios:   Wrench,
    ocio:        Star,
    salud:       HeartPulse,
    otros:       MoreHorizontal,
    receipt:     Receipt,
    trendDown:   TrendingDown,
    trendUp:     TrendingUp,
    pencil:      Pencil,
    chevLeft:    ChevronLeft,
    chevRight:   ChevronRight,
    clock:       Clock,
    barChart:    LucideBarChart,
  };
  const Component = map[name] || ShoppingCart;
  return <Component size={size} color={color} />;
}

export default function DashboardPage() {
  const { dark, wide, token, totalIncome, setShowIncModal, selectedMonth, setSelectedMonth, expenses, setExpenses, loadingExp, errorExp, refetchExp } = useApp();
  const t   = dark ? DARK : LIGHT;
  const pad = wide ? "28px" : "16px";

  const PAGE = 7;
  const [page,     setPage]     = useState(0);
  const [cats,     setCats]     = useState<CategoryResponse[]>([]);
  const [editing,  setEditing]  = useState<ExpenseResponse|null>(null);
  const [fAmount,  setFAmount]  = useState("");
  const [fMerchant,setFMerchant]= useState("");
  const [fCatId,   setFCatId]   = useState<number|null>(null);
  const [saving,   setSaving]   = useState(false);
  const [editErr,  setEditErr]  = useState<string|null>(null);

  useEffect(()=>{ if(token) categoriesService.getCategories(token).then(setCats).catch(()=>{}); },[token]);
  useEffect(()=>{ setPage(0); },[selectedMonth]);

  const openEdit = (exp: ExpenseResponse) => {
    setEditing(exp);
    setFAmount(String(Math.round(Number(exp.amount))));
    setFMerchant(exp.merchant||"");
    setFCatId(exp.category.id);
    setEditErr(null);
  };
  const saveEdit = async () => {
    if(!editing) return;
    const amt = Number(fAmount.replace(/\D/g,""));
    if(!(amt>0)||fCatId==null){ setEditErr("Ingresá un monto válido y una categoría."); return; }
    setSaving(true); setEditErr(null);
    try {
      await expensesService.update(editing.id, { amount:amt, merchant:fMerchant||undefined, category_id:fCatId }, token);
      const chosen = cats.find(c=>c.id===fCatId) || editing.category;
      setExpenses(prev => prev.map(e => e.id===editing.id ? {...e, amount:String(amt), merchant:fMerchant, category:chosen} : e));
      setEditing(null);
    } catch { setEditErr("No se pudo guardar el gasto. Intentá de nuevo."); }
    finally { setSaving(false); }
  };

  const monthExpenses = expenses.filter(e => e.expense_date.startsWith(selectedMonth));
  const totalSpent    = monthExpenses.reduce((a,e) => a + Number(e.amount), 0);
  const balance       = totalIncome - totalSpent;
  const isNow         = selectedMonth === NOW_KEY;

  // Available months from expenses, always including the current selection
  const availableMonths = Array.from(new Set([
    ...expenses.map(e => e.expense_date.slice(0,7)),
    selectedMonth,
  ])).sort();
  const sortedKeys = availableMonths;
  const idx        = sortedKeys.indexOf(selectedMonth);
  const prevKey    = idx > 0 ? sortedKeys[idx-1] : null;
  const prevSpent  = prevKey ? expenses.filter(e=>e.expense_date.startsWith(prevKey)).reduce((a,e)=>a+Number(e.amount),0) : null;

  const canPrev = idx > 0;
  const canNext = idx < sortedKeys.length - 1;

  // Pie data — group expenses by category from the API response
  const pieData = Object.values(monthExpenses.reduce((acc, e) => {
    const key = e.category.id;
    const amount = Number(e.amount);
    if (!acc[key]) {
      acc[key] = { name: e.category.name, color: e.category.color || "#94a3b8", value: amount };
    } else {
      acc[key].value += amount;
    }
    return acc;
  }, {} as Record<number, { name: string; color: string; value: number }>)).filter(d => d.value > 0);

  // Bar chart data (last 4 months)
  const barData = sortedKeys.slice(Math.max(0,idx-3), idx+2).map(k => {
    const d = keyToDate(k);
    return { name: MONTHS_SHT[d.getMonth()], total: expenses.filter(e=>e.expense_date.startsWith(k)).reduce((a,e)=>a+Number(e.amount),0), current: k===selectedMonth };
  });

  if (loadingExp) return (
    <div style={{flex:1,padding:pad,display:"flex",flexDirection:"column",gap:12}}>
      {[1,2,3].map(i=><div key={i} style={{height:80,borderRadius:18,background:t.card,border:`1px solid ${t.border}`,animation:"pulse 1.5s infinite"}}/>)}
    </div>
  );

  if (errorExp) return (
    <div style={{flex:1,padding:pad,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:dark?"rgba(239,68,68,.08)":"#fef2f2",border:"1px solid #fee2e2",borderRadius:16,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:14,fontWeight:600,color:"#ef4444"}}>⚠ {errorExp}</span>
        <button onClick={refetchExp} style={{fontSize:13,fontWeight:700,color:"#ef4444",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>Reintentar</button>
      </div>
    </div>
  );

  return (
    <div style={{flex:1,padding:pad,paddingBottom:"28px",overflowY:"auto",display:"flex",flexDirection:"column",gap:16}}>

      {/* Title + MonthNav */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Resumen mensual</div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>canPrev&&setSelectedMonth(sortedKeys[idx-1])} disabled={!canPrev} style={{width:32,height:32,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:canPrev?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",opacity:canPrev?1:.3}}><Icon name="chevLeft" size={15} color={t.text}/></button>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:wide?22:18,fontWeight:900,color:t.text}}>{keyLabel(selectedMonth)}</div></div>
          <button onClick={()=>canNext&&setSelectedMonth(sortedKeys[idx+1])} disabled={!canNext} style={{width:32,height:32,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:canNext?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",opacity:canNext?1:.3}}><Icon name="chevRight" size={15} color={t.text}/></button>
          {!isNow&&<button onClick={()=>setSelectedMonth(NOW_KEY)} style={{padding:"5px 12px",borderRadius:20,border:"none",background:"#3b82f6",color:"white",fontSize:11,fontWeight:700,cursor:"pointer"}}>Mes actual</button>}
          {!isNow&&<span style={{padding:"4px 10px",borderRadius:20,background:dark?"rgba(251,191,36,.15)":"#fefce8",color:"#d97706",fontSize:10,fontWeight:800,border:"1px solid #fde68a"}}>Histórico</span>}
        </div>
      </div>

      {/* Historical banner */}
      {!isNow&&<div style={{borderRadius:14,padding:"11px 16px",background:dark?"rgba(251,191,36,.08)":"#fffbeb",border:"1px solid #fde68a",display:"flex",alignItems:"center",gap:10}}>
        <Icon name="clock" size={16} color="#d97706"/>
        <span style={{fontSize:12,fontWeight:600,color:"#92400e"}}>Estás viendo datos históricos de <strong>{keyLabel(selectedMonth)}</strong>.</span>
      </div>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:wide?"2fr 1.2fr 1fr":"1fr",gap:12}}>
        <div style={{borderRadius:18,padding:wide?"20px 22px":"18px 20px",background:isNow?"linear-gradient(135deg,#3b82f6,#1d4ed8)":"linear-gradient(135deg,#6366f1,#4338ca)",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 8px 24px ${isNow?"rgba(59,130,246,.35)":"rgba(99,102,241,.3)"}`}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.7)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Total gastado</div>
            <div style={{fontSize:wide?30:26,fontWeight:900,color:"white",marginTop:4,fontVariantNumeric:"tabular-nums"}}>{fmt(totalSpent)}</div>
            {prevSpent!==null&&prevSpent>0&&(()=>{const pct=Math.round(((totalSpent-prevSpent)/prevSpent)*100);const up=pct>0;return pct!==0?<div style={{marginTop:6}}><span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 7px",borderRadius:20,fontSize:10,fontWeight:800,background:up?"rgba(239,68,68,.2)":"rgba(34,197,94,.2)",color:up?"#fca5a5":"#86efac"}}><Icon name={up?"trendDown":"trendUp"} size={10} color={up?"#fca5a5":"#86efac"}/>{up?"+":""}{pct}% vs mes ant.</span></div>:null;})()}
          </div>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="trendDown" size={24} color="white"/></div>
        </div>
        {wide ? (
          <>
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"18px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:26,height:26,borderRadius:8,background:dark?"#052e16":"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="trendUp" size={13} color="#22c55e"/></div>
                  <span style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ingresos</span>
                </div>
                {isNow&&<button onClick={()=>setShowIncModal(true)} style={{width:26,height:26,borderRadius:8,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="pencil" size={12} color={t.muted}/></button>}
              </div>
              <div style={{fontSize:22,fontWeight:900,color:t.text,fontVariantNumeric:"tabular-nums"}}>{fmt(totalIncome)}</div>
            </div>
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"18px"}}>
              <div style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Balance</div>
              <div style={{fontSize:22,fontWeight:900,color:balance>=0?"#22c55e":"#ef4444",fontVariantNumeric:"tabular-nums"}}>{fmt(balance)}</div>
            </div>
          </>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ingresos</span>
                {isNow&&<button onClick={()=>setShowIncModal(true)} style={{width:22,height:22,borderRadius:7,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="pencil" size={10} color={t.muted}/></button>}
              </div>
              <div style={{fontSize:16,fontWeight:900,color:t.text,fontVariantNumeric:"tabular-nums"}}>{fmt(totalIncome)}</div>
            </div>
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:18,padding:"14px 16px"}}>
              <div style={{fontSize:10,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Balance</div>
              <div style={{fontSize:16,fontWeight:900,color:balance>=0?"#22c55e":"#ef4444",fontVariantNumeric:"tabular-nums"}}>{fmt(balance)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Evolution bar chart */}
      {barData.length >= 2 && (
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,padding:"20px",boxShadow:dark?"none":"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><Icon name="barChart" size={14} color={t.muted}/><div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Evolución mensual</div></div>
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={dark?"#1e2130":"#f1f5f9"} strokeDasharray="3 3"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11,fontWeight:600,fill:t.muted}}/>
                <YAxis hide/>
                <Tooltip cursor={false} content={({active,payload})=>active&&payload?.length?<div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"6px 10px",boxShadow:"0 4px 12px rgba(0,0,0,.15)"}}><div style={{fontSize:12,fontWeight:700,color:t.text}}>{fmt(payload[0].value as number)}</div></div>:null}/>
                <Bar dataKey="total" radius={6}>{barData.map((e,i)=><Cell key={i} fill={e.current?"#3b82f6":(dark?"#2a2f42":"#e2e8f0")}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pie + recents */}
      <div style={{display:"grid",gridTemplateColumns:wide?"1fr 1.3fr":"1fr",gap:16,alignItems:"start"}}>
        {/* Pie */}
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,padding:"20px",boxShadow:dark?"none":"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Por categoría</div>
          {pieData.length===0 ? (
            <div style={{textAlign:"center",padding:"20px 0"}}><Icon name="receipt" size={28} color={t.muted}/><div style={{fontSize:13,color:t.muted,marginTop:10,fontWeight:600}}>Sin gastos este mes</div></div>
          ) : wide ? (
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <div style={{width:160,height:160,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"6px 10px"}}><div style={{fontSize:11,fontWeight:700,color:t.text}}>{payload[0].name}</div><div style={{fontSize:11,color:t.muted}}>{fmt(payload[0].value as number)}</div></div>:null}/></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 12px"}}>
                {pieData.map(item=><div key={item.name} style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}><div style={{width:9,height:9,borderRadius:"50%",flexShrink:0,background:item.color}}/><div style={{minWidth:0,flex:1}}><div style={{fontSize:12,fontWeight:600,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div><div style={{fontSize:11,color:t.muted,fontVariantNumeric:"tabular-nums"}}>{fmt(item.value)}</div></div></div>)}
              </div>
            </div>
          ) : (
            <div>
              <div style={{width:140,height:140,margin:"0 auto 16px"}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={3} dataKey="value" strokeWidth={0}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {pieData.map(item=><div key={item.name} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:9,height:9,borderRadius:"50%",flexShrink:0,background:item.color}}/><span style={{fontSize:13,fontWeight:600,color:t.text,flex:1}}>{item.name}</span><span style={{fontSize:13,fontWeight:700,color:t.muted,fontVariantNumeric:"tabular-nums"}}>{fmt(item.value)}</span></div>)}
              </div>
            </div>
          )}
        </div>

        {/* Recents */}
        <div>
          {monthExpenses.length===0 ? (
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"24px",textAlign:"center"}}><div style={{fontSize:13,color:t.muted,fontWeight:600}}>Sin gastos registrados</div></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {monthExpenses.slice(page*PAGE, page*PAGE+PAGE).map(exp => {
                const CatIcon  = getLucideIcon(exp.category.icon);
                const catColor = exp.category.color || "#94a3b8";
                return (
                  <button key={exp.id} type="button" onClick={()=>openEdit(exp)} style={{textAlign:"left",width:"100%",background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,.04)",cursor:"pointer",fontFamily:"inherit"}}>
                    <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:`${catColor}22`,display:"flex",alignItems:"center",justifyContent:"center"}}><CatIcon size={19} color={catColor}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.merchant||exp.category.name}</div>
                      <div style={{fontSize:11,color:t.muted,marginTop:2,fontWeight:600}}>{new Date(exp.expense_date+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"})}</div>
                    </div>
                    <div style={{fontWeight:800,fontSize:14,color:t.text,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(exp.amount))}</div>
                  </button>
                );
              })}
              {monthExpenses.length>PAGE && (()=>{ const total=Math.ceil(monthExpenses.length/PAGE); return (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginTop:4}}>
                  <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{width:32,height:32,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:page===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:page===0?.3:1}}><ChevronLeft size={15} color={t.text}/></button>
                  <span style={{fontSize:12,fontWeight:700,color:t.muted,fontVariantNumeric:"tabular-nums"}}>{page+1}/{total}</span>
                  <button onClick={()=>setPage(p=>Math.min(total-1,p+1))} disabled={page>=total-1} style={{width:32,height:32,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:page>=total-1?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:page>=total-1?.3:1}}><ChevronRight size={15} color={t.text}/></button>
                </div>
              );})()}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,.54)",padding:16}} onClick={()=>!saving&&setEditing(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"min(560px,100%)",maxHeight:"calc(100vh - 32px)",overflowY:"auto",background:t.card,border:`1px solid ${t.border}`,borderRadius:24,boxShadow:"0 28px 80px rgba(15,23,42,.22)",padding:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:18}}>
              <div style={{fontSize:18,fontWeight:900,color:t.text}}>Editar gasto</div>
              <button type="button" onClick={()=>setEditing(null)} style={{width:38,height:38,borderRadius:12,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><X size={18} color={t.muted}/></button>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Monto</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,fontWeight:800,color:t.muted}}>$</span>
                <input inputMode="numeric" value={fAmount?Number(fAmount).toLocaleString("es-AR"):""} onChange={e=>setFAmount(e.target.value.replace(/\D/g,""))} style={{width:"100%",boxSizing:"border-box",background:t.input,border:`2px solid ${t.border}`,borderRadius:12,padding:"12px 14px 12px 40px",fontSize:18,fontWeight:800,color:t.text,outline:"none",fontVariantNumeric:"tabular-nums",fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Comercio (opcional)</label>
              <input value={fMerchant} onChange={e=>setFMerchant(e.target.value)} placeholder="Nombre del comercio..." style={{width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:t.text,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Categoría</div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${wide?6:3},1fr)`,gap:8}}>
                {cats.map(cat=>{ const sel=fCatId===cat.id; const color=cat.color||"#3b82f6"; const CIcon=getLucideIcon(cat.icon); return (
                  <button key={cat.id} type="button" onClick={()=>setFCatId(cat.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 4px",borderRadius:14,border:`2px solid ${sel?color+"60":t.border}`,background:sel?color+"18":t.card,cursor:"pointer",fontFamily:"inherit"}}>
                    <div style={{width:36,height:36,borderRadius:11,background:sel?color+"25":(dark?"rgba(255,255,255,.05)":"#f1f5f9"),display:"flex",alignItems:"center",justifyContent:"center"}}><CIcon size={17} color={sel?color:t.muted}/></div>
                    <span style={{fontSize:10,fontWeight:sel?800:600,color:sel?color:t.label,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{cat.name}</span>
                  </button>
                );})}
              </div>
            </div>
            {editErr && <div style={{color:"#ef4444",fontSize:12,fontWeight:700,marginBottom:14}}>{editErr}</div>}
            <button type="button" onClick={saveEdit} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:800,fontSize:15,cursor:saving?"wait":"pointer",opacity:saving?.7:1,fontFamily:"inherit"}}>{saving?"Guardando...":"Guardar cambios"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
