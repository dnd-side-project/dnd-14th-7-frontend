"use client";

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import Image from "next/image";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InsightAnswerCard } from "@/lib/queries/insight";
import {
	convertAnswerToBlockMutationOptions,
	insightQuestionsQueryOptions,
} from "@/lib/queries/insight";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

interface AnswerCardsSectionProps {
	insightId: number;
}

export function AnswerCardsSection({ insightId }: AnswerCardsSectionProps) {
	const { data } = useSuspenseQuery(insightQuestionsQueryOptions(insightId));
	const answerCards = data.answerCards;

	return (
		<div className="flex flex-col gap-6 h-max">
			{answerCards.map((card) => (
				<AnswerCardItem key={card.answerId} card={card} insightId={insightId} />
			))}
		</div>
	);
}

function AnswerCardItem({
	card,
	insightId,
}: {
	card: InsightAnswerCard;
	insightId: number;
}) {
	const { year, month, day, weekday } = formatDate(card.createdDate);
	const dateStr = `${year}.${month}.${day} ${weekday}`;

	return (
		<div
			className={cn(
				"rounded-[32px] p-[24px] flex flex-col gap-[16px] border border-[#ebebeb] group",
				card.isConverted
					? "bg-[var(--dnd-bg-mint2)]"
					: "bg-[var(--dnd-bg-normal)]",
			)}
		>
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
					{card.questionContent}
				</h3>
			</div>

			<div
				className={cn(
					"rounded-[16px] p-[16px] flex flex-col gap-[24px]",
					card.isConverted ? "bg-white" : "bg-[var(--dnd-fill-alternative)]",
				)}
			>
				<p className="typo-headline-2 font-normal text-[var(--dnd-label-normal)] whitespace-pre-wrap">
					{card.answerContent}
				</p>

				<div className="flex items-center justify-between">
					<span className="typo-label-1 font-normal text-[var(--dnd-label-alternative)]">
						{dateStr}
					</span>

					<div className="flex items-center gap-2">
						{card.isConverted && (
							<span className="typo-label-1 font-semibold text-[var(--dnd-primary)]">
								인사이트 저장됨
							</span>
						)}
						<AnswerCardMenu
							showOnHover={!card.isConverted}
							insightId={insightId}
							answerId={card.answerId}
							isConverted={card.isConverted}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

interface AnswerCardMenuProps {
	showOnHover: boolean;
	insightId: number;
	answerId: number;
	isConverted: boolean;
}

function AnswerCardMenu({
	showOnHover,
	insightId,
	answerId,
	isConverted,
}: AnswerCardMenuProps) {
	const queryClient = useQueryClient();

	const { mutate: makeInsight } = useMutation({
		...convertAnswerToBlockMutationOptions(insightId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["insight-questions", insightId],
			});
			queryClient.invalidateQueries({
				queryKey: ["insight-pieces", insightId],
			});
		},
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={cn(
					"p-0.5",
					showOnHover && "opacity-0 group-hover:opacity-100 transition-opacity",
				)}
				aria-label="답변카드 메뉴"
			>
				<Image src="/kebab-icon.svg" alt="menu" width={17} height={17} />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[200px] rounded-[16px] p-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
			>
				<DropdownMenuItem
					className="px-[12px] h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)]"
					onClick={() => makeInsight(answerId)}
					disabled={isConverted}
				>
					인사이트로 만들기
				</DropdownMenuItem>
				{/* <DropdownMenuItem className="px-[12px] h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)]">
					수정
				</DropdownMenuItem>
				<DropdownMenuItem className="px-[12px] h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)]">
					삭제
				</DropdownMenuItem> */}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
