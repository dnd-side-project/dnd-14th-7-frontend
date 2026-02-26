"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { GetInsightResponse, InsightPiece } from "@/lib/queries/insight";
import {
	insightDetailQueryOptions,
	insightPiecesQueryOptions,
} from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";
import { InsightPieceItem } from "./insight-piece-item/insight-piece-item";
import { InsightQnAPanel, InsightQnAPanelSkeleton } from "./insight-qna-panel";

interface InsightDetailSectionProps {
	insightId: number;
}

export function InsightDetailSection({ insightId }: InsightDetailSectionProps) {
	return (
		<ErrorBoundary fallback={<div>Error loading insight</div>}>
			<Suspense fallback={<InsightDetailSkeleton />}>
				<InsightDetailContent insightId={insightId} />
			</Suspense>
		</ErrorBoundary>
	);
}

function InsightDetailSkeleton() {
	return (
		<div className="flex gap-[80px] justify-center pl-[80px] pr-[24px] animate-pulse">
			<div className="w-full flex flex-col gap-6 pt-[80px] pb-[80px]">
				<div className="flex justify-between items-start">
					<div className="flex flex-col gap-6 w-full">
						<div className="h-10 w-2/3 bg-[var(--dnd-fill-strong)] rounded-md" />
						<div className="flex flex-col gap-4">
							<div className="h-5 w-1/3 bg-[var(--dnd-fill-normal)] rounded-md" />
							<div className="flex gap-2">
								<div className="h-7 w-16 bg-[var(--dnd-fill-normal)] rounded-[10px]" />
								<div className="h-7 w-16 bg-[var(--dnd-fill-normal)] rounded-[10px]" />
								<div className="h-7 w-16 bg-[var(--dnd-fill-normal)] rounded-[10px]" />
							</div>
						</div>
					</div>
					<div className="w-6 h-6 bg-[var(--dnd-fill-normal)] rounded-full shrink-0" />
				</div>

				<div className="bg-[var(--dnd-bg-alternative)] rounded-3xl p-6 h-[72px] w-full flex items-center gap-4">
					<div className="h-6 w-16 bg-[var(--dnd-fill-normal)] rounded-[4px]" />
					<div className="h-6 w-2/3 bg-[var(--dnd-fill-normal)] rounded-md" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-8 w-24 bg-[var(--dnd-fill-normal)] rounded-md" />
					<div className="bg-[var(--dnd-bg-insight-box)] rounded-[32px] p-6 gap-4 flex flex-col">
						<div className="bg-white rounded-[24px] p-6 h-32 w-full" />
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-5 w-10 bg-[var(--dnd-fill-normal)] rounded-md" />
					<div className="h-[80px] w-full bg-[var(--dnd-fill-normal)] rounded-xl border border-[var(--dnd-line-normal)]" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-5 w-10 bg-[var(--dnd-fill-normal)] rounded-md" />
					<div className="flex gap-3">
						<div className="h-[46px] flex-[1] bg-[var(--dnd-fill-normal)] rounded-xl border border-[var(--dnd-line-normal)]" />
						<div className="h-[46px] flex-[2] bg-[var(--dnd-fill-normal)] rounded-xl border border-[var(--dnd-line-normal)]" />
						<div className="h-[46px] w-[86px] bg-[var(--dnd-fill-normal)] rounded-xl" />
					</div>
				</div>
			</div>

			{/* Q&A Panel Skeleton */}
			<div className="pt-[24px] pb-[24px]">
				<InsightQnAPanelSkeleton />
			</div>
		</div>
	);
}

function InsightDetailContent({ insightId }: { insightId: number }) {
	const [{ data }, { data: piecesData }] = useSuspenseQueries({
		queries: [
			insightDetailQueryOptions(insightId),
			insightPiecesQueryOptions(insightId),
		],
	});

	return (
		<div className="flex gap-[80px] justify-center pl-[80px] pr-[24px]">
			<div className="w-full flex flex-col gap-6 pt-[80px] pb-[80px]">
				<InsightHeader data={data} />
				<InitialThoughtBox initialThought={data.initialThought} />
				<MainInsightBox insightPieces={insightPieces} />
				<MemoSection />
				<LinkSection />
			</div>
			<div className="pt-[24px] pb-[24px]">
				<InsightQnAPanel insightId={insightId} />
			</div>
		</div>
	);
}

