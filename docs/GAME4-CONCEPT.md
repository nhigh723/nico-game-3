# Game #4 concept: "Hop Pond" (sounds and early-word game)

> The mascot's name comes from `src/brand.ts` (`MASCOT_NAME`). This doc writes "the mascot" so a rename costs nothing.
> Working title only. Like games #2 and #3, the repo and app id stay neutral (nhigh723/nico-game-4, com.nickhigh.game4).

**One-line pitch:** Hop a family of jelly-bright frogs across a magic pond by listening: catch first sounds, rhymes and beats, and every lily pad you land on blooms into a giant glowing flower.

## Why this, and no overlap
- **Game #1 (science):** experiments, lab modes, pets, vehicles, space, dinos, music, food, town and more. It has no phonics, rhyme or word-sound play (checked its source: no rhyme, letter-sound or syllable activities). Its pets hide-and-seek and music game are avoided here: no hiding games, no instruments or songs.
- **Game #2 (Nico Builds!):** blocks, balance and engineering.
- **Game #3 (Puddle Painter):** color, mixing, patterns, symmetry, painting.
- **Game #4** is about **listening and the sounds inside words** (phonological awareness), the skill that comes right before reading. It is the best-studied predictor of later reading, and it needs **no reading at all**: everything is heard and shown as pictures.

## Who
- **Ages 3-6, no reading.** Every instruction and every word is spoken by the mascot's cloned voice; pictures carry every answer. Letters appear only as big friendly shapes in a later mode, always spoken, never required.
- **Look:** very bright: a turquoise pond, hot-pink and lime frogs, sunflower-yellow pads that bloom into neon flowers, fireflies at "night" levels.
- **Same rules as the family:** animated hand demos, single-tap Back, no text, no ads or tracking, parental gate, StoreKit 2 subscription, free tier first 2 activities.

## Core loop
1. A baby frog sits on a pad; three picture pads float ahead (for example a sun, a cup, a sock).
2. The mascot says a prompt: "Hop to the one that starts with sss!"
3. The child taps or drags the frog to a pad. Right: big hop, splash, the pad blooms, the frog croaks the word happily. Wrong: a soft wobble, the word is spoken again ("That's cup. Cup starts with k!"), try again. No fail state.
4. Five hops cross the pond; the frog joins the family on the far bank. The bank fills with frogs and flowers (the long-term collection, like Color Town).

## Six activities
1. **First Sound Hop** (free): pick the picture that starts with a target sound (s, m, b, t...).
2. **Rhyme Hop** (free): "What rhymes with cat?" Hat, dog, sun.
3. **Beat Hop:** a word is spoken; the frog hops once per syllable (but-ter-fly = 3 hops); the child taps each hop. Clapping without music.
4. **Sound Blender:** the mascot says "c... a... t"; tap the picture it makes. Later, "Which word is longer?"
5. **Odd Frog Out:** three frogs croak words; tap the one that doesn't start (or end) the same.
6. **Letter Lily Pads** (ages 5-6): a big letter shape is spoken by its sound; trace it with a finger like a frog trail; then it hops onto the pad with its picture. Letters are shapes to trace, never text to read.

## Long-term replay
- A word bank of about 150 simple picture words; levels rotate, and a spaced-repetition list brings back sounds a child missed.
- The bank grows: frogs, flowers, fireflies and a night mode unlock with wins.
- Difficulty steps quietly: 2 choices, then 3, then 4; continuous sounds (s, m) before stop sounds (t, b); end sounds after first sounds.
- A grown-ups page (behind the gate) shows which sounds and rhymes are solid, using pictures and a simple chart.

## Tech and voice
- Same stack (TypeScript, Vite, canvas, Capacitor 7, StoreKit 2 with parental gate), `src/brand.ts`, `play-all` + `monkey` tests.
- Voice is the heart of this game, and isolated sounds ("sss", "k") are short clips, the exact weakness of the clone gate. Plan from day one: generate sounds and words inside carrier phrases (scripts/pad-voice.py) and keep the 0.84 bar; record any stubborn phoneme clips directly from Nick if needed. Phonemes must be pronounced correctly ("mmm", not "muh"): add a pronunciation check by ear before shipping.
- Every picture is original vector art drawn in code. Nothing copied from any other app.

## Risks
- Phoneme audio quality decides the game: budget a manual listening pass.
- Regional accents: choose word sets that work for US English first.
- Keep rounds short (5 hops) so 3-year-olds finish.
