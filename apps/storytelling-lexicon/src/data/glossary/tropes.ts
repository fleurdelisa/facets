import { fromRows, type Row } from "./rows";

const rows: Row[] = [
  // Underdogs, destiny and identity
  ["the-underdog", "The Underdog", "The side everyone expects to lose — and the audience roots for anyway.", "Main/UnderdogsNeverLose", ["Underdogs Never Lose"]],
  ["the-dark-horse", "The Dark Horse", "A little-known contender who comes out of nowhere to win.", "Main/DarkHorseVictory", ["Dark Horse Victory"]],
  ["rightful-king-returns", "The Rightful King Returns", "The true heir comes back to reclaim their throne from a usurper.", "Main/RightfulKingReturns"],
  ["secret-identity", "Secret Identity", "A character hides who they really are behind a second, public self.", "Main/SecretIdentity"],
  ["mistaken-identity", "Mistaken Identity", "One person is taken for another, setting confusion in motion.", "Main/MistakenIdentity"],
  ["evil-twin", "Evil Twin", "A character's double — sibling, clone or duplicate — with opposite morals.", "Main/EvilTwin"],
  ["freaky-friday-flip", "Body Swap", "Two characters wake up in each other's bodies.", "Main/FreakyFridayFlip", ["Freaky Friday Flip"]],
  ["laser-guided-amnesia", "Convenient Amnesia", "Memory loss that erases exactly what the plot needs forgotten.", "Main/LaserGuidedAmnesia", ["Laser-Guided Amnesia"]],
  ["luke-i-am-your-father", "Shocking Parentage", "A character learns their parent is someone unexpected — often their enemy.", "Main/LukeIAmYourFather", ["Luke, I Am Your Father"]],
  ["dark-and-troubled-past", "Dark and Troubled Past", "A character's history is full of pain that shapes who they are now.", "Main/DarkAndTroubledPast", ["Tragic Backstory"]],
  ["becoming-the-mask", "Becoming the Mask", "Someone playing a false role comes to genuinely believe in it.", "Main/BecomingTheMask"],

  // Journeys and change
  ["there-and-back-again", "There and Back Again", "A journey out into the world and the return home, changed by it.", "Main/ThereAndBackAgain", ["The Journey Home", "Homecoming"]],
  ["fish-out-of-water", "Fish Out of Water", "A character dropped into an unfamiliar environment struggles to fit in.", "Main/FishOutOfWater"],
  ["coming-of-age", "Coming of Age", "A young person's passage into adulthood through formative experience.", "Main/ComingOfAgeStory", ["Bildungsroman"]],
  ["redemption-arc", "Redemption Arc", "A wrongdoer works, over the course of the story, to atone and become better."],
  ["heel-face-turn", "Heel–Face Turn", "A villain switches sides and becomes good.", "Main/HeelFaceTurn"],
  ["face-heel-turn", "Face–Heel Turn", "A good character switches sides and becomes a villain.", "Main/FaceHeelTurn"],
  ["love-redeems", "Love Redeems", "Love for or from someone is what turns a character around.", "Main/LoveRedeems"],
  ["time-loop", "Time Loop", "A character relives the same stretch of time until something changes.", "Main/GroundhogDayLoop", ["Groundhog Day Loop"]],

  // Conflict and the climb
  ["the-determinator", "The Determinator", "A character who will not stop, no matter what's thrown at them.", "Main/TheDeterminator"],
  ["its-personal", "It's Personal", "The conflict stops being about the mission and becomes a personal grudge.", "Main/ItsPersonal"],
  ["roaring-rampage-of-revenge", "Revenge Quest", "A character hunts those who wronged them, often leaving devastation behind.", "Main/RoaringRampageOfRevenge", ["Roaring Rampage of Revenge"]],
  ["worthy-opponent", "Worthy Opponent", "Enemies who respect each other's skill and honour.", "Main/WorthyOpponent"],
  ["friendly-rivalry", "Friendly Rivalry", "Rivals who compete hard but remain friends.", "Main/FriendlyRivalry"],
  ["enemy-mine", "Enemy Mine", "Enemies team up against a common, greater threat.", "Main/EnemyMine"],
  ["training-montage", "Training Montage", "Weeks of improvement compressed into a sequence of quick shots.", "Main/TrainingMontage"],
  ["tournament-arc", "Tournament Arc", "The plot takes the form of a competition, bracket by bracket.", "Main/TournamentArc"],
  ["the-caper", "The Heist", "A crew plans and pulls off an elaborate theft.", "Main/TheCaper", ["The Caper"]],
  ["xanatos-gambit", "Xanatos Gambit", "A plan built so every possible outcome benefits the planner.", "Main/XanatosGambit"],
  ["batman-gambit", "Batman Gambit", "A plan that depends on predicting exactly how others will behave.", "Main/BatmanGambit"],
  ["unwitting-pawn", "Unwitting Pawn", "A character who has been serving someone else's scheme without knowing it.", "Main/UnwittingPawn"],
  ["darkest-hour", "Darkest Hour", "The point where everything seems lost, just before the turnaround.", "Main/DarkestHour"],
  ["heroic-bsod", "Heroic Breakdown", "The hero is so shaken they shut down emotionally.", "Main/HeroicBSOD", ["Heroic BSoD"]],
  ["nice-job-breaking-it-hero", "Nice Job Breaking It, Hero", "The hero's own actions cause or worsen the disaster.", "Main/NiceJobBreakingItHero"],
  ["what-the-hell-hero", "What the Hell, Hero?", "Another character calls the hero out for a morally questionable act.", "Main/WhatTheHellHero"],
  ["cassandra-truth", "Cassandra Truth", "Someone tells the truth and is not believed.", "Main/CassandraTruth"],
  ["fatal-flaw", "Fatal Flaw", "A character trait that leads to the character's downfall.", "Main/FatalFlaw", ["Hamartia"]],
  ["deal-with-the-devil", "Deal with the Devil", "A bargain with a dark power, paid for later at a terrible price.", "Main/DealWithTheDevil", ["Faustian Bargain"]],
  ["prophecy-twist", "Prophecy Twist", "A prophecy comes true, but not in the way anyone assumed.", "Main/ProphecyTwist"],
  ["self-fulfilling-prophecy", "Self-Fulfilling Prophecy", "Trying to prevent a prophecy is exactly what makes it come true.", "Main/SelfFulfillingProphecy"],
  ["damsel-in-distress", "Damsel in Distress", "A helpless captive who must be rescued by the hero.", "Main/DamselInDistress"],
  ["clear-my-name", "Clear My Name", "A wrongly accused character must prove their innocence.", "Main/ClearMyName", ["Wrongly Accused"]],
  ["locked-room-mystery", "Locked Room Mystery", "A crime that seems impossible — committed somewhere no one could enter or leave.", "Main/LockedRoomMystery"],
  ["big-damn-heroes", "Big Damn Heroes", "Allies arrive at the last possible moment to save the day.", "Main/BigDamnHeroes", ["Cavalry Arrives"]],
  ["last-stand", "Last Stand", "Outnumbered defenders hold out against overwhelming odds.", "Main/LastStand"],
  ["final-battle", "Final Battle", "The climactic confrontation that decides the conflict.", "Main/FinalBattle"],
  ["the-power-of-friendship", "The Power of Friendship", "Bonds between friends become the force that wins the day.", "Main/ThePowerOfFriendship"],
  ["found-family", "Found Family", "A group of unrelated people who become each other's true family.", "Main/FamilyOfChoice", ["Family of Choice"]],

  // Characterisation beats
  ["pet-the-dog", "Pet the Dog", "A small act of kindness shows a hard character has a good side.", "Main/PetTheDog", ["Save the Cat (moment)"]],
  ["kick-the-dog", "Kick the Dog", "A small act of cruelty shows how bad a character really is.", "Main/KickTheDog"],
  ["mentor-occupational-hazard", "Death of the Mentor", "The mentor dies or leaves, forcing the hero to stand alone.", "Main/MentorOccupationalHazard", ["Mentor Occupational Hazard"]],
  ["heroic-sacrifice", "Heroic Sacrifice", "A character gives their life to save others.", "Main/HeroicSacrifice"],
  ["sacrificial-lamb", "Sacrificial Lamb", "A likeable character killed early to show the stakes are real.", "Main/SacrificialLamb"],
  ["killed-off-for-real", "Killed Off for Real", "A death that sticks — no resurrection, no twist.", "Main/KilledOffForReal"],
  ["back-from-the-dead", "Back from the Dead", "A character believed dead returns.", "Main/BackFromTheDead"],
  ["plot-armor", "Plot Armor", "A character survives anything because the story needs them.", "Main/PlotArmor"],

  // Romance
  ["love-triangle", "Love Triangle", "Three people tangled in competing romantic attachments.", "Main/LoveTriangle"],
  ["star-crossed-lovers", "Star-Crossed Lovers", "Lovers kept apart by forces beyond their control, often doomed.", "Main/StarCrossedLovers"],
  ["enemies-to-lovers", "Enemies to Lovers", "Two characters who start out hating each other fall in love."],
  ["belligerent-sexual-tension", "Belligerent Sexual Tension", "Two characters bicker constantly, and the friction is clearly attraction.", "Main/BelligerentSexualTension"],
  ["will-they-or-wont-they", "Will They or Won't They?", "A long-running question of whether two characters will get together.", "Main/WillTheyOrWontThey"],
  ["unresolved-sexual-tension", "Unresolved Sexual Tension", "Obvious attraction that the story keeps from being acted on.", "Main/UnresolvedSexualTension"],
  ["fake-relationship", "Fake Relationship", "Two characters pretend to be a couple — and it gets complicated.", "Main/FakeRelationship"],
  ["meet-cute", "Meet Cute", "A charming, often awkward first meeting between future lovers.", "Main/MeetCute"],
  ["love-at-first-sight", "Love at First Sight", "Two characters fall for each other instantly.", "Main/LoveAtFirstSight"],
  ["odd-couple", "Odd Couple", "Two mismatched personalities forced to live or work together.", "Main/OddCouple"],

  // Endings
  ["happily-ever-after", "Happily Ever After", "Everything is resolved and everyone lives on in contentment.", "Main/HappilyEverAfter"],
  ["bittersweet-ending", "Bittersweet Ending", "Victory comes at a significant cost.", "Main/BittersweetEnding"],
  ["downer-ending", "Downer Ending", "The story ends in loss or failure.", "Main/DownerEnding"],
  ["shoot-the-shaggy-dog", "Shoot the Shaggy Dog", "The protagonists' efforts turn out to have been for nothing.", "Main/ShootTheShaggyDog"],
  ["ambiguous-ending", "Ambiguous Ending", "The ending leaves key questions open to interpretation.", "Main/AmbiguousEnding"],
  ["gainax-ending", "Gainax Ending", "An ending so surreal or abrupt it seems to come from another story.", "Main/GainaxEnding"],
];

export const tropes = fromRows("trope", rows);
