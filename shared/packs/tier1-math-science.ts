import type { ContentPack } from './types'
import type { CurriculumTrack, TrackUnit } from '../lessons'

// ── Track 1: Quantitative Foundations & Pre-Algebra ────────────
const QUANT_UNITS: TrackUnit[] = [
  {
    id: 'qf-u1',
    title: 'Proportional Reasoning, Unit Rates & Percent Change',
    anchoringPhenomenon:
      'When two bicycle sprockets share a chain or a recipe doubles for a banquet, total quantities change while the ratio between parts stays invariant.',
    capstoneQuizIndex: 0,
    masteryGate: {
      policy: 'soft-recommended',
      minLessonCompletion: true,
      minQuizAccuracyPct: 75,
    },
    lessons: [
      {
        id: 'qf-u1-l1',
        unitId: 'qf-u1',
        title: 'Equivalent Ratios & Unit Rates',
        summary:
          'Compare collections fairly by scaling both parts multiplicatively rather than adding constant offsets.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.6.RP.A.1', 'CCSS.MATH.7.RP.A.1'],
        prerequisiteLessonIds: [],
        visual: {
          kind: 'model-2d',
          modelId: 'quantitative-ratio-balance-2d',
        },
        steps: [
          {
            id: 'qf-u1-l1-s1',
            kind: 'narrative',
            title: 'Why Adding Equal Amounts Breaks a Mixture',
            bodyMarkdown:
              'Suppose a concentrate-to-water syrup uses **2 scoops** for **6 cups** of water. If you add 2 more scoops and 2 more cups, the new mixture is 4 scoops in 8 cups—noticeably sweeter!\n\nEquivalent ratios preserve taste, steepness, or gear speed only when both terms scale by the **same positive factor** $k$. Dividing one quantity by the other produces the **unit rate**, which tells you how much of the first quantity corresponds to **1 unit** of the second.',
            callout: {
              tone: 'pitfall',
              text: 'Do not add the same constant to numerator and denominator to make an equivalent ratio; always multiply or divide both parts by the same factor.',
            },
          },
          {
            id: 'qf-u1-l1-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Scaling on the Ratio Balance',
            predictionPrompt:
              'A teal batch mixes 3 cups of pigment with 5 cups of base. If you double the pigment to 6 cups, how much base keeps the exact same shade?',
            predictionChoices: [
              '8 cups (add 3 to both quantities)',
              '10 cups (multiply both quantities by 2)',
              '7 cups (keep the difference equal to 2)',
              '15 cups (multiply base by 3)',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'model-2d',
              modelId: 'quantitative-ratio-balance-2d',
            },
            observeInstruction:
              'Adjust the ratio sliders in the interactive balance until the left and right mixtures match in concentration, and watch how the simplified unit rate updates.',
            explainPrompt:
              'What invariant stays locked across every scaled batch that produces the same shade?',
            explainOptions: [
              'The arithmetic difference between pigment and base',
              'The sum of pigment cups plus base cups',
              'The quotient (unit rate) pigment ÷ base = 0.6',
              'Only the denominator of the original recipe',
            ],
            correctExplainIndex: 2,
            reconcileFeedback:
              'Matching mixtures share the exact same quotient (unit rate). Scaling both quantities by k cancels k/k = 1, leaving 3/5 = 6/10 = 0.6 unchanged.',
          },
          {
            id: 'qf-u1-l1-s3',
            kind: 'worked-example',
            title: 'Comparing Two Grocery Unit Prices',
            problemMarkdown:
              'Brand A sells **450 g** of oats for **$2.70**. Brand B sells **750 g** of oats for **$4.20**. Which brand has the lower price per 100 g?',
            steps: [
              {
                label: 'Convert each package to a common reference unit (100 g)',
                expressionOrAction: 'Brand A has 4.5 chunks of 100 g; Brand B has 7.5 chunks of 100 g.',
                whyNote: 'Scaling to 100 g avoids tiny rounding errors per gram while remaining a true unit rate.',
              },
              {
                label: 'Divide total cost by chunks of 100 g',
                expressionOrAction: 'A: $2.70 / 4.5 = $0.60 per 100 g;  B: $4.20 / 7.5 = $0.56 per 100 g.',
                whyNote: 'Price per 100 g normalizes unequal box sizes.',
              },
              {
                label: 'Compare the rates directly',
                expressionOrAction: '$0.56 < $0.60 -> Brand B saves $0.04 per 100 g.',
                whyNote: 'Now that denominators match, the smaller numerator is definitively cheaper.',
              },
            ],
          },
          {
            id: 'qf-u1-l1-s4',
            kind: 'faded-practice',
            title: 'Solve a Missing Ratio Term',
            promptMarkdown:
              'A map legend states **3 cm represents 42 km**. Two trailheads sit **7 cm** apart on the paper map. Finish the final calculation.',
            completedSteps: [
              'Step 1: Find the unit rate in km per cm -> 42 km ÷ 3 cm = 14 km/cm.',
              'Step 2: Multiply the map distance (7 cm) by the unit rate.',
            ],
            fadedTarget: {
              type: 'fill',
              question: {
                type: 'fill',
                prompt: 'What real-world distance (in km) separates the two trailheads?',
                correct: '98',
                alternatives: ['98 km'],
                explanation: 'At 14 km per cm, 7 cm corresponds to 7 × 14 = 98 km.',
                points: 10,
              },
            },
            misconceptionHints: {
              '46': 'You added 4 to 42 because 7 - 3 = 4. Scale multiplicatively by 7/3 instead.',
              '18': 'Divide 42 by 3 first (14 km/cm), then multiply by 7.',
            },
          },
          {
            id: 'qf-u1-l1-s5',
            kind: 'synthesis',
            title: 'Lock In Multiplicative Scaling',
            takeaways: [
              'Equivalent ratios share the exact same quotient y / x, not the same difference y - x.',
              'Converting to a 1-unit denominator turns messy package comparisons into one division step.',
            ],
            nextQuizIndex: 0,
            arcadeLaunch: { mode: 'speed-match', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u1-l1-fc1',
            front: 'Why does adding 2 to both terms of 3:5 change the ratio?',
            back: 'Because (3+2)/(5+2) = 5/7 ≠ 3/5; only multiplying or dividing both terms by the same nonzero factor k preserves the quotient.',
            explanation: 'Proportional equivalence requires multiplicative scaling, not additive shifting.',
            interleave: true,
          },
          {
            id: 'qf-u1-l1-fc2',
            front: 'Definition: Unit Rate',
            back: 'A ratio scaled so the denominator equals 1 unit of the comparison quantity (for example, kilometers per 1 hour or dollars per 1 kg).',
            explanation: 'Computed as numerator ÷ denominator.',
            interleave: true,
          },
          {
            id: 'qf-u1-l1-fc3',
            front: 'If 5 notebooks cost $12.50, what is the price for 8 notebooks at the same rate?',
            back: '$20.00 (unit price is $12.50 ÷ 5 = $2.50 each, then 8 × $2.50 = $20.00).',
            explanation: 'Find the 1-item unit price first, then multiply by the target count.',
            interleave: true,
          },
        ],
      },
      {
        id: 'qf-u1-l2',
        unitId: 'qf-u1',
        title: 'Slope as Constant Rate of Change',
        summary:
          'Connect proportional tables and straight lines on the coordinate plane using rise over run.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.7.RP.A.2', 'CCSS.MATH.8.EE.B.5'],
        prerequisiteLessonIds: ['qf-u1-l1'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: -2, y1: -1, x2: 4, y2: 11 },
            ask: 'slope',
            rounding: 'tenth',
            ranges: { x1: [-6, -1], y1: [-8, 8], x2: [1, 7], y2: [-8, 8] },
          },
        },
        steps: [
          {
            id: 'qf-u1-l2-s1',
            kind: 'narrative',
            title: 'Turning Every Unit Rate Into Steepness',
            bodyMarkdown:
              'When an electric scooter travels at a steady speed, every equal step right in time ($\\Delta x$) produces the exact same step up in distance ($\\Delta y$). The ratio **slope** $= \\frac{y_2 - y_1}{x_2 - x_1}$ is literally the coordinate-plane twin of a unit rate.\n\nIf a line also passes through $(0, 0)$, then $y = mx$ is directly proportional. If it starts at $(0, b)$ with $b \\neq 0$, the **rate of change** is still $m$, while $b$ sets the initial offset.',
            callout: {
              tone: 'key-idea',
              text: 'Subtract coordinates in the same order top and bottom: (y₂ − y₁) / (x₂ − x₁). Reversing only the numerator flips the sign erroneously.',
            },
          },
          {
            id: 'qf-u1-l2-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Slope Sign from Point Order',
            predictionPrompt:
              'A line climbs from left to right through (-2, -1) and (4, 11). If you subtract (-1 - 11) in the numerator and (-2 - 4) in the denominator, what happens to the slope?',
            predictionChoices: [
              'The slope flips negative (-2)',
              'The slope stays +2 because both negatives cancel',
              'The slope becomes 0',
              'The slope becomes 1/2',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'coordinate-line',
                givens: { x1: -2, y1: -1, x2: 4, y2: 11 },
                ask: 'slope',
                rounding: 'tenth',
              },
            },
            observeInstruction:
              'Trace the horizontal run from x = -2 to x = 4 (+6 units) and vertical rise from y = -1 to y = 11 (+12 units) in the coordinate plot.',
            explainPrompt: 'Why is the slope between P₁(-2, -1) and P₂(4, 11) equal to +2?',
            explainOptions: [
              'Vertical change (+12) divided by horizontal change (+6) equals 2',
              'Horizontal change (+6) divided by vertical change (+12) equals 2',
              'Adding 11 + 1 and dividing by 4 + 2 gives 2',
              'Because the y-intercept is at y = 2',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Rise always goes in the numerator and run in the denominator. Both (-1 - 11)/(-2 - 4) = -12/-6 = 2 and (11 - (-1))/(4 - (-2)) = 12/6 = 2 agree.',
          },
          {
            id: 'qf-u1-l2-s3',
            kind: 'branching-scenario',
            title: 'Diagnose a Misread Tank-Drain Graph',
            startNodeId: 'start',
            nodes: {
              start: {
                promptMarkdown:
                  'A water tank holds **60 L** at minute 0 and drops to **36 L** at minute 6. A student calculates the rate as `6 / 24 = 0.25`. What should you check first?',
                choices: [
                  {
                    label: 'Check which variable belongs on top (rise) vs bottom (run)',
                    nextNodeId: 'rise-run',
                    feedback:
                      'Good instinct: liters changed by -24 L over +6 min, so the student inverted run/rise AND dropped the negative sign.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Assume 60 / 6 = 10 L/min is the rate',
                    nextNodeId: 'start',
                    feedback:
                      'That uses total initial volume rather than the change (36 - 60 = -24 L). Re-check how change is computed.',
                    outcome: 'suboptimal',
                  },
                ],
              },
              'rise-run': {
                promptMarkdown:
                  'Now compute the signed rate of change from (0, 60) to (6, 36). Which expression matches the tank draining?',
                choices: [
                  {
                    label: '(36 − 60) / (6 − 0) = −4 L/min',
                    nextNodeId: null,
                    feedback:
                      'Exact! Each minute removes 4 liters, matching y = 60 − 4x.',
                    outcome: 'optimal',
                  },
                  {
                    label: '(60 − 36) / (6 − 0) = +4 L/min',
                    nextNodeId: null,
                    feedback:
                      'Magnitude 4 is right, but you flipped numerator order relative to denominator (0 − 6), turning a drain into a fill.',
                    outcome: 'suboptimal',
                  },
                ],
              },
            },
          },
          {
            id: 'qf-u1-l2-s4',
            kind: 'checkpoint',
            title: 'Dynamic Coordinate Line Slope',
            question: {
              type: 'figure',
              prompt:
                'Determine the slope of the line passing through the two labeled points on the grid (round to the nearest tenth).',
              figure: {
                template: 'coordinate-line',
                givens: { x1: -3, y1: 5, x2: 5, y2: -3 },
                ask: 'slope',
                rounding: 'tenth',
                ranges: { x1: [-8, -1], y1: [-8, 8], x2: [1, 8], y2: [-8, 8] },
              },
              explanation:
                'Use m = (y₂ − y₁) / (x₂ − x₁) while keeping point subtraction order identical in numerator and denominator.',
              points: 15,
            },
          },
          {
            id: 'qf-u1-l2-s5',
            kind: 'synthesis',
            title: 'Slope Connects Tables to Lines',
            takeaways: [
              'Slope m = (y₂ − y₁) / (x₂ − x₁) measures vertical units gained per +1 horizontal unit.',
              'Swapping point order on BOTH top and bottom preserves sign; swapping only one flips it.',
            ],
            nextQuizIndex: 0,
            arcadeLaunch: { mode: 'step-detective', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u1-l2-fc1',
            front: 'Formula for slope m between (x₁, y₁) and (x₂, y₂)',
            back: 'm = (y₂ − y₁) / (x₂ − x₁), defined whenever x₂ ≠ x₁.',
            explanation: 'Vertical change (rise) divided by horizontal change (run).',
            interleave: true,
          },
          {
            id: 'qf-u1-l2-fc2',
            front: 'What does a negative slope mean on a linear graph?',
            back: 'As x increases from left to right, y decreases at a constant rate.',
            explanation: 'Decreasing linear trends have negative rise for positive run.',
            interleave: true,
          },
          {
            id: 'qf-u1-l2-fc3',
            front: 'Difference between y = 3x and y = 3x + 5',
            back: 'Both have slope 3 (rate of change), but y = 3x passes through (0, 0) (proportional), whereas y = 3x + 5 is shifted up with y-intercept 5.',
            explanation: 'Proportional lines always intersect the origin (0, 0).',
            interleave: true,
          },
        ],
      },
      {
        id: 'qf-u1-l3',
        unitId: 'qf-u1',
        title: 'Percent Multipliers & Successive Discounts',
        summary:
          'Model markups and discounts as single multiplicative factors so chained changes compound accurately.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.7.RP.A.3'],
        prerequisiteLessonIds: ['qf-u1-l1'],
        visual: {
          kind: 'model-2d',
          modelId: 'quantitative-ratio-balance-2d',
        },
        steps: [
          {
            id: 'qf-u1-l3-s1',
            kind: 'narrative',
            title: 'Every Percent Change Is a Multiplier',
            bodyMarkdown:
              'Increasing an $80 jacket by **20%** replaces 100% of the price with **120%**, so the multiplier is **1.20**. Discounting an item by **20%** leaves **80%** of the current price, a multiplier of **0.80**.\n\nWhy does a +20% markup followed by a −20% discount NOT return to $80? Because the second percentage applies to the **new base** ($96), yielding $96 × 0.80 = **$76.80**!',
            callout: {
              tone: 'pitfall',
              text: 'Successive percent changes multiply together (1.20 × 0.80 = 0.96, a net 4% drop)—never add or subtract percentage points directly.',
            },
          },
          {
            id: 'qf-u1-l3-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Successive Percentage Scaling',
            predictionPrompt:
              'A store marks prices UP by 25%, then runs a "25% OFF" clearance sale. Compared to the original price, the clearance price is:',
            predictionChoices: [
              'Exactly equal to the original price (100%)',
              'Higher than the original price (106.25%)',
              'Lower than the original price (93.75%)',
              'Halved (50%)',
            ],
            correctPredictionIndex: 2,
            visual: {
              kind: 'model-2d',
              modelId: 'quantitative-ratio-balance-2d',
            },
            observeInstruction:
              'Use the interactive ratio balance to represent 100 parts scaled by 1.25 and then the result scaled by 0.75.',
            explainPrompt: 'Why does 1.25 × 0.75 drop below 1.00?',
            explainOptions: [
              'Because 25% of the larger marked-up price removes more dollars than the initial 25% added',
              'Because sales tax always removes 6.25%',
              'Because fractions cannot exceed 1 after two steps',
              'Because adding 0.25 + 0.75 equals 1',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Multiplying 1.25 × 0.75 = 0.9375. Since the 25% discount takes a quarter of a 25%-bigger tag, you lose 6.25% overall.',
          },
          {
            id: 'qf-u1-l3-s3',
            kind: 'worked-example',
            title: 'Finding an Original Price Before Sales Tax',
            problemMarkdown:
              'After an **8% tax**, a calculator rings up at **$54.00**. What was the pre-tax price?',
            steps: [
              {
                label: 'Write the forward multiplier equation',
                expressionOrAction: 'PreTax × 1.08 = $54.00',
                whyNote: 'Adding 8% of PreTax gives 108% = 1.08 times PreTax.',
              },
              {
                label: 'Invert multiplication with division',
                expressionOrAction: 'PreTax = $54.00 ÷ 1.08 = $50.00',
                whyNote: 'Do NOT subtract 8% of $54.00 ($4.32), because tax was computed on the original base.',
              },
            ],
          },
          {
            id: 'qf-u1-l3-s4',
            kind: 'faded-practice',
            title: 'Double Coupon Checkout',
            promptMarkdown:
              'A **$120** backpack goes on sale for **30% off**, and a loyalty coupon takes an additional **10% off** the sale price. Complete the final checkout price.',
            completedSteps: [
              'Step 1: 30% off uses multiplier 1 − 0.30 = 0.70 -> $120 × 0.70 = $84.',
              'Step 2: Apply the extra 10% off (multiplier 0.90) to $84.',
            ],
            fadedTarget: {
              type: 'fill',
              question: {
                type: 'fill',
                prompt: 'What is the final price in dollars?',
                correct: '75.6',
                alternatives: ['75.60', '$75.60', '$75.6'],
                explanation: 'Multiplying $84 × 0.90 = $75.60 (overall multiplier 0.70 × 0.90 = 0.63, or 37% off).',
                points: 10,
              },
            },
          },
          {
            id: 'qf-u1-l3-s5',
            kind: 'synthesis',
            title: 'Master the Multiplier Habit',
            takeaways: [
              'A p% increase multiplies by (1 + p/100); a p% decrease multiplies by (1 − p/100).',
              'To recover an old base after a percent change, divide by the multiplier—never subtract p% from the new value.',
            ],
            nextQuizIndex: 0,
            arcadeLaunch: { mode: 'certainty-vault', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u1-l3-fc1',
            front: 'What single multiplier equals a 15% markup followed by a 20% discount?',
            back: '0.92 (because 1.15 × 0.80 = 0.92, a net 8% decrease).',
            explanation: 'Chain percent multipliers by multiplying them together.',
            interleave: true,
          },
          {
            id: 'qf-u1-l3-fc2',
            front: 'How do you undo an r% increase when given the final amount F?',
            back: 'Divide F by (1 + r/100); subtracting r% of F underestimates the original because F is a larger base.',
            explanation: 'Division reverses multiplication by the growth factor.',
            interleave: true,
          },
          {
            id: 'qf-u1-l3-fc3',
            front: 'Percent change formula between Old and New values',
            back: '((New − Old) / Old) × 100%.',
            explanation: 'Always divide by the starting (Old) reference value, not New.',
            interleave: true,
          },
        ],
      },
    ],
  },
  {
    id: 'qf-u2',
    title: 'Signed Numbers, Distance & Coordinate Geometry',
    anchoringPhenomenon:
      'Elevations above and below sea level, bank ledgers, and vector displacements track both magnitude and direction with positive and negative signs.',
    capstoneQuizIndex: 1,
    masteryGate: {
      policy: 'soft-recommended',
      minLessonCompletion: true,
      minQuizAccuracyPct: 75,
    },
    lessons: [
      {
        id: 'qf-u2-l1',
        unitId: 'qf-u2',
        title: 'Directed Distance & Subtracting Negatives',
        summary:
          'Interpret addition and subtraction as arrows and see why subtracting a negative turns motion rightward.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.7.NS.A.1'],
        prerequisiteLessonIds: ['qf-u1-l1'],
        visual: {
          kind: 'model-2d',
          modelId: 'quantitative-ratio-balance-2d',
        },
        steps: [
          {
            id: 'qf-u2-l1-s1',
            kind: 'narrative',
            title: 'Temperature Drops and Elevations Below Zero',
            bodyMarkdown:
              'Every signed number has two pieces of information: **magnitude** ($|x|$, how far from 0) and **direction** (sign $+$ or $-$). The distance between any two numbers $a$ and $b$ on the number line is always non-negative: $|a - b|$.\n\nSubtracting $b$ from $a$ asks, *"What displacement takes you from $b$ to $a$?"* Starting at $-12^\\circ\\text{C}$ and warming to $+5^\\circ\\text{C}$ moves **up 17 degrees**: $5 - (-12) = 5 + 12 = +17$.',
            callout: {
              tone: 'key-idea',
              text: 'Every subtraction a − b equals adding the opposite: a + (−b). Removing a debt (−b) increases net worth (+b).',
            },
          },
          {
            id: 'qf-u2-l1-s2',
            kind: 'predict-observe-explain',
            title: 'Compare Distance vs Signed Displacement',
            predictionPrompt:
              'A submarine sits at -180 m and climbs to -45 m. Which expression gives its upward change in elevation?',
            predictionChoices: [
              '-45 - (-180) = +135 m',
              '-180 - (-45) = -135 m',
              '-180 + (-45) = -225 m',
              '45 - 180 = -135 m',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'model-2d',
              modelId: 'quantitative-ratio-balance-2d',
            },
            observeInstruction:
              'Inspect balanced signed offsets on the interactive 2D scale to verify how cancelling negative weights raises the net value.',
            explainPrompt:
              'Why is "Final − Initial" always the consistent formula for signed change?',
            explainOptions: [
              'Final minus Initial gives a positive value when rising (-45 - (-180) = +135) and negative when sinking',
              'Initial minus Final always gives positive distance regardless of direction',
              'Adding two negative elevations gives a positive change',
              'Absolute value ignores whether the sub climbed or dove',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Signed change Δ = Final − Initial preserves direction automatically: climbing from -180 to -45 gives -45 + 180 = +135 m.',
          },
          {
            id: 'qf-u2-l1-s3',
            kind: 'worked-example',
            title: 'Net Change Across Four Ledger Entries',
            problemMarkdown:
              'Evaluate $-14 + 9 - (-6) - 11$ without guessing signs.',
            steps: [
              {
                label: 'Rewrite every subtraction as addition of the opposite',
                expressionOrAction: '-14 + 9 + (+6) + (-11)',
                whyNote: 'Rewriting turns subtraction into pure commutative addition of signed terms.',
              },
              {
                label: 'Group positives and negatives separately',
                expressionOrAction: '(9 + 6) + (-14 + -11) = 15 + (-25)',
                whyNote: 'Addition is associative and commutative once all subtractions become additions.',
              },
              {
                label: 'Subtract smaller magnitude from larger magnitude and keep dominant sign',
                expressionOrAction: '25 − 15 = 10 -> keep minus sign -> −10',
                whyNote: 'The negative total (-25) outweighs +15 by 10.',
              },
            ],
          },
          {
            id: 'qf-u2-l1-s4',
            kind: 'checkpoint',
            title: 'Order Signed Expressions by Value',
            question: {
              type: 'order',
              prompt: 'Arrange these four expressions from LEAST (most negative) to GREATEST:',
              options: [
                '-18 + 4',
                '4 - 11',
                '-5 - (-2)',
                '-12 - (-15)',
              ],
              correct: [0, 1, 2, 3],
              explanation:
                'Evaluating each expression gives -18 + 4 = -14 < 4 - 11 = -7 < -5 - (-2) = -3 < -12 - (-15) = +3.',
              points: 10,
            },
          },
          {
            id: 'qf-u2-l1-s5',
            kind: 'synthesis',
            title: 'Directed Numbers Summary',
            takeaways: [
              'Rewrite a − b as a + (−b) before grouping positive and negative terms.',
              'Unsigned distance is |a − b|; signed displacement is Final − Initial.',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'cloze-workbench', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u2-l1-fc1',
            front: 'Why does a − (−b) equal a + b?',
            back: 'Subtracting a negative removes a leftward/downward offset, producing net rightward/upward motion of +b.',
            explanation: 'Additive inverses cancel: adding the opposite of -b is adding +b.',
            interleave: true,
          },
          {
            id: 'qf-u2-l1-fc2',
            front: 'Distance between points a and b on a number line',
            back: '|a − b| = |b − a|, which is always ≥ 0.',
            explanation: 'Absolute value strips direction to report pure separation.',
            interleave: true,
          },
          {
            id: 'qf-u2-l1-fc3',
            front: 'Additive Inverse Property',
            back: 'For any number x, x + (−x) = 0; two opposites combine to zero net change.',
            explanation: 'Opposites sit symmetric across 0 on the number line.',
            interleave: true,
          },
        ],
      },
      {
        id: 'qf-u2-l2',
        unitId: 'qf-u2',
        title: 'Coordinate Distance & Midpoints',
        summary:
          'Combine horizontal and vertical displacements with the Pythagorean theorem to measure slanted segments.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.8.G.B.8', 'CCSS.MATH.6.NS.C.6'],
        prerequisiteLessonIds: ['qf-u2-l1'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: -4, y1: -2, x2: 2, y2: 6 },
            ask: 'distance',
            rounding: 'hundredth',
            ranges: { x1: [-8, -1], y1: [-7, 7], x2: [1, 8], y2: [-7, 7] },
          },
        },
        steps: [
          {
            id: 'qf-u2-l2-s1',
            kind: 'narrative',
            title: 'Horizontal and Vertical Legs Make a Right Triangle',
            bodyMarkdown:
              'On a city grid, walking **6 blocks east** and **8 blocks north** is 14 blocks along streets—but as the crow flies, those two perpendicular moves form the legs of a right triangle with straight-line distance $\\sqrt{6^2 + 8^2} = \\sqrt{100} = 10$.\n\nMeanwhile, the **midpoint** sits halfway along each axis independently: $\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)$. Notice squaring $(x_2 - x_1)^2$ makes negative steps contribute positively to length!',
            callout: {
              tone: 'key-idea',
              text: 'Midpoint AVERAGES coordinates (+ inside the numerator), while distance SUBTRACTS coordinates before squaring.',
            },
          },
          {
            id: 'qf-u2-l2-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Diagonal Length Between Quadrants',
            predictionPrompt:
              'Before calculating, is the straight-line distance between (-4, -2) and (2, 6) equal to |2 - (-4)| + |6 - (-2)| = 14?',
            predictionChoices: [
              'Yes, distance equals Δx + Δy = 14',
              'No, the diagonal hypotenuse is strictly shorter than 14 (specifically 10)',
              'No, the diagonal is longer than 14',
              'Zero, because negative and positive quadrants cancel',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'coordinate-line',
                givens: { x1: -4, y1: -2, x2: 2, y2: 6 },
                ask: 'distance',
                rounding: 'hundredth',
              },
            },
            observeInstruction:
              'Check the x-span (-4 to 2 = 6) and y-span (-2 to 6 = 8) on the coordinate figure.',
            explainPrompt: 'What calculation converts Δx = 6 and Δy = 8 into straight-line distance?',
            explainOptions: [
              'sqrt(6² + 8²) = sqrt(36 + 64) = 10',
              '(6 + 8) / 2 = 7',
              '6² − 8²',
              'sqrt(6 + 8)',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Perpendicular steps combine under the Pythagorean theorem: sqrt(6² + 8²) = 10, always shorter than the taxi-cab sum 6 + 8 = 14.',
          },
          {
            id: 'qf-u2-l2-s3',
            kind: 'worked-example',
            title: 'Computing Both Distance and Midpoint',
            problemMarkdown:
              'Given $A(-5, 7)$ and $B(3, -1)$, find the midpoint $M$ and segment length $AB$.',
            steps: [
              {
                label: 'Average x and y separately for midpoint M',
                expressionOrAction: 'M = ((-5 + 3)/2, (7 + -1)/2) = (-1, 3)',
                whyNote: 'Adding signed coordinates then halving finds the center on each axis.',
              },
              {
                label: 'Compute Δx and Δy displacements',
                expressionOrAction: 'Δx = 3 − (−5) = 8;  Δy = −1 − 7 = −8',
                whyNote: 'Subtract end minus start along each axis.',
              },
              {
                label: 'Apply distance formula',
                expressionOrAction: 'AB = sqrt(8² + (-8)²) = sqrt(64 + 64) = sqrt(128) ≈ 11.31',
                whyNote: 'Squaring (-8)² yields +64; lengths are always positive.',
              },
            ],
          },
          {
            id: 'qf-u2-l2-s4',
            kind: 'faded-practice',
            title: 'Measure a Dynamic Grid Segment',
            promptMarkdown:
              'Read the coordinates of $P_1$ and $P_2$ from the figure and finish the Pythagorean distance calculation (round to hundredths).',
            completedSteps: [
              'Step 1: Compute Δx = x₂ − x₁ and Δy = y₂ − y₁ from the plotted points.',
              'Step 2: Square both differences, sum them, and take the square root.',
            ],
            fadedTarget: {
              type: 'figure',
              question: {
                type: 'figure',
                prompt:
                  'Compute the straight-line distance between P₁ and P₂ shown in the figure (to the nearest hundredth).',
                figure: {
                  template: 'coordinate-line',
                  givens: { x1: -3, y1: 1, x2: 5, y2: 7 },
                  ask: 'distance',
                  rounding: 'hundredth',
                  ranges: { x1: [-8, -1], y1: [-8, 8], x2: [1, 8], y2: [-8, 8] },
                },
                explanation:
                  'Square the horizontal run Δx and vertical rise Δy, add them, and take the square root: sqrt((x₂−x₁)² + (y₂−y₁)²).',
                points: 15,
              },
            },
          },
          {
            id: 'qf-u2-l2-s5',
            kind: 'synthesis',
            title: 'Coordinate Geometry Takeaways',
            takeaways: [
              'Distance = sqrt((x₂ − x₁)² + (y₂ − y₁)²); Midpoint = ((x₁ + x₂)/2, (y₁ + y₂)/2).',
              'Never take sqrt(a² + b²) as a + b; square each leg before adding.',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'diagram-scout', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u2-l2-fc1',
            front: 'Euclidean distance formula between (x₁, y₁) and (x₂, y₂)',
            back: 'd = sqrt((x₂ − x₁)² + (y₂ − y₁)²).',
            explanation: 'Direct application of the Pythagorean theorem on grid axes.',
            interleave: true,
          },
          {
            id: 'qf-u2-l2-fc2',
            front: 'Midpoint formula between (x₁, y₁) and (x₂, y₂)',
            back: 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2).',
            explanation: 'Notice plus signs—average the coordinates rather than subtracting.',
            interleave: true,
          },
          {
            id: 'qf-u2-l2-fc3',
            front: 'Common trap: does sqrt(a² + b²) equal |a| + |b|?',
            back: 'No! By the triangle inequality, sqrt(a² + b²) < |a| + |b| whenever both a and b are nonzero (e.g., sqrt(3²+4²) = 5 ≠ 7).',
            explanation: 'The straight hypotenuse is strictly shorter than walking along two legs.',
            interleave: true,
          },
        ],
      },
      {
        id: 'qf-u2-l3',
        unitId: 'qf-u2',
        title: 'Rational Multiplication, Signs & Order of Operations',
        summary:
          'Prevent sign and exponent precedence bugs when chaining fractions, negatives, and intercepts.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.7.NS.A.2', 'CCSS.MATH.7.NS.A.3'],
        prerequisiteLessonIds: ['qf-u2-l1', 'qf-u2-l2'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: -2, y1: 9, x2: 4, y2: -3 },
            ask: 'yIntercept',
            rounding: 'tenth',
            ranges: { x1: [-7, -1], y1: [-8, 8], x2: [1, 7], y2: [-8, 8] },
          },
        },
        steps: [
          {
            id: 'qf-u2-l3-s1',
            kind: 'narrative',
            title: 'Why −3² Is −9 Whereas (−3)² Is +9',
            bodyMarkdown:
              'Sign flips follow multiplication count: an **even** count of negative factors yields a positive product, while an **odd** count stays negative. Critically, exponents bind more tightly than unary minus signs: **−3² means −(3 × 3) = −9**, whereas **(−3)² = (−3)(−3) = +9**.\n\nWatch the same discipline when solving $y = mx + b$ for the $y$-intercept $b = y_1 - m x_1$: subtracting a negative product $(−m x_1)$ flips sign cleanly only when parentheses guard every negative substitution.',
            callout: {
              tone: 'pitfall',
              text: 'Always wrap negative numbers in parentheses when substituting into exponents or formulas: write (−4)² instead of −4².',
            },
          },
          {
            id: 'qf-u2-l3-s2',
            kind: 'predict-observe-explain',
            title: 'Predict the Sign of the Y-Intercept',
            predictionPrompt:
              'A line drops from (-2, 9) through (4, -3) with slope m = -2. Without plotting, will its y-intercept at x = 0 be positive or negative?',
            predictionChoices: [
              'Positive (+5), because stepping 2 right from x = -2 drops 9 by 4 units',
              'Negative (-5), because the slope is negative',
              'Zero, because 9 and -3 sit on opposite sides',
              'Positive (+13), because -2 × -2 adds 4 to 9',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'coordinate-line',
                givens: { x1: -2, y1: 9, x2: 4, y2: -3 },
                ask: 'yIntercept',
                rounding: 'tenth',
              },
            },
            observeInstruction:
              'Follow the line crossing x = 0 in the coordinate plot and confirm the y-intercept height.',
            explainPrompt: 'What step-by-step arithmetic yields b = +5 from (-2, 9) and m = -2?',
            explainOptions: [
              'b = y₁ − m x₁ = 9 − (-2)(-2) = 9 − 4 = 5',
              'b = 9 + (-2)(-2) = 13',
              'b = -3 − (-2)(4) = -11',
              'b = 9 / (-2) = -4.5',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Evaluating (-2)(-2) = +4 first and subtracting gives b = 9 − 4 = +5, matching the graph.',
          },
          {
            id: 'qf-u2-l3-s3',
            kind: 'branching-scenario',
            title: 'Debug a Sign Bug in Rational Evaluation',
            startNodeId: 'eval',
            nodes: {
              eval: {
                promptMarkdown:
                  'A student evaluates $(-3/4) \\div (-9/8) + (-2)^2$ and arrives at $-2/3 + (-4) = -14/3$. Identify BOTH arithmetic errors!',
                choices: [
                  {
                    label: 'Dividing negatives is POSITIVE (+2/3) AND (-2)² is POSITIVE (+4)',
                    nextNodeId: 'done',
                    feedback:
                      'Spot on! You caught both sign mistakes: two negative factors in division yield +2/3, and (-2)² = +4.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Division keeps the negative sign (-2/3), and only (-2)² should become +4',
                    nextNodeId: 'eval',
                    feedback:
                      'Look closely at (-3/4) ÷ (-9/8): dividing a negative by a negative produces a positive quotient. Try again.',
                    outcome: 'suboptimal',
                  },
                ],
              },
              done: {
                promptMarkdown: 'Now compute the exact simplified result of $(+2/3) + 4$.',
                choices: [
                  {
                    label: '14/3 (or 4 2/3)',
                    nextNodeId: null,
                    feedback: 'Exact: 2/3 + 12/3 = 14/3.',
                    outcome: 'optimal',
                  },
                  {
                    label: '6/3 = 2',
                    nextNodeId: null,
                    feedback: 'Convert 4 to 12/3 before adding numerators: 2/3 + 12/3 = 14/3.',
                    outcome: 'suboptimal',
                  },
                ],
              },
            },
          },
          {
            id: 'qf-u2-l3-s4',
            kind: 'checkpoint',
            title: 'Find the Y-Intercept of a Dynamic Line',
            question: {
              type: 'figure',
              prompt:
                'Find the y-intercept b of the line passing through P₁ and P₂ shown in the diagram (round to the nearest tenth).',
              figure: {
                template: 'coordinate-line',
                givens: { x1: -4, y1: -1, x2: 2, y2: 8 },
                ask: 'yIntercept',
                rounding: 'tenth',
                ranges: { x1: [-7, -1], y1: [-8, 8], x2: [1, 7], y2: [-8, 8] },
              },
              explanation:
                'First compute m = (y₂ − y₁) / (x₂ − x₁), then substitute one point into b = y₁ − m x₁.',
              points: 15,
            },
          },
          {
            id: 'qf-u2-l3-s5',
            kind: 'synthesis',
            title: 'Sign Discipline Complete',
            takeaways: [
              'Dividing by a fraction multiplies by its signed reciprocal; negative ÷ negative = positive.',
              'Parentheses protect negative bases under exponents: (−x)² = x², whereas −x² = −(x²).',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'streak-siege', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u2-l3-fc1',
            front: 'Compare −5² versus (−5)²',
            back: '−5² = −(5×5) = −25, whereas (−5)² = (−5)(−5) = +25.',
            explanation: 'Exponents bind before the leading negation sign unless parentheses group the minus sign.',
            interleave: true,
          },
          {
            id: 'qf-u2-l3-fc2',
            front: 'Rule for dividing signed fractions (a/b) ÷ (c/d)',
            back: 'Multiply (a/b) × (d/c); keep track of total negative signs—two negatives yield a positive result.',
            explanation: 'Reciprocal flips numerator and denominator while preserving the divisor’s sign.',
            interleave: true,
          },
          {
            id: 'qf-u2-l3-fc3',
            front: 'How to solve for the y-intercept b from two points?',
            back: 'Compute m = (y₂ − y₁)/(x₂ − x₁), then compute b = y₁ − m·x₁ using either point.',
            explanation: 'At the y-axis, x = 0 so y = m(0) + b = b.',
            interleave: true,
          },
        ],
      },
    ],
  },
  {
    id: 'qf-u3',
    title: 'Balance Equations & Planar Geometry',
    anchoringPhenomenon:
      'Any transformation done identically to both pans of a scale preserves equality, while cutting and rearranging polygons reveals exact area formulas.',
    capstoneQuizIndex: 2,
    masteryGate: {
      policy: 'soft-recommended',
      minLessonCompletion: true,
      minQuizAccuracyPct: 80,
    },
    lessons: [
      {
        id: 'qf-u3-l1',
        unitId: 'qf-u3',
        title: 'Two-Step Equations & Symmetric Balance',
        summary:
          'Isolate an unknown variable by undoing outer operations in reverse order while preserving equality on both sides.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.7.EE.B.4', 'CCSS.MATH.8.EE.C.7'],
        prerequisiteLessonIds: ['qf-u2-l3'],
        visual: {
          kind: 'model-2d',
          modelId: 'quantitative-ratio-balance-2d',
        },
        steps: [
          {
            id: 'qf-u3-l1-s1',
            kind: 'narrative',
            title: 'Unwrapping Expressions Like Nested Boxes',
            bodyMarkdown:
              'When an expression builds $3x + 7$, it first multiplies $x$ by $3$, then adds $7$. To unwrap $3x + 7 = 22$ back to $x$, reverse those steps from the **outside in**: first subtract $7$ from both sides ($3x = 15$), then divide both sides by $3$ ($x = 5$).\n\nAlways divide the **entire** opposite side when coefficients sit in front of sums, or distribute carefully first.',
            callout: {
              tone: 'key-idea',
              text: 'Every valid algebraic step applies the SAME operation to the ENTIRE left side and ENTIRE right side of the equals sign.',
            },
          },
          {
            id: 'qf-u3-l1-s2',
            kind: 'predict-observe-explain',
            title: 'Test Balance Invariance Before Dividing',
            predictionPrompt:
              'Given 4x − 8 = 20, if you divide ONLY 4x and 20 by 4 without dividing -8, why does the equation fail?',
            predictionChoices: [
              'Because dividing a whole expression by 4 scales every term on that side, not just one term',
              'Because 20 is not divisible by 4',
              'Because −8 stays balanced automatically',
              'Because division only works on positive constants',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'model-2d',
              modelId: 'quantitative-ratio-balance-2d',
            },
            observeInstruction:
              'Observe how dividing both total pan weights by a common factor keeps the balance beam level, whereas modifying one sub-weight tilts it.',
            explainPrompt: 'What is the clean two-step solution to 4x − 8 = 20?',
            explainOptions: [
              'Add 8 to both sides (4x = 28), then divide by 4 (x = 7)',
              'Subtract 8 from 20 (4x = 12), then divide by 4 (x = 3)',
              'Divide 4x by 4 and 20 by 4 to get x − 8 = 5, so x = 13',
              'Multiply both sides by 4',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Adding 8 yields 4x = 28, and dividing by 4 gives x = 7 (or distributing division across ALL terms: x − 2 = 5, also giving x = 7).',
          },
          {
            id: 'qf-u3-l1-s3',
            kind: 'worked-example',
            title: 'Solving Equations with Variables on Both Sides',
            problemMarkdown: 'Solve $5x - 3 = 2x + 12$ and verify the solution.',
            steps: [
              {
                label: 'Collect variable terms on one side',
                expressionOrAction: 'Subtract 2x from both sides -> 3x − 3 = 12',
                whyNote: 'Removing 2x keeps the remaining x-coefficient positive (+3).',
              },
              {
                label: 'Isolate the variable term',
                expressionOrAction: 'Add 3 to both sides -> 3x = 15',
                whyNote: 'Undoes subtraction on the variable side.',
              },
              {
                label: 'Divide by coefficient and verify',
                expressionOrAction: 'x = 5. Check: 5(5)−3 = 22 and 2(5)+12 = 22.',
                whyNote: 'Checking by substitution guarantees no sign slip occurred.',
              },
            ],
          },
          {
            id: 'qf-u3-l1-s4',
            kind: 'faded-practice',
            title: 'Solve with Parentheses',
            promptMarkdown:
              'A rectangle has width $w$ and length $(w + 4)$. Its perimeter $2(w + w + 4) = 36$. Finish solving for $w$.',
            completedSteps: [
              'Step 1: Combine inside parentheses -> 2(2w + 4) = 36.',
              'Step 2: Divide both sides by 2 -> 2w + 4 = 18.',
            ],
            fadedTarget: {
              type: 'fill',
              question: {
                type: 'fill',
                prompt: 'What is the width w?',
                correct: '7',
                alternatives: ['w = 7'],
                explanation: 'Subtract 4 from 18 to get 2w = 14, then divide by 2 -> w = 7.',
                points: 10,
              },
            },
          },
          {
            id: 'qf-u3-l1-s5',
            kind: 'synthesis',
            title: 'Algebraic Equality Summary',
            takeaways: [
              'Undo addition/subtraction first (outermost layer), then divide/multiply—or distribute cleanly first.',
              'Plug the final number back into BOTH sides of the original equation as a 5-second check.',
            ],
            nextQuizIndex: 2,
            arcadeLaunch: { mode: 'sequence-architect', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u3-l1-fc1',
            front: 'Why check a solved equation by substituting back into the original prompt?',
            back: 'Verification confirms the value makes Left Side = Right Side before rounding or moving on, catching sign errors immediately.',
            explanation: 'A true solution satisfies the un-simplified original statement.',
            interleave: true,
          },
          {
            id: 'qf-u3-l1-fc2',
            front: 'Distributive trap when solving a(x + b) = c',
            back: 'Multiplying a only by x and forgetting to multiply a by b (or dividing only part of a sum).',
            explanation: 'Every term inside parentheses scales by a: a(x + b) = ax + ab.',
            interleave: true,
          },
          {
            id: 'qf-u3-l1-fc3',
            front: 'When does a linear equation have infinitely many vs zero solutions?',
            back: 'True identity like 3x + 2 = 3x + 2 has infinitely many solutions; contradiction like 3x + 2 = 3x + 5 has zero solutions.',
            explanation: 'Parallel non-coincident lines never intersect; identical lines overlap everywhere.',
            interleave: true,
          },
        ],
      },
      {
        id: 'qf-u3-l2',
        unitId: 'qf-u3',
        title: 'Right Triangles, Trapezoids & Averaged Bases',
        summary:
          'Derive trapezoid area by averaging parallel bases and solve diagonal lengths via the Pythagorean theorem.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.6.G.A.1', 'CCSS.MATH.8.G.B.7'],
        prerequisiteLessonIds: ['qf-u2-l2', 'qf-u3-l1'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'trapezoid',
            givens: { b1: 8, b2: 14, h: 6 },
            ask: 'area',
            rounding: 'tenth',
            ranges: { b1: [5, 16], b2: [7, 22], h: [3, 12] },
          },
        },
        steps: [
          {
            id: 'qf-u3-l2-s1',
            kind: 'narrative',
            title: 'Every Trapezoid Is a Rectangle With Averaged Width',
            bodyMarkdown:
              'Flip a duplicate trapezoid upside down and attach it along one slanted side: the two trapezoids form a **parallelogram** of total base $(b_1 + b_2)$ and perpendicular height $h$. Cutting back to one trapezoid takes half that area: $A = \\frac{b_1 + b_2}{2} \\cdot h$.\n\nNotice $\\frac{b_1 + b_2}{2}$ is literally the **midsegment** (average width), so trapezoid area obeys *average base × perpendicular height*—just like a rectangle!',
            callout: {
              tone: 'pitfall',
              text: 'Always use perpendicular height h, never a slanted side length, when computing triangle or trapezoid area.',
            },
          },
          {
            id: 'qf-u3-l2-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Area from Midsegment Width',
            predictionPrompt:
              'A trapezoid has parallel bases 8 cm and 14 cm, and height 6 cm. What single rectangle has the exact same area?',
            predictionChoices: [
              'A rectangle of width 11 cm (average of 8 and 14) and height 6 cm',
              'A rectangle of width 22 cm (sum of 8 and 14) and height 6 cm',
              'A rectangle of width 8 cm and height 6 cm',
              'A rectangle of width 14 cm and height 6 cm',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'trapezoid',
                givens: { b1: 8, b2: 14, h: 6 },
                ask: 'area',
                rounding: 'tenth',
              },
            },
            observeInstruction:
              'Inspect the parallel bases and perpendicular altitude in the trapezoid diagram.',
            explainPrompt:
              'What happens if you slice off the overhanging corners above the midsegment and rotate them upward?',
            explainOptions: [
              'They fill the narrower top side to form an exact rectangle of width (b₁ + b₂)/2 and height h',
              'They double the height h',
              'They shrink the area to zero',
              'They only fit when b₁ = b₂',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Because the midsegment width ((8 + 14)/2 = 11) matches the rectangle equivalent, area = 11 × 6 = 66 square units.',
          },
          {
            id: 'qf-u3-l2-s3',
            kind: 'worked-example',
            title: 'Finding a Slanted Ladder Height with a² + b² = c²',
            problemMarkdown:
              'A **13 m** ladder leans against a wall with its base **5 m** from the wall. How high up the wall does it reach?',
            steps: [
              {
                label: 'Identify hypotenuse vs legs',
                expressionOrAction: 'c = 13 m (ladder opposite the right angle); leg a = 5 m.',
                whyNote: 'The ground and vertical wall form the 90° angle, so the ladder itself is c.',
              },
              {
                label: 'Solve for missing leg b',
                expressionOrAction: '5² + b² = 13² -> 25 + b² = 169 -> b² = 144 -> b = 12 m.',
                whyNote: 'Subtract the known leg squared from c² before taking the square root.',
              },
            ],
          },
          {
            id: 'qf-u3-l2-s4',
            kind: 'checkpoint',
            title: 'Dynamic Trapezoid Area Practice',
            question: {
              type: 'figure',
              prompt:
                'Compute the area of the labeled trapezoid shown in the diagram (round to the nearest tenth).',
              figure: {
                template: 'trapezoid',
                givens: { b1: 7, b2: 15, h: 8 },
                ask: 'area',
                rounding: 'tenth',
                ranges: { b1: [4, 15], b2: [6, 20], h: [3, 12] },
              },
              explanation:
                'Average the two parallel bases and multiply by perpendicular height: A = ((b₁ + b₂) / 2) × h.',
              points: 15,
            },
          },
          {
            id: 'qf-u3-l2-s5',
            kind: 'synthesis',
            title: 'Polygons & Right Triangles Connected',
            takeaways: [
              'Trapezoid Area = ((b₁ + b₂)/2) · h, unifying rectangles (b₁ = b₂) and triangles (b₁ = 0).',
              'In a right triangle, subtract known leg² from hypotenuse² when finding a leg; add squares only when finding c.',
            ],
            nextQuizIndex: 2,
            arcadeLaunch: { mode: 'diagram-scout', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u3-l2-fc1',
            front: 'Trapezoid area formula and why it unifies triangles and rectangles',
            back: 'A = ((b₁ + b₂)/2) · h. Setting b₁ = b₂ gives b·h (rectangle); setting b₁ = 0 gives (1/2)b₂·h (triangle).',
            explanation: 'A triangle is simply a degenerate trapezoid whose top parallel base shrank to length zero.',
            interleave: true,
          },
          {
            id: 'qf-u3-l2-fc2',
            front: 'What is the midsegment of a trapezoid?',
            back: 'The segment joining the midpoints of its non-parallel legs; its length equals (b₁ + b₂) / 2.',
            explanation: 'Parallel to both bases with length equal to their arithmetic mean.',
            interleave: true,
          },
          {
            id: 'qf-u3-l2-fc3',
            front: 'Common 3 integer Pythagorean triples to recognize fast',
            back: '(3, 4, 5), (5, 12, 13), and (8, 15, 17) (and any integer multiples like 6-8-10).',
            explanation: 'Checking if a² + b² = c² verifies right angles without a protractor.',
            interleave: true,
          },
        ],
      },
      {
        id: 'qf-u3-l3',
        unitId: 'qf-u3',
        title: 'Triangle Angle Sums & ASA Determination',
        summary:
          'Determine missing angles from the 180° triangle invariant and reconstruct rigid triangles from Angle-Side-Angle givens.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.7.G.A.2', 'CCSS.MATH.8.G.A.5'],
        prerequisiteLessonIds: ['qf-u3-l2'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'triangle-asa',
            givens: { angleA: 42, b: 14, angleC: 63 },
            ask: 'angleB',
            rounding: 'tenth',
            ranges: { angleA: [25, 65], b: [8, 22], angleC: [25, 65] },
          },
        },
        steps: [
          {
            id: 'qf-u3-l3-s1',
            kind: 'narrative',
            title: 'Why Any Triangle’s Corners Form a Straight Line',
            bodyMarkdown:
              'Draw a line parallel to a triangle’s base through its top vertex. By alternate interior angles, the left and right base angles sit flush alongside the top vertex angle, forming a **180° straight angle**.\n\nThat invariant locks any **Angle-Side-Angle (ASA)** triangle into a rigid shape: knowing two angles immediately fixes the third ($B = 180^\\circ - A - C$), and fixing the included base $b$ forces the two non-parallel rays to intersect at a single unique point!',
            callout: {
              tone: 'key-idea',
              text: 'Three angles alone (AAA) determine shape/similarity, NOT size. You need at least one side length (as in ASA) to lock scale.',
            },
          },
          {
            id: 'qf-u3-l3-s2',
            kind: 'predict-observe-explain',
            title: 'Test Rigidity of ASA Givens',
            predictionPrompt:
              'A surveyor measures baseline b = 14 m, left angle A = 42°, and right angle C = 63°. How many distinct triangles fit these measurements?',
            predictionChoices: [
              'Infinitely many scaled triangles',
              'Exactly one unique triangle (up to congruence)',
              'Zero triangles because 42 + 63 > 90',
              'Two ambiguous triangles',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'triangle-asa',
                givens: { angleA: 42, b: 14, angleC: 63 },
                ask: 'angleB',
                rounding: 'tenth',
              },
            },
            observeInstruction:
              'Examine how fixing baseline b and base angles A and C in the ASA diagram forces the rays from A and C to meet at one exact vertex B.',
            explainPrompt: 'What is the third angle B across from side b?',
            explainOptions: [
              '75°, because 180° − (42° + 63°) = 75°',
              '105°, because A + C = 105°',
              '90°, because triangles with acute base angles are right triangles',
              '21°, the difference between C and A',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Interior angles sum to 180°, so angle B = 180 − 42 − 63 = 75°, fixing the Law of Sines proportions uniquely.',
          },
          {
            id: 'qf-u3-l3-s3',
            kind: 'branching-scenario',
            title: 'Choose the Right Geometric Strategy',
            startNodeId: 'triage',
            nodes: {
              triage: {
                promptMarkdown:
                  'A field engineer hands you a sketch with base angle $A = 50^\\circ$, base angle $C = 70^\\circ$, and side $b = 12\\text{ m}$ between them. Which fact should you compute FIRST to unlock side $a$?',
                choices: [
                  {
                    label: 'Find angle B = 180° − 50° − 70° = 60° opposite the known side b',
                    nextNodeId: 'solve-side',
                    feedback:
                      'Yes! Side b sits across from angle B, so knowing angle B unlocks the ratio b / sin(B) immediately.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Apply a² + b² = c² right away',
                    nextNodeId: 'triage',
                    feedback:
                      'Careful—none of the angles is 90°, so the Pythagorean theorem does not apply here!',
                    outcome: 'unsafe',
                  },
                ],
              },
              'solve-side': {
                promptMarkdown:
                  'Now that B = 60° and b = 12 m are paired across the triangle, which equality finds side a across from A = 50°?',
                choices: [
                  {
                    label: 'a / sin(50°) = 12 / sin(60°)',
                    nextNodeId: null,
                    feedback:
                      'Perfect—each side divides by the sine of its directly opposite angle.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'a / sin(60°) = 12 / sin(50°)',
                    nextNodeId: null,
                    feedback:
                      'Angles flipped! Side a pairs with angle A (50°), and side b pairs with angle B (60°).',
                    outcome: 'suboptimal',
                  },
                ],
              },
            },
          },
          {
            id: 'qf-u3-l3-s4',
            kind: 'checkpoint',
            title: 'Dynamic Triangle ASA Problem',
            question: {
              type: 'figure',
              prompt:
                'Using the labeled ASA triangle, find the remaining interior angle B in degrees (round to the nearest tenth).',
              figure: {
                template: 'triangle-asa',
                givens: { angleA: 48, b: 16, angleC: 57 },
                ask: 'angleB',
                rounding: 'tenth',
                ranges: { angleA: [25, 65], b: [8, 22], angleC: [25, 65] },
              },
              explanation:
                'The three interior angles of every planar triangle sum to 180°, so angle B = 180° − angle A − angle C.',
              points: 15,
            },
          },
          {
            id: 'qf-u3-l3-s5',
            kind: 'synthesis',
            title: 'Unit 3 Mastery & Final Track Capstone',
            takeaways: [
              'Every planar triangle satisfies A + B + C = 180°; an exterior angle equals the sum of the two remote interior angles.',
              'ASA specifies one unique triangle and unlocks side lengths through Law of Sines proportionality.',
            ],
            nextQuizIndex: 2,
            arcadeLaunch: { mode: 'boss-raid', packId: 'quantitative-foundations' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'qf-u3-l3-fc1',
            front: 'Why does Angle-Side-Angle (ASA) guarantee triangle congruence while AAA does not?',
            back: 'ASA fixes one concrete length alongside two angles, preventing uniform scaling; AAA allows infinitely many similar sizes.',
            explanation: 'At least one linear measurement is needed to determine scale.',
            interleave: true,
          },
          {
            id: 'qf-u3-l3-fc2',
            front: 'Triangle Sum & Exterior Angle Theorems',
            back: 'Interior angles sum to 180°; an exterior angle at vertex C equals A + B.',
            explanation: 'Since C + ext(C) = 180° and A + B + C = 180°, ext(C) = A + B.',
            interleave: true,
          },
          {
            id: 'qf-u3-l3-fc3',
            front: 'Can a triangle have side lengths 4, 5, and 10?',
            back: 'No! By the Triangle Inequality Theorem, 4 + 5 = 9 ≤ 10, so the two shorter sides cannot meet.',
            explanation: 'Any two side lengths of a triangle must sum strictly greater than the third.',
            interleave: true,
          },
        ],
      },
    ],
  },
]

