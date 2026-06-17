"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import {
	createContext,
	type KeyboardEvent,
	type ReactNode,
	type RefObject,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import type { GetInsightResponse, InsightPiece } from "@/lib/queries/insight";
import {
	insightDetailQueryOptions,
	insightKeys,
	insightPieceCreationMutationOptions,
	insightPiecesQueryOptions,
	moveInsightToTrashMutationOptions,
	restoreInsightById,
	updateInsightTitleMutationOptions,
} from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";
import { LinkSection } from "./insight-detail/link-section";
import { MemoSection } from "./insight-detail/memo-section";
import { InsightPieceItem } from "./insight-piece-item/insight-piece-item";
import { InsightQnAPanel, InsightQnAPanelSkeleton } from "./insight-qna-panel";

interface InsightDetailSectionProps {
	insightId: number;
}

export function InsightDetailSection({ insightId }: InsightDetailSectionProps) {
	return <InsightDetailContent key={insightId} insightId={insightId} />;
}

function InsightDetailError() {
	return (
		<div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-6 text-center">
			<div className="flex flex-col gap-3 rounded-3xl border border-dnd-line-normal bg-white px-8 py-6 shadow-dnd-normal">
				<h2 className="typo-heading-1 font-semibold text-dnd-label-normal">
					인사이트를 불러올 수 없어요.
				</h2>
				<p className="typo-body-2 text-dnd-label-alternative">
					삭제되었거나 접근 권한이 없는 인사이트일 수 있어요.
				</p>
			</div>
		</div>
	);
}

function InsightDetailSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-6 px-4 sm:px-6 xl:flex-row xl:justify-center xl:gap-12 xl:px-10 2xl:gap-20 2xl:pl-20 2xl:pr-6">
			<div className="flex w-full min-w-0 max-w-190 flex-col gap-6 py-8 sm:py-12 xl:py-20">
				<div className="flex justify-between items-start">
					<div className="flex flex-col gap-6 w-full">
						<div className="h-10 w-2/3 animate-pulse rounded-md bg-dnd-fill-strong" />
						<div className="flex flex-col gap-4">
							<div className="h-5 w-1/3 animate-pulse rounded-md bg-dnd-fill-normal" />
							<div className="flex gap-2">
								<div className="h-7 w-16 animate-pulse rounded-[10px] bg-dnd-fill-normal" />
								<div className="h-7 w-16 animate-pulse rounded-[10px] bg-dnd-fill-normal" />
								<div className="h-7 w-16 animate-pulse rounded-[10px] bg-dnd-fill-normal" />
							</div>
						</div>
					</div>
					<div className="w-6 h-6 shrink-0 animate-pulse rounded-full bg-dnd-fill-normal" />
				</div>

				<div className="bg-dnd-bg-alternative rounded-3xl p-6 h-18 w-full flex items-center gap-4">
					<div className="h-6 w-16 animate-pulse rounded-lg bg-dnd-fill-normal" />
					<div className="h-6 w-2/3 animate-pulse rounded-md bg-dnd-fill-normal" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-8 w-24 animate-pulse rounded-md bg-dnd-fill-normal" />
					<div className="bg-dnd-bg-insight-box rounded-4xl p-6 gap-4 flex flex-col">
						<div className="h-32 w-full animate-pulse rounded-3xl bg-white p-6" />
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-5 w-10 animate-pulse rounded-md bg-dnd-fill-normal" />
					<div className="h-20 w-full animate-pulse rounded-xl border border-dnd-line-normal bg-dnd-fill-normal" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-5 w-10 animate-pulse rounded-md bg-dnd-fill-normal" />
					<div className="flex gap-3">
						<div className="h-11.5 flex-1 animate-pulse rounded-xl border border-dnd-line-normal bg-dnd-fill-normal" />
						<div className="h-11.5 flex-2 animate-pulse rounded-xl border border-dnd-line-normal bg-dnd-fill-normal" />
						<div className="h-11.5 w-21.5 animate-pulse rounded-xl bg-dnd-fill-normal" />
					</div>
				</div>
			</div>

			{/* Q&A Panel Skeleton */}
			<div className="pb-6 xl:pt-6">
				<InsightQnAPanelSkeleton />
			</div>
		</div>
	);
}

