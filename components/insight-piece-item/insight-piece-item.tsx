"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { InsufficientCreditsDialog } from "@/components/credit/insufficient-credits-dialog";
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
import { AI_CREDIT_COSTS } from "@/lib/credits";
import {
	type InsightPiece,
	insightKeys,
	insightPieceDeletionMutationOptions,
	insightPieceUpdateMutationOptions,
} from "@/lib/queries/insight";
import { DefaultModeView } from "./default-mode-view";
import { LoadingModeView } from "./loading-mode-view";
import { PieceHeader } from "./piece-header";
import { SelectingModeView } from "./selecting-mode-view";
import { useCopyFeedback } from "./use-copy-feedback";
import { useRetryCandidates } from "./use-retry-candidates";

export function InsightPieceItem({
	insightId,
	piece,
	index,
	onRetryStart,
	onRetryEnd,
}: {
	insightId: number;
	piece: InsightPiece;
	index: number;
	onRetryStart: (pieceId: number) => void;
	onRetryEnd: () => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(() => piece.content);
	const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
		null,
	);
	const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
		null,
	);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isInsufficientCreditsDialogOpen, setIsInsufficientCreditsDialogOpen] =
		useState(false);
	const displayContent = piece.content;
	const canDelete = piece.createdType !== "INIT";
	const { isCopied, copyText } = useCopyFeedback();
	const { retryState, setRetryState, startRetry, cancelRetry, completeRetry } =
		useRetryCandidates({
			pieceId: piece.insightPieceId,
			onRetryStart,
			onRetryEnd,
			onInsufficientCredits: () => setIsInsufficientCreditsDialogOpen(true),
		});
	const queryClient = useQueryClient();

	const updateCachedPieceContent = useCallback(
		(content: string) => {
			queryClient.setQueryData<InsightPiece[]>(
				insightKeys.pieces(insightId),
				(currentPieces) =>
					currentPieces?.map((currentPiece) =>
						currentPiece.insightPieceId === piece.insightPieceId
							? { ...currentPiece, content }
							: currentPiece,
					),
			);
		},
		[insightId, piece.insightPieceId, queryClient],
	);

	const { mutate: updatePieceContent } = useMutation({
		...insightPieceUpdateMutationOptions(piece.insightPieceId),
		onSuccess: (_, { content }) => {
			updateCachedPieceContent(content);
			queryClient.invalidateQueries({
				queryKey: insightKeys.pieces(insightId),
			});
			completeRetry();
		},
		onError: () => {
			setRetryState({
				status: "error",
				message: "선택한 후보를 반영하지 못했어요. 잠시 후 다시 시도해주세요.",
			});
		},
	});
	const { mutate: saveEditedPiece, isPending: isSavingEdit } = useMutation({
		...insightPieceUpdateMutationOptions(piece.insightPieceId),
		onSuccess: (_, { content }) => {
			updateCachedPieceContent(content);
			queryClient.invalidateQueries({
				queryKey: insightKeys.pieces(insightId),
			});
			setIsEditing(false);
			setActionErrorMessage(null);
		},
		onError: () => {
			setActionErrorMessage("인사이트를 수정하지 못했어요. 다시 시도해주세요.");
		},
	});
	const { mutate: deletePiece, isPending: isDeleting } = useMutation({
		...insightPieceDeletionMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: insightKeys.pieces(insightId),
			});
			setIsDeleteDialogOpen(false);
		},
		onError: () => {
			setDeleteErrorMessage("인사이트를 삭제하지 못했어요. 다시 시도해주세요.");
		},
	});

	const handleRetry = useCallback(() => {
		startRetry(piece.content);
	}, [piece.content, startRetry]);

	const handleSelect = useCallback(
		(content: string) => {
			updatePieceContent({ content });
		},
		[updatePieceContent],
	);

	const handleStartEdit = () => {
		setEditContent(displayContent);
		setActionErrorMessage(null);
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setEditContent(displayContent);
		setActionErrorMessage(null);
		setIsEditing(false);
	};

	const handleSaveEdit = () => {
		const nextContent = editContent.trim();
		if (!nextContent || isSavingEdit) return;
		saveEditedPiece({ content: nextContent });
	};

	const handleCopy = async () => {
		try {
			await copyText(displayContent);
			setActionErrorMessage(null);
		} catch {
			setActionErrorMessage("텍스트를 복사하지 못했어요. 다시 시도해주세요.");
		}
	};

	const handleDeleteDialogOpenChange = (open: boolean) => {
		setIsDeleteDialogOpen(open);
		if (!open) setDeleteErrorMessage(null);
	};

	const handleOpenDeleteDialog = () => {
		if (!canDelete) return;
		setActionErrorMessage(null);
		setDeleteErrorMessage(null);
		setIsDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (isDeleting || !canDelete) return;
		setDeleteErrorMessage(null);
		deletePiece(piece.insightPieceId);
	};

	if (isEditing) {
		return (
			<EditModeView
				piece={piece}
				index={index}
				value={editContent}
				errorMessage={actionErrorMessage}
				isSaving={isSavingEdit}
				onChange={(value) => {
					setEditContent(value);
					setActionErrorMessage(null);
				}}
				onCancel={handleCancelEdit}
				onSave={handleSaveEdit}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<DefaultModeView
				piece={piece}
				index={index}
				currentContent={displayContent}
				onRetry={handleRetry}
				onEdit={handleStartEdit}
				onCopy={handleCopy}
				onDelete={handleOpenDeleteDialog}
				isCopied={isCopied}
				isDeleting={isDeleting}
				canDelete={canDelete}
			/>
			<InsufficientCreditsDialog
				open={isInsufficientCreditsDialogOpen}
				onOpenChange={setIsInsufficientCreditsDialogOpen}
				feature="INSIGHT_CANDIDATE_RETRY"
				featureLabel="인사이트 후보 다시 받기"
				requiredCredits={AI_CREDIT_COSTS.INSIGHT_CANDIDATE_RETRY}
			/>
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={handleDeleteDialogOpenChange}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-dnd-status-negative/10 text-dnd-status-negative">
							<Trash2 className="size-8" />
						</AlertDialogMedia>
						<AlertDialogTitle>인사이트를 삭제할까요?</AlertDialogTitle>
						<AlertDialogDescription>
							삭제한 인사이트는 다시 복구할 수 없어요.
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
								handleConfirmDelete();
							}}
						>
							{isDeleting ? "삭제 중..." : "삭제"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{actionErrorMessage && (
				<p className="px-2 typo-body-2 text-dnd-status-negative" role="alert">
					{actionErrorMessage}
				</p>
			)}
			{retryState.status === "loading" && (
				<LoadingModeView onCancel={cancelRetry} />
			)}
			{retryState.status === "selecting" && (
				<SelectingModeView
					candidates={retryState.candidates}
					onCancel={cancelRetry}
					onSelect={handleSelect}
				/>
			)}
			{retryState.status === "error" && (
				<RetryErrorCard
					message={retryState.message}
					onRetry={handleRetry}
					onCancel={cancelRetry}
				/>
			)}
		</div>
	);
}

