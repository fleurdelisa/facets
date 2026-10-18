import { COUNTRIES } from "@/data/countries";
import { GROUPS, type GroupId } from "@/data/groups";
import { LANGUAGES } from "@/data/languages";
import type { EtymonDef, WordData } from "@/data/types";
import { FOOD_WORDS } from "@/data/words-food";
import { NATURE_WORDS } from "@/data/words-nature";
import { CULTURE_WORDS } from "@/data/words-culture";
import { romanize } from "./translit";

export interface Form {
  lang: string;
  native: string;
  roman?: string;
  etymon: string;
}

export interface Etymon extends EtymonDef {
  color: string;
}

export interface Word {
  word: string;
  story: string;
  etyma: Record<string, Etymon>;
  forms: Record<string, Form>;
}

export interface CountryReading {
  /** Language the country would ideally show (first in its chain). */
  primaryLang: string;
  form?: Form;
  etymon?: Etymon;
}

function parseForms(data: WordData): Record<string, Form> {
  const forms: Record<string, Form> = {};
  for (const [lang, raw] of Object.entries(data.forms)) {
    const [native, etymon, roman] = raw.split("|");
    forms[lang] = { lang, native, etymon, roman: roman || romanize(native, lang) };
  }
  // Bosnian / Montenegrin: Latin transliteration of Serbian unless overridden.
  const sr = forms.sr;
  if (sr && !forms.sh) {
    forms.sh = { lang: "sh", native: romanize(sr.native, "sr") ?? sr.native, etymon: sr.etymon };
  }
  return forms;
}

// Shades for multiple etyma of the same group within one word.
const SHADE_STEPS = [0, 0.32, -0.28, 0.55, -0.45, 0.72, 0.18, -0.15];

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const target = amount >= 0 ? 255 : 30;
  const t = Math.abs(amount);
  const mixed = rgb.map((c) => Math.round(c + (target - c) * t));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function colorEtyma(defs: EtymonDef[]): Record<string, Etymon> {
  const perGroup: Partial<Record<GroupId, number>> = {};
  const out: Record<string, Etymon> = {};
  for (const def of defs) {
    const i = perGroup[def.group] ?? 0;
    perGroup[def.group] = i + 1;
    const color = shade(GROUPS[def.group].color, SHADE_STEPS[i % SHADE_STEPS.length]);
    out[def.id] = { ...def, color };
  }
  return out;
}

function build(data: WordData): Word {
  return {
    word: data.word,
    story: data.story,
    etyma: colorEtyma(data.etyma),
    forms: parseForms(data),
  };
}

export const WORDS: Word[] = [...FOOD_WORDS, ...NATURE_WORDS, ...CULTURE_WORDS]
  .map(build)
  .sort((a, b) => a.word.localeCompare(b.word));

export const WORD_INDEX: Record<string, Word> = Object.fromEntries(
  WORDS.map((w) => [w.word, w]),
);

export function readCountry(word: Word, atlasName: string): CountryReading | undefined {
  const country = COUNTRIES[atlasName];
  if (!country) return undefined;
  for (const lang of country.langs) {
    const form = word.forms[lang];
    if (form) return { primaryLang: country.langs[0], form, etymon: word.etyma[form.etymon] };
  }
  return { primaryLang: country.langs[0] };
}

export function countryName(atlasName: string): string {
  return COUNTRIES[atlasName]?.display ?? atlasName;
}

export function languageName(code: string): string {
  return LANGUAGES[code]?.name ?? code;
}

export function isRtl(code: string): boolean {
  return LANGUAGES[code]?.rtl ?? false;
}
