interface Props {
	message: string;
	action?: React.ReactNode;
}

export function EmptyState({ message, action }: Props) {
	return (
		<div className="py-16 flex flex-col items-center gap-4 text-center">
			<p className="text-[13px] text-[var(--dim)]">{message}</p>
			{action}
		</div>
	);
}
