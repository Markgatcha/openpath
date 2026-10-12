# Curriculum & Content Research

*What to teach, what the evidence says, and how it shapes OpenPath's roadmap.*
Research conducted 2026-10-12. Sources listed at the end.

---

## TL;DR for product decisions

1. **A handful of subjects carry most of the learning.** Six fields account for ~58% of US bachelor's degrees (business, health, social sciences/history, psychology, biological sciences, engineering). Tier-1 content there reaches more learners than the entire long tail combined.
2. **The evidence base is loud and consistent:** retrieval practice + spacing have the strongest, most durable effects; gamification has a *moderate* positive effect (meta-analytic g ≈ 0.5). OpenPath's design already bets on both — this research says double down on retrieval (quizzes/flashcards), keep gamification as the engagement wrapper, and add spaced repetition next.
3. **The "figure question" idea is proven, not novel — and that's good.** IMathAS (open source) powers MyOpenMath/WAMAP/Lumen OHM with randomized parametric questions; GeoGebra ships feedback-driven question generators; STACK does CAS-graded math in Moodle. Nobody has combined parametric figures + a polished gamified student experience + a teacher-friendly editor. That's OpenPath's opening.
4. **Homework assignment with due dates is the missing workflow** in every gamified-quiz tool (Kahoot/Quizizz/Blooket are game shells, not LMSs; LMSs are not games). Assignments are the bridge to real classroom adoption.

---

## 1. The topic map

### 1.1 Where the learners are

Of ~2.0M US bachelor's degrees conferred (2021–22), **~58% concentrated in six fields**: Business, Health professions, Social sciences & history, Psychology, Biological sciences, Engineering. Extending to the top ten adds Computer & information sciences, Visual & performing arts, Education, and Communication & journalism (NCES/Coursera compilations).

### 1.2 The courses that matter most (Tier 1)

These are the highest-enrollment, most cross-listed, highest-stakes introductory courses — the "gateway" and gen-ed staple list. Every OpenPath user is likely to touch several of these:

| Cluster | Flagship courses | Notes |
|---|---|---|
| **Quantitative reasoning** | College Algebra, Precalculus, Calculus I, Intro Statistics | Calculus I is the documented STEM gatekeeper: high failure/withdrawal rates drive first-two-year attrition |
| **Life sciences** | Intro Biology, Anatomy & Physiology, Genetics | A&P is one of the largest single courses in US higher ed |
| **Physical sciences** | General Chemistry I/II, Physics I (algebra-based) | Lab + lecture split is natural for two-part content |
| **Social sciences** | Intro Psychology, Principles of Micro/Macro Economics, Intro Sociology, US History | Intro Psych is perennially among the largest enrolled courses anywhere |
| **Business core** | Financial Accounting, Principles of Management, Marketing, Intro Finance | Largest degree field overall |
| **Communication** | English Composition I/II, Public Speaking | Universal gen-ed requirement |
| **Computing** | CS1 (Python/Java), Intro to IT, Web basics | Fastest-growing enrollment band |
| **Health prep** | Anatomy & Physiology, Microbiology, Nutrition | For nursing/allied-health pipelines |

### 1.3 Tiering strategy

- **Tier 1 (build first):** the table above. Aim for 3–6 polished quiz sets per flagship course — enough for a full chapter of practice.
- **Tier 2 (next):** second courses in each sequence (Calc II, Orgo, Physics II), plus world languages (intro vocabulary/sets) and study-skills content.
- **Tier 3 (scale by community):** everything else. Provide the *format* (question packs), not the content: a community pack registry where teachers publish/share sets under CC-BY. OpenPath should never pretend to own "every topic" — it should make authoring every topic trivial.

**Design rule:** every premade pack ships with (a) topic-tagged questions, (b) at least one game-ified loop, (c) an explanation per question. Premade content is the top-of-funnel; the editor is the retention.

---

## 2. The evidence base

### 2.1 Gamification: real but moderate

Multiple recent meta-analyses converge:

- **Studies in Higher Education (2025):** gamified learning shows a moderate positive effect on student outcomes vs. non-gamified instruction (**g ≈ 0.515**).
- **SAGE Open (2026):** motivation and deep-learning gains, with the caveat that effects are **context-specific and theory-driven** — bolted-on points/badges underperform well-designed systems.
- **Studies in Higher Education multilevel meta-analysis (2024):** effect sizes vary by **which game elements** are combined — social comparison + goals + feedback beats points alone.
- **Educational Technology Research & Development (2025):** element-level analysis of what drives engagement.

**Implications for OpenPath:**
- Keep XP/levels/badges/streaks — but our leaderboards (social comparison) and immediate explanatory feedback (feedback loop) are the elements the research singles out. Lean into them.
- Watch for over-justification effects: gamification should wrap retrieval, never replace it.
- The parent/teacher dashboards are a differentiator no consumer quiz game has — they serve the "theory-driven, context-specific" advice directly.

