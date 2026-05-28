"use client";

import { useState } from "react";
import type { InsightPiece } from "@/lib/queries/insight";
import { PieceHeader } from "./piece-header";

interface SelectingModeViewProps {
	piece: InsightPiece;
	index: number;
	candidates: string[];
	onCancel: () => void;
	onSelect: (content: string) => void;
}

export function SelectingModeView({
	piece,
	index,
	candidates,
	onCancel,
	onSelect,
}: SelectingModeViewProps) {
	const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<
		number | null
	>(null);

	return (
		<div className="bg-white rounded-3xl p-6 flex flex-col gap-3">
			<PieceHeader
				index={index}
				createdType={piece.createdType}
				createdDate={piece.createdDate}
			/>
			{candidates.map((candidate, candidateIndex) => {
				const isSelected = selectedCandidateIndex === candidateIndex;
				const isOriginal = candidateIndex === 0;

				const candidateStyle = isSelected
					? "bg-[var(--dnd-bg-mint2)] border-2 border-[var(--dnd-primary)] text-[var(--dnd-label-strong)]"
					: isOriginal
						? "bg-[var(--dnd-bg-alternative)] text-[var(--dnd-label-strong)] hover:bg-[#ebebeb]"
						: "bg-[var(--dnd-bg-mint2)] text-[var(--dnd-label-strong)] hover:bg-[#e1f5f3]";

				return (
					<button
						type="button"
						// biome-ignore lint/suspicious/noArrayIndexKey: candidate text can be duplicated, so the local index disambiguates options.
						key={`${candidate}-${candidateIndex}`}
						onClick={() => setSelectedCandidateIndex(candidateIndex)}
						className={`p-4 rounded-2xl cursor-pointer transition-colors text-left text-[20px] font-medium leading-[1.4] tracking-[-0.24px] whitespace-pre-wrap ${candidateStyle}`}
					>
						{candidate}
					</button>
				);
			})}
			<div className="flex justify-end items-center gap-2">
				<button
					type="button"
					className="px-7 py-3 rounded-[12px] typo-body-1 font-medium bg-dnd-bg-alternative text-[var(--dnd-label-neutral)] hover:bg-[#ebebeb] transition-colors"
					onClick={onCancel}
				>
					취소
				</button>
				<button
					type="button"
					className={`px-7 py-3 rounded-[12px] typo-body-1 font-semibold transition-colors ${
						selectedCandidateIndex !== null
							? "bg-[#51ccbd] text-white hover:bg-[#43bfb0]"
							: "bg-dnd-interaction-disable text-dnd-label-assistive cursor-not-allowed"
					}`}
					onClick={() => {
						if (selectedCandidateIndex !== null) {
							onSelect(candidates[selectedCandidateIndex]);
						}
					}}
					disabled={selectedCandidateIndex === null}
				>
					선택
				</button>
			</div>
		</div>
	);
}
