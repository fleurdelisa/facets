// Lightweight romanization for alphabetic scripts, so the dataset only needs
// hand-written romanizations for abjads, abugidas and CJK.

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", ђ: "đ", е: "e", ё: "yo", є: "ye",
  ж: "zh", з: "z", и: "i", і: "i", ї: "yi", й: "y", ј: "j", к: "k", л: "l", љ: "lj",
  м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "ć", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", џ: "dž", ш: "sh", щ: "shch", ъ: "ŭ", ы: "y",
  ь: "ʹ", э: "e", ю: "yu", я: "ya", ә: "ä", ғ: "gh", қ: "q", ң: "ng", ө: "ö",
  ұ: "u", ү: "ü", һ: "h",
};

// Serbian Cyrillic → Serbo-Croatian Latin (Gaj's alphabet).
const SERBIAN: Record<string, string> = {
  ...CYRILLIC,
  ж: "ž", х: "h", ц: "c", ч: "č", ш: "š", ј: "j", љ: "lj", њ: "nj", ђ: "đ", ћ: "ć", џ: "dž",
};

const GREEK: Record<string, string> = {
  α: "a", ά: "á", β: "v", γ: "g", δ: "d", ε: "e", έ: "é", ζ: "z", η: "i", ή: "í",
  θ: "th", ι: "i", ί: "í", ϊ: "ï", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o",
  ό: "ó", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", ύ: "ý", φ: "f", χ: "ch",
  ψ: "ps", ω: "o", ώ: "ó",
};
const GREEK_DIGRAPHS: [string, string][] = [
  ["ου", "ou"], ["ού", "oú"], ["μπ", "b"], ["ντ", "d"], ["γκ", "g"], ["τσ", "ts"],
  ["αι", "e"], ["αί", "é"], ["ει", "i"], ["εί", "í"], ["οι", "i"], ["οί", "í"],
];

const GEORGIAN: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k'",
  ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p'", ჟ: "zh", რ: "r", ს: "s", ტ: "t'", უ: "u",
  ფ: "p", ქ: "k", ღ: "gh", ყ: "q'", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts'",
  ჭ: "ch'", ხ: "kh", ჯ: "j", ჰ: "h",
};

const ARMENIAN: Record<string, string> = {
  ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "ē", ը: "ə", թ: "tʿ", ժ: "zh",
  ի: "i", լ: "l", խ: "kh", ծ: "ts", կ: "k", հ: "h", ձ: "dz", ղ: "gh", ճ: "ch", մ: "m",
  յ: "y", ն: "n", շ: "sh", ո: "o", չ: "chʿ", պ: "p", ջ: "j", ռ: "r", ս: "s", վ: "v",
  տ: "t", ր: "r", ց: "tsʿ", ւ: "w", փ: "pʿ", ք: "kʿ", օ: "ō", ֆ: "f", և: "ev",
};

function mapChars(text: string, table: Record<string, string>): string {
  let out = "";
  for (const ch of text) {
    const lower = ch.toLowerCase();
    const mapped = table[lower];
    if (mapped === undefined) out += ch;
    else out += ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }
  return out;
}

export function romanize(text: string, lang: string): string | undefined {
  if (lang === "sr" || lang === "sh") return mapChars(text, SERBIAN);
  if (/[\u0400-\u04FF]/.test(text)) return mapChars(text, CYRILLIC);
  if (/[\u0370-\u03FF]/.test(text)) {
    let t = text.toLowerCase();
    for (const [g, l] of GREEK_DIGRAPHS) t = t.split(g).join(l);
    return mapChars(t, GREEK);
  }
  if (/[\u10A0-\u10FF]/.test(text)) return mapChars(text, GEORGIAN);
  if (/[\u0530-\u058F]/.test(text)) {
    // ու is the vowel u
    return mapChars(text.replace(/ու/g, "u"), ARMENIAN);
  }
  return undefined;
}
