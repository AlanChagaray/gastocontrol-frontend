// Mirrors GastoControlDemo.jsx constants exactly

export const CATEGORIES = [
  { id:"comida",       label:"Comida",     color:"#f97316", bg:"#fff7ed", darkBg:"#43200a" },
  { id:"supermercado", label:"Super",      color:"#22c55e", bg:"#f0fdf4", darkBg:"#052e16" },
  { id:"transporte",   label:"Transporte", color:"#3b82f6", bg:"#eff6ff", darkBg:"#172554" },
  { id:"servicios",    label:"Servicios",  color:"#8b5cf6", bg:"#f5f3ff", darkBg:"#2e1065" },
  { id:"ocio",         label:"Ocio",       color:"#ec4899", bg:"#fdf2f8", darkBg:"#500724" },
  { id:"salud",        label:"Salud",      color:"#14b8a6", bg:"#f0fdfa", darkBg:"#042f2e" },
  { id:"otros",        label:"Otros",      color:"#94a3b8", bg:"#f8fafc", darkBg:"#1e293b" },
] as const;

export const MONTHS_ES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const MONTHS_SHT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const DAYS_SHORT = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

export const DARK  = { bg:"#0f1117", card:"#1a1d27", border:"#1e2130", text:"#f1f5f9", muted:"#64748b", label:"#475569", input:"#0d0f16" };
export const LIGHT = { bg:"#f1f5f9", card:"#ffffff",  border:"#e2e8f0", text:"#0f172a", muted:"#94a3b8", label:"#64748b", input:"#f8fafc" };

export function getCat(id: string) { return CATEGORIES.find(c => c.id === id); }
export function fmt(n: number)     { return "$" + Number(n).toLocaleString("es-AR"); }
export function fmtDate(d: string) { return new Date(d+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}); }
export function toYMD(d: Date)     { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export function monthKey(d: Date)  { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
export function keyToDate(k: string) { const [y,m]=k.split("-"); return new Date(Number(y),Number(m)-1,1); }
export function keyLabel(k: string)  { const d=keyToDate(k); return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`; }
export function currentMonthKey()    { return monthKey(new Date()); }
