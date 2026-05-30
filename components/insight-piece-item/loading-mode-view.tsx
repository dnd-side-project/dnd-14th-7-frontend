import Image from "next/image";

interface LoadingModeViewProps {
	onCancel: () => void;
}

export function LoadingModeView({ onCancel }: LoadingModeViewProps) {
	return (
		<div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-dnd-heavy">
			<div className="flex justify-end">
				<button
					type="button"
					className="typo-label-1 rounded-lg px-3 py-1.5 text-dnd-label-alternative hover:bg-dnd-bg-alternative"
					onClick={onCancel}
				>
					취소
				</button>
			</div>

			<div
				className="flex flex-col items-center gap-4 rounded-3xl bg-dnd-bg-mint2 px-6 py-10 text-center"
				aria-live="polite"
			>
				<Image src="/sparkle.svg" alt="" width={28} height={28} />
				<div className="flex flex-col gap-2">
					<p className="typo-heading-1 font-semibold text-dnd-label-normal">
						새로운 인사이트 후보를 만들고 있어요
					</p>
					<p className="typo-body-2 text-dnd-label-alternative">
						잠시 후 3개의 후보 중 하나를 선택할 수 있어요.
					</p>
				</div>
				<div className="mt-2 flex gap-2">
					<div className="size-2 animate-bounce rounded-full bg-dnd-primary [animation-delay:-0.2s]" />
					<div className="size-2 animate-bounce rounded-full bg-dnd-primary [animation-delay:-0.1s]" />
					<div className="size-2 animate-bounce rounded-full bg-dnd-primary" />
				</div>
			</div>
		</div>
	);
}
