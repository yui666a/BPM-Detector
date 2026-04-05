"use client";

import { useAtom } from "jotai";
import { locales } from "@/i18n";
import { localeAtom } from "@/store/i18nAtom";

const labels: Record<string, string> = { en: "EN", ja: "JA" };

export function LocaleSwitcher() {
	const [locale, setLocale] = useAtom(localeAtom);

	return (
		<div className="flex gap-1 rounded-lg bg-gray-800 p-1">
			{locales.map((l) => (
				<button
					key={l}
					type="button"
					onClick={() => setLocale(l)}
					className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
						locale === l ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-200"
					}`}
				>
					{labels[l]}
				</button>
			))}
		</div>
	);
}
