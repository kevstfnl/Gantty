import { type Project } from "@/lib/store";
import { formatters, sanitizeFilename, downloadMarkdown } from "./common";
import {
	addPdfFooters,
	buildSummaryStats,
	drawProgressBar,
	drawReportHeader,
	drawSectionHeader,
	drawSummaryStats,
	ensurePdfSpace,
	getPdfTableStyles,
	PDF_THEME,
} from "./pdfTheme";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

export function generateBreakdownMarkdown(project: Project): string {
	const modules = project.modules ?? [];
	let markdown = `# ${project.name} - Découpage Fonctionnel\n\n`;

	if (project.start || project.end) {
		markdown += `**Période**: ${formatters.date(project.start)} → ${formatters.date(project.end)}\n\n`;
	}

	for (const mod of modules) {
		const features = project.features.filter((f) => f.moduleId === mod.id);
		const done = features.filter((f) => f.status === "done").length;
		const total = features.length;
		const pct = total ? Math.round((done / total) * 100) : 0;
		const totalDays = features.reduce((s, f) => s + (f.days || 0), 0);

		markdown += `## ${mod.name}\n`;
		if (mod.description) {
			markdown += `${mod.description}\n\n`;
		}
		markdown += `**Progression**: ${done}/${total} (${pct}%) | **Estimé**: ${totalDays}j\n\n`;

		if (features.length === 0) {
			markdown += "Aucune fonctionnalité.\n\n";
		} else {
			markdown += "| Fonctionnalité | Statut | Priorité | Jours |\n";
			markdown += "|---|---|---|---|\n";
			for (const f of features) {
				markdown += `| ${f.name} | ${formatters.status(f.status)} | ${formatters.priority(f.priority)} | ${f.days} |\n`;
			}
			markdown += "\n";
		}
	}

	// Orphans
	const orphans = project.features.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphans.length > 0) {
		markdown += `## Sans Module\n`;
		markdown += "| Fonctionnalité | Statut | Priorité | Jours |\n";
		markdown += "|---|---|---|---|\n";
		for (const f of orphans) {
			markdown += `| ${f.name} | ${formatters.status(f.status)} | ${formatters.priority(f.priority)} | ${f.days} |\n`;
		}
	}

	return markdown;
}

export async function generateBreakdownPDF(project: Project): Promise<void> {
	const doc = new jsPDF();
	const modules = project.modules ?? [];
	const pageWidth = doc.internal.pageSize.getWidth();
	let yPosition = drawReportHeader(
		doc,
		project.name,
		"Découpage fonctionnel",
		project.start || project.end
			? `${formatters.date(project.start)} - ${formatters.date(project.end)}`
			: undefined,
	);

	const totalFeatures = project.features.length;
	const doneFeatures = project.features.filter((f) => f.status === "done").length;
	const totalDays = project.features.reduce((sum, f) => sum + f.days, 0);
	const progress = totalFeatures > 0 ? (doneFeatures / totalFeatures) * 100 : 0;

	yPosition = drawSummaryStats(
		doc,
		yPosition,
		buildSummaryStats([
			{ label: "Fonctionnalités", value: String(totalFeatures) },
			{ label: "Complétées", value: `${doneFeatures}/${totalFeatures}`, percent: progress },
			{ label: "Charge", value: `${totalDays}j` },
			{ label: "Modules", value: String(modules.length) },
		]),
	);

	for (const mod of modules) {
		const features = project.features.filter((f) => f.moduleId === mod.id);
		if (features.length === 0) continue;

		const done = features.filter((f) => f.status === "done").length;
		const total = features.length;
		const modDays = features.reduce((s, f) => s + (f.days || 0), 0);
		const modProgress = total > 0 ? Math.round((done / total) * 100) : 0;

		yPosition = ensurePdfSpace(doc, yPosition, 40);
		yPosition = drawSectionHeader(
			doc,
			yPosition,
			mod.name,
			`${total} fonctionnalités · ${modDays}j`,
		);

		if (mod.description) {
			doc.setFontSize(8);
			doc.setTextColor(...PDF_THEME.colors.muted);
			const descLines = doc.splitTextToSize(mod.description, pageWidth - PDF_THEME.margin * 2);
			doc.text(descLines, 18, yPosition);
			yPosition += descLines.length * 4 + 4;
		}

		doc.setFontSize(7);
		doc.setTextColor(...PDF_THEME.colors.muted);
		doc.text(`Progression: ${done}/${total} (${modProgress}%)`, 18, yPosition + 2);
		drawProgressBar(doc, 68, yPosition + 2, 38, modProgress);
		yPosition += 10;

		if (features.length > 0) {
			const tableData = features.map((f) => [
				f.name,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days.toString(),
			]);

			autoTable(doc, {
				...getPdfTableStyles(),
				startY: yPosition,
				head: [["Fonctionnalité", "Statut", "Priorité", "J"]],
				body: tableData,
				margin: { left: PDF_THEME.margin, right: PDF_THEME.margin, bottom: PDF_THEME.footerHeight },
				columnStyles: {
					0: { cellWidth: 100 },
					1: { cellWidth: 35, halign: "center" },
					2: { cellWidth: 25, halign: "center" },
					3: { cellWidth: 15, halign: "center" },
				},
				didDrawPage: (data) => {
					if (data.cursor) yPosition = data.cursor.y + 6;
				},
			});
		}

		yPosition += 4;
	}

	const orphans = project.features.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphans.length > 0) {
		yPosition = ensurePdfSpace(doc, yPosition, 35);
		yPosition = drawSectionHeader(doc, yPosition, "Sans module", `${orphans.length} fonctionnalités`);

		const tableData = orphans.map((f) => [
			f.name,
			formatters.status(f.status),
			formatters.priority(f.priority),
			f.days.toString(),
		]);

		autoTable(doc, {
			...getPdfTableStyles(),
			startY: yPosition,
			head: [["Fonctionnalité", "Statut", "Priorité", "J"]],
			body: tableData,
			margin: { left: PDF_THEME.margin, right: PDF_THEME.margin, bottom: PDF_THEME.footerHeight },
			columnStyles: {
				0: { cellWidth: 100 },
				1: { cellWidth: 35, halign: "center" },
				2: { cellWidth: 25, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
			},
			didDrawPage: (data) => {
				if (data.cursor) yPosition = data.cursor.y + 6;
			},
		});
	}

	addPdfFooters(doc, "Découpage fonctionnel");
	const filename = `${sanitizeFilename(project.name)}_breakdown_${new Date().toISOString().split("T")[0]}.pdf`;
	doc.save(filename);
}

export function exportBreakdown(project: Project, format: "md" | "pdf"): void {
	if (format === "md") {
		const markdown = generateBreakdownMarkdown(project);
		const filename = `${sanitizeFilename(project.name)}_breakdown_${new Date().toISOString().split("T")[0]}.md`;
		downloadMarkdown(markdown, filename);
	} else if (format === "pdf") {
		generateBreakdownPDF(project);
	}
}
