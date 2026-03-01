import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/core/api";
import type { ApiResponse } from "@/lib/core/types";

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

interface InsightsData {
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

interface InsightPiecesData {
	insightPieces: InsightPiece[];
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
	const searchParams = new URLSearchParams();
	if (params.page !== undefined) searchParams.set("page", String(params.page));
	if (params.size !== undefined) searchParams.set("size", String(params.size));
	if (params.sort) searchParams.set("sort", params.sort);
	if (params.tag !== undefined) searchParams.set("tag", String(params.tag));

	const query = searchParams.toString();
	const path = `/api/v1/insights${query ? `?${query}` : ""}`;
	const response = await api.get<ApiResponse<InsightsData>>(path);
	return response.data;
};

const getInsight = async (id: number): Promise<GetInsightResponse> => {
	const response = await api.get<ApiResponse<GetInsightResponse>>(
		`/api/v1/insights/${id}`,
	);
	return response.data;
};

const getInsightPieces = async (id: number): Promise<InsightPiece[]> => {
	const response = await api.get<ApiResponse<InsightPiecesData>>(
		`/api/v1/insights/${id}/list`,
	);
	return response.data.insightPieces;
};

interface CreateInsightResponse {
	insightId: number;
}

const createInsight = async (data: {
	memo: string;
}): Promise<CreateInsightResponse> => {
	const response = await api.post<ApiResponse<CreateInsightResponse>>(
		"/api/v1/insights",
		data,
	);
	return response.data;
};

const createInsightPiece = (insightId: number, data: { content: string }) =>
	api.post<ApiResponse<unknown>>(`/api/v1/insights/${insightId}/pieces`, data);

const getInsightQuestions = (id: number) =>
	api
		.get<ApiResponse<GetInsightQuestionsResponse>>(
			`/api/v1/insights/${id}/questions`,
		)
		.then((r) => r.data);

const updateInsightTitle = (insightId: number, data: { title: string }) =>
	api.patch<ApiResponse<void>>(`/api/v1/insights/${insightId}/title`, data);

const convertAnswerToBlock = (insightId: number, answerId: number) =>
	api.post<ApiResponse<unknown>>(
		`/api/v1/insights/${insightId}/answer-blocks`,
		{ answerId },
	);

const answerQuestion = (questionId: number, data: { content: string }) =>
	api.post<ApiResponse<unknown>>(
		`/api/v1/questions/${questionId}/answer`,
		data,
	);

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
