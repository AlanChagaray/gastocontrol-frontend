"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { DARK, LIGHT, toYMD } from "@/lib/constants";
import { expensesService, categoriesService } from "@/lib/services";
import { ICON_OPTIONS, getLucideIcon } from "@/lib/lucide-icons";
import { DatePicker } from "@/lib/helpers";
import type { CategoryResponse } from "@/types/api";

function Ico({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const p = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const map: Record<string,React.ReactNode> = {
    check:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
    cal:         <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    chevLeft:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m15 18-6-6 6-6"/></svg>,
    chevRight:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m9 18 6-6-6-6"/></svg>,
    x:           <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="m18 6-12 12M6 6l12 12"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{map[name]||null}</span>;
}

function CategoryIcon({ name, size=20, color="currentColor" }: { name:string; size?:number; color?:string }) {
  const Icon = getLucideIcon(name);
  return <Icon size={size} color={color} />;
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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [categoryIconInput, setCategoryIconInput] = useState(ICON_OPTIONS[0].id);
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState<string|null>(null);

  useEffect(() => {
    if (!token) return;
    categoriesService.getCategories(token)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));
  }, [token]);

  const openCategoryModal = () => {
    setCategoryNameInput("");
    setCategoryIconInput(ICON_OPTIONS[0].id);
    setCategoryModalError(null);
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setCategoryNameInput("");
    setCategoryIconInput(ICON_OPTIONS[0].id);
    setCategoryModalError(null);
    setCategoryModalLoading(false);
  };

  const saveCategory = async () => {
    if (!token) return;
    const name = categoryNameInput.trim();
    if (!name) {
      setCategoryModalError("El nombre es obligatorio.");
      return;
    }
    setCategoryModalLoading(true);
    setCategoryModalError(null);
    try {
      const payload = { name, icon: categoryIconInput };
      const saved = await categoriesService.create(payload, token);
      setCategories(prev => [saved, ...prev]);
      setCategory(saved);
      closeCategoryModal();
    } catch (err) {
      console.error(err);
      setCategoryModalError("No se pudo guardar la categoría. Intentá de nuevo.");
    } finally {
      setCategoryModalLoading(false);
    }
  };

  const deleteCategory = async (cat: CategoryResponse) => {
    if (!token) return;
    if (!confirm(`Eliminar categoría \"${cat.name}\"? Esta acción no se puede deshacer.`)) return;
    try {
      await categoriesService.delete(cat.id, token);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (category?.id === cat.id) setCategory(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la categoría. Intentá nuevamente.");
    }
  };

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
            <>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${wide?6:3},1fr)`,gap:8}}>
                {categories.map(cat=>{
                  const sel=category?.id===cat.id;
                  return (
                    <button key={cat.id} onClick={()=>setCategory(cat)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 4px",borderRadius:14,border:`2px solid ${sel?cat.color+"60":t.border}`,background:sel?cat.color+"18":t.card,cursor:"pointer",transition:"all .14s",transform:sel?"scale(1.05)":"scale(1)",boxShadow:sel?`0 4px 12px ${cat.color}30`:"none",fontFamily:"inherit"}}>
                      <div style={{width:38,height:38,borderRadius:11,background:sel?cat.color+"25":(dark?"rgba(255,255,255,.05)":"#f1f5f9"),display:"flex",alignItems:"center",justifyContent:"center"}}><CategoryIcon name={cat.icon} size={18} color={sel?cat.color:t.muted}/></div>
                      <span style={{fontSize:10,fontWeight:sel?800:600,color:sel?cat.color:t.label,whiteSpace:"nowrap"}}>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={openCategoryModal} style={{width:"100%",marginTop:14,padding:"14px 16px",borderRadius:16,border:"none",background:"#2563eb",color:"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 20px rgba(37,99,235,.18)"}}>Agregar categoría</button>
            </>
          )}
        </div>
      </div>
      <button onClick={handleSave} disabled={!isValid||loading} style={{padding:"16px",borderRadius:16,border:"none",cursor:isValid?"pointer":"not-allowed",background:isValid?"linear-gradient(135deg,#3b82f6,#1d4ed8)":(dark?"#1e2130":"#e8edf2"),color:isValid?"white":t.muted,fontSize:15,fontWeight:800,opacity:isValid?1:.5,boxShadow:isValid?"0 4px 16px rgba(59,130,246,.4)":"none",transition:"all .2s",fontFamily:"inherit"}}>
        {loading?"Guardando...":btnLabel}
      </button>
      {categoryModalOpen && (
        <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,.54)",padding:16}}>
          <div style={{width:"min(780px,100%)",maxHeight:"calc(100vh - 32px)",overflowY:"auto",background:t.card,border:`1px solid ${t.border}`,borderRadius:24,boxShadow:"0 28px 80px rgba(15,23,42,.22)",padding:24,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:18}}>
              <div>
                <div style={{fontSize:18,fontWeight:900,color:t.text}}>Nueva categoría</div>
                <div style={{fontSize:13,color:t.muted,marginTop:6}}>Creá una categoría nueva para usar en tus gastos.</div>
              </div>
              <button type="button" onClick={closeCategoryModal} style={{width:38,height:38,borderRadius:12,border:"none",background:dark?"rgba(255,255,255,.06)":"#f1f5f9",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Ico name="x" size={18} color={t.muted}/></button>
            </div>
            <div style={{background:t.input,border:`1px solid ${t.border}`,borderRadius:20,padding:18}}>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Nombre de categoría</label>
                <input value={categoryNameInput} onChange={e=>setCategoryNameInput(e.target.value)} placeholder="Ej. Supermercado" style={{width:"100%",boxSizing:"border-box",background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"12px 14px",fontSize:14,color:t.text,outline:"none",fontFamily:"inherit"}}/>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:800,color:t.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Ícono</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(70px, 1fr))",gap:12,justifyItems:"center"}}>
                  {ICON_OPTIONS.map(opt=>{
                    const sel = categoryIconInput===opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={()=>setCategoryIconInput(opt.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:10,borderRadius:14,border:sel?"2px solid #2563eb":`1px solid ${t.border}`,background:sel?"rgba(37,99,235,.1)":t.card,color:t.text,cursor:"pointer",fontFamily:"inherit",width:"100%",maxWidth:80}}>
                        <div style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:sel?"#2563eb":"rgba(255,255,255,.08)"}}><CategoryIcon name={opt.id} size={20} color={sel?"white":t.muted}/></div>
                        <span style={{fontSize:10,fontWeight:700,color:sel?"#1d4ed8":t.text,textAlign:"center",lineHeight:1.2}}>{opt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {categoryModalError && <div style={{color:"#ef4444",fontSize:12,fontWeight:700,marginBottom:14}}>{categoryModalError}</div>}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button type="button" onClick={saveCategory} disabled={categoryModalLoading} style={{flex:1,padding:"14px 16px",borderRadius:16,border:"none",background:"#2563eb",color:"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{categoryModalLoading ? "Guardando..." : "Crear categoría"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
