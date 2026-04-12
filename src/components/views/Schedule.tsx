"use client";
import { Check } from "lucide-react";
import { useState } from "react";
import { ExceptionList } from "@/components/schedule/ExceptionList";
import { WorkDays } from "@/components/schedule/WorkDays";
import { WorkHours } from "@/components/schedule/WorkHours";
import { Btn, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Schedule() {
	const { currentProject } = useStore();
	const project = currentProject();
	const [saved, setSaved] = useState(false);

	if (!project)
		return (
			<div className="p-10 text-[var(--dim)]">Sélectionnez un projet.</div>
		);

	function handleSave() {
		setSaved(true);
		setTimeout(() => setSaved(false), 1500);
	}

	return (
		<div className="p-8 overflow-auto h-full">
			<PageHeader
				title="Horaires de travail"
				sub={project.name}
				action={
					<Btn
						variant="primary"
						icon={saved ? <Check size={15} /> : undefined}
						onClick={handleSave}
					>
						{saved ? "Enregistré ✓" : "Enregistrer"}
					</Btn>
				}
			/>
			<div className="max-w-lg">
				<WorkDays projectId={project.id} activeDays={project.schedule.days} />
				<WorkHours
					projectId={project.id}
					start={project.schedule.start}
					end={project.schedule.end}
				/>
				<ExceptionList
					projectId={project.id}
					exceptions={project.schedule.exceptions ?? []}
				/>
			</div>
		</div>
	);
}