### 2.2 Retrieval practice & spacing: the strongest tools we have

The *Nature Reviews Psychology* (2022) review on spacing and retrieval practice documents robust, durable improvements in long-term retention — consistently larger and more reliable than gamification effects, and they compound with each other.

**Implications:** the flashcard drill exists but is decorative today. Spaced repetition (due-queue on the dashboard, SM-2-lite scheduling) is the single highest-value learning feature we can add. Roadmap already lists it first; this research says keep it first.

### 2.3 Gateway-course pain is real and addressable

Calculus I is a documented high-failure gatekeeper for STEM attrition, and most STEM attrition happens in the first two years. Targeted practice (worked examples + retrieval) in gateway courses is where a free, local, unlimited-practice tool does the most good. Tier-1 weighting reflects this.

### 2.4 Mastery learning (context)

Bloom's mastery-learning program (~2σ with 1:1 tutoring, unattainable at scale) motivates **mastery-based progression**: unit quizzes with "must demonstrate proficiency to advance," instant explanatory feedback, and unlimited retakes — all achievable in software at zero marginal cost. OpenPath's retake-friendly design already aligns; a future "mastery gate" mode would complete it.

---

## 3. Landscape & the opening

| Tool | What it is | Gap OpenPath fills |
|---|---|---|
| **Kahoot** | Live trivia game shows | Async homework, persistent progress, teacher analytics |
| **Quizizz / Wayground** | Async gamified quizzes | Local-first/privacy, parametric figure questions, parent visibility |
| **Blooket / Gimkit** | K-12 game modes | College-level content depth, real assessment integrity |
| **Quizlet** | Flashcard sets | Assessment, gamified loops, teacher workflow |
| **GeoGebra** | Interactive math figures + auto-generated quiz questions | Gamified student UX, parent insight, non-math content |
| **IMathAS** | Open-source parametric math assessment (powers MyOpenMath, WAMAP, Lumen OHM) | Modern UX, gamification, multi-subject, parent dashboards |
| **STACK (Moodle)** | CAS-graded math questions | Not a game, heavy LMS dependency |
| **Canvas / Moodle / Blackboard** | LMSs (Canvas dominates US higher-ed adoption) | Engagement; OpenPath can be the *practice layer* alongside an LMS (import/export is the bridge — already on the roadmap) |

**The opening:** nobody combines (a) parametric, auto-graded figure questions, (b) a genuinely fun student loop with combos/badges/leaderboards, (c) a teacher editor that makes authoring those questions point-and-click, and (d) local-first privacy with parent insight. That's the wedge.

---

## 4. Feature spec: figure & equation questions

The vision from the roadmap conversation: *"a triangle where the student figures out one of the sides; the teacher picks or authors the equation."* Proposed design:

### 4.1 Question type: `figure`

