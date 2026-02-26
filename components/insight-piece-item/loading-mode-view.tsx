import type { InsightPiece } from "@/lib/queries/insight";
import { PieceHeader } from "./piece-header";

interface LoadingModeViewProps {
	piece: InsightPiece;
	index: number;
}

export function LoadingModeView({ piece, index }: LoadingModeViewProps) {
	return (
		<div className="bg-white rounded-[24px] p-6 flex flex-col gap-6">
			<PieceHeader
				index={index}
				createdType={piece.createdType}
				createdDate={piece.createdDate}
			/>
			<p className="typo-headline-2 text-[var(--dnd-primary)] whitespace-pre-wrap animate-pulse">
				AI가 생각을 정리하는 중...
			</p>
		</div>
	);
}
