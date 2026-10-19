import type { SeedEntry } from "./schema";

const BOOKER = "Christopher Booker, The Seven Basic Plots (2004)";
const POLTI = "Georges Polti, The Thirty-Six Dramatic Situations (1895; trans. 1916)";

const booker: SeedEntry[] = [
  {
    slug: "overcoming-the-monster",
    name: "Overcoming the Monster",
    summary: "A hero sets out to defeat a threatening force that menaces their home or the world.",
    description:
      "The community lives under the shadow of a monster — a beast, a tyrant, a hostile power. The hero hears the call, prepares, confronts the monster in its lair, survives a moment where all seems lost, and destroys it, freeing the community and often winning a reward.",
  },
  {
    slug: "rags-to-riches",
    name: "Rags to Riches",
    summary: "A lowly, overlooked protagonist rises to wealth, status or love, revealing their true worth.",
    description:
      "Booker's version is not a simple climb: the hero's early success is followed by a crisis where everything is lost, and only after proving themselves without outside help do they win the lasting prize.",
  },
  {
    slug: "the-quest",
    name: "The Quest",
    summary: "A hero and companions travel toward a distant, vital goal, overcoming trials along the way.",
    description:
      "The call to leave home, a journey through hostile lands, temptations and ordeals, the arrival within sight of the goal, a final series of tests, and the prize won — often a treasure, a kingdom or the restoration of something lost.",
  },
  {
    slug: "voyage-and-return",
    name: "Voyage and Return",
    aliases: ["The Journey Home", "Nostos", "Homecoming"],
    summary: "The protagonist falls into a strange world, is changed by it, and escapes back home.",
    description:
      "Unlike the quest, there is no goal out there — the protagonist simply ends up somewhere unfamiliar (a looking-glass world, a far country, the past). Fascination gives way to frustration and a nightmare threat, then a thrilling escape home, usually wiser. The Greek word nostos names the homeward journey itself, as in the Odyssey.",
  },
  {
    slug: "comedy",
    name: "Comedy",
    summary: "Confusion and misunderstanding keep people apart until everything is set right and they are united.",
    description:
      "In Booker's sense comedy is about structure, not jokes: a shadow of confusion, mistaken identity or a blocking figure divides characters, tension builds until it peaks, and then the truth comes out, the false is stripped away, and the story ends in union — often a wedding.",
  },
  {
    slug: "tragedy",
    name: "Tragedy",
    summary: "A protagonist with a fatal flaw or a fatal choice is drawn into a fall that ends in destruction.",
    description:
      "Anticipation, dream, frustration, nightmare, destruction. The hero is tempted toward some forbidden desire, enjoys an early success, then the consequences close in until they are destroyed — often a mirror image of the Overcoming the Monster plot, told from the monster's side.",
  },
  {
    slug: "rebirth",
    name: "Rebirth",
    summary: "A character falls under a dark spell or into a living death, and is redeemed or released.",
    description:
      "The protagonist is held by a dark power or their own coldness — a curse, a sleep, a hardened heart. The darkness seems to win, until a redeeming figure or event breaks the spell and the character returns to life, often transformed.",
  },
].map((e) => ({ ...e, layer: "plot", family: "Booker", source: BOOKER }) as SeedEntry);

