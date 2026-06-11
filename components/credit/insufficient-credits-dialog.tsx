"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface InsufficientCreditsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	featureLabel: string;
	requiredCredits: number;
}

export function InsufficientCreditsDialog({
	open,
	onOpenChange,
	featureLabel,
	requiredCredits,
}: InsufficientCreditsDialogProps) {
	const [isRequested, setIsRequested] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) setIsRequested(false);
		onOpenChange(nextOpen);
	};

	const handleProWaitlistClick = () => {
		setIsRequested(true);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-110 rounded-3xl bg-white p-8">
				<DialogHeader className="gap-4 text-center">
					<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-dnd-bg-mint text-dnd-primary">
						<Bell className="size-7" />
					</div>
					<div className="flex flex-col gap-2">
						<DialogTitle className="typo-heading-1 font-bold text-dnd-label-normal">
							크레딧이 부족해요
						</DialogTitle>
						<DialogDescription className="typo-body-1 text-dnd-label-alternative">
							{featureLabel}에는 {requiredCredits} 크레딧이 필요해요.
						</DialogDescription>
					</div>
				</DialogHeader>

				<div className="rounded-2xl bg-dnd-bg-alternative px-5 py-4 typo-body-2 text-dnd-label-neutral">
					크레딧은 AI가 새 내용을 생성할 때만 사용돼요. 직접 작성, 메모, 링크
					추가는 계속 무료로 사용할 수 있어요.
				</div>

				<div className="rounded-2xl border border-dnd-line-normal px-5 py-4">
					<p className="typo-body-1 font-semibold text-dnd-label-normal">
						Pro Beta 준비 중
					</p>
					<p className="mt-1 typo-body-2 text-dnd-label-alternative">
						월 2,900원으로 더 많은 AI 인사이트 생성을 이어갈 수 있도록 준비하고
						있어요.
					</p>
				</div>

				<DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						size="dnd-large"
						onClick={() => onOpenChange(false)}
					>
						닫기
					</Button>
					<Button
						variant="solid"
						size="dnd-large"
						onClick={handleProWaitlistClick}
						disabled={isRequested}
					>
						{isRequested ? "알림 신청 완료" : "Pro 알림 받기"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
