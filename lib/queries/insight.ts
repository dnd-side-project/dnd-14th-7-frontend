import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type FetchedQuestionRow = Pick<
	Database["public"]["Tables"]["questions"]["Row"],
	"id" | "content" | "status" | "created_at"
>;
type FetchedAnswerRow = Pick<
	Database["public"]["Tables"]["answers"]["Row"],
	"id" | "question_id" | "content" | "is_converted" | "created_at"
> & {
	questions: { content: string } | null;
};
type InsightTagRow = {
	tag_id: number;
	tags: { id: number; name: string } | null;
};

type InsightTagWithTag = InsightTagRow & {
	tags: { id: number; name: string };
};

const hasJoinedTag = (row: InsightTagRow): row is InsightTagWithTag =>
	row.tags !== null;

export interface Tag {
	tagId: number;
	tagName: string;
}

export interface InsightSummary {
	insightId: number;
	title: string;
	confirmedContent: string;
	tags: Tag[];
	createdDate: string;
	trashedDate: string;
}

export interface PageInfo {
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

interface InsightsData {
	content: InsightSummary[];
	page: PageInfo;
}

export interface GetInsightResponse {
	insightId: number;
	initialThought: string;
	memo: string;
	title: string;
	tags: Tag[];
	createdDate: string;
	updatedDate: string;
}

export interface InsightPiece {
	insightPieceId: number;
	content: string;
	createdType: "INIT" | "SELF" | "ANSWER";
	createdDate: string;
}

export interface InsightQuestion {
	questionId: number;
	content: string;
	status: "WAITING" | "COMPLETED" | "ARCHIVED";
	createdDate: string;
}

export interface InsightAnswerCard {
	answerId: number;
	questionId: number;
	questionContent: string;
	answerContent: string;
	isConverted: boolean;
	createdDate: string;
}

export interface GetInsightQuestionsResponse {
	questions: InsightQuestion[];
	answerCards: InsightAnswerCard[];
}

type InsightsSort = "LATEST" | "VIEWS";

interface InsightsParams {
	page?: number;
	size?: number;
	sort?: InsightsSort;
	tag?: number;
}

// ── Query Keys ──

export const insightKeys = {
	all: ["insight"] as const,
	list: (params?: InsightsParams) =>
		[...insightKeys.all, "list", params] as const,
	detail: (id: number) => [...insightKeys.all, "detail", id] as const,
	pieces: (id: number) => [...insightKeys.all, "pieces", id] as const,
	questions: (id: number) => [...insightKeys.all, "questions", id] as const,
};

// ── API Functions ──

const getInsights = async (
	params: InsightsParams = {},
): Promise<InsightsData> => {
	const supabase = createClient();
	const {
		page: rawPage = 0,
		size: rawSize = 20,
		sort = "LATEST",
		tag,
	} = params;
	const page = Math.max(0, Number(rawPage) || 0);
	const size = Math.max(1, Number(rawSize) || 20);

	const insightTagsSelect =
		tag !== undefined
			? "insight_tags!inner(tag_id, tags(id, name))"
			: "insight_tags(tag_id, tags(id, name))";

	let query = supabase
		.from("insights")
		.select(
			`
      id,
      title,
      initial_thought,
      created_at,
      trashed_at,
      ${insightTagsSelect}
    `,
			{ count: "exact" },
		)
		.is("trashed_at", null);

	if (tag !== undefined) {
		query = query.eq("insight_tags.tag_id", tag);
	}

	if (sort === "VIEWS") {
		query = query.order("views", { ascending: false });
	} else {
		query = query.order("created_at", { ascending: false });
	}

	const from = page * size;
	const to = from + size - 1;
	query = query.range(from, to);

	const { data, error, count } = await query;
	if (error) throw error;

	if (!data || data.length === 0) {
		return {
			content: [],
			page: { number: page, size, totalElements: count ?? 0, totalPages: 0 },
		};
	}

	const content: InsightSummary[] = data.map((row) => {
		const tagRows: InsightTagRow[] = Array.isArray(row.insight_tags)
			? row.insight_tags
			: [];
		const tags: Tag[] = tagRows.filter(hasJoinedTag).map((t) => ({
			tagId: t.tags.id,
			tagName: t.tags.name,
		}));

		return {
			insightId: row.id,
			title: row.title ?? "",
			confirmedContent: row.initial_thought ?? "",
			tags,
			createdDate: row.created_at,
			trashedDate: row.trashed_at ?? "",
		};
	});

	const totalElements = count ?? 0;
	const totalPages = Math.ceil(totalElements / size);

	return {
		content,
		page: { number: page, size, totalElements, totalPages },
	};
};

const getInsight = async (id: number): Promise<GetInsightResponse> => {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("insights")
		.select(
			`
      id,
      title,
      initial_thought,
      memo,
      created_at,
      updated_at,
      insight_tags(tag_id, tags(id, name))
    `,
		)
		.eq("id", id)
		.maybeSingle();

	if (error) throw error;
	if (!data) throw new Error("Insight not found");

	const tagRows: InsightTagRow[] = Array.isArray(data.insight_tags)
		? data.insight_tags
		: [];
	const tags: Tag[] = tagRows.filter(hasJoinedTag).map((t) => ({
		tagId: t.tags.id,
		tagName: t.tags.name,
	}));

	return {
		insightId: data.id,
		initialThought: data.initial_thought ?? "",
		memo: data.memo ?? "",
		title: data.title ?? "",
		tags,
		createdDate: data.created_at,
		updatedDate: data.updated_at,
	};
};

const getInsightPieces = async (id: number): Promise<InsightPiece[]> => {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("insight_pieces")
		.select("id, content, created_type, created_at")
		.eq("insight_id", id)
		.order("created_at", { ascending: true });

	if (error) throw error;

	if (!data || data.length === 0) return [];

	return data.map((row) => ({
		insightPieceId: row.id,
		content: row.content,
		createdType: row.created_type,
		createdDate: row.created_at,
	}));
};

interface CreateInsightResponse {
	insightId: number;
}

interface GeneratedInsightDraft {
	title: string;
	insight: string;
	tags: string[];
	questions: string[];
}

function normalizeGeneratedInsightDraft(
	value: unknown,
	memo: string,
): GeneratedInsightDraft {
	const draft =
		typeof value === "object" && value !== null
			? (value as Record<string, unknown>)
			: {};

	const title =
		typeof draft.title === "string" && draft.title.trim()
			? draft.title.trim()
			: "제목 없는 인사이트";
	const insight =
		typeof draft.insight === "string" && draft.insight.trim()
			? draft.insight.trim()
			: memo;
	const tags = Array.isArray(draft.tags)
		? draft.tags
				.filter((tag): tag is string => typeof tag === "string")
				.map((tag) => tag.trim())
				.filter(Boolean)
		: [];
	const questions = Array.isArray(draft.questions)
		? draft.questions
				.filter((question): question is string => typeof question === "string")
				.map((question) => question.trim())
				.filter(Boolean)
		: [];

	return { title, insight, tags, questions };
}

async function generateInsightDraft(
	memo: string,
): Promise<GeneratedInsightDraft> {
	const response = await fetch("/api/ai/insight", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ memo }),
	});

	if (!response.ok) {
		throw new Error("Failed to generate insight with AI");
	}

	const draft = (await response.json()) as unknown;
	return normalizeGeneratedInsightDraft(draft, memo);
}

