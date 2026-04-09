/**
 * Mapeo de iconos de Lucide para categorías
 * 20 iconos adaptados para diferentes tipos de gastos
 */
import type { ComponentType } from "react";
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
} from "lucide-react";

export const LUCIDE_CATEGORY_ICONS: Record<string, ComponentType<{ size?: number; color?: string }>> = {
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
};

export const ICON_OPTIONS = [
  { id: "utensilsCrossed", name: "Comida" },
  { id: "shoppingCart", name: "Compras" },
  { id: "car", name: "Auto/Coche" },
  { id: "wrench", name: "Servicios" },
  { id: "gamepad", name: "Entretenimiento" },
  { id: "heart", name: "Salud" },
  { id: "zap", name: "Energía" },
  { id: "home", name: "Vivienda" },
  { id: "graduation", name: "Educación" },
  { id: "dumbbell", name: "Deportes" },
  { id: "coffee", name: "Bebidas" },
  { id: "pill", name: "Medicinas" },
  { id: "wifi", name: "Internet" },
  { id: "bus", name: "Transporte" },
  { id: "smartphone", name: "Teléfono" },
  { id: "palette", name: "Arte" },
  { id: "gift", name: "Regalos" },
  { id: "music", name: "Música" },
  { id: "plane", name: "Viajes" },
  { id: "more", name: "Otros" },
];

export function getLucideIcon(iconName: string): ComponentType<{ size?: number; color?: string }> {
  return LUCIDE_CATEGORY_ICONS[iconName] || LUCIDE_CATEGORY_ICONS["more"];
}
