import { createClient } from "@/lib/supabase/client";

// ── Types ──

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

export interface InsightsData {
	content: InsightSummary[];
	page: PageInfo;
}

export interface GetInsightResponse {
	insightId: number;
	initialThought: string;
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

export interface CreateInsightResponse {
	insightId: number;
}

export type InsightsSort = "LATEST" | "VIEWS";

export interface InsightsParams {
	page?: number;
	size?: number;
	sort?: InsightsSort;
	tag?: number;
}

// ── Mappers ──

const mapTag = (t: { tags: { id: number; name: string } }): Tag => ({
	tagId: t.tags.id,
	tagName: t.tags.name,
});

const mapInsightQuestion = (q: {
	id: number;
	content: string;
	status: string;
	created_at: string;
}): InsightQuestion => ({
	questionId: q.id,
	content: q.content,
	status: q.status as "WAITING" | "COMPLETED" | "ARCHIVED",
	createdDate: q.created_at,
});

const mapInsightAnswerCard = (a: {
	id: number;
	question_id: number;
	content: string;
	is_converted: boolean;
	created_at: string;
	questions: { content: string } | null;
}): InsightAnswerCard => ({
	answerId: a.id,
	questionId: a.question_id,
	questionContent: a.questions?.content ?? "",
	answerContent: a.content,
	isConverted: a.is_converted,
	createdDate: a.created_at,
});

// ── API Functions ──

export const getInsights = async (
	params: InsightsParams = {},
): Promise<InsightsData> => {
	const supabase = createClient();
	const { page = 0, size = 20, sort = "LATEST", tag } = params;

	let query = supabase
		.from("insights")
		.select(
			`
      id,
      title,
      initial_thought,
      created_at,
      trashed_at,
      insight_tags!inner(tag_id, tags(id, name))
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
		const tagRows = Array.isArray(row.insight_tags) ? row.insight_tags : [];
		const tags: Tag[] = tagRows
			.filter((t: { tags: { id: number; name: string } | null }) => t.tags)
			.map((t: { tags: { id: number; name: string } }) => mapTag(t));

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

export const getInsight = async (id: number): Promise<GetInsightResponse> => {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("insights")
		.select(
			`
      id,
      title,
      initial_thought,
      created_at,
      updated_at,
      insight_tags(tag_id, tags(id, name))
    `,
		)
		.eq("id", id)
		.single();

	if (error) throw error;

	const tagRows = Array.isArray(data.insight_tags) ? data.insight_tags : [];
	const tags: Tag[] = tagRows
		.filter((t: { tags: { id: number; name: string } | null }) => t.tags)
		.map((t: { tags: { id: number; name: string } }) => mapTag(t));

	return {
		insightId: data.id,
		initialThought: data.initial_thought ?? "",
		title: data.title ?? "",
		tags,
		createdDate: data.created_at,
		updatedDate: data.updated_at,
	};
};

export const getInsightPieces = async (id: number): Promise<InsightPiece[]> => {
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
		createdType: row.created_type as "INIT" | "SELF" | "ANSWER",
		createdDate: row.created_at,
	}));
};

export const getInsightQuestions = async (
	id: number,
): Promise<GetInsightQuestionsResponse> => {
	const supabase = createClient();

	const { data: questions, error: qError } = await supabase
		.from("questions")
		.select("id, content, status, created_at")
		.eq("insight_id", id)
		.order("created_at", { ascending: true });

	if (qError) throw qError;

	if (!questions || questions.length === 0) {
		return { questions: [], answerCards: [] };
	}

	const questionIds = questions.map((q) => q.id);

	const { data: answers, error: aError } = await supabase
		.from("answers")
		.select(
			"id, question_id, content, is_converted, created_at, questions(content)",
		)
		.in("question_id", questionIds);

	if (aError) throw aError;

	return {
		questions: questions.map(mapInsightQuestion),
		answerCards: (answers ?? []).map(mapInsightAnswerCard),
	};
};

export const createInsight = async (data: {
	memo: string;
}): Promise<CreateInsightResponse> => {
	const supabase = createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) throw new Error("Unauthenticated");

	const { data: insight, error } = await supabase
		.from("insights")
		.insert({ user_id: user.id, initial_thought: data.memo, title: "" })
		.select("id")
		.single();

	if (error) throw error;

	const { error: pieceError } = await supabase.from("insight_pieces").insert({
		insight_id: insight.id,
		content: data.memo,
		created_type: "INIT",
	});

	if (pieceError) throw pieceError;

	return { insightId: insight.id };
};

export const createInsightPiece = async (
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

export const updateInsightTitle = async (
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

export const convertAnswerToBlock = async (
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

export const answerQuestion = async (
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