A figure question has three parts: **a generator** (teacher-defined), **a prompt** (what's asked), and **an answer key** (computed, never typed by hand).

```
FigureQuestion {
  template: 'triangle' | 'right-triangle' | 'circle' | 'trapezoid' | 'polygon' | 'line'
  givens:    { sides?: number[], angles?: number[], radius?: number, ... }
  ask:       'side' | 'angle' | 'area' | 'perimeter' | 'hypotenuse' | 'equation'
  rounding:  'integer' | 'tenth' | 'hundredth'
  tolerance: number          // e.g. 0.05
}
```

**How it plays:** the student sees an SVG figure with givens labeled (derived from the template + givens), reads the prompt, and answers. Grading is numeric-with-tolerance on the server — the answer key is computed by the same geometry functions that draw the figure, so **the teacher can never mistype an answer**, and typo-proofing is free.

### 4.2 Teacher authoring (the point-and-click version)

1. Pick a template (e.g. "Triangle — SAS").
2. Enter givens (e.g. `a = 5, b = 7, C = 40°`) — the editor live-validates (triangle inequality, angle sums) and previews the figure.
3. Pick what to ask: `c = ?` → the editor shows the computed answer (`c ≈ 5.36` via law of cosines) as a sanity check, then hides it from students.
4. Optionally set ranges instead of fixed values (`a ∈ [3,9]`) → every student gets a **different randomized variant** — the IMathAS trick, with a modern editor.
5. Or switch to "custom equation" mode: write the relationship once (`c² = a² + b² − 2ab·cos(C)` or pick from a formula library) and the same pipeline computes keys.

### 4.3 Grading variants

- **Numeric answer** with tolerance + rounding (default).
- **MCQ** generated from plausible distractors (±common-error variants: law-of-sines vs law-of-cosines mixups) — great for "which method solves this?" concept checks.
- **Equation mode**: student selects/derives the method, figure provides the numbers — assesses *choosing* the tool, not just arithmetic.

### 4.4 Rollout

- **v1:** templates `triangle` (SSS/SAS/ASA), `right-triangle` (Pythagorean + SOH-CAH-TOA), `circle` (area/circumference/arc), `trapezoid` — fixed givens, numeric + MCQ grading.
- **v2:** parameter ranges → per-student randomized variants.
- **v3:** custom formula mode with a shared formula library; community-contributed templates.

Prior art to study before building: GeoGebra's question-generator applets, IMathAS's question library format (importable!), STACK's CAS grading.

---

## 5. Assignments & the teacher workflow

The gap analysis is unanimous: game tools don't assign, LMSs don't engage. Minimum viable assignment layer:

- **Assign** any quiz/pack to a classroom or individual students with **due date**, optional **time window**, and **max attempts**.
- Student dashboard shows a **Due soon** queue; parent dashboard shows completion status.
- Teacher view: completion roster, who's late, average score on assignment.
- Grade pass-back (CSV export; LTI later) is the bridge for real classrooms.

Research note: assignment deadlines are a *spacing* mechanism — they force distributed practice, which §2.2 says is where the durable learning comes from.

---

## 6. Premade content plan (concrete, tiered)

| Pack | Course | Contents |
|---|---|---|
| `college-algebra-essentials` | College Algebra | Linear/quadratic/exponential review, function notation, word problems |
| `geometry-figures` | Geometry | The figure templates from §4 (SAS triangle, right-triangle trig, circles) |
| `calculus-i-gateway` | Calculus I | Limits intuition, derivative rules, related rates basics — targets the documented gatekeeper failure modes |
| `intro-stats-core` | Intro Statistics | Distributions, z-scores, hypothesis-testing vocabulary, correlation vs causation |
| `intro-psych-survey` | Intro Psychology | Classic studies, research methods, memory/learning units (pairs with §2.2!) |
| `principles-econ` | Micro/Macro | Supply/demand graphs (reuse the figure renderer for line graphs), elasticity, GDP basics |
| `gen-chem-foundations` | General Chemistry I | Stoichiometry, periodic trends, mole concept (parametric numeric questions) |
| `cs1-python-basics` | CS1 | Types, control flow, functions — code-tracing questions |
| `english-comp-mechanics` | English Comp | Grammar/usage drills, argument structure |
| `study-skills-lab` | All | Retrieval-practice and spaced-repetition *how-to* (dogfooding the science) |

Each pack: 20–40 questions, topic-tagged, explanations included, licensed CC-BY.

---

## 7. Recommended roadmap order

1. **Spaced repetition for flashcards** (strongest evidence × smallest build).
2. **Figure questions v1** (the differentiator; templates + numeric grading + MCQ distractors).
3. **Assignments with due dates** (classroom adoption unlock; spacing mechanism).
4. **Premade pack registry + the first 3 packs** (`geometry-figures`, `calculus-i-gateway`, `intro-psych-survey`).
5. **Live race mode** (Kahoot-style synchronous play) — engagement top-ups for class time.
6. **CSV/QTI import-export** (LMS bridge).
7. **Figure questions v2** (randomized variants per student).
8. **Mastery-gate mode** (proficiency-based progression).

---

## Sources

- NCES, *Fast Facts: Most common undergraduate fields of study* — https://nces.ed.gov/fastfacts/display.asp?id=37
- NCES, *Undergraduate Degree Fields* (Condition of Education) — https://nces.ed.gov/programs/coe/indicator/cta
- Studies in Higher Education (2025), gamification meta-analysis (g ≈ 0.515) — via Ingenta Connect
- SAGE Open (2026), *Gamification Effect: Enhancing Student Learning Outcomes in Higher Education* — https://journals.sagepub.com/doi/full/10.1177/21582440261421375
- Studies in Higher Education (2024), multilevel meta-analysis of game-element combinations — https://www.tandfonline.com/doi/full/10.1080/03075079.2024.2416498
- Educational Technology Research & Development (2025), game-element meta-analysis — https://link.springer.com/article/10.1007/s11423-025-10493-y
- *Nature Reviews Psychology* (2022), *The science of effective learning with spacing and retrieval practice* — https://www.nature.com/articles/s44159-022-00089-1
- ASEE (Predictors for Success in Calculus I) + *International Journal of STEM Education* / Springer (2026) on calculus attrition
- Kahoot vs Quizizz vs Blooket / Gimkit comparison guides (2026)
- IMathAS — https://www.imathas.com/ (powers MyOpenMath, WAMAP, Lumen OHM)
- GeoGebra quiz question generators with feedback — https://www.geogebra.org/m/n24Mj5F3
- STACK (Moodle computer-aided assessment) — community documentation
