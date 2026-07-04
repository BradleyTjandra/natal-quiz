// The question bank — the voice of the product. Draft for Brad to refine: edit
// wording freely; the `loads` are the scoring contract (see docs/QUIZ-VOICE.md
// for the authoring rules and loading conventions). Element questions carry 4
// options (fire/earth/air/water), modality questions 3 (cardinal/fixed/mutable),
// always in that order here — the UI shuffles presentation order (M4).

import type { Question } from "./score.ts";

// Sign indices for the archetype nudges, for readability.
const TAURUS = 1;
const CANCER = 3;
const LEO = 4;
const SCORPIO = 7;

// Show the breather after this many questions (the big three), per SPEC.
export const BREATHER_AFTER = 12;

export const QUESTIONS: Question[] = [
  // ——— Sun: identity, vitality ———
  {
    id: "sun-free-day",
    placement: "sun",
    text: "A whole Saturday, nothing scheduled, nobody waiting on you. It's evening now, and the day felt genuinely good. What made it good?",
    options: [
      { text: "You ended up somewhere you didn't plan to be, slightly sunburned, with a story", loads: [{ placement: "sun", element: "fire", amount: 1 }] },
      { text: "Something that was broken this morning — a shelf, a budget, a sourdough starter — now works", loads: [{ placement: "sun", element: "earth", amount: 1 }] },
      { text: "A conversation or a rabbit hole rewired your brain a little", loads: [{ placement: "sun", element: "air", amount: 1 }] },
      { text: "You went so deep into a feeling, a person, or a piece of music that you lost the afternoon", loads: [{ placement: "sun", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "sun-compliment",
    placement: "sun",
    text: "Of the compliments you actually get, which one lands — the one that feels like being seen?",
    options: [
      { text: "“Things happen when you're around.”", loads: [{ placement: "sun", element: "fire", amount: 1 }, { placement: "sun", sign: LEO, amount: 0.3 }] },
      { text: "“You're the one who actually follows through.”", loads: [{ placement: "sun", element: "earth", amount: 1 }] },
      { text: "“You see the angle nobody else saw.”", loads: [{ placement: "sun", element: "air", amount: 1 }] },
      { text: "“You understood what I meant, not just what I said.”", loads: [{ placement: "sun", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "sun-project",
    placement: "sun",
    text: "A group project kicks off Monday — new team, blank slate, real stakes. The part you quietly hope falls to you:",
    options: [
      { text: "Deciding what we're actually doing and firing the starting gun", loads: [{ placement: "sun", modality: "cardinal", amount: 1 }] },
      { text: "Owning one meaty piece end-to-end, your name on it", loads: [{ placement: "sun", modality: "fixed", amount: 1 }] },
      { text: "Floating between the pieces, patching gaps, translating between people", loads: [{ placement: "sun", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "sun-engine",
    placement: "sun",
    text: "Forget any specific goal — which part of the process actually lights you up?",
    options: [
      { text: "The launch — the blank page, the first move, nothing into something", loads: [{ placement: "sun", modality: "cardinal", amount: 1 }] },
      { text: "The build — going deep, getting good, the long haul to mastery", loads: [{ placement: "sun", modality: "fixed", amount: 1 }] },
      { text: "The variety — several things at once, switching lanes, never the same way twice", loads: [{ placement: "sun", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— Moon: emotional needs, comfort, home ———
  {
    id: "moon-bad-day",
    placement: "moon",
    text: "Truly rotten day — the kind that gets in your chest. You're finally home with the door shut. What actually helps (not what should help)?",
    options: [
      { text: "Moving — a hard run, loud music, cooking something violent with garlic", loads: [{ placement: "moon", element: "fire", amount: 1 }] },
      { text: "The ritual: hot shower, real food, clean sheets, phone in another room", loads: [{ placement: "moon", element: "earth", amount: 1 }] },
      { text: "Saying it out loud to someone until it makes sense and gets smaller", loads: [{ placement: "moon", element: "air", amount: 1 }] },
      { text: "Letting it run its course — the sad playlist, maybe a cry, no fighting it", loads: [{ placement: "moon", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "moon-home",
    placement: "moon",
    text: "Forget how your place looks — what does home have to *feel* like, or it isn't home?",
    options: [
      { text: "A launchpad — somewhere to refuel between adventures, door half-open", loads: [{ placement: "moon", element: "fire", amount: 1 }] },
      { text: "A den — the good blanket, the stocked fridge, the one correct chair", loads: [{ placement: "moon", element: "earth", amount: 1 }] },
      { text: "A salon — light, books mid-pile, room for people to drop by and talk", loads: [{ placement: "moon", element: "air", amount: 1 }] },
      { text: "A shell — yours alone, where nobody can get to you unless invited", loads: [{ placement: "moon", element: "water", amount: 1 }, { placement: "moon", sign: CANCER, amount: 0.4 }] },
    ],
  },
  {
    id: "moon-loved-one",
    placement: "moon",
    text: "Someone you love is in real distress — bad news, tears, the works. Your instinct, before you can think about it:",
    options: [
      { text: "Act — make the call, book the thing, fix what's fixable tonight", loads: [{ placement: "moon", modality: "cardinal", amount: 1 }] },
      { text: "Plant yourself — you're not going anywhere, and they can feel it", loads: [{ placement: "moon", modality: "fixed", amount: 1 }] },
      { text: "Track them — read what they need minute to minute and become that", loads: [{ placement: "moon", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "moon-low-mood",
    placement: "moon",
    text: "You've been in a low mood for a couple of days now. How does it usually end?",
    options: [
      { text: "You snap yourself out — clean the flat, book the thing, make the overdue call, and it lifts", loads: [{ placement: "moon", modality: "cardinal", amount: 1 }] },
      { text: "It doesn't 'end', it recedes — on its own schedule, and pushing it never helps", loads: [{ placement: "moon", modality: "fixed", amount: 1 }] },
      { text: "Something small changes the channel — one conversation, weather, a song — and it's just gone", loads: [{ placement: "moon", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— Ascendant: the surface, first impressions ———
  {
    id: "asc-dinner",
    placement: "ascendant",
    text: "A close friend's birthday dinner, ten people, you know two of them. First half hour — what are *you* doing?",
    options: [
      { text: "Telling the story — you didn't plan to hold the floor, it just keeps happening", loads: [{ placement: "ascendant", element: "fire", amount: 1 }, { placement: "ascendant", sign: LEO, amount: 0.3 }] },
      { text: "Settled into one seat, unhurried, asking the person next to you real questions", loads: [{ placement: "ascendant", element: "earth", amount: 1 }] },
      { text: "Keeping it light and moving — you drift between clusters rather than settling into one", loads: [{ placement: "ascendant", element: "air", amount: 1 }] },
      { text: "Hanging back to read the room first, then attaching to the one person you've picked", loads: [{ placement: "ascendant", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "asc-five-minutes",
    placement: "ascendant",
    text: "Someone chats with you for five minutes at a bus stop, then describes you to a friend. Their honest one-liner:",
    options: [
      { text: "“A lot of energy. In a good way. Mostly.”", loads: [{ placement: "ascendant", element: "fire", amount: 1 }] },
      { text: "“Calm. Seemed like someone with their life handled.”", loads: [{ placement: "ascendant", element: "earth", amount: 1 }] },
      { text: "“Quick. We covered about ten topics in five minutes.”", loads: [{ placement: "ascendant", element: "air", amount: 1 }] },
      { text: "“Quiet at first — but there's clearly something going on in there.”", loads: [{ placement: "ascendant", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "asc-newcomer",
    placement: "ascendant",
    text: "You walk into a room where you know nobody and nothing's required of you. What does your body just do?",
    options: [
      { text: "Heads in — you make the first move and break your own ice", loads: [{ placement: "ascendant", modality: "cardinal", amount: 1 }] },
      { text: "Finds an anchor — a spot, a wall, a drink — and lets people come to you", loads: [{ placement: "ascendant", modality: "fixed", amount: 1 }] },
      { text: "Blends — reads the temperature and matches it before committing", loads: [{ placement: "ascendant", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "asc-pace",
    placement: "ascendant",
    text: "The tempo you *think* a stranger picks up from you in the first minute:",
    options: [
      { text: "Forward-leaning, like you're about to do something", loads: [{ placement: "ascendant", modality: "cardinal", amount: 1 }] },
      { text: "Grounded — steady, unhurried, hard to rattle", loads: [{ placement: "ascendant", modality: "fixed", amount: 1 }] },
      { text: "Quicksilver — a little different with everyone", loads: [{ placement: "ascendant", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— breather here (BREATHER_AFTER = 12) ———

  // ——— Mercury: thinking, talking, learning ———
  {
    id: "mercury-receive",
    placement: "mercury",
    text: "Someone's teaching you a game you've never played. How do you actually want it explained?",
    options: [
      { text: "Goal and gist, then deal — I'll pick it up in motion", loads: [{ placement: "mercury", element: "fire", amount: 1 }] },
      { text: "The rules in order, with one example round", loads: [{ placement: "mercury", element: "earth", amount: 1 }] },
      { text: "The core mechanic — once I see the logic I can derive the rest", loads: [{ placement: "mercury", element: "air", amount: 1 }] },
      { text: "Skip the rulebook — start playing with me and coach me through my first few turns; I pick it up through the back-and-forth", loads: [{ placement: "mercury", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "mercury-stuck",
    placement: "mercury",
    text: "You're trying to learn something and it won't go in. Your most likely failure mode:",
    options: [
      { text: "You skip the boring foundation, jump ahead, hit a wall you built yourself", loads: [{ placement: "mercury", element: "fire", amount: 1 }] },
      { text: "You won't move on till it's perfect, so you barely move at all", loads: [{ placement: "mercury", element: "earth", amount: 1 }] },
      { text: "You get it beautifully in theory and never actually do it", loads: [{ placement: "mercury", element: "air", amount: 1 }] },
      { text: "You can't get it from a page — you need someone to show you, and no one's around", loads: [{ placement: "mercury", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "mercury-meeting",
    placement: "mercury",
    text: "Forty minutes into a meandering meeting. The thing your brain keeps doing:",
    options: [
      { text: "Cutting in with “so what are we actually deciding?” — possibly too often", loads: [{ placement: "mercury", modality: "cardinal", amount: 1 }] },
      { text: "Boring into the one point everyone skated past, because it's *load-bearing*", loads: [{ placement: "mercury", modality: "fixed", amount: 1 }] },
      { text: "Threading — connecting what Ana said to what Raj said twenty minutes apart", loads: [{ placement: "mercury", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "mercury-notes",
    placement: "mercury",
    text: "Be honest: the current state of your notes — the place thoughts go so they don't die:",
    options: [
      { text: "Action lists — short, dated, ruthlessly next-step-shaped", loads: [{ placement: "mercury", modality: "cardinal", amount: 1 }] },
      { text: "One system, kept faithfully for years; you could find March 2019 if asked", loads: [{ placement: "mercury", modality: "fixed", amount: 1 }] },
      { text: "Seventeen apps, four notebooks, one napkin — all of them load-bearing", loads: [{ placement: "mercury", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— Venus: attraction, affection, taste ———
  {
    id: "venus-fall",
    placement: "venus",
    text: "Think of the last time you were properly drawn to someone. The hook — the thing that actually did it — was:",
    options: [
      { text: "Voltage — they were bold in a way that made the room feel slightly dangerous", loads: [{ placement: "venus", element: "fire", amount: 1 }] },
      { text: "Capability — the unshowy way they handled things and people. Competence is hot", loads: [{ placement: "venus", element: "earth", amount: 1 }] },
      { text: "The conversation — three hours passed and you were annoyed it ended", loads: [{ placement: "venus", element: "air", amount: 1 }] },
      { text: "Being seen — they clocked something about you that most people miss", loads: [{ placement: "venus", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "venus-gift",
    placement: "venus",
    text: "The gift that would actually get you — not the polite thank-you, the real one:",
    options: [
      { text: "An envelope: you're both going somewhere Saturday, details on arrival", loads: [{ placement: "venus", element: "fire", amount: 1 }] },
      { text: "One beautifully made thing you'll still be using in ten years", loads: [{ placement: "venus", element: "earth", amount: 1 }] },
      { text: "Something for your head — the book that'll change how you think, or tickets to the thing you'll argue about for weeks", loads: [{ placement: "venus", element: "air", amount: 1 }] },
      { text: "Something worthless to anyone else — a photo, a ticket stub, your history", loads: [{ placement: "venus", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "venus-affection",
    placement: "venus",
    text: "How your affection actually behaves, in any relationship that matters:",
    options: [
      { text: "It pursues — you initiate, you plan the thing, you say it first", loads: [{ placement: "venus", modality: "cardinal", amount: 1 }] },
      { text: "It keeps rituals — the standing Sunday call, the usual table, the long loyalty", loads: [{ placement: "venus", modality: "fixed", amount: 1 }, { placement: "venus", sign: TAURUS, amount: 0.4 }] },
      { text: "It mirrors — playful, responsive, always calibrated to what they're giving", loads: [{ placement: "venus", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "venus-taste",
    placement: "venus",
    text: "Your taste — music, food, clothes, rooms, whichever of those you actually have opinions about — over the years:",
    options: [
      { text: "A hunt — you actively go looking for the next thing; the finding is the fun, and once it's found you're already off again", loads: [{ placement: "venus", modality: "cardinal", amount: 1 }] },
      { text: "Settled — you found what you like years ago and see no reason to change it", loads: [{ placement: "venus", modality: "fixed", amount: 1 }] },
      { text: "Absorbent — it shifts on its own with whatever's around you; old phases feel like they belonged to someone else", loads: [{ placement: "venus", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— Mars: anger, drive, pursuit ———
  {
    id: "mars-conflict",
    placement: "mars",
    text: "A friend does something that genuinely crosses a line with you. What actually happens next?",
    options: [
      { text: "It comes out hot, now, to their face — and it's genuinely over by tomorrow", loads: [{ placement: "mars", element: "fire", amount: 1 }, { placement: "sun", element: "fire", amount: 0.4 }] },
      { text: "You go quiet and immovable; they'll know exactly where the wall is", loads: [{ placement: "mars", element: "earth", amount: 1 }, { placement: "sun", element: "earth", amount: 0.4 }] },
      { text: "You need it argued — points made, both sides heard, the logic settled", loads: [{ placement: "mars", element: "air", amount: 1 }, { placement: "sun", element: "air", amount: 0.4 }] },
      { text: "You withdraw and feel it at full depth; it resurfaces later, transformed or not at all", loads: [{ placement: "mars", element: "water", amount: 1 }, { placement: "sun", element: "water", amount: 0.4 }] },
    ],
  },
  {
    id: "mars-anger",
    placement: "mars",
    text: "Your anger, physically — the honest mechanics of it:",
    options: [
      { text: "Flash paper — instant, bright, embarrassingly fast to burn out", loads: [{ placement: "mars", element: "fire", amount: 1 }] },
      { text: "Geological — takes months of pressure, and the eruption gets remembered", loads: [{ placement: "mars", element: "earth", amount: 1 }] },
      { text: "Verbal — it goes straight to words, and the words get *precise*", loads: [{ placement: "mars", element: "air", amount: 1 }] },
      { text: "Tidal — it swells, spills where it shouldn't, recedes, returns", loads: [{ placement: "mars", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "mars-pursuit",
    placement: "mars",
    text: "There's something you want and aren't sure you can have — the job, the person, the grant. Your actual playbook:",
    options: [
      { text: "Direct assault — ask straight away, loudly, before doubt gets a vote", loads: [{ placement: "mars", modality: "cardinal", amount: 1 }] },
      { text: "Siege — you will simply still be there after everyone else has given up", loads: [{ placement: "mars", modality: "fixed", amount: 1 }, { placement: "mars", sign: SCORPIO, amount: 0.4 }] },
      { text: "Angles — you find the side door, the introduction, the reframe nobody tried", loads: [{ placement: "mars", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "mars-deadline",
    placement: "mars",
    text: "Big deadline, two weeks out. The true shape of your effort curve:",
    options: [
      { text: "Front-loaded — you attack it today so it stops owning you", loads: [{ placement: "mars", modality: "cardinal", amount: 1 }] },
      { text: "Flat and relentless — same hours every day, arriving exactly on time", loads: [{ placement: "mars", modality: "fixed", amount: 1 }] },
      { text: "Spiky — bursts, detours, a suspicious lull, then a heroic final sprint", loads: [{ placement: "mars", modality: "mutable", amount: 1 }] },
    ],
  },
];
