"use client";
import { Btn, Modal } from "@/components/ui";

interface Props {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	onConfirm: () => void;
	onClose: () => void;
}

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = "Supprimer",
	onConfirm,
	onClose,
}: Props) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title={title}
			footer={
				<>
					<Btn variant="secondary" onClick={onClose}>
						Annuler
					</Btn>
					<Btn
						variant="primary"
						onClick={() => {
							onConfirm();
							onClose();
						}}
						className="bg-[rgba(255,180,171,0.15)] text-[var(--err)] hover:bg-[rgba(255,180,171,0.25)]"
					>
						{confirmLabel}
					</Btn>
				</>
			}
		>
			<p className="text-[14px] text-[var(--muted)] leading-relaxed">
				{message}
			</p>
		</Modal>
	);
}