// ── Track 2: Precalculus, Trigonometry & Vectors ───────────────
const PRECALC_UNITS: TrackUnit[] = [
  {
    id: 'pc-u1',
    title: 'Function Families, Transformations & Quadratic Structure',
    anchoringPhenomenon:
      'Shifting and stretching a single parent parabola or exponential curve generates every trajectory in projectile motion and growth modeling.',
    capstoneQuizIndex: 0,
    masteryGate: {
      policy: 'soft-recommended',
      minLessonCompletion: true,
      minQuizAccuracyPct: 75,
    },
    lessons: [
      {
        id: 'pc-u1-l1',
        unitId: 'pc-u1',
        title: 'Shifts, Reflections & Horizontal Counter-Intuition',
        summary:
          'Distinguish vertical changes outside f(x) from horizontal changes inside f(x − h) using vertex geometry.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.HSF.BF.B.3', 'CCSS.MATH.HSF.IF.B.4'],
        prerequisiteLessonIds: [],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'parabola-vertex',
            givens: { a: 2, b: -12, c: 11 },
            ask: 'vertexX',
            rounding: 'tenth',
            ranges: { a: [1, 4], b: [-12, 12], c: [-10, 10] },
          },
        },
        steps: [
          {
            id: 'pc-u1-l1-s1',
            kind: 'narrative',
            title: 'Why f(x − 3) Shifts RIGHT, Not Left',
            bodyMarkdown:
              'Vertical edits act **after** $f$ computes its output, so $f(x) + 4$ shifts upward $+4$ just as you expect. Horizontal edits modify the **input** before $f$ acts.\n\nTo hit the parent vertex at input $0$ inside $f(x - 3)$, you must feed in $x = +3$ because $3 - 3 = 0$. Therefore, replacing $x$ by $(x - h)$ shifts right by $h$, and for $ax^2 + bx + c$ the vertex axis lies at $x_v = -\\frac{b}{2a}$.',
            callout: {
              tone: 'key-idea',
              text: 'Axis of symmetry x = −b / (2a) averages the two symmetric roots whenever real roots exist.',
            },
          },
          {
            id: 'pc-u1-l1-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Vertex Location from Standard Coefficients',
            predictionPrompt:
              'For y = 2x² − 12x + 11, where does the parabola’s lowest point (vertex x-coordinate) lie?',
            predictionChoices: [
              'x = +3',
              'x = −3',
              'x = +6',
              'x = −6',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'parabola-vertex',
                givens: { a: 2, b: -12, c: 11 },
                ask: 'vertexX',
                rounding: 'tenth',
              },
            },
            observeInstruction:
              'Read the symmetry axis and minimum point on the parabola figure and note the signs of a and b.',
            explainPrompt: 'Why is the vertex at x = +3 rather than −3?',
            explainOptions: [
              'Because x = −b / (2a) = −(−12) / (2·2) = +12 / 4 = +3',
              'Because completing the square writes 2(x + 3)²',
              'Because c = 11 pushes the vertex right by 3',
              'Because dividing −12 by 4 without the formula minus sign gives +3',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Factoring out a = 2 gives 2(x² − 6x) + 11 = 2(x − 3)² − 7, confirming the shift is 3 units RIGHT.',
          },
          {
            id: 'pc-u1-l1-s3',
            kind: 'worked-example',
            title: 'Rewriting Standard Form Into Vertex Form',
            problemMarkdown: 'Express $g(x) = -x^2 + 8x - 10$ in vertex form $a(x - h)^2 + k$.',
            steps: [
              {
                label: 'Factor a = −1 from the x-terms',
                expressionOrAction: 'g(x) = −(x² − 8x) − 10',
                whyNote: 'Pay close attention to flipping +8x to −8x inside the negative parentheses.',
              },
              {
                label: 'Complete the square inside parentheses',
                expressionOrAction: '(x² − 8x + 16 − 16) -> g(x) = −(x − 4)² − (−16) − 10',
                whyNote: 'Taking −16 outside multiplies by the leading −1 factor, adding +16!',
              },
              {
                label: 'Read vertex directly',
                expressionOrAction: 'g(x) = −(x − 4)² + 6 -> vertex is (4, 6), a maximum.',
                whyNote: 'Check with -b/(2a) = -8/(-2) = 4 and g(4) = -16 + 32 - 10 = 6.',
              },
            ],
          },
          {
            id: 'pc-u1-l1-s4',
            kind: 'checkpoint',
            title: 'Find Dynamic Vertex Coordinate',
            question: {
              type: 'figure',
              prompt:
                'Find the x-coordinate of the vertex for the quadratic shown in the figure (round to the nearest tenth).',
              figure: {
                template: 'parabola-vertex',
                givens: { a: 2, b: -8, c: 3 },
                ask: 'vertexX',
                rounding: 'tenth',
                ranges: { a: [1, 4], b: [-12, 12], c: [-8, 8] },
              },
              explanation: 'Compute x_vertex = −b / (2a) from the labeled quadratic coefficients.',
              points: 15,
            },
          },
          {
            id: 'pc-u1-l1-s5',
            kind: 'synthesis',
            title: 'Transformations Summary',
            takeaways: [
              'Outside edits af(x) + k affect y directly; inside edits f(b(x − h)) reverse-scale x.',
              'Vertex x_v = −b/(2a) marks both the turning point and reflection line of a parabola.',
            ],
            nextQuizIndex: 0,
            arcadeLaunch: { mode: 'step-detective', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u1-l1-fc1',
            front: 'In g(x) = a·f(x − h) + k, what does h > 0 do to the graph?',
            back: 'Translates the graph RIGHT by h units because x must be h larger to produce the same inner argument.',
            explanation: 'Horizontal transformations act inversely to the literal sign inside f(...).',
            interleave: true,
          },
          {
            id: 'pc-u1-l1-fc2',
            front: 'Formula for the vertex of y = ax² + bx + c',
            back: 'x_v = −b/(2a), and y_v = f(−b/(2a)) = c − b²/(4a).',
            explanation: 'Opens upward (minimum) if a > 0; downward (maximum) if a < 0.',
            interleave: true,
          },
          {
            id: 'pc-u1-l1-fc3',
            front: 'How do f(−x) and −f(x) reflect a graph differently?',
            back: '−f(x) flips across the x-axis (negates y); f(−x) flips across the y-axis (negates x).',
            explanation: 'Even functions satisfy f(−x) = f(x); odd functions satisfy f(−x) = −f(x).',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u1-l2',
        unitId: 'pc-u1',
        title: 'Discriminant Regimes & Real Roots',
        summary:
          'Classify parabola-axis crossings using b² − 4ac and extract exact intercepts using the quadratic formula.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.HSA.REI.B.4', 'CCSS.MATH.HSF.IF.C.8'],
        prerequisiteLessonIds: ['pc-u1-l1'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'parabola-vertex',
            givens: { a: 1, b: -2, c: -8 },
            ask: 'greaterRoot',
            rounding: 'hundredth',
            ranges: { a: [1, 3], b: [-10, 10], c: [-15, -1] },
          },
        },
        steps: [
          {
            id: 'pc-u1-l2-s1',
            kind: 'narrative',
            title: 'Symmetry Plus or Minus Half-Spread',
            bodyMarkdown:
              'Writing the quadratic formula as $x = -\\frac{b}{2a} \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}$ reveals geometry right inside the algebra: both roots sit **equally spaced** to the left and right of the vertex $x_v = -b/(2a)$!\n\nWhen the discriminant $\\Delta = b^2 - 4ac > 0$, two real intercepts appear; at $\\Delta = 0$ the vertex kisses the $x$-axis once; when $\\Delta < 0$, the parabola hovers entirely above or below the $x$-axis with zero real roots.',
            callout: {
              tone: 'key-idea',
              text: 'Always check Δ = b² − 4ac BEFORE applying square roots: if Δ < 0, there are no real x-intercepts.',
            },
          },
          {
            id: 'pc-u1-l2-s2',
            kind: 'predict-observe-explain',
            title: 'Guarantee Two Opposite-Sign Roots',
            predictionPrompt:
              'When an upward parabola (a > 0) has a negative y-intercept (c < 0), how many real roots must it have?',
            predictionChoices: [
              'Always 2 real roots (one positive, one negative)',
              'Zero real roots',
              'Exactly 1 tangent root',
              'Depends on whether b is positive',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'parabola-vertex',
                givens: { a: 1, b: -2, c: -8 },
                ask: 'greaterRoot',
                rounding: 'hundredth',
              },
            },
            observeInstruction:
              'Notice the vertex dips below the x-axis whenever c < 0 and a > 0, forcing both arms upward across y = 0.',
            explainPrompt: 'What algebra proves Δ > 0 whenever a and c have opposite signs?',
            explainOptions: [
              'Because −4ac > 0 when a > 0 and c < 0, making b² − 4ac strictly positive',
              'Because b² is sometimes negative',
              'Because the y-intercept equals the x-intercept',
              'Because a + c must equal zero',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Since b² ≥ 0 and −4ac > 0, their sum b² − 4ac is strictly positive for ANY b, guaranteeing two distinct real roots.',
          },
          {
            id: 'pc-u1-l2-s3',
            kind: 'worked-example',
            title: 'Finding the Greater Root Precisely',
            problemMarkdown: 'Find the larger root of $2x^2 + 3x - 5 = 0$.',
            steps: [
              {
                label: 'Compute discriminant first',
                expressionOrAction: 'Δ = 3² − 4(2)(−5) = 9 + 40 = 49',
                whyNote: 'Positive perfect square guarantees two rational real roots.',
              },
              {
                label: 'Apply quadratic formula with + branch',
                expressionOrAction: 'x_max = (−3 + sqrt(49)) / (2·2) = (−3 + 7) / 4 = +1',
                whyNote: 'Since 2a > 0, adding +sqrt(Δ) selects the greater root; (−3 − 7)/4 = −2.5 is the lesser root.',
              },
            ],
          },
          {
            id: 'pc-u1-l2-s4',
            kind: 'faded-practice',
            title: 'Compute Dynamic Greater Root',
            promptMarkdown:
              'Using the coefficients labeled on the parabola figure, compute its greater x-intercept (to the nearest hundredth).',
            completedSteps: [
              'Step 1: Compute Δ = b² − 4ac (guaranteed > 0 because a > 0 and c < 0).',
              'Step 2: Take the + branch (−b + sqrt(Δ)) / (2a) since a > 0.',
            ],
            fadedTarget: {
              type: 'figure',
              question: {
                type: 'figure',
                prompt:
                  'Find the greater real root (largest x-intercept) of the graphed parabola (round to hundredths).',
                figure: {
                  template: 'parabola-vertex',
                  givens: { a: 2, b: -4, c: -6 },
                  ask: 'greaterRoot',
                  rounding: 'hundredth',
                  ranges: { a: [1, 3], b: [-10, 10], c: [-15, -1] },
                },
                explanation:
                  'With a > 0, the greater root is (−b + sqrt(b² − 4ac)) / (2a).',
                points: 15,
              },
            },
          },
          {
            id: 'pc-u1-l2-s5',
            kind: 'synthesis',
            title: 'Discriminant Takeaways',
            takeaways: [
              'Δ = b² − 4ac tells you intercept count (2, 1, or 0) before extracting roots.',
              'Opposite signs on a and c always force Δ > 0 and two opposite-sign roots.',
            ],
            nextQuizIndex: 0,
            arcadeLaunch: { mode: 'cloze-workbench', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u1-l2-fc1',
            front: 'What do Δ > 0, Δ = 0, and Δ < 0 tell you geometrically for y = ax² + bx + c?',
            back: '2 x-intercepts, 1 tangent x-intercept at the vertex, or 0 real x-intercepts respectively.',
            explanation: 'Δ = b² − 4ac appears inside the square root of the quadratic formula.',
            interleave: true,
          },
          {
            id: 'pc-u1-l2-fc2',
            front: 'Vieta’s formulas for sum and product of quadratic roots r₁, r₂',
            back: 'r₁ + r₂ = −b/a and r₁·r₂ = c/a.',
            explanation: 'Dividing ax² + bx + c = a(x − r₁)(x − r₂) by a directly matches coefficients.',
            interleave: true,
          },
          {
            id: 'pc-u1-l2-fc3',
            front: 'Which branch of the quadratic formula gives the greater root when a < 0?',
            back: '(−b − sqrt(Δ)) / (2a), because dividing a negative numerator by negative 2a makes it larger!',
            explanation: 'Careful when a < 0: subtracting sqrt(Δ) before dividing by negative 2a produces the positive shift.',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u1-l3',
        unitId: 'pc-u1',
        title: 'Function Composition, Inverses & Power Laws',
        summary:
          'Verify whether an inverse function exists via horizontal slicing and compose operations in strict inner-to-outer order.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.HSF.BF.A.1', 'CCSS.MATH.HSF.BF.B.4'],
        prerequisiteLessonIds: ['pc-u1-l2'],
        visual: {
          kind: 'model-3d',
          modelId: 'kepler',
          initialParams: { a: 4, e: 0.25 },
          highlightHotspots: ['planet', 'sun'],
        },
        steps: [
          {
            id: 'pc-u1-l3-s1',
            kind: 'narrative',
            title: 'Order Matters When Functions Chain Together',
            bodyMarkdown:
              'In $f(g(x))$, $g$ runs **first** and passes its output into $f$. Generally $f(g(x)) \\neq g(f(x))$—putting on socks then shoes is completely different from shoes then socks!\n\nAn **inverse function** $f^{-1}$ exists when each output comes from **at most one input** (the horizontal line test). That is why $y = x^2$ needs its domain restricted to $x \\ge 0$ before $y = \\sqrt{x}$ cleanly inverts it, and why Kepler’s third law $T^2 = k a^3$ inverts to $T(a) = \\sqrt{k}\\,a^{3/2}$ for positive semi-major axes $a > 0$.',
            callout: {
              tone: 'pitfall',
              text: 'Do not confuse f⁻¹(x) (inverse function, undoing f) with 1/f(x) (multiplicative reciprocal).',
            },
          },
          {
            id: 'pc-u1-l3-s2',
            kind: 'predict-observe-explain',
            title: 'Test Nonlinear Power Scaling in Orbital Periods',
            predictionPrompt:
              'In Kepler’s 3D orbit model, period follows T ∝ a^(3/2). If you quadruple the semi-major axis a (4×), how does the orbital period T scale?',
            predictionChoices: [
              'T stays the same (1×)',
              'T quadruples (4×)',
              'T increases 8× (since 4^(3/2) = 8)',
              'T increases 16× (4²)',
            ],
            correctPredictionIndex: 2,
            visual: {
              kind: 'model-3d',
              modelId: 'kepler',
              initialParams: { a: 2.5, e: 0.1 },
              highlightHotspots: ['sun', 'planet'],
            },
            observeInstruction:
              'Slide the semi-major axis parameter "a" upward in the 3D orbital model and compare orbital period changes as radius expands.',
            explainPrompt: 'How do you invert T = a^(3/2) to recover a from a measured period T?',
            explainOptions: [
              'Raise T to the reciprocal exponent: a = T^(2/3)',
              'Divide T by 3/2: a = (2/3)T',
              'Take −T^(3/2)',
              'Add 3/2 to T',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Since a > 0, x^(3/2) is strictly increasing (one-to-one) and inverts cleanly by raising to the reciprocal power 2/3.',
          },
          {
            id: 'pc-u1-l3-s3',
            kind: 'worked-example',
            title: 'Testing True Mutual Inverses',
            problemMarkdown:
              'Given $f(x) = 3x - 6$ and $g(x) = \\frac{x + 6}{3}$, show both compositions yield $x$.',
            steps: [
              {
                label: 'Evaluate f(g(x))',
                expressionOrAction: 'f((x + 6)/3) = 3·((x + 6)/3) − 6 = (x + 6) − 6 = x',
                whyNote: 'Multiply by 3 then subtract 6 reverses add 6 then divide by 3.',
              },
              {
                label: 'Evaluate g(f(x))',
                expressionOrAction: 'g(3x − 6) = ((3x − 6) + 6)/3 = 3x/3 = x',
                whyNote: 'Confirming both directions equals x proves g = f⁻¹ (graph reflected across y = x).',
              },
            ],
          },
          {
            id: 'pc-u1-l3-s4',
            kind: 'checkpoint',
            title: 'Order Steps to Invert a Linear-Root Model',
            question: {
              type: 'order',
              prompt: 'Order the steps to find f⁻¹(x) for y = sqrt(2x − 6) (domain x ≥ 3, y ≥ 0):',
              options: [
                'Swap x and y: x = sqrt(2y − 6)',
                'Square both sides (noting x ≥ 0): x² = 2y − 6',
                'Add 6 to both sides: x² + 6 = 2y',
                'Divide by 2: f⁻¹(x) = (x² + 6)/2 for x ≥ 0',
              ],
              correct: [0, 1, 2, 3],
              explanation:
                'Swap inputs and outputs, unwrap outer square root -> addition -> coefficient 2, and preserve the range x ≥ 0 of the original output.',
              points: 10,
            },
          },
          {
            id: 'pc-u1-l3-s5',
            kind: 'synthesis',
            title: 'Unit 1 Complete: Functions & Quadratics',
            takeaways: [
              'f(g(x)) feeds g(x) into f; inverses exist only on intervals passing the horizontal line test.',
              'Graphs of f and f⁻¹ mirror symmetrically across the diagonal line y = x.',
            ],
            nextQuizIndex: 0,
            arcadeLaunch: { mode: 'sequence-architect', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u1-l3-fc1',
            front: 'Geometric relationship between y = f(x) and y = f⁻¹(x)',
            back: 'Every point (a, b) on f becomes (b, a) on f⁻¹, reflecting the graph across the line y = x.',
            explanation: 'Domain of f becomes Range of f⁻¹, and Range of f becomes Domain of f⁻¹.',
            interleave: true,
          },
          {
            id: 'pc-u1-l3-fc2',
            front: 'What test checks whether f has an inverse without restricting its domain?',
            back: 'The Horizontal Line Test: no horizontal line y = k intersects the graph more than once (one-to-one).',
            explanation: 'Vertical Line Test checks whether a curve is a function; Horizontal Line Test checks invertibility.',
            interleave: true,
          },
          {
            id: 'pc-u1-l3-fc3',
            front: 'How do you invert a power function y = x^(p/q) for x > 0?',
            back: 'Raise both sides to the reciprocal exponent q/p: x = y^(q/p).',
            explanation: '(x^(p/q))^(q/p) = x^1 = x.',
            interleave: true,
          },
        ],
      },
    ],
  },
  {
    id: 'pc-u2',
    title: 'The Unit Circle, Radians & Periodic Waves',
    anchoringPhenomenon:
      'A point gliding counterclockwise around a unit wheel sweeps smooth sine and cosine waves whose frequency and phase control sound and light interference.',
    capstoneQuizIndex: 1,
    masteryGate: {
      policy: 'soft-recommended',
      minLessonCompletion: true,
      minQuizAccuracyPct: 75,
    },
    lessons: [
      {
        id: 'pc-u2-l1',
        unitId: 'pc-u2',
        title: 'Radian Measure & Arc-Length Equivalence',
        summary:
          'Measure angles intrinsically by arc length divided by radius so 2π radians completes one revolution.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.HSF.TF.A.1'],
        prerequisiteLessonIds: ['pc-u1-l1'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'unit-circle',
            givens: { angleDeg: 60 },
            ask: 'radians',
            rounding: 'thousandth',
            ranges: { angleDeg: [15, 345] },
          },
        },
        steps: [
          {
            id: 'pc-u2-l1-s1',
            kind: 'narrative',
            title: 'Why Calculus Prefers 2π Over 360',
            bodyMarkdown:
              'Arbitrarily splitting a circle into 360 slices comes from ancient calendars—not circle geometry. A **radian** defines angle directly from the circle itself: turn until the curved arc length $s$ equals **1 radius** ($r$), and you have swept $1\\text{ rad} \\approx 57.3^\\circ$.\n\nBecause circumference is $2\\pi r$, one full circle spans $s/r = 2\\pi$ radians, so **$\\pi\\text{ rad} = 180^\\circ$** exactly. This turns arc length into a single product: $s = r\\theta$.',
            callout: {
              tone: 'key-idea',
              text: 'Convert degrees to radians by multiplying by π / 180; convert radians to degrees by multiplying by 180 / π.',
            },
          },
          {
            id: 'pc-u2-l1-s2',
            kind: 'predict-observe-explain',
            title: 'Estimate Radian Angle Visually on the Unit Circle',
            predictionPrompt:
              'On a circle of radius r = 1, how many whole radians fit inside a semicircle (180°)?',
            predictionChoices: [
              '1 radian',
              '2 radians',
              'Slightly over 3 radians (π ≈ 3.1416 rad)',
              '180 radians',
            ],
            correctPredictionIndex: 2,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'unit-circle',
                givens: { angleDeg: 180 },
                ask: 'radians',
                rounding: 'thousandth',
              },
            },
            observeInstruction:
              'Inspect the 180° point on the unit circle and read its decimal radian measure.',
            explainPrompt: 'Why is 60° equal to π/3 ≈ 1.047 radians?',
            explainOptions: [
              '60° is 1/3 of a half-turn (180° = π rad), so θ = π/3 ≈ 1.0472',
              'Because 60 ÷ 180 = 3',
              'Because 60° equals 3 radii wrapped along the arc',
              'Because π ≈ 60 / 20',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              '60° = (60/180)π = π/3 ≈ 1.047 radians, just slightly past 1 full radius wrapped around the rim.',
          },
          {
            id: 'pc-u2-l1-s3',
            kind: 'worked-example',
            title: 'Sweeping Arc Length on a Wheel',
            problemMarkdown:
              'A bicycle wheel of radius **0.35 m** turns through **$120^\\circ$**. How far does a chalk mark on the tire travel?',
            steps: [
              {
                label: 'Convert degrees to radians first',
                expressionOrAction: 'θ = 120° × (π / 180°) = 2π/3 ≈ 2.0944 rad',
                whyNote: 'The arc formula s = rθ only works when θ is measured in radians.',
              },
              {
                label: 'Multiply radius by radian angle',
                expressionOrAction: 's = 0.35 m × 2.0944 ≈ 0.733 m',
                whyNote: 'Radians are dimensionless (length/length), leaving meters cleanly.',
              },
            ],
          },
          {
            id: 'pc-u2-l1-s4',
            kind: 'checkpoint',
            title: 'Dynamic Unit Circle Radian Conversion',
            question: {
              type: 'figure',
              prompt:
                'Convert the angle θ shown on the unit circle from degrees into radians (to the nearest thousandth).',
              figure: {
                template: 'unit-circle',
                givens: { angleDeg: 135 },
                ask: 'radians',
                rounding: 'thousandth',
                ranges: { angleDeg: [15, 345] },
              },
              explanation:
                'Multiply the degree angle θ by π / 180 ≈ 0.0174533 to express it in radians.',
              points: 15,
            },
          },
          {
            id: 'pc-u2-l1-s5',
            kind: 'synthesis',
            title: 'Radians Built From Arc Ratio',
            takeaways: [
              '1 radian sweeps an arc equal in length to 1 radius; 180° = π radians.',
              'Arc length s = rθ and sector area A = ½ r²θ require θ in radians.',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'speed-match', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u2-l1-fc1',
            front: 'Exact radian equivalents of 30°, 45°, 60°, and 90°',
            back: 'π/6, π/4, π/3, and π/2 radians.',
            explanation: 'Divide each degree measure by 180° and multiply by π.',
            interleave: true,
          },
          {
            id: 'pc-u2-l1-fc2',
            front: 'Arc length formula s and circular sector area A (when θ is in radians)',
            back: 's = rθ and A = (1/2) r² θ.',
            explanation: 'Both scale linearly as θ / (2π) fractions of full circumference 2πr and area πr².',
            interleave: true,
          },
          {
            id: 'pc-u2-l1-fc3',
            front: 'Approximate degree value of 1 radian',
            back: '180° / π ≈ 57.3°.',
            explanation: 'A little under an equilateral 60° angle because the curved arc is longer than a straight chord of length r.',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u2-l2',
        unitId: 'pc-u2',
        title: 'Sine & Cosine as Unit Circle Coordinates',
        summary:
          'Extend trigonometry past acute right triangles by defining (cos θ, sin θ) as the horizontal and vertical coordinates on the unit circle.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.HSF.TF.A.2', 'CCSS.MATH.HSF.TF.A.3'],
        prerequisiteLessonIds: ['pc-u2-l1'],
        visual: {
          kind: 'model-2d',
          modelId: 'unit-circle-wave-2d',
        },
        steps: [
          {
            id: 'pc-u2-l2-s1',
            kind: 'narrative',
            title: 'Beyond 90°: Coordinates Replace Triangle Sides',
            bodyMarkdown:
              'Inside a right triangle, $\\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}}$ only makes sense for $0^\\circ < \\theta < 90^\\circ$. Place the hypotenuse along a radius $r = 1$ centered at $(0,0)$, and suddenly the tip sits at **$(x, y) = (\\cos\\theta, \\sin\\theta)$** for **every** angle—even obtuse, negative, or multi-turn angles!\n\nBecause $(x, y)$ stays on the circle $x^2 + y^2 = 1$, the Pythagorean Identity **$\\cos^2\\theta + \\sin^2\\theta = 1$** holds everywhere automatically.',
            callout: {
              tone: 'key-idea',
              text: 'Cosine tracks horizontal projection (x); Sine tracks vertical height (y). In Quadrant II (90°–180°), x = cos θ < 0 while y = sin θ > 0.',
            },
          },
          {
            id: 'pc-u2-l2-s2',
            kind: 'predict-observe-explain',
            title: 'Watch Coordinates Project Into Waves',
            predictionPrompt:
              'As an angle rotates from θ = 90° to θ = 180° on the unit circle, how do cos θ and sin θ change?',
            predictionChoices: [
              'Both sin θ and cos θ stay positive',
              'cos θ drops from 0 to -1 while sin θ falls from 1 to 0',
              'cos θ climbs from 0 to +1 while sin θ goes to -1',
              'cos θ stays constant at 0',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'model-2d',
              modelId: 'unit-circle-wave-2d',
            },
            observeInstruction:
              'Sweep the angle through Quadrant II (90° to 180°) in the interactive 2D unit-circle visualizer and track both projections.',
            explainPrompt:
              'At which angles in [0°, 360°) does sin θ equal −1/2?',
            explainOptions: [
              '210° (Q III) and 330° (Q IV), where vertical height y sits at −1/2',
              '120° and 240°',
              '30° and 150°',
              'Only 270°',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Reference angle 30° gives |sin| = 1/2; negative vertical coordinate y = −1/2 lies 30° below the x-axis at 210° and 330°.',
          },
          {
            id: 'pc-u2-l2-s3',
            kind: 'worked-example',
            title: 'Using cos²θ + sin²θ = 1 With Quadrant Signs',
            problemMarkdown:
              'Suppose $\\cos\\theta = -\\frac{5}{13}$ and $\\theta$ terminates in **Quadrant III**. Find $\\sin\\theta$.',
            steps: [
              {
                label: 'Solve Pythagorean Identity for |sin θ|',
                expressionOrAction: '(-5/13)² + sin²θ = 1 -> sin²θ = 1 − 25/169 = 144/169 -> |sin θ| = 12/13.',
                whyNote: 'Do not pick the sign until checking which quadrant θ inhabits.',
              },
              {
                label: 'Apply Quadrant III sign rule',
                expressionOrAction: 'In Quadrant III, both x and y are negative -> sin θ = −12/13.',
                whyNote: 'Always double-check both x (cos) and y (sin) signs against the quadrant.',
              },
            ],
          },
          {
            id: 'pc-u2-l2-s4',
            kind: 'faded-practice',
            title: 'Evaluate Sine from the Unit Circle',
            promptMarkdown:
              'Read the vertical y-projection for angle θ on the unit circle (round to the nearest thousandth).',
            completedSteps: [
              'Step 1: Locate the angle θ around the circle to determine the sign of y = sin θ.',
              'Step 2: Compute sin(θ°).',
            ],
            fadedTarget: {
              type: 'figure',
              question: {
                type: 'figure',
                prompt:
                  'Determine sin(θ) for the angle shown on the unit circle (round to three decimal places).',
                figure: {
                  template: 'unit-circle',
                  givens: { angleDeg: 225 },
                  ask: 'sin',
                  rounding: 'thousandth',
                  ranges: { angleDeg: [15, 345] },
                },
                explanation:
                  'Sine equals the vertical coordinate y on the unit circle: negative below the x-axis (180°–360°) and positive above (0°–180°).',
                points: 15,
              },
            },
          },
          {
            id: 'pc-u2-l2-s5',
            kind: 'synthesis',
            title: 'Coordinates Define All Angles',
            takeaways: [
              'On the unit circle, (x, y) = (cos θ, sin θ) holds for every real angle θ.',
              'Pythagorean identity cos²θ + sin²θ = 1 plus quadrant sign resolves any missing ratio.',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'sim-sandbox', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u2-l2-fc1',
            front: 'Exact coordinates (cos θ, sin θ) at 0°, 90°, 180°, 270°',
            back: '0°: (1, 0); 90°: (0, 1); 180°: (−1, 0); 270°: (0, −1).',
            explanation: 'Axis intercepts on the unit circle of radius 1.',
            interleave: true,
          },
          {
            id: 'pc-u2-l2-fc2',
            front: 'Which trig functions are positive in Quadrants I, II, III, IV?',
            back: 'QI: All; QII: sin; QIII: tan; QIV: cos (plus their reciprocals).',
            explanation: 'Follows directly from signs of x = cos θ, y = sin θ, and y/x = tan θ.',
            interleave: true,
          },
          {
            id: 'pc-u2-l2-fc3',
            front: 'Exact values of cos(π/6) and sin(π/6)',
            back: 'cos(π/6) = sqrt(3)/2 ≈ 0.866; sin(π/6) = 1/2 = 0.5.',
            explanation: 'From the 30°-60°-90° triangle of hypotenuse 1.',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u2-l3',
        unitId: 'pc-u2',
        title: 'Amplitude, Period, Phase Shift & Wave Interference',
        summary:
          'Decode the parameters of A sin(B(x − C)) + D and connect periodic phase difference to wave interference.',
        estimatedMinutes: 10,
        standards: ['CCSS.MATH.HSF.TF.B.5'],
        prerequisiteLessonIds: ['pc-u2-l2'],
        visual: {
          kind: 'model-2d',
          modelId: 'unit-circle-wave-2d',
        },
        steps: [
          {
            id: 'pc-u2-l3-s1',
            kind: 'narrative',
            title: 'Unrolling Rotation Into Oscillations',
            bodyMarkdown:
              'Graphing $y = A \\sin(B(x - C)) + D$ turns circular motion into a horizontal wave:\n- **$|A|$ (Amplitude):** half the distance from trough to peak.\n- **$T = \\frac{2\\pi}{|B|}$ (Period):** horizontal length of one complete cycle—larger $B$ compresses waves tightly!\n- **$C$ (Phase shift):** horizontal shift once $B$ is factored out.\n- **$D$ (Midline):** vertical center around which the wave oscillates.',
            callout: {
              tone: 'pitfall',
              text: 'Always factor B out of Bx − K before reading phase shift! In sin(2x − π) = sin(2(x − π/2)), the phase shift is +π/2, NOT +π.',
            },
          },
          {
            id: 'pc-u2-l3-s2',
            kind: 'predict-observe-explain',
            title: 'Connect Wave Superposition to Phase Offset',
            predictionPrompt:
              'Two identical sine waves of wavelength λ reach a screen slightly out of step. When their path difference equals half a wavelength (phase shift π radians), what happens?',
            predictionChoices: [
              'Amplitude doubles (constructive peak)',
              'Crests meet troughs and cancel to zero amplitude (destructive interference)',
              'Period doubles to 2λ',
              'Frequency drops to zero everywhere',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'model-3d',
              modelId: 'wave-optics',
              initialParams: { showEnvelope: true },
              highlightHotspots: ['slits', 'central-max', 'envelope'],
            },
            observeInstruction:
              'Examine the dark destructive interference fringes alternating with bright maxima in the 3D Double-Slit Wave Optics lab.',
            explainPrompt: 'What identity proves sin(θ) + sin(θ + π) cancels identically to 0?',
            explainOptions: [
              'Shifting a sine wave by half a period (π) negates it: sin(θ + π) = −sin(θ)',
              'Because sin(π) = 1',
              'Because period becomes negative',
              'Because amplitudes divide instead of adding',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Half-cycle shift π turns every crest (+A) into an opposite trough (−A), producing exact cancellation at destructive fringes.',
          },
          {
            id: 'pc-u2-l3-s3',
            kind: 'worked-example',
            title: 'Extracting All Four Parameters From a Wave Equation',
            problemMarkdown:
              'Identify amplitude, period, phase shift, and midline for $y = -3\\cos\\left(4x + \\pi\\right) + 5$.',
            steps: [
              {
                label: 'Factor B = 4 inside the cosine argument',
                expressionOrAction: '4x + π = 4(x + π/4) = 4(x − (−π/4))',
                whyNote: 'Reveals true horizontal shift C = −π/4 (π/4 units LEFT).',
              },
              {
                label: 'Read amplitude |A| and vertical midline D',
                expressionOrAction: 'Amplitude = |−3| = 3 (reflected); Midline y = 5; Range [2, 8].',
                whyNote: 'Amplitude is always non-negative; the minus sign flips peaks/troughs.',
              },
              {
                label: 'Compute period T = 2π / |B|',
                expressionOrAction: 'T = 2π / 4 = π/2.',
                whyNote: 'B = 4 completes 4 cycles across 2π, shrinking each cycle to π/2.',
              },
            ],
          },
          {
            id: 'pc-u2-l3-s4',
            kind: 'checkpoint',
            title: 'Identify Sinusoidal Tide Parameters',
            question: {
              type: 'mcq',
              prompt:
                'A tide rises smoothly from a low of 1.2 m to a high of 5.8 m every 12 hours. What are the amplitude A and midline D of its sinusoidal model?',
              options: [
                'A = 2.3 m, D = 3.5 m',
                'A = 4.6 m, D = 3.5 m',
                'A = 3.5 m, D = 2.3 m',
                'A = 2.3 m, D = 1.2 m',
              ],
              correct: 0,
              explanation:
                'Midline D = (Max + Min)/2 = (5.8 + 1.2)/2 = 3.5 m; Amplitude A = (Max − Min)/2 = (5.8 − 1.2)/2 = 2.3 m.',
              points: 10,
            },
          },
          {
            id: 'pc-u2-l3-s5',
            kind: 'synthesis',
            title: 'Sinusoidal Modeling Takeaways',
            takeaways: [
              'Amplitude = (Max − Min)/2; Midline = (Max + Min)/2; Period T = 2π/|B|.',
              'Always factor B out before reading phase shift C, and link half-period shifts (π) to destructive cancellation.',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'certainty-vault', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u2-l3-fc1',
            front: 'Period formula for y = A sin(Bx) or y = A cos(Bx)',
            back: 'T = 2π / |B| (whereas tangent y = A tan(Bx) has period π / |B|).',
            explanation: 'One cosine/sine cycle fills 2π radians; tangent repeats every π radians.',
            interleave: true,
          },
          {
            id: 'pc-u2-l3-fc2',
            front: 'Why must B be factored out of (Bx − K) to find phase shift?',
            back: 'Writing B(x − K/B) shows that x − K/B = 0 occurs at x = K/B, not K.',
            explanation: 'Both scaling B and translation occur along x, so factoring separates their order.',
            interleave: true,
          },
          {
            id: 'pc-u2-l3-fc3',
            front: 'Amplitude and Midline formulas from observed Max and Min',
            back: 'Amplitude A = (Max − Min)/2; Midline D = (Max + Min)/2.',
            explanation: 'Max = D + A and Min = D − A.',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u2-l4',
        unitId: 'pc-u2',
        title: 'Tangent Asymptotes & Exact Trig Identities',
        summary:
          'Understand tan θ = sin θ / cos θ geometrically as terminal slope and verify core trig identities.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.HSF.TF.C.8'],
        prerequisiteLessonIds: ['pc-u2-l2'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'unit-circle',
            givens: { angleDeg: 45 },
            ask: 'tan',
            rounding: 'thousandth',
            ranges: { angleDeg: [15, 75] },
          },
        },
        steps: [
          {
            id: 'pc-u2-l4-s1',
            kind: 'narrative',
            title: 'Tangent Is the Slope of the Angle Ray',
            bodyMarkdown:
              'Since a unit-circle radius runs from $(0, 0)$ to $(\\cos\\theta, \\sin\\theta)$, the slope of that terminal ray is $\\frac{\\Delta y}{\\Delta x} = \\frac{\\sin\\theta}{\\cos\\theta} = \\tan\\theta$.\n\nWhenever the ray points straight up ($90^\\circ$) or straight down ($270^\\circ$), $\\cos\\theta = 0$ and the ray is vertical—producing **vertical asymptotes** where $\\tan\\theta$ shoots toward $\\pm\\infty$ and repeats every $\\pi$ radians ($180^\\circ$). Dividing $\\cos^2\\theta + \\sin^2\\theta = 1$ by $\\cos^2\\theta$ immediately yields **$1 + \\tan^2\\theta = \\sec^2\\theta$**.',
            callout: {
              tone: 'pitfall',
              text: 'Never divide an equation by cos θ or sin θ without separately checking whether solutions lie where that factor equals zero!',
            },
          },
          {
            id: 'pc-u2-l4-s2',
            kind: 'predict-observe-explain',
            title: 'Observe Tangent Steepness Approaching 90°',
            predictionPrompt:
              'As angle θ rises from 30° toward 85°, how does tan θ behave relative to sin θ?',
            predictionChoices: [
              'Both tan θ and sin θ stay bounded between −1 and +1',
              'sin θ stays ≤ 1 while tan θ grows past 1 without upper bound',
              'tan θ decreases toward 0 as cos θ shrinks',
              'tan θ equals 1 everywhere above 45°',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'unit-circle',
                givens: { angleDeg: 60 },
                ask: 'tan',
                rounding: 'thousandth',
              },
            },
            observeInstruction:
              'Inspect the slope of the terminal ray at 60° where x = cos 60° = 0.5 and y = sin 60° ≈ 0.866.',
            explainPrompt: 'Why can tan θ exceed 1 while sin θ and cos θ never do?',
            explainOptions: [
              'For 45° < θ < 90°, vertical y exceeds horizontal x, so ratio y/x > 1 and diverges as x → 0',
              'Because the hypotenuse grows longer than 1',
              'Because tangent adds sin θ + cos θ',
              'Because radius becomes negative',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Unlike sin θ and cos θ (legs over hypotenuse 1), tan θ = y/x divides two legs whose ratio explodes when x approaches zero.',
          },
          {
            id: 'pc-u2-l4-s3',
            kind: 'branching-scenario',
            title: 'Resolve an Inverse-Trig Quadrant Ambiguity',
            startNodeId: 'inv',
            nodes: {
              inv: {
                promptMarkdown:
                  'A student wants ALL angles in $[0^\\circ, 360^\\circ)$ satisfying $\\tan\\theta = -1$. Typing `arctan(-1)` returns **$-45^\\circ$**. What should you do next?',
                choices: [
                  {
                    label: 'Adjust −45° into Quadrant IV (315°) AND add 180° for Quadrant II (135°)',
                    nextNodeId: 'verify-signs',
                    feedback:
                      'Yes! Tangent has period 180°, so valid solutions in [0°, 360°) sit 180° apart at 135° and 315°.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Just take +45° by dropping the negative sign',
                    nextNodeId: 'inv',
                    feedback:
                      'Wait: tan(+45°) = +1, not −1! You must place the terminal ray in Quadrants II or IV where x and y have opposite signs.',
                    outcome: 'suboptimal',
                  },
                ],
              },
              'verify-signs': {
                promptMarkdown:
                  'Check if both 135° and 315° satisfy sin θ / cos θ = −1.',
                choices: [
                  {
                    label: 'At 135°: (+√2/2)/(−√2/2) = −1; at 315°: (−√2/2)/(+√2/2) = −1. Both match!',
                    nextNodeId: null,
                    feedback: 'Verified! Both quadrants produce ratio −1 cleanly.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Only 135° works because sine must stay positive',
                    nextNodeId: null,
                    feedback: 'Both work: in Q IV negative sin over positive cos also gives −1.',
                    outcome: 'suboptimal',
                  },
                ],
              },
            },
          },
          {
            id: 'pc-u2-l4-s4',
            kind: 'checkpoint',
            title: 'Dynamic Quadrant-I Tangent Value',
            question: {
              type: 'figure',
              prompt:
                'Compute tan(θ) for the angle shown on the unit circle (round to three decimal places).',
              figure: {
                template: 'unit-circle',
                givens: { angleDeg: 35 },
                ask: 'tan',
                rounding: 'thousandth',
                ranges: { angleDeg: [15, 75] },
              },
              explanation:
                'Calculate tan(θ°) = sin(θ°) / cos(θ°), which equals the slope of the terminal ray.',
              points: 15,
            },
          },
          {
            id: 'pc-u2-l4-s5',
            kind: 'synthesis',
            title: 'Unit 2 Complete: Circular Trigonometry',
            takeaways: [
              'tan θ = sin θ / cos θ represents terminal-ray slope, with period π and asymptotes where cos θ = 0.',
              'Pythagorean twins: cos²θ + sin²θ = 1 and 1 + tan²θ = sec²θ.',
            ],
            nextQuizIndex: 1,
            arcadeLaunch: { mode: 'diagram-scout', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u2-l4-fc1',
            front: 'Where are the vertical asymptotes of y = tan θ?',
            back: 'At odd multiples of π/2 (90°, 270°, ...), where cos θ = 0.',
            explanation: 'Division by zero sends |sin θ / cos θ| → ∞.',
            interleave: true,
          },
          {
            id: 'pc-u2-l4-fc2',
            front: 'Derive 1 + tan²θ = sec²θ in one line',
            back: 'Divide cos²θ + sin²θ = 1 through by cos²θ (where cos θ ≠ 0).',
            explanation: 'Similarly, dividing by sin²θ yields cot²θ + 1 = csc²θ.',
            interleave: true,
          },
          {
            id: 'pc-u2-l4-fc3',
            front: 'Principal range returned by arcsin, arccos, and arctan',
            back: 'arcsin & arctan: [−π/2, π/2] (Q IV/I); arccos: [0, π] (Q I/II).',
            explanation: 'Calculator inverse trig only outputs one principal branch; use symmetry for all circle solutions.',
            interleave: true,
          },
        ],
      },
    ],
  },
  {
    id: 'pc-u3',
    title: 'Vectors, Dot Products & Oblique Triangles',
    anchoringPhenomenon:
      'Crosswinds push aircraft off heading while surveying baselines triangulate unreachable mountain peaks through vector sums and laws of sines and cosines.',
    capstoneQuizIndex: 2,
    masteryGate: {
      policy: 'soft-recommended',
      minLessonCompletion: true,
      minQuizAccuracyPct: 80,
    },
    lessons: [
      {
        id: 'pc-u3-l1',
        unitId: 'pc-u3',
        title: '2D Vectors, Component Form & Resultants',
        summary:
          'Add multi-direction forces or velocities cleanly by splitting each vector into horizontal and vertical components.',
        estimatedMinutes: 8,
        standards: ['CCSS.MATH.HSN.VM.A.1', 'CCSS.MATH.HSN.VM.B.4'],
        prerequisiteLessonIds: ['pc-u2-l2'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'vector-2d',
            givens: { ux: 5, uy: 3, vx: 1, vy: 5 },
            ask: 'resultantMag',
            rounding: 'hundredth',
            ranges: { ux: [1, 10], uy: [-6, 8], vx: [1, 10], vy: [-6, 8] },
          },
        },
        steps: [
          {
            id: 'pc-u3-l1-s1',
            kind: 'narrative',
            title: 'Why Vector Magnitudes Never Simply Add',
            bodyMarkdown:
              'A river current of **3 m/s east** combined with a boat heading **4 m/s north** does NOT move at 7 m/s! Because they act at right angles, the combined velocity vector is $\\mathbf{u} + \\mathbf{v} = \\langle 3 + 0, 0 + 4 \\rangle = \\langle 3, 4 \\rangle$, with net speed $\\|\\mathbf{u} + \\mathbf{v}\\| = \\sqrt{3^2 + 4^2} = 5\\text{ m/s}$.\n\nAlways add **x-components with x-components** and **y-components with y-components** first, then compute magnitude or direction at the very end.',
            callout: {
              tone: 'key-idea',
              text: 'Convert magnitude r and direction θ to components using ⟨r cos θ, r sin θ⟩ before summing multiple vectors.',
            },
          },
          {
            id: 'pc-u3-l1-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Tip-to-Tail Resultant Length',
            predictionPrompt:
              'Vectors u = ⟨5, 3⟩ and v = ⟨1, 5⟩ combine. What are the components of u + v and its magnitude?',
            predictionChoices: [
              '⟨6, 8⟩ with resultant magnitude 10',
              '⟨4, −2⟩ with magnitude sqrt(20)',
              '⟨5, 15⟩ with magnitude sqrt(250)',
              'Sum of magnitudes: sqrt(34) + sqrt(26)',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'vector-2d',
                givens: { ux: 5, uy: 3, vx: 1, vy: 5 },
                ask: 'resultantMag',
                rounding: 'hundredth',
              },
            },
            observeInstruction:
              'Verify the dashed parallelogram diagonal in the 2D vector diagram running from the origin to (ux + vx, uy + vy).',
            explainPrompt: 'When can ||u + v|| equal ||u|| + ||v|| exactly?',
            explainOptions: [
              'Only when u and v point in the exact same direction (0° between them)',
              'Only when u and v are perpendicular (90°)',
              'Never under any circumstances',
              'Whenever u and v have equal lengths',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Adding components yields ⟨6, 8⟩ -> sqrt(6² + 8²) = 10. Only aligned same-direction vectors reach the triangle-inequality maximum ||u|| + ||v||.',
          },
          {
            id: 'pc-u3-l1-s3',
            kind: 'worked-example',
            title: 'Converting Bearing & Speed Into Components',
            problemMarkdown:
              'A drone flies at **20 m/s** oriented **$60^\\circ$ above the +x axis** against a headwind $\\mathbf{w} = \\langle -4, 0 \\rangle$. Find groundspeed.',
            steps: [
              {
                label: 'Resolve drone airspeed into components',
                expressionOrAction: 'd = ⟨20 cos 60°, 20 sin 60°⟩ = ⟨10, 10√3⟩ ≈ ⟨10, 17.32⟩',
                whyNote: 'cos gives horizontal projection; sin gives vertical projection.',
              },
              {
                label: 'Add wind components',
                expressionOrAction: 'g = ⟨10 − 4, 17.32 + 0⟩ = ⟨6, 17.32⟩',
                whyNote: 'Headwind directly subtracts from the x-component.',
              },
              {
                label: 'Compute net groundspeed',
                expressionOrAction: '||g|| = sqrt(6² + 17.32²) = sqrt(36 + 300) = sqrt(336) ≈ 18.33 m/s',
                whyNote: 'Compute magnitude last from net components.',
              },
            ],
          },
          {
            id: 'pc-u3-l1-s4',
            kind: 'checkpoint',
            title: 'Dynamic 2D Vector Resultant Magnitude',
            question: {
              type: 'figure',
              prompt:
                'Calculate the magnitude ||u + v|| of the resultant vector shown in the figure (to the nearest hundredth).',
              figure: {
                template: 'vector-2d',
                givens: { ux: 4, uy: -2, vx: 2, vy: 10 },
                ask: 'resultantMag',
                rounding: 'hundredth',
                ranges: { ux: [-8, 8], uy: [-8, 8], vx: [-8, 8], vy: [-8, 8] },
              },
              explanation:
                'Add x and y components separately: rx = ux + vx, ry = uy + vy, then compute sqrt(rx² + ry²).',
              points: 15,
            },
          },
          {
            id: 'pc-u3-l1-s5',
            kind: 'synthesis',
            title: 'Component Arithmetic Mastery',
            takeaways: [
              'Never add scalar magnitudes directly unless vectors point in the exact same direction.',
              'Vector addition u + v = ⟨uₓ + vₓ, u_y + v_y⟩ is tip-to-tail geometric concatenation.',
            ],
            nextQuizIndex: 2,
            arcadeLaunch: { mode: 'diagram-scout', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u3-l1-fc1',
            front: 'How do you normalize a nonzero vector v into a unit vector û?',
            back: 'û = v / ||v|| = ⟨v_x / ||v||, v_y / ||v||⟩, giving magnitude 1 in the same direction.',
            explanation: 'Dividing by its own Euclidean norm scales length to 1 without changing direction.',
            interleave: true,
          },
          {
            id: 'pc-u3-l1-fc2',
            front: 'Components of a vector with magnitude M at counterclockwise angle θ from +x axis',
            back: '⟨M cos θ, M sin θ⟩.',
            explanation: 'Directly projects hypotenuse M onto horizontal and vertical axes.',
            interleave: true,
          },
          {
            id: 'pc-u3-l1-fc3',
            front: 'Triangle Inequality for Vectors',
            back: '||u + v|| ≤ ||u|| + ||v||, with equality only when u and v share the same direction.',
            explanation: 'Opposite directions minimize resultant magnitude to | ||u|| − ||v|| |.',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u3-l2',
        unitId: 'pc-u3',
        title: 'The Dot Product, Projection & Orthogonality',
        summary:
          'Measure directional alignment between two vectors with u·v = uₓvₓ + u_yv_y and recover exact angles.',
        estimatedMinutes: 9,
        standards: ['CCSS.MATH.HSN.VM.A.1', 'CCSS.MATH.HSN.VM.B.4'],
        prerequisiteLessonIds: ['pc-u3-l1'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'vector-2d',
            givens: { ux: 6, uy: 2, vx: -1, vy: 3 },
            ask: 'dotProduct',
            rounding: 'tenth',
            ranges: { ux: [2, 10], uy: [-8, 8], vx: [-10, -2], vy: [-8, 8] },
          },
        },
        steps: [
          {
            id: 'pc-u3-l2-s1',
            kind: 'narrative',
            title: 'One Number That Measures Alignment',
            bodyMarkdown:
              'Unlike vector addition, the **dot product** outputs a single **scalar**: $\\mathbf{u}\\cdot\\mathbf{v} = u_x v_x + u_y v_y = \\|\\mathbf{u}\\|\\,\\|\\mathbf{v}\\|\\cos\\theta$.\n\nLook at what its sign reveals instantly:\n- **$\\mathbf{u}\\cdot\\mathbf{v} > 0$:** acute angle ($< 90^\\circ$, pointing generally together).\n- **$\\mathbf{u}\\cdot\\mathbf{v} = 0$:** perpendicular / **orthogonal** ($90^\\circ$).\n- **$\\mathbf{u}\\cdot\\mathbf{v} < 0$:** obtuse angle ($> 90^\\circ$, opposing directions).',
            callout: {
              tone: 'key-idea',
              text: 'Orthogonality test takes 2 seconds: u and v are perpendicular iff uₓvₓ + u_yv_y = 0.',
            },
          },
          {
            id: 'pc-u3-l2-s2',
            kind: 'predict-observe-explain',
            title: 'Spot Perpendicular Vectors Without a Protractor',
            predictionPrompt:
              'Vectors u = ⟨6, 2⟩ and v = ⟨−1, 3⟩ have dot product 6(−1) + 2(3). What does that tell you about the angle between them?',
            predictionChoices: [
              'They point in opposite directions (180°)',
              'The dot product equals 0, so they meet at exactly 90°',
              'They are acute (45°)',
              'One vector must have length zero',
            ],
            correctPredictionIndex: 1,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'vector-2d',
                givens: { ux: 6, uy: 2, vx: -1, vy: 3 },
                ask: 'angleBetween',
                rounding: 'tenth',
              },
            },
            observeInstruction:
              'Inspect the angle formed between u = ⟨6, 2⟩ (slope 1/3) and v = ⟨−1, 3⟩ (slope −3) on the coordinate diagram.',
            explainPrompt: 'Why do negative-reciprocal slopes (1/3 and −3) produce u·v = 0?',
            explainOptions: [
              'Writing ⟨a, b⟩ and ⟨−b, a⟩ makes u·v = −ab + ab = 0, encoding 90° rotation',
              'Because −1 + 3 = 2',
              'Because both vectors have identical lengths',
              'Because cosine of 0° is zero',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Swapping components and negating one gives an orthogonal vector whose slope is −a/b (negative reciprocal of b/a) and dot product is identically 0.',
          },
          {
            id: 'pc-u3-l2-s3',
            kind: 'worked-example',
            title: 'Finding the Exact Angle Between Two Non-Orthogonal Vectors',
            problemMarkdown: 'Find the angle $\\theta$ between $\\mathbf{u} = \\langle 3, 4 \\rangle$ and $\\mathbf{v} = \\langle 5, -12 \\rangle$.',
            steps: [
              {
                label: 'Compute dot product and both magnitudes',
                expressionOrAction: 'u·v = 3(5) + 4(−12) = 15 − 48 = −33;  ||u|| = 5;  ||v|| = 13.',
                whyNote: '3-4-5 and 5-12-13 triangles keep denominator arithmetic clean!',
              },
              {
                label: 'Solve for cos θ and invert with arccos',
                expressionOrAction: 'cos θ = −33 / (5 × 13) = −33 / 65 ≈ −0.5077 -> θ = arccos(−33/65) ≈ 120.5°.',
                whyNote: 'Because u·v < 0, the angle is obtuse (> 90°), confirmed by arccos.',
              },
            ],
          },
          {
            id: 'pc-u3-l2-s4',
            kind: 'faded-practice',
            title: 'Dynamic Angle Between Two 2D Vectors',
            promptMarkdown:
              'Use u·v and ||u|| ||v|| on the displayed pair of vectors to find the angle between them in degrees (round to tenths).',
            completedSteps: [
              'Step 1: Compute u·v = ux·vx + uy·vy and magnitudes ||u||, ||v||.',
              'Step 2: Evaluate arccos((u·v) / (||u||·||v||)) in degrees.',
            ],
            fadedTarget: {
              type: 'figure',
              question: {
                type: 'figure',
                prompt:
                  'Find the angle (in degrees, 0° to 180°) between vectors u and v shown in the figure (round to tenths).',
                figure: {
                  template: 'vector-2d',
                  givens: { ux: 4, uy: 3, vx: -5, vy: 2 },
                  ask: 'angleBetween',
                  rounding: 'tenth',
                  ranges: { ux: [2, 10], uy: [-8, 8], vx: [-10, -2], vy: [-8, 8] },
                },
                explanation:
                  'Use cos θ = (ux·vx + uy·vy) / (sqrt(ux²+uy²) · sqrt(vx²+vy²)), then apply arccos in degrees.',
                points: 15,
              },
            },
          },
          {
            id: 'pc-u3-l2-s5',
            kind: 'synthesis',
            title: 'Dot Product Insights',
            takeaways: [
              'u·v = uₓvₓ + u_yv_y = ||u|| ||v|| cos θ links algebra directly to angle.',
              'Zero dot product is the universal algebraic test for perpendicularity.',
            ],
            nextQuizIndex: 2,
            arcadeLaunch: { mode: 'streak-siege', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u3-l2-fc1',
            front: 'Geometric vs algebraic formulas for the 2D dot product u·v',
            back: 'Algebraic: u_x v_x + u_y v_y. Geometric: ||u|| ||v|| cos θ.',
            explanation: 'Equating the two gives cos θ = (u·v) / (||u|| ||v||).',
            interleave: true,
          },
          {
            id: 'pc-u3-l2-fc2',
            front: 'What does u·v < 0 indicate about the angle between u and v?',
            back: 'The angle is obtuse (90° < θ ≤ 180°).',
            explanation: 'Cosine is negative strictly in Quadrant II (90° to 180°).',
            interleave: true,
          },
          {
            id: 'pc-u3-l2-fc3',
            front: 'How do you quickly construct a vector perpendicular to ⟨a, b⟩?',
            back: 'Swap components and negate one: ⟨−b, a⟩ or ⟨b, −a⟩.',
            explanation: 'Check dot product: a(−b) + b(a) = 0.',
            interleave: true,
          },
        ],
      },
      {
        id: 'pc-u3-l3',
        unitId: 'pc-u3',
        title: 'Laws of Sines & Cosines in Oblique Navigation',
        summary:
          'Generalize right-triangle trigonometry to arbitrary triangles across SAS, SSS, and ASA surveying configurations.',
        estimatedMinutes: 10,
        standards: ['CCSS.MATH.HSG.SRT.D.10', 'CCSS.MATH.HSG.SRT.D.11'],
        prerequisiteLessonIds: ['pc-u2-l2', 'pc-u3-l2'],
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'triangle-sas',
            givens: { b: 10, c: 14, angleA: 62 },
            ask: 'a',
            rounding: 'hundredth',
            ranges: { b: [6, 16], c: [7, 18], angleA: [30, 120] },
          },
        },
        steps: [
          {
            id: 'pc-u3-l3-s1',
            kind: 'narrative',
            title: 'Extending Pythagoras With One Correction Term',
            bodyMarkdown:
              'When angle $A = 90^\\circ$, $\\cos 90^\\circ = 0$ and the Pythagorean theorem says $a^2 = b^2 + c^2$. Tilt angle $A$ **acute** ($< 90^\\circ$, $\\cos A > 0$) and opposite side $a$ shrinks; tilt $A$ **obtuse** ($> 90^\\circ$, $\\cos A < 0$) and side $a$ stretches.\n\nThe **Law of Cosines** measures that exact tilt: **$a^2 = b^2 + c^2 - 2bc\\cos A$**. Notice how it solves **SAS** (two sides and the included angle) and **SSS** (solve for $\\cos A$ directly), whereas **ASA** pairs cleanly with the **Law of Sines** $\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}$.',
            callout: {
              tone: 'key-idea',
              text: 'Use Law of Cosines for SAS and SSS (no ambiguous arccos sign!); use Law of Sines when an angle and its opposite side are both known (ASA / AAS).',
            },
          },
          {
            id: 'pc-u3-l3-s2',
            kind: 'predict-observe-explain',
            title: 'Predict Side Length Relative to a 90° Benchmark',
            predictionPrompt:
              'Two sides measure b = 10 and c = 14 with included angle A = 62°. Compared to the right-triangle length sqrt(10² + 14²) ≈ 17.20, opposite side a will be:',
            predictionChoices: [
              'Shorter than 17.20, because angle A < 90° pulls the tips closer (cos 62° > 0)',
              'Longer than 17.20',
              'Equal to 17.20',
              'Equal to 14 − 10 = 4',
            ],
            correctPredictionIndex: 0,
            visual: {
              kind: 'figure-2d',
              figure: {
                template: 'triangle-sas',
                givens: { b: 10, c: 14, angleA: 62 },
                ask: 'a',
                rounding: 'hundredth',
              },
            },
            observeInstruction:
              'Inspect the acute 62° vertex between b = 10 and c = 14 in the SAS diagram.',
            explainPrompt: 'What calculation gives exact side a for b = 10, c = 14, A = 62°?',
            explainOptions: [
              'sqrt(10² + 14² − 2(10)(14) cos 62°) ≈ 12.83',
              'sqrt(10² + 14² + 2(10)(14) cos 62°)',
              '10 + 14 − 2 cos 62°',
              '(10 · 14 · sin 62°) / 2',
            ],
            correctExplainIndex: 0,
            reconcileFeedback:
              'Subtracting 2bc cos(62°) ≈ 131.45 from 296 leaves 164.55, whose square root is 12.83 < 17.20.',
          },
          {
            id: 'pc-u3-l3-s3',
            kind: 'branching-scenario',
            title: 'Select Law of Sines vs Law of Cosines',
            startNodeId: 'choose-law',
            nodes: {
              'choose-law': {
                promptMarkdown:
                  'Case 1: You have sides $a = 8, b = 10, c = 13$ (SSS) and need the **largest angle C**. Case 2: You know $A = 40^\\circ, C = 65^\\circ, b = 20$ (ASA). Pick the cleanest workflow.',
                choices: [
                  {
                    label: 'Case 1 -> Law of Cosines for C; Case 2 -> find B = 75°, then Law of Sines',
                    nextNodeId: 'check-sss',
                    feedback:
                      'Optimal! Solving for the largest angle FIRST via Law of Cosines also avoids any obtuse-angle ambiguity with Law of Sines later.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Case 1 -> Law of Sines directly',
                    nextNodeId: 'choose-law',
                    feedback:
                      'Wait: in SSS no angle is given at all, so Law of Sines has two unknowns per ratio. Start with Law of Cosines.',
                    outcome: 'suboptimal',
                  },
                ],
              },
              'check-sss': {
                promptMarkdown:
                  'In Case 1 (8, 10, 13), since 8² + 10² = 164 < 13² = 169, will angle C across from 13 be acute, right, or obtuse?',
                choices: [
                  {
                    label: 'Obtuse (> 90°), because 164 − 169 < 0 forces cos C < 0',
                    nextNodeId: null,
                    feedback: 'Exact! cos C = (164 − 169) / (2·8·10) = −5/160 < 0 -> C ≈ 91.8°.',
                    outcome: 'optimal',
                  },
                  {
                    label: 'Acute (< 90°)',
                    nextNodeId: null,
                    feedback: 'When c² > a² + b², the angle opposite c opens wider than 90°.',
                    outcome: 'suboptimal',
                  },
                ],
              },
            },
          },
          {
            id: 'pc-u3-l3-s4',
            kind: 'checkpoint',
            title: 'Dynamic Law of Cosines Problem (SAS)',
            question: {
              type: 'figure',
              prompt:
                'Using sides b, c and included angle A in the diagram, solve for side a (round to hundredths).',
              figure: {
                template: 'triangle-sas',
                givens: { b: 9, c: 12, angleA: 54 },
                ask: 'a',
                rounding: 'hundredth',
                ranges: { b: [6, 16], c: [7, 18], angleA: [30, 120] },
              },
              explanation:
                'Apply Law of Cosines: a = sqrt(b² + c² − 2bc cos A) with angle A in degrees.',
              points: 15,
            },
          },
          {
            id: 'pc-u3-l3-s5',
            kind: 'synthesis',
            title: 'Precalculus Track Capstone Ready',
            takeaways: [
              'Law of Cosines a² = b² + c² − 2bc cos A unlocks SAS and SSS triangles and distinguishes acute vs obtuse angles unambiguously.',
              'Law of Sines pairs each side with sin(opposite angle) for ASA/AAS triangles; triangle area = ½ bc sin A.',
            ],
            nextQuizIndex: 2,
            arcadeLaunch: { mode: 'boss-raid', packId: 'precalculus-trigonometry' },
            flashcardEnroll: { autoEnroll: true, interleave: true },
          },
        ],
        flashcardSeeds: [
          {
            id: 'pc-u3-l3-fc1',
            front: 'Law of Cosines solving for side a vs solving for angle A',
            back: 'Side: a² = b² + c² − 2bc cos A. Angle: cos A = (b² + c² − a²) / (2bc).',
            explanation: 'In SSS, solve the largest angle first so any obtuse angle shows up immediately as cos < 0.',
            interleave: true,
          },
          {
            id: 'pc-u3-l3-fc2',
            front: 'Trigonometric area formula for SAS triangles',
            back: 'Area = (1/2) b c sin A.',
            explanation: 'Since height h = b sin A relative to base c, area equals (1/2) × base × height.',
            interleave: true,
          },
          {
            id: 'pc-u3-l3-fc3',
            front: 'How does Law of Cosines connect to the vector dot product?',
            back: 'For side vector a = u − v, ||u − v||² = ||u||² + ||v||² − 2(u·v) = b² + c² − 2bc cos A.',
            explanation: 'The dot product’s geometric formula IS the Law of Cosines in vector notation!',
            interleave: true,
          },
        ],
      },
    ],
  },
]

const QUANT_TRACK: CurriculumTrack = {
  id: 'track-quantitative-foundations',
  slug: 'quantitative-foundations',
  packId: 'quantitative-foundations',
  title: 'Quantitative Foundations & Pre-Algebra',
  category: 'Math',
  subject: 'Quantitative Foundations',
  gradeBand: 'MS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: QUANT_UNITS,
}

const PRECALC_TRACK: CurriculumTrack = {
  id: 'track-precalculus-trigonometry',
  slug: 'precalculus-trigonometry',
  packId: 'precalculus-trigonometry',
  title: 'Precalculus, Trigonometry & Vectors',
  category: 'Math',
  subject: 'Precalculus & Trigonometry',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-algebra-linear-systems', 'track-geometry-figures'],
  srsInterleaveDefault: true,
  units: PRECALC_UNITS,
}

export const TIER1_STEM_PACKS: ContentPack[] = [
  {
    id: 'quantitative-foundations',
    name: 'Quantitative Foundations & Pre-Algebra',
    description:
      'Ratios, proportional rates, percent multipliers, signed arithmetic, coordinate geometry, balance equations, and planar area.',
    subject: 'Quantitative Foundations',
    category: 'Math',
    icon: '🧮',
    modelId: 'quantitative-ratio-balance-2d',
    relatedModelIds: ['linear-transform-eigen-2d'],
    standards: 'Common Core 6.RP · 7.RP · 7.NS · 7.EE · 7.G · 8.EE',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'MS',
    prerequisitePackIds: [],
    track: QUANT_TRACK,
    units: QUANT_UNITS,
    quizzes: [
      {
        title: 'Unit 1: Proportional Reasoning, Slope & Percentages',
        description: 'Unit rates, equivalent scaling, linear slopes, and successive percent multipliers.',
        subject: 'Quantitative Foundations',
        difficulty: 'easy',
        timeLimitSec: 1080,
        srsInterleave: true,
        lessonId: 'qf-u1-l3',
        modelId: 'quantitative-ratio-balance-2d',
        questions: [
          {
            type: 'mcq',
            prompt:
              'A teal paint blend uses 4 parts blue to 6 parts white. Which mixture produces the exact same shade?',
            options: [
              '6 parts blue to 8 parts white (add 2 to both)',
              '10 parts blue to 15 parts white (multiply both by 2.5)',
              '8 parts blue to 10 parts white (keep difference equal to 2)',
              '2 parts blue to 4 parts white (subtract 2 from both)',
            ],
            correct: 1,
            explanation:
              'Equivalent ratios preserve their quotient: 4/6 = 2/3, and 10/15 = 2/3. Adding or subtracting a constant shifts the ratio.',
            points: 10,
          },
          {
            type: 'fill',
            prompt: 'A cyclist rides 54 km in 2.25 hours at constant speed. What is the unit rate in km/h?',
            correct: '24',
            alternatives: ['24 km/h'],
            explanation: 'Divide total distance by total time: 54 ÷ 2.25 = 24 km per 1 hour.',
            points: 10,
          },
          {
            type: 'figure',
            prompt:
              'Find the slope (rate of change) of the line passing through P₁ and P₂ in the diagram (round to tenths).',
            figure: {
              template: 'coordinate-line',
              givens: { x1: -3, y1: -2, x2: 3, y2: 10 },
              ask: 'slope',
              rounding: 'tenth',
              ranges: { x1: [-7, -1], y1: [-8, 8], x2: [1, 7], y2: [-8, 8] },
            },
            explanation: 'Slope m = (y₂ − y₁) / (x₂ − x₁), matching vertical rise per +1 horizontal run.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'A bookstore marks a $40 hardcover UP by 20% and later runs a 20% OFF sale on the marked-up price. What is the final price?',
            options: ['$40.00', '$38.40', '$39.20', '$41.60'],
            correct: 1,
            explanation: 'Successive multipliers compose as 1.20 × 0.80 = 0.96, so $40 × 0.96 = $38.40.',
            points: 10,
          },
          {
            type: 'fill',
            prompt:
              'After a 6% sales tax, an espresso grinder costs $265. What was its price before tax (in dollars)?',
            correct: '250',
            alternatives: ['$250', '250.00', '$250.00'],
            explanation: 'Divide final price by the tax multiplier 1.06: $265 ÷ 1.06 = $250.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'Which table represents a directly proportional relationship y = kx passing through the origin?',
            options: [
              '(x, y): (1, 5), (2, 8), (3, 11)',
              '(x, y): (2, 7), (4, 14), (6, 21)',
              '(x, y): (0, 3), (2, 7), (4, 11)',
              '(x, y): (1, 1), (2, 4), (3, 9)',
            ],
            correct: 1,
            explanation: 'In (2, 7), (4, 14), (6, 21), the quotient y/x = 3.5 stays constant and includes (0, 0).',
            points: 10,
          },
          {
            type: 'order',
            prompt: 'Order these package rates from CHEAPEST to MOST EXPENSIVE per liter:',
            options: [
              '1.5 L bottle for $2.70 ($1.80/L)',
              '2.0 L carton for $3.90 ($1.95/L)',
              '0.5 L bottle for $1.05 ($2.10/L)',
              '0.25 L can for $0.60 ($2.40/L)',
            ],
            correct: [0, 1, 2, 3],
            explanation:
              'Dividing cost by liters yields $1.80/L < $1.95/L < $2.10/L < $2.40/L.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'Two gears mesh with 18 teeth on the driver and 54 teeth on the follower. If the driver spins 12 full turns, how many times does the follower turn?',
            options: ['4 turns', '36 turns', '3 turns', '18 turns'],
            correct: 0,
            explanation:
              'Tooth contacts match: 12 × 18 = 216 tooth engagements, dividing by 54 teeth gives 4 follower turns.',
            points: 15,
          },
        ],
      },
      {
        title: 'Unit 2: Signed Arithmetic & Coordinate Distances',
        description: 'Directed number operations, exponents vs negation, midpoints, distances, and y-intercepts.',
        subject: 'Quantitative Foundations',
        difficulty: 'medium',
        timeLimitSec: 1200,
        srsInterleave: true,
        lessonId: 'qf-u2-l3',
        modelId: 'quantitative-ratio-balance-2d',
        questions: [
          {
            type: 'fill',
            prompt: 'At dawn the ridge measured −14°C; by noon it reached +9°C. By how many degrees Celsius did it warm?',
            correct: '23',
            alternatives: ['+23', '23 C'],
            explanation: 'Signed change Final − Initial = 9 − (−14) = 9 + 14 = 23°C.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt: 'Evaluate −4² + (−4)².',
            options: ['32', '0', '−32', '16'],
            correct: 1,
            explanation: 'Exponent precedence binds before leading minus: −4² = −(16) = −16, while (−4)² = +16; sum = 0.',
            points: 10,
          },
          {
            type: 'figure',
            prompt:
              'Compute the straight-line distance between P₁ and P₂ shown in the coordinate figure (round to hundredths).',
            figure: {
              template: 'coordinate-line',
              givens: { x1: -2, y1: -4, x2: 4, y2: 4 },
              ask: 'distance',
              rounding: 'hundredth',
              ranges: { x1: [-7, -1], y1: [-7, 7], x2: [1, 7], y2: [-7, 7] },
            },
            explanation: 'Distance d = sqrt((x₂ − x₁)² + (y₂ − y₁)²) via the Pythagorean theorem.',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Find the y-intercept b of the line passing through P₁ and P₂ shown in the coordinate figure (round to tenths).',
            figure: {
              template: 'coordinate-line',
              givens: { x1: -3, y1: 11, x2: 3, y2: -1 },
              ask: 'yIntercept',
              rounding: 'tenth',
              ranges: { x1: [-7, -1], y1: [-8, 8], x2: [1, 7], y2: [-8, 8] },
            },
            explanation: 'First find m = (y₂ − y₁)/(x₂ − x₁), then compute b = y₁ − m·x₁.',
            points: 15,
          },
          {
            type: 'fill',
            prompt: 'Find the x-coordinate of the midpoint between (−7, 12) and (15, −4).',
            correct: '4',
            alternatives: ['x = 4'],
            explanation: 'Average the x-coordinates: (−7 + 15) / 2 = 8 / 2 = 4.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt: 'Simplify (−3/5) ÷ (−9/10).',
            options: ['2/3', '−2/3', '27/50', '−3/2'],
            correct: 0,
            explanation: 'Negative ÷ negative = positive: (3/5) × (10/9) = 30/45 = 2/3.',
            points: 15,
          },
          {
            type: 'order',
            prompt: 'Order these signed numbers from LEAST to GREATEST:',
            options: ['−11/4', '−2.1', '−1/3', '|−1.5|'],
            correct: [0, 1, 2, 3],
            explanation: '−2.75 < −2.1 < −0.333... < +1.5.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt:
              'If x < 0 and y > 0, which quadrant contains the point (−x, −y)?',
            options: ['Quadrant I (+, +)', 'Quadrant II (−, +)', 'Quadrant III (−, −)', 'Quadrant IV (+, −)'],
            correct: 3,
            explanation: 'Since x < 0, −x > 0; since y > 0, −y < 0. (+, −) lies in Quadrant IV.',
            points: 15,
          },
        ],
      },
      {
        title: 'Unit 3: Equations, Balance & Planar Geometry',
        description: 'Linear equations, right triangles, circles, trapezoids, and ASA triangle angles.',
        subject: 'Quantitative Foundations',
        difficulty: 'hard',
        timeLimitSec: 1320,
        srsInterleave: true,
        lessonId: 'qf-u3-l3',
        modelId: 'quantitative-ratio-balance-2d',
        questions: [
          {
            type: 'fill',
            prompt: 'Solve for x: 7x − 9 = 3x + 19.',
            correct: '7',
            alternatives: ['x = 7'],
            explanation: 'Subtract 3x (4x − 9 = 19), add 9 (4x = 28), then divide by 4 -> x = 7.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt: 'Solve 3(2x − 5) = 2(3x + 1) − 17. What happens?',
            options: [
              'No solution exists',
              'x = 0 is the only solution',
              'Infinitely many solutions (all real x)',
              'x = 5/6',
            ],
            correct: 2,
            explanation: 'Expanding gives 6x − 15 = 6x − 15, an identity satisfied by every real x.',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Compute the hypotenuse c of the right triangle from its labeled perpendicular legs (round to hundredths).',
            figure: {
              template: 'right-triangle',
              givens: { a: 6, b: 8 },
              ask: 'c',
              rounding: 'hundredth',
              ranges: { a: [3, 14], b: [4, 18] },
            },
            explanation: 'By the Pythagorean theorem, c = sqrt(a² + b²).',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Calculate the area of the trapezoid using its two labeled parallel bases and perpendicular height (round to tenths).',
            figure: {
              template: 'trapezoid',
              givens: { b1: 6, b2: 12, h: 5 },
              ask: 'area',
              rounding: 'tenth',
              ranges: { b1: [4, 15], b2: [6, 20], h: [3, 12] },
            },
            explanation: 'Trapezoid area equals average base times height: ((b₁ + b₂) / 2) × h.',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Find the missing third angle B (in degrees) of the labeled ASA triangle (round to tenths).',
            figure: {
              template: 'triangle-asa',
              givens: { angleA: 38, b: 15, angleC: 67 },
              ask: 'angleB',
              rounding: 'tenth',
              ranges: { angleA: [25, 65], b: [8, 22], angleC: [25, 65] },
            },
            explanation: 'Interior triangle angles sum to 180°, so angle B = 180° − angle A − angle C.',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Find the area of the circle from its labeled radius r (round to hundredths).',
            figure: {
              template: 'circle',
              givens: { r: 7 },
              ask: 'area',
              rounding: 'hundredth',
              ranges: { r: [3, 16] },
            },
            explanation: 'Circle area equals π · r² (remember to square r before multiplying by π).',
            points: 10,
          },
          {
            type: 'mcq',
            prompt: 'Which set of three segment lengths CANNOT form a closed triangle?',
            options: ['5, 7, 11', '6, 8, 10', '4, 9, 13', '7, 7, 10'],
            correct: 2,
            explanation: 'By the Triangle Inequality, 4 + 9 = 13 does not strictly exceed 13, flattening to a straight line.',
            points: 10,
          },
          {
            type: 'order',
            prompt: 'Order these 2D shapes from SMALLEST to LARGEST perimeter for area = 36:',
            options: [
              'Circle (P ≈ 21.27)',
              'Square 6 × 6 (P = 24)',
              'Rectangle 4 × 9 (P = 26)',
              'Rectangle 2 × 18 (P = 40)',
            ],
            correct: [0, 1, 2, 3],
            explanation:
              'Isoperimetric principle: a circle encloses maximum area per unit perimeter, followed by a square, then skinnier rectangles.',
            points: 15,
          },
        ],
      },
    ],
  },
  {
    id: 'precalculus-trigonometry',
    name: 'Precalculus, Trigonometry & Vectors',
    description:
      'Function transformations, quadratic roots, radian unit-circle waves, amplitude/phase modeling, 2D vector dot products, and laws of sines and cosines.',
    subject: 'Precalculus & Trigonometry',
    category: 'Math',
    icon: '🧭',
    modelId: 'unit-circle-wave-2d',
    relatedModelIds: ['wave-optics', 'kepler'],
    standards: 'Common Core HSF-IF · HSF-BF · HSF-TF · HSG-SRT · HSN-VM',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: ['algebra-linear-systems', 'geometry-figures'],
    track: PRECALC_TRACK,
    units: PRECALC_UNITS,
    quizzes: [
      {
        title: 'Unit 1: Function Families, Quadratics & Inverses',
        description: 'Transformations, vertex form, discriminant regimes, composition, and inverse functions.',
        subject: 'Precalculus & Trigonometry',
        difficulty: 'easy',
        timeLimitSec: 1200,
        srsInterleave: true,
        lessonId: 'pc-u1-l3',
        modelId: 'unit-circle-wave-2d',
        questions: [
          {
            type: 'mcq',
            prompt:
              'How does the graph of g(x) = −2 f(x − 3) + 5 transform the parent graph y = f(x)?',
            options: [
              'Right 3, vertical stretch ×2, reflect across x-axis, up 5',
              'Left 3, vertical stretch ×2, reflect across y-axis, up 5',
              'Right 3, vertical shrink ÷2, reflect across x-axis, down 5',
              'Left 3, reflect across x-axis, up 5',
            ],
            correct: 0,
            explanation: 'Inside (x − 3) shifts right 3; outside −2 stretches vertically by 2 and reflects over x-axis; +5 shifts up.',
            points: 10,
          },
          {
            type: 'figure',
            prompt:
              'Find the x-coordinate of the vertex for the quadratic shown in the figure (round to tenths).',
            figure: {
              template: 'parabola-vertex',
              givens: { a: 2, b: -10, c: 7 },
              ask: 'vertexX',
              rounding: 'tenth',
              ranges: { a: [1, 4], b: [-12, 12], c: [-8, 8] },
            },
            explanation: 'The parabola’s axis of symmetry sits at x_v = −b / (2a).',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Find the greater real x-intercept (root) of the graphed quadratic (round to hundredths).',
            figure: {
              template: 'parabola-vertex',
              givens: { a: 1, b: -3, c: -10 },
              ask: 'greaterRoot',
              rounding: 'hundredth',
              ranges: { a: [1, 3], b: [-10, 10], c: [-15, -1] },
            },
            explanation: 'Since a > 0, the larger root equals (−b + sqrt(b² − 4ac)) / (2a).',
            points: 15,
          },
          {
            type: 'fill',
            prompt: 'If f(x) = 2x² − 1 and g(x) = x − 4, compute f(g(6)).',
            correct: '7',
            alternatives: ['7.0'],
            explanation: 'Inner first: g(6) = 6 − 4 = 2, then f(2) = 2(2²) − 1 = 7.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt:
              'Which statement about f(x) = (3x + 5) / 2 and its inverse f⁻¹(x) is TRUE?',
            options: [
              'f⁻¹(x) = 2 / (3x + 5)',
              'f⁻¹(x) = (2x − 5) / 3, symmetrical across y = x',
              'f⁻¹(x) = (3x − 5) / 2, symmetrical across y = 0',
              'f has no inverse because its slope is fractional',
            ],
            correct: 1,
            explanation: 'Swapping x = (3y + 5)/2 gives 2x − 5 = 3y -> f⁻¹(x) = (2x − 5)/3.',
            points: 10,
          },
          {
            type: 'fill',
            prompt:
              'For what exact value of k does 3x² + 12x + k = 0 have a single tangent real root (Δ = 0)?',
            correct: '12',
            alternatives: ['k = 12'],
            explanation: 'Set b² − 4ac = 0: 12² − 4(3)k = 0 -> 144 = 12k -> k = 12.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'In Kepler’s 3D orbital law T² = a³ (in astronomical units and years), what happens to orbital period T when radius a is multiplied by 9?',
            options: ['T scales by 3×', 'T scales by 9×', 'T scales by 27×', 'T scales by 81×'],
            correct: 2,
            explanation: 'Taking the square root gives T = a^(3/2); at 9×, 9^(3/2) = (sqrt(9))³ = 3³ = 27×.',
            points: 15,
          },
          {
            type: 'order',
            prompt: 'Order these parent functions from SLOWEST to FASTEST growth as x -> +infinity:',
            options: [
              'ln(x) (logarithmic)',
              'sqrt(x) (root)',
              'x³ (cubic polynomial)',
              '2^x (exponential)',
            ],
            correct: [0, 1, 2, 3],
            explanation: 'Logarithms < positive roots < polynomials < exponentials as x -> ∞.',
            points: 10,
          },
        ],
      },
      {
        title: 'Unit 2: Unit Circle, Radians & Periodic Waves',
        description: 'Radian conversion, circular coordinates, amplitude/period/phase shifts, and tangent slope.',
        subject: 'Precalculus & Trigonometry',
        difficulty: 'medium',
        timeLimitSec: 1200,
        srsInterleave: true,
        lessonId: 'pc-u2-l4',
        modelId: 'unit-circle-wave-2d',
        questions: [
          {
            type: 'figure',
            prompt:
              'Convert the plotted degree angle θ on the unit circle into radians (round to thousandths).',
            figure: {
              template: 'unit-circle',
              givens: { angleDeg: 150 },
              ask: 'radians',
              rounding: 'thousandth',
              ranges: { angleDeg: [15, 345] },
            },
            explanation: 'Multiply θ° by π / 180 to convert degrees to radians.',
            points: 10,
          },
          {
            type: 'figure',
            prompt:
              'Determine cos(θ) (the horizontal coordinate x) for the labeled angle on the unit circle (to thousandths).',
            figure: {
              template: 'unit-circle',
              givens: { angleDeg: 120 },
              ask: 'cos',
              rounding: 'thousandth',
              ranges: { angleDeg: [15, 345] },
            },
            explanation: 'Cosine gives the x-coordinate on the unit circle: positive in QI/QIV, negative in QII/QIII.',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Determine tan(θ) (the slope of the terminal ray) on the unit circle (to thousandths).',
            figure: {
              template: 'unit-circle',
              givens: { angleDeg: 55 },
              ask: 'tan',
              rounding: 'thousandth',
              ranges: { angleDeg: [15, 75] },
            },
            explanation: 'tan θ = sin θ / cos θ equals the slope of the angle ray.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'Suppose sin θ = 5/13 and θ lies in Quadrant II. What is cos θ?',
            options: ['12/13', '−12/13', '−8/13', '−5/12'],
            correct: 1,
            explanation: 'Pythagorean triple 5-12-13 gives |cos θ| = 12/13; Quadrant II has x < 0, so cos θ = −12/13.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt:
              'What are the period and horizontal phase shift of y = 4 sin(3x − π/2) − 1?',
            options: [
              'Period = 2π/3, shifted RIGHT π/6',
              'Period = 2π/3, shifted RIGHT π/2',
              'Period = 6π, shifted LEFT π/6',
              'Period = π/3, shifted RIGHT π/2',
            ],
            correct: 0,
            explanation: 'Factor 3 inside: 3(x − π/6). Period = 2π/3 and phase shift = +π/6 right.',
            points: 15,
          },
          {
            type: 'fill',
            prompt:
              'A circle of radius 10 cm sweeps a central angle of 3π/5 radians. What is the arc length in cm (write in terms of pi as "6pi" or decimal)?',
            correct: '6pi',
            alternatives: ['6 pi', '6π', '18.85', '18.84'],
            explanation: 's = rθ = 10 × (3π/5) = 6π ≈ 18.85 cm.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'If two coherent optical waves arrive half a cycle (π radians) out of phase at a screen point, what occurs?',
            options: [
              'Destructive interference cancels net amplitude',
              'Constructive interference doubles net amplitude',
              'Wavelength cuts in half',
              'Frequency triples',
            ],
            correct: 0,
            explanation: 'Because sin(θ + π) = −sin(θ), opposing crests and troughs cancel each other.',
            points: 10,
          },
          {
            type: 'order',
            prompt: 'Order these exact values from LEAST to GREATEST:',
            options: [
              'cos(π) = −1',
              'sin(7π/6) = −0.5',
              'tan(π/6) = 1/sqrt(3) ≈ 0.577',
              'sin(π/2) = +1',
            ],
            correct: [0, 1, 2, 3],
            explanation: '−1 < −0.5 < +0.577 < +1.',
            points: 10,
          },
        ],
      },
      {
        title: 'Unit 3: 2D Vectors & Oblique Triangles',
        description: 'Resultant magnitudes, dot products, orthogonality, and Laws of Sines and Cosines.',
        subject: 'Precalculus & Trigonometry',
        difficulty: 'hard',
        timeLimitSec: 1440,
        srsInterleave: true,
        lessonId: 'pc-u3-l3',
        modelId: 'unit-circle-wave-2d',
        questions: [
          {
            type: 'figure',
            prompt:
              'Find the magnitude ||u + v|| of the sum of vectors u and v shown in the diagram (round to hundredths).',
            figure: {
              template: 'vector-2d',
              givens: { ux: 3, uy: 6, vx: 5, vy: 0 },
              ask: 'resultantMag',
              rounding: 'hundredth',
              ranges: { ux: [-8, 8], uy: [-8, 8], vx: [-8, 8], vy: [-8, 8] },
            },
            explanation: 'Sum components (ux + vx, uy + vy) and take the Euclidean norm sqrt(rx² + ry²).',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Compute the algebraic dot product u·v for the two vectors displayed (round to tenths).',
            figure: {
              template: 'vector-2d',
              givens: { ux: 5, uy: -3, vx: -2, vy: 4 },
              ask: 'dotProduct',
              rounding: 'tenth',
              ranges: { ux: [2, 10], uy: [-8, 8], vx: [-10, -2], vy: [-8, 8] },
            },
            explanation: 'The dot product equals ux·vx + uy·vy.',
            points: 10,
          },
          {
            type: 'figure',
            prompt:
              'Find the angle (in degrees) between vectors u and v shown in the diagram (round to tenths).',
            figure: {
              template: 'vector-2d',
              givens: { ux: 4, uy: 3, vx: -3, vy: 4 },
              ask: 'angleBetween',
              rounding: 'tenth',
              ranges: { ux: [2, 10], uy: [-8, 8], vx: [-10, -2], vy: [-8, 8] },
            },
            explanation: 'Use θ = arccos((u·v) / (||u|| · ||v||)) converted to degrees.',
            points: 15,
          },
          {
            type: 'mcq',
            prompt: 'For what value of k are vectors ⟨4, −6⟩ and ⟨k, 2⟩ orthogonal?',
            options: ['k = 3', 'k = −3', 'k = 12', 'k = −1.33'],
            correct: 0,
            explanation: 'Orthogonality requires u·v = 0: 4k + (−6)(2) = 0 -> 4k = 12 -> k = 3.',
            points: 10,
          },
          {
            type: 'figure',
            prompt:
              'Using sides b, c and included angle A in the SAS triangle, find opposite side a (round to hundredths).',
            figure: {
              template: 'triangle-sas',
              givens: { b: 8, c: 11, angleA: 48 },
              ask: 'a',
              rounding: 'hundredth',
              ranges: { b: [6, 16], c: [7, 18], angleA: [30, 120] },
            },
            explanation: 'Apply Law of Cosines: a = sqrt(b² + c² − 2bc cos A).',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'Given all three side lengths a, b, and c of the SSS triangle, compute interior angle A in degrees (round to tenths).',
            figure: {
              template: 'triangle-sss',
              givens: { a: 9, b: 10, c: 12 },
              ask: 'angleA',
              rounding: 'tenth',
              ranges: { a: [8, 13], b: [8, 13], c: [8, 13] },
            },
            explanation: 'Rearrange Law of Cosines: cos A = (b² + c² − a²) / (2bc), then take arccos.',
            points: 15,
          },
          {
            type: 'figure',
            prompt:
              'In the ASA triangle shown (angles A, C and included side b), calculate side length a opposite angle A (round to hundredths).',
            figure: {
              template: 'triangle-asa',
              givens: { angleA: 44, b: 15, angleC: 61 },
              ask: 'a',
              rounding: 'hundredth',
              ranges: { angleA: [25, 65], b: [8, 22], angleC: [25, 65] },
            },
            explanation: 'First compute B = 180° − A − C, then apply Law of Sines: a = b · sin(A) / sin(B).',
            points: 15,
          },
          {
            type: 'mcq',
            prompt:
              'Given triangle side lengths a = 7, b = 9, and c = 12, is the largest angle C acute, right, or obtuse?',
            options: [
              'Acute, because 7 + 9 = 16 > 12',
              'Right, because 7² + 9² = 130',
              'Obtuse, because 7² + 9² = 130 < 12² = 144 makes cos C negative',
              'Cannot determine without an angle given',
            ],
            correct: 2,
            explanation: 'In Law of Cosines, cos C = (49 + 81 − 144)/(2·7·9) = −14/126 < 0, forcing angle C > 90° (obtuse).',
            points: 10,
          },
        ],
      },
    ],
  },
]
