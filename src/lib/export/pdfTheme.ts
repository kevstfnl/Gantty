import type jsPDF from "jspdf";

type RGB = [number, number, number];

export type SummaryStat = {
	label: string;
	value: string;
	percent?: number;
};

export const PDF_THEME = {
	colors: {
		ink: [24, 24, 27] as RGB,
		muted: [113, 113, 122] as RGB,
		border: [212, 212, 216] as RGB,
		subtle: [250, 250, 250] as RGB,
		panel: [244, 244, 245] as RGB,
		white: [255, 255, 255] as RGB,
	},
	margin: 15,
	footerHeight: 15,
};

export function buildSummaryStats(stats: SummaryStat[]): SummaryStat[] {
	return stats.map((stat) => ({
		...stat,
		percent: stat.percent === undefined ? undefined : Math.round(stat.percent),
	}));
}

export function getPdfTableStyles() {
	return {
		theme: "grid" as const,
		styles: {
			font: "helvetica",
			fontSize: 8,
			cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
			lineColor: PDF_THEME.colors.border,
			lineWidth: 0.1,
			textColor: PDF_THEME.colors.ink,
			valign: "middle" as const,
		},
		headStyles: {
			fillColor: PDF_THEME.colors.ink,
			textColor: 255,
			fontStyle: "bold" as const,
			fontSize: 8,
		},
		bodyStyles: {
			fillColor: PDF_THEME.colors.white,
			textColor: PDF_THEME.colors.ink,
		},
		alternateRowStyles: {
			fillColor: PDF_THEME.colors.subtle,
		},
	};
}

export function drawReportHeader(
	doc: jsPDF,
	title: string,
	subtitle: string,
	meta?: string,
): number {
	const pageWidth = doc.internal.pageSize.getWidth();

	doc.setFillColor(...PDF_THEME.colors.subtle);
	doc.rect(0, 0, pageWidth, 38, "F");
	doc.setDrawColor(...PDF_THEME.colors.border);
	doc.setLineWidth(0.2);
	doc.line(PDF_THEME.margin, 38, pageWidth - PDF_THEME.margin, 38);

	doc.setFont("helvetica", "normal");
	doc.setFontSize(7);
	doc.setTextColor(...PDF_THEME.colors.muted);
	doc.text("RAPPORT FONCTIONNEL", PDF_THEME.margin, 11);

	doc.setFont("helvetica", "bold");
	doc.setFontSize(19);
	doc.setTextColor(...PDF_THEME.colors.ink);
	doc.text(title, PDF_THEME.margin, 22, { maxWidth: pageWidth - 70 });

	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.setTextColor(...PDF_THEME.colors.muted);
	doc.text(subtitle, PDF_THEME.margin, 31);

	if (meta) {
		doc.setFontSize(8);
		doc.text(meta, pageWidth - PDF_THEME.margin, 16, { align: "right" });
	}

	return 50;
}

export function drawSummaryStats(
	doc: jsPDF,
	y: number,
	stats: SummaryStat[],
): number {
	const pageWidth = doc.internal.pageSize.getWidth();
	const gap = 4;
	const columns = Math.min(stats.length, 4);
	const width = (pageWidth - PDF_THEME.margin * 2 - gap * (columns - 1)) / columns;

	for (const [index, stat] of stats.entries()) {
		const x = PDF_THEME.margin + (index % columns) * (width + gap);
		const rowY = y + Math.floor(index / columns) * 22;

		doc.setFillColor(...PDF_THEME.colors.white);
		doc.setDrawColor(...PDF_THEME.colors.border);
		doc.roundedRect(x, rowY, width, 18, 2, 2, "FD");
		doc.setFont("helvetica", "normal");
		doc.setFontSize(7);
		doc.setTextColor(...PDF_THEME.colors.muted);
		doc.text(stat.label.toUpperCase(), x + 3, rowY + 6);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(12);
		doc.setTextColor(...PDF_THEME.colors.ink);
		doc.text(stat.value, x + 3, rowY + 14);

		if (stat.percent !== undefined) {
			drawProgressBar(doc, x + width - 27, rowY + 12, 20, stat.percent);
		}
	}

	return y + Math.ceil(stats.length / columns) * 22 + 4;
}

export function drawSectionHeader(
	doc: jsPDF,
	y: number,
	title: string,
	meta?: string,
): number {
	const pageWidth = doc.internal.pageSize.getWidth();

	doc.setFillColor(...PDF_THEME.colors.panel);
	doc.setDrawColor(...PDF_THEME.colors.border);
	doc.roundedRect(PDF_THEME.margin, y, pageWidth - PDF_THEME.margin * 2, 12, 1.5, 1.5, "FD");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.setTextColor(...PDF_THEME.colors.ink);
	doc.text(title, PDF_THEME.margin + 3, y + 7.5);

	if (meta) {
		doc.setFont("helvetica", "normal");
		doc.setFontSize(7);
		doc.setTextColor(...PDF_THEME.colors.muted);
		doc.text(meta, pageWidth - PDF_THEME.margin - 3, y + 7.5, { align: "right" });
	}

	return y + 16;
}

export function drawProgressBar(
	doc: jsPDF,
	x: number,
	y: number,
	width: number,
	percent: number,
): void {
	const value = Math.max(0, Math.min(100, percent));
	doc.setFillColor(228, 228, 231);
	doc.roundedRect(x, y - 3, width, 3, 1.5, 1.5, "F");
	doc.setFillColor(...PDF_THEME.colors.muted);
	doc.roundedRect(x, y - 3, (width * value) / 100, 3, 1.5, 1.5, "F");
}

export function ensurePdfSpace(doc: jsPDF, y: number, minHeight: number): number {
	const pageHeight = doc.internal.pageSize.getHeight();
	if (y + minHeight <= pageHeight - PDF_THEME.footerHeight) return y;
	doc.addPage();
	return 18;
}

export function addPdfFooters(doc: jsPDF, label: string): void {
	const pageCount = doc.getNumberOfPages();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	for (let page = 1; page <= pageCount; page++) {
		doc.setPage(page);
		doc.setDrawColor(...PDF_THEME.colors.border);
		doc.line(PDF_THEME.margin, pageHeight - 12, pageWidth - PDF_THEME.margin, pageHeight - 12);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(7);
		doc.setTextColor(...PDF_THEME.colors.muted);
		doc.text(label, PDF_THEME.margin, pageHeight - 7);
		doc.text(`Page ${page}/${pageCount}`, pageWidth - PDF_THEME.margin, pageHeight - 7, {
			align: "right",
		});
	}
}
