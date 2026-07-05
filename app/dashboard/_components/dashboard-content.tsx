"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { InsightDetailSection } from "@/components/insight-detail";
import { InsightInput } from "@/components/insight-input";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import type { InsightSummary } from "@/lib/queries/insight";
import {
	insightKeys,
	insightsQueryOptions,
	moveInsightToTrashMutationOptions,
	permanentlyDeleteInsightMutationOptions,
	restoreInsightById,
	restoreInsightMutationOptions,
} from "@/lib/queries/insight";
import { tagsQueryOptions } from "@/lib/queries/user";
import { deserializeTab } from "@/lib/tabs/tab-utils";
import { formatDate } from "@/lib/utils/date";
import { HomeInsightCard } from "./home-insight-card";
import {
	HomeInsightList,
	HomeTitleHeader,
	HomeToggleHeader,
} from "./home-insight-list";
import { HomeTagCard } from "./home-tag-card";
import { MyPage } from "./my-page";
import { TagPage } from "./tag-page";

const INSIGHT_SKELETON_KEYS = [
	"insight-skeleton-1",
	"insight-skeleton-2",
	"insight-skeleton-3",
	"insight-skeleton-4",
];
const TAG_SKELETON_KEYS = [
	"tag-skeleton-1",
	"tag-skeleton-2",
	"tag-skeleton-3",
	"tag-skeleton-4",
];

function formatInsightDate(dateString: string) {
	const { year, month, day } = formatDate(dateString);
	return `${year}. ${month}. ${day}.`;
}

function getInsightTitle(insight: InsightSummary) {
	return insight.title || "제목 없는 인사이트";
}

function buildTagPreviewMap(insights: InsightSummary[]) {
	const previewMap = new Map<number, { id: number; title: string }[]>();

	for (const insight of insights) {
		for (const tag of insight.tags) {
			const previews = previewMap.get(tag.tagId) ?? [];
			if (previews.length < 3) {
				previews.push({
					id: insight.insightId,
					title: getInsightTitle(insight),
				});
				previewMap.set(tag.tagId, previews);
			}
		}
	}

	return previewMap;
}

