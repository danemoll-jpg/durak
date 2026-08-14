# Durak 🃏

A web version of **Durak** — the Russian card game where nobody wins so much as *someone loses*
— with snarky AI bots to learn against, and real online play against a friend via a shared
room code.

Includes:
- A full **Podkidnoy** ("throw-in") rules engine, 36-card deck, 2-4 players — any mix of
  humans and bots online (e.g. 2 humans + 2 bots), capped at 2 bots since only two bot
  personalities exist today.
- **Heuristic AI bots** with two trash-talking personalities (Boris and Natasha).
- **Online play**: create a room, share the 4-letter code, and play a real match against
  someone else from anywhere — synced live via Firestore, no server to run or keep alive.
- A **"What should I play?" hint button** — powered by the exact same logic the bots use, so
  it never suggests an illegal move.
- **Snarky commentary** that reacts to what's happening at the table.
- **Sound effects** — synthesized in the browser via the Web Audio API (no audio files to
  ship), for dealing, throwing/defending cards, taking the pile, and the game-over
  fanfare/trombone. Mute anytime with the 🔊 button, top-right.

## Quick start

```bash
npm install
npm run dev
```

That builds the shared game engine, then starts the Vite dev server for the client (no
separate backend process — the app is a pure static site). The terminal will print the URL —
Vite defaults to `http://localhost:5173`, but picks the next free port (5174, 5175, …) if
that one's taken.

Local (vs-bots) play works immediately with zero setup. Online play needs the Firebase
project config filled into `packages/client/src/network/firebase.ts` first — see "Deploying"
below; until then, "Play online" will fail to create/join a room.

### Tests

```bash
npm run test
```

Runs the engine's test suite, including simulated full games (bots playing bots, hundreds of
random deals across 2/3/4-player tables) that assert all 36 cards are conserved at every step
and every game terminates in a valid result.

## How to play (short version)

- Lowest trump card goes first, attacking the player to their left.
- Beat an attack card with a higher card of the same suit, or any trump card.
- Can't beat it? Take the whole pile into your hand.
- Beat it, and anyone still in the round can toss in more cards of a rank already on the
  table (up to 6 cards, or the defender's hand size, whichever is smaller).
- After each round everyone refills back up to 6 cards, lowest-numbered seat first, defender
  last.
- Once the deck is empty, the first players to empty their hand are safe. Whoever is left
  holding cards when everyone else is empty-handed is the **Durak** — the fool.

Click **"What should I play?"** any time it's your turn if you want a suggested move and why.

## Project structure

```
packages/
  engine/   Pure game logic — rules, state machine, bot strategy, hints, commentary.
            No UI or network dependencies; fully unit-tested (vitest).
  client/   React + Vite UI. No backend of its own:
            - Local (vs-bots) play runs the engine directly in the browser
              (src/hooks/useLocalGame.ts).
            - Online play syncs through a shared Firestore document
              (src/network/, src/hooks/useOnlineRoom.ts).
```

The engine is deliberately framework-free so the exact same "what moves are legal right now"
and "what's the best move" logic is shared by local play, online play, the bots, and the
human hint feature — a hint can never suggest something illegal, and a bot can never cheat.

## How online play is synced

There's no custom backend — both players' browsers talk directly to a shared Firestore
document at `rooms/{code}` (same approach as the author's other project, Par Five):

- **Single writer per turn**: whoever's turn it is computes their move locally with the same
  engine code as local play, then writes the resulting state to the room. Everyone else's
  live subscription picks it up.
- **Only the host's browser drives bot turns** (if a bot is filling the third seat) — avoids
  two clients racing to step the same bot move. This means the host needs to stay connected
  for bot turns to happen; a bot-free 2-human room has no such dependency mid-game.
- **Sound cues** are deterministic given the event log, so every client re-derives and plays
  them independently — no sync needed. **Commentary** is randomized (which bot speaks, which
  canned line), so it's computed once by whoever wrote the move and shared via the room doc,
  so both players see the same trash talk.

### Hand privacy

Durak has real hidden information (each player's hand) — unlike a dice game, where a shared
public document has nothing to hide. The room document holds the *full* authoritative game
state, including every hand, because that's what both browsers need to sync the game. The UI
never shows you anything but your own hand and opponents' card counts, but a player who
opened their browser's dev tools and read the raw Firestore document could technically see
the other hand. There's no Auth/Cloud-Functions-based redaction in place — this is a known,
accepted tradeoff for a casual game against a friend, not a competitive-integrity guarantee.
See `firestore.rules` for the same caveat in the security-rules comments.

## Deploying

1. **Firebase**: create a project at [console.firebase.google.com](https://console.firebase.google.com),
   enable **Firestore** (Standard edition). In Project Settings → General → Your apps, add a
   Web app and copy its config object into `packages/client/src/network/firebase.ts`. Then
   paste this repo's `firestore.rules` into Firestore → Rules → Publish.
2. **Build**: `npm run build` (root) builds the engine, then the client to
   `packages/client/dist`.
3. **Host the static build** anywhere that serves static files — Netlify, Vercel, GitHub
   Pages, Cloudflare Pages, etc. all work with zero server-side config since this is a plain
   static site. For Netlify specifically: "Import from Git", build command
   `npm install && npm run build`, publish directory `packages/client/dist`.

No environment variables are needed at build time — the Firebase web config isn't a secret
(access control is enforced by `firestore.rules`, not by hiding the config), so it's just
committed directly in `firebase.ts`.

## Extending this later

- **Claude-powered commentary**: bot trash talk currently comes from `TemplateCommentaryProvider`
  (`packages/engine/src/commentary/templateProvider.ts`), which picks randomized canned lines
  — no API key, no network calls. It implements the `CommentaryProvider` interface
  (`packages/engine/src/commentary/types.ts`); a `ClaudeCommentaryProvider` implementing that
  same interface (calling the Claude API, e.g. Haiku, with the game event as context) can be
  swapped in wherever `new TemplateCommentaryProvider()` is currently constructed
  (`useLocalGame.ts`, `useOnlineRoom.ts`), with no changes to game logic.
  See [claude.com/platform/api](https://claude.com/platform/api) for API keys.
- **More bot personalities / bigger tables**: add entries to `PERSONALITIES` in
  `packages/engine/src/commentary/personalities.ts` and to `BOT_PERSONALITIES`/
  `BOT_DISPLAY_NAMES` in `packages/client/src/lib/players.ts`, then raise `MAX_SEATS` in that
  same file past 4 if you want more than 4 seats total (the engine itself isn't tested past 4
  players, though nothing in its logic is hardcoded to a player count).
- **Perevodnoy ("passing") rules**: the current engine only implements Podkidnoy. Passing an
  attack sideways instead of defending it would be a targeted addition to
  `packages/engine/src/gameEngine.ts`'s defend handling — the rest of the engine (dealing,
  throw-ins, refills, win detection) stays the same.
- **Real access control on rooms**: swap the "anyone with the code can read/write" Firestore
  rules for Firebase Auth + Cloud Functions doing the actual writes server-side, if this ever
  needs to be trustworthy for strangers rather than just a friend.

## A couple of simplifications versus tournament rules

- Once a defender declares "take," no further cards can be thrown in (some house rules allow
  one last round of throw-ins before the pile is collected).
- Only Podkidnoy is implemented; see above for adding Perevodnoy.

Neither affects how the game is won or lost — just some fairly minor throw-in timing.
