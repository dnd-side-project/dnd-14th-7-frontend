"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

interface ToastAction {
	label: string;
	onClick: () => void;
}

interface ToastOptions {
	message: string;
	action?: ToastAction;
}

interface ToastItem extends ToastOptions {
	id: number;
}

interface ToastContextValue {
	showToast: (options: ToastOptions) => void;
}

const TOAST_DURATION_MS = 5000;
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const dismissToast = useCallback((id: number) => {
		setToasts((currentToasts) =>
			currentToasts.filter((toast) => toast.id !== id),
		);
	}, []);

	const showToast = useCallback(
		(options: ToastOptions) => {
			const id = Date.now();
			setToasts((currentToasts) => [...currentToasts, { id, ...options }]);
			window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
		},
		[dismissToast],
	);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="fixed right-6 bottom-6 z-50 flex max-w-sm flex-col gap-3">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className="flex items-center gap-4 rounded-2xl bg-dnd-label-strong px-5 py-4 text-white shadow-dnd-heavy"
						role="status"
					>
						<p className="typo-body-2 flex-1">{toast.message}</p>
						{toast.action && (
							<button
								type="button"
								className="shrink-0 rounded-lg px-2 py-1 typo-body-2 font-semibold text-dnd-primary hover:bg-white/10"
								onClick={() => {
									toast.action?.onClick();
									dismissToast(toast.id);
								}}
							>
								{toast.action.label}
							</button>
						)}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return context;
}
