"use client";

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
	answerQuestionMutationOptions,
	type InsightQuestion,
	insightQuestionsQueryOptions,
} from "@/lib/queries/insight";
import { QuestionItem } from "./question-section";

interface QuestionFormViewProps {
	selectedQuestionId: number;
	onCancel: () => void;
	insightId: number;
}

export function QuestionFormView({
	selectedQuestionId,
	onCancel,
	insightId,
}: QuestionFormViewProps) {
	const { data } = useSuspenseQuery(insightQuestionsQueryOptions(insightId));

	return (
		<div className="flex flex-col gap-2 pb-8 h-max">
			{data.questions.map((question) =>
				selectedQuestionId === question.questionId ? (
					<QuestionForm
						key={question.questionId}
						question={question}
						insightId={insightId}
						onCancel={onCancel}
					/>
				) : (
					<QuestionItem
						key={question.questionId}
						question={question}
						disabled
					/>
				),
			)}
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
				queryKey: ["insight-questions", insightId],
			});
			onCancel();
		},
	});

	return (
		<div className="bg-[var(--dnd-bg-mint2)] rounded-[32px] p-[24px] flex flex-col gap-[16px] border border-[#ebebeb]">
			{/* 질문 헤더 */}
			<div className="flex gap-[16px] items-center">
				<div className="p-[12px] bg-white rounded-[12px] flex items-center justify-center shrink-0">
					<Image
						src="/question-icon.svg"
						alt="question"
						width={23}
						height={24}
					/>
				</div>
				<h3 className="typo-headline-1 font-semibold text-[var(--dnd-label-normal)] flex-1">
					{question.content}
				</h3>
			</div>

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
						className="px-7 py-3 rounded-[12px] bg-dnd-primary text-white typo-headline-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
					>
						{isPending ? "제출 중..." : "완료"}
					</button>
				}
			/>
		</div>
	);
}
