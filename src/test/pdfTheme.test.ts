import { describe, expect, it } from "vitest";
import { PDF_THEME, buildSummaryStats, getPdfTableStyles } from "@/lib/export/pdfTheme";

describe("PDF report theme", () => {
	it("uses a neutral report palette", () => {
		expect(PDF_THEME.colors.ink).toEqual([24, 24, 27]);
		expect(PDF_THEME.colors.muted).toEqual([113, 113, 122]);
		expect(PDF_THEME.colors.border).toEqual([212, 212, 216]);
	});

	it("builds compact summary stats with a safe percentage", () => {
		expect(
			buildSummaryStats([
				{ label: "Total", value: "8" },
				{ label: "Avancement", value: "3/8", percent: 37.5 },
			]),
		).toEqual([
			{ label: "Total", value: "8", percent: undefined },
			{ label: "Avancement", value: "3/8", percent: 38 },
		]);
	});

	it("shares neutral autoTable styles", () => {
		const styles = getPdfTableStyles();

		expect(styles.theme).toBe("grid");
		expect(styles.headStyles.fillColor).toEqual(PDF_THEME.colors.ink);
		expect(styles.alternateRowStyles.fillColor).toEqual(PDF_THEME.colors.subtle);
	});
});
