// Root families used to color the map. Each etymon belongs to one group;
// several etyma in the same group are drawn as shades of the group color.

export type GroupId =
  | "pie"
  | "latin"
  | "greek"
  | "germanic"
  | "slavic"
  | "baltic"
  | "albanian"
  | "armenian"
  | "sanskrit"
  | "iranian"
  | "semitic"
  | "cushitic"
  | "turkic"
  | "mongolic"
  | "uralic"
  | "kartvelian"
  | "sino"
  | "japonic"
  | "koreanic"
  | "tai"
  | "austroasiatic"
  | "austronesian"
  | "dravidian"
  | "nigercongo"
  | "americas"
  | "imitative"
  | "calque"
  | "toponym"
  | "unknown";

export interface Group {
  label: string;
  color: string;
}

export const GROUPS: Record<GroupId, Group> = {
  pie: { label: "Proto-Indo-European", color: "#b5893e" },
  latin: { label: "Latin", color: "#c4623f" },
  greek: { label: "Greek", color: "#3f6fa8" },
  germanic: { label: "Germanic", color: "#5f8a4e" },
  slavic: { label: "Slavic", color: "#8a4f8f" },
  baltic: { label: "Baltic", color: "#3a9a6e" },
  albanian: { label: "Albanian", color: "#8c6d4b" },
  armenian: { label: "Armenian", color: "#9c4f3c" },
  sanskrit: { label: "Sanskrit / Indo-Aryan", color: "#d9932b" },
  iranian: { label: "Persian / Iranian", color: "#2f8c86" },
  semitic: { label: "Arabic / Semitic", color: "#2e6b4f" },
  cushitic: { label: "Cushitic", color: "#c08a5a" },
  turkic: { label: "Turkic", color: "#4aa0c8" },
  mongolic: { label: "Mongolic", color: "#6b87c7" },
  uralic: { label: "Uralic", color: "#6c8796" },
  kartvelian: { label: "Kartvelian", color: "#c05c7e" },
  sino: { label: "Sino-Tibetan", color: "#b8323a" },
  japonic: { label: "Japonic", color: "#d4708a" },
  koreanic: { label: "Koreanic", color: "#5465a8" },
  tai: { label: "Kra–Dai", color: "#8fae3c" },
  austroasiatic: { label: "Austroasiatic", color: "#b0703a" },
  austronesian: { label: "Austronesian", color: "#3d93a8" },
  dravidian: { label: "Dravidian", color: "#d2584f" },
  nigercongo: { label: "Niger–Congo", color: "#8b5e34" },
  americas: { label: "Indigenous Americas", color: "#c6a02a" },
  imitative: { label: "Imitative / nursery", color: "#9a9488" },
  calque: { label: "Calque / descriptive", color: "#7f7aa8" },
  toponym: { label: "Place name", color: "#4d6f8f" },
  unknown: { label: "Uncertain origin", color: "#b9b1a3" },
};
