import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

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
    .single();

  if (error) throw error;

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

const postUserPosition = async (position: Position): Promise<void> => {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Unauthenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ position })
    .eq("id", user.id);

  if (error) throw error;
};

export const updatePositionMutationOptions = () =>
  mutationOptions({ mutationFn: postUserPosition });

export async function signInWithGoogle() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

const signOut = async (): Promise<void> => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

export const logoutMutationOptions = () =>
  mutationOptions({
    mutationFn: signOut,
    onSuccess: () => window.location.reload(),
  });
