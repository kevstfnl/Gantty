import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Gantty",
	description: "Project management for solo developers",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="fr" className="h-full">
			<body className="h-full">{children}</body>
		</html>
	);
}