function HomePage() {
	const { dispatch } = useDashboardTabs();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const [isLatest, setIsLatest] = useState(true);
	const sort = isLatest ? "LATEST" : "VIEWS";
	const {
		data: insightsData,
		isError: isInsightsError,
		isLoading: isInsightsLoading,
	} = useQuery(insightsQueryOptions({ page: 0, size: 12, sort }));
	const {
		data: tags = [],
		isError: isTagsError,
		isLoading: isTagsLoading,
	} = useQuery(tagsQueryOptions());
	const insights = insightsData?.content ?? [];
	const tagPreviewMap = buildTagPreviewMap(insights);
	const restoreMovedInsight = async (insightId: number) => {
		try {
			await restoreInsightById(insightId);
			await queryClient.invalidateQueries({ queryKey: insightKeys.all });
		} catch {
			showToast({
				message: "인사이트를 복원하지 못했어요. 다시 시도해주세요.",
			});
		}
	};
	const {
		mutate: moveToTrash,
		isPending: isMovingToTrash,
		variables: movingId,
	} = useMutation({
		...moveInsightToTrashMutationOptions(),
		onSuccess: (_, insightId) => {
			queryClient.invalidateQueries({ queryKey: insightKeys.all });
			showToast({
				message: "휴지통으로 이동되었어요.",
				action: {
					label: "복원하기",
					onClick: () => {
						restoreMovedInsight(insightId);
					},
				},
			});
		},
	});

	const openInsight = (id: number) => {
		dispatch(
			{ type: "add", tab: `insight:${id}` },
			{ type: "activate", tab: `insight:${id}` },
		);
	};

	const openTag = (id: number, name: string) => {
		dispatch(
			{ type: "add", tab: `tag:${id}:${name}` },
			{ type: "activate", tab: `tag:${id}:${name}` },
		);
	};

	const handleMoveToTrash = (insightId: number) => {
		moveToTrash(insightId);
	};

	return (
		<div className="mx-auto flex w-full max-w-300 flex-col items-center gap-12 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:gap-20 lg:px-10 lg:pb-25 lg:pt-15">
			<div className="flex flex-col items-center gap-6">
				<Image
					src="/ahaive.svg"
					alt="Aha!ve"
					width={280}
					height={63}
					priority
				/>
			</div>

			<InsightInput
				titleClassName="text-center w-full"
				onSuccess={(id) =>
					dispatch({
						type: "add",
						tab: `insight:${id}`,
					})
				}
			/>

			<div className="mt-6 flex w-full flex-col gap-12 sm:mt-10 lg:gap-20">
				<HomeInsightList
					header={
						<HomeToggleHeader isLatest={isLatest} onToggle={setIsLatest} />
					}
					onMoreClick={() => {}}
				>
					{isInsightsLoading
						? INSIGHT_SKELETON_KEYS.map((key) => <HomeCardSkeleton key={key} />)
						: isInsightsError
							? [
									<EmptyHomeCard
										key="insights-error"
										message="인사이트를 불러오지 못했어요."
									/>,
								]
							: insights.length > 0
								? insights.map((insight) => (
										<HomeInsightCard
											key={`insight-${insight.insightId}`}
											id={insight.insightId}
											title={getInsightTitle(insight)}
											content={insight.confirmedContent}
											date={formatInsightDate(insight.createdDate)}
											tags={insight.tags.map((tag) => ({
												id: tag.tagId,
												name: tag.tagName,
											}))}
											onOpen={() => openInsight(insight.insightId)}
											actions={[
												{
													label:
														isMovingToTrash && movingId === insight.insightId
															? "이동 중..."
															: "휴지통으로 이동",
													iconSrc: "/trash.svg",
													iconAlt: "trash",
													disabled:
														isMovingToTrash && movingId === insight.insightId,
													onSelect: () => handleMoveToTrash(insight.insightId),
												},
											]}
										/>
									))
								: [
										<EmptyHomeCard
											key="empty-insights"
											message="아직 남긴 인사이트가 없어요. 오늘의 경험이나 고민을 한 줄로 적어보세요."
										/>,
									]}
				</HomeInsightList>

				<HomeInsightList
					header={
						<HomeTitleHeader
							title="태그"
							icon={
								<Image src="/hash-tag.svg" alt="#" width={19} height={19} />
							}
						/>
					}
					onMoreClick={() => {}}
				>
					{isTagsLoading
						? TAG_SKELETON_KEYS.map((key) => <HomeCardSkeleton key={key} />)
						: isTagsError
							? [
									<EmptyHomeCard
										key="tags-error"
										message="태그를 불러오지 못했어요."
									/>,
								]
							: tags.length > 0
								? tags.map((tag) => (
										<HomeTagCard
											key={`tag-${tag.tagId}`}
											id={tag.tagId}
											name={tag.tagName}
											insights={tagPreviewMap.get(tag.tagId) ?? []}
											totalCount={tag.insightCount}
											onOpen={() => openTag(tag.tagId, tag.tagName)}
										/>
									))
								: [
										<EmptyHomeCard
											key="empty-tags"
											message="아직 등록된 태그가 없어요."
										/>,
									]}
				</HomeInsightList>
			</div>
		</div>
	);
}

function HomeCardSkeleton() {
	return (
		<div className="flex h-73 w-65 shrink-0 flex-col gap-7 rounded-3xl border border-dnd-line-alternative bg-white p-6 shadow-dnd-normal animate-pulse">
			<div className="flex flex-col gap-2">
				<div className="h-5.5 w-3/4 rounded-md bg-dnd-fill-normal" />
				<div className="h-3.5 w-1/3 rounded-md bg-dnd-fill-normal" />
			</div>
			<div className="flex flex-col gap-1.5">
				<div className="h-4.5 w-full rounded-md bg-dnd-fill-normal" />
				<div className="h-4.5 w-5/6 rounded-md bg-dnd-fill-normal" />
				<div className="h-4.5 w-2/3 rounded-md bg-dnd-fill-normal" />
			</div>
			<div className="flex gap-2">
				<div className="h-4 w-13.5 rounded-xl bg-dnd-fill-normal" />
				<div className="h-4 w-13.5 rounded-xl bg-dnd-fill-normal" />
			</div>
		</div>
	);
}

function EmptyHomeCard({ message }: { message: string }) {
	return (
		<div className="flex h-45 w-70 shrink-0 items-center justify-center rounded-3xl border border-dashed border-dnd-line-normal bg-white px-6 text-center typo-body-1 text-dnd-label-alternative">
			{message}
		</div>
	);
}

function NewInsightPage() {
	const { dispatch } = useDashboardTabs();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 sm:px-8 lg:gap-10 lg:px-20 xl:px-60">
			<InsightInput
				onSuccess={(id) =>
					dispatch({
						type: "replace",
						targetTab: "new",
						newTab: `insight:${id}`,
					})
				}
			/>
		</div>
	);
}