function InsightHeader({ data }: { data: GetInsightResponse }) {
	const createdDate = formatDate(data.createdDate);
	const updatedDate = formatDate(data.updatedDate);

	const createdDateStr = `${createdDate.year}.${createdDate.month}.${createdDate.day} ${createdDate.weekday} ${createdDate.ampm} ${createdDate.formattedHours}:${createdDate.minutes}`;
	const modifiedDateStr = `${updatedDate.year}.${updatedDate.month}.${updatedDate.day} ${updatedDate.weekday} (수정)`;

	const getTagStyle = (tagId: number) => {
		const colors = [
			"dnd-tag-brown",
			"dnd-tag-red",
			"dnd-tag-orange",
			"dnd-tag-yellow",
			"dnd-tag-green",
			"dnd-tag-teal",
			"dnd-tag-blue",
			"dnd-tag-purple",
			"dnd-tag-pink",
		];
		const index = Math.abs(tagId - 1) % colors.length;
		return colors[index];
	};

	return (
		<div className="flex justify-between items-start">
			<div className="flex flex-col gap-6">
				<h1 className="typo-title-1 font-bold text-[var(--dnd-label-strong)]">
					{data.title}
				</h1>
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2 typo-body-2 text-[var(--dnd-label-alternative)]">
						<span>{createdDateStr}</span>
						<span className="w-[1px] h-3 bg-[var(--dnd-line-normal)]" />
						<span>{modifiedDateStr}</span>
					</div>
					<div className="flex gap-[8px]">
						{data.tags.map((tag) => (
							<span
								key={tag.tagId}
								className={`rounded-[10px] px-[11px] py-[7px] typo-caption-1 font-bold ${getTagStyle(tag.tagId)}`}
							>
								{tag.tagName}
							</span>
						))}
					</div>
				</div>
			</div>
			<button type="button" className="p-2 text-[var(--dnd-label-alternative)]">
				<MoreVertical size={24} />
			</button>
		</div>
	);
}

function InitialThoughtBox({ initialThought }: { initialThought: string }) {
	return (
		<div className="bg-[var(--dnd-bg-alternative)] rounded-3xl px-6 py-5 flex items-center gap-4">
			<span className="bg-[var(--dnd-fill-normal)] text-[var(--dnd-label-alternative)] rounded-[4px] px-2 py-1 typo-caption-1 font-medium shrink-0">
				첫 생각
			</span>
			<p className="typo-body-1 text-[var(--dnd-label-normal)]">
				{initialThought}
			</p>
		</div>
	);
}

function MainInsightBox({ insightPieces }: { insightPieces: InsightPiece[] }) {
	return (
		<div className="flex flex-col gap-3">
			<span className="typo-headline-2 font-bold text-[var(--dnd-label-neutral)]">
				인사이트{" "}
				<span className="text-[var(--dnd-primary)]">
					{insightPieces.length}
				</span>
			</span>
			<div className="rounded-[32px] p-6 flex flex-col gap-4 bg-[var(--dnd-bg-insight-box)] relative z-50">
				{insightPieces.map((piece, index) => (
					<InsightPieceItem
						key={piece.insightPieceId}
						piece={piece}
						index={index}
					/>
				))}
			</div>
		</div>
	);
}

function MemoSection() {
	return (
		<div className="flex flex-col gap-3">
			<label
				htmlFor="memo"
				className="typo-label-1 font-bold text-[var(--dnd-label-alternative)]"
			>
				메모
			</label>
			<textarea
				id="memo"
				className="w-full bg-transparent border border-[var(--dnd-line-normal)] rounded-xl p-4 min-h-[80px] placeholder-[var(--dnd-label-assistive)] typo-body-2 focus:outline-none focus:border-[var(--dnd-primary)] transition-colors resize-none"
				placeholder="상황, 참고내용 등 추가 메모를 입력해주세요."
			/>
		</div>
	);
}

function LinkSection() {
	return (
		<div className="flex flex-col gap-3">
			<label
				htmlFor="link"
				className="typo-label-1 font-bold text-[var(--dnd-label-alternative)]"
			>
				링크
			</label>
			<div className="flex gap-3">
				<input
					type="text"
					id="link-title"
					name="link-title"
					className="flex-[1] bg-transparent border border-[var(--dnd-line-normal)] rounded-xl px-4 py-3 placeholder-[var(--dnd-label-assistive)] typo-body-2 focus:outline-none focus:border-[var(--dnd-primary)] transition-colors"
					placeholder="링크 제목"
				/>
				<input
					type="text"
					id="link-url"
					name="link-url"
					className="flex-[2] bg-transparent border border-[var(--dnd-line-normal)] rounded-xl px-4 py-3 placeholder-[var(--dnd-label-assistive)] typo-body-2 focus:outline-none focus:border-[var(--dnd-primary)] transition-colors"
					placeholder="https://"
				/>
				<button
					type="button"
					className="bg-[var(--dnd-bg-alternative)] text-[var(--dnd-label-assistant)] px-6 rounded-xl typo-body-2 font-medium hover:bg-[var(--dnd-fill-normal)] transition-colors"
				>
					추가하기
				</button>
			</div>
		</div>
	);
}
