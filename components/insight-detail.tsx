"use client";

import {
	useMutation,
	useQueryClient,
	useSuspenseQueries,
} from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import Image from "next/image";
import {
	createContext,
	type KeyboardEvent,
	type ReactNode,
	type RefObject,
	Suspense,
	useContext,
	useRef,
	useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
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
				<MainInsightBox insightId={insightId} insightPieces={piecesData} />
				<MemoSection />
				<LinkSection />
			</div>
			<div className="pt-[24px] pb-[24px]">
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
				title: data.title,
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
			className="typo-title-1 font-bold text-[var(--dnd-label-strong)] bg-transparent border-2 border-[var(--dnd-primary)] rounded-xl px-4 py-2 outline-none"
		/>
	);
}

function InsightTitleDisplay() {
	const { isEditing, title, handleTitleClick } = useInsightTitleContext();

	if (isEditing) return null;

	return (
		<h1
			className="typo-title-1 font-bold text-[var(--dnd-label-strong)] cursor-pointer hover:text-[var(--dnd-primary)] transition-colors"
			onClick={handleTitleClick}
			title="클릭하여 제목 수정"
		>
			{title}
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

function MainInsightBox({
	insightId,
	insightPieces,
}: {
	insightId: number;
	insightPieces: InsightPiece[];
}) {
	const [isInputVisible, setIsInputVisible] = useState(false);
	const [inputValue, setInputValue] = useState("");
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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.nativeEvent.isComposing && inputValue.trim()) {
			e.preventDefault();
			mutate({ content: inputValue.trim() });
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="group flex items-center justify-between py-[16px] px-[20px] gap-[8px]">
				<span className="typo-headline-2 font-bold text-[var(--dnd-label-neutral)]">
					인사이트{" "}
					<span className="text-[var(--dnd-primary)]">
						{insightPieces.length}
					</span>
				</span>
				<button
					type="button"
					className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
					onClick={() => setIsInputVisible((prev) => !prev)}
				>
					<Image src="/plus.svg" alt="추가" width={24} height={24} />
				</button>
			</div>
			<div className="rounded-[32px] p-6 flex flex-col gap-4 bg-[var(--dnd-bg-insight-box)] relative z-50">
				{insightPieces.map((piece, index) => (
					<InsightPieceItem
						key={piece.insightPieceId}
						piece={piece}
						index={index}
					/>
				))}
				{isInputVisible && (
					<input
						className="w-full rounded-[16px] border-2 border-[var(--dnd-primary)] bg-white px-6 py-4 typo-body-1 text-[var(--dnd-label-normal)] placeholder-[var(--dnd-label-assistive)] focus:outline-none resize-none"
						placeholder="새로운 인사이트를 입력하세요"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isPending}
						autoFocus
					/>
				)}
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
