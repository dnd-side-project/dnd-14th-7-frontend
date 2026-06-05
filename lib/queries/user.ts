import {
	mutationOptions,
	type QueryClient,
	queryOptions,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Supabase는 count 집계 결과를 타입 추론하지 못하므로 명시적으로 선언
type InsightTagCount = { count: number };

export type Position = "DEV" | "DESIGN" | "PROMOTER" | "OTHER";

export interface User {
	nickname: string;
	email: string;
	credit: number;
	position: Position | "NONE";
}

export interface Tag {
	tagId: number;
	tagName: string;
	insightCount: number;
}

export const userKeys = {
	all: ["user"] as const,
	profile: () => [...userKeys.all, "profile"] as const,
	tags: () => [...userKeys.all, "tags"] as const,
};

export const getUser = async (): Promise<User> => {
	const supabase = createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) throw new Error("Unauthenticated");

	const { data, error } = await supabase
		.from("profiles")
		.select("nickname, email, credit, position")
		.eq("id", user.id)
		.maybeSingle();

	if (error) throw error;
	if (!data) throw new Error("Profile not found");

	return {
		nickname: data.nickname,
		email: data.email,
		credit: data.credit,
		position: data.position,
	};
};

export const getTags = async (): Promise<Tag[]> => {
	const supabase = createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) throw new Error("Unauthenticated");

	const { data, error } = await supabase
		.from("tags")
		.select("id, name, insight_tags(count)")
		.eq("user_id", user.id);

	if (error) throw error;

	if (!data || data.length === 0) return [];

	return data.map((row) => ({
		tagId: row.id,
		tagName: row.name,
		insightCount:
			Array.isArray(row.insight_tags) && row.insight_tags.length > 0
				? (row.insight_tags[0] as InsightTagCount).count
				: 0,
	}));
};

export const userQueryOptions = () =>
	queryOptions({
		queryKey: userKeys.profile(),
		queryFn: getUser,
		retry: false,
	});

export const tagsQueryOptions = () =>
	queryOptions({
		queryKey: userKeys.tags(),
		queryFn: getTags,
		retry: false,
	});

const getAuthenticatedUserId = async () => {
	const supabase = createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) throw new Error("Unauthenticated");

	return { supabase, userId: user.id };
};

const postUserPosition = async (position: Position): Promise<void> => {
	const { supabase, userId } = await getAuthenticatedUserId();

	const { error } = await supabase
		.from("profiles")
		.update({ position })
		.eq("id", userId);

	if (error) throw error;
};

export const updatePositionMutationOptions = () =>
	mutationOptions({ mutationFn: postUserPosition });

interface ProfileUpdateInput {
	nickname: string;
	position: User["position"];
}

const updateProfile = async ({
	nickname,
	position,
}: ProfileUpdateInput): Promise<void> => {
	const { supabase, userId } = await getAuthenticatedUserId();
	const trimmedNickname = nickname.trim();

	if (!trimmedNickname) {
		throw new Error("Nickname is required");
	}

	const { error } = await supabase
		.from("profiles")
		.update({ nickname: trimmedNickname, position })
		.eq("id", userId);

	if (error) throw error;
};

export const updateProfileMutationOptions = () =>
	mutationOptions({ mutationFn: updateProfile });

export async function signInWithGoogle() {
	const supabase = createClient();
	await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${window.location.origin}/auth/callback`,
		},
	});
}

function expireClientCookies() {
	for (const cookie of document.cookie.split(";")) {
		const name = cookie.split("=")[0]?.trim();
		if (!name) continue;

		// biome-ignore lint/suspicious/noDocumentCookie: 로그아웃 시 클라이언트 쿠키를 강제로 만료합니다.
		document.cookie = `${name}=; Max-Age=0; path=/`;
		// biome-ignore lint/suspicious/noDocumentCookie: 로그아웃 시 클라이언트 쿠키를 강제로 만료합니다.
		document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
	}
}

async function clearBrowserCaches() {
	if (!("caches" in window)) return;

	const cacheNames = await window.caches.keys();
	await Promise.all(
		cacheNames.map((cacheName) => window.caches.delete(cacheName)),
	);
}

async function clearIndexedDB() {
	if (!("indexedDB" in window)) return;

	const indexedDBWithDatabases = window.indexedDB as IDBFactory & {
		databases?: () => Promise<Array<{ name?: string | null }>>;
	};
	const databases = await indexedDBWithDatabases.databases?.();
	if (!databases) return;

	await Promise.all(
		databases.map(
			(database) =>
				new Promise<void>((resolve) => {
					if (!database.name) {
						resolve();
						return;
					}

					const request = window.indexedDB.deleteDatabase(database.name);
					request.onsuccess = () => resolve();
					request.onerror = () => resolve();
					request.onblocked = () => resolve();
				}),
		),
	);
}

async function clearClientSessionData() {
	window.localStorage.clear();
	window.sessionStorage.clear();
	expireClientCookies();
	await Promise.allSettled([clearBrowserCaches(), clearIndexedDB()]);
}

const signOut = async (): Promise<void> => {
	const supabase = createClient();
	await supabase.auth.signOut({ scope: "global" });
};

export const logoutMutationOptions = (queryClient?: QueryClient) =>
	mutationOptions({
		mutationFn: signOut,
		onSettled: async () => {
			queryClient?.clear();
			await clearClientSessionData();
			window.location.replace("/");
		},
	});
