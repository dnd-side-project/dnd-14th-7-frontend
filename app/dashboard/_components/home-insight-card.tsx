import Image from "next/image";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

export interface HomeInsightCardProps {
	id: number;
	title: string;
	content: string;
	date: string;
	tags: { id: number; name: string; colorClass?: string }[];
	className?: string;
	onOpen?: () => void;
}

export function HomeInsightCard({
	id,
	title,
	content,
	date,
	tags,
	className,
	onOpen,
}: HomeInsightCardProps) {
	return (
		<div
			className={cn(
				"relative flex h-[292px] w-[260px] shrink-0 flex-col items-start gap-[28px] rounded-[24px] border border-dnd-line-alternative bg-white p-[24px] shadow-dnd-normal group",
				className,
			)}
		>
			{onOpen && (
				<button
					type="button"
					className="absolute inset-0 z-10 rounded-[24px] text-left"
					onClick={onOpen}
					aria-label={`${title || `인사이트 ${id}`} 열기`}
				/>
			)}
			<div className="flex flex-col items-start gap-[8px] self-stretch w-full mb-0">
				<div className="flex justify-between items-start self-stretch w-full">
					<h3 className="typo-headline-1 font-semibold text-dnd-label-strong line-clamp-1">
						{title}
					</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="relative z-20 text-dnd-label-alternative p-1 hover:bg-dnd-bg-alternative rounded-full transition-colors"
								aria-label="메뉴"
							>
								<Image
									src="/kebab-icon.svg"
									alt="menu"
									width={17}
									height={17}
								/>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="p-0 border-dnd-line-alternative shadow-dnd-normal rounded-[12px] bg-white min-w-[200px]"
						>
							<DropdownMenuItem className="flex items-center gap-[12px] px-[12px] py-[8px] cursor-pointer rounded-[12px] focus:bg-dnd-bg-alternative hover:bg-dnd-bg-alternative">
								<Image src="/trash.svg" alt="trash" width={18} height={21} />
								<span className="typo-body-1 font-medium text-dnd-label-strong text-[16px]">
									휴지통으로 이동
								</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<span className="typo-caption-1 text-dnd-label-alternative">
					{date}
				</span>
			</div>

			<p className="typo-body-2 min-h-[66px] text-dnd-label-neutral line-clamp-3 self-stretch break-keep">
				{content}
			</p>

			<div className="mt-auto flex max-h-[68px] flex-wrap gap-[8px] items-start self-stretch w-full overflow-hidden">
				{tags.map((tag) => (
					<span
						key={tag.id}
						className={cn(
							"px-[12px] py-[6px] rounded-[8px] typo-caption-1 font-medium",
							tag.colorClass ||
								"bg-dnd-bg-alternative text-dnd-label-neutral border border-dnd-line-alternative",
						)}
					>
						{tag.name}
					</span>
				))}
			</div>
		</div>
	);
}
