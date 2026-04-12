"use client";
import { type Project, useStore } from "@/lib/store";

interface Props {
	project: Project;
}

const labelCls =
	"text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-1";
const inputCls =
	"bg-transparent border-0 border-b border-[rgba(71,71,71,0.25)] text-[var(--txt)] text-[13px] font-semibold px-0 py-1 outline-none focus:border-[var(--blue)] transition-colors w-36";

export function ProjectDatesBar({ project }: Props) {
	const { updateProject } = useStore();
	const upd = (key: "start" | "end", val: string) =>
		updateProject(project.id, { [key]: val });

	return (
		<div className="flex gap-8 mb-8 px-1">
			<div>
				<div className={labelCls}>Date de début</div>
				<input
					type="date"
					value={project.start}
					onChange={(e) => upd("start", e.target.value)}
					style={{ colorScheme: "dark" }}
					className={inputCls}
				/>
			</div>
			<div>
				<div className={labelCls}>Date de fin</div>
				<input
					type="date"
					value={project.end}
					onChange={(e) => upd("end", e.target.value)}
					style={{ colorScheme: "dark" }}
					className={inputCls}
				/>
			</div>
			{project.start && project.end && (
				<div>
					<div className={labelCls}>Durée</div>
					<div className="text-[13px] font-semibold text-[var(--muted)] py-1">
						{Math.ceil(
							(new Date(project.end).getTime() -
								new Date(project.start).getTime()) /
								86400000,
						)}{" "}
						jours
					</div>
				</div>
			)}
		</div>
	);
}
