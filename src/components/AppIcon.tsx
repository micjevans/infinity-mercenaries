import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  LayoutDashboard,
  Plus,
  Trash2,
  Users,
  X,
  type LucideIcon
} from "lucide-react";

export const appIcons = {
  add: Plus,
  back: ArrowLeft,
  close: X,
  dashboard: LayoutDashboard,
  down: ChevronDown,
  info: Info,
  remove: X,
  trash: Trash2,
  troopers: Users,
  up: ChevronUp
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof appIcons;

export function AppIcon({ name, size = 18, strokeWidth = 2.4 }: { name: AppIconName; size?: number; strokeWidth?: number }) {
  const Icon = appIcons[name];
  return <Icon aria-hidden="true" focusable="false" size={size} strokeWidth={strokeWidth} />;
}
