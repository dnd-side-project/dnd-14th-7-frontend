import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_KEYS } from "@/lib/auth/cookies";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function proxyRequest(req: NextRequest) {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get(AUTH_COOKIE_KEYS.ACCESS_TOKEN)?.value;

	const url = new URL(req.nextUrl.pathname + req.nextUrl.search, BACKEND_URL);

	const headers: HeadersInit = {
		"Content-Type": "application/json",
	};

	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`;
	}

	const body =
		req.method !== "GET" && req.method !== "HEAD"
			? await req.text()
			: undefined;

	const response = await fetch(url.toString(), {
		method: req.method,
		headers,
		body,
	});

	const data = await response.text();

	return new NextResponse(data, {
		status: response.status,
		headers: {
			"Content-Type":
				response.headers.get("Content-Type") ?? "application/json",
		},
	});
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
