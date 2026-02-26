import type { InsightPiece } from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";

interface PieceHeaderProps {
	index: number;
	createdType: InsightPiece["createdType"];
	createdDate: string;
	children?: React.ReactNode;
}

function getLabel(type: InsightPiece["createdType"]) {
	switch (type) {
		case "INIT":
			return "첫 생각";
		case "SELF":
			return "나의 생각";
		case "ANSWER":
			return "질문 답변";
		default:
			return "생각";
	}
}

function getFormattedDate(dateString: string) {
	const { year, month, day, weekday } = formatDate(dateString);
	return `${year}.${month}.${day} ${weekday}`;
}

export function PieceHeader({
	index,
	createdType,
	createdDate,
	children,
}: PieceHeaderProps) {
	return (
		<div className="flex justify-between items-center">
			<div className="flex items-center gap-2">
				<span className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--dnd-bg-insight-box)] text-[var(--dnd-primary)] typo-caption-2 font-bold shrink-0">
					{index + 1}
				</span>
				<div className="typo-caption-1 text-[var(--dnd-label-alternative)]">
					{getLabel(createdType)} · {getFormattedDate(createdDate)}
				</div>
			</div>
			{children}
		</div>
	);
}
