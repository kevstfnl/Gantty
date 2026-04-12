"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddProjectModal } from "@/components/dashboard/AddProjectModal";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Btn, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Dashboard() {
	const { projects, setCurrentProject, setCurrentView } = useStore();
	const [modalOpen, setModalOpen] = useState(false);

	function openProject(id: string) {
		setCurrentProject(id);
		setCurrentView("breakdown");
	}

	return (
		<div className="p-8 overflow-auto h-full">
			<PageHeader
				title="Projets"
				sub="Clinical Architect Workspace"
				action={
					<Btn
						variant="primary"
						icon={<Plus size={15} />}
						onClick={() => setModalOpen(true)}
					>
						Nouveau projet
					</Btn>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
				{projects.map((p) => (
					<ProjectCard key={p.id} project={p} onOpen={openProject} />
				))}
				<div
					onClick={() => setModalOpen(true)}
					className="border border-dashed border-[rgba(71,71,71,0.25)] flex items-center justify-center gap-2 text-[12px] font-bold tracking-widest uppercase text-[var(--dim)] cursor-pointer hover:border-[var(--blue)] hover:text-[var(--blue)] hover:bg-[var(--blue-bg)] transition-all min-h-[180px]"
				>
					<Plus size={15} /> Nouveau projet
				</div>
			</div>

			<AddProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
