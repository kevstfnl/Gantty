"use client";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import type { Feature, Module, Sprint } from "@/lib/store";

export const PROJ_H = 52;
export const SPRINT_H = 36;
export const MODULE_H = 32;
export const LABEL_W = 240;

interface RowProps {
	feature: Feature;
	moduleColor: string;
	rowH: number;
	onDragStart: (id: string) => void;
	onDragOver: (id: string) => void;
	onDrop: () => void;
	isDragging: boolean;
	isOver: boolean;
	addingDepFrom: string | null;
}

function FeatureLabelRow({
	feature: f,
	moduleColor,
	rowH,
	onDragStart,
	onDragOver,
	onDrop,
	isDragging,
	isOver,
	addingDepFrom,
}: RowProps) {
	return (
		<div
			className={`flex items-center px-2 pl-2 border-b border-[rgba(71,71,71,0.07)] group transition-colors ${isOver ? "bg-[rgba(0,76,237,0.08)]" : isDragging ? "opacity-40" : ""}`}
			style={{
				height: rowH,
				borderLeft: `3px solid ${moduleColor || "transparent"}`,
			}}
			draggable
			onDragStart={() => onDragStart(f.id)}
			onDragOver={(e) => {
				e.preventDefault();
				onDragOver(f.id);
			}}
			onDrop={onDrop}
		>
			<div className="opacity-0 group-hover:opacity-60 transition-opacity cursor-grab mr-1.5 flex-shrink-0">
				<GripVertical size={12} className="text-[var(--dim)]" />
			</div>
			<span className="text-[12px] text-[var(--muted)] truncate flex-1 leading-none">
				{f.name}
			</span>
		</div>
	);
}

interface Props {
	projectName: string;
	features: Feature[];
	modules: Module[];
	sprints: Sprint[];
	headH: number;
	rowH: number;
	scrollRef: React.RefObject<HTMLDivElement | null>;
	onReorder: (orderedIds: string[]) => void;
	addingDepFrom: string | null;
}

export function GanttLabels({
	projectName,
	features,
	modules,
	sprints,
	headH,
	rowH,
	scrollRef,
	onReorder,
	addingDepFrom,
}: Props) {
	const [dragId, setDragId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const moduleMap = new Map(modules.map((m) => [m.id, m]));

	function handleDrop(targetId: string) {
		if (!dragId || dragId === targetId) {
			setDragId(null);
			setOverId(null);
			return;
		}
		const ids = features.map((f) => f.id);
		const from = ids.indexOf(dragId),
			to = ids.indexOf(targetId);
		if (from === -1 || to === -1) return;
		const reordered = [...ids];
		reordered.splice(from, 1);
		reordered.splice(to, 0, dragId);
		onReorder(reordered);
		setDragId(null);
		setOverId(null);
	}

	// Build rows with module separators
	const rows: (
		| { type: "module"; module: Module }
		| { type: "feature"; feature: Feature }
	)[] = [];
	let lastMid = "__NONE__";
	features.forEach((f) => {
		const mid = f.moduleId || "";
		if (mid !== lastMid) {
			lastMid = mid;
			if (modules.length > 0) {
				const mod = moduleMap.get(mid);
				rows.push({
					type: "module",
					module: mod ?? {
						id: "",
						name: "Sans module",
						color: "var(--dim)",
						description: "",
					},
				});
			}
		}
		rows.push({ type: "feature", feature: f });
	});

	return (
		<div
			ref={scrollRef}
			className="flex-shrink-0 bg-[var(--s1)] border-r border-[rgba(71,71,71,0.15)] overflow-hidden"
			style={{ width: LABEL_W }}
		>
			<div
				className="bg-[var(--bg)] border-b border-[rgba(71,71,71,0.2)]"
				style={{ height: headH }}
			/>

			<div
				className="flex items-center px-5 border-b border-[rgba(71,71,71,0.12)]"
				style={{ height: PROJ_H }}
			>
				<span className="text-[13px] font-bold text-[var(--txt)] truncate">
					{projectName}
				</span>
			</div>

			{sprints
				.filter((s) => s.start && s.end)
				.map((s) => (
					<div
						key={s.id}
						className="flex items-center px-5 border-b border-[rgba(71,71,71,0.1)]"
						style={{ height: SPRINT_H }}
					>
						<span className="text-[10px] font-black tracking-widest uppercase text-[rgba(255,255,255,0.35)] truncate">
							{s.name}
						</span>
					</div>
				))}

			{rows.map((row) =>
				row.type === "module" ? (
					<div
						key={`mod-${row.module.id}`}
						className="flex items-center px-4 border-b border-[rgba(71,71,71,0.12)]"
						style={{ height: MODULE_H, background: "var(--s2)" }}
					>
						<div
							className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
							style={{ background: row.module.color }}
						/>
						<span
							className="text-[10px] font-black tracking-widest uppercase truncate"
							style={{ color: row.module.color }}
						>
							{row.module.name}
						</span>
					</div>
				) : (
					<FeatureLabelRow
						key={row.feature.id}
						feature={row.feature}
						moduleColor={
							moduleMap.get(row.feature.moduleId)?.color ?? "transparent"
						}
						rowH={rowH}
						onDragStart={setDragId}
						onDragOver={setOverId}
						onDrop={() => handleDrop(row.feature.id)}
						isDragging={dragId === row.feature.id}
						isOver={overId === row.feature.id}
						addingDepFrom={addingDepFrom}
					/>
				),
			)}
		</div>
	);
}
