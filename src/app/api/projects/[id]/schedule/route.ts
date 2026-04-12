import { NextResponse } from "next/server";
import { badRequest, parseBody, validateIds } from "@/lib/api-validation";
import { upsertSchedule } from "@/lib/db/queries";
import type { Schedule } from "@/lib/store";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!validateIds(id)) return badRequest("Invalid id");
		const body = await parseBody<Schedule>(req);
		if (!body) return badRequest();
		await upsertSchedule(id, body);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
