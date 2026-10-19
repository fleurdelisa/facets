import { fromRows, type Row } from "./rows";

const rows: Row[] = [
  ["forbidden-fruit", "Forbidden Fruit", "Something desired precisely because it's forbidden.", "Main/ForbiddenFruit"],
  ["magic-mirror", "Magic Mirror", "A mirror that reveals truth, distant places, or another self.", "Main/MagicMirror"],
  ["three-wishes", "Three Wishes", "A granted set of wishes that rarely turns out as hoped.", "Main/ThreeWishes"],
  ["true-names", "True Names", "Knowing something's real name gives power over it.", "Main/TrueNames"],
  ["light-is-good", "Light Is Good", "Light, brightness and white associated with goodness.", "Main/LightIsGood"],
  ["dark-is-evil", "Dark Is Evil", "Darkness and black associated with evil.", "Main/DarkIsEvil"],
  ["the-doppelganger", "The Doppelgänger", "A double of a character, often an omen or a shadow self."],
  ["the-labyrinth", "The Labyrinth", "A maze to be navigated — a test, a trap, or the mind itself."],
  ["the-crossroads", "The Crossroads", "A place of choice, and in folklore, of bargains with dark powers."],
  ["the-threshold", "The Threshold", "Doors, gates and borders marking passage into a different state."],
  ["water-and-rebirth", "Water and Rebirth", "Immersion, floods and rivers as cleansing, death and renewal."],
  ["the-mask", "The Mask", "Concealment, a second self, or a truth that can only be spoken in disguise."],
  ["the-poisoned-gift", "The Poisoned Gift", "A tempting offering that carries a curse or a trap."],
  ["helpful-animal", "Helpful Animal", "An animal that aids the hero, often in return for an earlier kindness."],
  ["the-turning-seasons", "The Turning Seasons", "Seasons as the cycle of life, death and return."],
  ["the-cursed-sleep", "The Cursed Sleep", "An enchanted sleep that only a particular act can break."],
];

export const motifs = fromRows("motif", rows);
