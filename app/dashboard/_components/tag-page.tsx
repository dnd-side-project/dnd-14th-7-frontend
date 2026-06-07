"use client";

import {
	QueryErrorResetBoundary,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import type { InsightSummary } from "@/lib/queries/insight";
import { insightsQueryOptions } from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";

interface TagPageProps {
	tagId: number;
	tagName: string;
}

export function TagPage({ tagId, tagName }: TagPageProps) {
	return (
		<div className="flex w-full flex-col items-center px-10 pb-25 pt-15">
			<div className="w-full max-w-295 mx-auto flex flex-col gap-6">
				<TagPageHeader tagName={tagName} />
				<QueryErrorResetBoundary>
					{({ reset }) => (
						<ErrorBoundary
							onReset={reset}
							fallbackRender={({ resetErrorBoundary }) => (
								<TagPageError onRetry={resetErrorBoundary} />
							)}
						>
							<Suspense fallback={<TagPageSkeleton />}>
								<TagInsightGrid tagId={tagId} />
							</Suspense>
						</ErrorBoundary>
					)}
				</QueryErrorResetBoundary>
			</div>
		</div>
	);
}

function TagPageHeader({ tagName }: { tagName: string }) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex shrink-0 items-center justify-center rounded-xl bg-white p-3.5">
				<Image src="/hash-tag.svg" alt="" width={24} height={24} />
			</div>
			<div className="flex flex-1 items-center justify-between">
				<h1 className="typo-title-1 font-bold text-dnd-label-normal">
					{tagName}
				</h1>
				<button type="button" className="p-2 text-dnd-label-alternative">
					<MoreVertical size={24} />
				</button>
			</div>
		</div>
	);
}

function TagPageError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dnd-line-normal bg-white px-8 py-12 text-center shadow-dnd-normal">
			<p className="typo-headline-1 font-semibold text-dnd-label-normal">
				인사이트를 불러오지 못했어요.
			</p>
			<p className="typo-body-2 text-dnd-label-alternative">
				잠시 후 다시 시도해주세요.
			</p>
			<button
				type="button"
				onClick={onRetry}
				className="rounded-xl bg-dnd-primary px-5 py-2 typo-body-2 font-semibold text-white transition-colors hover:bg-dnd-primary-strong"
			>
				다시 시도
			</button>
		</div>
	);
}

function TagInsightGrid({ tagId }: { tagId: number }) {
	const { data } = useSuspenseQuery(insightsQueryOptions({ tag: tagId }));
	const { dispatch } = useDashboardTabs();
	const openInsight = (insightId: number) => {
		dispatch(
			{
				type: "add",
				tab: `insight:${insightId}`,
			},
			{
				type: "activate",
				tab: `insight:${insightId}`,
			},
		);
	};

	if (data.content.length === 0) {
		return (
			<div className="flex items-center justify-center py-20 text-dnd-label-alternative typo-headline-1">
				아직 이 태그에 인사이트가 없어요.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-4 gap-6">
			{data.content.map((insight) => (
				<div key={insight.insightId} className="relative">
					<InsightCard insight={insight} />
					<button
						type="button"
						className="absolute inset-0 z-10 rounded-4xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-primary focus-visible:ring-offset-2"
						aria-label={`${insight.title || "제목 없는 인사이트"} 인사이트 열기`}
						onClick={() => openInsight(insight.insightId)}
					/>
				</div>
			))}
		</div>
	);
}

function InsightCard({ insight }: { insight: InsightSummary }) {
	const { year, month, day } = formatDate(insight.createdDate);
	const dateStr = `${year}. ${month}. ${day}.`;

	return (
		<div className="flex flex-col items-start gap-7 rounded-4xl border border-dnd-line-normal bg-white p-6">
			<div className="flex w-full flex-col gap-1">
				<div className="flex items-center justify-between w-full">
					<h3 className="typo-heading-1 font-semibold text-dnd-label-normal line-clamp-1">
						{insight.title}
					</h3>
					<button
						type="button"
						className="relative z-20 p-1 text-dnd-label-alternative"
						aria-label="인사이트 더보기"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreVertical size={24} />
					</button>
				</div>
				<span className="typo-label-1 text-dnd-label-alternative">
					{dateStr}
				</span>
			</div>

			<p className="typo-headline-1 font-normal text-dnd-label-neutral line-clamp-3 w-full">
				{insight.confirmedContent}
			</p>

			<div className="flex flex-wrap gap-2">
				{insight.tags.map((tag) => (
					<span
						key={tag.tagId}
						className="rounded-lg border border-dnd-primary/40 bg-dnd-primary/5 px-2.5 py-1.5 typo-label-1 font-medium text-dnd-primary"
					>
						{tag.tagName}
					</span>
				))}
			</div>
		</div>
	);
}

const TAG_PAGE_SKELETON_KEYS = [
	"tag-page-skeleton-1",
	"tag-page-skeleton-2",
	"tag-page-skeleton-3",
	"tag-page-skeleton-4",
	"tag-page-skeleton-5",
	"tag-page-skeleton-6",
	"tag-page-skeleton-7",
	"tag-page-skeleton-8",
];

function TagPageSkeleton() {
	return (
		<div className="grid animate-pulse grid-cols-4 gap-6">
			{TAG_PAGE_SKELETON_KEYS.map((key) => (
				<div
					key={key}
					className="flex flex-col gap-7 rounded-4xl border border-dnd-line-normal bg-white p-6"
				>
					<div className="flex flex-col gap-1">
						<div className="h-5.5 w-3/4 rounded-md bg-dnd-fill-normal" />
						<div className="h-3.5 w-1/3 rounded-md bg-dnd-fill-normal" />
					</div>
					<div className="flex flex-col gap-1">
						<div className="h-4.5 w-full rounded-md bg-dnd-fill-normal" />
						<div className="h-4.5 w-full rounded-md bg-dnd-fill-normal" />
						<div className="h-4.5 w-2/3 rounded-md bg-dnd-fill-normal" />
					</div>
					<div className="flex gap-2">
						<div className="h-6.5 w-12 rounded-lg bg-dnd-fill-normal" />
						<div className="h-6.5 w-12 rounded-lg bg-dnd-fill-normal" />
					</div>
				</div>
			))}
		</div>
	);
}
