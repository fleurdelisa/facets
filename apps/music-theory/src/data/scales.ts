// East Asian scales, in cents above the tonic (1200 cents = one octave, 100 cents = one piano semitone).

export type Country = "china" | "japan" | "korea" | "vietnam" | "reference";

export type Tuning = "pythagorean" | "measured" | "12-tet" | "approximate";

export interface Scale {
  id: string;
  country: Country;
  name: string;
  native: string;
  /** cents above the tonic, ascending, without the octave */
  cents: number[];
  /** traditional names of each degree, same length as `cents` */
  degrees: string[];
  tuning: Tuning;
  /** for degrees whose pitch floats in performance: [low, high] cents, by index */
  ranges?: Record<number, [number, number]>;
  about: string;
}

export const COUNTRIES: { id: Country; label: string; native: string }[] = [
  { id: "china", label: "China", native: "中国" },
  { id: "japan", label: "Japan", native: "日本" },
  { id: "korea", label: "Korea", native: "한국" },
  { id: "vietnam", label: "Vietnam", native: "Việt Nam" },
  { id: "reference", label: "Western reference", native: "12-TET" },
];

export const TUNING_LABEL: Record<Tuning, string> = {
  pythagorean: "Built from pure 3:2 fifths",
  measured: "Measured from performance",
  "12-tet": "Usually notated in 12-TET",
  approximate: "Approximate; pitch varies by performer",
};

/** Stack pure fifths (3:2 ≈ 701.955¢) from the tonic and fold them into one octave. */
export function stackFifths(count: number): number[] {
  const fifth = 1200 * Math.log2(3 / 2);
  return Array.from({ length: count }, (_, i) => (i * fifth) % 1200).sort((a, b) => a - b);
}

function rotate(cents: number[], start: number): number[] {
  const base = cents[start];
  return cents.map((_, i) => {
    const c = cents[(start + i) % cents.length] - base;
    return c < 0 ? c + 1200 : c;
  });
}

const round = (xs: number[]) => xs.map((c) => Math.round(c));

// 三分损益 (sanfen sunyi, "add or subtract a third") generates the same pitches as stacking pure fifths.
const CHINESE_PENTA = stackFifths(5); // gong shang jue zhi yu → 0 204 408 702 906
const CHINESE_NAMES = ["宫 gōng", "商 shāng", "角 jué", "徵 zhǐ", "羽 yǔ"];
const CHINESE_MODES = [
  { id: "gong", name: "Gong mode", native: "宫调式", about: "The 'palace' mode, built on gōng. It sounds like the major pentatonic." },
  { id: "shang", name: "Shang mode", native: "商调式", about: "Built on shāng. It is open and suspended, with no third." },
  { id: "jue", name: "Jue mode", native: "角调式", about: "Built on jué. A rarer, darker colour that starts with a 3-semitone leap." },
  { id: "zhi", name: "Zhi mode", native: "徵调式", about: "Built on zhǐ. Very common in folk song; Korea's pyeongjo shares its shape." },
  { id: "yu", name: "Yu mode", native: "羽调式", about: "Built on yǔ. It sounds like the minor pentatonic and is plaintive and lyrical." },
];

const pyth = (semis: number[]) => {
  // Map 12-TET semitone positions onto the Pythagorean chain from 5 flats to 6 sharps.
  const chain: Record<number, number> = {};
  for (let k = -5; k <= 6; k++) {
    const c = (((k * 1200 * Math.log2(3 / 2)) % 1200) + 1200) % 1200;
    chain[Math.round(c / 100) % 12] ??= c;
  }
  return semis.map((s) => Math.round(chain[s]));
};

