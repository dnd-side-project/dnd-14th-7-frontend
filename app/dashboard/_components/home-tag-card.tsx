import Image from "next/image";
import { cn } from "@/lib/utils";

export interface HomeTagCardProps {
	id: number;
	name: string;
	insights: { id: number; title: string }[];
	totalCount: number;
	className?: string;
	onOpen?: () => void;
}

export function HomeTagCard({
	id,
	name,
	insights,
	totalCount,
	className,
	onOpen,
}: HomeTagCardProps) {
	return (
		<div
			className={cn(
				"relative flex h-[260px] w-[260px] shrink-0 flex-col rounded-[24px] border border-dnd-line-alternative bg-white p-[24px] shadow-dnd-normal",
				className,
			)}
		>
			{onOpen && (
				<button
					type="button"
					className="absolute inset-0 rounded-[24px] text-left"
					onClick={onOpen}
					aria-label={`${name || `태그 ${id}`} 태그 열기`}
				/>
			)}
			<h3 className="typo-headline-1 font-semibold text-dnd-label-strong mb-[20px] flex items-center gap-[4px]">
				<Image src="/hash-tag.svg" alt="#" width={24} height={24} />
				{name}
			</h3>

			<ul className="flex min-h-[90px] flex-col gap-[12px] overflow-hidden">
				{insights.slice(0, 3).map((insight) => (
					<li
						key={insight.id}
						className="typo-body-2 text-dnd-label-neutral flex items-start gap-[8px]"
					>
						<span className="text-dnd-label-assistive leading-[22px]">•</span>
						<span className="line-clamp-1">{insight.title}</span>
					</li>
				))}
			</ul>

			<div className="flex justify-end mt-auto">
				<span className="typo-caption-1 text-dnd-label-alternative">
					{totalCount}개
				</span>
			</div>
		</div>
	);
}
