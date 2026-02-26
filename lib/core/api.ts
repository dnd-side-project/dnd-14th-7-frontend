import { isServer } from "@/lib/core/env";
import { HttpError } from "./error";

type RequestOptions = Omit<RequestInit, "method" | "body">;

async function getAuthHeaders(): Promise<Record<string, string>> {
	if (!isServer()) return {};

	const { cookies } = await import("next/headers");
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveUrl(path: string) {
	if (isServer()) {
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
		if (!backendUrl) {
			throw new Error(
				"NEXT_PUBLIC_BACKEND_URL is not defined. Server-side API calls require this environment variable.",
			);
		}
		return `${backendUrl}${path}`;
	}
	return path;
}

let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
		.then((res) => res.ok)
		.finally(() => {
			refreshPromise = null;
		});

	return refreshPromise;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
	const authHeaders = await getAuthHeaders();

	const response = await fetch(resolveUrl(path), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...authHeaders,
			...init?.headers,
		},
	});

	if (response.status === 401 && !isServer()) {
		const refreshed = await refreshAccessToken();
		if (refreshed) {
			const retryResponse = await fetch(resolveUrl(path), {
				...init,
				headers: {
					"Content-Type": "application/json",
					...init?.headers,
				},
			});

			if (!retryResponse.ok) {
				throw new HttpError(retryResponse.status, retryResponse.statusText);
			}

			return retryResponse;
		}
	}

	if (!response.ok) {
		throw new HttpError(response.status, response.statusText);
	}

	return response;
}

export const api = {
	get: <T>(path: string, options?: RequestOptions) =>
		request(path, { ...options, method: "GET" }).then((r) => r.json() as T),

	post: <T>(path: string, body: unknown, options?: RequestOptions) =>
		request(path, {
			...options,
			method: "POST",
			body: JSON.stringify(body),
		}).then((r) => r.json() as T),

	put: <T>(path: string, body: unknown, options?: RequestOptions) =>
		request(path, {
			...options,
			method: "PUT",
			body: JSON.stringify(body),
		}).then((r) => r.json() as T),

	patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
		request(path, {
			...options,
			method: "PATCH",
			body: JSON.stringify(body),
		}).then((r) => r.json() as T),

	delete: (path: string, options?: RequestOptions) =>
		request(path, { ...options, method: "DELETE" }).then(() => {}),
};
