"use client";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Backlog from "@/components/views/Backlog";
import Breakdown from "@/components/views/Breakdown";
import Dashboard from "@/components/views/Dashboard";
import Gantt from "@/components/views/Gantt";
import Schedule from "@/components/views/Schedule";
import { useStore } from "@/lib/store";

const VIEWS: Record<string, React.ReactNode> = {
	dashboard: <Dashboard />,
	breakdown: <Breakdown />,
	backlog: <Backlog />,
	gantt: <Gantt />,
	schedule: <Schedule />,
};

export default function AppShell() {
	const { currentView, loadFromDb } = useStore();

	useEffect(() => {
		loadFromDb();
	}, [loadFromDb]);

	return (
		<div className="flex h-screen overflow-hidden bg-[var(--bg)]">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Topbar />
				<main className="flex-1 overflow-hidden">
					{VIEWS[currentView] ?? <Dashboard />}
				</main>
			</div>
		</div>
	);
}
