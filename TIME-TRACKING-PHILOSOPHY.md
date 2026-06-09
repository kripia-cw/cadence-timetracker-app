# Time Tracking Philosophy & Framework

> This document explains *why* the time tracking system is designed the way it is,
> and *what* the framework is trying to reveal. Read this before changing categories.

---

## Why we track time

Time is the only genuinely finite resource. You can get more money, more people, more
tools — but you cannot manufacture more hours. So tracking time isn't really about
tracking time. It's about **seeing reality clearly**, because humans are systematically
wrong about where their time goes. We think we spend 20% on something. It's 40%.

The system exists to replace gut feel with reality.

---

## The six principles

### 1. Self-awareness over self-perception
The purpose is to see what's actually happening, not to confirm what you think is
happening. If the data surprises you, that's the system working.

### 2. Drift detection
In a small company, in a role you're partly defining yourself, your job can quietly
become something you didn't intend — usually toward reactive firefighting and away from
proactive, high-value work. Without data, you won't notice until you're months deep.
The system should make drift impossible to miss.

### 3. Make invisible work legible
Coordination, context-switching, reading, thinking, chasing people for information —
these are real work that produce no obvious artifact and are easy to dismiss. They need
a home in the system so they show up in the record and can be reasoned about.

### 4. Data should provoke questions, not just answer them
A well-designed framework makes you go "huh, why is that?" — not just confirm what you
already knew. The goal is to surface patterns that lead to action: reduce, automate,
delegate, protect, escalate, or change.

### 5. Granularity should match decision-making
You don't need to know you spent 47 minutes vs 53 minutes. You need granularity at the
level where a different number would change a decision. "Meetings took 30% of my week"
→ that's a decision. "CA Phase 2 coordination took 8 hours and it was mostly chasing
missing spec details" → that's a decision about process, about workflow, about whether
the right person is doing that chasing.

### 6. Distinguish reactive from proactive
Reactive work responds to things that come to you. Proactive work is things you initiate
and plan. Over time, if reactive grows and proactive shrinks, you are losing agency over
your own role. This split should be visible at a glance.

---

## What good data lets you ask

### Workload & sustainability
- Am I consistently working overtime, and when does it cluster? End of sprint? Support spikes?
- When a project is intense, what's actually getting squeezed out — learning? Docs? Thinking time?
- What's my ratio of reactive to proactive work? Is it getting worse over time?

### Delegation & automation
- Which tasks am I doing repeatedly that are below my level?
- Which support ticket *types* keep recurring — and should be fixed in the product, documented, or handled by someone else?
- Which recurring tasks are manual but obviously automatable?

### Priority calibration
- Does how I actually spend my time match what I and my manager think my priorities are?
- Am I drifting — more support person, less product coordinator?
- Is professional development actually happening, or does it collapse whenever a project gets intense?

### Project & organisational health
- Is coordination overhead on a project growing? That's a signal something's wrong with how it's run.
- Are support tickets increasing month on month? That's a product quality signal.
- Which meetings are producing outcomes vs just taking time?
- Which people generate the most coordination load?

### Opportunities
- Where are there patterns that suggest a process improvement would save hours a week?
- What does my week look like when I'm at my best vs when I'm overwhelmed? What's different?
- Are there categories of work that never appear — things I should be doing but aren't?

---

## The framework architecture

The system uses three layers to capture different dimensions of work:

| Layer | Purpose | Example |
|---|---|---|
| **Category** | The *nature* of the work — what kind of thing it is | Reactive, Growth, Meetings |
| **Sub-category** | Specific enough to spot delegation/automation opportunities | Bug Investigation, Inbox Triage, ECWIP |
| **Tag** | The *project or area* context — cuts across categories | `CA Phase 2`, `CMS`, `ECWIP` |
| **Description** | What actually happened, in plain human language | "Investigated tooltip bug — can't reproduce locally" |
| **Notes** | Ticket numbers, links, specifics for the record | CWS067, SharePoint folder links |

### Why this separation matters

A CA Phase 2 standup is logged as:
- Category: **Meetings** → Sub-cat: **Project Meeting** → Tag: `CA Phase 2`

Not as "CA Phase 2 > Meeting" — because that would make it invisible in the Meetings
total. You want to be able to ask both:
- *"How much of my week is meetings?"* (Category lens)
- *"How much total time did CA Phase 2 cost this week, including meetings?"* (Tag lens)

These are different questions with different implications. The architecture answers both.

---

## The categories

Each category is designed so that a pattern in it points to a specific type of action.

### Reactive
**When high:** Firefighting, product quality problems, role drift, process gaps — something structural needs to change.
**When low:** Good. You're mostly proactive.
**The question it raises:** Is this work at my level, or should it be delegated/automated/systematised?

Sub-categories:
- **Bug Investigation** — skilled, can't easily delegate, signals product quality
- **Client Admin** — low-skill, prime delegation/automation target
- **IT Liaison** — coordination-heavy, could be streamlined
- **Inbox Triage** — could be batched, partially systematised
- **Unplanned Comms** — invisible work made visible

