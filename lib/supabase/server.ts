import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./types";

export async function createClient() {
	const cookieStore = await cookies();
	return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
		cookies: {
			getAll: () => cookieStore.getAll(),
			setAll: (cookiesToSet) => {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Server Component에서 호출 시 무시 (middleware가 처리)
				}
			},
		},
	});
}
