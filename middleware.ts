import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./lib/supabase/env";

const AUTH_TIMEOUT_MS = 5_000;

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });
	const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
	const hasSessionCookie = request.cookies
		.getAll()
		.some((cookie) => cookie.name.startsWith("sb-"));

	const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}
				supabaseResponse = NextResponse.next({ request });
				for (const { name, value, options } of cookiesToSet) {
					supabaseResponse.cookies.set(name, value, options);
				}
			},
		},
	});

	if (!isDashboard && !hasSessionCookie) {
		return supabaseResponse;
	}

	const redirectHome = () => {
		const redirectResponse = NextResponse.redirect(new URL("/", request.url));
		for (const {
			name,
			value,
			...options
		} of supabaseResponse.cookies.getAll()) {
			redirectResponse.cookies.set(name, value, options);
		}
		return redirectResponse;
	};

	try {
		// 보호 라우트 접근 또는 기존 세션이 있는 경우에만 세션 확인/갱신
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		const {
			data: { user },
		} = await Promise.race([
			supabase.auth.getUser(),
			new Promise<never>((_, reject) => {
				timeoutId = setTimeout(
					() => reject(new Error("Supabase auth check timed out")),
					AUTH_TIMEOUT_MS,
				);
			}),
		]).finally(() => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		});

		if (isDashboard && !user) {
			return redirectHome();
		}
	} catch (error) {
		console.error("Auth middleware failed:", error);
		if (isDashboard) {
			return redirectHome();
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
