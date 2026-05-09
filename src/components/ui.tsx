"use client";
import { X, Download } from "lucide-react";
import type React from "react";
import type { Priority, Status } from "@/lib/store";
import {
	cn,
	PRIORITY_COLOR,
	PRIORITY_LABEL,
	STATUS_COLOR,
	STATUS_LABEL,
} from "@/lib/utils";

export function StatusBadge({ status }: { status: Status }) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-1 text-[11px] font-black tracking-widest uppercase rounded-none",
				STATUS_COLOR[status],
			)}
		>
			{STATUS_LABEL[status]}
		</span>
	);
}

export function PriorityBadge({ priority }: { priority: Priority }) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-1 text-[11px] font-black tracking-widest uppercase rounded-none",
				PRIORITY_COLOR[priority],
			)}
		>
			{PRIORITY_LABEL[priority]}
		</span>
	);
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost";
	icon?: React.ReactNode;
}

export function Btn({
	variant = "secondary",
	icon,
	children,
	className,
	...props
}: BtnProps) {
	const base =
		"inline-flex items-center gap-2 px-4 min-h-[40px] text-[11px] font-black tracking-widest uppercase rounded-none transition-all duration-150 cursor-pointer border-0 disabled:opacity-40";
	const variants = {
		primary: "bg-white text-[#001452] hover:bg-[var(--txt)]",
		secondary:
			"bg-transparent text-[var(--muted)] border border-[rgba(71,71,71,0.3)] hover:text-white hover:border-[var(--outline)]",
		ghost:
			"bg-transparent text-[var(--muted)] hover:text-white hover:bg-[var(--s3)]",
	};
	return (
		<button className={cn(base, variants[variant], className)} {...props}>
			{icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
			{children}
		</button>
	);
}

export function IconBtn({
	className,
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className={cn(
				"w-10 h-10 flex items-center justify-center rounded-none bg-transparent border-0 text-[var(--muted)] hover:text-white hover:bg-[var(--s3)] transition-all cursor-pointer",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
	if (!open) return null;
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="bg-[var(--s2)] w-[520px] max-w-[92vw] max-h-[88vh] overflow-y-auto border border-[rgba(71,71,71,0.2)]">
				<div className="flex items-center justify-between px-7 py-5 border-b border-[rgba(71,71,71,0.15)]">
					<span className="text-[15px] font-black tracking-tight">{title}</span>
					<IconBtn onClick={onClose}>
						<X size={18} />
					</IconBtn>
				</div>
				<div className="px-7 py-7">{children}</div>
				{footer && (
					<div className="flex justify-end gap-3 px-7 py-5 border-t border-[rgba(71,71,71,0.15)]">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}

export function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mb-5">
			<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
				{label}
			</div>
			{children}
		</div>
	);
}

export const inputCls =
	"w-full bg-transparent border-0 border-b border-[rgba(71,71,71,0.3)] text-[var(--txt)] font-[Inter] text-[14px] py-2 px-0 outline-none focus:border-[var(--blue)] transition-colors duration-200";

export function Input({
	className,
	...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
	return <input className={cn(inputCls, className)} {...props} />;
}

export function Select({
	className,
	children,
	...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select
			className={cn(inputCls, "cursor-pointer", className)}
			style={{ colorScheme: "dark" }}
			{...props}
		>
			{children}
		</select>
	);
}

export function Textarea({
	className,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={cn(
				"w-full bg-[var(--bg)] border-0 border-b border-[rgba(71,71,71,0.2)] text-[var(--txt)] font-[Inter] text-[13px] p-3 outline-none focus:border-[var(--blue)] transition-colors resize-y min-h-[100px] leading-relaxed",
				className,
			)}
			{...props}
		/>
	);
}

export function PageHeader({
	title,
	sub,
	action,
}: {
	title: string;
	sub?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex items-start justify-between mb-10">
			<div>
				<h1 className="text-[32px] font-black tracking-[-0.03em] text-white leading-none">
					{title}
				</h1>
				{sub && (
					<div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--muted)] mt-2">
						{sub}
					</div>
				)}
			</div>
			{action && <div className="flex gap-2 items-center">{action}</div>}
		</div>
	);
}

export function ProgressBar({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-[2px] bg-[var(--s4)]">
				<div
					className="h-full bg-[var(--blue)] transition-all duration-500"
					style={{ width: `${value}%` }}
				/>
			</div>
			<span className="text-[11px] font-bold text-[var(--muted)] w-8 text-right">
				{value}%
			</span>
		</div>
	);
}

interface ExportOption {
	value: string;
	label: string;
	description: string;
}

interface ExportModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	options: ExportOption[];
	onExport: (format: string) => void;
	isLoading?: boolean;
}

export function ExportModal({
	open,
	onClose,
	title,
	options,
	onExport,
	isLoading = false,
}: ExportModalProps) {
	return (
		<Modal open={open} onClose={onClose} title={title}>
			<div className="space-y-3">
				{options.map((opt) => (
					<button
						key={opt.value}
						onClick={() => {
							onExport(opt.value);
							onClose();
						}}
						disabled={isLoading}
						className="w-full flex items-start gap-3 p-3 rounded border border-[rgba(71,71,71,0.3)] hover:bg-[var(--s2)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Download size={18} className="text-[var(--blue)] flex-shrink-0 mt-0.5" />
						<div>
							<div className="text-[13px] font-medium text-[var(--txt)]">
								{opt.label}
							</div>
							<div className="text-[11px] text-[var(--dim)] mt-1">
								{opt.description}
							</div>
						</div>
					</button>
				))}
			</div>
		</Modal>
	);
}
