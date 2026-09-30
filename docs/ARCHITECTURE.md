# Architecture

## Layers

```
content (JSON + draw code)  →  engine (framework-free)  →  features (React screens)
                                        ↑
                               state (progress store + analytics)
```

- **content/** — everything a course teaches is data typed by `src/content/types.ts`.
  `registry.ts` globs `courses/*/index.ts`, so a new folder is a new course. Lecture
  narrations are code-split (`loadLecture`) because they are the largest files.
- **engine/** — no React:
  - `animation/stage.ts` builds the SVG scene of a mechanism animation once and
    redraws it for `(step, progress)`: camera (viewBox) moves, macro tissue overlay,
    split screens, numbered markers, particle bursts and HUD. Both the animation
    player and the lecture player drive it from their own `requestAnimationFrame`
    loop, so React never re-renders per frame.
  - `lecture/timing.ts` lays cues on a timeline. Cue length is the recorded audio
    duration when a manifest exists (and matches the narration version), else the
    generator's estimate; each cue carries its own pause (`gap`).
  - `speech/reading.ts` turns subtitle text into speech text (abbreviations, units,
    kana readings for misread terms, brackets → pauses). `speech/narrator.ts`
    implements `Narrator` for recorded audio and for Web Speech.
- **state/** — `ProgressStore` is a small observable with explicit actions
  (`answer`, `visit`, `addStudyTime`, `lectureProgress`, `animationProgress`,
  `finishReview`, …) consumed through `useSyncExternalStore`. Persistence is behind
  `ProgressRepository`; `analytics.ts` holds pure functions (accuracy by chapter /
  slide, weak themes, review set, today's plan, streak) that are unit-tested.

## Lecture player sync

The narration drives the clock:

1. entering a cue starts speaking it (recorded file or device voice)
2. while speaking, the timeline may not pass the cue end
3. if speech ends early, the clock skips to where the pause starts, then waits the
   cue's natural `gap` (shorter after a comma, longer between scenes)
4. auto-pause cues stop after their sentence and show a check card
5. without narration the clock just runs at the chosen speed

Visual layers (board / list / flow / table / slide / figure / animation) are React
components that highlight according to the current cue's `focus`; the ones that
move continuously (slide camera tour over the highlight boxes, figure zoom,
animation) register a per-frame callback through `FrameContext`.

## Persistence and a future backend

`LocalStorageRepository` stores one versioned JSON document per course
(`medstudy:progress:<course>:v1`), migrated on load. To add Supabase/Firebase:

```ts
class SupabaseRepository implements ProgressRepository {
  loadLocal(id) { return new LocalStorageRepository().loadLocal(id); } // instant first paint
  async loadRemote(id) { /* select progress where user_id = auth.uid() and course = id */ }
  async save(state) { /* upsert; keep the local write too for offline use */ }
}
```

and pass it to `new ProgressStore(...)` in `src/app/App.tsx`. Every answer is kept
as an event (`answers[]`), so server-side analytics can be rebuilt from history.
Settings → 「JSONを書き出す」 exports the same document.

## Design system

Tokens live in `src/styles/tokens.css`: the reference artifact's H&E palette
(hematoxylin `--hema*`, eosin `--eosin*`) with dark as default and a light theme
using the same roles. Animation / lecture stages use a fixed cinematic palette in
both themes. Fonts: Zen Kaku Gothic New (UI), Zen Old Mincho (textbook body),
Instrument Serif (numerals), Saira Condensed (HUD / kickers).
Touch targets are ≥ 44px; below 900px the top navigation becomes a bottom tab bar.