const createInsight = async (data: {
	memo: string;
}): Promise<CreateInsightResponse> => {
	const supabase = createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) throw new Error("Unauthenticated");

	const generated = await generateInsightDraft(data.memo);

	const { data: insight, error } = await supabase
		.from("insights")
		.insert({
			user_id: user.id,
			initial_thought: data.memo,
			title: generated.title,
		})
		.select("id")
		.single();

	if (error) throw error;

	const { error: pieceError } = await supabase.from("insight_pieces").insert({
		insight_id: insight.id,
		content: generated.insight,
		created_type: "INIT",
	});

	if (pieceError) throw pieceError;

	const tagNames = [...new Set(generated.tags.map((tag) => tag.trim()))].filter(
		Boolean,
	);

	if (tagNames.length > 0) {
		const { data: tags, error: tagError } = await supabase
			.from("tags")
			.upsert(
				tagNames.map((name) => ({ user_id: user.id, name })),
				{ onConflict: "user_id,name" },
			)
			.select("id");

		if (tagError) throw tagError;

		if (tags && tags.length > 0) {
			const { error: insightTagError } = await supabase
				.from("insight_tags")
				.insert(
					tags.map((tag) => ({ insight_id: insight.id, tag_id: tag.id })),
				);

			if (insightTagError) throw insightTagError;
		}
	}

	const questions = generated.questions
		.map((question) => question.trim())
		.filter(Boolean);

	if (questions.length > 0) {
		const { error: questionError } = await supabase.from("questions").insert(
			questions.map((content) => ({
				insight_id: insight.id,
				content,
			})),
		);

		if (questionError) throw questionError;
	}

	return { insightId: insight.id };
};

const createInsightPiece = async (
	insightId: number,
	data: { content: string },
): Promise<void> => {
	const supabase = createClient();
	const { error } = await supabase.from("insight_pieces").insert({
		insight_id: insightId,
		content: data.content,
		created_type: "SELF",
	});

	if (error) throw error;
};

const updateInsightPieceContent = async (
	pieceId: number,
	data: { content: string },
): Promise<void> => {
	const supabase = createClient();
	const { error } = await supabase
		.from("insight_pieces")
		.update({ content: data.content })
		.eq("id", pieceId);

	if (error) throw error;
};

const mapInsightQuestion = (q: FetchedQuestionRow): InsightQuestion => ({
	questionId: q.id,
	content: q.content,
	status: q.status,
	createdDate: q.created_at,
});

const mapInsightAnswerCard = (a: FetchedAnswerRow): InsightAnswerCard => ({
	answerId: a.id,
	questionId: a.question_id,
	questionContent: a.questions?.content ?? "",
	answerContent: a.content,
	isConverted: a.is_converted,
	createdDate: a.created_at,
});

