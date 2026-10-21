// Every line the mascot says (static strings, collected by scripts/voice-lines.mjs). Names come from brand.ts.
import { MASCOT_NAME } from './brand';
import { NAME_LINE, MIX_LINE } from './paint';
/** The only lines that say the mascot's name: re-clone just these after a rename (voice-lines.mjs --named). */
export const NAMED = { title: `Hi! I'm ${MASCOT_NAME}. Let's paint!` };
export const NAMED_LINES = Object.values(NAMED);
export const L = {
  ...NAMED,
  hub: 'What shall we paint today?', locked: 'Ask a grown-up to open this one!',
  mixGo: 'This friend wants a color! Drag two paints into the big puddle.', mixNew: 'Ooh, a brand new color! Let us keep it.', mixTry: 'Let us try again. Listen to the color!', mixStomp: 'Stomp stomp! Let us mix!',
  mixWin: 'You made the color! Look how happy!', wantOrange: 'Can you make orange?', wantGreen: 'Can you make green?', wantPurple: 'Can you make purple?', wantPink: 'Can you make pink?', wantSky: 'Can you make light blue?', wantBrown: 'Can you make brown?',
  shadeGo: 'Make the paint match! White makes it lighter. Black makes it darker.', lighter: 'Lighter!', darker: 'Darker!', tooLight: 'Too light! Add a little black.', tooDark: 'Too dark! Add a little white.', shadeWin: 'A perfect match!',
  roadGo: 'Paint the stones. Red, blue, red, blue. What comes next?', roadGo2: 'Look at the pattern. What color comes next?', roadWrong: 'Hmm, look at the pattern again!', roadWin: 'You finished the pattern! Hop hop hop!',
  wingGo: 'Paint one wing. The other wing paints itself, the same on both sides!', wingWin: 'Both wings match! That is called symmetry.', wingSame: 'Same on both sides!',
  rainGo: 'Catch the raindrops! Put each one in the bucket with the same color.', rainOops: 'That bucket is a different color. Try another one!', rainWin: 'All sorted! Great catching!',
  studioGo: 'Paint anything you like! Tap the frame to hang it on your wall.', studioSave: 'Your painting is on the wall in Color Town!', studioColor: 'New color!', studioStamp: 'Stamp!',
  townHi: 'Welcome to Color Town!', townGray: 'The town is gray. Let us paint it bright!', unlockBrush: 'A new brush for the studio!', unlockFriend: 'A new friend came to Color Town!',
  great: ['Great job!', 'Beautiful!', 'So colorful!', 'Hooray!'],
  names: Object.values(NAME_LINE), mixes: Object.values(MIX_LINE),
};
export function allLines(): string[] { const out: string[] = []; const add = (v: unknown) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(add); }; Object.values(L).forEach(add); return [...new Set(out)]; }
