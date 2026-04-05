import { useAtomValue } from "jotai";
import { dictionaryAtom } from "@/store/i18nAtom";

export function useT() {
	return useAtomValue(dictionaryAtom);
}
