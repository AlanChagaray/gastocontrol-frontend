/**
 * Mapeo de iconos de Lucide para categorías
 * 20 iconos adaptados para diferentes tipos de gastos
 */
import type { LucideIcon } from "lucide-react";
import {
  UtensilsCrossed,     // Comida
  ShoppingCart,        // Supermercado
  Car,                 // Transporte
  Wrench,              // Servicios/Mantenimiento
  Gamepad2,            // Ocio/Entretenimiento
  Heart,               // Salud
  Zap,                 // Electricidad
  Home,                // Vivienda/Casa
  GraduationCap,       // Educación
  Dumbbell,            // Deportes
  Coffee,              // Café/Bebidas
  Pill,                // Medicinas
  Wifi,                // Internet
  Bus,                 // Transporte Público
  Smartphone,          // Teléfono
  Palette,             // Arte/Diseño
  Gift,                // Regalos
  Music,               // Música
  Plane,               // Viajes
  MoreHorizontal,      // Otros
  ShieldCheck,         // Seguros
  CreditCard,          // Créditos
  PawPrint,            // Mascotas
  Lightbulb,           // Luz
  Flame,               // Gas
  Droplets,            // Agua
  TvMinimalPlay,       // Streaming
} from "lucide-react";

export const LUCIDE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensilsCrossed: UtensilsCrossed,
  shoppingCart: ShoppingCart,
  car: Car,
  wrench: Wrench,
  gamepad: Gamepad2,
  heart: Heart,
  zap: Zap,
  home: Home,
  graduation: GraduationCap,
  dumbbell: Dumbbell,
  coffee: Coffee,
  pill: Pill,
  wifi: Wifi,
  bus: Bus,
  smartphone: Smartphone,
  palette: Palette,
  gift: Gift,
  music: Music,
  plane: Plane,
  more: MoreHorizontal,
  shieldCheck: ShieldCheck,
  creditCard: CreditCard,
  pawPrint: PawPrint,
  lightbulb: Lightbulb,
  flame: Flame,
  droplets: Droplets,
  tvMinimalPlay: TvMinimalPlay,
  // Alias de los slugs que usa el backend (seeder/factory): food/transport/entertainment/shopping/health/other
  food: UtensilsCrossed,
  transport: Car,
  entertainment: Gamepad2,
  shopping: ShoppingCart,
  health: Heart,
  other: MoreHorizontal,
};

export const ICON_OPTIONS = [
  // Categorías por defecto (orden principal)
  { id: "shoppingCart", name: "Supermercado" },
  { id: "home", name: "Alquiler" },
  { id: "shieldCheck", name: "Seguros" },
  { id: "dumbbell", name: "Deportes" },
  // Resto de categorías disponibles
  { id: "car", name: "Auto" },
  { id: "gamepad", name: "Entretenimiento" },
  { id: "heart", name: "Salud" },
  { id: "graduation", name: "Educación" },
  { id: "creditCard", name: "Créditos" },
  { id: "pawPrint", name: "Mascotas" },
  { id: "pill", name: "Medicinas" },
  { id: "wifi", name: "Internet" },
  { id: "bus", name: "Transporte" },
  { id: "smartphone", name: "Teléfono" },
  { id: "gift", name: "Regalos" },
  { id: "music", name: "Música" },
  { id: "plane", name: "Viajes" },
  { id: "tvMinimalPlay", name: "Streaming" },
  { id: "more", name: "Otros" },
];

export function getLucideIcon(iconName: string): LucideIcon {
  return LUCIDE_CATEGORY_ICONS[iconName] || LUCIDE_CATEGORY_ICONS["more"];
}
