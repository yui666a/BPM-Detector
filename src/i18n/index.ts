import en from "./en";
import ja from "./ja";
import type { Dictionary, Locale } from "./types";

export type { Dictionary, Locale };

export const dictionaries: Record<Locale, Dictionary> = { en, ja };

export const locales: Locale[] = ["en", "ja"];

export const DEFAULT_LOCALE: Locale = "ja";

export function detectLocale(): Locale {
	if (typeof navigator === "undefined") return DEFAULT_LOCALE;
	const lang = navigator.language.split("-")[0];
	return lang === "en" ? "en" : "ja";
}
