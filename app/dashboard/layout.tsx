"use client";
/**
 * Layout autenticado — replica EXACTAMENTE la estructura del demo:
 *   Header sticky
 *   └── SideNav (desktop ≥768px) + main scrollable
 *   └── BottomNav (mobile <768px)
 */
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { expensesService, incomesService } from "@/lib/services";
import { DARK, LIGHT, keyLabel, currentMonthKey, fmt, CATEGORIES } from "@/lib/constants";
import type { ExpenseResponse, IncomeResponse } from "@/types/api";

// ─── Loading Component ──────────────────────────────────────────────────────
function Loading({ dark }: { dark: boolean }) {
  const t = dark ? DARK : LIGHT;
  return (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color: t.muted}}>
      Cargando...
    </div>
  );
}

// ─── Helpers de breakpoint ────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(() => typeof window !== "undefined" ? window.innerWidth : 900);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    fn();
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ─── Íconos SVG (copiados del demo) ──────────────────────────────────────────
function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string, React.ReactNode> = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
    history:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>,
    plus:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>,
    user:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
    wallet:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
    sun:       <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2m-4.34-5.66 1.41-1.41M6.34 17.66l-1.41 1.41"/></svg>,
    moon:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
    x:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    pencil:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
    trash:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

// ─── Header (del demo) ────────────────────────────────────────────────────────
function Header({ dark, toggleDark }: { dark:boolean; toggleDark:()=>void }) {
  const router = useRouter();
  const t = dark ? DARK : LIGHT;
  return (
    <div style={{position:"sticky",top:0,zIndex:50,background:dark?"rgba(15,17,23,.92)":"rgba(255,255,255,.92)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${t.border}`,padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <Link href="/dashboard" style={{textDecoration:"none"}}>
        <button style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer",padding:0}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(59,130,246,.4)"}}>
            <Ico name="wallet" size={17} color="white"/>
          </div>
          <span style={{fontWeight:800,fontSize:15,color:t.text}}>Gasto</span>
          <span style={{fontWeight:800,fontSize:15,color:"#3b82f6",marginLeft:-6}}>Control</span>
        </button>
      </Link>
      <button onClick={toggleDark} style={{width:34,height:34,borderRadius:10,background:dark?"#1e2130":"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
        <Ico name={dark?"sun":"moon"} size={15} color={dark?"#fbbf24":"#64748b"}/>
      </button>
    </div>
  );
}

// ─── SideNav (del demo) ───────────────────────────────────────────────────────
function SideNav({ dark }: { dark:boolean }) {
  const router   = useRouter();
  const pathname = usePathname();
  const t = dark ? DARK : LIGHT;
  const items = [
    {id:"dashboard", label:"Inicio",       icon:"dashboard", path:"/dashboard"},
    {id:"agregar",   label:"Agregar gasto",icon:"plus",      path:"/agregar"},
    {id:"historial", label:"Historial",    icon:"history",   path:"/historial"},
    {id:"perfil",    label:"Perfil",       icon:"user",      path:"/perfil"},
  ];
  return (
    <div style={{width:210,flexShrink:0,borderRight:`1px solid ${t.border}`,padding:"18px 12px",display:"flex",flexDirection:"column",gap:3}}>
      {items.map(({id,label,icon,path})=>{
        const active = pathname?.startsWith(path);
        const isAdd  = id==="agregar";
        return (
          <Link key={id} href={path} style={{textDecoration:"none"}}>
            <button style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 13px",borderRadius:11,border:"none",background:active?(isAdd?"linear-gradient(135deg,#3b82f6,#1d4ed8)":(dark?"rgba(59,130,246,.12)":"#eff6ff")):"transparent",color:active?(isAdd?"white":"#3b82f6"):t.muted,fontWeight:active?700:500,fontSize:14,cursor:"pointer",transition:"all .15s",textAlign:"left",boxShadow:active&&isAdd?"0 4px 14px rgba(59,130,246,.35)":"none",fontFamily:"inherit"}}>
              <Ico name={icon} size={17} color={active?(isAdd?"white":"#3b82f6"):t.muted}/>
              {label}
            </button>
          </Link>
        );
      })}
    </div>
  );
}

// ─── BottomNav (del demo) ─────────────────────────────────────────────────────
function BottomNav({ dark }: { dark:boolean }) {
  const router   = useRouter();
  const pathname = usePathname();
  const t = dark ? DARK : LIGHT;
  return (
    <div style={{flexShrink:0,background:dark?"rgba(26,29,39,.97)":"rgba(255,255,255,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${t.border}`,padding:"8px 16px 16px",display:"flex",alignItems:"center",justifyContent:"space-around"}}>
      {[{id:"dashboard",label:"Inicio",icon:"dashboard",path:"/dashboard"},{id:"historial",label:"Historial",icon:"history",path:"/historial"},{id:"perfil",label:"Perfil",icon:"user",path:"/perfil"}].map(item=>{
        const active=pathname?.startsWith(item.path);
        return (
          <Link key={item.id} href={item.path} style={{textDecoration:"none"}}>
            <button style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 18px",borderRadius:12,border:"none",background:"none",cursor:"pointer",color:active?"#3b82f6":t.muted,transition:"all .15s",fontFamily:"inherit"}}>
              <Ico name={item.icon} size={22} color={active?"#3b82f6":t.muted}/>
              <span style={{fontSize:10,fontWeight:700}}>{item.label}</span>
            </button>
          </Link>
        );
      })}
      <Link href="/agregar" style={{textDecoration:"none"}}>
        <button style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,marginTop:-18,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{width:52,height:52,borderRadius:15,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 18px rgba(59,130,246,.45)"}}>
            <Ico name="plus" size={26} color="white"/>
          </div>
          <span style={{fontSize:10,fontWeight:700,color:"#3b82f6"}}>Agregar</span>
        </button>
      </Link>
    </div>
  );
}

// ─── Income Modal — gestión de ingresos del mes ───────────────────────────────
function IncomeModal({ incomes, monthLabel, totalIncome, onCreate, onUpdate, onDelete, onClose, dark }: {
  incomes: IncomeResponse[]; monthLabel: string; totalIncome: number;
  onCreate: (name: string, amount: number) => Promise<void>;
  onUpdate: (id: number, data: { name?: string; amount?: number }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void; dark: boolean;
}) {
  const t = dark ? DARK : LIGHT;
  const [name, setName]           = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [editingId, setEditingId] = useState<number|null>(null);
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState("");

  const amount    = Number(amountRaw);
  const canSave   = name.trim().length > 0 && amount > 0;
  const resetForm = () => { setName(""); setAmountRaw(""); setEditingId(null); setErr(""); };

  const submit = async () => {
    if (!canSave || busy) return;
    setBusy(true); setErr("");
    try {
      if (editingId != null) await onUpdate(editingId, { name: name.trim(), amount });
      else                   await onCreate(name.trim(), amount);
      resetForm();
    } catch (e: unknown) { setErr((e as {message?:string})?.message ?? "No se pudo guardar el ingreso."); }
    finally { setBusy(false); }
  };
  const startEdit = (inc: IncomeResponse) => { setEditingId(inc.id); setName(inc.name); setAmountRaw(String(Math.round(Number(inc.amount)))); setErr(""); };
  const del = async (id: number) => {
    setBusy(true); setErr("");
    try { await onDelete(id); if (editingId === id) resetForm(); }
    catch (e: unknown) { setErr((e as {message?:string})?.message ?? "No se pudo eliminar el ingreso."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:"100%",maxWidth:440,maxHeight:"calc(100vh - 40px)",overflowY:"auto",background:t.card,borderRadius:24,padding:26,boxShadow:"0 24px 64px rgba(0,0,0,.35)",animation:"dpIn .18s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ingresos</div>
            <div style={{fontSize:19,fontWeight:900,color:t.text}}>{monthLabel}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:10,border:"none",background:dark?"rgba(255,255,255,.08)":"#f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ico name="x" size={14} color={t.muted}/>
          </button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {incomes.length===0 ? (
            <div style={{textAlign:"center",padding:"16px 0",fontSize:13,color:t.muted,fontWeight:600}}>Todavía no hay ingresos este mes</div>
          ) : incomes.map(inc => (
            <div key={inc.id} style={{display:"flex",alignItems:"center",gap:10,background:t.input,border:`1px solid ${t.border}`,borderRadius:12,padding:"10px 12px"}}>
              <div style={{flex:1,minWidth:0,fontSize:14,fontWeight:700,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inc.name}</div>
              <div style={{fontSize:14,fontWeight:800,color:"#22c55e",fontVariantNumeric:"tabular-nums"}}>{fmt(Number(inc.amount))}</div>
              <button onClick={()=>startEdit(inc)} disabled={busy} style={{width:28,height:28,borderRadius:8,border:"none",background:dark?"rgba(255,255,255,.06)":"#eef2f7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name="pencil" size={13} color={t.muted}/></button>
              <button onClick={()=>del(inc.id)} disabled={busy} style={{width:28,height:28,borderRadius:8,border:"none",background:dark?"rgba(239,68,68,.12)":"#fef2f2",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico name="trash" size={13} color="#ef4444"/></button>
            </div>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:12,background:dark?"rgba(34,197,94,.08)":"#f0fdf4",marginBottom:16}}>
          <span style={{fontSize:12,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Total del mes</span>
          <span style={{fontSize:18,fontWeight:900,color:"#22c55e",fontVariantNumeric:"tabular-nums"}}>{fmt(totalIncome)}</span>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input type="text" placeholder="Nombre (ej: Sueldo, Venta)" value={name} onChange={e=>setName(e.target.value)}
            style={{width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:t.text,outline:"none",fontFamily:"inherit"}}/>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18,fontWeight:800,color:t.muted}}>$</span>
            <input type="text" inputMode="numeric" placeholder="0" value={amountRaw ? Number(amountRaw).toLocaleString("es-AR") : ""} onChange={e=>setAmountRaw(e.target.value.replace(/\D/g,""))}
              style={{width:"100%",boxSizing:"border-box",background:t.input,border:"2px solid #22c55e",borderRadius:12,paddingLeft:40,paddingRight:14,paddingTop:12,paddingBottom:12,fontSize:18,fontWeight:800,color:t.text,outline:"none",fontVariantNumeric:"tabular-nums",fontFamily:"inherit"}}/>
          </div>
          {err && <div style={{color:"#ef4444",fontSize:12,fontWeight:700}}>{err}</div>}
          <div style={{display:"flex",gap:10}}>
            {editingId!=null && <button onClick={resetForm} disabled={busy} style={{flex:1,padding:"12px",borderRadius:12,border:`1px solid ${t.border}`,background:"transparent",color:t.muted,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>}
            <button onClick={submit} disabled={!canSave||busy}
              style={{flex:2,padding:"12px",borderRadius:12,border:"none",background:(canSave&&!busy)?"linear-gradient(135deg,#22c55e,#16a34a)":(dark?"#1e2130":"#e2e8f0"),color:(canSave&&!busy)?"white":t.muted,fontWeight:800,fontSize:14,cursor:(canSave&&!busy)?"pointer":"default",boxShadow:(canSave&&!busy)?"0 4px 14px rgba(34,197,94,.4)":"none",transition:"all .2s",fontFamily:"inherit"}}>
              {busy ? "Guardando..." : editingId!=null ? "Guardar cambios" : "Agregar ingreso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Context para compartir estado entre páginas ───────────────────────────────
import { createContext, useContext } from "react";

interface AppCtx {
  dark:          boolean;
  wide:          boolean;
  token:         string;
  incomes:       IncomeResponse[];
  totalIncome:   number;
  addIncome:     (name: string, amount: number) => Promise<void>;
  editIncome:    (id: number, data: { name?: string; amount?: number }) => Promise<void>;
  removeIncome:  (id: number) => Promise<void>;
  showIncModal:  boolean;
  setShowIncModal: (b: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  expenses:      ExpenseResponse[];
  setExpenses:   React.Dispatch<React.SetStateAction<ExpenseResponse[]>>;
  loadingExp:    boolean;
  errorExp:      string;
  refetchExp:    () => void;
}

export const AppContext = createContext<AppCtx>({} as AppCtx);
export function useApp() { return useContext(AppContext); }

// ─── Shell principal ──────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router  = useRouter();
  const width   = useWidth();
  const hasSide = width >= 768;
  const wide    = width >= 860;

  const [dark,           setDark]           = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("darkMode");
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });
  const [token,          setToken]          = useState("");
  const [incomes,        setIncomes]        = useState<IncomeResponse[]>([]);
  const [showIncModal,   setShowIncModal]   = useState(false);
  const [selectedMonth,  setSelectedMonth]  = useState(currentMonthKey());
  const [expenses,       setExpenses]       = useState<ExpenseResponse[]>([]);
  const [loadingExp,     setLoadingExp]     = useState(false);
  const [errorExp,       setErrorExp]       = useState("");
  const t = dark ? DARK : LIGHT;

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(dark));
  }, [dark]);

  // Auth guard
  useEffect(() => {
    const tk = localStorage.getItem("token");
    if (!tk) { router.push("/login"); return; }
    setToken(tk);
  }, [router]);

  // Fetch expenses
  const refetchExp = useCallback(async () => {
    if (!token) return;
    setLoadingExp(true); setErrorExp("");
    try {
      const data = await expensesService.getByMonth(selectedMonth, token);
      setExpenses(prev => {
        const all = new Map(prev.map(e => [e.id, e]));
        data.forEach(e => all.set(e.id, e));
        return Array.from(all.values());
      });
    } catch (err: unknown) {
      setErrorExp((err as {message?:string})?.message ?? "Error al cargar gastos");
    } finally { setLoadingExp(false); }
  }, [token, selectedMonth]);

  useEffect(() => { if (token) refetchExp(); }, [token, selectedMonth, refetchExp]);

  // Fetch incomes del mes
  useEffect(() => {
    if (!token) return;
    incomesService.getByMonth(selectedMonth, token)
      .then(setIncomes)
      .catch(() => setIncomes([]));
  }, [token, selectedMonth]);

  const totalIncome = incomes.reduce((a, i) => a + Number(i.amount), 0);

  const addIncome = async (name: string, amount: number) => {
    if (!token) return;
    const created = await incomesService.create({ name, amount, income_date: `${selectedMonth}-01` }, token);
    setIncomes(prev => [...prev, created]);
  };
  const editIncome = async (id: number, data: { name?: string; amount?: number }) => {
    if (!token) return;
    const updated = await incomesService.update(id, data, token);
    setIncomes(prev => prev.map(i => i.id === id ? updated : i));
  };
  const removeIncome = async (id: number) => {
    if (!token) return;
    await incomesService.remove(id, token);
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  if (!token) return null;

  const ctx: AppCtx = {
    dark, wide, token, incomes, totalIncome, addIncome, editIncome, removeIncome,
    showIncModal, setShowIncModal,
    selectedMonth, setSelectedMonth,
    expenses, setExpenses, loadingExp, errorExp, refetchExp,
  };

  return (
    <AppContext.Provider value={ctx}>
      {/* Exact same structure as demo App() */}
      <div style={{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:t.bg,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Header dark={dark} toggleDark={()=>setDark(d=>!d)}/>
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
          {hasSide && <SideNav dark={dark}/>}
          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",minWidth:0}}>
            <Suspense fallback={<Loading dark={dark} />}>
              {children}
            </Suspense>
          </div>
        </div>
        {!hasSide && <BottomNav dark={dark}/>}
        {showIncModal && (
          <IncomeModal
            incomes={incomes}
            monthLabel={keyLabel(selectedMonth)}
            totalIncome={totalIncome}
            onCreate={addIncome}
            onUpdate={editIncome}
            onDelete={removeIncome}
            onClose={()=>setShowIncModal(false)}
            dark={dark}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
