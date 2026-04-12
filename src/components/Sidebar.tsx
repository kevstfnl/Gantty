"use client";
import {
  Clock,
  GanttChartSquare,
  Kanban,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "dashboard", icon: LayoutGrid, label: "Projets" },
  { id: "breakdown", icon: Layers, label: "Découpage" },
  { id: "backlog", icon: Kanban, label: "Backlog" },
  { id: "gantt", icon: GanttChartSquare, label: "Planning" },
];
const NAV_BOTTOM = [{ id: "schedule", icon: Clock, label: "Horaires" }];

export default function Sidebar() {
  const { currentView, setCurrentView } = useStore();

  const NavItem = ({
    id,
    icon: Icon,
    label,
  }: {
    id: string;
    icon: React.ElementType;
    label: string;
  }) => {
    const active = currentView === id;
    return (
      <button
        type="button"
        title={label}
        onClick={() => setCurrentView(id)}
        className={cn(
          "relative w-12 h-12 flex items-center justify-center cursor-pointer rounded-none transition-all duration-150 border-0",
          active
            ? "text-[var(--blue)] bg-[var(--blue-bg)]"
            : "text-[var(--muted)] bg-transparent hover:text-white hover:bg-[var(--s2)]",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-[var(--blue)]" />
        )}
        <Icon size={20} strokeWidth={1.8} />
      </button>
    );
  };

  return (
    <aside className="w-16 bg-[var(--s1)] flex flex-col items-center py-5 gap-1 border-r border-[rgba(71,71,71,0.15)] z-10 flex-shrink-0">
      <div className="mb-5 text-xl font-black text-white tracking-[-0.05em]">
        M
      </div>
      {NAV.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
      <div className="flex-1" />
      {NAV_BOTTOM.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
    </aside>
  );
}