export const SCALES: Scale[] = [
  ...CHINESE_MODES.map((m, i) => ({
    id: `cn-${m.id}`,
    country: "china" as const,
    name: m.name,
    native: m.native,
    cents: round(rotate(CHINESE_PENTA, i)),
    degrees: CHINESE_NAMES.map((_, j) => CHINESE_NAMES[(i + j) % 5]),
    tuning: "pythagorean" as const,
    about: m.about,
  })),
  {
    id: "cn-qingyue",
    country: "china",
    name: "Qingyue (seven-note)",
    native: "清乐音阶",
    cents: pyth([0, 2, 4, 5, 7, 9, 11]),
    degrees: ["宫", "商", "角", "清角", "徵", "羽", "变宫"],
    tuning: "pythagorean",
    about: "Pentatonic plus qīngjué (4th) and biàngōng (7th). In 12-TET it would be the Western major scale; in pure fifths the 3rd and 7th sit noticeably high.",
  },
  {
    id: "cn-yayue",
    country: "china",
    name: "Yayue (seven-note)",
    native: "雅乐音阶",
    cents: pyth([0, 2, 4, 6, 7, 9, 11]),
    degrees: ["宫", "商", "角", "变徵", "徵", "羽", "变宫"],
    tuning: "pythagorean",
    about: "The ancient court scale. It adds biànzhǐ, a raised 4th, so in 12-TET it would be the Lydian mode.",
  },
  {
    id: "jp-ritsu",
    country: "japan",
    name: "Ritsu",
    native: "律音階",
    cents: pyth([0, 2, 5, 7, 9]),
    degrees: ["宮", "商", "角", "徴", "羽"],
    tuning: "pythagorean",
    about: "A scale of gagaku (court music). It is inherited from Tang-dynasty China, so it is tuned in fifths. Folk songs use the same shape as the yō scale.",
  },
  {
    id: "jp-ryo",
    country: "japan",
    name: "Ryo",
    native: "呂音階",
    cents: pyth([0, 2, 4, 7, 9]),
    degrees: ["宮", "商", "角", "徴", "羽"],
    tuning: "pythagorean",
    about: "The other gagaku scale. It matches Chinese gong mode, with no semitones.",
  },
  {
    id: "jp-yo",
    country: "japan",
    name: "Yō",
    native: "陽音階",
    cents: [0, 200, 500, 700, 900],
    degrees: ["1", "2", "4", "5", "6"],
    tuning: "12-tet",
    about: "The 'bright' folk scale (min'yō, warabe-uta children's songs). It has no semitones.",
  },
  {
    id: "jp-in",
    country: "japan",
    name: "In (Miyako-bushi)",
    native: "陰音階 / 都節",
    cents: [0, 100, 500, 700, 800],
    degrees: ["1", "♭2", "4", "5", "♭6"],
    tuning: "12-tet",
    about: "The 'shadow' scale of urban Edo-period music (koto, shamisen, shakuhachi). Its two semitones give it its bittersweet sound.",
  },
  {
    id: "jp-hirajoshi",
    country: "japan",
    name: "Hirajōshi",
    native: "平調子",
    cents: [0, 200, 300, 700, 800],
    degrees: ["1", "2", "♭3", "5", "♭6"],
    tuning: "12-tet",
    about: "The standard koto tuning credited to Yatsuhashi Kengyō (17th c.). It uses the same notes as the in scale, starting from a different place.",
  },
  {
    id: "jp-iwato",
    country: "japan",
    name: "Iwato",
    native: "岩戸",
    cents: [0, 100, 500, 600, 1000],
    degrees: ["1", "♭2", "4", "♭5", "♭7"],
    tuning: "12-tet",
    about: "Another rotation of the in scale. It has a diminished 5th and is dark and unresolved.",
  },
  {
    id: "jp-ryukyu",
    country: "japan",
    name: "Ryūkyū",
    native: "琉球音階",
    cents: [0, 400, 500, 700, 1100],
    degrees: ["1", "3", "4", "5", "7"],
    tuning: "12-tet",
    about: "The scale of Okinawa and the Ryūkyū islands, heard on the sanshin. It drops the 2nd and 6th and keeps both semitones.",
  },
  {
    id: "kr-pyeongjo",
    country: "korea",
    name: "Pyeongjo",
    native: "평조 平調",
    cents: pyth([0, 2, 5, 7, 9]),
    degrees: ["황 hwang", "태 tae", "중 jung", "임 im", "남 nam"],
    tuning: "pythagorean",
    about: "The 'even' mode of court and aristocratic music. It is calm and stately, with the same shape as Chinese zhi mode. The 12 yul pitches are generated from fifths (삼분손익).",
  },
  {
    id: "kr-gyemyeonjo",
    country: "korea",
    name: "Gyemyeonjo",
    native: "계면조 界面調",
    cents: pyth([0, 3, 5, 7, 10]),
    degrees: ["황 hwang", "협 hyeop", "중 jung", "임 im", "무 mu"],
    tuning: "pythagorean",
    about: "The plaintive minor-like mode, the same shape as Chinese yu mode. In practice it often centres on three core tones, with wide vibrato (농현) and falling ornaments.",
  },
  {
    id: "kr-gyeongtori",
    country: "korea",
    name: "Gyeongtori",
    native: "경토리",
    cents: [0, 200, 500, 700, 900],
    degrees: ["sol", "la", "do", "re", "mi"],
    tuning: "12-tet",
    about: "Folk style of Seoul and Gyeonggi (e.g. 'Arirang'). It is bright and flowing, close to pyeongjo.",
  },
  {
    id: "kr-menaritori",
    country: "korea",
    name: "Menaritori",
    native: "메나리토리",
    cents: [0, 300, 500, 800, 1000],
    degrees: ["mi", "sol", "la", "do", "re"],
    tuning: "12-tet",
    about: "Folk style of the eastern mountains (Gangwon, Gyeongsang). Melodies often fall from la to mi, giving a wistful sound.",
  },
  {
    id: "kr-yukjabaegitori",
    country: "korea",
    name: "Yukjabaegitori",
    native: "육자배기토리",
    cents: [0, 500, 700, 800],
    degrees: ["mi", "la", "si", "do"],
    tuning: "approximate",
    ranges: { 0: [-40, 40] },
    about: "Southwestern style (Jeolla, pansori). Mi is sung with heavy vibrato, la is held plain, and do 'breaks' downward to si. The vibrato is shown here as a band.",
  },
  {
    id: "vn-bac",
    country: "vietnam",
    name: "Điệu Bắc",
    native: "Điệu Bắc",
    cents: [0, 171, 514, 685, 887],
    degrees: ["Hò", "Xự", "Xang", "Xê", "Cống"],
    tuning: "measured",
    about: "The 'northern' mode: joyful and bright. These cents were measured on the đàn tranh (Ngô Thanh Nhàn et al., 2016). Every degree sits slightly off the piano keys.",
  },
  {
    id: "vn-oan",
    country: "vietnam",
    name: "Điệu Oán",
    native: "Điệu Oán",
    cents: [0, 350, 500, 700, 900],
    degrees: ["Hò", "Xự", "Xang", "Xê", "Cống"],
    tuning: "approximate",
    ranges: { 1: [300, 400] },
    about: "The 'lament' colour of the southern (Nam) family, central to vọng cổ. Xự floats between a minor and a major third, at about a quarter tone, and is bent in performance.",
  },
  {
    id: "ref-major-penta",
    country: "reference",
    name: "Major pentatonic",
    native: "12-TET",
    cents: [0, 200, 400, 700, 900],
    degrees: ["1", "2", "3", "5", "6"],
    tuning: "12-tet",
    about: "The piano version of the gong / ryo shape, for comparison.",
  },
  {
    id: "ref-major",
    country: "reference",
    name: "Major scale",
    native: "12-TET",
    cents: [0, 200, 400, 500, 700, 900, 1100],
    degrees: ["1", "2", "3", "4", "5", "6", "7"],
    tuning: "12-tet",
    about: "The Western major scale on the piano. Every step is a multiple of 100 cents.",
  },
];

export const scaleById = (id: string) => SCALES.find((s) => s.id === id);
