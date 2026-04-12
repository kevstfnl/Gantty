import { NextResponse } from "next/server";
import { badRequest, parseBody } from "@/lib/api-validation";
import { getProjects, upsertProject } from "@/lib/db/queries";
import type { Project } from "@/lib/store";

export async function GET() {
	try {
		return NextResponse.json(await getProjects());
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await parseBody<Project>(req);
		if (!body) return badRequest();
		await upsertProject(body);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
