"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
	answerQuestionMutationOptions,
	type InsightQuestion,
	insightKeys,
} from "@/lib/queries/insight";
import { QuestionHistoryItem } from "./question-history-view";
import { QuestionItem } from "./question-section";

interface QuestionFormViewProps {
	questions: InsightQuestion[];
	selectedQuestionId: number;
	onSelectQuestion: (id: number | null) => void;
	insightId: number;
	visibleStatuses?: InsightQuestion["status"][];
	mode: "current" | "history";
}

export function QuestionFormView({
	questions,
	selectedQuestionId,
	onSelectQuestion,
	insightId,
	visibleStatuses,
	mode,
}: QuestionFormViewProps) {
	const visibleQuestions = visibleStatuses
		? questions.filter((question) => visibleStatuses.includes(question.status))
		: questions;

	return (
		<div className="flex flex-col gap-2 pb-8 h-max">
			{visibleQuestions.map((question) => {
				if (selectedQuestionId === question.questionId) {
					return (
						<QuestionForm
							key={question.questionId}
							question={question}
							insightId={insightId}
							onCancel={() => onSelectQuestion(null)}
						/>
					);
				}

				return mode === "history" ? (
					<QuestionHistoryItem key={question.questionId} question={question}>
						<button
							type="button"
							className="shrink-0 rounded-lg bg-dnd-bg-alternative px-3 py-2 typo-caption-1 font-semibold text-dnd-primary hover:bg-dnd-fill-normal"
							onClick={() => onSelectQuestion(question.questionId)}
						>
							답변하기
						</button>
					</QuestionHistoryItem>
				) : (
					<QuestionItem
						key={question.questionId}
						question={question}
						onClick={() => onSelectQuestion(question.questionId)}
					/>
				);
			})}
		</div>
	);
}

interface QuestionFormProps {
	question: InsightQuestion;
	insightId: number;
	onCancel: () => void;
}

function QuestionForm({ question, insightId, onCancel }: QuestionFormProps) {
	const [answerText, setAnswerText] = useState("");
	const queryClient = useQueryClient();

	const { mutate: submitAnswer, isPending } = useMutation({
		...answerQuestionMutationOptions(insightId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: insightKeys.questions(insightId),
			});
			onCancel();
		},
	});

	return (
		<div className="flex flex-col gap-4 rounded-[24px] border border-[#ebebeb] bg-[var(--dnd-bg-mint2)] p-4 sm:rounded-[32px] sm:p-6">
			{/* 질문 헤더 - 클릭 시 폼 닫기 */}
			<button
				type="button"
				onClick={onCancel}
				className="flex cursor-pointer items-start gap-3 text-left sm:items-center sm:gap-4"
			>
				<div className="p-[12px] bg-white rounded-[12px]">
					<Image
						src="/question-icon.svg"
						alt="question"
						width={23}
						height={24}
					/>
				</div>
				<h3 className="typo-headline-1 font-semibold text-[var(--dnd-label-normal)]">
					{question.content}
				</h3>
			</button>

			{/* 답변 입력 영역 */}
			<Textarea
				value={answerText}
				onChange={(e) => setAnswerText(e.target.value)}
				placeholder="답변을 입력해 주세요"
				maxLength={200}
				showCharacterCount
				resize="none"
				trailingContent={
					<button
						type="button"
						onClick={() =>
							submitAnswer({
								questionId: question.questionId,
								content: answerText,
							})
						}
						disabled={isPending || !answerText.trim()}
						className="rounded-[12px] bg-dnd-primary px-5 py-3 typo-headline-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:px-7"
					>
						{isPending ? "제출 중..." : "완료"}
					</button>
				}
			/>
		</div>
	);
}