function InsightDetailContent({ insightId }: { insightId: number }) {
	const detailQuery = useQuery(insightDetailQueryOptions(insightId));
	const piecesQuery = useQuery(insightPiecesQueryOptions(insightId));

	if (detailQuery.isPending || piecesQuery.isPending) {
		return <InsightDetailSkeleton />;
	}

	if (detailQuery.isError || piecesQuery.isError) {
		return <InsightDetailError />;
	}

	const data = detailQuery.data;
	const piecesData = piecesQuery.data;

	return (
		<div className="flex min-w-0 flex-col gap-6 px-4 sm:px-6 xl:flex-row xl:justify-center xl:gap-12 xl:px-10 2xl:gap-20 2xl:pl-20 2xl:pr-6">
			<div className="flex w-full min-w-0 max-w-190 flex-col gap-6 py-8 sm:py-12 xl:py-20">
				<InsightHeader data={data} />
				<InitialThoughtBox initialThought={data.initialThought} />
				<MainInsightBox insightId={insightId} insightPieces={piecesData} />
				<MemoSection insightId={insightId} initialMemo={data.memo} />
				<LinkSection insightId={insightId} />
			</div>
			<div className="pb-6 xl:pt-6">
				<InsightQnAPanel insightId={insightId} />
			</div>
		</div>
	);
}

interface InsightTitleContextValue {
	editValue: string;
	handleChange: (value: string) => void;
	handleBlur: () => void;
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	inputRef: RefObject<HTMLInputElement | null>;
}

const InsightTitleContext = createContext<InsightTitleContextValue | null>(
	null,
);

function useInsightTitleContext() {
	const ctx = useContext(InsightTitleContext);
	if (!ctx) {
		throw new Error(
			"InsightTitle 하위 컴포넌트는 InsightTitle 내부에서 사용해야 합니다.",
		);
	}
	return ctx;
}

function InsightTitleRoot({
	data,
	children,
}: {
	data: GetInsightResponse;
	children: ReactNode;
}) {
	const queryClient = useQueryClient();
	const [editValue, setEditValue] = useState(data.title);
	const [savedTitle, setSavedTitle] = useState(data.title);
	const inputRef = useRef<HTMLInputElement>(null);
	const savedTitleRef = useRef(data.title);
	const pendingTitleRef = useRef<string | null>(null);
	const titleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const titleSaveQueueRef = useRef<Promise<void>>(Promise.resolve());

	const clearTitleSaveTimer = useCallback(() => {
		if (!titleSaveTimerRef.current) return;
		clearTimeout(titleSaveTimerRef.current);
		titleSaveTimerRef.current = null;
	}, []);

	const { mutateAsync: updateTitle } = useMutation({
		...updateInsightTitleMutationOptions(data.insightId),
		onSuccess: (_, variables) => {
			savedTitleRef.current = variables.title;
			setSavedTitle(variables.title);
			queryClient.invalidateQueries({
				queryKey: insightKeys.detail(data.insightId),
			});
		},
		onError: () => {
			setEditValue(savedTitleRef.current);
		},
	});

	const enqueueTitleSave = useCallback(
		(title: string) => {
			const trimmed = title.trim();
			if (
				!trimmed ||
				trimmed === savedTitleRef.current ||
				trimmed === pendingTitleRef.current
			) {
				return;
			}

			pendingTitleRef.current = trimmed;
			titleSaveQueueRef.current = titleSaveQueueRef.current
				.catch(() => undefined)
				.then(async () => {
					if (trimmed === savedTitleRef.current) return;
					await updateTitle({ title: trimmed });
				})
				.finally(() => {
					if (pendingTitleRef.current === trimmed) {
						pendingTitleRef.current = null;
					}
				});
		},
		[updateTitle],
	);

	useEffect(() => {
		const nextTitle = editValue.trim();
		if (!nextTitle || nextTitle === savedTitle) {
			clearTitleSaveTimer();
			return;
		}

		clearTitleSaveTimer();
		titleSaveTimerRef.current = setTimeout(() => {
			enqueueTitleSave(nextTitle);
			titleSaveTimerRef.current = null;
		}, 600);

		return clearTitleSaveTimer;
	}, [clearTitleSaveTimer, editValue, enqueueTitleSave, savedTitle]);

	const handleChange = (value: string) => {
		setEditValue(value);
	};

	const handleBlur = () => {
		const trimmed = editValue.trim();
		clearTitleSaveTimer();

		if (!trimmed) {
			setEditValue(savedTitle);
			return;
		}

		if (trimmed !== savedTitle) {
			setEditValue(trimmed);
			enqueueTitleSave(trimmed);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.nativeEvent.isComposing) return;

		if (e.key === "Enter") {
			e.preventDefault();
			e.currentTarget.blur();
		} else if (e.key === "Escape") {
			clearTitleSaveTimer();
			setEditValue(savedTitle);
			e.currentTarget.blur();
		}
	};

	return (
		<InsightTitleContext.Provider
			value={{
				editValue,
				handleChange,
				handleBlur,
				handleKeyDown,
				inputRef,
			}}
		>
			{children}
		</InsightTitleContext.Provider>
	);
}

