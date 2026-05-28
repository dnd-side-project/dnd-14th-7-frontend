import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";
import type { Database } from "./types";

// 서비스 롤 클라이언트 — RLS 우회 필요 시만 사용 (서버 전용)
export function createAdminClient() {
	return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}
