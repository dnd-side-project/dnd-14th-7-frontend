import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./lib/supabase/env";

const AUTH_TIMEOUT_MS = 5_000;

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

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

	try {
		// /dashboard 보호 라우트에서만 세션 확인/갱신
		const {
			data: { user },
		} = await Promise.race([
			supabase.auth.getUser(),
			new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error("Supabase auth check timed out")),
					AUTH_TIMEOUT_MS,
				),
			),
		]);

		if (!user) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	} catch (error) {
		console.error("Dashboard auth middleware failed:", error);
		return NextResponse.redirect(new URL("/", request.url));
	}

	return supabaseResponse;
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
