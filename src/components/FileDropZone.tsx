"use client";

import { useCallback, useState, useRef } from "react";

interface FileDropZoneProps {
	onFileSelect: (file: File) => void;
	disabled?: boolean;
}

const ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.flac";

export function FileDropZone({ onFileSelect, disabled }: FileDropZoneProps) {
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
		<div
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") handleClick();
			}}
			role="button"
			tabIndex={0}
			className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
				isDragging
					? "border-indigo-500 bg-indigo-500/10"
					: "border-gray-700 hover:border-gray-500"
			} ${disabled ? "pointer-events-none opacity-50" : ""}`}
		>
			<p className="text-lg text-gray-300">
				Drag &amp; drop audio file or click to select
			</p>
			<p className="mt-1 text-sm text-gray-500">
				MP3, WAV, M4A, AAC, OGG, FLAC
			</p>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT}
				onChange={handleChange}
				className="hidden"
			/>
		</div>
	);
}
