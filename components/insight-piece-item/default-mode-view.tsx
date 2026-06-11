import Image from "next/image";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_CREDIT_COSTS } from "@/lib/credits";
import type { InsightPiece } from "@/lib/queries/insight";
import { PieceHeader } from "./piece-header";

interface DefaultModeViewProps {
	piece: InsightPiece;
	index: number;
	currentContent: string;
	onRetry: () => void;
	onEdit: () => void;
	onCopy: () => void;
	onDelete: () => void;
	isCopied: boolean;
	isDeleting: boolean;
	canDelete: boolean;
}

export function DefaultModeView({
	piece,
	index,
	currentContent,
	onRetry,
	onEdit,
	onCopy,
	onDelete,
	isCopied,
	isDeleting,
	canDelete,
}: DefaultModeViewProps) {
	return (
		<div className="bg-white rounded-3xl p-6 flex flex-col gap-6 group">
			<PieceHeader
				index={index}
				createdType={piece.createdType}
				createdDate={piece.createdDate}
			>
				<DropdownMenu>
					<DropdownMenuTrigger
						className="text-dnd-label-assistive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0 select-none outline-none"
						aria-label="인사이트 메뉴"
					>
						<Image src="/kebab-icon.svg" alt="더보기" width={24} height={24} />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-44 rounded-2xl p-2 bg-white shadow-lg border-none flex flex-col gap-1"
					>
						{piece.createdType !== "SELF" && (
							<>
								<DropdownMenuItem
									className="p-3 rounded-xl bg-dnd-bg-alternative cursor-pointer flex items-start gap-3 w-40 focus:bg-dnd-bg-alternative"
									onSelect={onRetry}
								>
									<Image
										src="/re-try.svg"
										alt="재시도"
										width={24}
										height={24}
										className="shrink-0"
									/>
									<div className="flex flex-col gap-1 w-full text-left">
										<span className="typo-body-1 font-medium text-dnd-label-neutral leading-tight">
											재시도
										</span>
										<span className="typo-label-2 text-dnd-label-alternative leading-tight whitespace-pre-wrap break-keep">
											3개의 인사이트 후보를 추가로 받아볼 수 있어요 ·{" "}
											{AI_CREDIT_COSTS.INSIGHT_CANDIDATE_RETRY} 크레딧
										</span>
									</div>
								</DropdownMenuItem>

								<DropdownMenuSeparator className="bg-dnd-line-normal my-1" />
							</>
						)}

						<DropdownMenuItem
							className="px-3 h-12 rounded-lg typo-body-1 font-normal text-dnd-label-neutral cursor-pointer focus:bg-dnd-bg-alternative flex items-center gap-3"
							onSelect={onEdit}
						>
							<Image src="/edit.svg" alt="수정" width={24} height={24} />
							수정
						</DropdownMenuItem>
						<DropdownMenuItem
							className="px-3 h-12 rounded-lg typo-body-1 font-normal text-dnd-label-neutral cursor-pointer focus:bg-dnd-bg-alternative flex items-center gap-3"
							onSelect={(event) => {
								event.preventDefault();
								onCopy();
							}}
						>
							<Image src="/copy.svg" alt="텍스트 복사" width={24} height={24} />
							{isCopied ? "복사됨" : "텍스트 복사"}
						</DropdownMenuItem>

						{canDelete && (
							<DropdownMenuItem
								className="px-3 h-12 rounded-lg typo-body-1 font-normal text-dnd-status-negative cursor-pointer focus:bg-dnd-bg-alternative focus:text-dnd-status-negative flex items-center gap-3 data-disabled:opacity-50"
								onSelect={onDelete}
								disabled={isDeleting}
							>
								<Image src="/delete.svg" alt="삭제" width={24} height={24} />
								{isDeleting ? "삭제 중..." : "삭제"}
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</PieceHeader>
			<p className="typo-headline-2 text-dnd-label-strong whitespace-pre-wrap">
				{currentContent}
			</p>
		</div>
	);
}
