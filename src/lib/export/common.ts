import { STATUS_LABEL, PRIORITY_LABEL } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const formatters = {
	status: (s: string) => STATUS_LABEL[s as keyof typeof STATUS_LABEL] || s,
	priority: (p: string) => PRIORITY_LABEL[p as keyof typeof PRIORITY_LABEL] || p,
	date: (d: string) => (d ? format(new Date(d), "dd/MM/yyyy", { locale: fr }) : "-"),
	dateTime: (d: string) =>
		d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: fr }) : "-",
};

export function sanitizeFilename(name: string): string {
	return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

export function downloadFile(
	content: string,
	filename: string,
	mimeType = "text/plain",
): void {
	const blob = new Blob([content], { type: mimeType });
	downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function downloadJSON<T>(data: T, filename: string): void {
	const json = JSON.stringify(data, null, 2);
	downloadFile(json, filename, "application/json");
}

export function downloadCSV(rows: (string | number)[][], filename: string): void {
	const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
	downloadFile(csv, filename, "text/csv");
}

export function downloadMarkdown(content: string, filename: string): void {
	downloadFile(content, filename, "text/markdown");
}
