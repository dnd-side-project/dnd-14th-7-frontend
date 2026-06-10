"use client";

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import type {
	GetInsightQuestionsResponse,
	InsightQuestion,
} from "@/lib/queries/insight";
import {
	generateInsightQuestionsMutationOptions,
	insightKeys,
	insightQuestionsQueryOptions,
} from "@/lib/queries/insight";
import { cn } from "@/lib/utils";
import { QuestionFormView } from "./question-form-view";
import { QuestionHistoryView } from "./question-history-view";

interface QuestionSectionProps {
	insightId: number;
	mode: "current" | "history";
}

export function QuestionSection({ insightId, mode }: QuestionSectionProps) {
	const { data } = useSuspenseQuery(insightQuestionsQueryOptions(insightId));
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
		null,
	);

	if (selectedQuestionId !== null) {
		return (
			<QuestionFormView
				questions={data.questions}
				selectedQuestionId={selectedQuestionId}
				onSelectQuestion={setSelectedQuestionId}
				insightId={insightId}
				visibleStatuses={mode === "history" ? ["ARCHIVED"] : ["WAITING"]}
				mode={mode}
			/>
		);
	}

	return mode === "history" ? (
		<QuestionHistoryView
			questions={data.questions}
			onAnswerQuestion={setSelectedQuestionId}
		/>
	) : (
		<QuestionList
			questions={data.questions}
			insightId={insightId}
			onSelectQuestion={setSelectedQuestionId}
		/>
	);
}

interface QuestionListProps {
	questions: InsightQuestion[];
	insightId: number;
	onSelectQuestion: (id: number) => void;
}

function QuestionList({
	questions,
	insightId,
	onSelectQuestion,
}: QuestionListProps) {
	return (
		<div className="flex flex-col gap-2 pb-8 h-max">
			{questions
				.filter((question) => question.status === "WAITING")
				.map((question) => (
					<QuestionItem
						key={question.questionId}
						question={question}
						onClick={() => onSelectQuestion(question.questionId)}
					/>
				))}

			<RefreshQuestionsButton insightId={insightId} />
		</div>
	);
}

interface QuestionItemProps {
	question: InsightQuestion;
	disabled?: boolean;
	onClick?: () => void;
}

export function QuestionItem({
	question,
	disabled,
	onClick,
}: QuestionItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"bg-white rounded-[32px] px-4 py-2 text-left transition-colors shadow-sm",
				disabled ? "opacity-40" : "hover:bg-gray-50",
			)}
		>
			<span className="typo-headline-1 font-semibold text-[var(--dnd-label-normal)] text-[18px]">
				{question.content}
			</span>
		</button>
	);
}

function RefreshQuestionsButton({ insightId }: { insightId: number }) {
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { mutate: generateQuestions, isPending } = useMutation({
		...generateInsightQuestionsMutationOptions(insightId),
		onSuccess: (newQuestions) => {
			setErrorMessage(null);
			queryClient.setQueryData<GetInsightQuestionsResponse>(
				insightKeys.questions(insightId),
				(currentData) => {
					if (!currentData) return currentData;

					return {
						...currentData,
						questions: [
							...currentData.questions.map((question) =>
								question.status === "WAITING"
									? { ...question, status: "ARCHIVED" as const }
									: question,
							),
							...newQuestions,
						],
					};
				},
			);
			queryClient.invalidateQueries({
				queryKey: insightKeys.questions(insightId),
			});
		},
		onError: () => {
			setErrorMessage("새로운 질문을 생성하지 못했어요. 다시 시도해주세요.");
		},
	});

	return (
		<div className="flex flex-col gap-4 pt-4 relative group items-start">
			<button
				type="button"
				className="bg-white border border-[var(--dnd-line-strong)] rounded-lg py-2 px-3 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
				onClick={() => generateQuestions()}
				disabled={isPending}
			>
				<div className="flex items-center justify-center gap-1">
					<Image src="/sparkle.svg" alt="sparkle" width={13} height={13} />
					<span className="typo-caption-1 font-medium text-[var(--dnd-label-neutral)]">
						{isPending ? "질문 생성 중..." : "새로운 질문 받기"}
					</span>
				</div>
			</button>

			{errorMessage && (
				<p className="typo-body-2 text-dnd-status-negative" role="alert">
					{errorMessage}
				</p>
			)}

			<div className="absolute top-full mt-2 left-0 right-0 z-10 bg-[var(--dnd-label-normal)] backdrop-blur-md rounded-lg p-2.5 text-[var(--dnd-bg-normal)] typo-body-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
				<div className="absolute top-[-6px] left-4 w-3 h-3 bg-[var(--dnd-label-normal)] rotate-45 transform" />
				<div className="text-center">
					이전 질문은 히스토리에서 다시 볼 수 있어요
				</div>
			</div>
		</div>
	);
}
