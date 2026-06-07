"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import Image from "next/image";
import {
	createContext,
	type KeyboardEvent,
	type ReactNode,
	type RefObject,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { GetInsightResponse, InsightPiece } from "@/lib/queries/insight";
import {
	insightDetailQueryOptions,
	insightKeys,
	insightPieceCreationMutationOptions,
	insightPiecesQueryOptions,
	updateInsightTitleMutationOptions,
} from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";
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
		<div className="flex min-w-0 flex-col gap-8 px-6 xl:flex-row xl:justify-center xl:gap-12 xl:px-10 2xl:gap-20 2xl:pl-20 2xl:pr-6">
			<div className="flex w-full min-w-0 max-w-190 flex-col gap-6 pt-20 pb-20">
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
		<div className="flex min-w-0 flex-col gap-8 px-6 xl:flex-row xl:justify-center xl:gap-12 xl:px-10 2xl:gap-20 2xl:pl-20 2xl:pr-6">
			<div className="flex w-full min-w-0 max-w-190 flex-col gap-6 pt-20 pb-20">
				<InsightHeader data={data} />
				<InitialThoughtBox initialThought={data.initialThought} />
				<MainInsightBox insightId={insightId} insightPieces={piecesData} />
				<MemoSection />
				<LinkSection />
			</div>
			<div className="pb-6 xl:pt-6">
				<InsightQnAPanel insightId={insightId} />
			</div>
		</div>
	);
}

interface InsightTitleContextValue {
	isEditing: boolean;
	editValue: string;
	setEditValue: (v: string) => void;
	handleSubmit: () => void;
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	handleTitleClick: () => void;
	inputRef: RefObject<HTMLInputElement | null>;
	title: string;
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
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(data.title);
	const inputRef = useRef<HTMLInputElement>(null);

	const { mutate: updateTitle } = useMutation({
		...updateInsightTitleMutationOptions(data.insightId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: insightKeys.detail(data.insightId),
			});
		},
		onError: () => {
			setEditValue(data.title);
		},
	});

	const handleSubmit = () => {
		const trimmed = editValue.trim();
		if (!trimmed || trimmed === data.title) {
			setEditValue(data.title);
			setIsEditing(false);
			return;
		}
		updateTitle({ title: trimmed });
		setIsEditing(false);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			setEditValue(data.title);
			setIsEditing(false);
		}
	};

	const handleTitleClick = () => {
		setIsEditing(true);
		setEditValue(data.title);
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
	};

	return (
		<InsightTitleContext.Provider
			value={{
				isEditing,
				editValue,
				setEditValue,
				handleSubmit,
				handleKeyDown,
				handleTitleClick,
				inputRef,
				title: data.title || "제목 없는 인사이트",
			}}
		>
			{children}
		</InsightTitleContext.Provider>
	);
}

function InsightTitleEditing() {
	const {
		isEditing,
		editValue,
		setEditValue,
		handleSubmit,
		handleKeyDown,
		inputRef,
	} = useInsightTitleContext();

	if (!isEditing) return null;

	return (
		<input
			ref={inputRef}
			type="text"
			value={editValue}
			onChange={(e) => setEditValue(e.target.value)}
			onBlur={handleSubmit}
			onKeyDown={handleKeyDown}
			className="typo-title-1 font-bold text-dnd-label-strong bg-transparent border-2 border-dnd-primary rounded-xl px-4 py-2 outline-none"
		/>
	);
}

function InsightTitleDisplay() {
	const { isEditing, title, handleTitleClick } = useInsightTitleContext();

	if (isEditing) return null;

	return (
		<h1 className="typo-title-1 font-bold text-dnd-label-strong">
			<button
				type="button"
				className="cursor-pointer text-left transition-colors hover:text-dnd-primary"
				onClick={handleTitleClick}
				title="클릭하여 제목 수정"
			>
				{title}
			</button>
		</h1>
	);
}

const InsightTitle = Object.assign(InsightTitleRoot, {
	Editing: InsightTitleEditing,
	Display: InsightTitleDisplay,
});

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
			<button type="button" className="p-2 text-dnd-label-alternative">
				<MoreVertical size={24} />
			</button>
		</div>
	);
}

function InitialThoughtBox({ initialThought }: { initialThought: string }) {
	return (
		<div className="bg-dnd-bg-alternative rounded-3xl px-6 py-5 flex items-center gap-4">
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
	const inputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	const { mutate, isPending } = useMutation({
		...insightPieceCreationMutationOptions(insightId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: insightKeys.pieces(insightId),
			});
			setInputValue("");
			setIsInputVisible(false);
		},
	});

	useEffect(() => {
		if (isInputVisible) {
			inputRef.current?.focus();
		}
	}, [isInputVisible]);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.nativeEvent.isComposing && inputValue.trim()) {
			e.preventDefault();
			mutate({ content: inputValue.trim() });
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="group flex items-center justify-between py-4 px-5 gap-2">
				<span className="typo-headline-2 font-bold text-dnd-label-neutral">
					인사이트{" "}
					<span className="text-dnd-primary">{insightPieces.length}</span>
				</span>
				<button
					type="button"
					className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
					onClick={() => setIsInputVisible((prev) => !prev)}
				>
					<Image src="/plus.svg" alt="추가" width={24} height={24} />
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
						<input
							ref={inputRef}
							className="w-full rounded-2xl border-2 border-dnd-primary bg-white px-6 py-4 typo-body-1 text-dnd-label-normal placeholder-dnd-label-assistive focus:outline-none resize-none"
							placeholder="새로운 인사이트를 입력하세요"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={isPending}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

function MemoSection() {
	return (
		<div className="flex flex-col gap-3">
			<label
				htmlFor="memo"
				className="typo-label-1 font-bold text-dnd-label-alternative"
			>
				메모
			</label>
			<textarea
				id="memo"
				className="w-full bg-transparent border border-dnd-line-normal rounded-xl p-4 min-h-20 placeholder-dnd-label-assistive typo-body-2 focus:outline-none focus:border-dnd-primary transition-colors resize-none"
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
				className="typo-label-1 font-bold text-dnd-label-alternative"
			>
				링크
			</label>
			<div className="flex gap-3">
				<input
					type="text"
					id="link-title"
					name="link-title"
					className="flex-1 bg-transparent border border-dnd-line-normal rounded-xl px-4 py-3 placeholder-dnd-label-assistive typo-body-2 focus:outline-none focus:border-dnd-primary transition-colors"
					placeholder="링크 제목"
				/>
				<input
					type="text"
					id="link-url"
					name="link-url"
					className="flex-2 bg-transparent border border-dnd-line-normal rounded-xl px-4 py-3 placeholder-dnd-label-assistive typo-body-2 focus:outline-none focus:border-dnd-primary transition-colors"
					placeholder="https://"
				/>
				<button
					type="button"
					className="bg-dnd-bg-alternative text-dnd-label-assistant px-6 rounded-xl typo-body-2 font-medium hover:bg-dnd-fill-normal transition-colors"
				>
					추가하기
				</button>
			</div>
		</div>
	);
}
