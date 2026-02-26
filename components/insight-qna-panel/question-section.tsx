"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import type { InsightQuestion } from "@/lib/queries/insight";
import { insightQuestionsQueryOptions } from "@/lib/queries/insight";
import { cn } from "@/lib/utils";
import { QuestionFormView } from "./question-form-view";

interface QuestionSectionProps {
	insightId: number;
}

export function QuestionSection({ insightId }: QuestionSectionProps) {
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
		null,
	);

	if (selectedQuestionId !== null) {
		return (
			<QuestionFormView
				selectedQuestionId={selectedQuestionId}
				onCancel={() => setSelectedQuestionId(null)}
				insightId={insightId}
			/>
		);
	}

	return (
		<QuestionList
			insightId={insightId}
			onSelectQuestion={(id) => setSelectedQuestionId(id)}
		/>
	);
}

interface QuestionListProps {
	insightId: number;
	onSelectQuestion: (id: number) => void;
}

function QuestionList({ insightId, onSelectQuestion }: QuestionListProps) {
	const { data } = useSuspenseQuery(insightQuestionsQueryOptions(insightId));

	return (
		<div className="flex flex-col gap-2 pb-8 h-max">
			{data.questions
				.filter((question) => question.status === "WAITING")
				.map((question) => (
					<QuestionItem
						key={question.questionId}
						question={question}
						onClick={() => onSelectQuestion(question.questionId)}
					/>
				))}

			<RefreshQuestionsButton />
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

function RefreshQuestionsButton() {
	return (
		<div className="flex flex-col gap-4 pt-4 relative group items-start">
			<button
				type="button"
				className="bg-white border border-[var(--dnd-line-strong)] rounded-lg py-2 px-3 shadow-sm hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-center justify-center gap-1">
					<Image src="/sparkle.svg" alt="sparkle" width={13} height={13} />
					<span className="typo-caption-1 font-medium text-[var(--dnd-label-neutral)]">
						새로운 질문 받기
					</span>
				</div>
			</button>

			<div className="absolute top-full mt-2 left-0 right-0 z-10 bg-[var(--dnd-label-normal)] backdrop-blur-md rounded-lg p-2.5 text-[var(--dnd-bg-normal)] typo-body-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
				<div className="absolute top-[-6px] left-4 w-3 h-3 bg-[var(--dnd-label-normal)] rotate-45 transform" />
				<div className="text-center">
					이전 답변은 히스토리에서 다시 볼 수 있어요
				</div>
			</div>
		</div>
	);
}
