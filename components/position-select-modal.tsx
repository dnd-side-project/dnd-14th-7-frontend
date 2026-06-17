"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	type Position,
	updatePositionMutationOptions,
	userKeys,
} from "@/lib/queries/user";

interface PositionOption {
	value: Position;
	label: string;
	description: string;
	illust: string;
}

const POSITIONS: PositionOption[] = [
	{
		value: "DEV",
		label: "개발",
		description: "개발 중 겪은 문제나\n깨달음을 기록해요",
		illust: "/developer.png",
	},
	{
		value: "DESIGN",
		label: "디자인",
		description: "디자인에서 떠오른\n인사이트를 정리해요",
		illust: "/designer.png",
	},
	{
		value: "PROMOTER",
		label: "기획",
		description: "기획 아이디어와\n복잡한 기준을 정리해요",
		illust: "/promoter.png",
	},
	{
		value: "OTHER",
		label: "기타",
		description: "지금 떠오른 생각을\n자유롭게 기록해요",
		illust: "/others.png",
	},
];

export interface PositionSelectModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function PositionSelectModal({
	isOpen,
	onClose,
}: PositionSelectModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-[1152px] flex-col items-center gap-8 overflow-y-auto rounded-[28px] bg-[#f2faf9] p-6 ring-0 sm:gap-10 sm:rounded-[32px] sm:p-8 lg:gap-12 lg:p-12">
				<DialogTitle className="sr-only">직군 선택</DialogTitle>

				<div className="flex w-full flex-col items-center gap-8 sm:gap-10 lg:gap-12">
					<PositionSelectHeader />

					<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
						{POSITIONS.map((pos) => (
							<PositionCard key={pos.value} position={pos} onClose={onClose} />
						))}
					</div>

					<p className="typo-headline-1 text-dnd-label-neutral text-center">
						Aha!ve는 생각을 기록하는 누구에게나 열려 있습니다. 분야는 나중에
						바꿀 수 있어요.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function PositionSelectHeader() {
	return (
		<div className="flex flex-col items-center gap-3 text-center sm:gap-4">
			<p className="typo-heading-1 font-bold text-dnd-label-normal sm:typo-title-1">
				어떤 생각을 기록해볼까요?
			</p>
			<p className="typo-body-1 text-dnd-label-neutral sm:typo-heading-2">
				선택한 분야에 맞는 인사이트 예시를 보여드릴게요.
			</p>
		</div>
	);
}

interface PositionCardProps {
	position: PositionOption;
	onClose: () => void;
}

function PositionCard({ position, onClose }: PositionCardProps) {
	const { value, label, description, illust } = position;

	const queryClient = useQueryClient();
	const { mutate: updatePosition } = useMutation({
		...updatePositionMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.profile() });
		},
	});

	return (
		<button
			type="button"
			onClick={() => {
				updatePosition(value);
				onClose();
			}}
			className="flex w-full flex-col items-center gap-4 rounded-[24px] bg-white px-6 py-6 transition-all hover:ring-2 hover:ring-dnd-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dnd-primary sm:gap-5 sm:rounded-[32px] sm:px-8 lg:px-10"
		>
			<div className="flex w-full flex-col items-center gap-2 text-center sm:w-[160px]">
				<p className="typo-heading-1 font-semibold text-dnd-label-neutral">
					{label}
				</p>
				<p className="typo-body-1 text-dnd-label-alternative whitespace-pre-line">
					{description}
				</p>
			</div>
			<Image
				src={illust}
				alt={label}
				width={120}
				height={120}
				className="size-24 object-cover sm:size-30"
			/>
		</button>
	);
}
