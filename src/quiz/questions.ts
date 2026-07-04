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
    id: "sun-decade",
    placement: "sun",
    text: "Zoom out on your last ten years. Honestly, the shape of them is:",
    options: [
      { text: "Chapters — each one opened deliberately, often by blowing up the previous one", loads: [{ placement: "sun", modality: "cardinal", amount: 1 }] },
      { text: "One long throughline, deepening — the same core, better executed", loads: [{ placement: "sun", modality: "fixed", amount: 1 }] },
      { text: "Reinventions you didn't exactly choose — you look back and count four different lives", loads: [{ placement: "sun", modality: "mutable", amount: 1 }] },
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
      { text: "A den — warm, stocked, physically comfortable in a way guests remark on", loads: [{ placement: "moon", element: "earth", amount: 1 }] },
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
    id: "moon-weather",
    placement: "moon",
    text: "Your own feelings, described as weather:",
    options: [
      { text: "Storms — sudden, loud, gone by morning", loads: [{ placement: "moon", modality: "cardinal", amount: 1 }] },
      { text: "Climate — slow to change, but when it changes, it *changes*", loads: [{ placement: "moon", modality: "fixed", amount: 1 }] },
      { text: "Coastal — four seasons a day, hard to forecast even for you", loads: [{ placement: "moon", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— Ascendant: the surface, first impressions ———
  {
    id: "asc-dinner",
    placement: "ascendant",
    text: "A close friend's birthday dinner, ten people, you know two of them. First half hour — where are you, really?",
    options: [
      { text: "Mid-table, mid-story, already slightly too loud — and the table's laughing", loads: [{ placement: "ascendant", element: "fire", amount: 1 }, { placement: "ascendant", sign: LEO, amount: 0.3 }] },
      { text: "Settled into one seat, unhurried, asking the person next to you real questions", loads: [{ placement: "ascendant", element: "earth", amount: 1 }] },
      { text: "Everywhere — you've had two minutes with everyone by the time starters land", loads: [{ placement: "ascendant", element: "air", amount: 1 }] },
      { text: "Reading the room from a corner, then one conversation that turns weirdly deep", loads: [{ placement: "ascendant", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "asc-guess",
    placement: "ascendant",
    text: "People who've known you under an hour keep guessing the same wrong-but-telling thing about you. It's some version of:",
    options: [
      { text: "“You must be exhausting to keep up with” — they read intensity", loads: [{ placement: "ascendant", element: "fire", amount: 1 }] },
      { text: "“You seem like you have your life together” — they read solidity", loads: [{ placement: "ascendant", element: "earth", amount: 1 }] },
      { text: "“You must know everyone here” — they read quickness, connection", loads: [{ placement: "ascendant", element: "air", amount: 1 }] },
      { text: "“You're hard to read” — they sense more under the surface than you show", loads: [{ placement: "ascendant", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "asc-first-day",
    placement: "ascendant",
    text: "First day somewhere new — job, class, team. Nobody knows you yet. Your opening move:",
    options: [
      { text: "Introduce yourself first, to as many people as possible, before lunch", loads: [{ placement: "ascendant", modality: "cardinal", amount: 1 }] },
      { text: "Claim a spot — a desk, a routine, a role — and let people come to you", loads: [{ placement: "ascendant", modality: "fixed", amount: 1 }] },
      { text: "Camouflage — match the room's energy until you've mapped it", loads: [{ placement: "ascendant", modality: "mutable", amount: 1 }] },
    ],
  },
  {
    id: "asc-waiting-room",
    placement: "ascendant",
    text: "Twenty minutes in a waiting room, phone dead. A stranger watching you would see someone:",
    options: [
      { text: "Coiled — scanning for something to do about this, possibly negotiating with reception", loads: [{ placement: "ascendant", modality: "cardinal", amount: 1 }] },
      { text: "Planted — settled in like the chair belongs to them, unbothered", loads: [{ placement: "ascendant", modality: "fixed", amount: 1 }] },
      { text: "Sampling — the leaflets, the fish tank, the other patients, the ceiling", loads: [{ placement: "ascendant", modality: "mutable", amount: 1 }] },
    ],
  },

  // ——— breather here (BREATHER_AFTER = 12) ———

  // ——— Mercury: thinking, talking, learning ———
  {
    id: "mercury-explain",
    placement: "mercury",
    text: "You have to explain something genuinely complicated — your job, a policy, an idea you love — to a smart friend who knows nothing about it. Your move:",
    options: [
      { text: "Momentum — you sell the *why* with enough conviction that details can wait", loads: [{ placement: "mercury", element: "fire", amount: 1 }] },
      { text: "Steps — first this, then this, with one concrete example per step", loads: [{ placement: "mercury", element: "earth", amount: 1 }] },
      { text: "Analogy — “ok so imagine it's like...” and suddenly they've got the shape of it", loads: [{ placement: "mercury", element: "air", amount: 1 }] },
      { text: "Story — you tell it through a person it happened to, watching their face to steer", loads: [{ placement: "mercury", element: "water", amount: 1 }] },
    ],
  },
  {
    id: "mercury-learn",
    placement: "mercury",
    text: "You've decided to actually learn to cook. Week one looks like:",
    options: [
      { text: "Attempting a five-ingredient flambé immediately; one pan does not survive", loads: [{ placement: "mercury", element: "fire", amount: 1 }] },
      { text: "One trusted recipe, followed exactly, repeated until it's muscle memory", loads: [{ placement: "mercury", element: "earth", amount: 1 }] },
      { text: "Three books and forty videos in — you can explain Maillard; you have not yet cooked", loads: [{ placement: "mercury", element: "air", amount: 1 }] },
      { text: "In your grandmother's / friend's kitchen, absorbing it by standing next to them", loads: [{ placement: "mercury", element: "water", amount: 1 }] },
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
      { text: "Substance — how they showed up, on time, the way they handled things and people", loads: [{ placement: "venus", element: "earth", amount: 1 }] },
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
      { text: "Proof they listened: the obscure thing you mentioned once, in April, found", loads: [{ placement: "venus", element: "air", amount: 1 }] },
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
    text: "Your taste — clothes, music, rooms — over the years has been:",
    options: [
      { text: "First — you were into it before it was everywhere, then bored of it", loads: [{ placement: "venus", modality: "cardinal", amount: 1 }] },
      { text: "A signature — recognisably yours for a decade, refined not replaced", loads: [{ placement: "venus", modality: "fixed", amount: 1 }] },
      { text: "Seasonal — your friends have stopped being surprised by the new phase", loads: [{ placement: "venus", modality: "mutable", amount: 1 }] },
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
