"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReducer } from "react";
import type { GetInsightResponse } from "@/lib/queries/insight";
import {
	insightKeys,
	updateInsightMemoMutationOptions,
} from "@/lib/queries/insight";

interface MemoSectionProps {
	insightId: number;
	initialMemo: string;
}

type MemoEditorState =
	| {
			mode: "view";
			draftMemo: "";
			baseMemo: "";
			errorMessage: null;
	  }
	| {
			mode: "edit";
			draftMemo: string;
			baseMemo: string;
			errorMessage: string | null;
	  };

type MemoEditorAction =
	| { type: "START_EDIT"; memo: string }
	| { type: "CHANGE"; value: string }
	| { type: "CANCEL" }
	| { type: "SAVE_SUCCESS" }
	| { type: "SAVE_ERROR"; message: string };

const INITIAL_MEMO_EDITOR_STATE: MemoEditorState = {
	mode: "view",
	draftMemo: "",
	baseMemo: "",
	errorMessage: null,
};

function memoEditorReducer(
	state: MemoEditorState,
	action: MemoEditorAction,
): MemoEditorState {
	switch (action.type) {
		case "START_EDIT":
			return {
				mode: "edit",
				baseMemo: action.memo,
				draftMemo: action.memo,
				errorMessage: null,
			};
		case "CHANGE":
			if (state.mode !== "edit") return state;
			return { ...state, draftMemo: action.value, errorMessage: null };
		case "CANCEL":
		case "SAVE_SUCCESS":
			return INITIAL_MEMO_EDITOR_STATE;
		case "SAVE_ERROR":
			if (state.mode !== "edit") return state;
			return { ...state, errorMessage: action.message };
		default:
			return state;
	}
}

export function MemoSection({ insightId, initialMemo }: MemoSectionProps) {
	const [editorState, dispatch] = useReducer(
		memoEditorReducer,
		INITIAL_MEMO_EDITOR_STATE,
	);
	const queryClient = useQueryClient();
	const { mutate: updateMemo, isPending } = useMutation({
		...updateInsightMemoMutationOptions(insightId),
		onSuccess: (updatedInsight) => {
			queryClient.setQueryData<GetInsightResponse>(
				insightKeys.detail(insightId),
				(oldData) =>
					oldData
						? {
								...oldData,
								memo: updatedInsight.memo,
								updatedDate: updatedInsight.updatedDate,
							}
						: oldData,
			);
			dispatch({ type: "SAVE_SUCCESS" });
		},
		onError: () => {
			dispatch({
				type: "SAVE_ERROR",
				message: "메모를 저장하지 못했어요. 다시 시도해주세요.",
			});
		},
	});

	const isEditing = editorState.mode === "edit";
	const hasMemo = initialMemo.trim().length > 0;
	const hasChanges =
		isEditing && editorState.draftMemo !== editorState.baseMemo;
	const labelId = `memo-label-${insightId}`;
	const textareaId = `memo-${insightId}`;

	const handleSave = () => {
		if (!isEditing || isPending || !hasChanges) return;
		updateMemo({ memo: editorState.draftMemo });
	};

	return (
		<div className="flex flex-col gap-3">
			<h2
				id={labelId}
				className="typo-label-1 font-bold text-dnd-label-alternative"
			>
				메모
			</h2>

			{isEditing ? (
				<div className="relative">
					<textarea
						id={textareaId}
						aria-labelledby={labelId}
						className="min-h-32 w-full resize-none rounded-xl border border-dnd-line-normal bg-transparent p-4 pb-16 typo-body-2 transition-colors placeholder-dnd-label-assistive focus:border-dnd-primary focus:outline-none disabled:text-dnd-label-disable"
						placeholder="상황, 참고내용 등 추가 메모를 입력해주세요."
						value={editorState.draftMemo}
						disabled={isPending}
						onChange={(e) =>
							dispatch({ type: "CHANGE", value: e.target.value })
						}
					/>
					<div className="absolute right-3 bottom-3 flex items-center gap-2">
						<button
							type="button"
							className="rounded-xl bg-white/90 px-4 py-2 typo-body-2 font-medium text-dnd-label-alternative shadow-sm hover:bg-dnd-bg-alternative disabled:text-dnd-label-disable"
							onClick={() => dispatch({ type: "CANCEL" })}
							disabled={isPending}
						>
							취소
						</button>
						<button
							type="button"
							className="rounded-xl bg-dnd-primary px-4 py-2 typo-body-2 font-semibold text-white shadow-sm hover:bg-dnd-primary-strong disabled:bg-dnd-interaction-disable disabled:text-dnd-label-disable"
							onClick={handleSave}
							disabled={isPending || !hasChanges}
						>
							{isPending ? "저장 중..." : "저장"}
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					className="relative flex min-h-32 w-full items-start rounded-xl border border-dnd-line-normal bg-transparent p-4 pr-16 text-left typo-body-2 text-dnd-label-normal transition-colors hover:border-dnd-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-primary focus-visible:ring-offset-2"
					onClick={() => dispatch({ type: "START_EDIT", memo: initialMemo })}
				>
					<span className="absolute top-3 right-3 rounded-lg px-2 py-1 typo-label-1 font-medium text-dnd-primary">
						{hasMemo ? "수정" : "추가"}
					</span>
					{hasMemo ? (
						<span className="whitespace-pre-wrap">{initialMemo}</span>
					) : (
						<span className="text-dnd-label-assistive">
							상황, 참고내용 등 추가 메모를 입력해주세요.
						</span>
					)}
				</button>
			)}

			{editorState.errorMessage && (
				<p className="typo-body-2 text-dnd-status-negative" role="alert">
					{editorState.errorMessage}
				</p>
			)}
		</div>
	);
}