function EditModeView({
	piece,
	index,
	value,
	errorMessage,
	isSaving,
	onChange,
	onCancel,
	onSave,
}: {
	piece: InsightPiece;
	index: number;
	value: string;
	errorMessage: string | null;
	isSaving: boolean;
	onChange: (value: string) => void;
	onCancel: () => void;
	onSave: () => void;
}) {
	const canSave = value.trim().length > 0 && !isSaving;

	return (
		<div className="flex flex-col gap-4 rounded-3xl bg-white p-4 sm:p-6">
			<PieceHeader
				index={index}
				createdType={piece.createdType}
				createdDate={piece.createdDate}
			/>
			<textarea
				className="min-h-40 w-full resize-none rounded-2xl border border-dnd-line-normal bg-transparent px-4 py-3 typo-headline-2 text-dnd-label-strong placeholder-dnd-label-assistive focus:border-dnd-primary focus:outline-none disabled:text-dnd-label-disable"
				value={value}
				disabled={isSaving}
				onChange={(event) => onChange(event.target.value)}
				aria-label="인사이트 내용 수정"
			/>
			{errorMessage && (
				<p className="typo-body-2 text-dnd-status-negative" role="alert">
					{errorMessage}
				</p>
			)}
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-bg-alternative px-7 py-3 font-medium text-dnd-label-neutral transition-colors hover:bg-dnd-fill-normal disabled:text-dnd-label-disable"
					onClick={onCancel}
					disabled={isSaving}
				>
					취소
				</button>
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-dnd-primary-strong disabled:bg-dnd-interaction-disable disabled:text-dnd-label-disable"
					onClick={onSave}
					disabled={!canSave}
				>
					{isSaving ? "저장 중..." : "저장"}
				</button>
			</div>
		</div>
	);
}

function RetryErrorCard({
	message,
	onRetry,
	onCancel,
}: {
	message: string;
	onRetry: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-dnd-heavy sm:p-6">
			<p className="typo-body-1 text-dnd-status-negative">{message}</p>
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-bg-alternative px-7 py-3 font-medium text-dnd-label-neutral transition-colors hover:bg-dnd-fill-normal"
					onClick={onCancel}
				>
					닫기
				</button>
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-dnd-primary-strong"
					onClick={onRetry}
				>
					다시 시도
				</button>
			</div>
		</div>
	);
}
