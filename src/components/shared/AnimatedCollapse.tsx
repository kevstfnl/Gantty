"use client";
import { useEffect, useRef } from "react";

interface Props {
	open: boolean;
	children: React.ReactNode;
}

export function AnimatedCollapse({ open, children }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (open) {
			el.style.height = "0px";
			el.style.opacity = "0";
			requestAnimationFrame(() => {
				el.style.transition =
					"height 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease";
				el.style.height = el.scrollHeight + "px";
				el.style.opacity = "1";
				const onEnd = () => {
					el.style.height = "auto";
					el.removeEventListener("transitionend", onEnd);
				};
				el.addEventListener("transitionend", onEnd);
			});
		} else {
			el.style.height = el.scrollHeight + "px";
			requestAnimationFrame(() => {
				el.style.transition =
					"height 200ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease";
				el.style.height = "0px";
				el.style.opacity = "0";
			});
		}
	}, [open]);

	return (
		<div
			ref={ref}
			style={{
				overflow: "hidden",
				height: open ? "auto" : "0px",
				opacity: open ? 1 : 0,
			}}
		>
			{children}
		</div>
	);
}
