"use client";
import { ChevronDown, ChevronRight, Search, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconBtn } from "@/components/ui";
import { useStore } from "@/lib/store";

const VIEW_NAMES: Record<string, string> = {
  dashboard: "Projets",
  breakdown: "Découpage fonctionnel",
  backlog: "Backlog",
  gantt: "Planning",
  schedule: "Horaires",
};

export default function Topbar() {
  const {
    currentView,
    currentProjectId,
    projects,
    setCurrentProject,
    setCurrentView,
  } = useStore();
  const project = projects.find((p) => p.id === currentProjectId);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const needsProject = ["breakdown", "backlog", "gantt", "schedule"].includes(
    currentView,
  );

  return (
    <header className="h-14 bg-[var(--bg)] border-b border-[rgba(71,71,71,0.15)] flex items-center px-5 gap-3 flex-shrink-0">
      {/* Project selector */}
      {needsProject ? (
        <div className="relative" ref={dropRef}>
          <button
            type="button"
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold tracking-widest uppercase text-[var(--blue)] hover:bg-[var(--s2)] transition-colors cursor-pointer bg-transparent border-0"
          >
            {project?.name ?? "Projet"}
            <ChevronDown
              size={12}
              className={`transition-transform ${dropOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--s3)] border border-[rgba(71,71,71,0.3)] min-w-[200px] shadow-2xl">
              {projects.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setCurrentProject(p.id);
                    setDropOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-[12px] font-semibold transition-colors bg-transparent border-0 cursor-pointer block ${
                    p.id === currentProjectId
                      ? "text-[var(--blue)] bg-[var(--blue-bg)]"
                      : "text-[var(--txt)] hover:bg-[var(--s4)]"
                  }`}
                >
                  {p.name}
                  <span className="block text-[10px] font-normal text-[var(--dim)] mt-0.5">
                    {p.desc || "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="text-[12px] font-bold tracking-widest uppercase text-[var(--blue)]">
          Gantty
        </span>
      )}

      {needsProject && (
        <>
          <ChevronRight size={13} className="text-[var(--dim)]" />
          <span className="text-[12px] font-bold tracking-widest uppercase text-[var(--txt)]">
            {VIEW_NAMES[currentView] ?? currentView}
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        <IconBtn title="Recherche" onClick={() => setCurrentView("dashboard")}>
          <Search size={17} />
        </IconBtn>
        <IconBtn title="Paramètres">
          <Settings size={17} />
        </IconBtn>
      </div>
    </header>
  );
}
