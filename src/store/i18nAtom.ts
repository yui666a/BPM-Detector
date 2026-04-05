import { atom } from "jotai";
import { DEFAULT_LOCALE, type Dictionary, type Locale, dictionaries } from "@/i18n";

export const localeAtom = atom<Locale>(DEFAULT_LOCALE);

export const dictionaryAtom = atom<Dictionary>((get) => dictionaries[get(localeAtom)]);
