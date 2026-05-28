function requireEnvValue(name: string, value: string | undefined) {
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}

	return value;
}

export function getSupabaseUrl() {
	return requireEnvValue(
		"NEXT_PUBLIC_SUPABASE_URL",
		process.env.NEXT_PUBLIC_SUPABASE_URL,
	);
}

export function getSupabaseAnonKey() {
	return requireEnvValue(
		"NEXT_PUBLIC_SUPABASE_ANON_KEY",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	);
}

export function getSupabaseServiceRoleKey() {
	return requireEnvValue(
		"SUPABASE_SERVICE_ROLE_KEY",
		process.env.SUPABASE_SERVICE_ROLE_KEY,
	);
}
