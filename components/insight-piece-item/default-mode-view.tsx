import Image from "next/image";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InsightPiece } from "@/lib/queries/insight";
import { PieceHeader } from "./piece-header";

interface DefaultModeViewProps {
	piece: InsightPiece;
	index: number;
	currentContent: string;
	onRetry: () => void;
}

export function DefaultModeView({
	piece,
	index,
	currentContent,
	onRetry,
}: DefaultModeViewProps) {
	return (
		<div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 group">
			<PieceHeader
				index={index}
				createdType={piece.createdType}
				createdDate={piece.createdDate}
			>
				{piece.createdType !== "SELF" && (
					<DropdownMenu>
						<DropdownMenuTrigger
							className="text-[var(--dnd-label-assistive)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0 select-none outline-none"
							aria-label="인사이트 메뉴"
						>
							<Image
								src="/kebab-icon.svg"
								alt="더보기"
								width={24}
								height={24}
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[172px] rounded-[16px] p-2 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)] border-none flex flex-col gap-1"
						>
							<DropdownMenuItem
								className="p-3 rounded-xl bg-[var(--dnd-bg-alternative)] cursor-pointer flex items-start gap-3 w-[156px] focus:bg-[var(--dnd-bg-alternative)]"
								onClick={onRetry}
							>
								<div className="flex bg-[#ffcccb] opacity-50 absolute inset-0 mix-blend-multiply pointer-events-none hidden" />
								<Image
									src="/re-try.svg"
									alt="재시도"
									width={24}
									height={24}
									className="shrink-0"
								/>
								<div className="flex flex-col gap-1 w-full text-left">
									<span className="typo-body-1 font-medium text-[var(--dnd-label-neutral)] leading-tight !text-[var(--dnd-label-neutral)]">
										재시도
									</span>
									<span className="typo-label-2 text-[var(--dnd-label-alternative)] leading-[1.2] whitespace-pre-wrap break-keep !text-[var(--dnd-label-alternative)]">
										3개의 인사이트 후보를 추가로 받아볼 수 있어요
									</span>
								</div>
							</DropdownMenuItem>

							<DropdownMenuSeparator className="bg-[var(--dnd-line-normal)] my-1" />

							<DropdownMenuItem className="px-3 h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)] cursor-pointer focus:bg-[var(--dnd-bg-alternative)] flex items-center gap-3">
								<Image src="/edit.svg" alt="수정" width={24} height={24} />
								수정
							</DropdownMenuItem>
							<DropdownMenuItem className="px-3 h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)] cursor-pointer focus:bg-[var(--dnd-bg-alternative)] flex items-center gap-3">
								<Image
									src="/copy.svg"
									alt="텍스트 복사"
									width={24}
									height={24}
								/>
								텍스트 복사
							</DropdownMenuItem>

							<DropdownMenuItem className="px-3 h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-status-negative)] cursor-pointer focus:bg-[var(--dnd-bg-alternative)] focus:text-[var(--dnd-status-negative)] flex items-center gap-3">
								<Image src="/delete.svg" alt="삭제" width={24} height={24} />
								삭제
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</PieceHeader>
			<p className="typo-headline-2 text-[var(--dnd-label-strong)] whitespace-pre-wrap">
				{currentContent}
			</p>
		</div>
	);
}