function InsightTitleEditing() {
	const { editValue, handleChange, handleBlur, handleKeyDown, inputRef } =
		useInsightTitleContext();

	return (
		<input
			ref={inputRef}
			type="text"
			value={editValue}
			placeholder="제목 없는 인사이트"
			onChange={(e) => handleChange(e.target.value)}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			className="w-full bg-transparent typo-title-1 font-bold text-dnd-label-strong placeholder-dnd-label-assistive outline-none transition-colors focus:text-dnd-primary"
			aria-label="인사이트 제목"
		/>
	);
}

function InsightTitleDisplay() {
	return null;
}

const InsightTitle = Object.assign(InsightTitleRoot, {
	Editing: InsightTitleEditing,
	Display: InsightTitleDisplay,
});

function InsightHeader({ data }: { data: GetInsightResponse }) {
	const queryClient = useQueryClient();
	const { dispatch } = useDashboardTabs();
	const { showToast } = useToast();
	const createdDate = formatDate(data.createdDate);
	const updatedDate = formatDate(data.updatedDate);
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
	const { mutate: moveToTrash, isPending: isMovingToTrash } = useMutation({
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
			dispatch({ type: "remove", tab: `insight:${data.insightId}` });
		},
	});

	const createdDateStr = `${createdDate.year}.${createdDate.month}.${createdDate.day} ${createdDate.weekday} ${createdDate.ampm} ${createdDate.formattedHours}:${createdDate.minutes}`;
	const modifiedDateStr = `${updatedDate.year}.${updatedDate.month}.${updatedDate.day} ${updatedDate.weekday} (수정)`;

	const handleMoveToTrash = () => {
		if (isMovingToTrash) return;
		moveToTrash(data.insightId);
	};

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
				<InsightTitle data={data}>
					<InsightTitle.Editing />
					<InsightTitle.Display />
				</InsightTitle>
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2 typo-body-2 text-dnd-label-alternative">
						<span>{createdDateStr}</span>
						<span className="w-px h-3 bg-dnd-line-normal" />
						<span>{modifiedDateStr}</span>
					</div>
					<div className="flex gap-2">
						{data.tags.map((tag) => (
							<span
								key={tag.tagId}
								className={`rounded-[10px] px-2.75 py-1.75 typo-caption-1 font-bold ${getTagStyle(tag.tagId)}`}
							>
								{tag.tagName}
							</span>
						))}
					</div>
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="p-2 text-dnd-label-alternative hover:text-dnd-label-normal"
						aria-label="인사이트 메뉴"
					>
						<MoreVertical size={24} />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-44 rounded-2xl border-none bg-white p-2 shadow-lg"
				>
					<DropdownMenuItem
						className="flex h-12 cursor-pointer items-center gap-3 rounded-lg px-3 typo-body-1 font-normal text-dnd-label-neutral hover:text-dnd-status-negative focus:bg-dnd-bg-alternative focus:text-dnd-status-negative data-disabled:opacity-50"
						onSelect={handleMoveToTrash}
						disabled={isMovingToTrash}
					>
						<Trash2 className="size-5" />
						{isMovingToTrash ? "이동 중..." : "휴지통으로 이동"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function InitialThoughtBox({ initialThought }: { initialThought: string }) {
	return (
		<div className="flex items-start gap-3 rounded-3xl bg-dnd-bg-alternative px-4 py-4 sm:items-center sm:gap-4 sm:px-6 sm:py-5">
			<span className="bg-dnd-fill-normal text-dnd-label-alternative rounded-lg px-2 py-1 typo-caption-1 font-medium shrink-0">
				첫 생각
			</span>
			<p className="typo-body-1 text-dnd-label-normal">{initialThought}</p>
		</div>
	);
}

function MainInsightBox({
	insightId,
	insightPieces,
}: {
	insightId: number;
	insightPieces: InsightPiece[];
}) {
	const [isInputVisible, setIsInputVisible] = useState(false);
	const [activeRetryPieceId, setActiveRetryPieceId] = useState<number | null>(
		null,
	);
	const [inputValue, setInputValue] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const queryClient = useQueryClient();
	const { mutate: createPiece, isPending } = useMutation({
		...insightPieceCreationMutationOptions(insightId),
		onSuccess: (createdPiece) => {
			queryClient.setQueryData<InsightPiece[]>(
				insightKeys.pieces(insightId),
				(currentPieces) =>
					currentPieces ? [...currentPieces, createdPiece] : currentPieces,
			);
			queryClient.invalidateQueries({
				queryKey: insightKeys.pieces(insightId),
			});
			setInputValue("");
			setErrorMessage(null);
			setIsInputVisible(false);
		},
		onError: () => {
			setErrorMessage("인사이트를 저장하지 못했어요. 다시 시도해주세요.");
		},
	});

	useEffect(() => {
		if (isInputVisible) {
			inputRef.current?.focus();
		}
	}, [isInputVisible]);

	const canSave = inputValue.trim().length > 0;
	const handleSave = () => {
		if (!canSave || isPending) return;
		createPiece({ content: inputValue.trim() });
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (
			e.key === "Enter" &&
			(e.metaKey || e.ctrlKey) &&
			!e.nativeEvent.isComposing
		) {
			e.preventDefault();
			handleSave();
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-5">
				<span className="typo-headline-2 font-bold text-dnd-label-neutral">
					인사이트{" "}
					<span className="text-dnd-primary">{insightPieces.length}</span>
				</span>
				<button
					type="button"
					className="shrink-0"
					onClick={() => {
						setErrorMessage(null);
						setIsInputVisible((prev) => !prev);
					}}
					aria-label="인사이트 추가"
				>
					<Image src="/plus.svg" alt="" width={24} height={24} />
				</button>
			</div>
			<div className="relative">
				{activeRetryPieceId !== null && (
					<div className="fixed inset-0 z-40 bg-black/40" />
				)}
				<div
					className={`rounded-4xl p-6 flex flex-col gap-4 bg-dnd-bg-insight-box ${activeRetryPieceId !== null ? "relative z-50" : ""}`}
				>
					{insightPieces.map((piece, index) => (
						<InsightPieceItem
							key={piece.insightPieceId}
							insightId={insightId}
							piece={piece}
							index={index}
							onRetryStart={setActiveRetryPieceId}
							onRetryEnd={() => setActiveRetryPieceId(null)}
						/>
					))}
					{isInputVisible && (
						<div className="flex flex-col gap-2">
							<div className="relative">
								<textarea
									ref={inputRef}
									className="min-h-32 w-full resize-none rounded-2xl border border-dnd-line-normal bg-white p-4 pb-16 typo-body-1 text-dnd-label-normal placeholder-dnd-label-assistive transition-colors focus:border-dnd-primary focus:outline-none disabled:text-dnd-label-disable"
									placeholder="새로운 인사이트를 입력하세요"
									value={inputValue}
									onChange={(e) => {
										setInputValue(e.target.value);
										setErrorMessage(null);
									}}
									onKeyDown={handleKeyDown}
									disabled={isPending}
								/>
								<div className="absolute right-3 bottom-3 flex items-center gap-2">
									<button
										type="button"
										className="rounded-xl bg-white/90 px-4 py-2 typo-body-2 font-medium text-dnd-label-alternative shadow-sm hover:bg-dnd-bg-alternative disabled:text-dnd-label-disable"
										onClick={() => {
											setInputValue("");
											setErrorMessage(null);
											setIsInputVisible(false);
										}}
										disabled={isPending}
									>
										취소
									</button>
									<button
										type="button"
										className="rounded-xl bg-dnd-primary px-4 py-2 typo-body-2 font-semibold text-white shadow-sm hover:bg-dnd-primary-strong disabled:bg-dnd-interaction-disable disabled:text-dnd-label-disable"
										onClick={handleSave}
										disabled={isPending || !canSave}
									>
										{isPending ? "저장 중..." : "저장"}
									</button>
								</div>
							</div>
							{errorMessage && (
								<p
									className="typo-body-2 text-dnd-status-negative"
									role="alert"
								>
									{errorMessage}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
