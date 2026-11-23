import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'
import type { ContentPack } from './types'

// =============================================================================
// TIER-1 APPLIED CURRICULUM TRACKS (MIT-ORIGINAL)
// Tracks 17-20: CS1 Python Foundations, Intro Psychology, Personal Finance,
// Study Skills & Metacognition.
// Strictly authored original MIT content; structural inspiration only from
// Public Domain / CC-BY-4.0 resources (noted per pack).
// =============================================================================

// ── 17. CS1: PYTHON FOUNDATIONS ───────────────────────────────────────────────

const CS1_U1_LESSONS: PackLesson[] = [
  {
    id: 'cs1-l1-variables',
    unitId: 'cs1-u1-state-flow',
    title: 'Variables, Name Binding & State Evolution',
    summary: 'Trace how assignment binds names to values over time and avoid the algebraic equals-sign trap.',
    estimatedMinutes: 8,
    standards: ['CSTA 3A-AP-13', 'ACM CS2023 SDF-Fundamentals'],
    prerequisiteLessonIds: [],
    visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
    steps: [
      {
        id: 'cs1-l1-s1',
        kind: 'narrative',
        title: 'Assignment Moves Forward in Time',
        bodyMarkdown:
          'In algebra, `x = x + 1` is impossible—no number equals itself plus one. In Python, `=` means **bind the left-hand name to the value produced by evaluating the right-hand expression right now**.\n\nExecution flows top to bottom one line at a time, updating bindings step by step.',
        callout: {
          tone: 'pitfall',
          text: 'Changing a variable `x` after copying `y = x` updates only `x` for immutable numbers and strings—`y` still points to the old value.',
        },
      },
      {
        id: 'cs1-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Before Tracing State',
        predictionPrompt:
          'Suppose `a = 5`, `b = a`, and then `a = a + 3`. What is the value of `b` at the end?',
        predictionChoices: ['8, because b tracks a dynamically', '5, because b still refers to the object 5', '3, because a overwrote b'],
        correctPredictionIndex: 1,
        visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
        observeInstruction:
          'Watch the execution frames in the visualizer: inspect how each variable slot holds a direct binding rather than a live algebraic equation.',
        explainPrompt: 'Why did `b` remain `5` after `a = a + 3` executed?',
        explainOptions: [
          '`b = a` copied a reference to the value `5`; later `a = a + 3` rebound `a` to `8` without touching `b`.',
          'Python freezes variables after their first assignment.',
          'The `+` operator creates a temporary shadow variable named `b`.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Exactly: `b = a` reads what `a` currently holds (`5`). Rebinding `a` later redirects only the label `a` to the new integer `8`.',
      },
      {
        id: 'cs1-l1-s3',
        kind: 'worked-example',
        title: 'Build a Three-Line Swap Trace Table',
        problemMarkdown: 'Trace `left = 10`, `right = 25`, `temp = left`, `left = right`, `right = temp`.',
        steps: [
          {
            label: 'Line 1–2: Initialize',
            expressionOrAction: 'left -> 10, right -> 25',
            whyNote: 'Both names point to separate integer objects.',
          },
          {
            label: 'Line 3: Save `left` before overwriting',
            expressionOrAction: 'temp = left  # temp -> 10',
            whyNote: 'If we wrote `left = right` first, `10` would be lost before `right` could read it.',
          },
          {
            label: 'Line 4–5: Complete swap',
            expressionOrAction: 'left = right (25), right = temp (10)',
            whyNote: 'Reading right-hand side before assigning left-hand side prevents clobbering.',
          },
        ],
      },
      {
        id: 'cs1-l1-s4',
        kind: 'faded-practice',
        title: 'Complete the Trace Table',
        promptMarkdown: 'Given:\n```python\nscore = 12\nbonus = score * 2\nscore = score - 4\n```',
        completedSteps: ['After line 1: score = 12', 'After line 2: bonus = 24, score = 12'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'After line 3 executes, what is `bonus + score`?',
            correct: '32',
            alternatives: ['32.0'],
            points: 10,
            explanation: '`bonus` stays 24 while `score` becomes 12 − 4 = 8; 24 + 8 = 32.',
          },
        },
        misconceptionHints: {
          '40': 'Remember `bonus` does NOT recompute when `score` changes later.',
          '16': 'Check `bonus`: 12 * 2 = 24, and new `score` is 8.',
        },
      },
      {
        id: 'cs1-l1-s5',
        kind: 'checkpoint',
        title: 'Check In-Place Update',
        question: {
          type: 'mcq',
          prompt: 'Which sequence swaps integer variables `x` and `y` WITHOUT losing either value in standard Python?',
          options: [
            'x = y\ny = x',
            'temp = x\nx = y\ny = temp',
            'x + y = y + x',
            'y = temp\ntemp = x\nx = y',
          ],
          correct: 1,
          points: 10,
          explanation: 'Saving `x` in `temp` (or tuple unpacking `x, y = y, x`) preserves both values.',
        },
        misconceptionHints: {
          '0': 'Writing `x = y` first overwrites `x` before `y = x` can recover the old value.',
        },
      },
      {
        id: 'cs1-l1-s6',
        kind: 'synthesis',
        title: 'State Binding Takeaways',
        takeaways: [
          'Assignment evaluates the right-hand side completely before updating the left-hand binding.',
          'Primitive bindings do not auto-update downstream variables when re-assigned.',
          'Trace tables record one row per executed line so state surprises vanish.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'step-detective', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-bind',
        front: 'What does `=` mean in Python compared to mathematics?',
        back: 'Name binding (assignment): evaluate the right expression now and point the left variable name to the resulting object.',
        explanation: 'Unlike algebraic equality, `x = x + 1` is valid because Python computes old `x + 1` before rebinding `x`.',
        interleave: true,
      },
      {
        id: 'cs1-fc-swap',
        front: 'Why does `x = y; y = x` fail to swap two variables?',
        back: 'The first statement overwrites `x` with `y`’s value, erasing `x`’s original value before line 2 runs.',
        explanation: 'Use a temporary variable or Python tuple unpacking `x, y = y, x`.',
        interleave: true,
      },
      {
        id: 'cs1-fc-rebind',
        front: 'If `b = a` and later `a = 99` (for an integer), does `b` become `99`?',
        back: 'No — `b` continues pointing to the original integer object because integers are immutable and rebinding only redirects `a`.',
        explanation: 'Assignment redirects names; it does not link two variables by a live formula.',
        interleave: true,
      },
    ],
  },
  {
    id: 'cs1-l2-booleans',
    unitId: 'cs1-u1-state-flow',
    title: 'Boolean Expressions & Short-Circuit Guards',
    summary: 'Combine relational tests cleanly, rank `not` / `and` / `or` precedence, and structure non-overlapping `elif` chains.',
    estimatedMinutes: 9,
    standards: ['CSTA 3A-AP-15', 'AP CSP AAP-2.F'],
    prerequisiteLessonIds: ['cs1-l1-variables'],
    steps: [
      {
        id: 'cs1-l2-s1',
        kind: 'narrative',
        title: 'Branches Only Take the First True Gate',
        bodyMarkdown:
          'An `if / elif / else` chain acts like a water lock: Python evaluates conditions top-down and executes **at most one** branch—the very first condition that evaluates to `True`.\n\nBoolean operators follow strict precedence: **`not`** binds tightest, then **`and`**, then **`or`**.',
        callout: {
          tone: 'key-idea',
          text: 'Short-circuit evaluation stops `A and B` the moment `A` is `False`—which lets `count > 0 and total / count > 5` safely avoid dividing by zero.',
        },
      },
      {
        id: 'cs1-l2-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Short-Circuit & `elif` Ordering',
        predictionPrompt:
          'A grader checks `if score >= 60: grade = "D"` BEFORE `elif score >= 90: grade = "A"`. What grade does `score = 95` receive?',
        predictionChoices: ['"A"', '"D"', 'Both "D" and "A"'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 6, y1: 1, x2: 9, y2: 4 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Inspect score thresholds along the scaled 0–10 axis (`x = 6` for 60% vs `x = 9` for 90%). Because 9.5 satisfies `score >= 6` first, execution enters the first branch and skips every subsequent `elif`.',
        explainPrompt: 'How do you fix an inverted grade threshold chain?',
        explainOptions: [
          'Test the strictest upper bound (`score >= 90`) first and walk downward, or use independent `if` only when multiple branches should run.',
          'Replace `elif` with `while`.',
          'Put `else` at the very top of the block.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Descending thresholds ensure `95` matches `>= 90` first, while `75` falls past `>= 90` and `>= 80` to land cleanly in `>= 70`.',
      },
      {
        id: 'cs1-l2-s3',
        kind: 'worked-example',
        title: 'Safe Division With Short-Circuit `and`',
        problemMarkdown: 'Validate average quiz score without crashing when `n == 0`:',
        steps: [
          {
            label: 'Step 1: Guard left side',
            expressionOrAction: 'if n > 0 and (total / n) >= 80:',
            whyNote: 'When `n` is `0`, `n > 0` evaluates to `False`, so Python never evaluates `total / n`.',
          },
          {
            label: 'Step 2: Contrast wrong order',
            expressionOrAction: 'if (total / n) >= 80 and n > 0:  # ZeroDivisionError!',
            whyNote: 'Evaluating left-to-right hits division before the guard runs.',
          },
        ],
      },
      {
        id: 'cs1-l2-s4',
        kind: 'faded-practice',
        title: 'Evaluate Precedence Carefully',
        promptMarkdown: 'Let `is_member = False`, `age = 70`, `has_pass = True`. Evaluate:\n`is_member or age >= 65 and not has_pass`',
        completedSteps: [
          '1. `not has_pass` binds first -> `not True` is `False`.',
          '2. Next `and`: `(age >= 65) and False` -> `True and False` is `False`.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'What final Boolean value does `False or False` evaluate to?',
            options: ['True', 'False', 'TypeError', 'None'],
            correct: 1,
            points: 10,
            explanation: '`not` -> `and` -> `or` gives `False or (True and False)` = `False`.',
          },
        },
        misconceptionHints: {
          '0': 'Check operator precedence: `and` binds tighter than `or`, and `not has_pass` is `False`.',
        },
      },
      {
        id: 'cs1-l2-s5',
        kind: 'branching-scenario',
        title: 'Debug the Cinema Ticket Pricing Rule',
        startNodeId: 'triage',
        nodes: {
          triage: {
            promptMarkdown:
              'Users complain seniors (`age = 68`) are charged $14 instead of $9:\n```python\nif age < 12:\n    price = 8\nelif age >= 12:\n    price = 14\nelif age >= 65:\n    price = 9\n```',
            choices: [
              {
                label: 'Move `elif age >= 65: price = 9` ABOVE `elif age >= 12:`',
                nextNodeId: 'verify-edge',
                feedback: 'Strong fix! Every senior is also `>= 12`, so checking `>= 65` first routes seniors cleanly to $9.',
                outcome: 'optimal',
              },
              {
                label: 'Change `elif age >= 65:` to `if age >= 65:` while keeping order',
                nextNodeId: 'verify-independent',
                feedback: 'Wait: using separate `if` after `elif` only fixes seniors by accident, and creates fragile dual assignment.',
                outcome: 'suboptimal',
              },
              {
                label: 'Swap `price = 14` and `price = 8`',
                nextNodeId: 'triage',
                feedback: 'That breaks child pricing without addressing the unreachable `>= 65` branch.',
                outcome: 'unsafe',
              },
            ],
          },
          'verify-edge': {
            promptMarkdown: 'Now test boundary `age = 65` and `age = 12`. Which interval syntax makes the rule self-documenting too?',
            choices: [
              {
                label: 'Keep mutually exclusive descending checks (`< 12`, `>= 65`, `else: 14`)',
                nextNodeId: null,
                feedback: 'Clean, zero overlap, zero gaps—every age falls into exactly one branch!',
                outcome: 'optimal',
              },
            ],
          },
          'verify-independent': {
            promptMarkdown: 'Why is an ordered `if / elif / else` chain better than stacked `if` statements here?',
            choices: [
              {
                label: 'Mutually exclusive branches signal intent and guarantee only one price applies.',
                nextNodeId: null,
                feedback: 'Exactly—structural mutual exclusion prevents later edits from accidentally overriding earlier discounts.',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'cs1-l2-s6',
        kind: 'synthesis',
        title: 'Control-Flow Takeaways',
        takeaways: [
          'Precedence order is `not`, then `and`, then `or`; use parentheses whenever mixing `and` and `or`.',
          'Put guards (`x != 0`, `idx < len(a)`) on the LEFT of `and` to leverage short-circuiting.',
          'Order `elif` branches from most specific / strictest to broadest so upper bounds never shadow narrower cases.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'step-detective', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-precedence',
        front: 'What is Python Boolean operator precedence from highest to lowest?',
        back: '`not` (highest), then `and`, then `or` (lowest).',
        explanation: 'So `A or B and not C` parses as `A or (B and (not C))`.',
        interleave: true,
      },
      {
        id: 'cs1-fc-shortcircuit',
        front: 'When does `A and B` skip evaluating `B`?',
        back: 'Whenever `A` evaluates to `False` (or falsy), because the conjunction cannot be true.',
        explanation: 'This allows defensive bounds checks before indexing or division.',
        interleave: true,
      },
      {
        id: 'cs1-fc-elif-shadow',
        front: 'What causes an unreachable `elif` branch in numeric range checks?',
        back: 'An earlier `if`/`elif` condition whose set of true inputs completely contains the later condition.',
        explanation: 'Check stricter ranges (e.g., `>= 90` before `>= 60`) first.',
        interleave: true,
      },
    ],
  },
  {
    id: 'cs1-l3-iteration',
    unitId: 'cs1-u1-state-flow',
    title: 'Definite `for` Loops, `range()` & Accumulators',
    summary: 'Master half-open intervals `range(start, stop)`, loop invariants, and running accumulator variables.',
    estimatedMinutes: 8,
    standards: ['CSTA 3A-AP-15', 'AP CSP AAP-2.K'],
    prerequisiteLessonIds: ['cs1-l2-booleans'],
    steps: [
      {
        id: 'cs1-l3-s1',
        kind: 'narrative',
        title: 'Half-Open Intervals Eliminate Fencepost Bugs',
        bodyMarkdown:
          'Python’s `range(start, stop)` includes `start` and **excludes `stop`**. Because `[0, n)` has length exactly `n - 0 = n`, `for i in range(5):` runs `0, 1, 2, 3, 4`—matching 0-indexed lists seamlessly.\n\nTo total or count items, initialize an **accumulator** (`total = 0` or `best = items[0]`) *before* the loop, never inside it!',
        callout: {
          tone: 'pitfall',
          text: 'Resetting `total = 0` inside the loop body overwrites every previous iteration, leaving only the final item.',
        },
      },
      {
        id: 'cs1-l3-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Accumulator Steps',
        predictionPrompt: 'How many times does `for k in range(2, 10, 3):` execute its loop body?',
        predictionChoices: ['4 times (2, 5, 8, 11)', '3 times (2, 5, 8)', '2 times (2, 5)'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 2, x2: 3, y2: 11 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Notice slope `3` steps per iteration: `k = 2` (1st), `k = 5` (2nd), `k = 8` (3rd), and next `11 >= 10` stops BEFORE running.',
        explainPrompt: 'Why is `11` skipped by `range(2, 10, 3)`?',
        explainOptions: [
          'Iteration stops as soon as the value reaches or exceeds the exclusive `stop = 10` bound.',
          '`range` excludes every odd index.',
          'Python truncates step sizes larger than 2.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Half-open stops strictly before `10`: `2 < 10`, `5 < 10`, `8 < 10`, then `11` exits cleanly.',
      },
      {
        id: 'cs1-l3-s3',
        kind: 'worked-example',
        title: 'Trace a Running Product Without Initializing to 0',
        problemMarkdown: 'Compute `n!` for `n = 4` using `prod = 1`:',
        steps: [
          {
            label: 'Initialize identity element',
            expressionOrAction: 'prod = 1  # multiplicative identity, NOT 0',
            whyNote: 'Starting `prod = 0` would keep `0 * factor == 0` forever.',
          },
          {
            label: 'Include upper bound `n` via `n + 1`',
            expressionOrAction: 'for k in range(1, 4 + 1): prod *= k',
            whyNote: '`range(1, 5)` yields `1, 2, 3, 4` -> `1 -> 2 -> 6 -> 24`.',
          },
        ],
      },
      {
        id: 'cs1-l3-s4',
        kind: 'faded-practice',
        title: 'Fill the Counting Accumulator Trace',
        promptMarkdown:
          '```python\nevents = [3, 8, 2, 7, 10]\nodd_sum = 0\nfor v in events:\n    if v % 2 == 1:\n        odd_sum += v\n```',
        completedSteps: [
          'v=3 (odd) -> odd_sum = 3',
          'v=8 (even) -> skipped',
          'v=2 (even) -> skipped',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'After checking `v=7` and `v=10`, what is the final value of `odd_sum`?',
            correct: '10',
            alternatives: ['10.0'],
            points: 10,
            explanation: 'Only 3 and 7 satisfy `v % 2 == 1`, so `odd_sum = 3 + 7 = 10`.',
          },
        },
        misconceptionHints: {
          '2': 'Notice we add `v` (`odd_sum += v`), not `1` (`odd_sum += 1`).',
          '30': 'The `if` filter skips even values `8`, `2`, and `10`.',
        },
      },
      {
        id: 'cs1-l3-s5',
        kind: 'checkpoint',
        title: 'Assemble a Valid Loop Pattern',
        question: {
          type: 'order',
          prompt: 'Arrange these lines to count how many temperatures in `temps` exceed `30`:',
          options: [
            '    if t > 30:',
            'hot_days = 0',
            '        hot_days += 1',
            'for t in temps:',
          ],
          correct: [1, 3, 0, 2],
          points: 15,
          explanation: 'Initialize `hot_days = 0` outside the loop, iterate `temps`, test `t > 30`, and increment.',
        },
      },
      {
        id: 'cs1-l3-s6',
        kind: 'synthesis',
        title: 'Unit 1 Loop Takeaways',
        takeaways: [
          '`range(a, b)` covers `[a, b)`: length is `b - a` when step is `1`.',
          'Initialize sum accumulators to `0`, product accumulators to `1`, and extrema to `items[0]`.',
          'Always pass `n + 1` as stop if `n` itself must be visited.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'sequence-architect', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-range',
        front: 'Which integers does `range(1, 5)` generate in Python?',
        back: '`1, 2, 3, 4` (`start` is inclusive, `stop` is exclusive).',
        explanation: 'Half-open intervals ensure `range(n)` produces exactly `n` indices `0..n-1`.',
        interleave: true,
      },
      {
        id: 'cs1-fc-accum-init',
        front: 'Where must an accumulator like `total = 0` be initialized?',
        back: 'Before the loop begins—initializing inside the loop erases prior iterations.',
        explanation: 'Accumulators carry loop state across iterations.',
        interleave: true,
      },
      {
        id: 'cs1-fc-min-init',
        front: 'Why is initializing `best = 0` dangerous when finding the minimum of a list?',
        back: 'If every element in the list is positive (e.g., `[12, 19, 25]`), `best` wrongly stays `0` even though `0` is not in the list.',
        explanation: 'Initialize `best = nums[0]` (after guarding against empty lists).',
        interleave: true,
      },
    ],
  },
]

const CS1_U2_LESSONS: PackLesson[] = [
  {
    id: 'cs1-l4-functions',
    unitId: 'cs1-u2-functions-stack',
    title: 'Functions, `return` vs. `print()`, and Local Scope',
    summary: 'Separate pure computation (`return`) from console output (`print`), and trace independent function call frames.',
    estimatedMinutes: 9,
    standards: ['CSTA 3A-AP-17', 'AP CSP AAP-3.A'],
    prerequisiteLessonIds: ['cs1-l3-iteration'],
    visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
    steps: [
      {
        id: 'cs1-l4-s1',
        kind: 'narrative',
        title: '`print` Speaks to Humans; `return` Hands Data Back to Code',
        bodyMarkdown:
          'When a function uses `print(ans)` instead of `return ans`, it writes text to the screen and silently returns `None` to the caller—causing `total = add(2, 3) + 1` to raise `TypeError`.\n\nEach function call also allocates its own **local frame**: parameters and variables inside a function exist only while that frame is active.',
        callout: {
          tone: 'pitfall',
          text: 'Functions without a `return` statement—or those hitting the end without one—implicitly return `None`.',
        },
      },
      {
        id: 'cs1-l4-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Return Value When `print` Replaces `return`',
        predictionPrompt:
          'Suppose `def double(x): print(x * 2)`. What does `result = double(4)` store in `result`?',
        predictionChoices: ['8', 'None', '"8"'],
        correctPredictionIndex: 1,
        visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
        observeInstruction:
          'Inspect how each function call pushes a temporary stack frame onto the call stack and pops off once it returns a value to its caller.',
        explainPrompt: 'Why is `result` equal to `None` even though `8` appeared on screen?',
        explainOptions: [
          '`print()` displays output as a side effect and returns `None`; without `return x * 2`, `double(4)` defaults to returning `None`.',
          'Python deletes integer results once printed.',
          'Parameters cannot be multiplied inside `def`.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Seeing a number on the console never proves a function returned it. Always check for an explicit `return` before composing calls in expressions.',
      },
      {
        id: 'cs1-l4-s3',
        kind: 'worked-example',
        title: 'Trace Caller vs. Callee Frame Isolation',
        problemMarkdown: 'Trace:\n```python\nx = 10\ndef bump(x):\n    x = x + 5\n    return x\ny = bump(x)\n```',
        steps: [
          {
            label: 'Global frame creates x',
            expressionOrAction: 'global: x -> 10',
            whyNote: 'Caller has variable `x` in module scope.',
          },
          {
            label: 'Call `bump(10)` opens new frame',
            expressionOrAction: 'bump frame: local x -> 10 -> 15',
            whyNote: 'Local `x` shadows global `x`; rebinding local `x` leaves caller `x = 10` untouched.',
          },
          {
            label: 'Return pops frame',
            expressionOrAction: 'global: y -> 15, x stays 10',
            whyNote: 'Value `15` crosses back via `return` into `y`.',
          },
        ],
      },
      {
        id: 'cs1-l4-s4',
        kind: 'faded-practice',
        title: 'Spot Early Exit Inside `return`',
        promptMarkdown:
          '```python\ndef first_even(nums):\n    for n in nums:\n        if n % 2 == 0:\n            return n\n    return -1\n```',
        completedSteps: [
          'Call `first_even([5, 8, 4])`:',
          'Iteration 1: n=5 (odd) -> loop continues',
          'Iteration 2: n=8 (even) -> hits `return n` immediately',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'Does the loop ever check `4`, and what integer is returned?',
            correct: '8',
            alternatives: ['8.0'],
            points: 10,
            explanation: '`return n` immediately exits the entire function on `8`, so `4` is never checked.',
          },
        },
        misconceptionHints: {
          '4': '`return` exits the whole function immediately, not just one loop pass.',
          '-1': '`return -1` only runs if the entire `for` loop finishes without returning.',
        },
      },
      {
        id: 'cs1-l4-s5',
        kind: 'checkpoint',
        title: 'Verify `return` Composition',
        question: {
          type: 'mcq',
          prompt: 'Given `def add(a, b): return a + b`, what does `add(add(1, 2), add(3, 4))` return?',
          options: ['None', '10', '3, 7', 'TypeError'],
          correct: 1,
          points: 10,
          explanation: '`add(1, 2)` returns 3 and `add(3, 4)` returns 7; `add(3, 7)` returns 10.',
        },
      },
      {
        id: 'cs1-l4-s6',
        kind: 'synthesis',
        title: 'Function Design Takeaways',
        takeaways: [
          '`return` passes a value back to the caller and ends the function immediately.',
          'Local variables inside a function live in their own call frame and vanish upon return.',
          'Pure functions returning values let you compose `f(g(x))` and unit-test automatically.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'cloze-workbench', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-return-none',
        front: 'What does a Python function return if it prints a value and omits `return`?',
        back: '`None` — trying arithmetic like `f(3) + 1` triggers a `TypeError`.',
        explanation: 'Always `return` computed outputs so callers can reuse them.',
        interleave: true,
      },
      {
        id: 'cs1-fc-local-scope',
        front: 'Can reassigning a scalar parameter inside `def f(x): x = 99` change the caller’s variable `a` passed as `f(a)`?',
        back: 'No — rebinding `x` inside `f` only redirects `f`’s local frame binding.',
        explanation: 'The caller must capture a returned value (e.g., `a = f(a)`).',
        interleave: true,
      },
      {
        id: 'cs1-fc-early-return',
        front: 'Why is putting `return False` in an `else:` branch inside a search loop a common bug?',
        back: 'It exits on the very first non-matching item instead of waiting until all items are checked.',
        explanation: 'Place default `return False` AFTER the `for` loop finishes.',
        interleave: true,
      },
    ],
  },
  {
    id: 'cs1-l5-recursion',
    unitId: 'cs1-u2-functions-stack',
    title: 'Base Cases, Stack Frames & Recursive Unwinding',
    summary: 'Trace winding-down calls onto the stack and unwinding return values back up from the base case.',
    estimatedMinutes: 10,
    standards: ['AP CSA CON-2.N', 'CSTA 3B-AP-13'],
    prerequisiteLessonIds: ['cs1-l4-functions'],
    visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
    steps: [
      {
        id: 'cs1-l5-s1',
        kind: 'narrative',
        title: 'Every Sound Recursion Needs Two Guarantees',
        bodyMarkdown:
          'A recursive function calls itself on a **strictly smaller subproblem** until it hits a **base case** that answers directly without recursing.\n\nEach active call stays paused on the **call stack** waiting for its child call to return.',
        callout: {
          tone: 'pitfall',
          text: 'Missing a base case—or making a recursive call that does not move closer to it—triggers `RecursionError: maximum recursion depth exceeded`.',
        },
      },
      {
        id: 'cs1-l5-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Call Stack Depth for `fact(4)`',
        predictionPrompt:
          'Suppose `fact(0) = 1` and `fact(n) = n * fact(n - 1)`. How many total calls are simultaneously paused on the stack at peak depth during `fact(4)`?',
        predictionChoices: ['1 frame (Python reuses one frame)', '5 frames: fact(4), fact(3), fact(2), fact(1), fact(0)', '4 frames: stopping at fact(1)'],
        correctPredictionIndex: 1,
        visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
        observeInstruction:
          'Inspect the recursion stack panel in the 2D visualizer: observe frames stacking upward during descent and popping downward as return values multiply.',
        explainPrompt: 'What order do stack frames finish executing in?',
        explainOptions: [
          'Last-In, First-Out (LIFO): `fact(0)` finishes first, returning `1` to `fact(1)`, up to `fact(4)`.',
          'First-In, First-Out (FIFO): `fact(4)` returns before `fact(0)` runs.',
          'All five frames finish simultaneously.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          '`fact(4)` cannot finish multiplying `4 * ...` until `fact(3)` resolves, so `fact(0)` must unwind upward first (LIFO).',
      },
      {
        id: 'cs1-l5-s3',
        kind: 'worked-example',
        title: 'Trace Pre- vs. Post-Recursion Print Order',
        problemMarkdown: 'Compare what prints when a statement sits BEFORE vs. AFTER the recursive call:\n```python\ndef echo(n):\n    if n == 0: return\n    print("down", n)\n    echo(n - 1)\n    print("up", n)\n```',
        steps: [
          {
            label: 'Wind down (`n=2 -> 1 -> 0`)',
            expressionOrAction: 'Prints "down 2", then "down 1", hits base case 0',
            whyNote: 'Code before `echo(n - 1)` executes on the way INTO the stack.',
          },
          {
            label: 'Unwind up (`n=1 -> 2`)',
            expressionOrAction: 'Prints "up 1", then "up 2"',
            whyNote: 'Paused frames resume in reverse order after child calls return.',
          },
        ],
      },
      {
        id: 'cs1-l5-s4',
        kind: 'faded-practice',
        title: 'Trace Recursive Power',
        promptMarkdown:
          '```python\ndef power(base, exp):\n    if exp == 0:\n        return 1\n    return base * power(base, exp - 1)\n```',
        completedSteps: [
          'power(2, 3) waits for 2 * power(2, 2)',
          'power(2, 2) waits for 2 * power(2, 1)',
          'power(2, 1) waits for 2 * power(2, 0) where base case returns 1',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'What integer does `power(2, 3)` return when all frames unwind?',
            correct: '8',
            alternatives: ['8.0'],
            points: 10,
            explanation: 'Unwinding gives `2 * 1 = 2`, `2 * 2 = 4`, `2 * 4 = 8`.',
          },
        },
        misconceptionHints: {
          '6': 'Trace multiplication, not addition: `2 * (2 * (2 * 1)) = 8`.',
        },
      },
      {
        id: 'cs1-l5-s5',
        kind: 'checkpoint',
        title: 'Order a Recursive Sum of List Function',
        question: {
          type: 'order',
          prompt: 'Order these lines to sum a list of integers recursively:',
          options: [
            '    return nums[0] + sum_list(nums[1:])',
            '    if not nums:',
            'def sum_list(nums):',
            '        return 0',
          ],
          correct: [2, 1, 3, 0],
          points: 15,
          explanation: 'Define signature -> guard empty list base case -> return 0 -> add head to recursive tail sum.',
        },
      },
      {
        id: 'cs1-l5-s6',
        kind: 'synthesis',
        title: 'Recursion Takeaways',
        takeaways: [
          'Check the base case FIRST before making any recursive call.',
          'Each recursive step must strictly make progress toward the base case.',
          'Call stacks store paused local variables in LIFO order (~1,000 frame limit in CPython by default).',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'sequence-architect', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-base-case',
        front: 'What happens if a recursive function lacks an executable base case?',
        back: 'Calls push endlessly onto the stack until Python raises `RecursionError`.',
        explanation: 'Default recursion limit in Python is ~1000 frames to prevent C stack overflow.',
        interleave: true,
      },
      {
        id: 'cs1-fc-lifo',
        front: 'Why does the call stack obey LIFO (Last-In, First-Out)?',
        back: 'A parent function cannot resume until the most recently launched child call returns.',
        explanation: 'The deepest call completes and pops first.',
        interleave: true,
      },
      {
        id: 'cs1-fc-rec-leap',
        front: 'What is the "recursive leap of faith"?',
        back: 'Assuming `solve(smaller)` correctly returns the answer for smaller inputs so you only verify the base case and combination step.',
        explanation: 'Soundness follows by mathematical induction when size shrinks strictly.',
        interleave: true,
      },
    ],
  },
  {
    id: 'cs1-l6-while-search',
    unitId: 'cs1-u2-functions-stack',
    title: '`while` Sentinels & Binary Search Dividing',
    summary: 'Contrast linear scanning against logarithmic halving and prove termination with loop variants.',
    estimatedMinutes: 9,
    standards: ['CSTA 3B-AP-11', 'AP CSP AAP-2.P'],
    prerequisiteLessonIds: ['cs1-l5-recursion'],
    visual: { kind: 'model-3d', modelId: 'bst-3d', initialParams: { nodeCount: 15, traversal: 0 }, highlightHotspots: ['root', 'avl'] },
    steps: [
      {
        id: 'cs1-l6-s1',
        kind: 'narrative',
        title: 'Use `while` When Step Count Is Unknown Ahead of Time',
        bodyMarkdown:
          'When reading user input until `"quit"` or shrinking a search bracket `[lo, hi]` until a target is found, we cannot fix the iteration count before starting—use **`while`**.\n\nIn a sorted list or balanced BST of `N` elements, eliminating **half** of the remaining search space on every step requires at most `ceil(log2(N + 1))` steps: ~20 steps for a million items!',
        callout: {
          tone: 'key-idea',
          text: 'Every `while` loop needs a shrinking variant (like `hi - lo`) guaranteed to decrease on every path, or it risks an infinite loop.',
        },
      },
      {
        id: 'cs1-l6-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Tree Height When Balance Is Enforced vs. Disabled',
        predictionPrompt:
          'With 15+ nodes in a Binary Search Tree, what keeps worst-case search depth proportional to `log2(N)` instead of `N`?',
        predictionChoices: [
          'Self-balancing rotations keeping |left height - right height| <= 1',
          'Sorting node IDs alphabetically inside arrays',
          'Disabling pointers between parent and child nodes',
        ],
        correctPredictionIndex: 0,
        visual: {
          kind: 'model-3d',
          modelId: 'bst-3d',
          initialParams: { nodeCount: 7, traversal: 0 },
          highlightHotspots: ['avl', 'root'],
          challengeId: 'cs1-bst-balance-check',
          targetChallenge: {
            id: 'cs1-bst-balance-check',
            instruction: 'Increase Node Count to at least 15 and ensure AVL Self-Balancing keeps Max |Balance| at or below 1.',
            assertions: [
              { source: 'param', key: 'nodeCount', op: 'gte', target: 15 },
              { source: 'readout', key: 'Max |Balance|', op: 'lte', target: 1 },
            ],
          },
        },
        observeInstruction:
          'Drag Node Count to >= 15 and toggle AVL Self-Balancing off vs. on to compare the tree height and `Max |Balance|` readout.',
        explainPrompt: 'Why does logarithmic halving depend on balanced splits (or sorted midpoints)?',
        explainOptions: [
          'Checking a midpoint only discards half the candidates if roughly equal numbers of items sit on both sides.',
          'Balanced trees store every key at depth 0.',
          'Halving only works on floating-point keys.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'If every probe eliminates half the subproblem (as in array binary search or an AVL BST), depth stays ~log2(N). Skewed chains fall back to O(N).',
      },
      {
        id: 'cs1-l6-s3',
        kind: 'worked-example',
        title: 'Trace Binary Search Bounds `lo` and `hi`',
        problemMarkdown: 'Search `[10, 20, 30, 40, 50, 60, 70]` (indices `0..6`) for `target = 50`:',
        steps: [
          {
            label: 'Probe 1 (`lo=0, hi=6`)',
            expressionOrAction: 'mid = (0 + 6) // 2 = 3 -> arr[3] = 40 < 50',
            whyNote: 'Since `40 < 50`, discard `0..3` by setting `lo = mid + 1 = 4`.',
          },
          {
            label: 'Probe 2 (`lo=4, hi=6`)',
            expressionOrAction: 'mid = (4 + 6) // 2 = 5 -> arr[5] = 60 > 50',
            whyNote: 'Discard `5..6` by setting `hi = mid - 1 = 4`.',
          },
          {
            label: 'Probe 3 (`lo=4, hi=4`)',
            expressionOrAction: 'mid = 4 -> arr[4] = 50 == target -> return 4',
            whyNote: 'Notice `lo <= hi` kept searching even when `lo == hi`!',
          },
        ],
      },
      {
        id: 'cs1-l6-s4',
        kind: 'faded-practice',
        title: 'Avoid the Infinite Binary Search Loop',
        promptMarkdown: 'Look closely at the interval update: if `arr[mid] < target`, we update `lo`.',
        completedSteps: [
          'At `lo=4, hi=4`, `mid = 4`.',
          'Suppose `target` is NOT in the list and `arr[4] < target`.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Why must binary search set `lo = mid + 1` instead of `lo = mid`?',
            options: [
              'Setting `lo = mid` leaves `lo = 4, hi = 4` unchanged forever when `target` is missing!',
              '`mid + 1` makes the array unsorted.',
              '`lo = mid` skips index 0 automatically.',
              'Integer division rounds up.',
            ],
            correct: 0,
            points: 10,
            explanation: 'Because `arr[mid]` was already checked and unequal, skipping it (`mid + 1` / `mid - 1`) guarantees the window strictly shrinks.',
          },
        },
        misconceptionHints: {
          '1': 'Reading `arr[mid]` does not mutate the list; the danger is an infinite loop when `lo == mid`.',
        },
      },
      {
        id: 'cs1-l6-s5',
        kind: 'checkpoint',
        title: 'Upper Bound on Comparisons',
        question: {
          type: 'fill',
          prompt: 'At most how many binary-search comparisons are needed to guarantee finding or ruling out a name in a sorted list of 1,000,000 entries? (Smallest `k` where `2^k > 1,000,000`)',
          correct: '20',
          alternatives: ['20 steps', '20 comparisons'],
          points: 10,
          explanation: '2^20 = 1,048,576 > 1,000,000, so 20 probes suffice vs. up to 1,000,000 for linear scan.',
        },
      },
      {
        id: 'cs1-l6-s6',
        kind: 'synthesis',
        title: 'Unit 2 Takeaways',
        takeaways: [
          'Use `lo <= hi` together with `lo = mid + 1` and `hi = mid - 1` so single-item intervals resolve without infinite loops.',
          'Precondition: binary search only works on sorted inputs (or balanced order invariants).',
          'Logarithmic halving scales from 1,000 (10 probes) to 1,000,000 (20 probes).',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'sim-sandbox', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-bsearch-precond',
        front: 'What precondition MUST hold before calling binary search on an array?',
        back: 'The array must be sorted according to the comparison key.',
        explanation: 'Without order, discarding half the array could discard the target.',
        interleave: true,
      },
      {
        id: 'cs1-fc-bsearch-mid',
        front: 'Why does `while lo <= hi:` update `lo = mid + 1` or `hi = mid - 1` rather than `mid`?',
        back: 'Because `arr[mid]` was already tested; excluding `mid` guarantees the search window strictly shrinks and terminates.',
        explanation: 'Leaving `lo = mid` stalls indefinitely when `lo == hi` or `lo + 1 == hi`.',
        interleave: true,
      },
      {
        id: 'cs1-fc-while-variant',
        front: 'How do you prove a `while` loop terminates?',
        back: 'Identify an integer measure bounded below (e.g., `hi - lo >= 0`) that strictly decreases on every iteration.',
        explanation: 'Called a loop variant.',
        interleave: true,
      },
    ],
  },
]

const CS1_U3_LESSONS: PackLesson[] = [
  {
    id: 'cs1-l7-lists',
    unitId: 'cs1-u3-collections-debug',
    title: 'Lists, Slicing & Mutable Aliasing Gotchas',
    summary: 'Master 0-based indexing, `[start:stop]` slicing, and the crucial difference between copying and aliasing mutable lists.',
    estimatedMinutes: 9,
    standards: ['CSTA 3A-DA-09', 'AP CSP DAT-1.A'],
    prerequisiteLessonIds: ['cs1-l6-while-search'],
    visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
    steps: [
      {
        id: 'cs1-l7-s1',
        kind: 'narrative',
        title: 'Two Names, One Shared List Object',
        bodyMarkdown:
          'Unlike integers, a Python `list` is **mutable**. Writing `alias = nums` binds a second name to the **exact same list in memory**—appending to `alias` changes `nums` too!\n\nTo make an independent shallow copy, slice with `copy = nums[:]` (or `nums.copy()`). Also watch out: `nums.sort()` and `nums.append(x)` mutate in place and return **`None`**!',
        callout: {
          tone: 'pitfall',
          text: 'Never write `nums = nums.append(5)`! `append()` modifies the list in place and returns `None`, wiping out your variable.',
        },
      },
      {
        id: 'cs1-l7-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Mutated List vs. Sliced Copy',
        predictionPrompt:
          'Run `a = [1, 2]; b = a; c = a[:]; b.append(3)`. What do `a` and `c` contain?',
        predictionChoices: [
          'a = [1, 2], c = [1, 2]',
          'a = [1, 2, 3], c = [1, 2]',
          'a = [1, 2, 3], c = [1, 2, 3]',
        ],
        correctPredictionIndex: 1,
        visual: { kind: 'model-2d', modelId: 'sorting-recursion-stack-2d' },
        observeInstruction:
          'Observe how in-place operations mutate shared sequence memory directly while slice copies allocate a distinct list array.',
        explainPrompt: 'Why did `b.append(3)` alter `a` while leaving `c` untouched?',
        explainOptions: [
          '`b = a` shared the original list reference, whereas `a[:]` created a separate list object for `c`.',
          '`append` always skips the third variable alphabetically.',
          'Slices automatically convert lists into immutable tuples.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          '`a` and `b` are aliases to the same mutable container; `c = a[:]` copied elements into a fresh list.',
      },
      {
        id: 'cs1-l7-s3',
        kind: 'worked-example',
        title: 'Contrast `nums.sort()` vs. `sorted(nums)`',
        problemMarkdown: 'Compare in-place mutation against returning a new sorted list:',
        steps: [
          {
            label: 'In-place: `.sort()`',
            expressionOrAction: 'nums.sort()  # returns None, mutates nums',
            whyNote: 'Use alone on a line when you want to reorder `nums` itself and keep zero copy.',
          },
          {
            label: 'New list: `sorted(nums)`',
            expressionOrAction: 'ordered = sorted(nums)  # keeps nums unchanged',
            whyNote: 'Ideal inside expressions or when callers still need the original input order.',
          },
        ],
      },
      {
        id: 'cs1-l7-s4',
        kind: 'faded-practice',
        title: 'Trace List Slicing Bounds',
        promptMarkdown: 'Given `letters = ["a", "b", "c", "d", "e"]` (indices `0..4`):',
        completedSteps: [
          '`letters[1:4]` includes index 1 ("b"), 2 ("c"), 3 ("d"), stopping before 4.',
          '`letters[-1]` reads the last element `"e"`.',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'How many elements are in `letters[2:4]`?',
            correct: '2',
            alternatives: ['two'],
            points: 10,
            explanation: 'Indices `2` ("c") and `3` ("d") are included; `stop - start = 4 - 2 = 2`.',
          },
        },
        misconceptionHints: {
          '3': 'Remember slices are half-open `[start:stop)` so index `4` ("e") is excluded.',
        },
      },
      {
        id: 'cs1-l7-s5',
        kind: 'checkpoint',
        title: 'Diagnose the `None` Return Trap',
        question: {
          type: 'mcq',
          prompt: 'After running:\n```python\nitems = [3, 1, 2]\nitems = items.append(4)\n```\nWhat is `items`?',
          options: ['[3, 1, 2, 4]', '[1, 2, 3, 4]', 'None', '4'],
          correct: 2,
          points: 10,
          explanation: '`list.append()` mutates in place and returns `None`, so reassigning `items = ...` destroys the list reference.',
        },
      },
      {
        id: 'cs1-l7-s6',
        kind: 'synthesis',
        title: 'List & Aliasing Takeaways',
        takeaways: [
          '`b = a` aliases the same mutable list; `b = a[:]` or `a.copy()` creates an independent shallow copy.',
          'Mutating methods (`.append()`, `.sort()`, `.reverse()`) return `None`; standalone functions (`sorted()`) return new lists.',
          'Slice length `a[i:j]` is always `j - i` when `0 <= i <= j <= len(a)`.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'step-detective', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-alias',
        front: 'How do you copy a Python list `a` so edits to the copy do not mutate `a`?',
        back: 'Use `b = a.copy()`, `b = a[:]`, or `b = list(a)` instead of `b = a`.',
        explanation: 'Simple `b = a` creates an alias to the exact same heap object.',
        interleave: true,
      },
      {
        id: 'cs1-fc-append-none',
        front: 'What does `list.append(x)` return?',
        back: '`None` (it mutates the target list in place).',
        explanation: 'Call `items.append(x)` as a statement, never `items = items.append(x)`.',
        interleave: true,
      },
      {
        id: 'cs1-fc-slice-len',
        front: 'If `0 <= start <= stop <= len(s)`, how many items are in `s[start:stop]`?',
        back: 'Exactly `stop - start` items (half-open interval `[start, stop)`).',
        explanation: 'Index `start` is included; index `stop` is excluded.',
        interleave: true,
      },
    ],
  },
  {
    id: 'cs1-l8-dicts',
    unitId: 'cs1-u3-collections-debug',
    title: 'Dictionaries, Key Lookup & Frequency Counting',
    summary: 'Replace slow nested list searches with constant-time dictionary lookups and `.get()` counting.',
    estimatedMinutes: 8,
    standards: ['CSTA 3B-AP-12', 'ACM CS2023 AL-DataStructures'],
    prerequisiteLessonIds: ['cs1-l7-lists'],
    steps: [
      {
        id: 'cs1-l8-s1',
        kind: 'narrative',
        title: 'Dictionaries Map Keys to Values in Constant Time',
        bodyMarkdown:
          'Searching a 1,000,000-element unsorted list takes up to 1,000,000 comparisons. Checking `key in counts` on a Python `dict` hashes the key straight to a slot in **`O(1)` average time**.\n\nTo count occurrences without triggering `KeyError` on unseen keys, write `counts[w] = counts.get(w, 0) + 1`.',
        callout: {
          tone: 'key-idea',
          text: 'Dictionary keys must be **hashable/immutable** (strings, ints, tuples of immutables)—a mutable `list` cannot serve as a key.',
        },
      },
      {
        id: 'cs1-l8-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Unseen-Key Guard Behavior',
        predictionPrompt:
          'What happens if you run `counts = {}; counts["apple"] += 1` without initializing `"apple"` first?',
        predictionChoices: [
          'Python auto-creates `"apple": 1`.',
          'Python raises `KeyError: "apple"`.',
          'Python stores `None`.',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 1, y1: 1, x2: 50, y2: 1 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Look at the flat slope `0` line: hash lookup stays roughly flat as table size N grows, unlike linear scan `y = N`. However, reading `counts[k]` before key `k` exists always fails.',
        explainPrompt: 'Why does `counts[w] = counts.get(w, 0) + 1` fix `KeyError`?',
        explainOptions: [
          '`.get(w, 0)` safely reads the current count OR falls back to `0` when `w` is missing, then assigns the incremented sum.',
          '`.get()` freezes dictionary keys permanently.',
          '`.get()` converts `counts` into a sorted list.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Reading a missing key via `[]` raises `KeyError`; `.get(key, default)` supplies a safe fallback before writing back `counts[w]`.',
      },
      {
        id: 'cs1-l8-s3',
        kind: 'worked-example',
        title: 'Build a Word Frequency Counter',
        problemMarkdown: 'Count words in `["go", "py", "go"]`:',
        steps: [
          {
            label: 'Word 1: "go"',
            expressionOrAction: 'counts.get("go", 0) -> 0; counts["go"] = 1',
            whyNote: 'First sighting returns default `0`, storing `1`.',
          },
          {
            label: 'Word 2: "py"',
            expressionOrAction: 'counts.get("py", 0) -> 0; counts["py"] = 1',
            whyNote: 'New key gets `1` independently.',
          },
          {
            label: 'Word 3: "go"',
            expressionOrAction: 'counts.get("go", 0) -> 1; counts["go"] = 2',
            whyNote: 'Existing key returns `1`, updating `counts["go"]` to `2`.',
          },
        ],
      },
      {
        id: 'cs1-l8-s4',
        kind: 'faded-practice',
        title: 'Iterate Key-Value Pairs Safely',
        promptMarkdown:
          '```python\nscores = {"ada": 94, "grace": 98, "alan": 89}\ntop = 0\nfor name, val in scores.items():\n    if val > top:\n        top = val\n```',
        completedSteps: [
          'Iteration 1: name="ada", val=94 -> top becomes 94',
          'Iteration 2: name="grace", val=98 -> top becomes 98',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'After checking `"alan": 89`, what integer is stored in `top`?',
            correct: '98',
            alternatives: ['98.0'],
            points: 10,
            explanation: '89 is not > 98, so `top` stays 98.',
          },
        },
        misconceptionHints: {
          '89': '`if val > top:` only updates `top` when `val` exceeds `98`.',
        },
      },
      {
        id: 'cs1-l8-s5',
        kind: 'checkpoint',
        title: 'Which Key Type Is Invalid in a `dict`?',
        question: {
          type: 'mcq',
          prompt: 'Which object CANNOT be used as a Python dictionary key?',
          options: ['"student_42"', '(12, 5)', '404', '[12, 5]'],
          correct: 3,
          points: 10,
          explanation: 'A `list` (`[12, 5]`) is mutable and unhashable (`TypeError: unhashable type: "list"`). Tuples of numbers, strings, and ints work.',
        },
      },
      {
        id: 'cs1-l8-s6',
        kind: 'synthesis',
        title: 'Dictionary Pattern Takeaways',
        takeaways: [
          '`key in my_dict` checks existence in `O(1)` expected time without looping.',
          '`d.get(k, default)` avoids `KeyError` cleanly for counters and optional lookups.',
          'Keys must be immutable/hashable (`str`, `int`, `tuple` of immutables); values can be anything including lists or nested dicts.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'cloze-workbench', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-dict-get',
        front: 'What does `d.get(key, 0)` return when `key` is absent from `d`?',
        back: 'It returns `0` without raising `KeyError` and without inserting `key` into `d`.',
        explanation: 'Combine with `d[key] = d.get(key, 0) + 1` to tally frequencies cleanly.',
        interleave: true,
      },
      {
        id: 'cs1-fc-dict-key',
        front: 'Why can `(3, 4)` be a dictionary key while `[3, 4]` raises `TypeError`?',
        back: 'Tuples of integers are immutable/hashable, whereas lists are mutable and have no fixed hash.',
        explanation: 'Mutating a key after insertion would break hash-bucket lookup.',
        interleave: true,
      },
      {
        id: 'cs1-fc-dict-items',
        front: 'What does `for k, v in d.items():` yield on each pass?',
        back: 'A `(key, value)` tuple unpacked into `k` and `v`.',
        explanation: 'Looping `for k in d:` yields only keys.',
        interleave: true,
      },
    ],
  },
  {
    id: 'cs1-l9-debugging',
    unitId: 'cs1-u3-collections-debug',
    title: 'Trace Tables, Boundary Tests & Binary-Split Debugging',
    summary: 'Isolate bugs deterministically using minimal failing inputs, edge cases, and midpoint checks.',
    estimatedMinutes: 9,
    standards: ['CSTA 3A-AP-21', 'AP CSA VAR-2'],
    prerequisiteLessonIds: ['cs1-l8-dicts'],
    steps: [
      {
        id: 'cs1-l9-s1',
        kind: 'narrative',
        title: 'Debug Like a Scientist, Not a Guesser',
        bodyMarkdown:
          'Random edits double bugs. Systematic debugging starts by **reproducing the smallest failing input**, checking edge cases (`[]`, 1 element, duplicates, negative values), and **binary-splitting** where actual state first diverges from expected state.',
        callout: {
          tone: 'key-idea',
          text: 'Always assert or test the 4 classic boundary shapes: empty (`0` items), singleton (`1` item), all equal duplicates, and reversed/extreme inputs.',
        },
      },
      {
        id: 'cs1-l9-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Where Bug Hunting Finds an Issue Fastest',
        predictionPrompt:
          'A 16-stage data pipeline outputs wrong totals at stage 16. How many probes does binary-splitting (`check stage 8 -> 12 -> ...`) take vs. testing every stage 1..16?',
        predictionChoices: [
          '16 checks either way',
          'At most 4–5 midpoint checks (`log2 16 = 4`) vs. up to 16 sequential checks',
          'Always 2 checks',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 16, x2: 4, y2: 1 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Inspect how bisecting halves suspected pipeline steps (`16 -> 8 -> 4 -> 2 -> 1`) in 4 inspections—the exact same halving idea as binary search.',
        explainPrompt: 'What makes a midpoint assertion useful while debugging?',
        explainOptions: [
          'If intermediate state at stage 8 matches expectations, stages 1–8 are cleared so you search only 9–16.',
          'Midpoints erase corrupted memory automatically.',
          'Checking stage 8 fixes syntax errors in stage 16.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'One assertion at the halfway mark immediately eliminates half the codebase from suspicion.',
      },
      {
        id: 'cs1-l9-s3',
        kind: 'worked-example',
        title: 'Boundary Audit on an Average Function',
        problemMarkdown: 'Audit `def avg(nums): return sum(nums) / len(nums)` against boundaries:',
        steps: [
          {
            label: 'Singleton `[42]`',
            expressionOrAction: '42 / 1 = 42.0  # Passes',
            whyNote: 'Single-element collections work.',
          },
          {
            label: 'Empty list `[]`',
            expressionOrAction: '0 / 0 -> ZeroDivisionError!',
            whyNote: 'Missing empty guard crashes callers with no data.',
          },
          {
            label: 'Add explicit boundary guard',
            expressionOrAction: 'if not nums: raise ValueError("empty sample")',
            whyNote: 'Fail loudly with clear contract instead of hidden `ZeroDivisionError`.',
          },
        ],
      },
      {
        id: 'cs1-l9-s4',
        kind: 'faded-practice',
        title: 'Spot the Classic Adjacent-Pair Index Crash',
        promptMarkdown:
          '```python\ndef has_duplicate_adjacent(arr):\n    for i in range(len(arr)):\n        if arr[i] == arr[i + 1]:\n            return True\n    return False\n```',
        completedSteps: [
          'Call `has_duplicate_adjacent([1, 3, 5])` (len = 3):',
          'i = 0 checks arr[0] vs arr[1] (1 vs 3 -> False)',
          'i = 1 checks arr[1] vs arr[2] (3 vs 5 -> False)',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'What happens at `i = 2` (`i == len(arr) - 1`) and how should `range(...)` be fixed?',
            options: [
              'Raises `IndexError` on `arr[3]`; change loop to `range(len(arr) - 1)`',
              'Returns `True`; change loop to `range(len(arr) + 1)`',
              'Skips silently; no change needed',
              'Triggers `ZeroDivisionError`',
            ],
            correct: 0,
            points: 10,
            explanation: 'Pairwise checks `(i, i + 1)` only have `len(arr) - 1` adjacent pairs, stopping at `i = len(arr) - 2`.',
          },
        },
        misconceptionHints: {
          '1': '`i + 1` reaches index 3 when `len(arr) == 3`, which is out of bounds (`0..2`).',
        },
      },
      {
        id: 'cs1-l9-s5',
        kind: 'branching-scenario',
        title: 'Production Incident: Grading Drop-Lowest-Score Crash',
        startNodeId: 'incident',
        nodes: {
          incident: {
            promptMarkdown:
              'A teacher reports `drop_lowest(scores)` crashes for transfer students who have only `1` score (`[92]`):\n```python\ndef drop_lowest(scores):\n    scores.sort()\n    return sum(scores[1:]) / len(scores[1:])\n```',
            choices: [
              {
                label: 'Reproduce locally with `drop_lowest([92])` and inspect `scores[1:]`',
                nextNodeId: 'root-cause',
                feedback: 'Great triage: on `[92]`, `scores[1:]` is `[]`, giving `len([]) == 0` -> `ZeroDivisionError`, PLUS `.sort()` mutated the caller’s list!',
                outcome: 'optimal',
              },
              {
                label: 'Wrap the whole body in `try: ... except: return 0`',
                nextNodeId: 'hidden-bug',
                feedback: 'Swallowing exceptions hides bugs and hands transfer students a `0%` grade instead of `92%`!',
                outcome: 'unsafe',
              },
            ],
          },
          'root-cause': {
            promptMarkdown: 'You found TWO defects (`len <= 1` empty slice AND mutating caller input via `.sort()`). Choose the clean patch:',
            choices: [
              {
                label: 'Guard `if len(scores) <= 1`, use `ordered = sorted(scores)`, average `ordered[1:]` (or handle 1 score explicitly)',
                nextNodeId: null,
                feedback: 'Clean fix: pure non-mutating `sorted()`, safe boundary behavior for `[]` and `[92]`, and unit tests added!',
                outcome: 'optimal',
              },
              {
                label: 'Only check `len == 1` while keeping `scores.sort()`',
                nextNodeId: null,
                feedback: 'Better on crashes, though mutating the caller’s list in-place remains a subtle side-effect hazard.',
                outcome: 'suboptimal',
              },
            ],
          },
          'hidden-bug': {
            promptMarkdown: 'Swallowing the error gave a 92% student a 0%. What should happen BEFORE changing code?',
            choices: [
              {
                label: 'Write a failing unit test `drop_lowest([92]) == 92` and avoid mutating input lists',
                nextNodeId: null,
                feedback: 'Reproducing with a unit test locks down the exact contract and stops regressions.',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'cs1-l9-s6',
        kind: 'synthesis',
        title: 'Debugging & Testing Mastery',
        takeaways: [
          'Adjacent-pair loops must stop at `range(len(arr) - 1)` so `arr[i + 1]` stays in bounds.',
          'Always test `[]`, 1-item lists, duplicates, and out-of-range inputs.',
          'Binary-split intermediate values with assertions or prints to pinpoint divergence in `O(log N)` steps.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'boss-raid', packId: 'cs1-python-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'cs1-fc-adj-range',
        front: 'What loop bound prevents `IndexError` when comparing `arr[i]` and `arr[i + 1]`?',
        back: '`for i in range(len(arr) - 1):`',
        explanation: 'When `i = len(arr) - 2`, `i + 1 = len(arr) - 1`, the final valid index.',
        interleave: true,
      },
      {
        id: 'cs1-fc-4edges',
        front: 'Name four essential boundary test cases for any sequence algorithm.',
        back: 'Empty (`[]`), singleton (`[x]`), all duplicates (`[5, 5, 5]`), and worst-case order (already sorted / reversed).',
        explanation: 'Most off-by-one and division-by-zero bugs surface on 0- or 1-element inputs.',
        interleave: true,
      },
      {
        id: 'cs1-fc-bisect-debug',
        front: 'Why is binary-splitting preferable to stepping line 1..100 when debugging a long pipeline?',
        back: 'Checking the halfway mark eliminates half the remaining stages per test, finding the first divergence in `O(log N)` checks.',
        explanation: 'Works whenever earlier bugs propagate forward into later stages.',
        interleave: true,
      },
    ],
  },
]

const CS1_UNITS: TrackUnit[] = [
  {
    id: 'cs1-u1-state-flow',
    title: 'Unit 1: Variables, State & Boolean Control Flow',
    anchoringPhenomenon: 'Why does `x = x + 1` work in code when it is false in algebra?',
    lessons: CS1_U1_LESSONS,
    capstoneQuizIndex: 0,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'cs1-u2-functions-stack',
    title: 'Unit 2: Functions, Call Stacks & Recursion',
    anchoringPhenomenon: 'How can 20 comparisons isolate one name among a million?',
    lessons: CS1_U2_LESSONS,
    capstoneQuizIndex: 1,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'cs1-u3-collections-debug',
    title: 'Unit 3: Lists, Dictionaries & Systematic Debugging',
    anchoringPhenomenon: 'Why can changing list `b` silently scramble list `a` too?',
    lessons: CS1_U3_LESSONS,
    capstoneQuizIndex: 2,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 },
  },
]

const CS1_TRACK: CurriculumTrack = {
  id: 'track-cs1-python-foundations',
  slug: 'cs1-python-foundations',
  packId: 'cs1-python-foundations',
  title: 'CS1: Python Foundations & Debugging',
  category: 'CS',
  subject: 'Computer Science',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original (MIT) — pedagogy informed by Software Carpentry Novice Python (CC-BY-4.0)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: CS1_UNITS,
}

const CS1_PACK: ContentPack = {
  id: 'cs1-python-foundations',
  name: 'CS1: Python Foundations & Debugging',
  description:
    'Variable bindings, boolean short-circuiting, loops, recursion call stacks, lists/dicts, Parsons ordering, and systematic debugging.',
  subject: 'Computer Science',
  category: 'CS',
  icon: '🐍',
  modelId: 'sorting-recursion-stack-2d',
  relatedModelIds: ['bst-3d'],
  standards: 'CSTA 3A-AP · AP CSP Big Idea 3 · ACM CS2023 SDF',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original (MIT) — pedagogy informed by Software Carpentry Novice Python (CC-BY-4.0)',
  srsInterleave: true,
  gradeBand: 'HS',
  prerequisitePackIds: [],
  track: CS1_TRACK,
  units: CS1_UNITS,
  quizzes: [
    {
      title: 'Unit 1: Variables, Conditionals & Definite Loops',
      description: 'Trace variable bindings, Boolean precedence, range bounds, and loop accumulators.',
      subject: 'Computer Science',
      difficulty: 'easy',
      timeLimitSec: 480,
      modelId: 'sorting-recursion-stack-2d',
      lessonId: 'cs1-l3-iteration',
      questions: [
        {
          type: 'fill',
          prompt: 'Trace Python:\n`a = 6`\n`b = a`\n`a = 15`\nWhat integer is stored in `b`?',
          correct: '6',
          alternatives: ['6.0'],
          points: 10,
          explanation: 'Assigning `b = a` points `b` to 6; later rebinding `a = 15` does not update `b`.',
        },
        {
          type: 'mcq',
          prompt: 'What does `list(range(2, 8, 2))` produce?',
          options: ['[2, 4, 6]', '[2, 4, 6, 8]', '[0, 2, 4, 6]', '[2, 3, 4, 5, 6, 7]'],
          correct: 0,
          points: 10,
          explanation: 'Starting at 2 and stepping by 2 strictly below stop=8 yields 2, 4, 6.',
        },
        {
          type: 'truefalse',
          prompt: 'In Python, `n > 0 and (100 / n) > 5` raises `ZeroDivisionError` when `n == 0`.',
          correct: false,
          points: 10,
          explanation: 'False! `and` short-circuits when `n > 0` is False, skipping the right-hand division.',
        },
        {
          type: 'mcq',
          prompt: 'Which operator has the HIGHEST precedence among `and`, `or`, and `not`?',
          options: ['or', 'and', 'not', 'All evaluate strictly left-to-right'],
          correct: 2,
          points: 10,
          explanation: 'Precedence from highest to lowest is `not`, then `and`, then `or`.',
        },
        {
          type: 'order',
          prompt: 'Parsons puzzle: arrange these lines to sum only positive values in `vals`:',
          options: [
            '    if x > 0:',
            'total = 0',
            '        total += x',
            'for x in vals:',
            'print(total)',
          ],
          correct: [1, 3, 0, 2, 4],
          points: 15,
          explanation: 'Initialize accumulator -> iterate list -> filter `x > 0` -> accumulate -> print final sum after loop.',
        },
        {
          type: 'fill',
          prompt: 'Trace:\n`k = 1`\n`for i in range(4):`\n`    k = k + i`\nWhat is the final integer value of `k`?',
          correct: '7',
          alternatives: ['7.0'],
          points: 10,
          explanation: 'i visits 0, 1, 2, 3 -> k transitions 1 -> 1 -> 2 -> 4 -> 7.',
        },
        {
          type: 'mcq',
          prompt: 'A conditional sets `if x >= 50: tier = "Pass"` followed by `elif x >= 90: tier = "Honors"`. What does `x = 95` receive?',
          options: ['"Honors"', '"Pass"', '"PassHonors"', 'SyntaxError'],
          correct: 1,
          points: 10,
          explanation: 'Only the first true branch executes; `95 >= 50` matches immediately and skips `elif`.',
        },
        {
          type: 'order',
          prompt: 'Parsons puzzle: swap two variables `p` and `q` using a temporary placeholder `tmp`:',
          options: [
            'p = q',
            'tmp = p',
            'q = tmp',
            'print(p, q)',
          ],
          correct: [1, 0, 2, 3],
          points: 10,
          explanation: 'Save `p` into `tmp`, assign `q` into `p`, restore `tmp` into `q`, then print.',
        },
      ],
    },
    {
      title: 'Unit 2: Functions, Recursion & Search Loops',
      description: 'Evaluate call frames, return semantics, recursive base cases, and binary search bounds.',
      subject: 'Computer Science',
      difficulty: 'medium',
      timeLimitSec: 540,
      modelId: 'bst-3d',
      lessonId: 'cs1-l6-while-search',
      questions: [
        {
          type: 'mcq',
          prompt: 'Suppose `def f(x): print(x + 1)`. What is stored in `y` after `y = f(4)`?',
          options: ['5', '4', 'None', 'TypeError'],
          correct: 2,
          points: 10,
          explanation: '`print()` displays 5 to output and returns `None`; without `return`, `f` returns `None`.',
        },
        {
          type: 'fill',
          prompt: 'Trace:\n`n = 10`\n`def inc(n): n = n + 3; return n`\n`m = inc(n)`\nWhat is `n + m` afterward?',
          correct: '23',
          alternatives: ['23.0'],
          points: 10,
          explanation: 'Local parameter `n` changes inside `inc`, returning `m = 13`, while outer `n` remains `10`. `10 + 13 = 23`.',
        },
        {
          type: 'order',
          prompt: 'Parsons puzzle: assemble a recursive factorial function:',
          options: [
            '    return n * fact(n - 1)',
            '    if n <= 1:',
            'def fact(n):',
            '        return 1',
          ],
          correct: [2, 1, 3, 0],
          points: 15,
          explanation: 'Signature first, then base case guard `n <= 1`, return `1`, else recursive product.',
        },
        {
          type: 'truefalse',
          prompt: 'In `while lo <= hi:` binary search, using `lo = mid` instead of `lo = mid + 1` can cause an infinite loop.',
          correct: true,
          points: 10,
          explanation: 'True! When `lo == hi == mid` and `target` is absent, `lo = mid` never shrinks the search bracket.',
        },
        {
          type: 'fill',
          prompt: 'How many halving steps (`log2(128)`) shrink a sorted 128-item array down to size 1 during binary search?',
          correct: '7',
          alternatives: ['7.0'],
          points: 10,
          explanation: '2^7 = 128, so halving 7 times narrows 128 candidates to 1 (7–8 comparisons max).',
        },
        {
          type: 'mcq',
          prompt: 'Which data structure does a runtime system use to pause parent calls during recursion?',
          options: ['FIFO Queue', 'LIFO Call Stack', 'Hash Set', 'Min-Heap'],
          correct: 1,
          points: 10,
          explanation: 'The deepest active call completes and pops first (Last-In, First-Out).',
        },
        {
          type: 'fill',
          prompt: 'Trace:\n`def g(k):`\n`    if k == 0: return 2`\n`    return 3 + g(k - 1)`\nWhat integer does `g(3)` return?',
          correct: '11',
          alternatives: ['11.0'],
          points: 15,
          explanation: 'g(0)=2 -> g(1)=5 -> g(2)=8 -> g(3)=11.',
        },
        {
          type: 'order',
          prompt: 'Parsons puzzle: trace binary search body inside `while lo <= hi:`',
          options: [
            '    if arr[mid] == target: return mid',
            '    mid = (lo + hi) // 2',
            '    elif arr[mid] < target: lo = mid + 1',
            '    else: hi = mid - 1',
          ],
          correct: [1, 0, 2, 3],
          points: 15,
          explanation: 'Compute `mid` first, test equality, raise `lo` if too small, lower `hi` otherwise.',
        },
      ],
    },
    {
      title: 'Unit 3: Lists, Dictionaries & Bug Isolation',
      description: 'Solve aliasing bugs, dict `.get()` aggregation, slice indexing, and edge-case failures.',
      subject: 'Computer Science',
      difficulty: 'hard',
      timeLimitSec: 600,
      modelId: 'sorting-recursion-stack-2d',
      lessonId: 'cs1-l9-debugging',
      questions: [
        {
          type: 'fill',
          prompt: 'Trace:\n`a = [4, 5]`\n`b = a`\n`c = a[:]`\n`b.append(9)`\n`a.pop(0)`\nWhat is `len(a) + len(c)`?',
          correct: '4',
          alternatives: ['4.0'],
          points: 15,
          explanation: '`a` and `b` share one list (4,5 -> 4,5,9 -> 5,9, len 2). `c` stays independent `[4, 5]` (len 2). `2 + 2 = 4`.',
        },
        {
          type: 'mcq',
          prompt: 'Which expression reverses a copy of list `xs` WITHOUT mutating `xs` itself?',
          options: ['xs.reverse()', 'xs[::-1]', 'xs = xs.sort()', 'xs.pop()'],
          correct: 1,
          points: 10,
          explanation: 'Negative-step slicing `xs[::-1]` constructs a new reversed list leaving `xs` intact.',
        },
        {
          type: 'order',
          prompt: 'Parsons puzzle: build a frequency dictionary `freq` for tokens in `words`:',
          options: [
            '    freq[w] = freq.get(w, 0) + 1',
            'freq = {}',
            'return freq',
            'for w in words:',
          ],
          correct: [1, 3, 0, 2],
          points: 15,
          explanation: 'Initialize empty dict -> loop tokens -> increment safely via `.get(w, 0) + 1` -> return dict.',
        },
        {
          type: 'mcq',
          prompt: 'Why does `{[1, 2]: "ok"}` fail in Python?',
          options: [
            'Lists cannot contain integers.',
            'Dictionary keys must be hashable (immutable), and lists are mutable.',
            'Colons are forbidden after brackets.',
            'Dictionaries only accept string keys.',
          ],
          correct: 1,
          points: 10,
          explanation: 'Mutable objects like lists cannot be dictionary keys; use tuple `(1, 2)` instead.',
        },
        {
          type: 'fill',
          prompt: 'Suppose `nums = [10, 20, 30, 40, 50]`. What integer is `sum(nums[1:4])`?',
          correct: '90',
          alternatives: ['90.0'],
          points: 10,
          explanation: '`nums[1:4]` slices indices 1, 2, 3 -> `[20, 30, 40]`, whose sum is 90.',
        },
        {
          type: 'truefalse',
          prompt: 'Writing `for i in range(len(arr)): if arr[i] == arr[i + 1]: ...` safely checks adjacent pairs without crashing.',
          correct: false,
          points: 10,
          explanation: 'False! At the final index `len(arr) - 1`, `arr[i + 1]` raises `IndexError`; use `range(len(arr) - 1)`.',
        },
        {
          type: 'mcq',
          prompt: 'What is `x` after executing `x = [1, 2, 3]; x = x.sort()`?',
          options: ['[1, 2, 3]', '[3, 2, 1]', 'None', '3'],
          correct: 2,
          points: 15,
          explanation: '`list.sort()` returns `None` because it sorts in place; use `sorted(x)` if assigning a result.',
        },
        {
          type: 'order',
          prompt: 'Parsons puzzle: guard empty inputs and average remaining non-lowest scores cleanly:',
          options: [
            '    return sum(ordered[1:]) / (len(ordered) - 1)',
            '    if len(scores) <= 1: return float(scores[0]) if scores else 0.0',
            'def drop_lowest(scores):',
            '    ordered = sorted(scores)',
          ],
          correct: [2, 1, 3, 0],
          points: 15,
          explanation: 'Handle 0 or 1 element first, create non-mutating `ordered`, then divide slice sum cleanly.',
        },
      ],
    },
  ],
}

// ── 18. INTRO TO PSYCHOLOGY ───────────────────────────────────────────────────

const PSY_U1_LESSONS: PackLesson[] = [
  {
    id: 'psy-l1-methods',
    unitId: 'psy-u1-methods-bio',
    title: 'Experiments, Random Assignment & Third-Variable Confounds',
    summary: 'Distinguish observational correlation from causal inference through manipulation, random assignment, and blinding.',
    estimatedMinutes: 8,
    standards: ['APA IPI Pillar 1: Research Methods', 'AP Psych Topic 0.2'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'psy-l1-s1',
        kind: 'narrative',
        title: 'Ice Cream Sales Predict Sunburns—Do They Cause Them?',
        bodyMarkdown:
          'When two variables rise and fall together, people jump to causation. Yet hot summer weather is a **third-variable confound** driving *both* ice cream purchases and sunburns.\n\nOnly a controlled **experiment**—actively manipulating an independent variable (IV) and using **random assignment** across groups—balances pre-existing differences so cause and effect separate.',
        callout: {
          tone: 'pitfall',
          text: 'Random **sampling** lets findings generalize to a population; random **assignment** lets an experiment support causal claims.',
        },
      },
      {
        id: 'psy-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Correlation vs. Causation Bounds',
        predictionPrompt:
          'A survey of 5,000 undergraduates finds `r = -0.44` between nightly social-media minutes and GPA. What is scientifically warranted?',
        predictionChoices: [
          'Social media definitely lowers student GPAs.',
          'Greater social-media time co-occurs with lower GPAs, but confounds like stress or work hours prevent causal proof.',
          'GPA causes students to delete apps.',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 3, y1: 3.6, x2: 18, y2: 2.6 },
            ask: 'slope',
            rounding: 'hundredth',
          },
        },
        observeInstruction:
          'Observe the negative linear trend line: negative slope indicates an inverse correlation, yet an observational scatter gives no evidence of which arrow drives which.',
        explainPrompt: 'Why can `r = -0.44` fail to establish causality even with a huge sample?',
        explainOptions: [
          'Large observational samples sharpen precision around the association without eliminating reverse directionality or unmeasured third variables.',
          'Correlations only measure positive relationships.',
          'Sample sizes over 1,000 make experiments impossible.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'More surveys do not turn correlation into causation; random assignment to reduced-usage vs. control conditions is required for causal attribution.',
      },
      {
        id: 'psy-l1-s3',
        kind: 'worked-example',
        title: 'Dissect an Experimental Design Step-by-Step',
        problemMarkdown: 'Evaluate a study testing whether 20-minute naps boost afternoon memory recall:',
        steps: [
          {
            label: 'Operationalize variables',
            expressionOrAction: 'IV: 20-min quiet nap vs. 20-min puzzle video; DV: word pairs recalled',
            whyNote: 'Both groups take the same break duration, isolating sleep itself.',
          },
          {
            label: 'Random assignment',
            expressionOrAction: 'Coin flip assigns volunteers 50/50 to nap or control',
            whyNote: 'Balances prior sleep debt, baseline memory, and motivation across groups.',
          },
          {
            label: 'Single/Double blinding',
            expressionOrAction: 'Scorer grading recall sheets is blind to condition',
            whyNote: 'Prevents experimenter expectancy bias from subtly nudging scores.',
          },
        ],
      },
      {
        id: 'psy-l1-s4',
        kind: 'faded-practice',
        title: 'Name the Confound Trap',
        promptMarkdown:
          'Volunteers pick whether to join an 8 a.m. meditation club or skip it. Club members later show lower anxiety.',
        completedSteps: [
          'Participants self-selected into meditation rather than being randomly assigned.',
          'People motivated to join morning wellness clubs already differ in habits and baseline stress.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which research flaw directly prevents concluding the meditation caused lower anxiety?',
            options: [
              'Selection bias / lack of random assignment',
              'Missing standard deviation calculation',
              'Excessively large control group',
              'Double-blind placebo effect',
            ],
            correct: 0,
            points: 10,
            explanation: 'Self-selection creates systematic baseline differences between volunteers and non-volunteers.',
          },
        },
        misconceptionHints: {
          '3': 'Neither group received a placebo here; the flaw is non-random group formation.',
        },
      },
      {
        id: 'psy-l1-s5',
        kind: 'branching-scenario',
        title: 'Review a Campus Caffeine-Focus Study Proposal',
        startNodeId: 'proposal',
        nodes: {
          proposal: {
            promptMarkdown:
              'A lab plans to test whether 150 mg caffeine speeds reaction time: morning enrollees get espresso; afternoon enrollees get water.',
            choices: [
              {
                label: 'Reject time-of-day confound; switch to randomly assigned decaf vs. identical caffeinated capsules all at 10 a.m.',
                nextNodeId: 'blinding',
                feedback: 'Strong correction! Time of day (circadian alertness) was confounded with caffeine, and coffee taste triggers expectancy.',
                outcome: 'optimal',
              },
              {
                label: 'Keep morning espresso vs. afternoon water, just double participant count',
                nextNodeId: 'proposal',
                feedback: 'Doubling N still compares morning espresso drinkers against afternoon water drinkers!',
                outcome: 'unsafe',
              },
            ],
          },
          blinding: {
            promptMarkdown: 'Both groups now get identical capsules at 10 a.m. Should the lab assistant administering tasks know who took caffeine?',
            choices: [
              {
                label: 'Keep BOTH participants and task administrators double-blind until scoring finishes.',
                nextNodeId: null,
                feedback: 'Gold standard double-blind RCT: controls placebo expectancy AND experimenter bias.',
                outcome: 'optimal',
              },
              {
                label: 'Let the administrator see capsule codes so instructions sound friendlier',
                nextNodeId: null,
                feedback: 'Knowing condition risks subtle cue differences (experimenter expectancy effect).',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'psy-l1-s6',
        kind: 'synthesis',
        title: 'Research Design Takeaways',
        takeaways: [
          'Only random assignment of an IV across control and treatment conditions justifies causal claims.',
          'Random sampling supports generalizability; random assignment supports internal causal validity.',
          'Double-blind designs block both participant placebo expectations and researcher scoring bias.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-assign-sample',
        front: 'Contrast random sampling vs. random assignment in research design.',
        back: 'Random sampling selects who enters a study (external generalizability); random assignment splits participants into experimental vs. control groups (causal inference).',
        explanation: 'You can have a convenience sample randomly assigned cleanly in a lab trial.',
        interleave: true,
      },
      {
        id: 'psy-fc-third-var',
        front: 'What is a third-variable confound?',
        back: 'An unmeasured factor that influences both variables, creating a misleading correlation between them.',
        explanation: 'Example: warm weather raises both ice cream sales and swimming drownings.',
        interleave: true,
      },
      {
        id: 'psy-fc-double-blind',
        front: 'Why use double-blind procedures in trials?',
        back: 'Neither participants nor researchers collecting outcome data know who received active treatment vs. placebo, neutralizing expectancy effects on both sides.',
        explanation: 'Single-blinding leaves researcher bias unchecked.',
        interleave: true,
      },
    ],
  },
  {
    id: 'psy-l2-synapse',
    unitId: 'psy-u1-methods-bio',
    title: 'Action Potentials, Vesicles & Synaptic Firing Rate',
    summary: 'Model how presynaptic firing frequency drives Ca2+ influx, vesicle exocytosis, and post-synaptic depolarization.',
    estimatedMinutes: 9,
    standards: ['APA Bio Pillar: Neural Communication', 'AP Psych Topic 1.3'],
    prerequisiteLessonIds: ['psy-l1-methods'],
    visual: { kind: 'model-3d', modelId: 'synapse-neuro', initialParams: { apFreq: 35, reuptakeRate: 0.45 } },
    steps: [
      {
        id: 'psy-l2-s1',
        kind: 'narrative',
        title: 'All-or-None Spikes Encode Intensity via Firing Rate',
        bodyMarkdown:
          'A single neuron’s action potential is **all-or-none**: once membrane voltage crosses threshold (~-55 mV), amplitude is fixed rather than "half-strength." Instead, stronger stimuli raise **action potential frequency (Hz)**.\n\nEach arriving spike opens voltage-gated Ca2+ channels at the terminal, fusing vesicles that spill neurotransmitters across the synaptic cleft.',
        callout: {
          tone: 'key-idea',
          text: 'Communication inside a neuron is electrical (action potential); communication across the cleft is chemical (neurotransmitters).',
        },
      },
      {
        id: 'psy-l2-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Post-Synaptic Depolarization Under High Firing Rate',
        predictionPrompt:
          'If presynaptic `Firing Rate` climbs from 30 Hz to 80 Hz (holding reuptake moderate), how do Open Channels and Post-Synaptic Vm respond?',
        predictionChoices: [
          'Action potentials grow taller in mV, while firing rate stays fixed',
          'More vesicles release transmitter, opening more post-synaptic channels and pushing Vm less negative (depolarizing)',
          'Post-synaptic membrane drops further negative toward -90 mV',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-3d',
          modelId: 'synapse-neuro',
          initialParams: { apFreq: 30, reuptakeRate: 0.45 },
          challengeId: 'psy-synapse-fire',
          targetChallenge: {
            id: 'psy-synapse-fire',
            instruction: 'Increase Action Potential Frequency so Firing Rate reaches at least 75 Hz and Post-Synaptic Vm rises to -48 mV or higher.',
            assertions: [
              { source: 'param', key: 'apFreq', op: 'gte', target: 75 },
              { source: 'readout', key: 'Post-Synaptic Vm', op: 'gte', target: -48 },
            ],
          },
        },
        observeInstruction:
          'Raise the AP Frequency slider toward 75–90 Hz and watch Ca2+ glow, vesicle docking, opened ion pores, and Post-Synaptic Vm.',
        explainPrompt: 'What physical mechanism turned faster firing into larger post-synaptic depolarization?',
        explainOptions: [
          'Greater Ca2+ entry fuses more vesicles per second, increasing cleft neurotransmitter occupancy on ligand-gated Na+ pores.',
          'Electrical voltage jumps physically through empty fluid gaps.',
          'Each individual action potential grew 3x taller in spike voltage.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Exactly right! Individual spikes stay all-or-none, while frequency-coded transmitter bursts open more post-synaptic ion channels.',
      },
      {
        id: 'psy-l2-s3',
        kind: 'worked-example',
        title: 'Order the Six Stages of Synaptic Transmission',
        problemMarkdown: 'Follow signal travel from axon hillock to next dendrite:',
        steps: [
          {
            label: '1. Electrical propagation',
            expressionOrAction: 'Action potential depolarizes presynaptic axon terminal',
            whyNote: 'Saltatory conduction speeds travel along myelinated Nodes of Ranvier.',
          },
          {
            label: '2. Calcium trigger & exocytosis',
            expressionOrAction: 'Voltage-gated Ca2+ enters -> synaptic vesicles fuse and release ligand',
            whyNote: 'Without Ca2+ influx, vesicles cannot dock and release neurotransmitters.',
          },
          {
            label: '3. Post-synaptic binding & clearance',
            expressionOrAction: 'Ligand opens post-synaptic ion channels -> EPSP; transporters recycle or enzymes degrade leftover ligand',
            whyNote: 'Rapid clearance resets the synapse so timing stays sharp.',
          },
        ],
      },
      {
        id: 'psy-l2-s4',
        kind: 'faded-practice',
        title: 'Sequence the Synapse Cascade',
        promptMarkdown: 'Sort the middle steps linking presynaptic arrival to post-synaptic EPSP:',
        completedSteps: ['1. Action potential reaches presynaptic terminal'],
        fadedTarget: {
          type: 'order',
          question: {
            type: 'order',
            prompt: 'Place steps 2 through 5 of chemical transmission in chronological order:',
            options: [
              'Neurotransmitter binds post-synaptic receptors',
              'Ca2+ ions flood presynaptic bouton',
              'Na+ pores open creating excitatory depolarization',
              'Vesicles fuse and release neurotransmitter into cleft',
            ],
            correct: [1, 3, 0, 2],
            points: 15,
            explanation: 'Ca2+ entry triggers vesicle fusion, releasing transmitter to bind receptors and open ion channels.',
          },
        },
      },
      {
        id: 'psy-l2-s5',
        kind: 'checkpoint',
        title: 'Test All-or-None Intensity Coding',
        question: {
          type: 'mcq',
          prompt: 'How does the nervous system distinguish a bright spotlight from a dim candle using all-or-none neurons?',
          options: [
            'By firing larger-voltage action potentials per spike',
            'By increasing firing frequency (Hz) and recruiting more neurons',
            'By reversing potassium polarity inside dendrites',
            'By slowing conduction across myelin sheaths',
          ],
          correct: 1,
          points: 10,
          explanation: 'Individual action potentials maintain constant amplitude; intensity is encoded via rate coding (Hz) and population recruitment.',
        },
      },
      {
        id: 'psy-l2-s6',
        kind: 'synthesis',
        title: 'Neural Firing Takeaways',
        takeaways: [
          'Action potentials obey the all-or-none law; stimulus intensity scales firing frequency (Hz).',
          'Calcium influx triggers vesicle exocytosis across the microscopic synaptic cleft.',
          'EPSPs depolarize the post-synaptic cell (less negative); IPSPs hyperpolarize it away from threshold.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'sequence-architect', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-all-or-none',
        front: 'What does the "all-or-none" law mean for action potentials?',
        back: 'Once threshold is reached, an action potential fires at full constant magnitude; stronger inputs increase firing frequency (Hz), not spike height.',
        explanation: 'Prevents signal attenuation down long axons.',
        interleave: true,
      },
      {
        id: 'psy-fc-ca-vesicle',
        front: 'Which ion directly triggers synaptic vesicle fusion at the axon terminal?',
        back: 'Calcium (Ca2+) entering through voltage-gated channels.',
        explanation: 'Blocking presynaptic Ca2+ halts neurotransmitter release into the cleft.',
        interleave: true,
      },
      {
        id: 'psy-fc-myelin',
        front: 'How does myelin speed neural conduction?',
        back: 'It insulates axons so action potentials leap between Nodes of Ranvier (saltatory conduction).',
        explanation: 'Demyelinating diseases disrupt speed and signal fidelity.',
        interleave: true,
      },
    ],
  },
  {
    id: 'psy-l3-neurotransmitters',
    unitId: 'psy-u1-methods-bio',
    title: 'Reuptake Blockade, Agonists & Antagonists',
    summary: 'Simulate how reuptake inhibitors amplify synaptic signaling without increasing presynaptic firing rate.',
    estimatedMinutes: 8,
    standards: ['APA Bio Pillar: Psychopharmacology', 'AP Psych Topic 1.3'],
    prerequisiteLessonIds: ['psy-l2-synapse'],
    visual: { kind: 'model-3d', modelId: 'synapse-neuro', initialParams: { apFreq: 65, reuptakeRate: 0.7 } },
    steps: [
      {
        id: 'psy-l3-s1',
        kind: 'narrative',
        title: 'Clearing the Cleft Controls Signal Duration',
        bodyMarkdown:
          'After neurotransmitter binds post-synaptic receptors, **reuptake transporters** vacuum leftover molecules back into the presynaptic bouton.\n\n**Agonists** boost neurotransmitter action (mimicking transmitter OR blocking reuptake like SSRIs); **antagonists** occupy receptors without opening them, muting transmission.',
        callout: {
          tone: 'key-idea',
          text: 'Blocking reuptake does NOT synthesize extra neurotransmitter—it keeps already-released molecules active longer in the synaptic cleft.',
        },
      },
      {
        id: 'psy-l3-s2',
        kind: 'predict-observe-explain',
        title: 'Predict SSRI Reuptake Slowdown at Fixed Firing Rate',
        predictionPrompt:
          'Hold firing rate steady at 65 Hz and cut `reuptakeRate` from 0.75 down to 0.15 (simulating a reuptake inhibitor). What happens to `Post-Synaptic Vm`?',
        predictionChoices: [
          'Post-Synaptic Vm depolarizes noticeably higher because more ligands linger to activate channels',
          'Open channels drop to zero immediately',
          'Vm drops back to -70 mV because vesicles cannot empty',
        ],
        correctPredictionIndex: 0,
        visual: {
          kind: 'model-3d',
          modelId: 'synapse-neuro',
          initialParams: { apFreq: 65, reuptakeRate: 0.75 },
          lockedParams: ['apFreq'],
          challengeId: 'psy-ssri-reuptake',
          targetChallenge: {
            id: 'psy-ssri-reuptake',
            instruction: 'With Firing Rate locked at 65 Hz, lower Reuptake Rate below 25% (0.25) so Post-Synaptic Vm reaches at least -47 mV.',
            lockParams: ['apFreq'],
            assertions: [
              { source: 'param', key: 'reuptakeRate', op: 'lte', target: 0.25 },
              { source: 'readout', key: 'Post-Synaptic Vm', op: 'gte', target: -47 },
            ],
          },
        },
        observeInstruction:
          'Slide `Reuptake Rate` down below 0.25 while Firing Rate stays locked at 65 Hz. Watch cleft ligand density and Post-Synaptic Vm climb.',
        explainPrompt: 'Why does reducing reuptake strengthen post-synaptic depolarization even at constant firing rate?',
        explainOptions: [
          'Slowing clearance increases dwell time and concentration of ligands in the cleft, keeping more receptor pores open simultaneously.',
          'Blocking transporters injects sodium straight from blood vessels.',
          'Transporters change excitatory glutamate into inhibitory GABA.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Precisely! At 65 Hz, cutting reuptake from 75% to <= 25% raises Post-Synaptic Vm past -47 mV by prolonging cleft receptor activation.',
      },
      {
        id: 'psy-l3-s3',
        kind: 'worked-example',
        title: 'Classify Psychoactive Mechanisms Cleanly',
        problemMarkdown: 'Compare three distinct drugs targeting the same synapse:',
        steps: [
          {
            label: 'Direct Agonist',
            expressionOrAction: 'Binds receptor site and opens ion channel like natural transmitter',
            whyNote: 'Mimics endogenous ligand directly.',
          },
          {
            label: 'Reuptake Inhibitor (Indirect Agonist)',
            expressionOrAction: 'Binds transporter pump, slowing clearance from cleft',
            whyNote: 'Boosts natural pulses rather than firing artificially on its own.',
          },
          {
            label: 'Competitive Antagonist',
            expressionOrAction: 'Occupies receptor lock WITHOUT opening channel',
            whyNote: 'Physically blocks endogenous neurotransmitter from binding.',
          },
        ],
      },
      {
        id: 'psy-l3-s4',
        kind: 'faded-practice',
        title: 'Identify Drug Type from Mechanism',
        promptMarkdown: 'Naloxone rapidly reverses opioid overdose by binding tightly to mu-opioid receptors without activating them.',
        completedSteps: ['Target site: post-synaptic opioid receptors', 'Effect: knocks opioids off receptors while producing zero agonist activation'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Pharmacology classifies naloxone as a(n):',
            options: ['Competitive antagonist', 'Reuptake inhibitor', 'Direct receptor agonist', 'Myelin accelerator'],
            correct: 0,
            points: 10,
            explanation: 'Blocking receptors without triggering cellular response makes naloxone an antagonist.',
          },
        },
      },
      {
        id: 'psy-l3-s5',
        kind: 'checkpoint',
        title: 'Contrast Excitatory vs. Inhibitory Transmitters',
        question: {
          type: 'truefalse',
          prompt: 'GABA primarily opens Cl- channels to hyperpolarize the post-synaptic neuron, making action potentials LESS likely.',
          correct: true,
          points: 10,
          explanation: 'True! GABA is the brain’s main inhibitory transmitter (IPSP), whereas glutamate is the primary excitatory transmitter (EPSP).',
        },
      },
      {
        id: 'psy-l3-s6',
        kind: 'synthesis',
        title: 'Unit 1 Bio-Psych Takeaways',
        takeaways: [
          'Agonists enhance synaptic effects (directly or by blocking reuptake/breakdown); antagonists dampen them.',
          'Slowing reuptake boosts post-synaptic Vm at fixed firing frequency by extending ligand occupancy.',
          'Neural circuits balance excitation (glutamate) against inhibition (GABA) at every dendrite.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'sim-sandbox', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-agonist-antag',
        front: 'Contrast an agonist vs. an antagonist at a receptor.',
        back: 'An agonist mimics/enhances the neurotransmitter response; an antagonist binds and blocks the receptor without activating it.',
        explanation: 'Naloxone (antagonist) vs. nicotine at ACh receptors (agonist).',
        interleave: true,
      },
      {
        id: 'psy-fc-reuptake',
        front: 'What effect does a Selective Serotonin Reuptake Inhibitor (SSRI) have inside the synaptic cleft?',
        back: 'It blocks presynaptic transporter pumps so released serotonin lingers longer and continues stimulating receptors.',
        explanation: 'An indirect agonist mechanism.',
        interleave: true,
      },
      {
        id: 'psy-fc-gaba-glut',
        front: 'Name the principal excitatory and principal inhibitory neurotransmitters in the human brain.',
        back: 'Glutamate (excitatory) and GABA (inhibitory).',
        explanation: 'Balanced neural excitability prevents seizures and supports plasticity.',
        interleave: true,
      },
    ],
  },
]

const PSY_U2_LESSONS: PackLesson[] = [
  {
    id: 'psy-l4-conditioning',
    unitId: 'psy-u2-learning-cognition',
    title: 'Classical Conditioning, Extinction & Spontaneous Recovery',
    summary: 'Map US, UR, CS, and CR accurately across acquisition, extinction trials, and stimulus generalization.',
    estimatedMinutes: 8,
    standards: ['APA Learning Pillar', 'AP Psych Topic 3.7'],
    prerequisiteLessonIds: ['psy-l3-neurotransmitters'],
    steps: [
      {
        id: 'psy-l4-s1',
        kind: 'narrative',
        title: 'Associating Predictors Before Biological Reflexes',
        bodyMarkdown:
          'In classical conditioning, a neutral cue (CS) reliably predicts a biologically meaningful **unconditioned stimulus (US)**. Acquisition peaks fastest under **forward delay conditioning**: CS starts just before US arrives.\n\n**Extinction** (repeated CS without US) teaches a *new inhibitory prediction*, rather than erasing old memory—proven by **spontaneous recovery** after a rest pause.',
        callout: {
          tone: 'pitfall',
          text: 'The UR and CR look similar (e.g., blinking or salivating), but UR follows the unlearned stimulus while CR is triggered by the learned cue alone.',
        },
      },
      {
        id: 'psy-l4-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Post-Extinction Return',
        predictionPrompt:
          'A dog’s tone-salivation response is extinguished over 40 tone-only trials. After 48 hours away from the lab, the tone sounds once. What happens?',
        predictionChoices: [
          'Permanent zero response—extinction deleted the synapse',
          'Temporary partial salivation returns (spontaneous recovery)',
          'The dog unlearns eating food',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 40, x2: 40, y2: 4 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Trace response strength dropping along negative slope during extinction trials—yet recovery after rest shows the original association persisted underneath inhibition.',
        explainPrompt: 'Why does spontaneous recovery occur after extinction?',
        explainOptions: [
          'Extinction builds competing context-sensitive inhibition rather than erasing original CS–US pairing.',
          'Food smells travel across 48 hours.',
          'Rest automatically turns any CS back into a US.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Clinical exposure therapy uses this exact principle: renewing safe cues across varied contexts suppresses spontaneous return of fear.',
      },
      {
        id: 'psy-l4-s3',
        kind: 'worked-example',
        title: 'Label Every Component in a Conditioning Scenario',
        problemMarkdown: 'After nausea from spoiled oysters, seeing any shellfish platter triggers stomach queasiness:',
        steps: [
          {
            label: 'Unconditioned Stimulus (US) & Response (UR)',
            expressionOrAction: 'US: foodborne toxin -> UR: natural nausea reflex',
            whyNote: 'Requires zero prior learning.',
          },
          {
            label: 'Conditioned Stimulus (CS) & Response (CR)',
            expressionOrAction: 'CS: sight/smell of oysters -> CR: conditioned queasiness',
            whyNote: 'Triggered merely by seeing oysters before tasting toxin.',
          },
          {
            label: 'Generalization vs. Discrimination',
            expressionOrAction: 'Generalization: shrimp causes queasiness too; Discrimination: grilled chicken does not',
            whyNote: 'Survival favors cautious broad avoidance (taste aversion in 1 trial!).',
          },
        ],
      },
      {
        id: 'psy-l4-s4',
        kind: 'faded-practice',
        title: 'Spot US vs. CS',
        promptMarkdown: 'Every time Sam hears his microwave chime (cue), he smells warm popcorn and his mouth waters. Now hearing the chime alone makes his mouth water.',
        completedSteps: ['Natural stimulus needing no learning: warm popcorn aroma (US)', 'Unlearned mouth watering to smell: UR'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Once Sam salivates to the microwave chime alone, the chime is the:',
            options: ['Conditioned Stimulus (CS)', 'Unconditioned Response (UR)', 'Neutral Unconditioned Stimulus (US)', 'Negative Reinforcer'],
            correct: 0,
            points: 10,
            explanation: 'The chime started neutral and gained predictive power via pairing with popcorn aroma.',
          },
        },
      },
      {
        id: 'psy-l4-s5',
        kind: 'checkpoint',
        title: 'Check Optimal Temporal Pairing',
        question: {
          type: 'mcq',
          prompt: 'Which temporal order produces the strongest classical conditioning?',
          options: [
            'CS turns on slightly BEFORE US and overlaps/signals it (forward delay)',
            'US finishes completely 5 seconds BEFORE CS begins (backward)',
            'CS and US are uncorrelated in time',
            'CS appears only after UR finishes',
          ],
          correct: 0,
          points: 10,
          explanation: 'Conditioning learns predictive contingency: CS must help forecast upcoming US.',
        },
      },
      {
        id: 'psy-l4-s6',
        kind: 'synthesis',
        title: 'Classical Conditioning Takeaways',
        takeaways: [
          'US triggers UR automatically; CS acquires ability to evoke CR because CS predicts US.',
          'Extinction suppresses CR via new inhibitory learning—leaving spontaneous recovery possible.',
          'Stimulus discrimination sharpens when one cue predicts US and similar cues do not.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'diagram-scout', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-cs-us',
        front: 'How do you tell UR apart from CR when both involve the same bodily reaction?',
        back: 'UR occurs naturally to the unconditioned stimulus without training; CR occurs specifically in response to the learned conditioned stimulus.',
        explanation: 'Check what triggered the response!',
        interleave: true,
      },
      {
        id: 'psy-fc-spont-rec',
        front: 'What does spontaneous recovery prove about extinction?',
        back: 'Extinction creates new inhibitory learning rather than wiping out the original CS–US memory trace.',
        explanation: 'Returning to a different context also triggers "renewal" of the CR.',
        interleave: true,
      },
      {
        id: 'psy-fc-generalization',
        front: 'Define stimulus generalization vs. stimulus discrimination.',
        back: 'Generalization responds similarly to cues resembling the CS; discrimination responds selectively only to the exact predictive CS.',
        explanation: 'Both shape anxiety triggers and perceptual expertise.',
        interleave: true,
      },
    ],
  },
  {
    id: 'psy-l5-operant',
    unitId: 'psy-u2-learning-cognition',
    title: 'Reinforcement, Punishment & Partial Schedules',
    summary: 'Apply the 2x2 operant quadrant cleanly and predict response rates across ratio and interval schedules.',
    estimatedMinutes: 8,
    standards: ['APA Learning Pillar', 'AP Psych Topic 3.8'],
    prerequisiteLessonIds: ['psy-l4-conditioning'],
    steps: [
      {
        id: 'psy-l5-s1',
        kind: 'narrative',
        title: '"Positive/Negative" Means Add/Remove, NOT Good/Bad!',
        bodyMarkdown:
          'Every operant quadrant combines two independent choices:\n- **Goal:** **Reinforcement** (increases future behavior) vs. **Punishment** (decreases behavior).\n- **Operation:** **Positive** (adds a stimulus) vs. **Negative** (removes an aversive stimulus).\n\nThus, buckling your seatbelt to silence a loud car chime is **negative reinforcement**—removing an annoying beep increases buckling!',
        callout: {
          tone: 'pitfall',
          text: '"Negative reinforcement" NEVER means punishment; it means strengthening behavior by taking away something unpleasant.',
        },
      },
      {
        id: 'psy-l5-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Resistance to Extinction Across Schedules',
        predictionPrompt:
          'A slot-like reward game pays out on average every 15 plays unpredictably (variable-ratio) vs. every single press (continuous). Which player persists longest when payouts stop?',
        predictionChoices: [
          'Continuous reward player persists longer',
          'Variable-ratio player persists far longer (partial reinforcement extinction effect)',
          'Both stop after exactly 1 unrewarded trial',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 5, x2: 10, y2: 45 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Observe steady high-rate accumulation across variable ratio responses: because dry spells were normal before, noticing that rewards ended takes much longer.',
        explainPrompt: 'Why do ratio schedules drive faster responding than time-based interval schedules?',
        explainOptions: [
          'In ratio schedules, getting the next reward depends directly on how many responses you emit, so faster effort speeds payoffs.',
          'Interval schedules give more coins per minute.',
          'Animals cannot sense elapsed time.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Variable-ratio schedules generate both the highest steady effort rate AND maximum resistance to extinction.',
      },
      {
        id: 'psy-l5-s3',
        kind: 'worked-example',
        title: 'Decode Real Scenarios Into the 2x2 Quadrant',
        problemMarkdown: 'Classify two classroom consequences:',
        steps: [
          {
            label: 'Excusing top quiz scorers from Friday’s chore',
            expressionOrAction: 'Remove aversive chore -> studying INCREASES -> Negative Reinforcement',
            whyNote: 'Behavior strengthened by taking away something unwanted.',
          },
          {
            label: 'Revoking phone privileges for texting in class',
            expressionOrAction: 'Remove pleasant phone -> texting DECREASES -> Negative Punishment',
            whyNote: 'Behavior weakened by removing a desired stimulus.',
          },
        ],
      },
      {
        id: 'psy-l5-s4',
        kind: 'faded-practice',
        title: 'Classify Schedule Type',
        promptMarkdown:
          'Pop quizzes happen unpredictably throughout the semester so steady weekly studying stays high.',
        completedSteps: [
          'Criterion is elapsed time between quizzes rather than number of flashcard clicks -> Interval (not Ratio).',
          'Exact date varies unpredictably -> Variable (not Fixed).',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which reinforcement schedule keeps pop-quiz study steady without long post-test slumps?',
            options: ['Fixed-interval (FI)', 'Variable-interval (VI)', 'Fixed-ratio (FR)', 'Continuous reinforcement'],
            correct: 1,
            points: 10,
            explanation: 'Unpredictable timing characterizes a variable-interval schedule, avoiding the "scallop" drop right after fixed due dates.',
          },
        },
      },
      {
        id: 'psy-l5-s5',
        kind: 'checkpoint',
        title: 'Verify Negative Reinforcement',
        question: {
          type: 'mcq',
          prompt: 'Taking ibuprofen makes a throbbing headache disappear, so you keep ibuprofen in your bag afterward. This exemplifies:',
          options: ['Positive reinforcement', 'Negative reinforcement', 'Positive punishment', 'Negative punishment'],
          correct: 1,
          points: 10,
          explanation: 'Removing pain (negative) strengthened pill-taking behavior (reinforcement).',
        },
      },
      {
        id: 'psy-l5-s6',
        kind: 'synthesis',
        title: 'Operant Learning Takeaways',
        takeaways: [
          'Reinforcement increases target behavior; punishment decreases it; positive adds stimulus; negative removes stimulus.',
          'Ratio schedules track response counts (fast responding); interval schedules track elapsed time.',
          'Variable schedules resist extinction strongly because non-rewarded streaks feel normal.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'streak-siege', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-neg-reinf',
        front: 'Why is silencing an alarm by getting out of bed negative reinforcement, not punishment?',
        back: 'Removing the unpleasant noise (negative) increases the future frequency of getting up (reinforcement).',
        explanation: 'Always check whether behavior rises or falls AND whether a stimulus was added or removed.',
        interleave: true,
      },
      {
        id: 'psy-fc-vr-extinct',
        front: 'Which partial reinforcement schedule produces high, steady effort and maximum resistance to extinction?',
        back: 'Variable-ratio (VR) schedule.',
        explanation: 'Predictably drives persistence in gambling and stochastic reward tasks.',
        interleave: true,
      },
      {
        id: 'psy-fc-fi-scallop',
        front: 'What behavior pattern characterizes a fixed-interval (FI) schedule like scheduled Friday exams?',
        back: 'A "scallop": low effort right after the deadline followed by accelerating cramming right before the next fixed time.',
        explanation: 'Switching to unannounced checks flattens procrastination troughs.',
        interleave: true,
      },
    ],
  },
  {
    id: 'psy-l6-memory-biases',
    unitId: 'psy-u2-learning-cognition',
    title: 'Memory Reconstruction, Working Capacity & Cognitive Biases',
    summary: 'Examine working memory limits, reconstructive false memories, and judgment heuristics like availability and confirmation bias.',
    estimatedMinutes: 9,
    standards: ['APA Cognition Pillar', 'AP Psych Topics 2.1–2.6'],
    prerequisiteLessonIds: ['psy-l5-operant'],
    steps: [
      {
        id: 'psy-l6-s1',
        kind: 'narrative',
        title: 'Memory Is Reconstruction, Not Video Playback',
        bodyMarkdown:
          'Working memory holds roughly **4 chunks** briefly unless actively rehearsed or meaningfully linked to existing schemas. Worse, retrieving a memory **reconsolidates** it—letting misleading post-event wording silently alter later recall (the **misinformation effect**).\n\nFast intuitive judgment (System 1) leans on heuristics like **availability** (vivid ease of recall) and **confirmation bias** (seeking verifying evidence).',
        callout: {
          tone: 'pitfall',
          text: 'Dramatic news reports inflate perceived risk via the availability heuristic even when base-rate statistics prove another hazard is far deadlier.',
        },
      },
      {
        id: 'psy-l6-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Chunking Gain in Working Memory',
        predictionPrompt:
          'Without chunking, memorizing `1 9 4 5 2 0 0 1 1 9 6 9` exceeds ~7 isolated digits. Grouping them as `1945 - 2001 - 1969` shrinks load to how many chunks?',
        predictionChoices: ['12 chunks still', '3 meaningful year chunks', '24 sub-chunks'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 1, y1: 1, x2: 4, y2: 12 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Notice slope 3–4 items per semantic chunk: linking raw bits into existing long-term knowledge bypasses the narrow ~4-slot working buffer.',
        explainPrompt: 'Why does meaningful chunking require prior long-term memory?',
        explainOptions: [
          'Recognizing `1945` as one unified concept pulls an existing schema out of long-term storage so it occupies only one working-memory pointer.',
          'Chunking shrinks acoustic speech duration.',
          'Long-term memory stores digits backwards.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Expert chess players and programmers hold far more pieces/lines in working memory not from larger raw capacity, but richer domain chunks.',
      },
      {
        id: 'psy-l6-s3',
        kind: 'worked-example',
        title: 'Spot Base-Rate Neglect vs. Representativeness',
        problemMarkdown: 'Jordan loves poetry, wears round glasses, and reads Latin. Is Jordan more likely a classics professor or an office clerk?',
        steps: [
          {
            label: 'Fast stereotype impulse',
            expressionOrAction: 'Jordan matches professor archetype -> Representativeness heuristic',
            whyNote: 'Brain checks similarity to stereotype and ignores group sizes.',
          },
          {
            label: 'Apply base rates',
            expressionOrAction: 'There are 100x more office clerks than classics professors nationally',
            whyNote: 'Even if 1% of clerks love poetry vs. 60% of classics professors, absolute clerk count dominates!',
          },
        ],
      },
      {
        id: 'psy-l6-s4',
        kind: 'faded-practice',
        title: 'Distinguish Proactive vs. Retroactive Interference',
        promptMarkdown: 'In September you learn a new phone PIN (`4821`). Whenever you try to recall your OLD childhood locker code (`1930`), `4821` keeps popping into your head.',
        completedSteps: ['New information (`4821`) is disrupting recall of OLD information (`1930`).'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which interference direction acts backward from new learning onto old memories?',
            options: ['Proactive interference', 'Retroactive interference', 'Encoding specificity', 'Source amnesia'],
            correct: 1,
            points: 10,
            explanation: 'Retroactive = newer learning interferes backward with older memory (P-O: Proactive old blocks new; R-N: Retroactive new blocks old).',
          },
        },
      },
      {
        id: 'psy-l6-s5',
        kind: 'branching-scenario',
        title: 'Design a Double-Blind Police Eyewitness Lineup',
        startNodeId: 'lineup',
        nodes: {
          lineup: {
            promptMarkdown:
              'A witness saw a store theft briefly in dim light. Two officers debate how to present 6 suspects’ photos.',
            choices: [
              {
                label: 'Use a blind administrator (doesn’t know suspect position), sequential photos, and explicit warning "culprit may not be present"',
                nextNodeId: 'feedback',
                feedback: 'Evidence-based gold standard! Eliminates involuntary officer smiles/nods and guards against relative-judgment guessing.',
                outcome: 'optimal',
              },
              {
                label: 'Show all 6 photos together while the lead detective hints "Look closely at #3"',
                nextNodeId: 'lineup',
                feedback: 'Suggestive cues trigger the misinformation effect and inflate confident misidentifications!',
                outcome: 'unsafe',
              },
            ],
          },
          feedback: {
            promptMarkdown: 'Notice how critical immediate non-suggestive questioning is too. What happens if officers praise the witness right after selection ("Great pick!")?',
            choices: [
              {
                label: 'Post-identification feedback artificially inflates later courtroom confidence without improving accuracy—record confidence BEFORE any feedback!',
                nextNodeId: null,
                feedback: 'Spot on! Initial uncontaminated confidence correlates fairly well with accuracy; post-feedback confidence does not.',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'psy-l6-s6',
        kind: 'synthesis',
        title: 'Unit 2 Cognition Takeaways',
        takeaways: [
          'Working memory buffers ~4 chunks; meaningful chunking leverages long-term schemas.',
          'Suggestive post-event cues alter reconsolidated memory (misinformation effect).',
          'Check base rates and falsifying counter-evidence to counter availability, representativeness, and confirmation biases.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-interference',
        front: 'Give a fast mnemonic distinguishing proactive vs. retroactive interference.',
        back: 'PORN: Proactive = Old blocks New; Retroactive = New blocks Old.',
        explanation: 'Changing passwords often triggers proactive interference when typing your old one.',
        interleave: true,
      },
      {
        id: 'psy-fc-availability',
        front: 'What is the availability heuristic?',
        back: 'Estimating how common or likely an event is by how vividly or easily examples come to mind.',
        explanation: 'Explains why sensational rare tragedies feel riskier than mundane everyday hazards.',
        interleave: true,
      },
      {
        id: 'psy-fc-misinfo',
        front: 'What did Loftus’s misinformation-effect studies demonstrate about memory?',
        back: 'Exposure to subtle misleading wording after an event alters the witness’s later memory report itself.',
        explanation: 'Memory behaves like reconstructive editing rather than immutable videotape.',
        interleave: true,
      },
    ],
  },
]

const PSY_U3_LESSONS: PackLesson[] = [
  {
    id: 'psy-l7-psychometrics',
    unitId: 'psy-u3-psychometrics-health',
    title: 'Normal Curves, Z-Scores & Reliability vs. Validity',
    summary: 'Quantify standardized positions on normal psychometric distributions and distinguish test consistency from test accuracy.',
    estimatedMinutes: 8,
    standards: ['APA Cognition/Testing Pillar', 'AP Psych Topic 0.5'],
    prerequisiteLessonIds: ['psy-l6-memory-biases'],
    visual: {
      kind: 'figure-2d',
      figure: { template: 'normal-curve', givens: { mean: 100, sd: 15, x: 130 }, ask: 'zScore', rounding: 'tenth' },
    },
    steps: [
      {
        id: 'psy-l7-s1',
        kind: 'narrative',
        title: 'Standardizing Scores Across Different Scales',
        bodyMarkdown:
          'How do you compare a score of `620` on an SAT math section (`mean=500, sd=100`) to `118` on an IQ scale (`mean=100, sd=15`)? Convert both to **z-scores**: `z = (x - μ) / σ`.\n\nMeanwhile, a broken scale that reads `140 lbs` every time you step on it (when you weigh `155 lbs`) has high **reliability** (consistent) but zero **validity** (inaccurate)!',
        callout: {
          tone: 'key-idea',
          text: 'Reliability is necessary for validity, never sufficient: a test can be consistently wrong (reliable without being valid), never inconsistently accurate!',
        },
      },
      {
        id: 'psy-l7-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Empirical Rule Tail Area',
        predictionPrompt:
          'On a normal curve (`mean = 100, sd = 15`), roughly what percentage of test-takers score ABOVE `130` (`z = +2.0`)?',
        predictionChoices: ['About 16%', 'About 2.3% (half of the outer ~4.6%)', 'About 34%'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: { template: 'normal-curve', givens: { mean: 100, sd: 15, x: 130 }, ask: 'percentile', rounding: 'tenth' },
        },
        observeInstruction:
          'Inspect the shaded bell curve area up to `x = 130` (+2 SD = ~97.7th percentile), leaving roughly ~2.3% in the upper right tail.',
        explainPrompt: 'Why is scoring +2 SD above the mean roughly the 97.7th percentile?',
        explainOptions: [
          'The 68–95–99.7 rule puts ~95% within ±2 SD, leaving ~2.5% in each tail (exact cumulative Φ(2) ≈ 97.7%).',
          'Because z-scores range strictly from 0 to 100.',
          'Negative z-scores are folded above the mean.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Symmetry makes exact percentiles fast: ~50% + ~47.7% ≈ 97.7%, leaving only ~2.3% above `z = +2`.',
      },
      {
        id: 'psy-l7-s3',
        kind: 'worked-example',
        title: 'Compare Test-Retest vs. Construct Validity',
        problemMarkdown: 'Audit a 5-question reaction-time game marketed as an "empathy test":',
        steps: [
          {
            label: 'Test-retest check',
            expressionOrAction: 'Users score within 3 ms week-to-week (r = 0.91)',
            whyNote: 'Scores are highly **reliable** across repeated attempts.',
          },
          {
            label: 'Construct validity check',
            expressionOrAction: 'Zero correlation with peer-rated empathy or clinical inventories',
            whyNote: 'Reaction latency measures motor speed, NOT empathy—lacks **construct validity**.',
          },
        ],
      },
      {
        id: 'psy-l7-s4',
        kind: 'faded-practice',
        title: 'Compute Exact Z-Score from Parametric Curve',
        promptMarkdown: 'Use `z = (x - μ) / σ` on the distribution shown (`x = 70` vs `μ = 100, σ = 15`):',
        completedSteps: ['Deviation: x - μ = 70 - 100 = -30', 'Sign is negative because x lies below the mean.'],
        fadedTarget: {
          type: 'figure',
          question: {
            type: 'figure',
            prompt: 'Compute the z-score for the highlighted score x on the normal distribution shown.',
            figure: {
              template: 'normal-curve',
              givens: { mean: 100, sd: 15, x: 70 },
              ranges: { x: [70, 136] },
              ask: 'zScore',
              rounding: 'tenth',
            },
            points: 10,
            explanation: 'Compute z = (x − μ) / σ using the mean, standard deviation, and highlighted score x shown.',
          },
        },
      },
      {
        id: 'psy-l7-s5',
        kind: 'checkpoint',
        title: 'Can an Unreliable Measure Be Valid?',
        question: {
          type: 'truefalse',
          prompt: 'If a newly invented depression questionnaire produces wildly random scores for the same unchanged person across consecutive days, it can still have high validity.',
          correct: false,
          points: 10,
          explanation: 'False! High measurement noise (low reliability) caps validity—an inconsistent measure cannot track true traits accurately.',
        },
      },
      {
        id: 'psy-l7-s6',
        kind: 'synthesis',
        title: 'Psychometrics Takeaways',
        takeaways: [
          'Convert raw scores via `z = (x - μ) / σ` to compare distributions cleanly.',
          '68–95–99.7 summarizes symmetric normal intervals at ±1, ±2, and ±3 standard deviations.',
          'Reliability checks consistency (test-retest, internal); validity checks whether the test measures the intended construct.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-zscore',
        front: 'Write the z-score formula and state what `z = -1.5` means.',
        back: '`z = (x - μ) / σ`. `z = -1.5` means the score lies 1.5 standard deviations BELOW the mean.',
        explanation: 'Turns raw units into standard-deviation units.',
        interleave: true,
      },
      {
        id: 'psy-fc-rel-val',
        front: 'Give an everyday analogy for high reliability paired with low validity.',
        back: 'A bathroom scale miscalibrated by -12 lbs: repeats the exact same weight consistently (reliable) yet reports the wrong mass (invalid).',
        explanation: 'Reliability = precision/repeatability; validity = accuracy to target construct.',
        interleave: true,
      },
      {
        id: 'psy-fc-689599',
        front: 'Approximately what percentage of scores fall within ±2 SD of a normal distribution mean?',
        back: '~95% (leaving ~2.5% in each tail beyond +2 SD and -2 SD).',
        explanation: 'Core benchmark for clinical cutoffs and percentile rankings.',
        interleave: true,
      },
    ],
  },
  {
    id: 'psy-l8-stress-appraisal',
    unitId: 'psy-u3-psychometrics-health',
    title: 'Stress Appraisal, HPA Axis & Adaptive Coping',
    summary: 'Distinguish threat vs. challenge appraisal in Lazarus’s model and trace SAM vs. slower HPA cortisol pathways.',
    estimatedMinutes: 8,
    standards: ['APA Health & Stress Pillar', 'AP Psych Topic 5.1'],
    prerequisiteLessonIds: ['psy-l7-psychometrics'],
    steps: [
      {
        id: 'psy-l8-s1',
        kind: 'narrative',
        title: 'Stress Depends on Cognitive Appraisal, Not Events Alone',
        bodyMarkdown:
          'Two students face the exact same final exam: one freezes in panic, another feels energized focus. Lazarus & Folkman showed stress flows from **primary appraisal** (*is this dangerous or relevant?*) paired with **secondary appraisal** (*do my coping resources meet the demand?*).\n\nPhysiologically, acute threat sparks the fast sympathetic **SAM** surge (epinephrine in seconds) alongside the slower **HPA axis** (hypothalamus -> pituitary -> adrenal **cortisol**).',
        callout: {
          tone: 'key-idea',
          text: 'Reappraising a racing heart before a speech as "body mobilizing oxygen to help me perform" shifts physiology from threat vasoconstriction toward adaptive challenge.',
        },
      },
      {
        id: 'psy-l8-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Controllability Impact on Coping Fit',
        predictionPrompt:
          'When a stressor is directly changeable (e.g., failing math quizzes because of unclear notes) vs. uncontrollable (awaiting biopsy lab timing), which pairing works best?',
        predictionChoices: [
          'Avoidant denial for both',
          'Problem-focused coping when controllable; adaptive emotion-focused reappraisal while awaiting unchangeable waits',
          'Purely passive venting before fixable exams',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'normal-curve',
            givens: { mean: 50, sd: 10, x: 65 },
            ask: 'zScore',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Notice higher threat appraisal (+1.5 SD) elevates cortisol load; matching coping style to actual controllability brings physiological arousal back toward baseline.',
        explainPrompt: 'Why can rigid problem-focused struggling fail on truly uncontrollable delays?',
        explainOptions: [
          'Pushing relentlessly against zero-control waits spikes frustration without changing timelines; cognitive reframing and relaxation lower distress.',
          'Problem-focused coping only works for physical exercise.',
          'Emotion-focused coping raises adrenaline permanently.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          '"Goodness of fit" pairs problem-solving steps with controllable stressors and healthy emotion regulation (NOT avoidant rumination) with uncontrollable waits.',
      },
      {
        id: 'psy-l8-s3',
        kind: 'worked-example',
        title: 'Map Stress Response Pathways',
        problemMarkdown: 'Compare acute fight-or-flight vs. sustained HPA endocrine signaling:',
        steps: [
          {
            label: 'Fast neural SAM track (seconds)',
            expressionOrAction: 'Sympathetic nerves -> adrenal medulla -> epinephrine/norepinephrine',
            whyNote: 'Dilates bronchi, elevates heart rate, frees blood glucose rapidly.',
          },
          {
            label: 'Slower endocrine HPA axis (minutes–hours)',
            expressionOrAction: 'Hypothalamus (CRH) -> Pituitary (ACTH) -> Adrenal cortex (cortisol)',
            whyNote: 'Sustained high cortisol over months suppresses immune signaling and impairs hippocampal memory.',
          },
        ],
      },
      {
        id: 'psy-l8-s4',
        kind: 'faded-practice',
        title: 'Distinguish Primary vs. Secondary Appraisal',
        promptMarkdown: 'Right after receiving an urgent feedback email, Maya asks herself: "Do I have the skills and office-hour support to rewrite this section by Friday?"',
        completedSteps: [
          'First recognizing the email affects her grade was primary appraisal.',
          'Now Maya is evaluating her tools, time, and social support against the demand.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which step in Lazarus’s transactional stress model is Maya performing right now?',
            options: [
              'Secondary appraisal (evaluating coping resources)',
              'General adaptation exhaustion stage',
              'Primary alarm reflex',
              'Extinction burst',
            ],
            correct: 0,
            points: 10,
            explanation: 'Secondary appraisal weighs coping resources and options relative to perceived task demands.',
          },
        },
      },
      {
        id: 'psy-l8-s5',
        kind: 'checkpoint',
        title: 'Identify the HPA Axis Hormone',
        question: {
          type: 'fill',
          prompt: 'Name the primary glucocorticoid stress hormone secreted by the adrenal cortex during prolonged HPA-axis activation:',
          correct: 'cortisol',
          alternatives: ['Cortisol'],
          points: 10,
          explanation: 'Cortisol mobilizes glucose and regulates inflammation acutely, but chronic elevation harms sleep and immunity.',
        },
      },
      {
        id: 'psy-l8-s6',
        kind: 'synthesis',
        title: 'Stress & Health Takeaways',
        takeaways: [
          'Perceived stress = primary stake appraisal weighed against secondary resource appraisal.',
          'Acute SAM adrenaline fades fast; chronic HPA cortisol erodes sleep, hippocampus, and immunity.',
          'Match problem-focused action to controllable hurdles and cognitive reappraisal to uncontrollable stressors.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'knowledge-bastion', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-appraisal',
        front: 'Contrast Lazarus’s primary vs. secondary stress appraisal.',
        back: 'Primary asks "Is this benign, a threat, or a challenge?"; secondary asks "Do I have the resources/control to cope with it?"',
        explanation: 'High threat + low perceived coping efficacy triggers maximal distress.',
        interleave: true,
      },
      {
        id: 'psy-fc-hpa',
        front: 'List the three organs/glands forming the HPA stress axis.',
        back: 'Hypothalamus -> Pituitary gland -> Adrenal cortex (releasing cortisol).',
        explanation: 'Chronic HPA elevation contributes to allostatic load.',
        interleave: true,
      },
      {
        id: 'psy-fc-coping-fit',
        front: 'When is problem-focused coping preferable vs. emotion-focused reappraisal?',
        back: 'Problem-focused fits controllable problems (fix the schedule); adaptive emotion-focused fits uncontrollable waits (mindful reappraisal).',
        explanation: 'Avoidant procrastination harms both cases.',
        interleave: true,
      },
    ],
  },
  {
    id: 'psy-l9-clinical',
    unitId: 'psy-u3-psychometrics-health',
    title: 'Evidence-Based Therapy & Clinical Evaluation Pitfalls',
    summary: 'Apply CBT cognitive restructuring, exposure inhibitory learning, and scientific evaluation of therapy outcomes.',
    estimatedMinutes: 9,
    standards: ['APA Clinical Pillar', 'AP Psych Topics 5.3–5.5'],
    prerequisiteLessonIds: ['psy-l8-stress-appraisal'],
    steps: [
      {
        id: 'psy-l9-s1',
        kind: 'narrative',
        title: 'Why Uncontrolled Before-After Stories Mislead About Treatments',
        bodyMarkdown:
          'Even an ineffective remedy *looks* effective after an acute crisis because extreme distress tends naturally toward baseline (**regression to the mean**) plus spontaneous recovery and placebo expectation.\n\n**Evidence-based treatments** beat waitlists and active placebos in RCTs: e.g., **CBT** challenges distorted catastrophizing beliefs, and **exposure therapy** extinguishes conditioned avoidance by keeping clients present until fear drops.',
        callout: {
          tone: 'pitfall',
          text: 'Safety avoidance (fleeing right at peak panic) reinforces phobia via negative reinforcement! Exposure works when avoidance is paused long enough for disconfirmation.',
        },
      },
      {
        id: 'psy-l9-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Avoidance Impact During Exposure',
        predictionPrompt:
          'A student afraid of elevators steps out on Floor 1 every single time heart rate rises, swearing "Good thing I escaped before it broke!" What happens to future elevator anxiety?',
        predictionChoices: [
          'Anxiety gradually shrinks each escape',
          'Avoidance negatively reinforces panic and blocks learning that the elevator was actually safe',
          'Heart rate stops rising near stairs',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 42, x2: 20, y2: 12 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Observe the negative slope of anxiety across sustained exposure time (~20 minutes): panic peaks and naturally habituates WITHOUT fleeing once avoidance stops.',
        explainPrompt: 'Why does staying in the feared safe setting change expectancy?',
        explainOptions: [
          'Violation of catastrophe prediction ("I stayed and nothing catastrophic occurred") drives new inhibitory safety learning.',
          'Adrenal glands permanently run out of receptors.',
          'Memory fades after 3 seconds.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Remaining present tests and disconfirms catastrophic beliefs directly—breaking the negative-reinforcement cycle of escape.',
      },
      {
        id: 'psy-l9-s3',
        kind: 'worked-example',
        title: 'Reframe an Automatic Thought in CBT',
        problemMarkdown: 'Apply CBT ABC analysis to: "I stumbled over one slide—everyone knows I’m completely incompetent!"',
        steps: [
          {
            label: 'Identify cognitive distortion',
            expressionOrAction: 'All-or-nothing thinking + overgeneralization + mind reading',
            whyNote: 'Turns one isolated 5-second slip into global permanent failure.',
          },
          {
            label: 'Gather objective evidence',
            expressionOrAction: 'Audience asked engaged questions and clapped at conclusion',
            whyNote: 'Tests catastrophic prediction against real behavioral evidence.',
          },
          {
            label: 'Generate balanced alternative',
            expressionOrAction: '"I rushed slide 3, recovered smoothly, and most listeners stayed engaged."',
            whyNote: 'Realistic (not toxic positivity) appraisal drops acute shame.',
          },
        ],
      },
      {
        id: 'psy-l9-s4',
        kind: 'faded-practice',
        title: 'Spot Regression to the Mean',
        promptMarkdown:
          'Patients tend to start a brand-new supplement right during their worst pain flare-up of the year. Two weeks later, pain improves slightly.',
        completedSteps: [
          'Extreme pain flare-ups fluctuate naturally around a patient’s longer-term average.',
          'Waitlist patients measured on peak flare days also show average improvement 2 weeks later.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which statistical artifact explains natural symptom easing after seeking care at an extreme peak?',
            options: ['Regression to the mean', 'Proactive interference', 'Fixed-ratio scalloping', 'Confirmation bias only'],
            correct: 0,
            points: 10,
            explanation: 'Extreme initial measurements naturally move back toward average on re-test even without causal treatment effects.',
          },
        },
      },
      {
        id: 'psy-l9-s5',
        kind: 'branching-scenario',
        title: 'Triage Evidence-Based Treatment Selection',
        startNodeId: 'intake',
        nodes: {
          intake: {
            promptMarkdown:
              'A client seeks therapy after developing a specific fear of driving over highway bridges following a minor fender-bender. No psychosis or mania is present.',
            choices: [
              {
                label: 'Design a gradual hierarchical exposure plan (bridge photos -> passenger crossing -> short daytime crossing without fleeing) paired with CBT thought records',
                nextNodeId: 'followup',
                feedback: 'First-line gold-standard match! Graduated exposure + cognitive restructuring carries strongest RCT support for specific situational phobias.',
                outcome: 'optimal',
              },
              {
                label: 'Advise permanently rerouting 45 minutes longer around all bridges so panic never occurs',
                nextNodeId: 'intake',
                feedback: 'Total avoidance comforts briefly today while locking in and expanding the phobia long term.',
                outcome: 'unsafe',
              },
            ],
          },
          followup: {
            promptMarkdown: 'Halfway across a small overpass, client urges you to let them turn around at peak 7/10 distress. How should therapist guide them?',
            choices: [
              {
                label: 'Coach slow breathing and test their prediction while safely finishing the short crossing so habituation/safety learning takes hold',
                nextNodeId: null,
                feedback: 'Exact exposure principle: staying through peak uncertainty teaches the amygdala the bridge is safe!',
                outcome: 'optimal',
              },
              {
                label: 'Abort immediately every time anxiety exceeds 4/10',
                nextNodeId: null,
                feedback: 'Turning back at peak fear pairs bridge exits with sudden relief—unintentionally reinforcing avoidance.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'psy-l9-s6',
        kind: 'synthesis',
        title: 'Unit 3 Clinical Science Takeaways',
        takeaways: [
          'Compare treatments against active controls in RCTs to avoid regression to the mean and placebo artifacts.',
          'Exposure treats avoidance-driven fears by violating catastrophic expectations while skipping escape.',
          'CBT combines behavioral experiments with evidence-tested cognitive reappraisal.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'boss-raid', packId: 'intro-psychology' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'psy-fc-exposure',
        front: 'Why does fleeing at peak anxiety during exposure worsen a phobia?',
        back: 'Instant relief upon escaping negatively reinforces avoidance and prevents inhibitory safety learning.',
        explanation: 'Staying safely until anxiety subsides disconfirms feared catastrophe.',
        interleave: true,
      },
      {
        id: 'psy-fc-cbt',
        front: 'What are the twin pillars of Cognitive Behavioral Therapy (CBT)?',
        back: 'Identifying and re-evaluating distorted automatic thoughts (cognitive) alongside testing avoidance/activity behaviors in real life (behavioral).',
        explanation: 'Supported across anxiety, depression, and insomnia RCTs.',
        interleave: true,
      },
      {
        id: 'psy-fc-regression-mean',
        front: 'How can regression to the mean fool observers about an unproven therapy?',
        back: 'People seek help at peak crisis symptoms; subsequent random fluctuation back toward average looks like treatment success unless compared to an untreated control.',
        explanation: 'Always check randomized control trajectories.',
        interleave: true,
      },
    ],
  },
]

const PSY_UNITS: TrackUnit[] = [
  {
    id: 'psy-u1-methods-bio',
    title: 'Unit 1: Research Methods & Synaptic Biology',
    anchoringPhenomenon: 'How does an electrical nerve impulse turn into chemical mood and learning shifts across synapses?',
    lessons: PSY_U1_LESSONS,
    capstoneQuizIndex: 0,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'psy-u2-learning-cognition',
    title: 'Unit 2: Conditioning, Memory & Cognitive Heuristics',
    anchoringPhenomenon: 'Why can two honest witnesses swear confidently to opposite details of the same event?',
    lessons: PSY_U2_LESSONS,
    capstoneQuizIndex: 1,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'psy-u3-psychometrics-health',
    title: 'Unit 3: Psychometrics, Stress & Clinical Science',
    anchoringPhenomenon: 'Why can reframing a pounding heart transform dread into focused performance?',
    lessons: PSY_U3_LESSONS,
    capstoneQuizIndex: 2,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 },
  },
]

const PSY_TRACK: CurriculumTrack = {
  id: 'track-intro-psychology',
  slug: 'intro-psychology',
  packId: 'intro-psychology',
  title: 'Introduction to Psychology & Mind Science',
  category: 'Science',
  subject: 'Psychology',
  gradeBand: 'College-Intro',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original (MIT)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: PSY_UNITS,
}

const PSY_PACK: ContentPack = {
  id: 'intro-psychology',
  name: 'Intro to Psychology: Brain, Learning & Mind',
  description:
    'Experimental design, 3D synaptic transmission & pharmacology, classical/operant conditioning, memory heuristics, normal-curve psychometrics, and clinical science.',
  subject: 'Psychology',
  category: 'Science',
  icon: '🧠',
  modelId: 'synapse-neuro',
  standards: 'APA IPI Introductory Psychology Pillars · AP Psychology',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original (MIT)',
  srsInterleave: true,
  gradeBand: 'College-Intro',
  prerequisitePackIds: [],
  track: PSY_TRACK,
  units: PSY_UNITS,
  quizzes: [
    {
      title: 'Unit 1: Research Design & Neural Synapses',
      description: 'Confounds, random assignment, action potentials, and neurotransmitter reuptake.',
      subject: 'Psychology',
      difficulty: 'easy',
      timeLimitSec: 480,
      modelId: 'synapse-neuro',
      lessonId: 'psy-l3-neurotransmitters',
      questions: [
        {
          type: 'mcq',
          prompt: 'Which procedure allows a study to infer CAUSATION rather than mere correlation?',
          options: [
            'Surveying 10,000 random voters',
            'Randomly assigning participants to experimental vs. control groups',
            'Calculating a Pearson r above 0.70',
            'Using convenience snowball sampling',
          ],
          correct: 1,
          points: 10,
          explanation: 'Random assignment balances confounding individual differences across groups before the IV is applied.',
        },
        {
          type: 'truefalse',
          prompt: 'Stronger physical stimuli increase the amplitude (peak millivolts) of each individual action potential along an axon.',
          correct: false,
          points: 10,
          explanation: 'False! Action potentials are all-or-none; stronger stimuli encode intensity via higher firing frequency (Hz).',
        },
        {
          type: 'fill',
          prompt: 'Name the positively charged ion (`Ca2+` / name) whose influx at the axon terminal triggers synaptic vesicle release:',
          correct: 'calcium',
          alternatives: ['Ca2+', 'Ca', 'calcium ions'],
          points: 10,
          explanation: 'Voltage-gated calcium entry mediates vesicle fusion with the presynaptic membrane.',
        },
        {
          type: 'mcq',
          prompt: 'A selective reuptake inhibitor acts on a synapse primarily by:',
          options: [
            'Slowing transporter clearance so released neurotransmitter stays active in the cleft longer',
            'Destroying post-synaptic receptors permanently',
            'Stripping myelin off axons',
            'Turning GABA into glutamate',
          ],
          correct: 0,
          points: 10,
          explanation: 'Blocking reuptake transporters prolongs cleft occupancy and receptor binding at the same presynaptic firing rate.',
        },
        {
          type: 'order',
          prompt: 'Sequence these events in synaptic transmission from earliest to latest:',
          options: [
            'Neurotransmitter diffuses across synaptic cleft',
            'Action potential depolarizes axon terminal',
            'Ligand binds post-synaptic ion channel',
            'Ca2+ influx triggers vesicle exocytosis',
          ],
          correct: [1, 3, 0, 2],
          points: 15,
          explanation: 'AP arrival -> Ca2+ entry & exocytosis -> cleft diffusion -> receptor binding.',
        },
        {
          type: 'mcq',
          prompt: 'In a double-blind drug study, who is unaware of whether a capsule is active medicine or placebo?',
          options: [
            'Only the patient',
            'Only the pharmacist who mixed it',
            'Both the participant and the research team collecting outcomes',
            'Only statistical software',
          ],
          correct: 2,
          points: 10,
          explanation: 'Blinding both sides controls placebo expectancy and experimenter scoring bias.',
        },
        {
          type: 'mcq',
          prompt: 'Warm weather boosts both lemonade purchases and sunburns, creating a correlation between them. Weather is a:',
          options: ['Third-variable confound', 'Dependent variable', 'Double-blind placebo', 'Random assignment artifact'],
          correct: 0,
          points: 10,
          explanation: 'A third-variable confound drives changes in two observed variables simultaneously.',
        },
        {
          type: 'truefalse',
          prompt: 'Antagonists bind to receptors and trigger full ion-channel activation identical to the natural neurotransmitter.',
          correct: false,
          points: 10,
          explanation: 'False! That describes a direct agonist; antagonists occupy and block receptors without activating them.',
        },
      ],
    },
    {
      title: 'Unit 2: Conditioning, Memory & Cognitive Heuristics',
      description: 'Classical/operant learning quadrants, schedules, interference, and heuristics.',
      subject: 'Psychology',
      difficulty: 'medium',
      timeLimitSec: 540,
      modelId: 'synapse-neuro',
      lessonId: 'psy-l6-memory-biases',
      questions: [
        {
          type: 'mcq',
          prompt: 'Buckling your car seatbelt stops an annoying dashboard chime, making you buckle immediately next trip. This is:',
          options: ['Positive reinforcement', 'Negative reinforcement', 'Positive punishment', 'Negative punishment'],
          correct: 1,
          points: 10,
          explanation: 'Removing an aversive tone (negative) strengthens seatbelt buckling (reinforcement).',
        },
        {
          type: 'mcq',
          prompt: 'Which reinforcement schedule produces steady rapid behavior and highest resistance to extinction?',
          options: ['Continuous reinforcement', 'Fixed-interval', 'Fixed-ratio', 'Variable-ratio'],
          correct: 3,
          points: 10,
          explanation: 'Variable-ratio payoffs keep responding high because dry streaks resemble normal unpredictable gaps.',
        },
        {
          type: 'fill',
          prompt: 'After classical extinction, the sudden reappearance of a conditioned response following a rest delay is called ______ recovery.',
          correct: 'spontaneous',
          alternatives: ['Spontaneous'],
          points: 10,
          explanation: 'Spontaneous recovery shows extinction suppresses rather than erases the CS–US link.',
        },
        {
          type: 'truefalse',
          prompt: 'Retroactive interference occurs when older previously learned knowledge blocks you from remembering newly studied material.',
          correct: false,
          points: 10,
          explanation: 'False! Old blocking new is PROACTIVE interference; retroactive interference is NEW blocking OLD.',
        },
        {
          type: 'mcq',
          prompt: 'Overestimating shark-attack odds after seeing viral beach footage illustrates the:',
          options: ['Availability heuristic', 'Anchoring effect only', 'Encoding specificity', 'Source monitoring success'],
          correct: 0,
          points: 10,
          explanation: 'The availability heuristic judges likelihood by how vividly examples come to mind.',
        },
        {
          type: 'order',
          prompt: 'Order Atkinson-Shiffrin information processing stages from initial sensory capture to durable retrieval:',
          options: [
            'Short-term / Working memory (~4 chunks)',
            'Long-term storage consolidation',
            'Sensory register (iconic/echoic buffer)',
            'Retrieval back into active awareness',
          ],
          correct: [2, 0, 1, 3],
          points: 15,
          explanation: 'Sensory input -> attended working memory -> encoded/consolidated long-term memory -> retrieved later.',
        },
        {
          type: 'mcq',
          prompt: 'Why did chunking `1945 2001 1969` improve immediate span over 12 random digits?',
          options: [
            'It enlarges raw brain volume instantaneously',
            'It groups digits into 3 familiar long-term schemas occupying far fewer working-memory slots',
            'It disables auditory interference',
            'It switches memory from hippocampus to cerebellum',
          ],
          correct: 1,
          points: 10,
          explanation: 'Meaningful chunking leverages existing long-term knowledge to compress working-memory load.',
        },
        {
          type: 'mcq',
          prompt: 'After a car crash study uses "smashed into" instead of "contacted," witnesses falsely recall broken glass. This illustrates:',
          options: ['Misinformation effect', 'State-dependent retrieval', 'Blocking', 'Spontaneous recovery'],
          correct: 0,
          points: 10,
          explanation: 'Post-event misleading wording alters reconstructed memory reports.',
        },
      ],
    },
    {
      title: 'Unit 3: Psychometrics, Stress & Clinical Science',
      description: 'Parametric normal-curve z-scores & percentiles, HPA stress pathways, CBT, and exposure therapy.',
      subject: 'Psychology',
      difficulty: 'hard',
      timeLimitSec: 600,
      modelId: 'synapse-neuro',
      lessonId: 'psy-l9-clinical',
      questions: [
        {
          type: 'figure',
          prompt: 'For the standardized psychometric distribution shown, compute the z-score of the highlighted score x (round to nearest tenth).',
          figure: {
            template: 'normal-curve',
            givens: { mean: 100, sd: 15, x: 130 },
            ranges: { mean: [95, 105], x: [70, 135] },
            ask: 'zScore',
            rounding: 'tenth',
          },
          points: 15,
          explanation: 'Apply z = (x − μ) / σ using the mean μ, SD σ, and score x displayed on the curve.',
        },
        {
          type: 'figure',
          prompt: 'Estimate the percentile (%) at or below the highlighted score x on this normal distribution (round to nearest tenth).',
          figure: {
            template: 'normal-curve',
            givens: { mean: 50, sd: 10, x: 60 },
            ranges: { x: [30, 75] },
            ask: 'percentile',
            rounding: 'tenth',
          },
          points: 15,
          explanation: 'Find z = (x − μ) / σ and read cumulative normal probability Φ(z) as a percentage.',
        },
        {
          type: 'mcq',
          prompt: 'A personality questionnaire yields nearly identical scores week-to-week (`r = 0.94`), yet fails to predict real behavior or related clinical diagnoses. It has:',
          options: [
            'High validity, low reliability',
            'High reliability, poor construct validity',
            'Neither reliability nor validity',
            'High external validity only',
          ],
          correct: 1,
          points: 10,
          explanation: 'Consistency over time shows test-retest reliability without guaranteeing the test measures the intended trait.',
        },
        {
          type: 'fill',
          prompt: 'Chronic activation of the Hypothalamus-Pituitary-Adrenal (HPA) axis elevates adrenal release of the hormone ______.',
          correct: 'cortisol',
          alternatives: ['Cortisol'],
          points: 10,
          explanation: 'Cortisol mediates slower sustained stress signaling along the HPA endocrine cascade.',
        },
        {
          type: 'mcq',
          prompt: 'In Lazarus’s transactional model, judging "Do I have the resources and strategies to handle this demand?" is:',
          options: ['Primary appraisal', 'Secondary appraisal', 'General exhaustion', 'Operant extinction'],
          correct: 1,
          points: 10,
          explanation: 'Primary appraisal assesses stakes/threat; secondary appraisal evaluates coping resources.',
        },
        {
          type: 'truefalse',
          prompt: 'Leaving an anxiety-provoking setting immediately at peak fear weakens future phobic anxiety faster than staying until fear settles.',
          correct: false,
          points: 10,
          explanation: 'False! Immediate escape negatively reinforces avoidance and preserves the catastrophic fear belief.',
        },
        {
          type: 'mcq',
          prompt: 'Chronic knee-pain sufferers try a placebo wristband only during their worst flare day of the month and feel slightly better 10 days later. What artifact explains this even without placebo belief?',
          options: ['Regression to the mean', 'Stimulus generalization', 'Fixed-ratio scalloping', 'Mood-congruent memory'],
          correct: 0,
          points: 10,
          explanation: 'Extreme peak scores naturally drift back toward an individual’s average on re-measurement.',
        },
        {
          type: 'order',
          prompt: 'Sequence the neuroendocrine cascade of the HPA stress response from brain trigger to target hormone:',
          options: [
            'Adrenal cortex secretes cortisol into bloodstream',
            'Pituitary gland releases ACTH',
            'Hypothalamus releases CRH',
            'Perceived threat activates appraisal circuits',
          ],
          correct: [3, 2, 1, 0],
          points: 15,
          explanation: 'Threat appraisal -> Hypothalamus (CRH) -> Anterior Pituitary (ACTH) -> Adrenal cortex (cortisol).',
        },
      ],
    },
  ],
}

// ── 19. PERSONAL FINANCE LITERACY ─────────────────────────────────────────────

const FIN_U1_LESSONS: PackLesson[] = [
  {
    id: 'fin-l1-paychecks',
    unitId: 'fin-u1-paychecks-budget',
    title: 'Paychecks, FICA & Progressive Tax Brackets',
    summary: 'Decode gross vs. net pay stubs, FICA payroll taxes, and why crossing into a higher tax bracket never lowers take-home pay.',
    estimatedMinutes: 8,
    standards: ['Jump$tart Earning Income 12-4', 'CEE Earning Income'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'fin-l1-s1',
        kind: 'narrative',
        title: 'Gross Pay Is NOT What Hits Your Bank Account',
        bodyMarkdown:
          'Your offer letter states **gross pay**. Before direct deposit arrives as **net pay**, employers withhold **FICA** payroll taxes (6.2% Social Security + 1.45% Medicare = 7.65%), federal/state **progressive income taxes**, and optional benefits (401k, health premiums).\n\nMost importantly, US income brackets are **marginal**: only dollars *above* a bracket threshold face the higher rate—never your entire paycheck!',
        callout: {
          tone: 'pitfall',
          text: 'Turning down a raise "so a higher tax bracket won’t shrink my take-home pay" is a myth: your prior bracket dollars stay taxed at the exact same lower rates.',
        },
      },
      {
        id: 'fin-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Net Impact of Stepping Into the Next Bracket',
        predictionPrompt:
          'Suppose Bracket A taxes taxable income up to $45,000 at 12%, and Bracket B taxes taxable dollars OVER $45,000 at 22%. If your taxable salary rises from $45,000 to $46,000, what happens to your total tax bill?',
        predictionChoices: [
          'All $46,000 suddenly gets taxed at 22% ($10,120 tax), leaving LESS after-tax income',
          'Only the extra $1,000 gets taxed at 22% (+$220 tax), so net after-tax income STILL rises by $780',
          'Taxes drop to zero for the extra $1,000',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 40, y1: 4.8, x2: 50, y2: 6.5 },
            ask: 'slope',
            rounding: 'hundredth',
          },
        },
        observeInstruction:
          'Compare slopes across bracket boundaries: the marginal slope increases strictly on income slices BEYOND $45,000, so after-tax income remains strictly upward-sloping.',
        explainPrompt: 'What distinguishes marginal tax rate from effective tax rate?',
        explainOptions: [
          'Marginal rate applies only to your top slice of taxable dollars; effective rate equals total tax divided by total taxable income.',
          'Effective rate is always higher than marginal rate.',
          'Marginal rate ignores deductions completely.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Because lower slices fill the 10% and 12% buckets first, your effective (average) tax rate is ALWAYS lower than your top marginal bracket.',
      },
      {
        id: 'fin-l1-s3',
        kind: 'worked-example',
        title: 'Compute Take-Home Pay From a Sample Biweekly Stub',
        problemMarkdown: 'Gross biweekly pay = `$2,000`. Calculate net pay with pre-tax retirement and withholdings:',
        steps: [
          {
            label: '1. Pre-tax 401(k) contribution (5%)',
            expressionOrAction: '$2,000 × 0.05 = $100 -> federal taxable wage drops to $1,900',
            whyNote: 'Traditional 401(k) contributions reduce current federal income tax withholding (though FICA still applies to $2,000).',
          },
          {
            label: '2. FICA payroll withholdings (7.65% of $2,000)',
            expressionOrAction: '$2,000 × 0.0765 = $153.00',
            whyNote: '6.2% Social Security + 1.45% Medicare.',
          },
          {
            label: '3. Subtract withheld income tax ($190)',
            expressionOrAction: '$2,000 − $100 − $153 − $190 = $1,557 net direct deposit',
            whyNote: 'Plan monthly bills around `$1,557 × 2 = $3,114`, never around $4,000 gross!',
          },
        ],
      },
      {
        id: 'fin-l1-s4',
        kind: 'faded-practice',
        title: 'Calculate Effective Rate Across Two Brackets',
        promptMarkdown: 'Taxable income = `$20,000`: first `$10,000` taxed at `10%`, next `$10,000` taxed at `12%`.',
        completedSteps: [
          'Bracket 1 tax = $10,000 × 0.10 = $1,000',
          'Bracket 2 tax = $10,000 × 0.12 = $1,200',
          'Total tax = $2,200 on $20,000 taxable income',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'What is the effective (average) tax rate in percent? (number only, e.g. 15)',
            correct: '11',
            alternatives: ['11%', '11.0', '11.0%'],
            points: 10,
            explanation: '$2,200 / $20,000 = 0.11 = 11%, strictly below the 12% top marginal bracket.',
          },
        },
        misconceptionHints: {
          '12': '12% only hit the upper half; average across both slices is 11%.',
          '22': 'Never add two marginal bracket percentages together!',
        },
      },
      {
        id: 'fin-l1-s5',
        kind: 'checkpoint',
        title: 'Spot W-4 Withholding vs. Tax Liability',
        question: {
          type: 'truefalse',
          prompt: 'Receiving a huge $4,000 tax refund every April means you earned free bonus money rather than getting back your own over-withheld interest-free loan.',
          correct: false,
          points: 10,
          explanation: 'False! A large refund simply returns excess cash over-withheld from your own paychecks across the year at 0% interest.',
        },
      },
      {
        id: 'fin-l1-s6',
        kind: 'synthesis',
        title: 'Paycheck & Bracket Takeaways',
        takeaways: [
          'Build monthly budgets on NET take-home pay after FICA (7.65%), income withholdings, and benefit deductions.',
          'Higher marginal brackets apply ONLY to additional dollars above each bracket threshold.',
          'A large April refund usually signals over-withholding during the year—cash that could have sat in high-yield savings or paid off debt.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-marginal-eff',
        front: 'Distinguish marginal tax rate from effective tax rate.',
        back: 'Marginal rate is the tax on your next dollar earned; effective rate is total tax paid divided by total taxable income.',
        explanation: 'Marginal rates always only affect dollars inside each upper slice.',
        interleave: true,
      },
      {
        id: 'fin-fc-fica',
        front: 'What two employee payroll deductions make up the standard 7.65% FICA withholding?',
        back: 'Social Security (6.2%) + Medicare (1.45%).',
        explanation: 'Deducted from gross wages before computing take-home pay.',
        interleave: true,
      },
      {
        id: 'fin-fc-pretax',
        front: 'How does contributing to a traditional pre-tax 401(k) affect federal income tax withholding today?',
        back: 'It lowers your taxable wage base today (taxes are paid later upon retirement withdrawal).',
        explanation: 'Roth contributions conversely use after-tax dollars today for tax-free qualified growth.',
        interleave: true,
      },
    ],
  },
  {
    id: 'fin-l2-budgeting',
    unitId: 'fin-u1-paychecks-budget',
    title: 'Zero-Based & 50/30/20 Cash-Flow Budgeting',
    summary: 'Track fixed needs, flexible wants, and savings velocity cleanly using net monthly take-home benchmarks.',
    estimatedMinutes: 8,
    standards: ['Jump$tart Spending 12-1', 'CFPB Building Savings Habit'],
    prerequisiteLessonIds: ['fin-l1-paychecks'],
    steps: [
      {
        id: 'fin-l2-s1',
        kind: 'narrative',
        title: 'Budgets Fail When Variable "Sinking" Bills Surprise You',
        bodyMarkdown:
          'One helpful rule of thumb splits **net** income into **50% Needs** (housing, utilities, groceries, minimum debt, transit), **30% Wants**, and **20% Savings/Extra Debt Payoff**.\n\nEven better: convert irregular annual bills (car insurance, textbooks, holiday travel) into monthly **sinking funds** (`Annual Cost / 12`) so non-monthly expenses stop wrecking single months.',
        callout: {
          tone: 'key-idea',
          text: 'Pay yourself first via automatic paycheck transfer on payday—relying on "saving whatever is left on Day 30" leaves near zero.',
        },
      },
      {
        id: 'fin-l2-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Monthly Savings Trajectory',
        predictionPrompt:
          'Starting with `$400` in savings and automating `$250/month` into a reserve account (`y = 400 + 250x`), what balance sits after `8 months` (before interest)?',
        predictionChoices: ['$2,000', '$2,400', '$3,200'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 4, x2: 8, y2: 24 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Notice on this $hundreds-scale line: slope `2.5` ($250/month saved) and starting y-intercept `4` ($400)—steady automated transfers map a straight positive trajectory toward an emergency buffer.',
        explainPrompt: 'What does the y-intercept represent on a savings accumulation graph?',
        explainOptions: [
          'Your starting cash balance on Day 0 before monthly deposits accrue.',
          'Total interest earned after 10 years.',
          'Monthly housing rent expense.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Slope equals monthly net cash surplus saved; y-intercept equals initial reserve balance.',
      },
      {
        id: 'fin-l2-s3',
        kind: 'worked-example',
        title: 'Build a Sinking-Fund Line Item',
        problemMarkdown: 'Alex takes home `$3,200/month`. Handle `$1,200` semi-annual car insurance + `$600` annual device replacement:',
        steps: [
          {
            label: 'Total irregular annual cost',
            expressionOrAction: '($1,200 × 2) + $600 = $3,000/year',
            whyNote: 'Both bills are predictable even though they don’t arrive monthly.',
          },
          {
            label: 'Monthly sinking-fund transfer',
            expressionOrAction: '$3,000 / 12 = $250/month into tagged sub-account',
            whyNote: 'Turns sudden $1,200 shocks into smooth predictable $250 line items.',
          },
        ],
      },
      {
        id: 'fin-l2-s4',
        kind: 'faded-practice',
        title: 'Apply the 50/30/20 Net Guideline',
        promptMarkdown: 'Net monthly take-home pay is `$3,500`. Current fixed Needs total `$1,900`, Wants `$1,100`, Savings `$500`.',
        completedSteps: [
          '50% Needs target = $1,750 (actual $1,900 is $150 over)',
          '20% Savings target = $700 (actual $500 is $200 short)',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'Under exact 50/30/20 targets on `$3,500` net pay, how many dollars maximum are budgeted for Wants (`30%`)?',
            correct: '1050',
            alternatives: ['$1050', '$1,050', '1,050'],
            points: 10,
            explanation: '0.30 × $3,500 = $1,050 for discretionary Wants.',
          },
        },
        misconceptionHints: {
          '700': '$700 is the 20% savings target; check 30% for Wants.',
        },
      },
      {
        id: 'fin-l2-s5',
        kind: 'checkpoint',
        title: 'Distinguish Needs vs. Wants',
        question: {
          type: 'mcq',
          prompt: 'Which budget adjustment most reliably increases monthly savings WITHOUT creating rebound binge spending?',
          options: [
            'Automate a fixed savings transfer on payday and trim high-cost recurring fixed bills (housing/car/subscriptions)',
            'Cut grocery budget to $40/month and hope willpower holds',
            'Pay every bill on a credit card without tracking balances',
            'Skip all auto insurance',
          ],
          correct: 0,
          points: 10,
          explanation: 'Automating savings and lowering large recurring fixed commitments beat fragile willpower cuts.',
        },
      },
      {
        id: 'fin-l2-s6',
        kind: 'synthesis',
        title: 'Budgeting Takeaways',
        takeaways: [
          '50/30/20 benchmarks Net pay: 50% essential Needs, 30% Wants, 20% Savings/extra debt payoff.',
          'Convert predictable annual/semi-annual bills into monthly sinking funds (`Cost / 12`).',
          'Automate savings transfers immediately on payday ("pay yourself first").',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'cloze-workbench', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-503020',
        front: 'What does the 50/30/20 budgeting framework allocate each percentage of NET income to?',
        back: '50% Needs (housing, basic groceries, utilities, minimum debt), 30% Wants, 20% Savings & extra debt repayment.',
        explanation: 'Provides an adaptive starting diagnostic rather than rigid perfection.',
        interleave: true,
      },
      {
        id: 'fin-fc-sinking',
        front: 'What is a "sinking fund" in personal cash-flow management?',
        back: 'Saving a small monthly fraction (`annual cost / 12`) into a separate reserve for predictable irregular expenses like insurance or car tags.',
        explanation: 'Prevents foreseeable annual expenses from counting as emergencies.',
        interleave: true,
      },
      {
        id: 'fin-fc-pay-first',
        front: 'Why does "pay yourself first" beat saving leftover money at month-end?',
        back: 'Automated payday transfers lock in savings immediately before lifestyle drift consumes available checking balance.',
        explanation: 'Harnesses default bias constructively.',
        interleave: true,
      },
    ],
  },
  {
    id: 'fin-l3-emergency-fund',
    unitId: 'fin-u1-paychecks-budget',
    title: 'Emergency Reserves, Liquidity & Shock Resilience',
    summary: 'Size a starter vs. full emergency fund, pick liquid FDIC-insured accounts, and navigate unexpected financial shocks cleanly.',
    estimatedMinutes: 8,
    standards: ['Jump$tart Saving 12-1', 'FDIC Money Smart Checking/Saving'],
    prerequisiteLessonIds: ['fin-l2-budgeting'],
    steps: [
      {
        id: 'fin-l3-s1',
        kind: 'narrative',
        title: 'Why an Emergency Fund Belongs in Cash—Not Volatile Stocks',
        bodyMarkdown:
          'Emergency cash serves one mission: **instant loss-free liquidity when income drops or an essential car/medical repair hits**. Keep 3–6 months of *essential Needs* in an **FDIC/NCUA-insured High-Yield Savings Account (HYSA)**—never in volatile equities that crash during recessions right when layoffs rise.',
        callout: {
          tone: 'pitfall',
          text: 'Payday loans often carry 300%–400% effective APR fees—making a tiny $1,000 starter buffer the highest-return protection a household can build.',
        },
      },
      {
        id: 'fin-l3-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Target Size: Gross Income vs. Essential Burn',
        predictionPrompt:
          'Jordan earns `$4,000/mo` net, pays `$2,400/mo` in essential Needs (rent, utilities, food, minimums), and spends `$1,000/mo` on travel/dining Wants. What should a 4-month emergency fund hold?',
        predictionChoices: ['$16,000 (4 × gross/net)', '$9,600 (4 × $2,400 essential expenses)', '$4,000'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 0, x2: 4, y2: 9.6 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Inspect the slope of `2.4` ($2.4k/month essential burn): in an emergency you pause travel/dining Wants, so sizing reserves by essential survival expenses hits safety sooner!',
        explainPrompt: 'Why size emergency reserves around essential monthly needs rather than peak lifestyle spend?',
        explainOptions: [
          'During job loss or medical leave, discretionary Wants scale down quickly, letting 3–6 months of core expenses stretch further with smaller idle cash.',
          'Banks ban accounts exceeding 4× essential needs.',
          'Stocks guarantee positive weekly returns during job loss.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Sizing 3–6 months around core Needs hits resilience months faster without over-holding low-yield cash.',
      },
      {
        id: 'fin-l3-s3',
        kind: 'worked-example',
        title: 'Compare Account Vehicles for Emergency Reserves',
        problemMarkdown: 'Rank liquidity, safety, and yield across three places to park `$6,000`:',
        steps: [
          {
            label: 'Option A: High-Yield Savings (FDIC/NCUA)',
            expressionOrAction: 'Instant/1-day ACH transfer, insured up to $250k, competitive APY',
            whyNote: 'Ideal blend: zero principal crash risk + quick liquidity + interest beating idle checking.',
          },
          {
            label: 'Option B: S&P 500 stock index fund',
            expressionOrAction: 'Can drop 30% in a recession the same week you lose overtime hours',
            whyNote: 'Correlated downturn risk violates emergency liquidity!',
          },
          {
            label: 'Option C: 5-year illiquid CD with steep penalty',
            expressionOrAction: 'Early withdrawal forfeits months of interest',
            whyNote: 'Penalty friction punishes the exact day an emergency strikes.',
          },
        ],
      },
      {
        id: 'fin-l3-s4',
        kind: 'faded-practice',
        title: 'Avoid the Payday Loan Fee Spiral',
        promptMarkdown: 'A store charges a flat `$60` fee to borrow `$400` for `14 days` until next payday.',
        completedSteps: [
          '2-week cost = $60 / $400 = 15% over just 14 days!',
          'There are ~26 fourteen-day periods in a year (`365 / 14 ≈ 26.07`).',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'Using `15% × 26 periods`, approximately what annualized APR (%) is that `$60` two-week fee? (nearest whole integer)',
            correct: '390',
            alternatives: ['391', '390%', '391%'],
            points: 10,
            explanation: '15% × 26 = 390% APR (~391% exact using 365/14)!',
          },
        },
      },
      {
        id: 'fin-l3-s5',
        kind: 'branching-scenario',
        title: 'Car Brake Repair Shock ($850 Needed Today)',
        startNodeId: 'repair',
        nodes: {
          repair: {
            promptMarkdown:
              'Your daily commute car needs `$850` brake work immediately. You currently have `$1,400` in an HYSA emergency buffer, `$0` credit card balance (22% APR), and a payday storefront nearby.',
            choices: [
              {
                label: 'Withdraw $850 from your HYSA emergency fund, pay cash/debit, and temporarily divert Wants toward rebuilding back to $1,400',
                nextNodeId: 'rebuild',
                feedback: 'Textbook success! That is literally why emergency buffers exist—zero 22% interest, zero payday fees.',
                outcome: 'optimal',
              },
              {
                label: 'Keep the HYSA untouched "just in case" and carry $850 on a 22% APR credit card over 6 months',
                nextNodeId: 'repair',
                feedback: 'Holding 4% APY cash while paying 22% APR credit interest loses ~18% net guaranteed!',
                outcome: 'suboptimal',
              },
              {
                label: 'Take a 390% APR payday loan',
                nextNodeId: 'repair',
                feedback: 'Predatory fee trap—never pay triple-digit APR while liquid reserves exist!',
                outcome: 'unsafe',
              },
            ],
          },
          rebuild: {
            promptMarkdown: 'Emergency fund is now `$550`. What restores full stability fastest?',
            choices: [
              {
                label: 'Pause optional dining/upgrades temporarily until automated $150/paycheck deposits refill $1,400',
                nextNodeId: null,
                feedback: 'Clean cash-flow loop: fund used for real emergency -> rebuilt systematically -> stress stays low.',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'fin-l3-s6',
        kind: 'synthesis',
        title: 'Unit 1 Liquidity Takeaways',
        takeaways: [
          'Emergency funds belong in safe, liquid, FDIC/NCUA-insured accounts (HYSA), not volatile stocks.',
          'Target 3–6 months of core essential Needs (after a fast initial $1,000 starter milestone).',
          'Using emergency savings—and rebuilding afterward—beats carrying 22% credit cards or 390% payday loans.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'knowledge-bastion', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-efund-where',
        front: 'Where should an emergency fund be stored and why?',
        back: 'In a liquid, FDIC/NCUA-insured High-Yield Savings Account (never stocks or illiquid multi-year lockups) so full principal is available immediately.',
        explanation: 'Recessions hurt employment and stock prices simultaneously.',
        interleave: true,
      },
      {
        id: 'fin-fc-efund-size',
        front: 'How many months of essential expenses make a standard full emergency reserve?',
        back: '3 to 6 months of core essential living expenses (more if income is variable/single-earner).',
        explanation: 'Start with an immediate $1,000 starter cushion while clearing high-APR debt.',
        interleave: true,
      },
      {
        id: 'fin-fc-payday-trap',
        front: 'Why can a "$15 per $100 borrowed for 2 weeks" fee equal ~391% APR?',
        back: '15% charged every 14 days compounds/repeats ~26 times per year (`0.15 * 365 / 14 = 391%`).',
        explanation: 'Short duration disguises extreme annualized borrowing cost.',
        interleave: true,
      },
    ],
  },
]

const FIN_U2_LESSONS: PackLesson[] = [
  {
    id: 'fin-l4-credit-score',
    unitId: 'fin-u2-credit-debt',
    title: 'Credit Scores, Utilization & Report Hygiene',
    summary: 'Break down the key factors driving FICO scores and optimize utilization without carrying an interest-bearing balance.',
    estimatedMinutes: 8,
    standards: ['Jump$tart Managing Credit 12-4', 'CFPB Credit Reports'],
    prerequisiteLessonIds: ['fin-l3-emergency-fund'],
    steps: [
      {
        id: 'fin-l4-s1',
        kind: 'narrative',
        title: 'You NEVER Need to Pay Credit Card Interest to Build Great Credit',
        bodyMarkdown:
          'Two factors drive ~65% of a classic credit score: **on-time payment history (~35%)** and **credit utilization ratio (~30%)** (`Reported Balance / Total Credit Limit`).\n\nPaying your full **statement balance** by the due date builds perfect payment history at **0% interest**!',
        callout: {
          tone: 'pitfall',
          text: 'Myth: "Carrying a small balance every month helps your credit score." False! Carrying debt costs high APR without boosting scores over paying statements in full.',
        },
      },
      {
        id: 'fin-l4-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Utilization Impact From Statement Balances',
        predictionPrompt:
          'You hold a `$1,000` limit card and charge `$850` right before the statement closes (even if you pay in full next week). What reported utilization ratio hits the credit bureaus?',
        predictionChoices: ['0% immediately', '85% (hurts score temporarily until balance reports lower)', '15%'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 0, x2: 5, y2: 50 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Look at how linear utilization climbs with statement balance (`Balance / Limit`): keeping reported utilization < 30% (ideally < 10%) maximizes scoring without changing spending.',
        explainPrompt: 'How can someone who uses a low-limit card legitimately keep reported utilization under 10%?',
        explainOptions: [
          'Pay down most of the balance a few days BEFORE the monthly statement closing date, leaving a small balance paid in full on due date.',
          'Skip paying the minimum for one month.',
          'Close oldest zero-balance cards immediately.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Because most issuers report statement closing balances to bureaus, an early mid-cycle payment trims reported utilization while keeping zero interest.',
      },
      {
        id: 'fin-l4-s3',
        kind: 'worked-example',
        title: 'Audit Three Credit Actions',
        problemMarkdown: 'Predict score direction for each action:',
        steps: [
          {
            label: 'Checking your own report on AnnualCreditReport.com',
            expressionOrAction: 'Soft inquiry -> 0 impact on credit score',
            whyNote: 'Monitoring your own credit never harms scores and catches fraud early.',
          },
          {
            label: 'Closing your oldest unused no-fee credit card',
            expressionOrAction: 'Shrinks total available credit (raises utilization %) + later shrinks account age',
            whyNote: 'Usually lowers score; keep old no-annual-fee cards open safely with small recurring bill + autopay.',
          },
        ],
      },
      {
        id: 'fin-l4-s4',
        kind: 'faded-practice',
        title: 'Compute Aggregate Credit Utilization',
        promptMarkdown: 'Card A: `$300` balance on `$2,000` limit. Card B: `$900` balance on `$2,000` limit.',
        completedSteps: ['Total balances = $300 + $900 = $1,200', 'Total credit limits = $2,000 + $2,000 = $4,000'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'What is the overall aggregate credit utilization in percent? (integer only)',
            correct: '30',
            alternatives: ['30%', '30.0'],
            points: 10,
            explanation: '$1,200 / $4,000 = 0.30 = 30%. Note Card B alone sits at 45%, so paying Card B down helps both!',
          },
        },
      },
      {
        id: 'fin-l4-s5',
        kind: 'checkpoint',
        title: 'Verify Zero-Interest Credit Building',
        question: {
          type: 'truefalse',
          prompt: 'Paying the full statement balance on time every billing cycle builds strong credit history while costing $0 in credit card interest.',
          correct: true,
          points: 10,
          explanation: 'True! Statement-in-full payers keep their grace period and pay zero interest while earning 100% on-time marks.',
        },
      },
      {
        id: 'fin-l4-s6',
        kind: 'synthesis',
        title: 'Credit Hygiene Takeaways',
        takeaways: [
          'On-time payment history (~35%) and utilization (~30%) dominate standard credit scores.',
          'Never carry an interest-bearing balance "to boost credit"—always pay the full statement balance.',
          'Keep reported utilization below 30% (under 10% for top tiers) and avoid closing your oldest no-fee accounts unnecessarily.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-util',
        front: 'How is credit utilization calculated and what threshold is best?',
        back: '`Reported Revolving Balances / Total Credit Limits`. Keep below 30% overall (and < 10% for peak scores).',
        explanation: 'High utilization signals cash-flow strain even if minimums are paid.',
        interleave: true,
      },
      {
        id: 'fin-fc-grace-period',
        front: 'What happens to a credit card’s interest-free grace period if you carry even $1 past the statement due date?',
        back: 'You typically forfeit the grace period, so NEW purchases also start accruing daily interest immediately until balances hit $0 again.',
        explanation: 'Always pay the full statement balance to preserve the grace period.',
        interleave: true,
      },
      {
        id: 'fin-fc-soft-hard',
        front: 'Contrast a soft inquiry vs. hard inquiry on your credit file.',
        back: 'Soft pulls (checking your own score, pre-approvals) do NOT affect credit scores; hard pulls (applying for a new card/loan) dip scores briefly.',
        explanation: 'Rate-shopping auto/mortgage loans inside a short 14–45 day window usually bundles as one inquiry.',
        interleave: true,
      },
    ],
  },
  {
    id: 'fin-l5-apr-traps',
    unitId: 'fin-u2-credit-debt',
    title: 'Daily Compounding APR & Minimum Payment Traps',
    summary: 'Compare nominal APR vs. APY effective cost and observe why tiny minimum payments drag debt across decades.',
    estimatedMinutes: 9,
    standards: ['Jump$tart Managing Credit 12-2', 'CFPB Debt Math'],
    prerequisiteLessonIds: ['fin-l4-credit-score'],
    visual: { kind: 'model-2d', modelId: 'compound-growth-npv-2d', initialParams: { principal: 3000, rate: 15, contrib: 0, years: 10, inflation: 0 } },
    steps: [
      {
        id: 'fin-l5-s1',
        kind: 'narrative',
        title: 'Minimum Payments Maximize Lender Interest, Not Your Freedom',
        bodyMarkdown:
          'When a card quotes **24% APR**, issuers divide `0.24 / 365 ≈ 0.0657%` **daily** onto your average daily balance. Meanwhile, the issuer’s "minimum payment" may be just ~1% of principal plus monthly interest.\n\nAt 24% APR, paying only minimums on `$3,000` can stretch payoff past **10 years** and cost more in interest than the original items!',
        callout: {
          tone: 'pitfall',
          text: 'Compounding works brilliantly FOR investors earning 8% index returns—and brutally AGAINST borrowers revolving at 24% APR.',
        },
      },
      {
        id: 'fin-l5-s2',
        kind: 'predict-observe-explain',
        title: 'Predict How Rapidly Unpaid High-APR Debt Compounds',
        predictionPrompt:
          'Using the compound growth simulator with no payoff (`contrib = $0`) at `15%` annual rate, roughly how many years does an unpaid debt take to DOUBLE (`Rule of 72`)?',
        predictionChoices: ['About 4.8 years (`72 / 15 ≈ 4.8`)', 'About 15 years', 'About 1 year'],
        correctPredictionIndex: 0,
        visual: {
          kind: 'model-2d',
          modelId: 'compound-growth-npv-2d',
          initialParams: { principal: 3000, rate: 15, contrib: 0, years: 15, inflation: 0 },
          challengeId: 'fin-high-rate-doubling',
          targetChallenge: {
            id: 'fin-high-rate-doubling',
            instruction: 'Set Annual return r = 15% and Monthly deposit = $0 to observe Doubling Time drop below 5.2 years.',
            assertions: [
              { source: 'param', key: 'rate', op: 'gte', target: 14.9 },
              { source: 'param', key: 'contrib', op: 'eq', target: 0 },
              { source: 'readout', key: 'Doubling Time', op: 'lte', target: 5.2 },
            ],
          },
        },
        observeInstruction:
          'Verify at `r = 15%` and `$0/mo` contribution: unpaid debt doubles roughly every 4.9–5.0 years (`ln(2)/ln(1.15) ≈ 4.96 yrs`).',
        explainPrompt: 'Why do high-APR balances stall under minimum payments?',
        explainOptions: [
          'Most of each minimum payment is swallowed immediately by accrued monthly interest, barely reducing principal.',
          'Credit card issuers freeze interest during year 1 automatically.',
          'Minimum payments add principal every month intentionally.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'On `$3,000` at 24% APR, `$60` of a `$90` minimum goes straight to interest—barely denting `$3,000`. Even adding `$50/mo` slashes years and thousands of dollars.',
      },
      {
        id: 'fin-l5-s3',
        kind: 'worked-example',
        title: 'Compute First-Month Interest vs. Principal Paydown',
        problemMarkdown: 'Compare `$80` minimum vs. `$180` aggressive payment on `$2,400` at `24% APR` (`2%/month`):',
        steps: [
          {
            label: 'Monthly interest charge',
            expressionOrAction: '$2,400 × (0.24 / 12) = $48.00 interest in Month 1',
            whyNote: 'Every dollar of APR interest produces zero equity.',
          },
          {
            label: 'Minimum $80 payment impact',
            expressionOrAction: '$80 − $48 = $32 principal reduction (new balance $2,368)',
            whyNote: 'At $32 drop, next month’s interest barely buds ($47.36).',
          },
          {
            label: 'Aggressive $180 payment impact',
            expressionOrAction: '$180 − $48 = $132 principal reduction (over 4x faster equity gain!)',
            whyNote: 'Cutting principal rapidly causes next month’s interest to drop noticeably.',
          },
        ],
      },
      {
        id: 'fin-l5-s4',
        kind: 'faded-practice',
        title: 'Calculate Monthly Interest Share',
        promptMarkdown: 'Sam owes `$3,600` on an `18% APR` credit card and pays `$104` this month.',
        completedSteps: [
          'Approximate monthly rate = 18% / 12 = 1.5% = 0.015',
          'Month 1 interest charged = $3,600 × 0.015 = $54',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'Out of Sam’s `$104` payment, how many dollars actually reduce the `$3,600` principal?',
            correct: '50',
            alternatives: ['$50', '50.0'],
            points: 10,
            explanation: '$104 payment − $54 interest = $50 reduction in principal.',
          },
        },
        misconceptionHints: {
          '54': '$54 is the interest kept by the lender; subtract $54 from $104 to get principal drop.',
        },
      },
      {
        id: 'fin-l5-s5',
        kind: 'checkpoint',
        title: 'Guaranteed Investment Return Equivalent',
        question: {
          type: 'mcq',
          prompt: 'Paying an extra $500 toward a 22% APR credit card balance is financially equivalent to finding a risk-free, tax-free investment yielding:',
          options: ['4% annually', '22% annually', '11% annually', '0% annually'],
          correct: 1,
          points: 10,
          explanation: 'Every dollar retired on 22% debt avoids a guaranteed 22% after-tax annual interest charge.',
        },
      },
      {
        id: 'fin-l5-s6',
        kind: 'synthesis',
        title: 'APR & Paydown Takeaways',
        takeaways: [
          'Dividing APR by 12 gives approximate monthly interest drag; daily compounding makes true APY slightly higher.',
          'Paying minimums funnels most cash straight to interest; fixed payments above minimum trigger accelerating payoff.',
          'Retiring high-APR consumer debt delivers an unbeatable risk-free return equal to its APR.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'streak-siege', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-apr-apy',
        front: 'Contrast APR vs. APY.',
        back: 'APR is the stated nominal annual rate without intra-year compounding; APY (Effective Annual Rate) includes compounding frequency.',
        explanation: 'Banks quote higher APY for savings accounts and lower APR for loans—compare APY-to-APY or APR-to-APR.',
        interleave: true,
      },
      {
        id: 'fin-fc-min-trap',
        front: 'Why do credit-card minimum payments take years to clear even modest balances?',
        back: 'Minimum formulas collect accrued monthly interest plus only ~1% of principal, so shrinking balances slowly preserves high interest drag.',
        explanation: 'Lock in a higher fixed monthly payment above the initial minimum.',
        interleave: true,
      },
      {
        id: 'fin-fc-guar-ret',
        front: 'Why does paying off a 20% APR card usually beat investing extra cash in an 8% stock index?',
        back: 'Retiring 20% APR debt locks in a guaranteed, risk-free, tax-free 20% return, far exceeding risky expected market returns.',
        explanation: 'Exception: never pass up a 100% employer 401(k) match first if cash flow permits.',
        interleave: true,
      },
    ],
  },
  {
    id: 'fin-l6-debt-payoff',
    unitId: 'fin-u2-credit-debt',
    title: 'Debt Avalanche vs. Snowball Payoff Order',
    summary: 'Optimize multi-debt repayment between mathematically optimal interest reduction (avalanche) and behavioral momentum (snowball).',
    estimatedMinutes: 8,
    standards: ['Jump$tart Managing Credit 12-5', 'CFPB Debt Action Plan'],
    prerequisiteLessonIds: ['fin-l5-apr-traps'],
    steps: [
      {
        id: 'fin-l6-s1',
        kind: 'narrative',
        title: 'Always Pay All Minimums, Then Focus 100% of Extra Cash on ONE Target',
        bodyMarkdown:
          'Never spread extra debt payments thinly across five loans. Pay required minimums on all accounts, then aim every spare dollar at ONE target:\n- **Debt Avalanche:** Target the **highest APR** first -> **mathematically minimizes total interest paid**.\n- **Debt Snowball:** Target the **smallest balance** first -> quick wins build motivation when APRs are close.',
        callout: {
          tone: 'key-idea',
          text: 'Once Target #1 hits $0, roll its ENTIRE former payment into Target #2—creating a snowballing payoff cascade.',
        },
      },
      {
        id: 'fin-l6-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Avalanche Savings Over Snowball',
        predictionPrompt:
          'Debts: Card X = `$3,500 at 26% APR`; Loan Y = `$900 at 5% APR`. You have `$300/month` extra beyond minimums. Which choice pays less total interest?',
        predictionChoices: [
          'Avalanche (attack 26% APR Card X first)',
          'Snowball (attack 5% Loan Y first)',
          'Both cost identical total interest',
        ],
        correctPredictionIndex: 0,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 35, x2: 10, y2: 5 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Compare balance payoff slopes: every dollar left lingering on a 26% card accrues over 5× more interest than a dollar on a 5% loan!',
        explainPrompt: 'When is Snowball reasonable despite slightly higher interest?',
        explainOptions: [
          'When two debts have nearly identical APRs or when eliminating one tiny nuisance bill prevents someone from quitting the plan entirely.',
          'When Loan Y has a lower balance AND quadruple the APR—Wait no, then Avalanche ALSO picks Loan Y!',
          'Whenever minimum payments are skipped on larger loans.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Avalanche strictly dominates on interest cost whenever APRs differ widely; Snowball shines psychologically when rates are similar or small bills trigger overwhelm.',
      },
      {
        id: 'fin-l6-s3',
        kind: 'worked-example',
        title: 'Execute a 3-Loan Avalanche Priority Order',
        problemMarkdown: 'Sort repayment targets after paying all minimums: Store Card (`$1,200 @ 28%`), Auto Loan (`$6,000 @ 6%`), Card B (`$2,400 @ 19%`):',
        steps: [
          {
            label: 'Target 1: Highest APR (28%)',
            expressionOrAction: 'Store Card ($1,200 @ 28%)',
            whyNote: 'Bonus: here it is BOTH smallest balance AND highest APR—win-win!',
          },
          {
            label: 'Target 2: Second-highest APR (19%)',
            expressionOrAction: 'Roll Store Card payment + extra cash into Card B ($2,400 @ 19%)',
            whyNote: 'Eliminates steep 19% interest before touching 6% debt.',
          },
          {
            label: 'Target 3: Lowest APR (6%)',
            expressionOrAction: 'Auto Loan ($6,000 @ 6%)',
            whyNote: '6% loan can safely receive minimums until higher consumer rates vanish.',
          },
        ],
      },
      {
        id: 'fin-l6-s4',
        kind: 'faded-practice',
        title: 'Rank Avalanche Priority Order',
        promptMarkdown: 'Apply Debt Avalanche strictly from first payoff target to last across these 4 loans:',
        completedSteps: ['Required monthly minimums are paid on ALL four accounts automatically.'],
        fadedTarget: {
          type: 'order',
          question: {
            type: 'order',
            prompt: 'Order these 4 debts from FIRST avalanche payoff priority to LAST:',
            options: [
              'Personal Loan: $4,000 at 11% APR',
              'Retail Card: $1,800 at 27% APR',
              'Student Loan: $9,000 at 4.5% APR',
              'Travel Card: $3,200 at 21% APR',
            ],
            correct: [1, 3, 0, 2],
            points: 15,
            explanation: 'Avalanche ranks strictly by descending APR: 27% -> 21% -> 11% -> 4.5%.',
          },
        },
      },
      {
        id: 'fin-l6-s5',
        kind: 'branching-scenario',
        title: 'Monthly Surplus Strategy: $300 Spare Cash With Three Accounts',
        startNodeId: 'allocate',
        nodes: {
          allocate: {
            promptMarkdown:
              'You owe `$2,500` on a `24% APR` card (min $75), `$5,000` on a `5%` student loan (min $60), and have `$1,200` starter emergency savings + an extra `$300/mo` surplus.',
            choices: [
              {
                label: 'Pay $60 min on 5% loan, throw full $375 ($75 + $300) at 24% card, keep $1,200 emergency buffer intact',
                nextNodeId: 'done-good',
                feedback: 'Optimal! High-APR debt shrinks fast while the $1,200 buffer prevents new card charges if a car tire pops.',
                outcome: 'optimal',
              },
              {
                label: 'Empty the entire $1,200 emergency buffer down to $0 right now toward the 5% student loan',
                nextNodeId: 'allocate',
                feedback: 'Two traps: draining starter cash forces emergencies right back onto 24% credit, and 5% wasn’t even your expensive debt!',
                outcome: 'unsafe',
              },
            ],
          },
          'done-good': {
            promptMarkdown: '7 months later, the 24% card hits `$0`! Where should that freed-up `$375/month` go next?',
            choices: [
              {
                label: 'Split/roll into building a full 3–6 month HYSA cushion and retirement index match while paying 5% loan steadily',
                nextNodeId: null,
                feedback: 'Mastery! Once high-APR toxic debt is eliminated, compounding shifts firmly onto your wealth-building side.',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'fin-l6-s6',
        kind: 'synthesis',
        title: 'Unit 2 Debt Strategy Takeaways',
        takeaways: [
          'Always pay all minimums first so zero late penalties or credit-score damage occur.',
          'Debt Avalanche targets highest APR first for lowest total interest paid.',
          'Keep a starter emergency reserve (~$1,000) while crushing >10% APR debt so new emergencies don’t undo progress.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'sequence-architect', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-avalanche',
        front: 'Define the Debt Avalanche repayment method.',
        back: 'Pay minimums on all debts, then direct 100% of extra cash to the balance with the HIGHEST APR first—minimizing total interest cost.',
        explanation: 'Mathematically optimal repayment order.',
        interleave: true,
      },
      {
        id: 'fin-fc-snowball',
        front: 'Define the Debt Snowball method and when it helps.',
        back: 'Attack the smallest dollar balance first to eliminate an account quickly and build behavioral momentum—useful when APR gaps are narrow.',
        explanation: 'Consistency over 24 months often outweighs small mathematical spreads.',
        interleave: true,
      },
      {
        id: 'fin-fc-debt-rollover',
        front: 'What is "payment rollover" when paying off multiple debts?',
        back: 'Redirecting the freed minimum + extra payment from an eliminated debt straight onto the next target debt rather than inflating lifestyle spend.',
        explanation: 'Creates accelerating principal paydown across successive loans.',
        interleave: true,
      },
    ],
  },
]

const FIN_U3_LESSONS: PackLesson[] = [
  {
    id: 'fin-l7-compounding',
    unitId: 'fin-u3-compounding-index',
    title: 'Exponential Compounding, Horizon & the Rule of 72',
    summary: 'Simulate how starting early and keeping compound growth unbroken creates exponential wealth via `FV = P(1 + r)^t`.',
    estimatedMinutes: 9,
    standards: ['Jump$tart Investing 12-2', 'CEE Compound Interest'],
    prerequisiteLessonIds: ['fin-l6-debt-payoff'],
    visual: { kind: 'model-2d', modelId: 'compound-growth-npv-2d', initialParams: { principal: 5000, rate: 7, contrib: 150, years: 30, inflation: 0 } },
    steps: [
      {
        id: 'fin-l7-s1',
        kind: 'narrative',
        title: 'Time Dominates Timing When Growth Compounds',
        bodyMarkdown:
          'Simple interest grows linearly (`P + Prt`), whereas **compound interest** multiplies exponentially: `FV = P(1 + r)^t` because prior earnings generate next year’s earnings.\n\nA fast mental rule—the **Rule of 72**—estimates doubling years as **`72 / (annual % rate)`**: at 8%, money doubles every ~9 years (`72 / 8`)!',
        callout: {
          tone: 'key-idea',
          text: 'Starting 10 years earlier adds an entire extra doubling cycle at the END of your horizon—often worth more than doubling monthly contributions late in life.',
        },
      },
      {
        id: 'fin-l7-s2',
        kind: 'predict-observe-explain',
        title: 'Test the Rule of 72 in the Compound Growth Lab',
        predictionPrompt:
          'Starting from `r = 5%` (`~14.2 yr` doubling) with `$0` monthly additions, if return doubles to `r = 10%`, roughly when does `$5,000` reach `$10,000`?',
        predictionChoices: ['About 10 years', 'About 7.2 years (doubling r halves doubling time)', 'About 2 years'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'compound-growth-npv-2d',
          initialParams: { principal: 5000, rate: 5, contrib: 0, years: 30, inflation: 0 },
          challengeId: 'fin-rule-72-test',
          targetChallenge: {
            id: 'fin-rule-72-test',
            instruction: 'Keep Monthly deposit at $0 and set Annual return r = 10% to verify Doubling Time reaches <= 7.4 years.',
            assertions: [
              { source: 'param', key: 'rate', op: 'gte', target: 9.9 },
              { source: 'param', key: 'contrib', op: 'eq', target: 0 },
              { source: 'readout', key: 'Doubling Time', op: 'lte', target: 7.4 },
            ],
          },
        },
        observeInstruction:
          'Set `Annual return r` to `10%` with `$0/mo` deposits and watch both the `Doubling Time` marker and how steeply the curve breaks upward past year 15.',
        explainPrompt: 'Why do the final 10 years of a 30-year horizon contribute the biggest dollar surge?',
        explainOptions: [
          'By year 20, annual percentage returns multiply a principal base that has already doubled multiple times.',
          'Compound accounts secretly raise the percentage rate at year 20.',
          'Inflation creates nominal cash out of thin air.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Exact Rule of 72 match (`72 / 10 = 7.2 yrs`, exact `ln(2)/ln(1.10) = 7.27 yrs`). Patience keeps the steepest rightmost section intact!',
      },
      {
        id: 'fin-l7-s3',
        kind: 'worked-example',
        title: 'Compare Early-Start vs. Late-Start Total Contributions',
        problemMarkdown: 'Compare Investor A (`$200/mo` ages 22–32 then STOP contributing at 32) vs. Investor B (`$200/mo` ages 32–62) both earning `8%`:',
        steps: [
          {
            label: 'Total dollars contributed out-of-pocket',
            expressionOrAction: 'A: $24,000 total vs. B: $72,000 total (3× more!)',
            whyNote: 'Investor A stopped saving after only 10 years.',
          },
          {
            label: 'Balances at age 62 (~8% annual)',
            expressionOrAction: 'A compounds untouched for 30 extra yrs (~$360k+) often rivaling or beating B (~$300k)',
            whyNote: 'Years `32..62` gave A’s initial $24k roughly 3.3 compounding doublings!',
          },
        ],
      },
      {
        id: 'fin-l7-s4',
        kind: 'faded-practice',
        title: 'Apply Rule of 72 Rapidly',
        promptMarkdown: 'An index portfolio averages `9%` nominal annual growth.',
        completedSteps: ['Formula: Doubling years ≈ 72 / r%', 'Substitute r = 9 into Rule of 72'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'Approximately how many years does `$10,000` take to double to `$20,000` at `9%`?',
            correct: '8',
            alternatives: ['8.0', '8 years'],
            points: 10,
            explanation: '72 / 9 = 8 years (~8.04 exact via ln(2)/ln(1.09)).',
          },
        },
      },
      {
        id: 'fin-l7-s5',
        kind: 'checkpoint',
        title: 'Multiple Doublings in 24 Years',
        question: {
          type: 'fill',
          prompt: 'If money doubles every 8 years (`~9%` return), what does `$5,000` grow to after `24 years` (`3` doublings)? (number in dollars, e.g. 25000)',
          correct: '40000',
          alternatives: ['$40,000', '$40000', '40,000'],
          points: 10,
          explanation: '5,000 -> 10,000 (yr 8) -> 20,000 (yr 16) -> $40,000 (yr 24) = 5,000 × 2^3.',
        },
      },
      {
        id: 'fin-l7-s6',
        kind: 'synthesis',
        title: 'Compounding Takeaways',
        takeaways: [
          'Compound growth follows `FV = P(1 + r)^t`—horizon exponent `t` drives massive late-stage acceleration.',
          'Rule of 72 estimates doubling time cleanly as `72 / rate%`.',
          'Investing even modest amounts in your 20s beats playing catch-up with 3× larger contributions later.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'sim-sandbox', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-rule72',
        front: 'State the Rule of 72 and estimate doubling time at 6% annual return.',
        back: '`Years to double ≈ 72 / r%`. At 6%, `72 / 6 ≈ 12 years`.',
        explanation: 'Also works backward for inflation erosion: at 3% inflation, prices double roughly every 24 years!',
        interleave: true,
      },
      {
        id: 'fin-fc-simple-comp',
        front: 'Contrast simple interest vs. compound interest mathematically.',
        back: 'Simple: `P(1 + rt)` (linear); Compound: `P(1 + r)^t` (exponential—interest earns interest).',
        explanation: 'Difference widens dramatically past Year 10.',
        interleave: true,
      },
      {
        id: 'fin-fc-early-advantage',
        front: 'Why does starting at age 22 with $200/mo often rival starting at age 35 with $450/mo?',
        back: 'Extra early years add full compounding doubling cycles at the right end of the horizon.',
        explanation: 'Time in the market dominates tiny differences in start capital.',
        interleave: true,
      },
    ],
  },
  {
    id: 'fin-l8-inflation-real',
    unitId: 'fin-u3-compounding-index',
    title: 'Inflation & Real Purchasing Power',
    summary: 'Separate nominal dollar growth from real inflation-adjusted purchasing power using Fisher’s real-return relation.',
    estimatedMinutes: 8,
    standards: ['Jump$tart Saving 12-4', 'CEE Inflation & Real Value'],
    prerequisiteLessonIds: ['fin-l7-compounding'],
    visual: { kind: 'model-2d', modelId: 'compound-growth-npv-2d', initialParams: { principal: 10000, rate: 5, contrib: 0, years: 30, inflation: 3 } },
    steps: [
      {
        id: 'fin-l8-s1',
        kind: 'narrative',
        title: 'Cash Under the Mattress Quietly Shrinks Every Year',
        bodyMarkdown:
          '**Nominal value** counts printed dollar bills; **real value** measures actual goods those dollars can still purchase.\n\nWhen checking/cash earns `0.5%` while annual **inflation** averages `3.0%`, your purchasing power shrinks ~2.5% every year! Using the **Fisher approximation**, `real return ≈ nominal rate − inflation rate` (exact: `(1 + r)/(1 + i) - 1`).',
        callout: {
          tone: 'pitfall',
          text: 'Seeing a savings balance grow from $10,000 to $12,000 over 10 years feels like winning—until inflation raised your grocery basket 34% over the same decade.',
        },
      },
      {
        id: 'fin-l8-s2',
        kind: 'predict-observe-explain',
        title: 'Observe Real vs. Nominal Divergence Over 30 Years',
        predictionPrompt:
          'At `7%` nominal growth and `3%` annual inflation over `30 years`, what happens to `Real Value (today $)` compared to `Final FV (30y)`?',
        predictionChoices: [
          'Real Value exceeds Final FV because prices drop',
          'Final FV looks over twice as large in future dollars as its true purchasing power in today’s dollars',
          'Both stay identical at 30 years',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'compound-growth-npv-2d',
          initialParams: { principal: 10000, rate: 7, contrib: 0, years: 30, inflation: 3 },
        },
        observeInstruction:
          'Compare the nominal curve (`Final FV`) against the dashed `Real Value (today $)` curve: toggle Inflation from `0%` up to `4%` to see how dramatically inflation erodes long-horizon dollars.',
        explainPrompt: 'Why must retirement calculators model real (inflation-adjusted) returns rather than nominal ones?',
        explainOptions: [
          'Planning for today’s $60,000/yr living expenses requires knowing real today-dollar purchasing power, not inflated nominal numbers 30 years hence.',
          'Nominal balances never compound in retirement accounts.',
          'Inflation only affects credit card balances.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Using real return (~4% real for 7% nominal minus 3% inflation) lets you plan directly in familiar today-dollar living budgets.',
      },
      {
        id: 'fin-l8-s3',
        kind: 'worked-example',
        title: 'Compare Approximate vs. Exact Real Return',
        problemMarkdown: 'An investment earns `8%` nominal while inflation averages `3%`:',
        steps: [
          {
            label: 'Quick mental Fisher estimate',
            expressionOrAction: '8% − 3% = 5.0% approximate real return',
            whyNote: 'Fast subtraction estimates real purchasing power accurately at modest rates.',
          },
          {
            label: 'Exact Fisher formula `(1 + r)/(1 + i) - 1`',
            expressionOrAction: '(1.08 / 1.03) − 1 ≈ 4.85% exact real growth',
            whyNote: 'Both confirm positive real wealth compounding only when portfolio yield outpaces inflation.',
          },
        ],
      },
      {
        id: 'fin-l8-s4',
        kind: 'faded-practice',
        title: 'Check Negative Real Yield on Low-Interest Cash',
        promptMarkdown: 'A traditional brick-and-mortar checking account pays `0.1% APY` while annual inflation runs `3.1%`.',
        completedSteps: ['Approximate real return = nominal rate − inflation = 0.1% − 3.1%'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'What is the approximate real annual return (%) on cash sitting idle in that account? (include negative sign)',
            correct: '-3',
            alternatives: ['-3%', '-3.0', '-3.0%'],
            points: 10,
            explanation: '0.1% − 3.1% = −3.0% real purchasing-power loss per year.',
          },
        },
      },
      {
        id: 'fin-l8-s5',
        kind: 'checkpoint',
        title: 'Compute Inflation Erosion Rule of 72',
        question: {
          type: 'mcq',
          prompt: 'If average annual inflation stays at `3%`, roughly how many years does it take for general prices to double (cutting cash purchasing power in HALF)?',
          options: ['12 years', '24 years', '36 years', '72 years'],
          correct: 1,
          points: 10,
          explanation: 'Rule of 72 works on inflation too: `72 / 3 = 24 years` to halve dollar purchasing power.',
        },
      },
      {
        id: 'fin-l8-s6',
        kind: 'synthesis',
        title: 'Inflation Takeaways',
        takeaways: [
          'Always subtract inflation (`r_real ≈ r_nom - i`) to judge real wealth progress.',
          'Hold only needed liquid cash (3–6 mo buffer) in high-yield cash; long-term 10+ year savings need real growth assets.',
          'Rule of 72 estimates how fast inflation halves cash value (`72 / inflation%`).',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-real-nom',
        front: 'Write the exact and approximate Fisher equations linking nominal return, real return, and inflation.',
        back: 'Approx: `r_real ≈ r_nominal - i`. Exact: `r_real = (1 + r_nominal) / (1 + i) - 1`.',
        explanation: 'Determines true purchasing power gain.',
        interleave: true,
      },
      {
        id: 'fin-fc-idle-cash',
        front: 'Why is keeping 20-year retirement money in a 0.5% savings account risky despite $0 balance drops?',
        back: 'Inflation risk! At 3% inflation, 0.5% cash loses ~2.5% real purchasing power every year.',
        explanation: 'Zero volatility in nominal dollars does not equal zero risk to future buying power.',
        interleave: true,
      },
      {
        id: 'fin-fc-npv-def',
        front: 'What does positive Net Present Value (NPV > 0) tell you about a project or investment?',
        back: 'Discounted future cash inflows exceed upfront capital cost at your required hurdle rate, adding net economic value today.',
        explanation: 'Future dollars are discounted by `1 / (1 + d)^t`.',
        interleave: true,
      },
    ],
  },
  {
    id: 'fin-l9-index-diversification',
    unitId: 'fin-u3-compounding-index',
    title: 'Index Diversification & Expense-Ratio Fee Drag',
    summary: 'Eliminate company-specific risk via broad low-cost index funds and measure how seemingly tiny 1% annual fees compound into huge lost balances.',
    estimatedMinutes: 9,
    standards: ['Jump$tart Investing 12-6', 'CFPB Building Wealth'],
    prerequisiteLessonIds: ['fin-l8-inflation-real'],
    steps: [
      {
        id: 'fin-l9-s1',
        kind: 'narrative',
        title: 'Diversification Is the Only "Free Lunch" in Finance',
        bodyMarkdown:
          'Owning one hot tech stock carries massive **idiosyncratic (company-specific) risk**—one accounting scandal or rival product can wipe out 80% forever. A broad **index fund** holds hundreds or thousands of companies across sectors, removing single-company blowup risk while earning market growth.\n\nAnd watch **expense ratios**: a `1.15%` annual fee quietly compounds *against* you, erasing roughly a quarter of a 30-year retirement nest egg vs. a `0.04%` index ETF!',
        callout: {
          tone: 'pitfall',
          text: 'Past 3-year top-performing active mutual funds rarely beat the market in the *next* 10 years—mostly because their ~1% higher annual fees compound relentlessly every single year.',
        },
      },
      {
        id: 'fin-l9-s2',
        kind: 'predict-observe-explain',
        title: 'Predict 30-Year Cost of a 1% Higher Annual Fee',
        predictionPrompt:
          'Fund A (`0.04%` fee) nets `8.0%` annually; Fund B (`1.04%` fee) nets `7.0%` annually on the exact same portfolio over `30 years`. Roughly how much SMALLER does Fund B finish?',
        predictionChoices: ['Only 1% smaller overall', 'Roughly ~24–25% smaller overall (fees compound every year!)', '50% larger'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'compound-growth-npv-2d',
          initialParams: { principal: 10000, rate: 8, contrib: 200, years: 30, inflation: 0 },
        },
        observeInstruction:
          'Compare `Annual return r = 8%` vs. lowering `r` by 1% to `7%` over 30 years: notice fees don’t take 1% once—they shave 1% off the *compounding base* every year for 30 years (`(1.07/1.08)^30 ≈ 0.76`)!',
        explainPrompt: 'Why is expense ratio one of the most reliable predictors of long-term fund performance?',
        explainOptions: [
          'Future market luck is uncertain, whereas low fees are guaranteed compounding savings every single year.',
          'Low-fee index funds skip dividend payments.',
          '1% annual fee only charges in Year 1.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          '`(1.07^30)/(1.08^30) ≈ 0.756`—a "small" 1% annual fee forfeits nearly 24% of final wealth on a lump sum!',
      },
      {
        id: 'fin-l9-s3',
        kind: 'worked-example',
        title: 'Compare Single Stock vs. Broad Index Diversification',
        problemMarkdown: 'Contrast holding $10,000 in 1 automaker stock vs. a 500-company total-market index:',
        steps: [
          {
            label: 'Single company exposure',
            expressionOrAction: 'Exposed to both market swings AND idiosyncratic recall/CEO risk',
            whyNote: 'No extra expected return compensates avoidable single-stock volatility.',
          },
          {
            label: 'Broad low-cost index ETF',
            expressionOrAction: 'Diversifies across healthcare, tech, finance, utilities, industrials at ~0.03%–0.05% fee',
            whyNote: 'Captures overall economic growth automatically without constant stock picking.',
          },
        ],
      },
      {
        id: 'fin-l9-s4',
        kind: 'faded-practice',
        title: 'Calculate Annual Fee Dollars on $100,000',
        promptMarkdown: 'Compare a `0.04%` index fund against a `1.04%` actively managed fund on a `$100,000` balance this year.',
        completedSteps: ['Index fund annual fee = $100,000 × 0.0004 = $40/year'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'How many DOLLARS per year does the `1.04%` fund deduct on `$100,000`? (number only)',
            correct: '1040',
            alternatives: ['$1040', '$1,040', '1,040'],
            points: 10,
            explanation: '$100,000 × 0.0104 = $1,040/year ($1,000 more per year lost to fees!).',
          },
        },
      },
      {
        id: 'fin-l9-s5',
        kind: 'branching-scenario',
        title: 'First Career 401(k) Investment Menu Decision',
        startNodeId: 'menu',
        nodes: {
          menu: {
            promptMarkdown:
              'Your first job offers a `4%` dollar-for-dollar 401(k) match and three fund choices inside the plan:\n1) Target-Date / Total Stock Index (`0.05%` expense ratio)\n2) Actively Managed Large-Cap Fund (`1.18%` fee, flashy 3-year ad)\n3) 100% Own-Company Employer Stock (`0%` fee, zero diversification).',
            choices: [
              {
                label: 'Contribute at least 4% to capture 100% employer match and allocate into the low-cost broad Index / Target-Date fund (0.05%)',
                nextNodeId: 'rebalance',
                feedback: 'Optimal! Free 100% match + broad diversification + rock-bottom 0.05% compounding drag!',
                outcome: 'optimal',
              },
              {
                label: 'Put 100% into Employer Stock so your paycheck AND retirement depend on one single firm',
                nextNodeId: 'menu',
                feedback: 'Double concentration trap: if your employer hits trouble, you risk losing your job and savings simultaneously!',
                outcome: 'unsafe',
              },
              {
                label: 'Skip the 4% match and pick the 1.18% active fund later',
                nextNodeId: 'menu',
                feedback: 'Skipping an instant 100% employer match throws away free compensation AND loses to fee drag.',
                outcome: 'unsafe',
              },
            ],
          },
          rebalance: {
            promptMarkdown: 'Two years later the stock market dips 18% during a headline scare. What preserves long-horizon wealth?',
            choices: [
              {
                label: 'Stay invested and keep automatic monthly paycheck contributions buying more shares at lower prices',
                nextNodeId: null,
                feedback: 'Dollar-cost averaging during dips lowers average share cost; panic-selling locks in bottom losses!',
                outcome: 'optimal',
              },
              {
                label: 'Panic-sell all index shares into cash until headlines feel sunny again',
                nextNodeId: null,
                feedback: 'Selling low and buying back after recovery guarantees underperforming the market index.',
                outcome: 'unsafe',
              },
            ],
          },
        },
      },
      {
        id: 'fin-l9-s6',
        kind: 'synthesis',
        title: 'Unit 3 Investing Takeaways',
        takeaways: [
          'Always capture full employer retirement matches first (instant 100% return).',
          'Broad low-cost index funds diversify away single-company failure risk at <0.10% annual cost.',
          'Stay steady through downturns—time in diversified markets outperforms market timing.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'boss-raid', packId: 'personal-finance-literacy' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'fin-fc-expense-ratio',
        front: 'Why can a seemingly tiny 1.0% annual expense ratio erase ~24% of a 30-year investment balance?',
        back: 'Because the 1% fee compounds every year off your growing balance—multiplying `((1 + r - 0.01)/(1 + r))^30` over decades.',
        explanation: 'Check expense ratios (`< 0.15%` for core index funds) before investing.',
        interleave: true,
      },
      {
        id: 'fin-fc-diversify',
        front: 'What specific risk does a broad index fund eliminate that owning 1–2 single stocks cannot?',
        back: 'Idiosyncratic (company-specific) risk—systemic market swings remain, so pair horizon-appropriate bond/cash buffers when retirement nears.',
        explanation: 'Never tie both your career paycheck and 100% of retirement savings to the same company stock.',
        interleave: true,
      },
      {
        id: 'fin-fc-dca',
        front: 'How does automatic paycheck investing ("dollar-cost averaging") behave during temporary market dips?',
        back: 'Your fixed monthly contribution buys MORE shares while prices are depressed, lowering average cost per share over full cycles.',
        explanation: 'Eliminates emotional timing blunders.',
        interleave: true,
      },
    ],
  },
]

const FIN_UNITS: TrackUnit[] = [
  {
    id: 'fin-u1-paychecks-budget',
    title: 'Unit 1: Paychecks, Tax Brackets & Liquidity Buffers',
    anchoringPhenomenon: 'Can getting a $1,000 raise into a higher federal tax bracket ever lower your net paycheck?',
    lessons: FIN_U1_LESSONS,
    capstoneQuizIndex: 0,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'fin-u2-credit-debt',
    title: 'Unit 2: Credit Utilization, APR Traps & Debt Payoff',
    anchoringPhenomenon: 'Why can paying only the credit card minimum keep a $3,000 balance alive for over a decade?',
    lessons: FIN_U2_LESSONS,
    capstoneQuizIndex: 1,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'fin-u3-compounding-index',
    title: 'Unit 3: Compound Growth, Inflation & Index Investing',
    anchoringPhenomenon: 'How does an extra 1% annual fund fee shrink a 30-year nest egg by almost a quarter?',
    lessons: FIN_U3_LESSONS,
    capstoneQuizIndex: 2,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 },
  },
]

const FIN_TRACK: CurriculumTrack = {
  id: 'track-personal-finance-literacy',
  slug: 'personal-finance-literacy',
  packId: 'personal-finance-literacy',
  title: 'Personal Finance & Household Wealth Math',
  category: 'Economics',
  subject: 'Personal Finance',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution:
    'OpenPath Original (MIT) — aligned with FDIC Money Smart & CFPB Financial Literacy frameworks (Public Domain)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: FIN_UNITS,
}

const FIN_PACK: ContentPack = {
  id: 'personal-finance-literacy',
  name: 'Personal Finance: Taxes, Credit & Compounding',
  description:
    'Progressive tax brackets, 50/30/20 & sinking funds, credit utilization, 24% APR traps, avalanche vs. snowball debt, Rule of 72 compounding, inflation, and index fee drag.',
  subject: 'Personal Finance',
  category: 'Economics',
  icon: '💳',
  modelId: 'compound-growth-npv-2d',
  standards: 'Jump$tart National Financial Education Standards · CEE Personal Finance',
  license: 'MIT',
  sourceAttribution:
    'OpenPath Original (MIT) — aligned with FDIC Money Smart & CFPB Financial Literacy frameworks (Public Domain)',
  srsInterleave: true,
  gradeBand: 'HS',
  prerequisitePackIds: [],
  track: FIN_TRACK,
  units: FIN_UNITS,
  quizzes: [
    {
      title: 'Unit 1: Paychecks, Tax Brackets & Emergency Cash',
      description: 'Marginal vs. effective tax rates, FICA, linear savings plans, and payday fee traps.',
      subject: 'Personal Finance',
      difficulty: 'easy',
      timeLimitSec: 480,
      modelId: 'compound-growth-npv-2d',
      lessonId: 'fin-l3-emergency-fund',
      questions: [
        {
          type: 'truefalse',
          prompt: 'Receiving a salary raise that nudges your top dollars into a higher marginal tax bracket lowers your total after-tax take-home income.',
          correct: false,
          points: 10,
          explanation: 'False! Higher marginal rates apply ONLY to dollars above the bracket threshold; net take-home pay always rises.',
        },
        {
          type: 'figure',
          prompt: 'This savings line tracks your account balance y (in $hundreds) across x months. Compute the monthly savings rate (slope m in $hundreds/month, round to nearest tenth).',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 5, x2: 6, y2: 20 },
            ranges: { y1: [2, 8], x2: [4, 10], y2: [14, 32] },
            ask: 'slope',
            rounding: 'tenth',
          },
          points: 10,
          explanation: 'Monthly deposit slope = (y₂ − y₁) / (x₂ − x₁), dividing balance gain in $hundreds by elapsed months.',
        },
        {
          type: 'fill',
          prompt: 'What combined percentage of gross wages goes to standard employee FICA taxes (6.2% Social Security + 1.45% Medicare)?',
          correct: '7.65',
          alternatives: ['7.65%'],
          points: 10,
          explanation: '6.2% + 1.45% = 7.65% FICA withholding.',
        },
        {
          type: 'mcq',
          prompt: 'Where should a 3–6 month emergency fund reside so it remains safe and immediately usable during a market recession?',
          options: [
            'High-Yield Savings Account (FDIC/NCUA insured)',
            'Single volatile growth stock',
            'Cryptocurrency futures',
            'Illiquid 10-year real-estate trust',
          ],
          correct: 0,
          points: 10,
          explanation: 'Emergency cash requires principal stability and fast liquidity—HYSA protects cash during market downturns.',
        },
        {
          type: 'mcq',
          prompt: 'Paying $1,800/year for semi-annual auto insurance by moving $150 every month into a dedicated sub-account is called a:',
          options: ['Sinking fund', 'Margin call', 'Payday advance', 'Capital gain'],
          correct: 0,
          points: 10,
          explanation: 'Sinking funds smooth predictable irregular expenses into even monthly transfers.',
        },
        {
          type: 'mcq',
          prompt: 'On $20,000 taxable income where $0–$10,000 is taxed at 10% and $10,000–$20,000 at 20%, what is the effective tax rate?',
          options: ['10%', '15%', '20%', '30%'],
          correct: 1,
          points: 10,
          explanation: 'Total tax = $1,000 + $2,000 = $3,000; $3,000 / $20,000 = 15%.',
        },
        {
          type: 'order',
          prompt: 'Order the steps to stabilize household cash flow starting from paycheck arrival:',
          options: [
            'Automate savings & sinking-fund transfers right on payday',
            'Calculate actual monthly NET pay after taxes and deductions',
            'Cap variable Wants inside remaining net surplus',
            'Cover fixed essential Needs (housing, food, utilities, debt minimums)',
          ],
          correct: [1, 0, 3, 2],
          points: 15,
          explanation: 'Know net cash -> pay yourself first -> fund core needs -> enjoy guilt-free remaining wants.',
        },
        {
          type: 'truefalse',
          prompt: 'In the 50/30/20 framework, percentages are benchmarked against GROSS salary before taxes and withholdings.',
          correct: false,
          points: 10,
          explanation: 'False! 50/30/20 benchmarks NET take-home pay so taxes don’t distort your spending plan.',
        },
      ],
    },
    {
      title: 'Unit 2: Credit Utilization, APR & Debt Strategy',
      description: 'Credit score drivers, linear debt-paydown trajectories, interest share math, and avalanche ordering.',
      subject: 'Personal Finance',
      difficulty: 'medium',
      timeLimitSec: 540,
      modelId: 'compound-growth-npv-2d',
      lessonId: 'fin-l6-debt-payoff',
      questions: [
        {
          type: 'truefalse',
          prompt: 'You must carry an unpaid balance and pay interest each month on a credit card to build a strong credit score.',
          correct: false,
          points: 10,
          explanation: 'False! Paying your full statement balance on time achieves perfect payment history at $0 interest.',
        },
        {
          type: 'fill',
          prompt: 'With a $500 balance on Card 1 ($1,500 limit) and $400 on Card 2 ($1,500 limit), what is your aggregate utilization percentage? (number only)',
          correct: '30',
          alternatives: ['30%', '30.0'],
          points: 10,
          explanation: 'Total balance $900 / total limit $3,000 = 0.30 = 30%.',
        },
        {
          type: 'figure',
          prompt: 'A fixed-payment debt balance y (in $hundreds) declines linearly across x months. Find the original starting balance (y-intercept in $hundreds, round to nearest tenth).',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 2, y1: 16, x2: 6, y2: 8 },
            ranges: { x1: [2, 3], y1: [14, 24], x2: [5, 8], y2: [2, 10] },
            ask: 'yIntercept',
            rounding: 'tenth',
          },
          points: 15,
          explanation: 'Compute monthly slope m = (y₂ − y₁)/(x₂ − x₁), then extrapolate back to month 0: yIntercept = y₁ − m · x₁.',
        },
        {
          type: 'fill',
          prompt: 'You owe $2,000 at 24% APR (2%/month) and pay $90 this month. How many dollars of that $90 go toward ACTUAL principal reduction?',
          correct: '50',
          alternatives: ['$50', '50.0'],
          points: 10,
          explanation: 'Monthly interest = $2,000 × 0.02 = $40; remaining $90 − $40 = $50 lowers principal.',
        },
        {
          type: 'mcq',
          prompt: 'After paying all minimum payments, which debt repayment strategy saves the MOST total money in interest?',
          options: [
            'Debt Avalanche (highest APR first)',
            'Debt Snowball (smallest balance first)',
            'Splitting extra cash equally by count of accounts',
            'Closing oldest credit card before paying',
          ],
          correct: 0,
          points: 10,
          explanation: 'Eliminating the highest interest-rate dollars first minimizes total interest accrued.',
        },
        {
          type: 'order',
          prompt: 'Sort these 4 debts from FIRST Debt Avalanche payoff target to LAST:',
          options: [
            'Auto Loan: $8,500 @ 5.5% APR',
            'Store Card: $950 @ 29% APR',
            'Credit Card: $3,200 @ 21% APR',
            'Federal Student Loan: $6,000 @ 4% APR',
          ],
          correct: [1, 2, 0, 3],
          points: 15,
          explanation: 'Avalanche orders strictly by APR descending: 29% -> 21% -> 5.5% -> 4%.',
        },
        {
          type: 'mcq',
          prompt: 'Why should someone keep an old credit card with NO annual fee open even after paying it off completely?',
          options: [
            'Closing it shrinks total credit limit (raising utilization %) and eventually reduces credit history age',
            'Open zero-balance cards generate compound dividends',
            'Issuers charge $500/year whenever cards close',
            'Credit bureaus ban paying cards to $0',
          ],
          correct: 0,
          points: 10,
          explanation: 'Unused open credit lowers utilization while extending average credit history length.',
        },
        {
          type: 'mcq',
          prompt: 'Checking your OWN credit report through AnnualCreditReport.com causes:',
          options: [
            'A soft inquiry with zero score impact',
            'A 15-point hard-pull penalty',
            'Closure of checking accounts',
            'Immediate APR hikes',
          ],
          correct: 0,
          points: 10,
          explanation: 'Checking your own file counts as a harmless soft pull.',
        },
      ],
    },
    {
      title: 'Unit 3: Compound Growth, Inflation & Index Investing',
      description: 'Rule of 72 compounding, Fisher real returns, employer matches, and expense-ratio drag.',
      subject: 'Personal Finance',
      difficulty: 'hard',
      timeLimitSec: 600,
      modelId: 'compound-growth-npv-2d',
      lessonId: 'fin-l9-index-diversification',
      questions: [
        {
          type: 'fill',
          prompt: 'Using the Rule of 72, how many years does it take an investment earning 6% annually to double?',
          correct: '12',
          alternatives: ['12.0', '12 years'],
          points: 10,
          explanation: '72 / 6 = 12 years (~11.9 exact).',
        },
        {
          type: 'fill',
          prompt: 'If a diversified portfolio doubles every 9 years (~8% nominal), what does $5,000 grow into after 27 years?',
          correct: '40000',
          alternatives: ['$40,000', '$40000', '40,000'],
          points: 15,
          explanation: '27 years = 3 doublings: $5,000 × 2^3 = $40,000.',
        },
        {
          type: 'fill',
          prompt: 'Your portfolio earns 8.5% nominal return in a year with 3.0% inflation. Using the linear Fisher approximation (`r - i`), what is the real return (%)?',
          correct: '5.5',
          alternatives: ['5.5%', '5.34', '5.3'],
          points: 10,
          explanation: 'Approximate real return = 8.5% − 3.0% = 5.5% (exact Fisher = 1.085/1.03 − 1 ≈ 5.34%).',
        },
        {
          type: 'figure',
          prompt: 'Cumulative fee drag y (in $thousands) grows linearly across x years on the line shown. Compute the annual fee-drag slope (in $thousands/year, round to nearest tenth).',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 0, x2: 10, y2: 35 },
            ranges: { x2: [5, 12], y2: [12, 48] },
            ask: 'slope',
            rounding: 'tenth',
          },
          points: 15,
          explanation: 'Divide cumulative fee difference (y₂ − y₁) by elapsed years (x₂ − x₁).',
        },
        {
          type: 'mcq',
          prompt: 'Over 30 years with identical market returns before fees, why does a 1.05% fee fund end up roughly 24% smaller than a 0.05% index fund?',
          options: [
            'The 1% annual fee compounds against you every year, eroding capital that would otherwise double repeatedly',
            'Index funds pay zero capital gains taxes until 100',
            'Active funds lock withdrawals for 30 years',
            'Low-fee funds double dividend payouts artificially',
          ],
          correct: 0,
          points: 15,
          explanation: 'Compounding `(1 + r - fee)^30` turns even a 1% annual fee spread into ~24% lost terminal balance.',
        },
        {
          type: 'truefalse',
          prompt: 'Putting 100% of your retirement 401(k) into your own employer’s company stock creates safe diversification because you know the business inside out.',
          correct: false,
          points: 10,
          explanation: 'False! Tying paycheck and nest egg to one employer creates acute single-firm concentration risk.',
        },
        {
          type: 'mcq',
          prompt: 'What is the highest-priority move when starting a first job with a 100% employer 401(k) match up to 5% of pay (after establishing a starter $1k buffer)?',
          options: [
            'Contribute at least 5% into a low-cost diversified index/target-date fund to capture the full match',
            'Day-trade single options inside a taxable account',
            'Leave 0% in 401(k) and hold cash checking indefinitely',
            'Borrow on a 25% APR card to buy gold coins',
          ],
          correct: 0,
          points: 10,
          explanation: 'A 100% employer match delivers an immediate risk-free doubling on matched dollars before market compounding even starts.',
        },
        {
          type: 'order',
          prompt: 'Order the evidence-based household wealth-building waterfall from first priority to long-horizon investing:',
          options: [
            'Automate broad low-cost index investing across tax-advantaged/brokerage accounts',
            'Build $1,000 starter liquid cash buffer and capture full employer 401(k) match',
            'Eliminate high-APR (>10%) consumer debt via Debt Avalanche',
            'Expand liquid HYSA cushion to 3–6 months of core expenses',
          ],
          correct: [1, 2, 3, 0],
          points: 15,
          explanation: 'Starter cushion + free match -> crush >10% APR debt -> finish 3–6 mo reserve -> long-term low-fee index growth.',
        },
      ],
    },
  ],
}

// ── 20. STUDY SKILLS & METACOGNITION ──────────────────────────────────────────

const STUDY_U1_LESSONS: PackLesson[] = [
  {
    id: 'study-l1-fluency-illusion',
    unitId: 'study-u1-retrieval',
    title: 'The Fluency Illusion vs. Active Retrieval Practice',
    summary: 'Recognize why smooth rereading tricks your brain into false mastery and replace it with closed-book free recall.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L1', 'APA Memory Pillar'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'study-l1-s1',
        kind: 'narrative',
        title: 'Recognizing Is NOT Recalling',
        bodyMarkdown:
          'When you reread highlighted notes three times in a row, text glides across your eyes smoothly. Your metacognition mistakes **perceptual familiarity ("Oh yeah, I know this!")** for **retrieval strength ("Can I reconstruct this on a blank exam page?")**.\n\n**Testing yourself** (active recall) is not just measurement—the act of pulling a concept out of memory **physically strengthens** the neural pathway!',
        callout: {
          tone: 'pitfall',
          text: 'Highlighting while reading feels productive while demanding zero retrieval effort—producing the lowest 1-week exam retention in controlled trials.',
        },
      },
      {
        id: 'study-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Predict 1-Week Recall: Repeated Study vs. Retrieval Practice',
        predictionPrompt:
          'Group S spends 4 blocks rereading a biology passage (`SSSS`). Group T reads once then spends 3 blocks recalling everything on blank paper (`STTT`). Both predict how well they’ll remember a week later. Who scores HIGHER on Day 7?',
        predictionChoices: [
          'Group S (`SSSS`) scores higher on both Day 0 and Day 7',
          'Group S feels more confident immediately, yet Group T (`STTT`) wins dramatically on Day 7 delayed recall',
          'Both remember identically at Day 7',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'fsrs-memory-decay-2d',
          initialParams: { targetRetention: 90, initialStab: 2.0, gradeQuality: 2, repCount: 4, showCram: 1 },
        },
        observeInstruction:
          'Compare the steep crammed/passive drop against repeated active recall stabilization: delayed testing consistently beats passive restudy on retention beyond 24 hours.',
        explainPrompt: 'Why did Group S overestimate their future exam score right after studying?',
        explainOptions: [
          'Reading notes kept concepts momentarily vivid in working memory, masking how weak long-term retrieval cues were.',
          'Group S accidentally read inverted fonts.',
          'Group T cheated during delayed testing.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Because exams remove your notes, your study sessions MUST practice cue-driven reconstruction without peeking—only check answers AFTER committing a real attempt.',
      },
      {
        id: 'study-l1-s3',
        kind: 'worked-example',
        title: 'Convert a Passive Study Hour Into a High-Yield Recall Block',
        problemMarkdown: 'Upgrade a 45-minute textbook review block on cellular respiration:',
        steps: [
          {
            label: 'Minutes 0–10: Close-book brain dump',
            expressionOrAction: 'Write every step/equation you remember BEFORE opening notes',
            whyNote: 'Forces genuine retrieval and reveals exact blind spots in 10 minutes flat.',
          },
          {
            label: 'Minutes 10–25: Targeted gap repair + new card creation',
            expressionOrAction: 'Open notes in another ink color; add missing mechanisms directly onto blank recall sheet',
            whyNote: 'Corrective feedback right after struggle produces massive encoding gains.',
          },
          {
            label: 'Minutes 25–45: Applied problems & spaced flashcards',
            expressionOrAction: 'Solve fresh transfer questions without flipping back to formula box',
            whyNote: 'Tests retrieval under realistic test cues.',
          },
        ],
      },
      {
        id: 'study-l1-s4',
        kind: 'faded-practice',
        title: 'Diagnose Study Misattribution',
        promptMarkdown: 'Devon spent 4 hours copying lecture slides neatly in colored pens without closing the slides once, felt super confident, and bombed Friday’s short-answer test.',
        completedSteps: ['Copying slides word-for-word kept text continuously inside visual working memory.', 'No unprompted retrieval from long-term memory occurred during those 4 hours.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which metacognitive illusion explains Devon’s surprise?',
            options: [
              'Fluency illusion (familiarity mistaken for recallability)',
              'Spacing effect saturation',
              'Hyper-consolidation',
              'Retroactive sleep benefit',
            ],
            correct: 0,
            points: 10,
            explanation: 'Smooth visual familiarity while looking at open slides tricks judgment of learning (JOL) without building recall routes.',
          },
        },
      },
      {
        id: 'study-l1-s5',
        kind: 'branching-scenario',
        title: 'Midterm Eve Rescue: 90 Minutes Left Before Sleep',
        startNodeId: 'plan',
        nodes: {
          plan: {
            promptMarkdown:
              'You have 90 focused minutes tonight before sleeping ahead of tomorrow’s cumulative midterm across 6 chapters.',
            choices: [
              {
                label: 'Run a rapid closed-book practice test across all 6 chapters, mark misses, and spend 40 mins fixing ONLY missed concepts',
                nextNodeId: 'finish',
                feedback: 'Optimal triage! Closed-book diagnosis spots weak links fast and repairs them with retrieval practice.',
                outcome: 'optimal',
              },
              {
                label: 'Reread Chapter 1 and Chapter 2 textbook pages slowly from top to bottom',
                nextNodeId: 'plan',
                feedback: 'Rereading burns all 90 minutes on passive fluency for only 2 of 6 chapters while leaving weak chapters untested.',
                outcome: 'suboptimal',
              },
            ],
          },
          finish: {
            promptMarkdown: 'At minute 90, you still feel shaky on one minor bonus list. Stay up til 2 a.m. or stop for 8 hours sleep?',
            choices: [
              {
                label: 'Stop and get full sleep so hippocampal consolidation locks in the 6 chapters cleanly',
                nextNodeId: null,
                feedback: 'Smart execution: sleep deprivation wrecks executive attention and working memory on exam morning far more than one extra crammed detail helps!',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'study-l1-s6',
        kind: 'synthesis',
        title: 'Retrieval Practice Takeaways',
        takeaways: [
          'Smooth rereading produces fluency illusions; closed-book free recall reveals true mastery.',
          'Always attempt an answer BEFORE peeking at solutions—feedback sticks deepest after struggle.',
          'Brain dumps ("blank-page recall") take 10 minutes and immediately pinpoint what to review next.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'knowledge-bastion', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-fluency',
        front: 'What is the "fluency illusion" in studying?',
        back: 'Mistaking the ease of recognizing open notes during rereading for the ability to recall them unaided on an exam.',
        explanation: 'Fix it by delaying judgments of learning and testing closed-book recall.',
        interleave: true,
      },
      {
        id: 'study-fc-testing-effect',
        front: 'Why is retrieval practice called the "testing effect" rather than mere assessment?',
        back: 'Actively reconstructing memory physically strengthens neural retrieval pathways more than spending equal time re-exposing yourself passively.',
        explanation: 'Even failed retrieval followed by immediate feedback boosts later encoding.',
        interleave: true,
      },
      {
        id: 'study-fc-brain-dump',
        front: 'Describe the 10-minute "blank-page brain dump" technique.',
        back: 'Before opening notes, write down everything remembered about a topic, then open notes in another color to fill only missing/inaccurate parts.',
        explanation: 'Replaces blind chapter re-reading with targeted error correction.',
        interleave: true,
      },
    ],
  },
  {
    id: 'study-l2-elaboration-dual',
    unitId: 'study-u1-retrieval',
    title: 'Elaborative Interrogation & Dual Coding',
    summary: 'Anchor isolated facts into durable mental models by asking "Why does this happen?" and pairing words with spatial visuals.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L2'],
    prerequisiteLessonIds: ['study-l1-fluency-illusion'],
    steps: [
      {
        id: 'study-l2-s1',
        kind: 'narrative',
        title: 'Isolated Facts Evaporate; Connected Causal Webs Stick',
        bodyMarkdown:
          'Trying to brute-force memorize ten detached sentences creates fragile rote links. Two high-leverage encoding strategies bind new facts onto everything you already know:\n1. **Elaborative interrogation**: Ask *"Why is this rule true rather than the opposite?"*\n2. **Dual coding**: Translate dense verbal rules into **spatial diagrams, timelines, or causal arrows**—encoding in both verbal AND visual channels.',
        callout: {
          tone: 'key-idea',
          text: 'Dual coding does NOT mean decorative clip-art! It means sketching a simplified conceptual flow (without staring at slides) and explaining each arrow aloud.',
        },
      },
      {
        id: 'study-l2-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Text-Only vs. Self-Drawn Causal Sketch Recall',
        predictionPrompt:
          'Students learn how kidneys regulate blood pressure either by memorizing a 200-word bullet list OR sketching an unlabeled flow arrow map connecting pressure -> renin -> vessel tone while explaining "why". Who solves novel clinical transfer problems better?',
        predictionChoices: [
          'The word-list memorizers always transfer faster',
          'Students who generated causal visual diagrams + "why" explanations solve novel transfer cases significantly better',
          'Both perform identically on unfamiliar cases',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 1, y1: 21, x2: 5, y2: 39 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Observe rising transfer performance when concepts are organized spatially and causally rather than flatly memorized line-by-line.',
        explainPrompt: 'Why does explaining "why" aloud (self-explanation) beat copying definitions verbatim?',
        explainOptions: [
          'Causal explanation exposes hidden gaps in your mental model and connects new principles to prior cause-and-effect schemas.',
          'Speaking louder vibrates vocal cords into auditory cortex.',
          'Definitions contain fewer syllables.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Self-explanation forces you to notice "Wait—what actually causes step 3?" immediately, fixing shallow understanding before exam day.',
      },
      {
        id: 'study-l2-s3',
        kind: 'worked-example',
        title: 'Transform a Shallow Flashcard Into an Elaborative Dual Card',
        problemMarkdown: 'Upgrade a rote economics card (`"Price ceiling below P* -> shortage"`):',
        steps: [
          {
            label: 'Weak rote prompt',
            expressionOrAction: 'Q: What does a binding price ceiling cause? A: Shortage.',
            whyNote: 'Easy to parrot without grasping which firms exit supply.',
          },
          {
            label: 'Elaborative "Why?" prompt',
            expressionOrAction: 'Q: Why does capping rent below market P* shrink quantity supplied AND expand quantity demanded? Sketch S/D gap.',
            whyNote: 'Connects buyer marginal willingness to pay vs. seller marginal cost directly.',
          },
        ],
      },
      {
        id: 'study-l2-s4',
        kind: 'faded-practice',
        title: 'Spot True Dual Coding vs. Passive Decoration',
        promptMarkdown: 'Two biology learners make study guides for synaptic transmission.',
        completedSteps: [
          'Learner A adds pastel borders and clip-art brains around copied text paragraphs.',
          'Learner B draws a 4-arrow diagram from AP arrival -> Ca2+ -> vesicle fusion -> receptor opening from memory.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which learner is genuinely practicing evidence-based Dual Coding?',
            options: [
              'Learner B — transforming verbal rules into an explanatory spatial causal diagram',
              'Learner A — aesthetic borders double visual encoding automatically',
              'Both equally',
              'Neither unless notes use cursive',
            ],
            correct: 0,
            points: 10,
            explanation: 'Dual coding pairs meaningful spatial representation with verbal concepts so both memory codes reinforce retrieval.',
          },
        },
      },
      {
        id: 'study-l2-s5',
        kind: 'checkpoint',
        title: 'Apply Elaborative Interrogation',
        question: {
          type: 'truefalse',
          prompt: 'Asking "How does this principle connect to or differ from Concept X we learned last week?" is a form of elaborative interrogation.',
          correct: true,
          points: 10,
          explanation: 'True! Linking mechanisms across concepts weaves dense relational retrieval cues.',
        },
      },
      {
        id: 'study-l2-s6',
        kind: 'synthesis',
        title: 'Elaboration & Dual Coding Takeaways',
        takeaways: [
          'Ask "Why does this hold?" and "How does this compare to X?" to move from rote memorization to transfer.',
          'Turn linear paragraphs into spatial flowcharts, axes, or labeled causal diagrams.',
          'Generative sketching from memory beats looking passively at finished textbook figures.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'diagram-scout', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-elab-interrog',
        front: 'Define "elaborative interrogation" during studying.',
        back: 'Explicitly prompting yourself to generate explanations for WHY stated facts or rules hold and how they connect to prior knowledge.',
        explanation: 'Transforms shallow facts into causal networks.',
        interleave: true,
      },
      {
        id: 'study-fc-dual-coding',
        front: 'What is "dual coding" in cognitive psychology?',
        back: 'Combining verbal explanations with meaningful spatial visuals (diagrams, timelines, graphs) so memory stores two mutually reinforcing traces.',
        explanation: 'Drawing diagrams from memory beats copying textbook art verbatim.',
        interleave: true,
      },
      {
        id: 'study-fc-feynman',
        front: 'How does teaching a concept simply in plain words ("Feynman check") reveal gaps?',
        back: 'Any spot where you fall back on unexplained jargon marks an uncomprehended link to revisit immediately.',
        explanation: 'Plain-language synthesis enforces deep causal clarity.',
        interleave: true,
      },
    ],
  },
  {
    id: 'study-l3-pretesting',
    unitId: 'study-u1-retrieval',
    title: 'Pre-Testing & Productive Desirable Difficulties',
    summary: 'Harness pre-testing before lectures and understand why manageable effort ("desirable difficulty") accelerates long-term mastery.',
    estimatedMinutes: 7,
    standards: ['OpenPath Learning Science L3'],
    prerequisiteLessonIds: ['study-l2-elaboration-dual'],
    steps: [
      {
        id: 'study-l3-s1',
        kind: 'narrative',
        title: 'Why Making a Wild Guess BEFORE Reading Boosts Retention',
        bodyMarkdown:
          'Most learners avoid attempting questions until they feel "100% ready." Yet experiments consistently find the **pre-testing effect**: guessing an answer on unfamiliar questions *before* reading a chapter—even getting 80% wrong!—makes subsequent reading encode far deeper.\n\nBjork calls strategies like pre-testing, spacing, and closed-book recall **desirable difficulties**: they feel harder today because they build stronger storage tomorrow.',
        callout: {
          tone: 'key-idea',
          text: 'Prediction steps inside every OpenPath lesson exist precisely to prime curiosity and error-correction signals BEFORE you explore the solution!',
        },
      },
      {
        id: 'study-l3-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Pre-Test Outcome Even When Initial Guesses Fail',
        predictionPrompt:
          'Students spend 5 minutes attempting tricky pretest questions on an unfamiliar topic before reading the chapter (scoring ~15% on the pretest) vs. spending 5 minutes previewing bold headings before reading. Who remembers MORE from the chapter next week?',
        predictionChoices: [
          'Heading previewers remember more because guessing wrong cements errors',
          'Pre-tested students remember MORE—as long as they receive corrective reading/feedback afterward!',
          'Pre-testing harms reading comprehension',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 8, x2: 7, y2: 38 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Notice how an initial wrong prediction with immediate explanatory feedback creates a steep positive learning trajectory rather than "cementing errors."',
        explainPrompt: 'When could guessing wrong on a pretest fail to help?',
        explainOptions: [
          'Only if the learner NEVER receives corrective feedback afterward—prediction + timely feedback is the magic pair.',
          'Whenever questions take more than 10 seconds.',
          'On all STEM formulas.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Errorful generation followed by prompt corrective explanation activates semantic networks and focuses attention squarely on the missing mechanism!',
      },
      {
        id: 'study-l3-s3',
        kind: 'worked-example',
        title: 'Distinguish Desirable vs. Undesirable Difficulty',
        problemMarkdown: 'Tell productive struggle apart from unhelpful friction:',
        steps: [
          {
            label: 'Desirable difficulty (builds encoding)',
            expressionOrAction: 'Spacing reviews across days, mixing problem types, attempting recall without hints first',
            whyNote: 'Effort engages memory retrieval and discrimination processes.',
          },
          {
            label: 'Undesirable difficulty (wastes cognitive load)',
            expressionOrAction: 'Missing prerequisite math vocabulary, unreadable blurry notation, zero feedback after errors',
            whyNote: 'Struggling without prerequisite math or timely feedback stalls progress rather than helping!',
          },
        ],
      },
      {
        id: 'study-l3-s4',
        kind: 'faded-practice',
        title: 'Evaluate Pre-Reading Routine',
        promptMarkdown: 'Before Monday’s thermodynamics lecture, Kai tries the 4 end-of-chapter conceptual questions first, bombs 3 of them, then attends class curious to see why.',
        completedSteps: ['Kai activated relevant physics priors via failed predictions.', 'During lecture, those exact blind spots grab attentional focus.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which outcome happens when Kai attempts unfamiliar pretest questions BEFORE studying and then reads corrective explanations?',
            options: [
              'Subsequent retention improves noticeably because missed predictions focused attention on the gaps',
              'Wrong pretest guesses become permanently memorized regardless of reading solutions',
              'Study efficiency drops to zero',
              'Textbooks lose readability',
            ],
            correct: 0,
            points: 10,
            explanation: 'Pre-testing consistently improves retention when paired with corrective reading or feedback.',
          },
        },
      },
      {
        id: 'study-l3-s5',
        kind: 'checkpoint',
        title: 'Identify Core Principle',
        question: {
          type: 'mcq',
          prompt: 'Which condition is REQUIRED for failed pretest guessing to boost later learning?',
          options: [
            'Receiving corrective feedback/explanation shortly afterward',
            'Never reading the textbook afterward',
            'Grading the pretest for 50% of the final course grade',
            'Reading notes in complete silence only',
          ],
          correct: 0,
          points: 10,
          explanation: 'Wrong predictions unlock hyper-attention to corrective explanations.',
        },
      },
      {
        id: 'study-l3-s6',
        kind: 'synthesis',
        title: 'Unit 1 Foundations Takeaways',
        takeaways: [
          'Pre-test and predict BEFORE reading explanations—struggle primes lasting encoding once feedback arrives.',
          'Effortful study feels slower in the moment precisely because memory work is actually happening ("desirable difficulty").',
          'Never skip checking feedback after missed attempts—timely correction prevents fossilizing misconceptions.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-pretest',
        front: 'What is the "pre-testing effect" and what single condition makes it work?',
        back: 'Attempting questions before studying material improves later memory of the material—provided corrective feedback/study follows.',
        explanation: 'Failed attempts highlight knowledge boundaries for the brain.',
        interleave: true,
      },
      {
        id: 'study-fc-desirable-diff',
        front: 'Define Robert Bjork’s concept of "desirable difficulties."',
        back: 'Learning conditions (spacing, retrieval, interleaving) that slow short-term fluency while strengthening long-term retention and transfer.',
        explanation: 'Contrast with undesirable difficulties lacking prerequisite knowledge or feedback.',
        interleave: true,
      },
      {
        id: 'study-fc-feedback-timing',
        front: 'Why should answers stay hidden until AFTER committing a real retrieval attempt?',
        back: 'Seeing the answer first collapses retrieval into passive recognition and kills the generation/feedback gain.',
        explanation: 'Always lock in your honest attempt before revealing solutions.',
        interleave: true,
      },
    ],
  },
]

const STUDY_U2_LESSONS: PackLesson[] = [
  {
    id: 'study-l4-spacing-decay',
    unitId: 'study-u2-spacing-fsrs',
    title: 'Forgetting Curves & Why Spacing Beats Cramming',
    summary: 'Simulate Ebbinghaus forgetting curves and prove why 4 spaced reviews crush 4 crammed reviews at Day 40.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L4'],
    prerequisiteLessonIds: ['study-l3-pretesting'],
    visual: {
      kind: 'model-2d',
      modelId: 'fsrs-memory-decay-2d',
      initialParams: { targetRetention: 90, initialStab: 2.0, gradeQuality: 2, repCount: 4, showCram: true },
    },
    steps: [
      {
        id: 'study-l4-s1',
        kind: 'narrative',
        title: 'Same 4 Reviews, Radically Different Day-40 Survival',
        bodyMarkdown:
          'Why can two students study the **exact same total minutes**—say 4 flashcard passes—and have one remember 85% next month while the other forgets 70% in a week?\n\nMemory decay follows a steep power law at first. Reviewing right before recall drops below ~90% forces effortful reconstruction, multiplying **memory stability `S`** (e.g., 2d -> 5d -> 12d -> 28d)! Cramming all 4 passes on Day 1 barely nudges `S`.',
        callout: {
          tone: 'key-idea',
          text: 'Cramming optimizes performance on **tomorrow morning’s quiz** while leaving almost zero trace two weeks later.',
        },
      },
      {
        id: 'study-l4-s2',
        kind: 'predict-observe-explain',
        title: 'Run the Day-40 Spacing vs. Cramming Experiment',
        predictionPrompt:
          'Compare 4 "Good" reviews spaced at 90% retention vs. 4 crammed reviews inside Day 0–1.5. Where does Crammed recall land by Day 40?',
        predictionChoices: ['Over 80% just like spaced', 'Under 35% (collapsed decay curve)', '100% permanent'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'fsrs-memory-decay-2d',
          initialParams: { targetRetention: 90, initialStab: 2.0, gradeQuality: 2, repCount: 2, showCram: true },
          challengeId: 'study-spacing-day40',
          targetChallenge: {
            id: 'study-spacing-day40',
            instruction: 'Increase Scheduled Reviews to at least 4 (keeping Good grade, 90% Target Retention, Cramming ON) so Spaced Day 40 Recall reaches >= 80%.',
            assertions: [
              { source: 'param', key: 'repCount', op: 'gte', target: 4 },
              { source: 'readout', key: 'Spaced Day 40 Recall', op: 'gte', target: 80 },
            ],
          },
        },
        observeInstruction:
          'Increase `Scheduled Reviews` from 2 to 4+ and observe how each spaced spike (`R1..R4`) flattens the green decay curve cleanly above 80% on Day 40 while the dashed red cramming line plunges below 35%.',
        explainPrompt: 'What changed biologically and mathematically during the 4 spaced reviews?',
        explainOptions: [
          'Each near-threshold retrieval multiplied stability `S`, turning a steep 2-day decay into a multi-week plateau.',
          'Spaced cards switched from English to Latin.',
          'The 4th review erased the earlier forgetting curve completely.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Zero extra reviews were added—simply spacing those 4 reviews over widening intervals multiplied long-term stability!',
      },
      {
        id: 'study-l4-s3',
        kind: 'worked-example',
        title: 'Compare Study Budgets Across a 30-Day Month',
        problemMarkdown: 'Compare 60 minutes total study split two ways before a Day-30 final:',
        steps: [
          {
            label: 'Massed plan: 60 mins on Day 29',
            expressionOrAction: 'Passes Day 30 marginally; crashes below 25% by Day 45 next term',
            whyNote: 'Prerequisite foundation evaporates before next semester starts.',
          },
          {
            label: 'Spaced plan: 15m Day 1 + 15m Day 3 + 15m Day 9 + 15m Day 22',
            expressionOrAction: 'Same 60 total minutes -> ~88% stable recall on Day 30 AND Day 45',
            whyNote: 'Widening intervals harvest forgetting-induced re-encoding every session.',
          },
        ],
      },
      {
        id: 'study-l4-s4',
        kind: 'faded-practice',
        title: 'Spot When Cramming Misleads Learners',
        promptMarkdown: 'Why do so many students swear cramming works well?',
        completedSteps: [
          'Massed cramming floods short-term familiarity right before next morning’s test.',
          'Courses that test each unit once and never check cumulative recall hide the subsequent steep crash.',
        ],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'When does the hidden cost of cramming surface painfully?',
            options: [
              'On cumulative finals, standardized exams, or sequel courses months later when everything must be relearned from scratch',
              'Only if you sleep 8 hours the night before',
              'Never—cramming builds equal 6-month stability',
              'Only on multiple-choice questions',
            ],
            correct: 0,
            points: 10,
            explanation: 'Cramming yields short-lived performance that decays rapidly before cumulative exams and advanced follow-on courses.',
          },
        },
      },
      {
        id: 'study-l4-s5',
        kind: 'checkpoint',
        title: 'Optimal Timing of Next Review',
        question: {
          type: 'truefalse',
          prompt: 'Repeating a flashcard 10 seconds after seeing its answer builds far more long-term memory stability than waiting until recall begins feeling slightly effortful.',
          correct: false,
          points: 10,
          explanation: 'False! Immediate zero-delay repetition takes zero retrieval effort from long-term memory and adds negligible stability.',
        },
      },
      {
        id: 'study-l4-s6',
        kind: 'synthesis',
        title: 'Spacing Takeaways',
        takeaways: [
          'Distributing the exact same study minutes across widening gaps builds dramatically higher multi-month retention.',
          'Wait until recall drops slightly toward ~90% before re-testing—mild effort triggers stability growth.',
          'Cramming trades cumulative future readiness for brief overnight recall.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'sim-sandbox', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-spacing',
        front: 'What is the "spacing effect" in learning science?',
        back: 'Long-term retention improves dramatically when identical study/practice repetitions are spread across separated intervals rather than massed in one cram block.',
        explanation: 'One of the most replicated effects in all of cognitive psychology.',
        interleave: true,
      },
      {
        id: 'study-fc-stability',
        front: 'In memory modeling (like FSRS), what does Stability `S` represent?',
        back: 'The interval in days for recall probability (`Retrievability R`) to decay from 100% down to 90%.',
        explanation: 'Larger S means a flatter, slower forgetting curve.',
        interleave: true,
      },
      {
        id: 'study-fc-cram-cost',
        front: 'Why does massed cramming produce poor return on investment for cumulative courses?',
        back: 'Repetitions inside a single evening require little long-term retrieval, leaving Stability `S` tiny so content fades quickly right after the exam.',
        explanation: 'Forces costly re-learning in later courses.',
        interleave: true,
      },
    ],
  },
  {
    id: 'study-l5-fsrs-mechanics',
    unitId: 'study-u2-spacing-fsrs',
    title: 'FSRS Mechanics: Stability, Difficulty & the 97% Workload Trap',
    summary: 'Balance desired retention target against daily review load so spaced repetition stays sustainable year-round.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L5'],
    prerequisiteLessonIds: ['study-l4-spacing-decay'],
    visual: {
      kind: 'model-2d',
      modelId: 'fsrs-memory-decay-2d',
      initialParams: { targetRetention: 85, initialStab: 2.0, gradeQuality: 2, repCount: 6, showCram: false },
    },
    steps: [
      {
        id: 'study-l5-s1',
        kind: 'narrative',
        title: 'Why Setting Desired Retention to 98% Breaks Most Flashcard Habits',
        bodyMarkdown:
          'OpenPath’s **FSRS** scheduler tracks three state numbers per card: **Retrievability `R`** (chance you remember *today*), **Stability `S`** (days until `R` hits 90%), and **Difficulty `D`** (inherent hardness of the item).\n\nIntuitively students crank Desired Retention to `97%–99%` thinking "higher = smarter!" In reality, forgetting decays fastest right below `100%`, so demanding `97%` slashes review intervals by ~3–4×—exploding daily card reviews and causing burnout!',
        callout: {
          tone: 'pitfall',
          text: 'For almost every student, **88%–90% Desired Retention** sits right at the efficiency sweet spot: near-maximum remembered facts per minute invested.',
        },
      },
      {
        id: 'study-l5-s2',
        kind: 'predict-observe-explain',
        title: 'Observe the 97% Retention Workload Explosion',
        predictionPrompt:
          'Raising `Desired Retention` from `85%` to `97%` adds only ~12% higher snapshot recall—yet how does `60-Day Reviews Needed` respond?',
        predictionChoices: [
          'Reviews needed barely budges (+1 review)',
          'Reviews needed jumps dramatically (>= 8+ reviews vs ~3 at 85%!) because intervals shrink drastically',
          'Reviews drop to zero',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'fsrs-memory-decay-2d',
          initialParams: { targetRetention: 85, initialStab: 2.0, gradeQuality: 2, repCount: 6, showCram: false },
          challengeId: 'study-fsrs-workload-trap',
          targetChallenge: {
            id: 'study-fsrs-workload-trap',
            instruction: 'Push Desired Retention up to 96% or higher to observe 60-Day Reviews Needed jump to 8 or more.',
            assertions: [
              { source: 'param', key: 'targetRetention', op: 'gte', target: 96 },
              { source: 'readout', key: '60-Day Reviews Needed', op: 'gte', target: 8 },
            ],
          },
        },
        observeInstruction:
          'Slide `Desired Retention (%)` slowly from `85%` through `90%` up to `97%` while watching `60-Day Reviews Needed`. Notice the non-linear knee above ~93%!',
        explainPrompt: 'Why do required reviews explode nonlinearly above ~93% target retention?',
        explainOptions: [
          'Intervals shrink roughly proportionally to `(R^(-1) - 1)`, forcing tiny intervals near 100% that give minimal stability growth per pass.',
          'FSRS deletes cards whenever retention exceeds 95%.',
          'Computers sleep slower above 95%.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Demanding 97% costs roughly triple the daily flashcards for only tiny extra recall—targeting ~90% keeps queues light and durable!',
      },
      {
        id: 'study-l5-s3',
        kind: 'worked-example',
        title: 'Grade Honestly: Again / Hard / Good / Easy',
        problemMarkdown: 'Pick honest FSRS ratings so intervals calibrate cleanly:',
        steps: [
          {
            label: 'Forgot completely -> Grade "Again" (lapse)',
            expressionOrAction: 'Resets Stability downward and schedules a prompt re-check',
            whyNote: 'Dishonestly pressing "Good" on a guess pushes a forgotten card out weeks—causing repeated failure later.',
          },
          {
            label: 'Remembered after real effort -> "Good"',
            expressionOrAction: 'Standard stability expansion (`2d -> ~5d -> ~13d`)',
            whyNote: 'Default target rating for nearly all cards.',
          },
        ],
      },
      {
        id: 'study-l5-s4',
        kind: 'faded-practice',
        title: 'Interpret the Three FSRS Variables (`D, S, R`)',
        promptMarkdown: 'Two cards sit in your deck. Card 1 has `S = 40 days` and `R = 92%`. Card 2 has `S = 3 days` and `R = 88%`.',
        completedSteps: ['Card 1 has flat decay (40-day half-life to 90%).', 'Card 2 forgets quickly and is already below 90%.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which card needs review SOONER according to FSRS prioritization?',
            options: [
              'Card 2 (lower Retrievability 88% & fragile 3-day Stability)',
              'Card 1 (even though S=40 days is very durable)',
              'Neither—wait 40 days for both',
              'Delete Card 2 permanently',
            ],
            correct: 0,
            points: 10,
            explanation: 'Card 2’s lower Retrievability crosses threshold first and needs stabilizing earlier.',
          },
        },
      },
      {
        id: 'study-l5-s5',
        kind: 'checkpoint',
        title: 'Pick Optimal Default Target Retention',
        question: {
          type: 'mcq',
          prompt: 'Which Desired Retention setting offers the best knowledge-per-minute efficiency for most semester courses without review burnout?',
          options: ['65%', '90%', '99%', '100%'],
          correct: 1,
          points: 10,
          explanation: '~90% balances strong recall with lean, sustainable daily review queues.',
        },
      },
      {
        id: 'study-l5-s6',
        kind: 'synthesis',
        title: 'FSRS Scheduling Takeaways',
        takeaways: [
          'FSRS models Difficulty (`D`), Stability (`S`), and current Retrievability (`R`).',
          'Target ~88%–90% Desired Retention for sustainable study workload rather than 97%–99% burnout.',
          'Rate cards honestly ("Again" when forgotten, "Good" when successfully recalled) so intervals stay accurate.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'streak-siege', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-dsr',
        front: 'What do D, S, and R stand for in FSRS (Three-Component Memory Model)?',
        back: 'Difficulty (`D`, inherent card hardness), Stability (`S`, interval in days at R=90%), and Retrievability (`R`, current recall probability).',
        explanation: 'Together they predict optimal next review dates per card.',
        interleave: true,
      },
      {
        id: 'study-fc-97trap',
        front: 'Why is setting FSRS Desired Retention to 97–99% usually counterproductive?',
        back: 'Because forgetting drops fastest near 100%, intervals collapse dramatically—multiplying daily reviews 3x–4x and causing deck abandonment.',
        explanation: '88%–90% maximizes facts retained per study hour.',
        interleave: true,
      },
      {
        id: 'study-fc-honest-again',
        front: 'What happens if you dishonestly click "Good" on a card you actually forgot?',
        back: 'FSRS widens the next interval even further—making the card almost certain to fail again later instead of stabilizing promptly.',
        explanation: 'Click "Again" whenever recall failed without hints.',
        interleave: true,
      },
    ],
  },
  {
    id: 'study-l6-backlog-triage',
    unitId: 'study-u2-spacing-fsrs',
    title: 'Atomic Cards & Backlog Recovery Habits',
    summary: 'Write focused minimum-information flashcards and recover smoothly whenever travel or illness creates a card backlog.',
    estimatedMinutes: 7,
    standards: ['OpenPath Learning Science L6'],
    prerequisiteLessonIds: ['study-l5-fsrs-mechanics'],
    steps: [
      {
        id: 'study-l6-s1',
        kind: 'narrative',
        title: 'One Card = One Crisp Retrieval Target (Never Textbook Paragraphs!)',
        bodyMarkdown:
          'Bloated flashcards listing 6 bullet points fail for a simple reason: forgetting just item #4 ruins the whole review and traps you clicking "Again" endlessly (**minimum information principle**).\n\nAlso remember: if life hits and you return to 150 overdue cards, **NEVER wipe your deck!** Pause *new* cards temporarily and chip away at 20–30 due cards/day.',
        callout: {
          tone: 'pitfall',
          text: 'Deleting or restarting an overdue deck throws away months of high-stability cards that you STILL actually remember—even after a 1-week break!',
        },
      },
      {
        id: 'study-l6-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Recovery Outcome When Pausing New Cards',
        predictionPrompt:
          'Suppose 120 cards go overdue during flu week. You remember ~70% of those mature cards anyway once tested! What clears the backlog cleanly without burning out?',
        predictionChoices: [
          'Reset all card history to Day 0',
          'Temporarily pause adding NEW cards, cap daily reviews at 25–35 due cards, and grade honestly',
          'Click "Easy" blindly on all 120 without reading answers',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 48, x2: 4, y2: 0 },
            ask: 'slope',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Trace daily backlog drain along negative slope (`-12` due cards/day on a sample 48-card sprint): because mature stability survives short delays better than expected, a calm multi-day catch-up restores zero-backlog.',
        explainPrompt: 'Why does FSRS handle overdue gaps gracefully if you resume reviewing honestly?',
        explainOptions: [
          'When you actually recall an overdue card after 15 days instead of 10, FSRS rewards the successfully recalled longer gap with even stronger updated stability!',
          'FSRS stops aging overdue cards during weekends.',
          'Pause hides card backs permanently.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Remembering a slightly overdue card actually proves higher robustness—so pausing new intake for a few days clears backlogs cleanly without losing progress.',
      },
      {
        id: 'study-l6-s3',
        kind: 'worked-example',
        title: 'Refactor a Bloated Card Into Atomic Prompts',
        problemMarkdown: 'Split `"List all 4 steps of synaptic transmission + Ca2+ + SSRIs"` cleanly:',
        steps: [
          {
            label: 'Anti-pattern (multi-part wall)',
            expressionOrAction: '1 huge card testing Ca2+, vesicles, receptors, and reuptake all at once',
            whyNote: 'Failing 1 detail forces resetting 3 facts you already knew!',
          },
          {
            label: 'Atomic split (3 fast cards)',
            expressionOrAction: 'Card 1: Ca2+ role; Card 2: cleft clearance mechanisms; Card 3: SSRI effect on cleft occupancy',
            whyNote: 'Each card answers in <5 seconds and isolates weak points accurately.',
          },
        ],
      },
      {
        id: 'study-l6-s4',
        kind: 'faded-practice',
        title: 'Fix an Ambiguous Flashcard Prompt',
        promptMarkdown: 'Look at this weak card front: `"What about Python lists?"`',
        completedSteps: ['Too vague: learner cannot tell whether prompt wants syntax, slicing, or aliasing.', 'Good cards specify one concrete cue and unambiguous target answer.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which rewritten card best satisfies the Minimum Information Principle?',
            options: [
              'Front: "Why does `b = a` fail to copy a Python list independently, and what fixes it?" | Back: "Both alias the same mutable object; use `a.copy()` or `a[:]`."',
              'Front: "Everything about lists and dicts in Python" | Back: "5 paragraphs of code."',
              'Front: "Python" | Back: "A programming language."',
              'Front: "True/False?" | Back: "True."',
            ],
            correct: 0,
            points: 10,
            explanation: 'Specific cue + single conceptual rule keeps review crisp, objective, and fast.',
          },
        },
      },
      {
        id: 'study-l6-s5',
        kind: 'branching-scenario',
        title: 'Back From Spring Break: 160 Due Flashcards Waiting',
        startNodeId: 'backlog',
        nodes: {
          backlog: {
            promptMarkdown:
              'You skipped reviews for 6 days on trip and open OpenPath Flashcards to `160` due cards across CS, Psychology, and Finance.',
            choices: [
              {
                label: 'Pause adding new lesson cards for 4 days and clear ~35–40 due cards daily (oldest/hardest first or small calm sprints)',
                nextNodeId: 'recovered',
                feedback: 'Sustainable recovery! By Day 4 your daily queue settles back to baseline without burnout or memory wipe.',
                outcome: 'optimal',
              },
              {
                label: 'Attempt all 160 plus 40 brand-new cards in one frustrated midnight session',
                nextNodeId: 'backlog',
                feedback: 'Exhausting marathon drives low attention, rushed grading, and next-week deck abandonment.',
                outcome: 'suboptimal',
              },
              {
                label: 'Delete your whole profile and start fresh',
                nextNodeId: 'backlog',
                feedback: 'Worst choice: erases long-term stability data on ~110 cards you actually still remember!',
                outcome: 'unsafe',
              },
            ],
          },
          recovered: {
            promptMarkdown: 'After clearing the 160 backlog by Friday, what daily habit keeps queues tiny (<10 mins/day) all term?',
            choices: [
              {
                label: 'Anchor 10 minutes of Flashcards onto an existing daily cue (morning coffee / post-lunch break) before opening feeds',
                nextNodeId: null,
                feedback: 'Habit stacking turns spaced review into effortless daily hygiene!',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'study-l6-s6',
        kind: 'synthesis',
        title: 'Unit 2 Habit & Card Design Takeaways',
        takeaways: [
          'Keep cards atomic ("Minimum Information Principle"): one clear cue, one crisp answer.',
          'When backlogs hit, pause NEW cards and chip through existing due cards over 3–5 days—never wipe mature decks.',
          'Anchor 5–10 minute FSRS reviews to a fixed daily habit trigger.',
        ],
        nextQuizIndex: 1,
        arcadeLaunch: { mode: 'cloze-workbench', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-min-info',
        front: 'What is the "Minimum Information Principle" for flashcards?',
        back: 'Write short, focused cards testing ONE discrete fact or relation so reviews take seconds and lapses pinpoint exact gaps.',
        explanation: 'Split 5-part lists into separate targeted prompts or cloze cards.',
        interleave: true,
      },
      {
        id: 'study-fc-backlog',
        front: 'What two steps recover smoothly from a 150-card overdue FSRS backlog?',
        back: '1) Pause adding new cards temporarily; 2) cap daily reviews at a comfortable steady pace (~30/day) for several days without wiping progress.',
        explanation: 'Never erase stability logs on mature items.',
        interleave: true,
      },
      {
        id: 'study-fc-leech',
        front: 'How should you fix a "leech" flashcard you keep failing 4+ times in a row?',
        back: 'Pause and rewrite it with simpler wording, a concrete analogy, or split it into smaller sub-concepts instead of brute-forcing repetitions.',
        explanation: 'Repeated failure usually reflects poor encoding or bloated card design.',
        interleave: true,
      },
    ],
  },
]

const STUDY_U3_LESSONS: PackLesson[] = [
  {
    id: 'study-l7-interleaving',
    unitId: 'study-u3-interleaving-calibration',
    title: 'Blocked vs. Interleaved Practice (and When Blocking Wins)',
    summary: 'Know when mixing problem types forces strategy selection—and when raw beginner vocabulary drills stay blocked.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L7'],
    prerequisiteLessonIds: ['study-l6-backlog-triage'],
    steps: [
      {
        id: 'study-l7-s1',
        kind: 'narrative',
        title: 'End-of-Chapter Drills Hide the Hardest Exam Skill: Choosing WHICH Tool to Use!',
        bodyMarkdown:
          'When a textbook chapter does 15 identical derivative problems (`AAAA BBBB CCCC`), you stop deciding *which rule applies*—because the header already told you! On the final exam, problems arrive shuffled (`ABCACB`).\n\n**Interleaved practice** mixes problem types (`ABCBCA`), training **strategy discrimination**. *Important nuance:* for early foreign-language vocab acquisition, keeping closely themed lists cleanly blocked (`srsInterleave: false`) can reduce initial confusion until basic forms stabilize!',
        callout: {
          tone: 'key-idea',
          text: 'Blocked drills build fast comfort on Practice Day; interleaved mixed problem sets build dramatically higher Transfer Scores on Exam Day.',
        },
      },
      {
        id: 'study-l7-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Practice Accuracy vs. Delayed Test Transfer',
        predictionPrompt:
          'Rohrer & Taylor trained students on 4 geometric volume formulas either BLOCKED (`4 of solid A, then 4 of B...`) or INTERLEAVED (`mixed order`). During practice vs. next-week surprise test, who scored higher?',
        predictionChoices: [
          'Blocked won BOTH practice and next-week test',
          'Blocked scored higher DURING practice (~89% vs ~60%), yet Interleaved CRUSHED the delayed test (~63% vs ~20%!)',
          'Both tied at 50%',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 1, y1: 10, x2: 4, y2: 32 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Inspect that astonishing jump (20% blocked delayed score -> 63% interleaved delayed score!): interleaving forces every item to train "which formula fits this cue?" rather than autopilot copying.',
        explainPrompt: 'Why do learners wrongly distrust interleaving during practice?',
        explainOptions: [
          'Lower in-session practice accuracy feels frustrating, blinding learners to the 3x higher real exam score waiting next week.',
          'Interleaved worksheets use smaller fonts.',
          'Blocked formulas change every Tuesday.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Just like spacing and pre-testing, interleaving is a desirable difficulty: mixing problem types builds diagnostic cue discrimination.',
      },
      {
        id: 'study-l7-s3',
        kind: 'worked-example',
        title: 'Choose Blocked vs. Interleaved Practice by Skill Type',
        problemMarkdown: 'Pick the right mode for two very different decks:',
        steps: [
          {
            label: 'Deck A: Distinguishing Python loops vs. recursion vs. binary search problems',
            expressionOrAction: 'Interleave (`srsInterleave: true`) after initial 2-item warm-up',
            whyNote: 'Real coding tests never announce which algorithm template to pick!',
          },
          {
            label: 'Deck B: First-week Spanish restaurant vocabulary pairs',
            expressionOrAction: 'Keep thematically grouped (`srsInterleave: false`) during initial encoding',
            whyNote: 'Grouped semantic sets speed early lexical acquisition before later mixed conversation!',
          },
        ],
      },
      {
        id: 'study-l7-s4',
        kind: 'faded-practice',
        title: 'Fix a Blocked Study Habit',
        promptMarkdown: 'After mastering 2 practice problems each on supply shifts, price floors, and excise taxes, Leo does 20 more consecutive excise-tax problems in a row.',
        completedSteps: ['Problems 3–20 required zero decision on whether to shift Supply vs. draw a Price Floor.', 'Tax calculations hit autopilot rather than true recognition.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'How should Leo upgrade those remaining 18 problems for Friday’s mixed exam?',
            options: [
              'Shuffle problems across equilibrium shifts, price ceilings/floors, and excise taxes mixed together',
              'Solve 30 more consecutive excise-tax problems using identical numbers',
              'Copy the excise-tax formula 10 times neatly',
              'Skip practice completely',
            ],
            correct: 0,
            points: 10,
            explanation: 'Interleaving problem categories forces deciding WHICH economic model applies before crunching numbers.',
          },
        },
      },
      {
        id: 'study-l7-s5',
        kind: 'checkpoint',
        title: 'Verify Strategy Discrimination Role',
        question: {
          type: 'truefalse',
          prompt: 'Interleaved practice improves exam scores primarily because it forces learners to identify WHICH concept or strategy applies to each varied problem.',
          correct: true,
          points: 10,
          explanation: 'True! Discriminative cue selection + spaced retrieval between like items drive the interleaving boost.',
        },
      },
      {
        id: 'study-l7-s6',
        kind: 'synthesis',
        title: 'Interleaving Takeaways',
        takeaways: [
          'Use blocked drills only briefly to grasp bare mechanics; switch quickly to interleaved mixed sets.',
          'Interleaving trains problem-type selection ("Which tool fits?") alongside execution.',
          'Thematic language vocabulary decks (`srsInterleave: false`) are an intentional exception keeping related words cleanly clustered initially.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'sequence-architect', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-interleave',
        front: 'What specific cognitive skill does interleaved practice build that blocked practice skips?',
        back: 'Strategy discrimination—choosing WHICH concept, rule, or formula applies from problem cues before executing.',
        explanation: 'Mimics unannounced mixed problem order on real exams.',
        interleave: true,
      },
      {
        id: 'study-fc-interleave-vocab',
        front: 'Why does OpenPath allow `srsInterleave: false` on themed language vocabulary packs?',
        back: 'During early foreign-language vocabulary learning, studying grouped semantic sets helps learners build clean initial word clusters without cross-topic chaos.',
        explanation: 'Conceptual problem-solving subjects keep `srsInterleave: true`.',
        interleave: true,
      },
      {
        id: 'study-fc-blocked-trap',
        front: 'Why can scoring 95% on a blocked chapter worksheet create false exam confidence?',
        back: 'The chapter title tells you which method to apply, eliminating strategy selection and masking fragile long-term discrimination.',
        explanation: 'Shuffle old and new chapters together before quizzes.',
        interleave: true,
      },
    ],
  },
  {
    id: 'study-l8-calibration',
    unitId: 'study-u3-interleaving-calibration',
    title: 'Metacognitive Calibration & Confidence Auditing',
    summary: 'Measure how well your certainty aligns with objective accuracy and eliminate high-confidence blind spots before test day.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L8'],
    prerequisiteLessonIds: ['study-l7-interleaving'],
    visual: {
      kind: 'figure-2d',
      figure: { template: 'normal-curve', givens: { mean: 75, sd: 10, x: 90 }, ask: 'zScore', rounding: 'tenth' },
    },
    steps: [
      {
        id: 'study-l8-s1',
        kind: 'narrative',
        title: 'The Costliest Errors Are "High-Confidence Misses"',
        bodyMarkdown:
          '**Metacognition** means monitoring and steering your own thinking. **Confidence calibration** checks whether answers you rate *"Sure (High)"* actually hit ~90%+ accuracy—and catches *"Lucky Guess (Low)"* hits.\n\nA **high-confidence miss** signals an entrenched misconception you wouldn’t have double-checked on an exam unless calibration exposed it!',
        callout: {
          tone: 'key-idea',
          text: 'OpenPath’s **Certainty Vault** arcade and quiz confidence tags train calibration directly—rewarding honest "Unsure" humility over reckless overconfidence.',
        },
      },
      {
        id: 'study-l8-s2',
        kind: 'predict-observe-explain',
        title: 'Predict Calibration Error Under Familiarity Bias',
        predictionPrompt:
          'When novices predict how they scored right after an unfamiliar exam (Dunning-Kruger pattern), whose self-ratings tend to be MOST inflated relative to actual performance?',
        predictionChoices: [
          'Top-quartile scorers massively overestimate themselves',
          'Bottom-quartile scorers overestimate most because lacking domain skill also obscures recognizing errors',
          'Everyone underestimates equally',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: { template: 'normal-curve', givens: { mean: 70, sd: 12, x: 52 }, ask: 'percentile', rounding: 'tenth' },
        },
        observeInstruction:
          'Inspect how competence in a skill IS the very instrument needed to evaluate errors in that skill—raising calibration as genuine skill grows and objective testing replaces intuition.',
        explainPrompt: 'What reliably shrinks overconfidence BEFORE a high-stakes test?',
        explainOptions: [
          'Rating explicit confidence ("Low / Med / High") BEFORE seeing feedback on closed-book practice questions, then reviewing high-confidence misses first.',
          'Avoiding graded practice altogether.',
          'Memorizing inspirational affirmations.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Pre-feedback confidence tagging forces an explicit commitment, turning surprising misses into unforgettable corrective markers.',
      },
      {
        id: 'study-l8-s3',
        kind: 'worked-example',
        title: 'Read a 2x2 Confidence Calibration Matrix',
        problemMarkdown: 'Categorize four outcomes from a practice round:',
        steps: [
          {
            label: 'High Confidence + Correct -> Calibrated Mastery',
            expressionOrAction: 'Solid foundation; ready for wider FSRS spacing',
            whyNote: 'No extra emergency drill needed.',
          },
          {
            label: 'High Confidence + WRONG -> Critical Misconception!',
            expressionOrAction: 'Top priority error-log entry—you thought you knew it cleanly',
            whyNote: 'Highest danger on real exams if unflagged.',
          },
          {
            label: 'Low Confidence + Correct -> Lucky Guess / Shaky Intuition',
            expressionOrAction: 'Do NOT skip reviewing just because you guessed right!',
            whyNote: 'Write a quick why-note so next time you know *why* it works.',
          },
        ],
      },
      {
        id: 'study-l8-s4',
        kind: 'faded-practice',
        title: 'Triage Post-Quiz Calibration Results',
        promptMarkdown: 'After a 10-question quiz: Q3 was marked "High Confidence" and missed; Q7 was marked "Low Confidence" and guessed right; Q1–Q2 were "High Confidence" and right.',
        completedSteps: ['Q1–Q2 show reliable calibrated mastery.', 'Both Q3 and Q7 require follow-up rather than raw score celebration.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which item demands IMMEDIATE highest-priority misconception analysis first?',
            options: [
              'Q3 (High-Confidence Miss — entrenched active misconception)',
              'Q1 (High-Confidence Hit)',
              'Ignore Q7 completely since the random guess gave points',
              'Redo Q1 ten times',
            ],
            correct: 0,
            points: 10,
            explanation: 'High-confidence misses reveal hidden false models that will recur on exams unless explicitly dismantled.',
          },
        },
      },
      {
        id: 'study-l8-s5',
        kind: 'checkpoint',
        title: 'Guard Against Lucky-Guess Blind Spots',
        question: {
          type: 'truefalse',
          prompt: 'If you mark "Low Confidence / Guessing" on a multiple-choice question and happen to guess the right letter, you have verified solid mastery and need no review.',
          correct: false,
          points: 10,
          explanation: 'False! Random guessing luck masks zero conceptual understanding; flag lucky guesses for explicit review.',
        },
      },
      {
        id: 'study-l8-s6',
        kind: 'synthesis',
        title: 'Calibration Takeaways',
        takeaways: [
          'Tag confidence BEFORE viewing answers so overconfidence and lucky guesses surface clearly.',
          'Audit High-Confidence Misses first (active misconceptions) and Low-Confidence Hits second (lucky guesses).',
          'Objective closed-book metrics beat subjective "feelings of preparedness" every time.',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'certainty-vault', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-hc-miss',
        front: 'Why is a "High-Confidence Miss" the most dangerous outcome on a practice quiz?',
        back: 'It signals an entrenched false belief you wouldn’t hesitate on during an exam—demand immediate error analysis.',
        explanation: 'Surprisingly strong feedback signal (hypercorrection effect) often fixes high-confidence errors fastest once corrected!',
        interleave: true,
      },
      {
        id: 'study-fc-lucky-guess',
        front: 'How should you treat a "Low-Confidence Hit" (lucky guess) during quiz review?',
        back: 'Treat it like an unmastered concept: read the explanation and solve another variant without options.',
        explanation: 'Exam luck does not transfer across problems.',
        interleave: true,
      },
      {
        id: 'study-fc-calibration',
        front: 'What does well-calibrated metacognition look like quantitatively?',
        back: 'Questions rated 90% certain hit ~90% actual accuracy, and 50% guesses hit ~50%—zero chronic overclaiming.',
        explanation: 'Improves study time allocation away from false confidence.',
        interleave: true,
      },
    ],
  },
  {
    id: 'study-l9-sleep-errorlogs',
    unitId: 'study-u3-interleaving-calibration',
    title: 'Error-Log Root Diagnosis & Sleep Consolidation',
    summary: 'Turn mistakes into structured root-cause fixes and pair study blocks with sleep-driven synaptic consolidation.',
    estimatedMinutes: 8,
    standards: ['OpenPath Learning Science L9', 'APA Memory Consolidation'],
    prerequisiteLessonIds: ['study-l8-calibration'],
    visual: { kind: 'model-3d', modelId: 'synapse-neuro', initialParams: { apFreq: 55, reuptakeRate: 0.4 } },
    steps: [
      {
        id: 'study-l9-s1',
        kind: 'narrative',
        title: 'Sleep Consolidates Synapses; Error Logs Prevent Repeated Slips',
        bodyMarkdown:
          'Studying creates fragile hippocampal traces. During **deep slow-wave and REM sleep**, the brain replays daytime firing patterns, transferring and pruning **synaptic connections** into stable neocortical memory!\n\nPair sleep with an **Error Log** classifying every missed question into 4 root causes: **(1) Concept Gap**, **(2) Misread/Units**, **(3) Wrong Strategy Selected**, or **(4) Careless Slip**.',
        callout: {
          tone: 'pitfall',
          text: 'Pulling an all-nighter destroys BOTH sides: you starve post-study consolidation AND arrive with impaired prefrontal working memory!',
        },
      },
      {
        id: 'study-l9-s2',
        kind: 'predict-observe-explain',
        title: 'Connect Synaptic Activity to Post-Study Sleep Consolidation',
        predictionPrompt:
          'Two groups study complex associations at 9 p.m. Group A sleeps 8 hours; Group B pulls an all-nighter, then takes the same test 48 hours later *after recovery sleep*. Does Group B recover the lost memory?',
        predictionChoices: [
          'Yes—sleeping two nights later recovers 100%',
          'No—losing Night-1 sleep permanently shrinks consolidation of what was studied that day',
          'All-nighters boost neocortical transfer',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-3d',
          modelId: 'synapse-neuro',
          initialParams: { apFreq: 60, reuptakeRate: 0.35 },
        },
        observeInstruction:
          'Inspect synaptic receptors and ion flux in 3D: long-term potentiation (LTP) relies on protein synthesis and sleep-replay windows shortly after initial learning.',
        explainPrompt: 'Why is a 7–9 hour sleep schedule part of elite academic performance rather than wasted time?',
        explainOptions: [
          'Sleep drives systems consolidation (hippocampus-to-neocortex integration) AND restores prefrontal executive control for next-day problem solving.',
          'Sleep clears all long-term memories.',
          'Neurons turn off blood glucose during sleep.',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Sleeping the night AFTER learning locks fragile neural patterns into stable long-term circuits while recharging focus for tomorrow’s retrieval.',
      },
      {
        id: 'study-l9-s3',
        kind: 'worked-example',
        title: 'Run a 4-Column Error-Log Entry',
        problemMarkdown: 'Log why you missed `calculate Q_tax` in Microeconomics:',
        steps: [
          {
            label: '1. Symptom',
            expressionOrAction: 'Wrote Q_tax = 23 instead of 17 on a $12 excise tax problem',
            whyNote: 'Captured exact mistake without generic "studied bad."',
          },
          {
            label: '2. Root Category',
            expressionOrAction: 'Sign error (Concept/Formula Slip): ADDED +tax instead of SUBTRACTING −tax from wedge',
            whyNote: 'Taxes shrink trades below competitive Q*, never expand quantity!',
          },
          {
            label: '3. Rule & Sanity Guard',
            expressionOrAction: 'Always verify Q_tax < Q* before submitting any tax calculation',
            whyNote: 'Actionable check stops the exact slip forever.',
          },
        ],
      },
      {
        id: 'study-l9-s4',
        kind: 'faded-practice',
        title: 'Classify an Error Root Cause',
        promptMarkdown: 'On a finance test, Mia recalled the exact slope formula `(y2 - y1)/(x2 - x1)` cleanly, yet computed `(16 - 4)/(2 - 0) = 6%` when the prompt asked for the `y-intercept`!',
        completedSteps: ['Concept knowledge of slope was intact.', 'Failure happened because Mia solved for slope without verifying what variable the prompt requested.'],
        fadedTarget: {
          type: 'mcq',
          question: {
            type: 'mcq',
            prompt: 'Which Error-Log intervention fixes Mia’s specific recurring miss?',
            options: [
              'Underline the exact requested quantity & unit in the prompt before writing equations (Misread/Target Check)',
              'Re-memorize slope definition 50 times',
              'Switch majors immediately',
              'Drink triple espresso during exams',
            ],
            correct: 0,
            points: 10,
            explanation: 'Matching fixes to root causes stops wasting hours reviewing formulas you already know!',
          },
        },
      },
      {
        id: 'study-l9-s5',
        kind: 'branching-scenario',
        title: 'Exam Week Finale: Diagnostics + Sleep Tradeoff',
        startNodeId: 'audit',
        nodes: {
          audit: {
            promptMarkdown:
              'Practice exam returned `74%` (`13` misses out of `50`). You have 3 evenings before the real final. How do you deploy those 13 misses?',
            choices: [
              {
                label: 'Build an Error Log categorizing all 13 misses by root cause, drill weak concepts interleaved Days 1–2, do 1 timed mixed check Day 3, and sleep 8 hrs nightly',
                nextNodeId: 'examday',
                feedback: 'Championship execution: isolates exact root causes, closes conceptual holes via retrieval + spacing, and protects Night-Before consolidation!',
                outcome: 'optimal',
              },
              {
                label: 'Re-take the exact same 50 questions passively and cram til 3 a.m. before the exam',
                nextNodeId: 'audit',
                feedback: 'Memorizing identical answer letters + starving sleep lowers novel-question transfer on exam morning.',
                outcome: 'unsafe',
              },
            ],
          },
          examday: {
            promptMarkdown: 'Inside the exam room, one unfamiliar tough question stalls you after 90 seconds. Best metacognitive response?',
            choices: [
              {
                label: 'Flag it calmly, sweep confident/medium points cleanly first, then return fresh with leftover time (using sanity/unit checks)',
                nextNodeId: null,
                feedback: 'Optimal pacing & executive regulation! Often later cues spark insight while protecting easy points.',
                outcome: 'optimal',
              },
            ],
          },
        },
      },
      {
        id: 'study-l9-s6',
        kind: 'synthesis',
        title: 'Course Mastery Capstone Takeaways',
        takeaways: [
          'Classify every miss (Concept Gap vs. Strategy Choice vs. Target/Unit Misread) so practice fixes the real bottleneck.',
          'Protect 7–9 hours sleep after learning blocks to drive hippocampal-to-neocortical synaptic consolidation.',
          'Combine Active Retrieval + Spacing (FSRS ~90%) + Interleaving + Honest Calibration across every OpenPath track!',
        ],
        nextQuizIndex: 2,
        arcadeLaunch: { mode: 'boss-raid', packId: 'study-skills-metacognition' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'study-fc-sleep-ltp',
        front: 'How does sleeping after intense study preserve memory?',
        back: 'Slow-wave and REM sleep replay daytime neural assemblies, consolidating hippocampal traces into stable neocortical synapses (LTP/systems consolidation).',
        explanation: 'All-nighters both prevent this transfer and wreck next-day prefrontal focus.',
        interleave: true,
      },
      {
        id: 'study-fc-error-log',
        front: 'What 3 items belong in every effective Error-Log entry?',
        back: '1) Exact mistake made; 2) Root-cause tag (Concept Gap / Wrong Strategy / Misread / Slip); 3) Specific future prevention check or sanity guard.',
        explanation: 'Targets root problems instead of repeating generic review.',
        interleave: true,
      },
      {
        id: 'study-fc-sanity-check',
        front: 'What is a "sanity check" after solving a quantitative problem?',
        back: 'Testing sign, direction, units, or extreme-value limits (e.g., Q_tax must be < Q*) before accepting your numeric output.',
        explanation: 'Catches reversed signs and unit mismatches effortlessly.',
        interleave: true,
      },
    ],
  },
]

const STUDY_UNITS: TrackUnit[] = [
  {
    id: 'study-u1-retrieval',
    title: 'Unit 1: Active Retrieval, Elaboration & Pre-Testing',
    anchoringPhenomenon: 'Why can highlighting a textbook 3 times feel effortless yet produce failing grades?',
    lessons: STUDY_U1_LESSONS,
    capstoneQuizIndex: 0,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'study-u2-spacing-fsrs',
    title: 'Unit 2: FSRS Spacing Curves & Sustainable Habits',
    anchoringPhenomenon: 'How can 4 spaced reviews deliver >80% Day-40 recall while 4 crammed reviews plunge below 35%?',
    lessons: STUDY_U2_LESSONS,
    capstoneQuizIndex: 1,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 70 },
  },
  {
    id: 'study-u3-interleaving-calibration',
    title: 'Unit 3: Interleaving, Calibration & Consolidation',
    anchoringPhenomenon: 'Why do high-scoring practice drills fail on final exams—and how does mixing problems fix it?',
    lessons: STUDY_U3_LESSONS,
    capstoneQuizIndex: 2,
    masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 },
  },
]

const STUDY_TRACK: CurriculumTrack = {
  id: 'track-study-skills-metacognition',
  slug: 'study-skills-metacognition',
  packId: 'study-skills-metacognition',
  title: 'Study Skills, FSRS Memory & Metacognition',
  category: 'Science',
  subject: 'Study Skills & Learning Science',
  gradeBand: 'All-Ages',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original (MIT)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: STUDY_UNITS,
}

const STUDY_PACK: ContentPack = {
  id: 'study-skills-metacognition',
  name: 'Study Skills: Retrieval, FSRS & Metacognition',
  description:
    'Fluency illusions vs. retrieval practice, elaborative dual coding, pre-testing, FSRS decay & 90% workload balance, interleaving, calibration, and sleep consolidation.',
  subject: 'Study Skills & Learning Science',
  category: 'Science',
  icon: '🎓',
  modelId: 'fsrs-memory-decay-2d',
  relatedModelIds: ['synapse-neuro'],
  standards: 'OpenPath Learning Science Framework · APA Memory & Metacognition',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original (MIT)',
  srsInterleave: true,
  gradeBand: 'All-Ages',
  prerequisitePackIds: [],
  track: STUDY_TRACK,
  units: STUDY_UNITS,
  quizzes: [
    {
      title: 'Unit 1: Retrieval Practice, Elaboration & Pre-Testing',
      description: 'Fluency illusions, testing effect, dual coding, and productive pre-testing.',
      subject: 'Study Skills & Learning Science',
      difficulty: 'easy',
      timeLimitSec: 420,
      modelId: 'fsrs-memory-decay-2d',
      lessonId: 'study-l3-pretesting',
      questions: [
        {
          type: 'mcq',
          prompt: 'Which study habit creates the strongest "fluency illusion" (high confidence alongside weak delayed exam recall)?',
          options: [
            'Repeatedly rereading highlighted textbook sections',
            'Closed-book blank-page brain dumps followed by targeted review',
            'Solving unannotated mixed practice problems',
            'Attempting pretest questions before reading',
          ],
          correct: 0,
          points: 10,
          explanation: 'Passive visual familiarity glides effortlessly while building almost zero cue-driven recall routes.',
        },
        {
          type: 'truefalse',
          prompt: 'Guessing wrong on an unfamiliar pre-test question BEFORE studying permanently cements that misconception even after reading the correct explanation.',
          correct: false,
          points: 10,
          explanation: 'False! Errorful pre-testing boosts subsequent learning cleanly as long as corrective explanation/study follows.',
        },
        {
          type: 'mcq',
          prompt: 'Which habit accurately exemplifies Dual Coding?',
          options: [
            'Translating a dense mechanism paragraph into a labeled causal flow sketch from memory',
            'Highlighting nouns in pink and verbs in blue',
            'Re-typing lecture slides word for word twice',
            'Studying with loud lyrics in headphones',
          ],
          correct: 0,
          points: 10,
          explanation: 'Combining explanatory spatial diagrams with verbal meaning stores mutually reinforcing visual and verbal traces.',
        },
        {
          type: 'fill',
          prompt: 'Testing yourself on material physically strengthens long-term recall more than equal restudy time; cognitive scientists call this the ______ effect.',
          correct: 'testing',
          alternatives: ['retrieval practice', 'retrieval'],
          points: 10,
          explanation: 'The testing (retrieval practice) effect demonstrates that recall directly modifies memory strength.',
        },
        {
          type: 'mcq',
          prompt: 'Asking yourself "WHY does this rule hold, and how does it contrast with Concept B?" demonstrates:',
          options: ['Elaborative interrogation', 'Retroactive interference', 'Fixed-interval cramming', 'Blocked autopilot'],
          correct: 0,
          points: 10,
          explanation: 'Generating causal "why" explanations integrates new rules into prior schemas.',
        },
        {
          type: 'order',
          prompt: 'Order the steps of a high-yield 45-minute Blank-Page Recall cycle:',
          options: [
            'Open notes in another ink color to patch missed/wrong gaps',
            'Close all materials and write everything recalled on blank paper',
            'Apply repaired knowledge immediately on fresh transfer questions',
            'Attempt unassisted recall on flashcards next day',
          ],
          correct: [1, 0, 2, 3],
          points: 15,
          explanation: 'Recall closed-book first -> immediate feedback repair -> fresh application -> spaced follow-up.',
        },
        {
          type: 'truefalse',
          prompt: 'Seeing the worked solution right alongside a practice question BEFORE making an effortful attempt maximizes retrieval learning.',
          correct: false,
          points: 10,
          explanation: 'False! Looking immediately turns retrieval practice into passive reading; struggle before feedback!',
        },
      ],
    },
    {
      title: 'Unit 2: FSRS Spacing Curves & Habit Design',
      description: 'Power-law decay, FSRS D/S/R metrics, retention workload curve, and atomic card design.',
      subject: 'Study Skills & Learning Science',
      difficulty: 'medium',
      timeLimitSec: 480,
      modelId: 'fsrs-memory-decay-2d',
      lessonId: 'study-l6-backlog-triage',
      questions: [
        {
          type: 'mcq',
          prompt: 'In FSRS spaced repetition, what does Stability `S` measure?',
          options: [
            'Time in days for recall probability `R` to decay from 100% down to 90%',
            'Total number of decks installed',
            'Words per minute reading speed',
            'Percent of questions answered yesterday',
          ],
          correct: 0,
          points: 10,
          explanation: 'Larger Stability `S` indicates a flatter forgetting curve and longer optimal intervals.',
        },
        {
          type: 'mcq',
          prompt: 'Why is setting Desired Retention to 98% usually counterproductive for semester learners?',
          options: [
            'Review intervals collapse sharply near 100%, exploding daily card volume 3x–4x and causing burnout',
            'FSRS deletes cards above 95% stability',
            'Long-term synapses cannot survive above 95%',
            '98% halves initial learning speed automatically',
          ],
          correct: 0,
          points: 10,
          explanation: 'Efficiency peaks near 88%–90% Desired Retention without crushing review queues.',
        },
        {
          type: 'truefalse',
          prompt: 'Reviewing a card 4 times spaced across widening intervals yields far higher Day-40 retention than doing those exact same 4 reviews crammed in 24 hours.',
          correct: true,
          points: 10,
          explanation: 'True! Spaced retrievals near the desirable difficulty boundary multiply Stability `S` across cycles.',
        },
        {
          type: 'mcq',
          prompt: 'After missing 5 study days and facing 150 overdue cards, what is the healthiest recovery strategy?',
          options: [
            'Temporarily pause adding NEW cards and chip through ~30 overdue cards daily for 4–5 days',
            'Wipe all review history and reset every card to Day 0',
            'Blindly press "Easy" on all 150 cards without testing yourself',
            'Abandon flashcards until finals night',
          ],
          correct: 0,
          points: 10,
          explanation: 'Pausing new intake preserves mature Stability data while clearing overdue backlogs calmly.',
        },
        {
          type: 'fill',
          prompt: 'Under the Minimum Information Principle, each flashcard should test ______ discrete fact or concept at a time. (number or word)',
          correct: 'one',
          alternatives: ['1', 'a single', 'single'],
          points: 10,
          explanation: 'Atomic one-target cards run fast and isolate individual memory slips accurately.',
        },
        {
          type: 'mcq',
          prompt: 'What happens if you click "Good" on a flashcard you completely forgot just to avoid seeing it again sooner?',
          options: [
            'FSRS expands the next interval even wider, guaranteeing future repeated failure',
            'FSRS moves it into priority remedial drills automatically',
            'Memory strengthens regardless of recall success',
            'Difficulty `D` rises to maximum safety',
          ],
          correct: 0,
          points: 10,
          explanation: 'Honest "Again" grades let FSRS shorten intervals back into the stable zone.',
        },
        {
          type: 'order',
          prompt: 'Arrange how an atomic card’s intervals evolve across 4 honest "Good" spaced reviews at ~90% retention:',
          options: [
            '~25–30 days later',
            '~2 days after learning',
            '~11 days later',
            '~5 days later',
          ],
          correct: [1, 3, 2, 0],
          points: 15,
          explanation: 'Successful spaced retrievals expand intervals geometrically (~2d -> 5d -> 11d -> ~26d).',
        },
      ],
    },
    {
      title: 'Unit 3: Interleaving, Calibration & Consolidation',
      description: 'Interleaved transfer gains, calibration audits, error logs, and sleep-dependent consolidation.',
      subject: 'Study Skills & Learning Science',
      difficulty: 'hard',
      timeLimitSec: 540,
      modelId: 'synapse-neuro',
      lessonId: 'study-l9-sleep-errorlogs',
      questions: [
        {
          type: 'mcq',
          prompt: 'Why do students on interleaved practice sets outperform blocked-practice students on delayed mixed exams?',
          options: [
            'Interleaving trains strategy selection ("Which method fits this problem?") alongside calculation',
            'Blocked practice contains twice as many typos',
            'Interleaving skips harder concepts intentionally',
            'Exams only test the very last unit studied',
          ],
          correct: 0,
          points: 10,
          explanation: 'Blocked drills telegraph which tool to use; interleaving builds real-world problem discrimination.',
        },
        {
          type: 'truefalse',
          prompt: 'Early foreign-language vocabulary lists may intentionally keep `srsInterleave: false` because grouped thematic sets can aid initial lexical encoding.',
          correct: true,
          points: 10,
          explanation: 'True! While math/physics/coding benefit heavily from interleaving, grouped semantic themes help early language vocab drills.',
        },
        {
          type: 'mcq',
          prompt: 'Among quiz outcomes tagged before feedback, which indicates an urgent hidden misconception requiring immediate error analysis?',
          options: [
            'High-Confidence Miss',
            'High-Confidence Hit',
            'Low-Confidence Miss',
            'Zero-Latency Hit',
          ],
          correct: 0,
          points: 10,
          explanation: 'High-confidence misses expose false assumptions you trust—catching them before exams prevents confident errors.',
        },
        {
          type: 'truefalse',
          prompt: 'Guessing blindly with Low Confidence and hitting the right choice by luck proves deep mastery.',
          correct: false,
          points: 10,
          explanation: 'False! Lucky guesses mask unlearned concepts and should trigger follow-up practice.',
        },
        {
          type: 'mcq',
          prompt: 'Why does pulling an all-nighter after studying impair long-term retention even if you take recovery naps two nights later?',
          options: [
            'Missing Night-1 sleep disrupts early hippocampal-to-neocortical synaptic consolidation',
            'Sleep erases hippocampus memory every dawn',
            'Cortisol boosts declarative recall permanently',
            'Neocortex stores facts only while walking',
          ],
          correct: 0,
          points: 10,
          explanation: 'First-night slow-wave & REM sleep consolidation transfers and stabilizes newly formed memories.',
        },
        {
          type: 'figure',
          prompt: 'Exam scores follow the normal curve shown. Compute the standardized z-score for the highlighted score x (round to nearest tenth).',
          figure: {
            template: 'normal-curve',
            givens: { mean: 72, sd: 10, x: 85 },
            ranges: { mean: [68, 76], x: [55, 92] },
            ask: 'zScore',
            rounding: 'tenth',
          },
          points: 15,
          explanation: 'Compute z = (x − μ) / σ from the mean μ, standard deviation σ, and score x labeled on the plot.',
        },
        {
          type: 'order',
          prompt: 'Sequence an effective 4-step Error-Log diagnostic cycle after missing a problem:',
          options: [
            'Tag root cause (Concept Gap / Wrong Strategy / Target Misread / Slip)',
            'Record exact erroneous step made without vague excuses',
            'Re-solve a fresh transfer variant cleanly without hints',
            'Write an explicit sanity/prevention check tied to that root cause',
          ],
          correct: [1, 0, 3, 2],
          points: 15,
          explanation: 'Log concrete miss -> diagnose root cause -> define concrete guard -> prove transfer on a new item.',
        },
      ],
    },
  ],
}

export const TIER1_APPLIED_PACKS: ContentPack[] = [
  CS1_PACK,
  PSY_PACK,
  FIN_PACK,
  STUDY_PACK,
]
