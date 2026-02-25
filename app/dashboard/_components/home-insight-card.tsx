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
}

export function HomeInsightCard({
	id,
	title,
	content,
	date,
	tags,
	className,
}: HomeInsightCardProps) {
	return (
		<div
			className={cn(
				"flex flex-col p-[24px] items-start gap-[28px] w-[calc(25%-18px)] shrink-0 bg-white rounded-[24px] border border-dnd-line-alternative shadow-dnd-normal group relative",
				className,
			)}
		>
			<div className="flex flex-col items-start gap-[8px] self-stretch w-full mb-0">
				<div className="flex justify-between items-start self-stretch w-full">
					<h3 className="typo-headline-1 font-semibold text-dnd-label-strong line-clamp-1">
						{title}
					</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="text-dnd-label-alternative p-1 hover:bg-dnd-bg-alternative rounded-full transition-colors"
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

			<p className="typo-body-2 text-dnd-label-neutral line-clamp-3 self-stretch break-keep">
				{content}
			</p>

			<div className="flex flex-wrap gap-[8px] items-start self-stretch w-full">
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