function TrashPage() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const [deleteTarget, setDeleteTarget] = useState<InsightSummary | null>(null);
	const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
		null,
	);
	const {
		data: trashedInsightsData,
		isError,
		isLoading,
	} = useQuery(insightsQueryOptions({ page: 0, size: 50, status: "trashed" }));
	const trashedInsights = trashedInsightsData?.content ?? [];
	const {
		mutate: restoreInsight,
		isPending: isRestoring,
		variables: restoringId,
	} = useMutation({
		...restoreInsightMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: insightKeys.all });
		},
		onError: () => {
			showToast({
				message: "인사이트를 복구하지 못했어요. 다시 시도해주세요.",
			});
		},
	});
	const { mutate: permanentlyDeleteInsight, isPending: isDeleting } =
		useMutation({
			...permanentlyDeleteInsightMutationOptions(),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: insightKeys.all });
				setDeleteTarget(null);
				setDeleteErrorMessage(null);
			},
			onError: () => {
				setDeleteErrorMessage(
					"인사이트를 영구 삭제하지 못했어요. 다시 시도해주세요.",
				);
			},
		});

	const handleDeleteDialogOpenChange = (open: boolean) => {
		if (open) return;
		setDeleteTarget(null);
		setDeleteErrorMessage(null);
	};

	const handlePermanentDelete = () => {
		if (!deleteTarget || isDeleting) return;
		setDeleteErrorMessage(null);
		permanentlyDeleteInsight(deleteTarget.insightId);
	};

	return (
		<div className="mx-auto flex w-full max-w-300 flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10 lg:pb-25 lg:pt-15">
			<div className="flex items-center gap-3">
				<Trash2 className="size-7 text-dnd-label-neutral" />
				<div className="flex flex-col gap-1">
					<h1 className="typo-heading-2 font-bold text-dnd-label-strong">
						휴지통
					</h1>
					<p className="typo-body-2 text-dnd-label-alternative">
						휴지통으로 이동한 인사이트를 복구하거나 영구 삭제할 수 있어요.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
				{isLoading ? (
					INSIGHT_SKELETON_KEYS.map((key) => <HomeCardSkeleton key={key} />)
				) : isError ? (
					<div className="col-span-full flex w-full justify-center">
						<EmptyHomeCard message="휴지통을 불러오지 못했어요." />
					</div>
				) : trashedInsights.length > 0 ? (
					trashedInsights.map((insight) => (
						<HomeInsightCard
							key={`trashed-insight-${insight.insightId}`}
							id={insight.insightId}
							title={getInsightTitle(insight)}
							content={insight.confirmedContent}
							date={`삭제일 ${formatInsightDate(insight.trashedDate)}`}
							tags={insight.tags.map((tag) => ({
								id: tag.tagId,
								name: tag.tagName,
							}))}
							actions={[
								{
									label:
										isRestoring && restoringId === insight.insightId
											? "복구 중..."
											: "복구",
									iconSrc: "/re-try.svg",
									iconAlt: "restore",
									disabled: isRestoring && restoringId === insight.insightId,
									onSelect: () => restoreInsight(insight.insightId),
								},
								{
									label: "영구 삭제",
									iconSrc: "/delete.svg",
									iconAlt: "delete",
									tone: "danger",
									disabled: isDeleting,
									onSelect: () => setDeleteTarget(insight),
								},
							]}
						/>
					))
				) : (
					<div className="col-span-full flex w-full justify-center">
						<EmptyHomeCard message="휴지통이 비어 있어요." />
					</div>
				)}
			</div>

			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={handleDeleteDialogOpenChange}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-dnd-status-negative/10 text-dnd-status-negative">
							<Trash2 className="size-8" />
						</AlertDialogMedia>
						<AlertDialogTitle>
							{deleteTarget
								? `“${getInsightTitle(deleteTarget)}” 인사이트를 영구 삭제할까요?`
								: "인사이트를 영구 삭제할까요?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							영구 삭제한 인사이트는 다시 복구할 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{deleteErrorMessage && (
						<p
							className="typo-body-2 text-center text-dnd-status-negative"
							role="alert"
						>
							{deleteErrorMessage}
						</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isDeleting}
							onClick={(event) => {
								event.preventDefault();
								handlePermanentDelete();
							}}
						>
							{isDeleting ? "삭제 중..." : "영구 삭제"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export function DashboardContent() {
	const { state } = useDashboardTabs();
	const currentTabObj = deserializeTab(state.currentTab);

	switch (currentTabObj.type) {
		case "home":
			return <HomePage />;
		case "new":
			return <NewInsightPage />;
		case "insight":
			return <InsightDetailSection insightId={Number(currentTabObj.id)} />;
		case "trash":
			return <TrashPage />;
		case "mypage":
			return <MyPage />;
		case "tag":
			return (
				<TagPage
					tagId={Number(currentTabObj.id)}
					tagName={currentTabObj.name}
				/>
			);
		default:
			throw new Error("유효하지 않은 탭 타입입니다.");
	}
}