---

### Project Delivery
**When high:** Good — you're moving things forward.
**When low:** Reactive and overhead are eating your week.
**The question it raises:** Are we actually progressing or just maintaining?

Sub-categories:
- **CA Phase 2**
- **CMS Project**
- **Controls Module**
- **Report Builder**
- **UAT & Testing**

---

### Meetings
**When high:** Meeting culture may be eating the week — drill into which sub-cats.
**When low:** Either meetings are efficient and well-run, or important conversations aren't happening.
**The question it raises:** Which of these meetings needs to exist? Which could be async?

Sub-categories:
- **Daily Standup**
- **1:1 with Andrew**
- **Project Meeting**
- **Company Meeting**
- **Ad Hoc** — when this is high, something is disorganised somewhere

---

### Coordination
**When high:** Projects may be poorly run, or you're the connective tissue holding too much together.
**When low:** Either things run smoothly, or this invisible work is going unlogged.
**The question it raises:** Am I the right person to be doing this coordination, and is this much of it necessary?

Sub-categories:
- **Board & Gantt**
- **Stakeholder Comms**
- **Process Planning**
- **Reporting & Presentations**

---

### Writing & Docs
**When high:** You're producing — creating things that outlast the moment.
**When low:** Output is being sacrificed for overhead. This has long-term compounding consequences.
**The question it raises:** Is the organisation capturing knowledge, or relying on people's heads?

Sub-categories:
- **Help Articles**
- **Specs & Design**
- **Internal Docs**
- **CMS Workflows**
- **Presentations**

---

### Security
**When consistent:** Good — this owned responsibility is being maintained.
**When missing:** 🚨 A real responsibility is being neglected.
**The question it raises:** Is this taking the right amount of time, or is it expanding/shrinking without reason?

Sub-categories:
- **Weekly Checks**
- **Asset Inventory**
- **Incident Response**
- **Security Improvements**

---

### Growth
**When consistent:** You're investing in yourself and building capability.
**When missing:** 🚨 This is the canary in the coal mine. When Growth disappears, everything else is eating you alive. If it's been zero for six weeks, that's not a coincidence — it's a structural problem with workload, priorities, or both. This is the number to watch.
**The question it raises:** Is the pace sustainable? Is the role developing you, or just consuming you?

Sub-categories:
- **ECWIP**
- **AI Tools Research**
- **Product Knowledge**
- **Code & Dev Tools**

---

### Break
**When consistent:** Good — recovery is real work and necessary.
**When missing:** You're not stopping. That's a problem, not a badge of honour.
**The question it raises:** Is the workload sustainable?

Sub-categories:
- **Break**
- **Lunch**
- **Personal Call** — tracked separately to spot disruption patterns, not lumped into Break

---

## The dual-axis view

The real power is filtering by both dimensions:

**Filter by tag: `CA Phase 2`**
→ Every hour on that project across ALL categories — meetings, delivery, coordination,
reactive support, docs. Total project cost, not just delivery time. Use this to ask:
is this project costing what we expected?

**Filter by category: Reactive**
→ Every reactive hour regardless of project. Month-on-month trend. Use this to ask:
is my role drifting toward firefighting?

**Watch Growth over time**
→ If it's consistently zero during crunch periods, that's your data for a conversation
about sustainable pace and what to protect.

**Watch Reactive vs Project Delivery ratio**
→ If Reactive grows month on month, something structural is wrong — in the product,
the process, or the team.

---

## What goes where (quick reference)

| Situation | Category | Sub-cat | Tag |
|---|---|---|---|
| Investigating a CWS bug | Reactive | Bug Investigation | `CA Phase 2` or relevant project |
| Making a client's users inactive | Reactive | Client Admin | — |
| Daily standup | Meetings | Daily Standup | `CA Phase 2` if it's a project standup |
| Updating the Gantt chart | Coordination | Board & Gantt | `CA Phase 2` |
| Writing a help article | Writing & Docs | Help Articles | relevant project tag |
| ECWIP study session | Growth | ECWIP | `ECWIP` |
| Weekly WatchTower checks | Security | Weekly Checks | — |
| Reviewing specs from David | Project Delivery | CA Phase 2 | `CA Phase 2` |
| UAT on infographic A | Project Delivery | UAT & Testing | `CA Phase 2` |
| Chiropractor appointment | Break | Personal Call | — |
| Eating lunch | Break | Lunch | — |

---

## A note on descriptions

Descriptions should be written in plain human language, as if explaining to yourself
in six months what you were doing and why it mattered. Not "CWS049" — that means
nothing without the system. Instead: *"Investigated legislation display bug — citation
rendering in wrong direction, likely a CMS HTML issue rather than product code."*

CWS ticket numbers and links belong in **Notes**, not descriptions. In ten years, with
thousands of tickets, descriptions need to be readable without a reference system.

---

*Last updated: June 2026*
