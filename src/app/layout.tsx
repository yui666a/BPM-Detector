import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "BPM Detector",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja" className="dark font-sans" suppressHydrationWarning>
			<body className="min-h-screen bg-neutral-950 text-neutral-50">{children}</body>
		</html>
	);
}