const fetchQuestionsByInsight = async (
	supabase: ReturnType<typeof createClient>,
	insightId: number,
) => {
	const { data, error } = await supabase
		.from("questions")
		.select("id, content, status, created_at")
		.eq("insight_id", insightId)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data ?? [];
};

const fetchAnswersByQuestionIds = async (
	supabase: ReturnType<typeof createClient>,
	questionIds: number[],
) => {
	const { data, error } = await supabase
		.from("answers")
		.select(
			"id, question_id, content, is_converted, created_at, questions(content)",
		)
		.in("question_id", questionIds);

	if (error) throw error;
	return data ?? [];
};

const getInsightQuestions = async (
	id: number,
): Promise<GetInsightQuestionsResponse> => {
	const supabase = createClient();

	const questions = await fetchQuestionsByInsight(supabase, id);
	if (questions.length === 0) return { questions: [], answerCards: [] };

	const answers = await fetchAnswersByQuestionIds(
		supabase,
		questions.map((q) => q.id),
	);

	return {
		questions: questions.map(mapInsightQuestion),
		answerCards: answers.map(mapInsightAnswerCard),
	};
};

const updateInsightTitle = async (
	insightId: number,
	data: { title: string },
): Promise<void> => {
	const supabase = createClient();
	const { error } = await supabase
		.from("insights")
		.update({ title: data.title })
		.eq("id", insightId);

	if (error) throw error;
};

interface UpdateInsightMemoResponse {
	memo: string;
	updatedDate: string;
}

const updateInsightMemo = async (
	insightId: number,
	data: { memo: string },
): Promise<UpdateInsightMemoResponse> => {
	const supabase = createClient();
	const { data: updatedInsight, error } = await supabase
		.from("insights")
		.update({ memo: data.memo })
		.eq("id", insightId)
		.select("memo, updated_at")
		.single();

	if (error) throw error;
	if (!updatedInsight) throw new Error("Failed to update insight memo");

	return {
		memo: updatedInsight.memo,
		updatedDate: updatedInsight.updated_at,
	};
};

const convertAnswerToBlock = async (
	insightId: number,
	answerId: number,
): Promise<void> => {
	const supabase = createClient();

	const { data: answer, error: answerError } = await supabase
		.from("answers")
		.select("content")
		.eq("id", answerId)
		.single();

	if (answerError) throw answerError;

	const { error: pieceError } = await supabase.from("insight_pieces").insert({
		insight_id: insightId,
		content: answer.content,
		created_type: "ANSWER",
	});

	if (pieceError) throw pieceError;

	const { error: updateError } = await supabase
		.from("answers")
		.update({ is_converted: true })
		.eq("id", answerId);

	if (updateError) throw updateError;
};

const answerQuestion = async (
	questionId: number,
	data: { content: string },
): Promise<void> => {
	const supabase = createClient();

	const { error: answerError } = await supabase.from("answers").insert({
		question_id: questionId,
		content: data.content,
	});

	if (answerError) throw answerError;

	const { error: statusError } = await supabase
		.from("questions")
		.update({ status: "COMPLETED" })
		.eq("id", questionId);

	if (statusError) throw statusError;
};

// ── Query Options ──

export const insightsQueryOptions = (params: InsightsParams = {}) =>
	queryOptions({
		queryKey: insightKeys.list(params),
		queryFn: () => getInsights(params),
	});

export const insightDetailQueryOptions = (id: number) =>
	queryOptions({
		queryKey: insightKeys.detail(id),
		queryFn: () => getInsight(id),
	});

export const insightPiecesQueryOptions = (id: number) =>
	queryOptions({
		queryKey: insightKeys.pieces(id),
		queryFn: () => getInsightPieces(id),
	});

export const insightQuestionsQueryOptions = (id: number) =>
	queryOptions({
		queryKey: insightKeys.questions(id),
		queryFn: () => getInsightQuestions(id),
	});

// ── Mutation Options ──

export const insightCreationMutationOptions = () =>
	mutationOptions({
		mutationFn: createInsight,
	});

export const insightPieceCreationMutationOptions = (insightId: number) =>
	mutationOptions({
		mutationFn: (data: { content: string }) =>
			createInsightPiece(insightId, data),
	});

export const insightPieceUpdateMutationOptions = (pieceId: number) =>
	mutationOptions({
		mutationFn: (data: { content: string }) =>
			updateInsightPieceContent(pieceId, data),
	});

export const convertAnswerToBlockMutationOptions = (insightId: number) =>
	mutationOptions({
		mutationFn: (answerId: number) => convertAnswerToBlock(insightId, answerId),
	});

export const answerQuestionMutationOptions = (_insightId: number) =>
	mutationOptions({
		mutationFn: (data: { questionId: number; content: string }) =>
			answerQuestion(data.questionId, { content: data.content }),
	});

export const updateInsightTitleMutationOptions = (insightId: number) =>
	mutationOptions({
		mutationFn: (data: { title: string }) =>
			updateInsightTitle(insightId, data),
	});

export const updateInsightMemoMutationOptions = (insightId: number) =>
	mutationOptions({
		mutationFn: (data: { memo: string }) => updateInsightMemo(insightId, data),
	});
