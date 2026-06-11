"use client";

import { useQuery } from "@tanstack/react-query";
import { Hash, Search } from "lucide-react";
import {
	type KeyboardEvent as ReactKeyboardEvent,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import type { InsightSummary } from "@/lib/queries/insight";
import { insightsQueryOptions } from "@/lib/queries/insight";
import type { Tag } from "@/lib/queries/user";
import { tagsQueryOptions } from "@/lib/queries/user";
import { serializeTab } from "@/lib/tabs/tab-utils";
import { cn } from "@/lib/utils";

const INSIGHTS_SEARCH_FETCH_SIZE = 50;
const MAX_RESULTS_PER_SECTION = 8;

function getInsightTitle(insight: InsightSummary) {
	return insight.title || "제목 없는 인사이트";
}

type SearchResult =
	| { type: "tag"; tag: Tag }
	| { type: "insight"; insight: InsightSummary };

function getSearchResultId(baseId: string, result: SearchResult) {
	return result.type === "tag"
		? `${baseId}-tag-${result.tag.tagId}`
		: `${baseId}-insight-${result.insight.insightId}`;
}

function normalizeSearchText(value: string) {
	return value.trim().toLowerCase();
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
	const normalizedKeyword = normalizeSearchText(keyword);
	if (!normalizedKeyword) return text;

	const lowerText = text.toLowerCase();
	const parts: React.ReactNode[] = [];
	let currentIndex = 0;
	let matchIndex = lowerText.indexOf(normalizedKeyword);

	while (matchIndex !== -1) {
		if (matchIndex > currentIndex) {
			parts.push(text.slice(currentIndex, matchIndex));
		}

		const matchEndIndex = matchIndex + normalizedKeyword.length;
		parts.push(
			<span key={`${matchIndex}-${matchEndIndex}`} className="text-dnd-primary">
				{text.slice(matchIndex, matchEndIndex)}
			</span>,
		);
		currentIndex = matchEndIndex;
		matchIndex = lowerText.indexOf(normalizedKeyword, currentIndex);
	}

	if (currentIndex < text.length) {
		parts.push(text.slice(currentIndex));
	}

	return parts;
}

export function DashboardSearchDialog() {
	const { dispatch } = useDashboardTabs();
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [activeResultIndex, setActiveResultIndex] = useState(0);
	const resultListRef = useRef<HTMLDivElement>(null);
	const searchInputId = useId();
	const searchResultListId = useId();
	const normalizedSearchValue = normalizeSearchText(searchValue);
	const {
		data: insightsData,
		isLoading: isInsightsLoading,
		isError: isInsightsError,
	} = useQuery({
		...insightsQueryOptions({ page: 0, size: INSIGHTS_SEARCH_FETCH_SIZE }),
		enabled: open,
	});
	const {
		data: tags = [],
		isLoading: isTagsLoading,
		isError: isTagsError,
	} = useQuery({
		...tagsQueryOptions(),
		enabled: open,
	});
	const insights = insightsData?.content ?? [];

	const filteredInsights = useMemo(() => {
		if (!normalizedSearchValue) return [];

		return insights
			.filter((insight) => {
				const title = getInsightTitle(insight).toLowerCase();
				const content = insight.confirmedContent.toLowerCase();
				return (
					title.includes(normalizedSearchValue) ||
					content.includes(normalizedSearchValue)
				);
			})
			.slice(0, MAX_RESULTS_PER_SECTION);
	}, [insights, normalizedSearchValue]);

	const filteredTags = useMemo(() => {
		if (!normalizedSearchValue) return [];

		return tags
			.filter((tag) =>
				tag.tagName.toLowerCase().includes(normalizedSearchValue),
			)
			.slice(0, MAX_RESULTS_PER_SECTION);
	}, [normalizedSearchValue, tags]);

	const closeSearch = () => {
		setOpen(false);
		setSearchValue("");
	};

	const openInsight = (insightId: number) => {
		const tabKey = serializeTab({ type: "insight", id: String(insightId) });
		dispatch({ type: "add", tab: tabKey }, { type: "activate", tab: tabKey });
		closeSearch();
	};

	const openTag = (tag: Tag) => {
		const tabKey = serializeTab({
			type: "tag",
			id: String(tag.tagId),
			name: tag.tagName,
		});
		dispatch({ type: "add", tab: tabKey }, { type: "activate", tab: tabKey });
		closeSearch();
	};

	const searchResults = useMemo<SearchResult[]>(
		() => [
			...filteredTags.map((tag) => ({ type: "tag" as const, tag })),
			...filteredInsights.map((insight) => ({
				type: "insight" as const,
				insight,
			})),
		],
		[filteredInsights, filteredTags],
	);
	const isLoading = isInsightsLoading || isTagsLoading;
	const isError = isInsightsError || isTagsError;
	const isWaitingForSearchTerm = !normalizedSearchValue;
	const isEmpty =
		!isWaitingForSearchTerm &&
		!isLoading &&
		!isError &&
		searchResults.length === 0;
	const activeResult = searchResults[activeResultIndex];
	const activeResultId = activeResult
		? getSearchResultId(searchResultListId, activeResult)
		: undefined;

	useEffect(() => {
		setActiveResultIndex((currentIndex) => {
			if (searchResults.length === 0) return 0;
			return Math.min(currentIndex, searchResults.length - 1);
		});
	}, [searchResults.length]);

	useEffect(() => {
		const activeElement = resultListRef.current?.querySelector(
			`[data-result-index="${activeResultIndex}"]`,
		);
		activeElement?.scrollIntoView({ block: "nearest" });
	}, [activeResultIndex]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const openSearchResult = (result: SearchResult | undefined) => {
		if (!result) return;
		if (result.type === "tag") {
			openTag(result.tag);
			return;
		}
		openInsight(result.insight.insightId);
	};

	const handleSearchInputKeyDown = (
		event: ReactKeyboardEvent<HTMLInputElement>,
	) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			if (searchResults.length === 0) return;
			setActiveResultIndex((currentIndex) =>
				Math.min(currentIndex + 1, searchResults.length - 1),
			);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			if (searchResults.length === 0) return;
			setActiveResultIndex((currentIndex) => Math.max(currentIndex - 1, 0));
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			openSearchResult(searchResults[activeResultIndex]);
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			closeSearch();
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) {
					setSearchValue("");
					setActiveResultIndex(0);
				}
			}}
		>
			<DialogTrigger asChild>
				<button
					type="button"
					className="flex h-full shrink-0 items-center gap-2 px-4 text-dnd-label-neutral hover:text-dnd-label-normal"
					aria-label="검색 열기, Command K"
				>
					<Search className="size-5" />
					<span className="hidden items-center gap-1 rounded-md border border-dnd-line-normal bg-white/70 px-1.5 py-0.5 typo-caption-1 text-dnd-label-alternative md:flex">
						<kbd className="font-medium">⌘/Ctrl</kbd>
						<kbd className="font-medium">K</kbd>
					</span>
				</button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				aria-describedby={undefined}
				className="top-24 max-w-2xl translate-y-0 gap-0 overflow-hidden rounded-2xl bg-white p-0 ring-0 shadow-dnd-heavy sm:max-w-2xl"
			>
				<DialogTitle className="sr-only">검색</DialogTitle>
				<div className="flex items-center gap-3 border-b border-dnd-line-normal px-5 py-4">
					<Search className="size-5 shrink-0 text-dnd-label-alternative" />
					<input
						id={searchInputId}
						type="text"
						role="combobox"
						aria-label="검색어"
						aria-expanded={open}
						aria-controls={searchResultListId}
						aria-activedescendant={activeResultId}
						aria-autocomplete="list"
						className="w-full bg-transparent typo-body-1 text-dnd-label-normal placeholder:text-dnd-label-assistive focus:outline-none"
						placeholder="인사이트 또는 태그 검색"
						value={searchValue}
						onChange={(event) => {
							setSearchValue(event.target.value);
							setActiveResultIndex(0);
						}}
						onKeyDown={handleSearchInputKeyDown}
						autoFocus
					/>
					<span className="hidden shrink-0 items-center gap-1 rounded-md border border-dnd-line-normal bg-dnd-bg-alternative px-1.5 py-0.5 typo-caption-1 text-dnd-label-alternative sm:flex">
						<kbd className="font-medium">⌘/Ctrl</kbd>
						<kbd className="font-medium">K</kbd>
					</span>
				</div>

				<div
					id={searchResultListId}
					ref={resultListRef}
					role="listbox"
					aria-labelledby={searchInputId}
					className="max-h-120 overflow-y-auto p-3"
				>
					{isWaitingForSearchTerm ? (
						<output className="block px-3 py-8 text-center typo-body-2 text-dnd-label-alternative">
							검색어를 입력하면 인사이트와 태그를 찾아드릴게요.
						</output>
					) : isLoading ? (
						<output className="block px-3 py-8 text-center typo-body-2 text-dnd-label-alternative">
							검색 결과를 불러오는 중이에요.
						</output>
					) : isError ? (
						<output className="block px-3 py-8 text-center typo-body-2 text-dnd-status-negative">
							검색 결과를 불러오는 중 오류가 발생했어요.
						</output>
					) : isEmpty ? (
						<output className="block px-3 py-8 text-center typo-body-2 text-dnd-label-alternative">
							검색 결과가 없어요.
						</output>
					) : (
						<div className="flex flex-col gap-4">
							<SearchSection title="태그">
								{filteredTags.length > 0 ? (
									filteredTags.map((tag, index) => (
										<button
											type="button"
											role="option"
											id={getSearchResultId(searchResultListId, {
												type: "tag",
												tag,
											})}
											aria-selected={activeResultIndex === index}
											key={tag.tagId}
											data-result-index={index}
											className={cn(
												"flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-dnd-bg-alternative",
												activeResultIndex === index && "bg-dnd-bg-alternative",
											)}
											onClick={() => openTag(tag)}
											onMouseEnter={() => setActiveResultIndex(index)}
										>
											<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-dnd-bg-alternative text-dnd-label-alternative">
												<Hash className="size-4" />
											</span>
											<span className="min-w-0 flex-1 truncate typo-body-1 text-dnd-label-normal">
												<HighlightedText
													text={tag.tagName}
													keyword={searchValue}
												/>
											</span>
											<span className="shrink-0 typo-caption-1 text-dnd-label-alternative">
												{tag.insightCount}개
											</span>
										</button>
									))
								) : (
									<EmptySectionMessage>
										일치하는 태그가 없어요.
									</EmptySectionMessage>
								)}
							</SearchSection>

							<SearchSection title="인사이트">
								{filteredInsights.length > 0 ? (
									filteredInsights.map((insight, index) => {
										const resultIndex = filteredTags.length + index;

										return (
											<button
												type="button"
												role="option"
												id={getSearchResultId(searchResultListId, {
													type: "insight",
													insight,
												})}
												aria-selected={activeResultIndex === resultIndex}
												key={insight.insightId}
												data-result-index={resultIndex}
												className={cn(
													"flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left hover:bg-dnd-bg-alternative",
													activeResultIndex === resultIndex &&
														"bg-dnd-bg-alternative",
												)}
												onClick={() => openInsight(insight.insightId)}
												onMouseEnter={() => setActiveResultIndex(resultIndex)}
											>
												<span className="line-clamp-1 typo-body-1 font-medium text-dnd-label-normal">
													<HighlightedText
														text={getInsightTitle(insight)}
														keyword={searchValue}
													/>
												</span>
												<span className="line-clamp-1 typo-body-2 text-dnd-label-alternative">
													<HighlightedText
														text={insight.confirmedContent}
														keyword={searchValue}
													/>
												</span>
											</button>
										);
									})
								) : (
									<EmptySectionMessage>
										일치하는 인사이트가 없어요.
									</EmptySectionMessage>
								)}
							</SearchSection>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SearchSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-1">
			<h2 className="px-3 py-1 typo-caption-1 font-semibold text-dnd-label-alternative">
				{title}
			</h2>
			{children}
		</section>
	);
}

function EmptySectionMessage({ children }: { children: React.ReactNode }) {
	return (
		<p className="px-3 py-2 typo-body-2 text-dnd-label-assistive">{children}</p>
	);
}
