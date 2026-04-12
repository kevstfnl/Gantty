interface Props {
	title: string;
	children: React.ReactNode;
}

export function ScheduleSection({ title, children }: Props) {
	return (
		<div className="bg-[var(--s1)] p-7 mb-4 border border-[rgba(71,71,71,0.1)]">
			<div className="text-[11px] font-black tracking-widest uppercase text-[var(--muted)] mb-5">
				{title}
			</div>
			{children}
		</div>
	);
}
