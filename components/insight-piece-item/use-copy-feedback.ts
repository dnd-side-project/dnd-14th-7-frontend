import { useCallback, useEffect, useRef, useState } from "react";

const COPY_FEEDBACK_TIMEOUT_MS = 1500;

export function useCopyFeedback() {
	const [isCopied, setIsCopied] = useState(false);
	const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const copyText = useCallback(async (text: string) => {
		if (!navigator.clipboard) {
			throw new Error("Clipboard API is not supported in this environment.");
		}

		await navigator.clipboard.writeText(text);

		if (resetTimeoutRef.current) {
			clearTimeout(resetTimeoutRef.current);
		}

		setIsCopied(true);
		resetTimeoutRef.current = setTimeout(() => {
			setIsCopied(false);
		}, COPY_FEEDBACK_TIMEOUT_MS);
	}, []);

	useEffect(() => {
		return () => {
			if (resetTimeoutRef.current) {
				clearTimeout(resetTimeoutRef.current);
			}
		};
	}, []);

	return { isCopied, copyText };
}
