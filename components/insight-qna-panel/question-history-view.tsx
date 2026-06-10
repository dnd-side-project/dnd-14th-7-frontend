"use client";

import type { InsightQuestion } from "@/lib/queries/insight";

interface QuestionHistoryViewProps {
	questions: InsightQuestion[];
	onAnswerQuestion: (questionId: number) => void;
}

export function QuestionHistoryView({
	questions,
	onAnswerQuestion,
}: QuestionHistoryViewProps) {
	const archivedQuestions = questions.filter(
		(question) => question.status === "ARCHIVED",
	);

	if (archivedQuestions.length === 0) {
		return (
			<div className="flex min-h-40 items-center justify-center rounded-3xl bg-white px-6 text-center typo-body-2 text-dnd-label-alternative">
				아직 질문 히스토리가 없어요.
			</div>
		);
	}

	return (
		<div className="flex h-max flex-col gap-6 pb-8">
			<QuestionHistoryGroup title="이전 질문">
				{archivedQuestions.map((question) => (
					<QuestionHistoryItem key={question.questionId} question={question}>
						<button
							type="button"
							className="shrink-0 rounded-lg bg-dnd-bg-alternative px-3 py-2 typo-caption-1 font-semibold text-dnd-primary hover:bg-dnd-fill-normal"
							onClick={() => onAnswerQuestion(question.questionId)}
						>
							답변하기
						</button>
					</QuestionHistoryItem>
				))}
			</QuestionHistoryGroup>
		</div>
	);
}

function QuestionHistoryGroup({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<h3 className="px-1 typo-label-1 font-bold text-dnd-label-alternative">
				{title}
			</h3>
			<div className="flex flex-col gap-2">{children}</div>
		</section>
	);
}

export function QuestionHistoryItem({
	question,
	children,
}: {
	question: InsightQuestion;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-sm">
			<p className="min-w-0 flex-1 typo-body-1 font-medium text-dnd-label-normal">
				{question.content}
			</p>
			{children}
		</div>
	);
}