// Polti's list, in his order. The one-line glosses are ours.
const poltiList: [string, string, string][] = [
  ["supplication", "Supplication", "Someone in danger or distress begs a power-holder for help."],
  ["deliverance", "Deliverance", "An unexpected rescuer saves the unfortunate from a threat."],
  ["crime-pursued-by-vengeance", "Crime Pursued by Vengeance", "An avenger hunts down the one who committed a crime."],
  ["vengeance-for-kin-upon-kin", "Vengeance Taken for Kindred upon Kindred", "A family member avenges one relative upon another."],
  ["pursuit", "Pursuit", "A fugitive flees punishment, real or unjust, with a pursuer close behind."],
  ["disaster", "Disaster", "A great power is overthrown or a catastrophe strikes the defeated."],
  ["falling-prey-to-cruelty", "Falling Prey to Cruelty or Misfortune", "An innocent suffers at the hands of a cruel master or bad fortune."],
  ["revolt", "Revolt", "A conspirator or rebel rises against a tyrant."],
  ["daring-enterprise", "Daring Enterprise", "A bold leader attempts a dangerous feat to win an object or defeat an adversary."],
  ["abduction", "Abduction", "Someone is carried off against their will, and a guardian may try to rescue them."],
  ["the-enigma", "The Enigma", "A problem or riddle must be solved, often under threat."],
  ["obtaining", "Obtaining", "Someone seeks to obtain an object, through force or persuasion, against a refuser."],
  ["enmity-of-kin", "Enmity of Kinsmen", "Hatred breaks out between family members."],
  ["rivalry-of-kin", "Rivalry of Kinsmen", "Relatives compete for the same person or prize."],
  ["murderous-adultery", "Murderous Adultery", "Lovers conspire to kill a betrayed spouse."],
  ["madness", "Madness", "A character, gone mad, harms an innocent victim."],
  ["fatal-imprudence", "Fatal Imprudence", "Carelessness or curiosity brings about a loss."],
  ["involuntary-crimes-of-love", "Involuntary Crimes of Love", "A lover unknowingly commits a forbidden act, then learns the truth."],
  ["slaying-of-kin-unrecognized", "Slaying of a Kinsman Unrecognized", "Someone kills a relative without knowing who they are."],
  ["self-sacrifice-for-an-ideal", "Self-Sacrifice for an Ideal", "A hero gives up life, love or fortune for a cause."],
  ["self-sacrifice-for-kin", "Self-Sacrifice for Kindred", "A hero sacrifices themselves for a family member."],
  ["all-sacrificed-for-passion", "All Sacrificed for Passion", "A lover gives up everything for an object of fatal desire."],
  ["sacrificing-loved-ones", "Necessity of Sacrificing Loved Ones", "A hero must sacrifice someone they love for a higher duty."],
  ["rivalry-of-superior-and-inferior", "Rivalry of Superior and Inferior", "Two rivals of unequal standing compete for the same object."],
  ["adultery", "Adultery", "A deceived spouse is betrayed by their partner and a lover."],
  ["crimes-of-love", "Crimes of Love", "A lover and beloved commit a transgression together."],
  ["discovery-of-dishonor", "Discovery of the Dishonor of a Loved One", "Someone learns a person they love has done something shameful."],
  ["obstacles-to-love", "Obstacles to Love", "Two lovers are kept apart by family, society or circumstance."],
  ["an-enemy-loved", "An Enemy Loved", "Someone falls in love with a person their side considers an enemy."],
  ["ambition", "Ambition", "An ambitious person pursues a coveted goal against an adversary."],
  ["conflict-with-a-god", "Conflict with a God", "A mortal struggles against a deity or higher power."],
  ["mistaken-jealousy", "Mistaken Jealousy", "Jealousy is roused by a misunderstanding or a deceiver's scheme."],
  ["erroneous-judgment", "Erroneous Judgment", "Someone is wrongly accused or misjudged because of a mistake or deception."],
  ["remorse", "Remorse", "A culprit is tormented by guilt over a crime or fault."],
  ["recovery-of-a-lost-one", "Recovery of a Lost One", "Someone long lost is found again."],
  ["loss-of-loved-ones", "Loss of Loved Ones", "A character witnesses the death of someone they love and is powerless to stop it."],
];

const polti: SeedEntry[] = poltiList.map(([slug, name, summary], i) => ({
  slug,
  name,
  summary,
  layer: "plot",
  family: "Polti",
  aliases: [`Polti No. ${i + 1}`],
  source: POLTI,
}));

export const plots: SeedEntry[] = [...booker, ...polti];
