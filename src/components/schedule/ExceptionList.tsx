"use client";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Btn } from "@/components/ui";
import { type Schedule, useStore } from "@/lib/store";
import { ScheduleSection } from "./ScheduleSection";

interface Props {
	projectId: string;
	exceptions: Schedule["exceptions"];
}

export function ExceptionList({ projectId, exceptions }: Props) {
	const { updateSchedule } = useStore();
	const [date, setDate] = useState("");
	const [label, setLabel] = useState("");

	function add() {
		if (!date) return;
		const next = [...exceptions, { date, label }].sort((a, b) =>
			a.date.localeCompare(b.date),
		);
		updateSchedule(projectId, { exceptions: next });
		setDate("");
		setLabel("");
	}

	function remove(i: number) {
		updateSchedule(projectId, {
			exceptions: exceptions.filter((_, idx) => idx !== i),
		});
	}

	return (
		<ScheduleSection title="Exceptions (jours fériés / absences)">
			<div className="flex gap-3 items-end mb-5 flex-wrap">
				<div>
					<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
						Date
					</div>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						style={{ colorScheme: "dark" }}
						className="bg-[var(--s2)] border-0 border-b border-[rgba(71,71,71,0.3)] text-[var(--txt)] text-[13px] px-3 py-2 outline-none focus:border-[var(--blue)] transition-colors"
					/>
				</div>
				<div className="flex-1 min-w-[140px]">
					<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
						Libellé
					</div>
					<input
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="ex: Noël, Congé..."
						className="w-full bg-transparent border-0 border-b border-[rgba(71,71,71,0.3)] text-[var(--txt)] text-[13px] px-0 py-2 outline-none focus:border-[var(--blue)] transition-colors placeholder:text-[var(--dim)]"
					/>
				</div>
				<Btn variant="primary" icon={<Plus size={15} />} onClick={add}>
					Ajouter
				</Btn>
			</div>

			<div className="flex flex-wrap gap-2">
				{exceptions.length === 0 ? (
					<div className="text-[12px] text-[var(--dim)]">
						Aucune exception définie.
					</div>
				) : (
					exceptions.map((exc, i) => (
						<div
							key={`ex-${i}`}
							className="inline-flex items-center gap-2 bg-[var(--s2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)] border border-[rgba(71,71,71,0.2)]"
						>
							<span>
								{exc.date}
								{exc.label ? ` — ${exc.label}` : ""}
							</span>
              <button
                type="button"
								onClick={() => remove(i)}
								className="text-[var(--dim)] hover:text-[var(--err)] bg-transparent border-0 cursor-pointer flex items-center"
							>
								<X size={12} />
							</button>
						</div>
					))
				)}
			</div>
		</ScheduleSection>
	);
}
