import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Status = "todo" | "progress" | "done";
export type Priority = "p1" | "p2" | "p3";

export interface Module {
	id: string;
	name: string;
	color: string;
	description: string;
}

export interface Feature {
	id: string;
	name: string;
	status: Status;
	priority: Priority;
	days: number;
	start: string;
	spec: string;
	moduleId: string;
	dependsOn: string[];
	sortOrder: number;
	sprintId: string;
}
export interface Task {
	id: string;
	name: string;
	status: Status;
	priority: Priority;
	days: number;
}
export interface Schedule {
	days: number[];
	start: string;
	end: string;
	exceptions: { date: string; label: string }[];
}
export interface Sprint {
	id: string;
	name: string;
	start: string;
	end: string;
	goal: string;
	taskIds: string[];
}

export interface Project {
	id: string;
	name: string;
	desc: string;
	tag: string;
	start: string;
	end: string;
	schedule: Schedule;
	modules: Module[];
	features: Feature[];
	tasks: Task[];
	sprints: Sprint[];
}

// ── API helpers ────────────────────────────────────────────────────────────
const api = {
	saveProject: (p: Project) =>
		fetch(`/api/projects`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(p),
		}).catch(() => {}),
	updateProject: (p: Project) =>
		fetch(`/api/projects/${p.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(p),
		}).catch(() => {}),
	deleteProject: (id: string) =>
		fetch(`/api/projects/${id}`, { method: "DELETE" }).catch(() => {}),
	saveFeature: (pid: string, f: Feature) =>
		fetch(`/api/projects/${pid}/features/${f.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(f),
		}).catch(() => {}),
	deleteFeature: (pid: string, fid: string) =>
		fetch(`/api/projects/${pid}/features/${fid}`, { method: "DELETE" }).catch(
			() => {},
		),
	saveTask: (pid: string, t: Task) =>
		fetch(`/api/projects/${pid}/tasks/${t.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(t),
		}).catch(() => {}),
	deleteTask: (pid: string, tid: string) =>
		fetch(`/api/projects/${pid}/tasks/${tid}`, { method: "DELETE" }).catch(
			() => {},
		),
	saveSchedule: (pid: string, s: Schedule) =>
		fetch(`/api/projects/${pid}/schedule`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(s),
		}).catch(() => {}),
	saveModule: (pid: string, m: Module) =>
		fetch(`/api/projects/${pid}/modules/${m.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(m),
		}).catch(() => {}),
	deleteModule: (pid: string, mid: string) =>
		fetch(`/api/projects/${pid}/modules/${mid}`, { method: "DELETE" }).catch(
			() => {},
		),
	saveSprint: (pid: string, s: Sprint) =>
		fetch(`/api/projects/${pid}/sprints/${s.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(s),
		}).catch(() => {}),
	deleteSprint: (pid: string, sid: string) =>
		fetch(`/api/projects/${pid}/sprints/${sid}`, { method: "DELETE" }).catch(
			() => {},
		),
};

const DEFAULT_SCHEDULE: Schedule = {
	days: [1, 2, 3, 4, 5],
	start: "09:00",
	end: "18:00",
	exceptions: [],
};

function expandProjectBounds(
	project: Project,
	features: Feature[],
): { start: string; end: string } {
	const allStarts = features
		.map((f) => f.start)
		.filter(Boolean)
		.sort();
	const allEnds = features
		.filter((f) => f.start && f.days)
		.map((f) => {
			const d = new Date(f.start);
			d.setDate(d.getDate() + Math.ceil(f.days));
			return d.toISOString().slice(0, 10);
		})
		.sort();
	const featureStart = allStarts[0] ?? "";
	const featureEnd = allEnds[allEnds.length - 1] ?? "";

	// Always take the earliest start and latest end
	let start = project.start;
	if (featureStart && (!start || featureStart < start)) start = featureStart;

	let end = project.end;
	if (featureEnd && (!end || featureEnd > end)) end = featureEnd;

	return { start, end };
}

const SEED: Project[] = [
	{
		id: "p1",
		name: "Gantty",
		desc: "App de gestion de projet pour développeur solo",
		tag: "ACTIVE_01",
		start: "2025-01-06",
		end: "2025-04-30",
		sprints: [],
		modules: [],
		schedule: { ...DEFAULT_SCHEDULE },
		features: [
			{
				id: "f1",
				name: "Authentification & Sécurité",
				status: "done",
				priority: "p1",
				days: 5,
				start: "2025-01-06",
				spec: "JWT + refresh tokens.",
				moduleId: "",
				dependsOn: [],
				sortOrder: 0,
				sprintId: "",
			},
			{
				id: "f2",
				name: "Dashboard principal",
				status: "progress",
				priority: "p1",
				days: 8,
				start: "2025-01-13",
				spec: "Vue projets avec métriques.",
				moduleId: "",
				dependsOn: [],
				sortOrder: 1,
				sprintId: "",
			},
			{
				id: "f3",
				name: "Découpage fonctionnel",
				status: "progress",
				priority: "p1",
				days: 6,
				start: "2025-01-21",
				spec: "Table collapsible.",
				moduleId: "",
				dependsOn: [],
				sortOrder: 2,
				sprintId: "",
			},
			{
				id: "f4",
				name: "Gantt & Calendrier",
				status: "todo",
				priority: "p2",
				days: 10,
				start: "2025-02-03",
				spec: "Gantt interactif.",
				moduleId: "",
				dependsOn: [],
				sortOrder: 3,
				sprintId: "",
			},
			{
				id: "f5",
				name: "Gestion des horaires",
				status: "todo",
				priority: "p3",
				days: 4,
				start: "2025-02-17",
				spec: "Par projet.",
				moduleId: "",
				dependsOn: [],
				sortOrder: 4,
				sprintId: "",
			},
		],
		tasks: [
			{
				id: "t1",
				name: "Setup auth middleware",
				status: "done",
				priority: "p1",
				days: 2,
			},
			{
				id: "t2",
				name: "Design system tokens",
				status: "done",
				priority: "p1",
				days: 1,
			},
			{
				id: "t3",
				name: "Dashboard layout",
				status: "progress",
				priority: "p1",
				days: 3,
			},
			{
				id: "t4",
				name: "Feature table",
				status: "progress",
				priority: "p2",
				days: 2,
			},
			{
				id: "t5",
				name: "Gantt renderer",
				status: "todo",
				priority: "p1",
				days: 5,
			},
		],
	},
	{
		id: "p2",
		name: "API Gateway",
		desc: "Microservice de routage et auth centralisée",
		tag: "PLANNED_02",
		start: "2025-03-01",
		end: "2025-05-31",
		sprints: [],
		modules: [],
		schedule: { ...DEFAULT_SCHEDULE },
		features: [
			{
				id: "f6",
				name: "Rate limiting",
				status: "todo",
				priority: "p1",
				days: 3,
				start: "2025-03-01",
				spec: "",
				moduleId: "",
				dependsOn: [],
				sortOrder: 0,
				sprintId: "",
			},
			{
				id: "f7",
				name: "Logging & Monitoring",
				status: "todo",
				priority: "p2",
				days: 5,
				start: "2025-03-04",
				spec: "",
				moduleId: "",
				dependsOn: [],
				sortOrder: 1,
				sprintId: "",
			},
		],
		tasks: [
			{
				id: "t6",
				name: "Analyse des besoins",
				status: "done",
				priority: "p1",
				days: 1,
			},
			{
				id: "t7",
				name: "Architecture diagram",
				status: "todo",
				priority: "p2",
				days: 2,
			},
		],
	},
];

interface AppState {
	projects: Project[];
	currentProjectId: string | null;
	currentView: string;
	dbSynced: boolean;

	// Navigation
	setCurrentProject: (id: string) => void;
	setCurrentView: (view: string) => void;

	// Projects
	loadFromDb: () => Promise<void>;
	addProject: (
		p: Omit<
			Project,
			"id" | "features" | "tasks" | "schedule" | "sprints" | "modules"
		>,
	) => void;
	updateProject: (id: string, data: Partial<Project>) => void;
	deleteProject: (id: string) => void;

	// Features
	addFeature: (pid: string, f: Omit<Feature, "id">) => void;
	updateFeature: (pid: string, fid: string, data: Partial<Feature>) => void;
	deleteFeature: (pid: string, fid: string) => void;
	reorderFeatures: (pid: string, orderedIds: string[]) => void;
	toggleDependency: (pid: string, fromId: string, toId: string) => void;

	// Tasks
	addTask: (pid: string, t: Omit<Task, "id">) => void;
	updateTask: (pid: string, tid: string, data: Partial<Task>) => void;
	deleteTask: (pid: string, tid: string) => void;

	// Modules
	addModule: (pid: string, m: Omit<Module, "id">) => void;
	updateModule: (pid: string, mid: string, data: Partial<Module>) => void;
	deleteModule: (pid: string, mid: string) => void;

	// Sprints
	addSprint: (pid: string, s: Omit<Sprint, "id">) => void;
	updateSprint: (pid: string, sid: string, data: Partial<Sprint>) => void;
	deleteSprint: (pid: string, sid: string) => void;
	assignTaskToSprint: (pid: string, tid: string, sid: string | null) => void;

	// Schedule
	updateSchedule: (pid: string, s: Partial<Schedule>) => void;

	// Helpers
	syncTasksFromFeatures: (pid: string) => void;
	currentProject: () => Project | undefined;
}

export const useStore = create<AppState>()(
	persist(
		(set, get) => ({
			projects: SEED,
			currentProjectId: "p1",
			currentView: "dashboard",
			dbSynced: false,

			setCurrentProject: (id) => set({ currentProjectId: id }),
			setCurrentView: (view) => set({ currentView: view }),
			currentProject: () =>
				get().projects.find((p) => p.id === get().currentProjectId),

			loadFromDb: async () => {
				try {
					const res = await fetch("/api/projects");
					if (!res.ok) return;
					const data = await res.json();
					if (Array.isArray(data) && data.length > 0) {
						set({ projects: data, dbSynced: true });
					} else {
						// First run: seed DB with local state
						const { projects } = get();
						await Promise.all(projects.map((p) => api.saveProject(p)));
						set({ dbSynced: true });
					}
				} catch {}
			},

			addProject: (p) => {
				// p lacks sprints
				const id = `p${Date.now()}`;
				const project: Project = {
					...p,
					id,
					features: [],
					tasks: [],
					sprints: [],
					modules: [],
					schedule: { ...DEFAULT_SCHEDULE },
				};
				set((s) => ({
					projects: [...s.projects, project],
					currentProjectId: id,
				}));
				api.saveProject(project);
			},

			updateProject: (id, data) => {
				set((s) => ({
					projects: s.projects.map((p) =>
						p.id === id ? { ...p, ...data } : p,
					),
				}));
				const p = get().projects.find((x) => x.id === id);
				if (p) api.updateProject({ ...p, ...data });
			},

			deleteProject: (id) => {
				set((s) => ({
					projects: s.projects.filter((p) => p.id !== id),
					currentProjectId:
						s.currentProjectId === id
							? (s.projects.find((p) => p.id !== id)?.id ?? null)
							: s.currentProjectId,
				}));
				api.deleteProject(id);
			},

			addFeature: (pid, f) => {
				const id = `f${Date.now()}`;
				const feat = {
					...f,
					id,
					moduleId: f.moduleId ?? "",
					dependsOn: f.dependsOn ?? [],
					sortOrder: f.sortOrder ?? 0,
					sprintId: f.sprintId ?? "",
				};
				set((s) => ({
					projects: s.projects.map((p) => {
						if (p.id !== pid) return p;
						const features = [...p.features, feat];
						const { start, end } = expandProjectBounds(p, features);
						return { ...p, features, start, end };
					}),
				}));
				const updated = get().projects.find((x) => x.id === pid);
				if (updated) api.updateProject(updated);
				api.saveFeature(pid, feat);
			},

			updateFeature: (pid, fid, data) => {
				set((s) => ({
					projects: s.projects.map((p) => {
						if (p.id !== pid) return p;
						const features = p.features.map((f) =>
							f.id === fid ? { ...f, ...data } : f,
						);
						const { start, end } = expandProjectBounds(p, features);
						return { ...p, features, start, end };
					}),
				}));
				const p = get().projects.find((x) => x.id === pid);
				const f = p?.features.find((x) => x.id === fid);
				if (f) api.saveFeature(pid, { ...f, ...data });
				if (p) api.updateProject(p);
			},

			deleteFeature: (pid, fid) => {
				set((s) => ({
					projects: s.projects.map((p) =>
						p.id === pid
							? { ...p, features: p.features.filter((f) => f.id !== fid) }
							: p,
					),
				}));
				api.deleteFeature(pid, fid);
			},

			reorderFeatures: (pid, orderedIds) => {
				set((s) => ({
					projects: s.projects.map((p) => {
						if (p.id !== pid) return p;
						const reordered = orderedIds
							.map((id, i) => {
								const f = p.features.find((x) => x.id === id);
								return f ? { ...f, sortOrder: i } : null;
							})
							.filter(Boolean) as typeof p.features;
						// keep features not in the orderedIds list (shouldn't happen but safety)
						const rest = p.features.filter((f) => !orderedIds.includes(f.id));
						return { ...p, features: [...reordered, ...rest] };
					}),
				}));
				const p = get().projects.find((x) => x.id === pid);
				p?.features.forEach((f) => {
					api.saveFeature(pid, f);
				});
			},

			toggleDependency: (pid, fromId, toId) => {
				set((s) => ({
					projects: s.projects.map((p) => {
						if (p.id !== pid) return p;
						return {
							...p,
							features: p.features.map((f) => {
								if (f.id !== fromId) return f;
								const deps = f.dependsOn ?? [];
								const next = deps.includes(toId)
									? deps.filter((d) => d !== toId)
									: [...deps, toId];
								return { ...f, dependsOn: next };
							}),
						};
					}),
				}));
				const p = get().projects.find((x) => x.id === pid);
				const f = p?.features.find((x) => x.id === fromId);
				if (f) api.saveFeature(pid, f);
			},

			addTask: (pid, t) => {
				const id = `t${Date.now()}`;
				const task = { ...t, id };
				set((s) => ({
					projects: s.projects.map((p) =>
						p.id === pid ? { ...p, tasks: [...p.tasks, task] } : p,
					),
				}));
				api.saveTask(pid, task);
			},

			updateTask: (pid, tid, data) => {
				set((s) => ({
					projects: s.projects.map((p) =>
						p.id === pid
							? {
									...p,
									tasks: p.tasks.map((t) =>
										t.id === tid ? { ...t, ...data } : t,
									),
								}
							: p,
					),
				}));
				const p = get().projects.find((x) => x.id === pid);
				const t = p?.tasks.find((x) => x.id === tid);
				if (t) api.saveTask(pid, { ...t, ...data });
			},

			deleteTask: (pid, tid) => {
				set((s) => ({
					projects: s.projects.map((p) =>
						p.id === pid
							? { ...p, tasks: p.tasks.filter((t) => t.id !== tid) }
							: p,
					),
				}));
				api.deleteTask(pid, tid);
			},

			addModule: (pid, m) => {
				const id = `mod${Date.now()}`;
				const mod = { ...m, id };
				set((st) => ({
					projects: st.projects.map((p) =>
						p.id === pid ? { ...p, modules: [...(p.modules ?? []), mod] } : p,
					),
				}));
				api.saveModule(pid, mod);
			},

			updateModule: (pid, mid, data) => {
				set((st) => ({
					projects: st.projects.map((p) =>
						p.id === pid
							? {
									...p,
									modules: (p.modules ?? []).map((m) =>
										m.id === mid ? { ...m, ...data } : m,
									),
								}
							: p,
					),
				}));
				const p = get().projects.find((x) => x.id === pid);
				const m = p?.modules?.find((x) => x.id === mid);
				if (m) api.saveModule(pid, { ...m, ...data });
			},

			deleteModule: (pid, mid) => {
				// Unlink features from this module
				set((st) => ({
					projects: st.projects.map((p) => {
						if (p.id !== pid) return p;
						return {
							...p,
							modules: (p.modules ?? []).filter((m) => m.id !== mid),
							features: p.features.map((f) =>
								f.moduleId === mid ? { ...f, moduleId: "" } : f,
							),
						};
					}),
				}));
				api.deleteModule(pid, mid);
			},

			addSprint: (pid, s) => {
				const id = `sp${Date.now()}`;
				const sprint = { ...s, id };
				set((st) => ({
					projects: st.projects.map((p) =>
						p.id === pid
							? { ...p, sprints: [...(p.sprints ?? []), sprint] }
							: p,
					),
				}));
				api.saveSprint(pid, sprint);
			},

			updateSprint: (pid, sid, data) => {
				set((st) => ({
					projects: st.projects.map((p) =>
						p.id === pid
							? {
									...p,
									sprints: (p.sprints ?? []).map((s) =>
										s.id === sid ? { ...s, ...data } : s,
									),
								}
							: p,
					),
				}));
				const p = get().projects.find((x) => x.id === pid);
				const s = p?.sprints?.find((x) => x.id === sid);
				if (s) api.saveSprint(pid, { ...s, ...data });
			},

			deleteSprint: (pid, sid) => {
				set((st) => ({
					projects: st.projects.map((p) =>
						p.id === pid
							? { ...p, sprints: (p.sprints ?? []).filter((s) => s.id !== sid) }
							: p,
					),
				}));
				api.deleteSprint(pid, sid);
			},

			assignTaskToSprint: (pid, fid, sid) => {
				// Update feature.sprintId AND keep sprint.taskIds in sync
				set((st) => ({
					projects: st.projects.map((p) => {
						if (p.id !== pid) return p;
						const features = p.features.map((f) =>
							f.id === fid ? { ...f, sprintId: sid ?? "" } : f,
						);
						const sprints = (p.sprints ?? []).map((s) => ({
							...s,
							taskIds:
								sid === s.id
									? [...new Set([...s.taskIds, fid])]
									: s.taskIds.filter((id) => id !== fid),
						}));
						return { ...p, features, sprints };
					}),
				}));
				const p = get().projects.find((x) => x.id === pid);
				const feat = p?.features.find((x) => x.id === fid);
				if (feat) api.saveFeature(pid, feat);
				const s = sid ? p?.sprints?.find((x) => x.id === sid) : null;
				if (s) api.saveSprint(pid, s);
			},

			updateSchedule: (pid, data) => {
				set((s) => ({
					projects: s.projects.map((p) =>
						p.id === pid ? { ...p, schedule: { ...p.schedule, ...data } } : p,
					),
				}));
				const p = get().projects.find((x) => x.id === pid);
				if (p) api.saveSchedule(pid, { ...p.schedule, ...data });
			},

			syncTasksFromFeatures: (pid) => {
				const p = get().projects.find((x) => x.id === pid);
				if (!p) return;
				const tasks: Task[] = p.features.map((f) => ({
					id: `t_ ${f.id}`,
					name: f.name,
					status: f.status,
					priority: f.priority,
					days: f.days,
				}));
				set((s) => ({
					projects: s.projects.map((pr) =>
						pr.id === pid ? { ...pr, tasks } : pr,
					),
				}));
				tasks.forEach((t) => {
					api.saveTask(pid, t);
				});
			},
		}),
		{ name: "gantty" },
	),
);
