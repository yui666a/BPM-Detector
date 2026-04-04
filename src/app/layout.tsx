import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
	title: "BPM Detector",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja" className={cn("dark", "font-sans", geist.variable)}>
			<body className="min-h-screen bg-neutral-950 text-neutral-50">{children}</body>
		</html>
	);
}
