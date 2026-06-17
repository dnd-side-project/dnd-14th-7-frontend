"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import {
	insightKeys,
	insightLinkCreationMutationOptions,
	insightLinkDeletionMutationOptions,
	insightLinksQueryOptions,
} from "@/lib/queries/insight";

interface LinkSectionProps {
	insightId: number;
}

function normalizeUrl(value: string) {
	const trimmed = value.trim();
	const hasProtocol = /^https?:\/\//i.test(trimmed);
	if (!trimmed) return "";
	if (hasProtocol) return trimmed;
	return `https://${trimmed}`;
}

function isAllowedLinkUrl(value: string) {
	try {
		const url = new URL(value);
		const isHttp = url.protocol === "http:" || url.protocol === "https:";
		const hasValidHost =
			url.hostname === "localhost" || url.hostname.includes(".");
		return isHttp && hasValidHost;
	} catch {
		return false;
	}
}

export function LinkSection({ insightId }: LinkSectionProps) {
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
	const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
	const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
		null,
	);
	const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const queryClient = useQueryClient();
	const { data: links = [], isLoading } = useQuery(
		insightLinksQueryOptions(insightId),
	);
	const { mutate: createLink, isPending: isCreating } = useMutation({
		...insightLinkCreationMutationOptions(insightId),
		onSuccess: () => {
			setTitle("");
			setUrl("");
			setFormErrorMessage(null);
			queryClient.invalidateQueries({ queryKey: insightKeys.links(insightId) });
		},
		onError: () => {
			setFormErrorMessage("링크를 추가하지 못했어요. 다시 시도해주세요.");
		},
	});
	const {
		mutate: deleteLink,
		isPending: isDeleting,
		variables: deletingLinkId,
	} = useMutation({
		...insightLinkDeletionMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: insightKeys.links(insightId) });
		},
		onError: () => {
			setActionErrorMessage("링크를 삭제하지 못했어요. 다시 시도해주세요.");
		},
	});

	useEffect(() => {
		return () => {
			if (copyResetTimeoutRef.current) {
				clearTimeout(copyResetTimeoutRef.current);
			}
		};
	}, []);

	const normalizedUrl = normalizeUrl(url);
	const hasUrl = normalizedUrl.length > 0;
	const hasLinks = links.length > 0;
	const isAllowedUrl = isAllowedLinkUrl(normalizedUrl);
	const canSubmit = hasUrl && isAllowedUrl;
	const urlValidationMessage =
		hasUrl && !isAllowedUrl ? "올바른 링크 형식으로 입력해주세요." : null;

	const handleCreate = (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isCreating) return;

		if (!hasUrl) {
			setFormErrorMessage("링크 URL을 입력해주세요.");
			return;
		}

		if (!isAllowedUrl) {
			setFormErrorMessage("올바른 링크 형식으로 입력해주세요.");
			return;
		}

		createLink({ title: title.trim(), url: normalizedUrl });
	};

	const handleDelete = (linkId: number) => {
		if (isDeleting && deletingLinkId === linkId) return;
		setActionErrorMessage(null);
		deleteLink(linkId);
	};

	const handleCopy = async (linkId: number, linkUrl: string) => {
		try {
			await navigator.clipboard.writeText(linkUrl);
			if (copyResetTimeoutRef.current) {
				clearTimeout(copyResetTimeoutRef.current);
			}
			setCopiedLinkId(linkId);
			setActionErrorMessage(null);
			copyResetTimeoutRef.current = setTimeout(() => {
				setCopiedLinkId((currentLinkId) =>
					currentLinkId === linkId ? null : currentLinkId,
				);
			}, 1500);
		} catch {
			setActionErrorMessage("링크를 복사하지 못했어요. 다시 시도해주세요.");
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<form className="flex flex-col gap-3" onSubmit={handleCreate}>
				<label
					htmlFor={`link-title-${insightId}`}
					className="typo-label-1 font-bold text-dnd-label-alternative"
				>
					링크
				</label>
				<div className="flex flex-col gap-3 sm:flex-row">
					<input
						type="text"
						id={`link-title-${insightId}`}
						name="link-title"
						aria-label="링크 제목"
						className="min-w-0 flex-1 rounded-xl border border-dnd-line-normal bg-transparent px-4 py-3 typo-body-2 placeholder-dnd-label-assistive transition-colors focus:border-dnd-primary focus:outline-none disabled:text-dnd-label-disable"
						placeholder="링크 제목"
						value={title}
						disabled={isCreating}
						onChange={(e) => {
							setTitle(e.target.value);
							setFormErrorMessage(null);
						}}
					/>
					<input
						type="url"
						id={`link-url-${insightId}`}
						name="link-url"
						aria-label="링크 URL"
						className="min-w-0 flex-2 rounded-xl border border-dnd-line-normal bg-transparent px-4 py-3 typo-body-2 placeholder-dnd-label-assistive transition-colors focus:border-dnd-primary focus:outline-none disabled:text-dnd-label-disable"
						placeholder="https://"
						value={url}
						disabled={isCreating}
						onChange={(e) => {
							setUrl(e.target.value);
							setFormErrorMessage(null);
						}}
					/>
					<button
						type="submit"
						className="rounded-xl bg-dnd-bg-alternative px-6 py-3 typo-body-2 font-medium text-dnd-label-assistant transition-colors hover:bg-dnd-fill-normal disabled:bg-dnd-interaction-disable disabled:text-dnd-label-disable sm:py-0"
						disabled={isCreating || !canSubmit}
					>
						{isCreating ? "추가 중..." : "추가하기"}
					</button>
				</div>
			</form>

			{(formErrorMessage || urlValidationMessage) && (
				<p className="typo-body-2 text-dnd-status-negative" role="alert">
					{formErrorMessage || urlValidationMessage}
				</p>
			)}

			{actionErrorMessage && (
				<p className="typo-body-2 text-dnd-status-negative" role="alert">
					{actionErrorMessage}
				</p>
			)}

			{isLoading && (
				<div className="flex flex-col gap-2">
					<div className="h-12 w-full animate-pulse rounded-xl bg-dnd-fill-normal" />
					<div className="h-12 w-2/3 animate-pulse rounded-xl bg-dnd-fill-normal" />
				</div>
			)}

			{!isLoading && hasLinks && (
				<ul className="flex flex-col gap-2">
					{links.map((link) => {
						const isDeletingThisLink =
							isDeleting && deletingLinkId === link.linkId;
						const safeLinkUrl = isAllowedLinkUrl(link.url)
							? link.url
							: undefined;

						return (
							<li
								key={link.linkId}
								className="flex items-center justify-between gap-2 rounded-xl border border-dnd-line-normal px-3 py-3 sm:gap-3 sm:px-4"
							>
								<a
									href={safeLinkUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex min-w-0 flex-1 items-center gap-2 text-dnd-label-normal hover:text-dnd-primary"
								>
									<ExternalLink className="size-4 shrink-0" />
									<span className="truncate typo-body-2">
										{link.title || link.url}
									</span>
								</a>
								<button
									type="button"
									className="rounded-lg p-1 text-dnd-label-alternative hover:bg-dnd-bg-alternative hover:text-dnd-primary"
									onClick={() => handleCopy(link.linkId, link.url)}
									aria-label={`${link.title || link.url} 링크 복사`}
								>
									{copiedLinkId === link.linkId ? (
										<Check className="size-4" />
									) : (
										<Copy className="size-4" />
									)}
								</button>
								<button
									type="button"
									className="rounded-lg p-1 text-dnd-label-alternative hover:bg-dnd-bg-alternative hover:text-dnd-status-negative disabled:text-dnd-label-disable"
									onClick={() => handleDelete(link.linkId)}
									disabled={isDeletingThisLink}
									aria-label={`${link.title || link.url} 링크 삭제`}
								>
									<Trash2 className="size-4" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
