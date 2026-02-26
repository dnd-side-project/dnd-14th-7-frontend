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
	insightKeys,
	insightQuestionsQueryOptions,
} from "@/lib/queries/insight";
import { QuestionItem } from "./question-section";

interface QuestionFormViewProps {
	selectedQuestionId: number;
	onSelectQuestion: (id: number | null) => void;
	insightId: number;
}

export function QuestionFormView({
	selectedQuestionId,
	onSelectQuestion,
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
						onCancel={() => onSelectQuestion(null)}
					/>
				) : (
					<QuestionItem
						key={question.questionId}
						question={question}
						onClick={() => onSelectQuestion(question.questionId)}
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
				queryKey: insightKeys.questions(insightId),
			});
			onCancel();
		},
	});

	return (
		<div className="bg-[var(--dnd-bg-mint2)] rounded-[32px] p-[24px] flex flex-col gap-[16px] border border-[#ebebeb]">
			{/* 질문 헤더 - 클릭 시 폼 닫기 */}
			<button
				type="button"
				onClick={onCancel}
				className="flex gap-[16px] items-center text-left cursor-pointer"
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
						className="px-7 py-3 rounded-[12px] bg-dnd-primary text-white typo-headline-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
					>
						{isPending ? "제출 중..." : "완료"}
					</button>
				}
			/>
		</div>
	);
}
