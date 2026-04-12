/** Max body size for API requests: 512KB */
const MAX_BODY_SIZE = 512 * 1024;

/** Allowed ID pattern: alphanumeric + dash + underscore, max 64 chars */
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function validateId(id: string): boolean {
	return ID_PATTERN.test(id);
}

export function validateIds(...ids: string[]): boolean {
	return ids.every(validateId);
}

/** Parse and validate request body with size limit */
export async function parseBody<T>(req: Request): Promise<T | null> {
	const contentLength = req.headers.get("content-length");
	if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) return null;

	try {
		const text = await req.text();
		if (text.length > MAX_BODY_SIZE) return null;
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

export function badRequest(msg = "Bad request") {
	return Response.json({ error: msg }, { status: 400 });
}
