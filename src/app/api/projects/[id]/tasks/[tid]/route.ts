import { NextResponse } from "next/server";
import { deleteTask, upsertTask } from "@/lib/db/queries";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string; tid: string }> },
) {
	try {
		const { id, tid } = await params;
		const task = await req.json();
		await upsertTask(id, { ...task, id: tid });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: Promise<{ id: string; tid: string }> },
) {
	try {
		const { tid } = await params;
		await deleteTask(tid);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
