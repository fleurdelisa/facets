import { fromRows, type Row } from "./rows";

const rows: Row[] = [
  // Setup and payoff
  ["chekhovs-gun", "Chekhov's Gun", "A detail introduced early that becomes important later — if it's on the wall in act one, it fires by act three.", "Main/ChekhovsGun"],
  ["chekhovs-gunman", "Chekhov's Gunman", "A seemingly minor character who turns out to matter.", "Main/ChekhovsGunman"],
  ["chekhovs-skill", "Chekhov's Skill", "A skill shown in passing that later saves the day.", "Main/ChekhovsSkill"],
  ["foreshadowing", "Foreshadowing", "Hints at what is to come.", "Main/Foreshadowing"],
  ["red-herring", "Red Herring", "A clue planted to mislead the audience away from the truth.", "Main/RedHerring"],
  ["macguffin", "MacGuffin", "An object everyone wants that drives the plot, whose nature barely matters.", "Main/MacGuffin"],
  ["deus-ex-machina", "Deus ex Machina", "An unforeseen outside force suddenly solves an unsolvable problem.", "Main/DeusExMachina"],
  ["diabolus-ex-machina", "Diabolus ex Machina", "An unforeseen outside force suddenly makes things much worse.", "Main/DiabolusExMachina"],
  ["ticking-clock", "Ticking Clock", "A deadline that ratchets up tension as it approaches.", "Main/TickingClock"],
  ["rule-of-three", "Rule of Three", "Things come in threes — the third time breaks the pattern or pays it off.", "Main/RuleOfThree"],
  ["twist-ending", "Twist Ending", "A late revelation that changes the meaning of everything before it.", "Main/TwistEnding"],
  ["wham-episode", "Wham Episode", "An instalment where everything changes and the story can't go back.", "Main/WhamEpisode"],
  ["wham-line", "Wham Line", "A single line of dialogue that upends the situation.", "Main/WhamLine"],
  ["poetic-justice", "Poetic Justice", "A character's fate fits their deeds with ironic precision.", "Main/PoeticJustice"],
  ["dramatic-irony", "Dramatic Irony", "The audience knows something the characters don't.", "Main/DramaticIrony"],

  // Time and order
  ["in-medias-res", "In Medias Res", "The story opens in the middle of the action.", "Main/InMediasRes"],
  ["how-we-got-here", "How We Got Here", "The story opens near the end, then flashes back to explain how things reached that point.", "Main/HowWeGotHere"],
  ["flashback", "Flashback", "A scene set earlier than the main timeline.", "Main/Flashback"],
  ["flash-forward", "Flash-Forward", "A scene set later than the main timeline.", "Main/FlashForward"],
  ["nonlinear-storyline", "Nonlinear Storyline", "Events are presented out of chronological order.", "Main/NonLinearStoryline"],
  ["reverse-chronology", "Reverse Chronology", "The story is told from end to beginning.", "Main/ReverseChronology"],
  ["cold-open", "Cold Open", "A scene before the opening titles that hooks the audience.", "Main/ColdOpen"],
  ["cliffhanger", "Cliffhanger", "An instalment ends at a moment of unresolved suspense.", "Main/Cliffhanger"],
  ["the-stinger", "The Stinger", "A short scene after the credits.", "Main/TheStinger", ["Post-Credits Scene"]],
  ["bookends", "Bookends", "The story begins and ends with a matching scene, image or line.", "Main/BookEnds"],

  // Telling and frame
  ["unreliable-narrator", "Unreliable Narrator", "The narrator's account can't be fully trusted.", "Main/UnreliableNarrator"],
  ["first-person-narration", "First-Person Narration", "A character tells the story as 'I'.", "Main/FirstPersonNarration"],
  ["omniscient-narrator", "Omniscient Narrator", "A narrator who knows everything, including characters' thoughts.", "Main/OmniscientNarrator"],
  ["rashomon-style", "Rashomon Style", "The same events told several times from different, contradictory viewpoints.", "Main/RashomonStyle"],
  ["framing-device", "Framing Device", "An outer story that contains the main one.", "Main/FramingDevice", ["Frame Story"]],
  ["story-within-a-story", "Story Within a Story", "A character tells or encounters a story inside the narrative.", "Main/StoryWithinAStory", ["Nested Story"]],
  ["epistolary-novel", "Epistolary Narrative", "A story told through letters, diaries, documents or messages.", "Main/EpistolaryNovel"],
  ["breaking-the-fourth-wall", "Breaking the Fourth Wall", "A character acknowledges the audience or that they're in a story.", "Main/BreakingTheFourthWall"],
  ["lampshade-hanging", "Lampshade Hanging", "Drawing attention to an implausibility so the audience accepts it and moves on.", "Main/LampshadeHanging"],
  ["greek-chorus", "Greek Chorus", "A character or group that comments on the action for the audience.", "Main/GreekChorus"],

  // Exposition and character
  ["show-dont-tell", "Show, Don't Tell", "Convey information through action and detail instead of statement.", "Main/ShowDontTell"],
  ["info-dump", "Info Dump", "A large block of exposition delivered all at once.", "Main/InfoDump"],
  ["as-you-know", "As You Know", "Characters tell each other things they both already know, for the audience's benefit.", "Main/AsYouKnow"],
  ["foil", "Foil", "A character who contrasts with another to highlight their traits.", "Main/Foil"],
  ["the-watson", "The Watson", "A character who asks the questions the audience would ask.", "Main/TheWatson"],
  ["leitmotif", "Leitmotif", "A recurring musical theme attached to a character, place or idea.", "Main/Leitmotif"],
  ["pathetic-fallacy", "Pathetic Fallacy", "Weather or surroundings mirror a character's emotions.", "Main/PatheticFallacy"],
  ["symbolism", "Symbolism", "An object, character or event that stands for an idea beyond itself."],
  ["allegory", "Allegory", "A story whose characters and events systematically stand for something else."],
];

export const devices = fromRows("device", rows);
