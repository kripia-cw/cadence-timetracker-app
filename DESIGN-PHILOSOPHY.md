# Cadence — Design Philosophy

This document explains *why* the app looks and works the way it does. It sits above the rules framework (`rules-framework.md`) and the token system (`design-tokens.md`). Before changing anything about the way the app feels, read this first.

---

## Why this app exists

Every other time tracker is built like a database form. They assume you'll open a browser tab, click through a cluttered dashboard, pick a project from a dropdown, and then get back to work. They're designed for reporting, not for the person doing the work.

Clockify in particular: too many fields, too much cognitive load, not pinned to the screen, no ambient presence, no atmosphere — just a grey box you have to remember to open. That's why this app was built.

Cadence is a time tracker that lives *with* you. It sits docked to the edge of your screen, always on top, always there. It has a clock. It has quotes. It has themes that make it feel like a place. The goal was never just to log time — it was to build something worth looking at and worth using.

---

## The north star

> **"Something you want to use."**

Every design decision should be measured against this. Not just functional. Not just fast. *Desirable.*

If a feature makes the app feel like a chore, it's wrong. If a change makes it feel more alive or more satisfying to interact with, it's right.

---

## Three pillars

### 1. Always present, never intrusive

The app is pinned to the side of the screen all day. That means it has to earn its place — it cannot be noisy, demanding, or cluttered. The correct default state is calm: clock ticking, quote showing, ready to accept input the moment you need it.

**What this means in practice:**
- The panel is narrow (200px default) and unobtrusive
- Nothing should animate or flash without reason
- Empty states are quiet — a small message, not a call-to-action
- Notifications and toasts are brief and self-dismissing

### 2. Atmospheric identity

The clock, quotes, and themes are not decorative add-ons. They are the primary differentiator from every other time tracker. They are the reason this app feels worth having open all day.

**What this means in practice:**
- The scene/wallpaper background should always feel considered — no ugly tiling, no jarring colours
- The clock should feel central and legible, not tucked away
- Quotes should feel intentional — they exist to make the work feel meaningful
- Each theme should feel like a coherent world, not just a palette swap
- **Never strip these out to "simplify" the app — they are the product**

### 3. Minimum viable thought

The single biggest failure mode of time tracking software is requiring too much thought to use. If logging an entry takes more than 10 seconds, the user will start delaying it, then batching it, then forgetting it.

**What this means in practice:**
- Auto-suggest learns from history and fills in category and sub-category automatically — this should be fast and reliable
- Optional fields (notes, second tag, sub-category) should not dominate the form — they're there when needed, not in the way when not
- The most common action ("Add entry") is the first thing visible — no scrolling to submit
- Future: proactive nudges when time has passed without logging, so the user doesn't have to remember

---

## What "too much thinking" looks like

These are the specific failure modes to watch for. Any new feature should be reviewed against this list:

| Symptom | What it means |
|---|---|
| More than one "primary" action visible at once | The user doesn't know what to do first |
| A field that is always empty but always visible | It's demanding attention it doesn't deserve |
| A confirmation that says "Are you sure?" | The user has to read the body text to understand what they're confirming |
| A dropdown that shows 20 options before filtering | The user has to think about where the right option is |
| An error message that says "Invalid input" | The user doesn't know what to fix |
| A button that says "OK" | The user doesn't know what will happen when they click it |

---

## The form complexity principle

The Log tab form has many fields. Not all of them are equally important. The hierarchy is:

**Always required:**
- Description — what you worked on
- Start time and End time — when

**Usually useful:**
- Category — how to group it in reports

**Optional, contextual:**
- Sub-category — finer grouping, only useful if you care about that level of detail
- Notes — context that won't fit in the description
- Tag 1, Tag 2 — additional metadata

**The rule:** The form should feel like a fast two-field entry by default (description + time), with the optional fields available but not demanding attention. Any future redesign of the Log tab should respect this hierarchy.

---

## Themes

The app has five themes: Space, Sakura, Woodland, Aurora, Castle.

Each one is a *world*, not just a colour scheme. The names describe a place or feeling, not a colour. The background scene should reinforce that feeling.

**Design standard for themes:**
- Every theme must be legible — text must be readable, inputs must be usable, buttons must be clickable
- Every theme must feel coherent — the surface colour, accent, and scene background should feel like they belong together
- Dark themes (Space, Woodland, Aurora, Castle) share similar contrast assumptions — light text on dark surfaces
- **Sakura is the exception** — it is the only light-surface theme, and requires independent contrast verification for every element. Elements that assume a dark background will fail in Sakura.

**Sakura specifically:**
Sakura is the most delicate theme and currently has known issues. The light cream surface (`rgba(238,205,193,0.90)`) interacts badly with:
- Backdrop-filter blur effects that are calibrated for dark surfaces — they appear harshly dark against the light background
- Font colours inherited from dark-theme assumptions — some text disappears or clashes
- Elements with semi-transparent dark overlays designed for dark panels — they look like smudges on Sakura

These need to be fixed before Sakura is considered stable.

---

## What this app is not

To keep scope clear:

- **Not a project management tool** — no tasks, no deadlines, no team collaboration
- **Not a billing tool** (though you can export and use the data for that) — invoicing is not in scope
- **Not a web app** — the desktop-first, always-on-top experience is fundamental. A web version would lose the ambient presence entirely.
- **Not a dashboard** — the Reports tab exists to give useful insight, not to drown the user in charts

---

## Future direction

These are the known gaps between the current app and the north star. In priority order:

1. **Sakura theme fix** — contrast and blur issues make it unusable in its current state for some elements
2. **Proactive logging nudges** — the single biggest friction point remaining is forgetting to log. A gentle, non-intrusive prompt when significant time passes without an entry would close this gap.
3. **Form field progressive disclosure** — the optional fields (notes, second tag) should be collapsible or hidden by default to make the fast-entry experience faster
4. **Weekly average in Reports** — hours per day average in the weekly view so the user doesn't have to calculate it mentally
5. **OneNote/Outlook-style screen docking** — the app currently snaps to the screen edge but does not dock the way OneNote or the Outlook calendar do (pushing other windows aside rather than overlapping them). An experiment was attempted (`timetracker-dock-experiment/`) but not completed. This requires using the Windows taskbar/shell APIs, which is non-trivial in Electron. Worth revisiting once the core rebuild is stable.
5. **Email reports** — a weekly summary delivered to your inbox so you don't have to open the app to get a picture of your week
