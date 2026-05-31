"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RetryCandidate {
	id: string;
	content: string;
}

interface SelectingModeViewProps {
	candidates: RetryCandidate[];
	onCancel: () => void;
	onSelect: (content: string) => void;
}

export function SelectingModeView({
	candidates,
	onCancel,
	onSelect,
}: SelectingModeViewProps) {
	const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
		candidates[0]?.id ?? null,
	);
	const selectedCandidate = candidates.find(
		(candidate) => candidate.id === selectedCandidateId,
	);

	return (
		<div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-dnd-heavy">
			<div className="flex flex-col gap-2">
				<h3 className="typo-heading-1 font-semibold text-dnd-label-normal">
					새로운 인사이트 후보
				</h3>
				<p className="typo-body-2 text-dnd-label-alternative">
					마음에 드는 후보를 선택하면 기존 인사이트 아래에 쌓여요.
				</p>
			</div>

			<div className="flex flex-col gap-3">
				{candidates.map((candidate, candidateIndex) => {
					const isSelected = selectedCandidateId === candidate.id;

					return (
						<button
							type="button"
							key={candidate.id}
							onClick={() => setSelectedCandidateId(candidate.id)}
							aria-pressed={isSelected}
							className={cn(
								"flex flex-col gap-3 rounded-2xl border p-5 text-left transition-colors",
								isSelected
									? "border-dnd-primary bg-dnd-bg-mint2"
									: "border-dnd-line-alternative bg-dnd-bg-normal hover:bg-dnd-bg-alternative",
							)}
						>
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"flex size-6 items-center justify-center rounded-full typo-caption-2 font-bold",
										isSelected
											? "bg-dnd-primary text-white"
											: "bg-dnd-fill-normal text-dnd-label-alternative",
									)}
								>
									{candidateIndex + 1}
								</span>
								<span className="typo-label-1 font-semibold text-dnd-label-alternative">
									후보 {candidateIndex + 1}
								</span>
							</div>
							<p className="typo-headline-2 whitespace-pre-wrap font-medium text-dnd-label-strong">
								{candidate.content}
							</p>
						</button>
					);
				})}
			</div>

			<div className="flex justify-end gap-2">
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-bg-alternative px-7 py-3 font-medium text-dnd-label-neutral transition-colors hover:bg-dnd-fill-normal"
					onClick={onCancel}
				>
					취소
				</button>
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-dnd-primary-strong disabled:cursor-not-allowed disabled:bg-dnd-interaction-disable disabled:text-dnd-label-assistive"
					onClick={() => {
						if (selectedCandidate) {
							onSelect(selectedCandidate.content);
						}
					}}
					disabled={!selectedCandidate}
				>
					선택하기
				</button>
			</div>
		</div>
	);
}
