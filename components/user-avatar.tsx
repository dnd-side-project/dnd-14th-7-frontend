import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
	"bg-dnd-bg-mint text-dnd-avatar-text-1",
	"bg-dnd-avatar-mint-2 text-dnd-avatar-text-2",
	"bg-dnd-avatar-mint-3 text-dnd-avatar-text-3",
	"bg-dnd-avatar-mint-4 text-dnd-avatar-text-4",
	"bg-dnd-avatar-mint-5 text-dnd-avatar-text-5",
] as const;

const AVATAR_SIZE_CLASS = {
	sm: "size-8 typo-body-1",
	lg: "size-14 typo-title-2",
} as const;

function getAvatarColor(seed: string | null | undefined) {
	let hash = 0;
	const safeSeed = seed ?? "";

	for (const char of safeSeed) {
		hash = (hash * 31 + char.charCodeAt(0)) | 0;
	}

	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getAvatarInitial(nickname: string | null | undefined) {
	return Array.from(nickname?.trim() ?? "")[0]?.toUpperCase() ?? "?";
}

interface UserAvatarProps {
	nickname: string | null | undefined;
	seed: string | null | undefined;
	size?: keyof typeof AVATAR_SIZE_CLASS;
	className?: string;
}

export function UserAvatar({
	nickname,
	seed,
	size = "sm",
	className,
}: UserAvatarProps) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
				AVATAR_SIZE_CLASS[size],
				getAvatarColor(seed),
				className,
			)}
			aria-hidden="true"
		>
			{getAvatarInitial(nickname)}
		</div>
	);
}
