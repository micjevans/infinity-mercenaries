import {
  Award,
  ArrowLeft,
  Check,
  Circle,
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Crown,
  Diamond,
  Info,
  LayoutDashboard,
  Shield,
  Star,
  Target,
  Triangle,
  Plus,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

export const appIcons = {
  add: Plus,
  check: Check,
  back: ArrowLeft,
  close: X,
  dashboard: LayoutDashboard,
  down: ChevronDown,
  info: Info,
  rank0: Circle,
  rank1: Triangle,
  rank2: ChevronUp,
  rank3: ChevronsUp,
  rank4: Diamond,
  rank5: Shield,
  rank6: Star,
  rank7: Crown,
  rank7Alt: Award,
  target: Target,
  remove: X,
  trash: Trash2,
  troopers: Users,
  up: ChevronUp,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof appIcons;

export function AppIcon({
  name,
  size = 18,
  strokeWidth = 2.4,
}: {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = appIcons[name];
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
