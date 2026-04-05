"use client";

import { useCallback, useRef, useState } from "react";
import { useT } from "@/hooks/useT";

interface FileDropZoneProps {
	onFileSelect: (file: File) => void;
	disabled?: boolean;
}

const ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.flac";

export function FileDropZone({ onFileSelect, disabled }: FileDropZoneProps) {
	const t = useT();
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (disabled) return;
			const file = e.dataTransfer.files[0];
			if (file) onFileSelect(file);
		},
		[onFileSelect, disabled],
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (!disabled) setIsDragging(true);
		},
		[disabled],
	);

	const handleDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleClick = useCallback(() => {
		if (!disabled) inputRef.current?.click();
	}, [disabled]);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) onFileSelect(file);
		},
		[onFileSelect],
	);

	return (
		<button
			type="button"
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onClick={handleClick}
			disabled={disabled}
			className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
				isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"
			} disabled:pointer-events-none disabled:opacity-50`}
		>
			<p className="text-lg text-gray-300">{t.dropZone}</p>
			<p className="mt-1 text-sm text-gray-500">{t.dropZoneFormats}</p>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT}
				onChange={handleChange}
				className="hidden"
			/>
		</button>
	);
}
