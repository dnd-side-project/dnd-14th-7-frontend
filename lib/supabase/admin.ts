import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// 서비스 롤 클라이언트 — RLS 우회 필요 시만 사용 (서버 전용)
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
