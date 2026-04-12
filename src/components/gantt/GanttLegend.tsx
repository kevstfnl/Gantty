import { GripHorizontal } from "lucide-react";

const ITEMS = [
	{ color: "rgba(93,218,138,0.45)", label: "Terminé" },
	{ color: "#004ced", label: "En cours" },
	{ color: "rgba(0,76,237,0.4)", label: "À faire" },
];

export function GanttLegend() {
	return (
		<div className="flex items-center gap-6 mb-4 flex-wrap">
			{ITEMS.map(({ color, label }) => (
				<div
					key={label}
					className="flex items-center gap-2 text-[11px] text-[var(--muted)]"
				>
					<div
						className="w-3 h-3 shrink-0"
						style={{ background: color }}
					/>
					{label}
				</div>
			))}
			<div className="flex items-center gap-2 text-[11px] text-[var(--dim)] ml-2">
				<GripHorizontal size={12} />
				Glisser pour déplacer · Poignée droite pour redimensionner
			</div>
		</div>
	);
}
