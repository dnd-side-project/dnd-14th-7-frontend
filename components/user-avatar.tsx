import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
	"bg-[#E1F5F3] text-[#008C7E]",
	"bg-[#D4F0EC] text-[#00796D]",
	"bg-[#C7EAE5] text-[#006D62]",
	"bg-[#B9E4DE] text-[#006158]",
	"bg-[#A7DCD5] text-[#00574F]",
] as const;

const AVATAR_SIZE_CLASS = {
	sm: "size-8 typo-body-1",
	lg: "size-14 typo-title-2",
} as const;

function getAvatarColor(seed: string) {
	let hash = 0;

	for (const char of seed) {
		hash = (hash * 31 + char.charCodeAt(0)) | 0;
	}

	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getAvatarInitial(nickname: string) {
	return Array.from(nickname.trim())[0]?.toUpperCase() ?? "?";
}

interface UserAvatarProps {
	nickname: string;
	seed: string;
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
