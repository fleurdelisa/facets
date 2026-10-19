import { fromRows, type Row } from "./rows";

// Vogler's eight archetypes, as functions a character can serve.
const vogler: Row[] = [
  ["the-hero", "The Hero", "The protagonist whose growth and sacrifice drive the story.", "Main/TheHero"],
  ["the-mentor", "The Mentor", "A guide who trains, advises or equips the hero.", "Main/TheMentor", ["Wise Old Man"]],
  ["the-herald", "The Herald", "A character or event that announces the call to adventure.", "Main/TheHerald"],
  ["threshold-guardian", "Threshold Guardian", "A gatekeeper who tests the hero's resolve before they can proceed.", "Main/ThresholdGuardians"],
  ["the-shapeshifter", "The Shapeshifter", "A character whose loyalty or nature keeps changing, keeping the hero off balance."],
  ["the-shadow", "The Shadow", "The dark force opposing the hero — often a reflection of the hero's own suppressed side."],
  ["the-ally", "The Ally", "A companion who helps the hero, offering support, humour or a conscience.", undefined, ["Sidekick"]],
  ["the-trickster", "The Trickster", "A mischief-maker who disrupts the status quo and deflates pomposity.", "Main/TheTrickster"],
];

const more: Row[] = [
  ["the-chosen-one", "The Chosen One", "A character destined — by prophecy, bloodline or fate — to save the world.", "Main/TheChosenOne"],
  ["the-everyman", "The Everyman", "An ordinary person the audience can step into, swept into extraordinary events.", "Main/Everyman"],
  ["farm-boy", "Farm Boy", "A hero from humble, rural beginnings who doesn't know their own potential.", "Main/FarmBoy"],
  ["reluctant-hero", "Reluctant Hero", "A hero who would rather not be one, and has to be pushed into it.", "Main/ReluctantHero"],
  ["anti-hero", "Anti-Hero", "A protagonist lacking conventional heroic qualities — cynical, selfish or morally grey.", "Main/AntiHero"],
  ["byronic-hero", "Byronic Hero", "A brooding, brilliant, self-destructive hero haunted by a dark past.", "Main/ByronicHero"],
  ["tragic-hero", "Tragic Hero", "A sympathetic protagonist brought down by a flaw or mistake of their own.", "Main/TragicHero"],
  ["villain-protagonist", "Villain Protagonist", "The story is told from the point of view of its villain.", "Main/VillainProtagonist"],
  ["anti-villain", "Anti-Villain", "An antagonist with noble goals, sympathetic motives or genuine virtues.", "Main/AntiVillain"],
  ["the-big-bad", "The Big Bad", "The central villain behind the story's main conflict.", "Main/BigBad"],
  ["the-dragon", "The Dragon", "The villain's chief enforcer, often fought just before the Big Bad.", "Main/TheDragon"],
  ["the-lancer", "The Lancer", "The hero's second-in-command, usually their contrast in temperament.", "Main/TheLancer"],
  ["the-rival", "The Rival", "A peer who competes with the hero, pushing them to improve.", "Main/TheRival"],
  ["love-interest", "Love Interest", "The character the protagonist is romantically drawn to.", "Main/LoveInterest"],
  ["femme-fatale", "Femme Fatale", "A seductive figure who lures others into danger for her own ends.", "Main/FemmeFatale"],
  ["the-fool", "The Fool", "An innocent or clown who survives on luck, and sometimes speaks unexpected truth.", "Main/TheFool"],
  ["old-master", "Old Master", "An elderly, unassuming figure who turns out to be formidably skilled.", "Main/OldMaster"],
  ["knight-in-shining-armor", "Knight in Shining Armor", "A noble, chivalrous protector who arrives to rescue the helpless.", "Main/KnightInShiningArmor"],
  ["jerk-with-a-heart-of-gold", "Jerk with a Heart of Gold", "Abrasive on the surface, genuinely kind underneath.", "Main/JerkWithAHeartOfGold"],
  ["manic-pixie-dream-girl", "Manic Pixie Dream Girl", "A quirky, free-spirited love interest who exists mainly to change a brooding protagonist.", "Main/ManicPixieDreamGirl"],
  ["wicked-stepmother", "Wicked Stepmother", "A step-parent who mistreats the protagonist, a fixture of fairy tales.", "Main/WickedStepmother"],
  ["the-mole", "The Mole", "A spy hidden inside the heroes' group, secretly working for the other side.", "Main/TheMole"],
];

export const archetypes = [
  ...fromRows("archetype", vogler, { family: "Vogler", source: "Christopher Vogler, The Writer's Journey (1992)" }),
  ...fromRows("archetype", more),
];
