import type { ContentPack } from './types'
import type { CurriculumTrack } from '../lessons'

const ALG_TRACK: CurriculumTrack = {
  id: 'track-algebra-linear-systems',
  slug: 'algebra-linear-systems',
  packId: 'algebra-linear-systems',
  title: 'Algebra: Linear & Quadratic Systems',
  category: 'Math',
  subject: 'Algebra',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-quantitative-foundations'],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'alg-u1',
      title: 'Linear Transformations, Quadratics & Intersections',
      anchoringPhenomenon:
        'A 2×2 matrix stretches and rotates every grid square simultaneously, while quadratic vertex symmetry predicts parabola extrema and roots before graphing.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'alg-u1-l1',
          unitId: 'alg-u1',
          title: 'Linear Systems as 2D Basis Transformations',
          summary:
            'Visualize solving 2×2 linear systems by transforming basis vectors i-hat and j-hat in the plane.',
          estimatedMinutes: 8,
          standards: ['CCSS.MATH.HSA.REI.C.6', 'CCSS.MATH.HSN.VM.C.12'],
          prerequisiteLessonIds: [],
          visual: { kind: 'model-2d', modelId: 'linear-transform-eigen-2d' },
          steps: [
            {
              id: 'alg-u1-l1-s1',
              kind: 'narrative',
              title: 'Lines Meet Where Transformation Columns Balance',
              bodyMarkdown:
                'Every 2×2 system $A\\mathbf{x} = \\mathbf{b}$ asks how many copies of column 1 and column 2 combine to hit target $\\mathbf{b}$. When the two columns point along independent directions (nonzero determinant $\\det A = ad - bc$), a **unique** solution exists; when columns collapse onto the same line ($\\det A = 0$), either zero or infinitely many solutions occur.',
              callout: {
                tone: 'key-idea',
                text: 'Determinant ad − bc measures signed area scaling: zero area collapse signals parallel or coincident system equations.',
              },
            },
            {
              id: 'alg-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Predict Basis Collapse',
              predictionPrompt:
                'If the second equation of a 2×2 system is exact 2× the first equation on the variable side (e.g., x + 2y = 5 and 2x + 4y = 12), how do the transformed basis vectors behave?',
              predictionChoices: [
                'They stay orthogonal and scale area by 2',
                'They collapse onto the same line (det = 0), yielding zero intersection solutions',
                'They invert area to −4',
                'They produce a unique solution at (2, 4)',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'linear-transform-eigen-2d' },
              observeInstruction:
                'Explore how aligning the two transformed column vectors collapses the parallelogram area to 0 in the 2D transformation canvas.',
              explainPrompt: 'What distinguishes zero solutions from infinitely many when det = 0?',
              explainOptions: [
                'Zero solutions occur when lines are parallel with mismatched constants (2x + 4y = 12 ≠ 10); matching constants overlap everywhere',
                'Determinant sign swaps between +0 and −0',
                'Only x-intercepts can collapse',
                'Slopes become perpendicular instead of parallel',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Parallel slopes guarantee det = 0; comparing intercepts tells whether the lines sit offset (0 solutions) or coincident (infinite solutions).',
            },
            {
              id: 'alg-u1-l1-s3',
              kind: 'worked-example',
              title: 'Elimination Confirmed by Slope Comparison',
              problemMarkdown: 'Solve $3x - 2y = 8$ and $x + 4y = 12$.',
              steps: [
                {
                  label: 'Scale first equation by 2 so y-coefficients cancel',
                  expressionOrAction: '6x − 4y = 16',
                  whyNote: 'Matching magnitude +4y and −4y eliminates y in one addition.',
                },
                {
                  label: 'Add equations and solve for x, then back-substitute',
                  expressionOrAction: '7x = 28 -> x = 4; then 4 + 4y = 12 -> y = 2.',
                  whyNote: 'Check in eqn 1: 3(4) − 2(2) = 8. Unique point (4, 2).',
                },
              ],
            },
            {
              id: 'alg-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Slope Perpendicularity Check',
              question: {
                type: 'mcq',
                prompt: 'Line L passes through (0, 2) with slope 3/4. What slope makes Line K perpendicular to L?',
                options: ['3/4', '−3/4', '−4/3', '4/3'],
                correct: 2,
                explanation: 'Perpendicular non-vertical lines satisfy m₁·m₂ = −1, so −1/(3/4) = −4/3.',
                points: 10,
              },
            },
            {
              id: 'alg-u1-l1-s5',
              kind: 'synthesis',
              title: 'Systems & Linear Maps Linked',
              takeaways: [
                'Distinct slopes (det ≠ 0) lock a unique intersection; equal slopes split into parallel (none) or identical (infinite).',
                'Perpendicular lines multiply slopes to −1; horizontal lines have slope 0.',
              ],
              nextQuizIndex: 0,
              arcadeLaunch: { mode: 'speed-match', packId: 'algebra-linear-systems' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'alg-u1-l1-fc1',
              front: 'What geometric area does |ad − bc| measure for a 2×2 matrix [[a,b],[c,d]]?',
              back: 'The area scale factor of the unit square under that linear transformation.',
              explanation: 'When ad − bc = 0, the 2D grid flattens into a 1D line or point.',
              interleave: true,
            },
            {
              id: 'alg-u1-l1-fc2',
              front: 'Condition for two non-vertical lines to be parallel vs perpendicular',
              back: 'Parallel: m₁ = m₂ (b₁ ≠ b₂). Perpendicular: m₁ · m₂ = −1 (negative reciprocals).',
              explanation: 'Swapping rise and run and negating one rotates direction by 90°.',
              interleave: true,
            },
            {
              id: 'alg-u1-l1-fc3',
              front: 'Point-slope equation through (x₀, y₀) with slope m',
              back: 'y − y₀ = m(x − x₀).',
              explanation: 'Immediately solves linear equations without computing b first.',
              interleave: true,
            },
          ],
        },
        {
          id: 'alg-u1-l2',
          unitId: 'alg-u1',
          title: 'Parabola Architecture: Vertex & Discriminant',
          summary:
            'Connect completing the square, discriminant roots, and symmetric parabola extrema.',
          estimatedMinutes: 9,
          standards: ['CCSS.MATH.HSA.REI.B.4', 'CCSS.MATH.HSF.IF.C.8'],
          prerequisiteLessonIds: ['alg-u1-l1'],
          visual: {
            kind: 'figure-2d',
            figure: {
              template: 'parabola-vertex',
              givens: { a: 1, b: -5, c: -14 },
              ask: 'greaterRoot',
              rounding: 'integer',
              ranges: { a: [1, 3], b: [-10, 10], c: [-16, -1] },
            },
          },
          steps: [
            {
              id: 'alg-u1-l2-s1',
              kind: 'narrative',
              title: 'Standard vs Factored vs Vertex Forms',
              bodyMarkdown:
                'Every quadratic wears three complementary masks: **Standard** $ax^2 + bx + c$ displays the $y$-intercept $c$; **Vertex** $a(x - h)^2 + k$ isolates turning point $(h, k)$; **Factored** $a(x - r_1)(x - r_2)$ displays the real $x$-intercepts whenever $\\Delta = b^2 - 4ac \\ge 0$.',
              callout: {
                tone: 'key-idea',
                text: 'Vertex x = −b/(2a) is the exact midpoint (r₁ + r₂)/2 between any pair of roots!',
              },
            },
            {
              id: 'alg-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Predict Root Count from Δ = b² − 4ac',
              predictionPrompt: 'If b² − 4ac = 0 for a upward-opening parabola, how does it touch the x-axis?',
              predictionChoices: [
                'Crosses twice symmetrically',
                'Touches cleanly at exactly one tangent point—its vertex sits on y = 0',
                'Never reaches the x-axis',
                'Breaks into two vertical lines',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'figure-2d',
                figure: {
                  template: 'parabola-vertex',
                  givens: { a: 1, b: -6, c: 9 },
                  ask: 'discriminant',
                  rounding: 'integer',
                },
              },
              observeInstruction: 'Check how ±sqrt(Δ) collapses to ±0 when Δ = 0, leaving one double root at x = −b/(2a).',
              explainPrompt: 'What single parameter shifts y = x² − 6x + 9 above the x-axis with zero real roots?',
              explainOptions: [
                'Increasing constant c past 9 (e.g., +10) raises the entire curve above y = 0, making Δ < 0',
                'Decreasing c below 9',
                'Doubling a to 2 while setting c = 0',
                'Flipping sign of b from −6 to +6',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'At c = 10, vertex shifts from (3, 0) up to (3, 1) and Δ = 36 − 40 = −4 < 0.',
            },
            {
              id: 'alg-u1-l2-s3',
              kind: 'branching-scenario',
              title: 'Troubleshoot a Factored Quadratic Zero Error',
              startNodeId: 'zero-prod',
              nodes: {
                'zero-prod': {
                  promptMarkdown:
                    'A classmate factors $(x - 2)(x - 5) = 4$ and writes $x - 2 = 4$ or $x - 5 = 4$. What went wrong?',
                  choices: [
                    {
                      label: 'The Zero Product Property ONLY works when the right side equals 0; expand and subtract 4 first',
                      nextNodeId: 'solve-zero',
                      feedback:
                        'Exact! Two numbers multiplying to 4 can be 1×4, 2×2, 8×0.5, etc.—only 0 forces a factor to vanish.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'It fails because x = 2 and x = 5 should be added instead',
                      nextNodeId: 'zero-prod',
                      feedback: 'Not quite: re-examine why factoring equals 4 gives infinitely many factor pairs, whereas ab = 0 forces a=0 or b=0.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
                'solve-zero': {
                  promptMarkdown: 'Expanding $(x - 2)(x - 5) - 4 = 0$ gives $x^2 - 7x + 6 = 0$. What are the real solutions?',
                  choices: [
                    {
                      label: 'x = 1 and x = 6',
                      nextNodeId: null,
                      feedback: 'Factored cleanly as (x − 1)(x − 6) = 0; checking x=1 gives (-1)(-4)=4!',
                      outcome: 'optimal',
                    },
                    {
                      label: 'x = 2 and x = 5',
                      nextNodeId: null,
                      feedback: 'At x=2, (2-2)(2-5) = 0 ≠ 4. Check (x−1)(x−6) = 0.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'alg-u1-l2-s4',
              kind: 'faded-practice',
              title: 'Extract Dynamic Greater Root',
              promptMarkdown:
                'Use the quadratic coefficients labeled on the figure to compute the larger real root (round to integers).',
              completedSteps: [
                'Step 1: Compute Δ = b² − 4ac.',
                'Step 2: Apply (−b + sqrt(Δ)) / (2a) since a > 0.',
              ],
              fadedTarget: {
                type: 'figure',
                question: {
                  type: 'figure',
                  prompt: 'Find the larger real x-intercept of the graphed parabola (nearest integer).',
                  figure: {
                    template: 'parabola-vertex',
                    givens: { a: 1, b: -5, c: -14 },
                    ask: 'greaterRoot',
                    rounding: 'integer',
                    ranges: { a: [1, 3], b: [-10, 10], c: [-16, -1] },
                  },
                  explanation: 'Apply the quadratic formula or factor the parabola; with a > 0, the +sqrt(Δ) branch yields the greater root.',
                  points: 15,
                },
              },
            },
            {
              id: 'alg-u1-l2-s5',
              kind: 'synthesis',
              title: 'Quadratic Forms Unified',
              takeaways: [
                'Move all terms to one side (= 0) before applying the Zero Product Property.',
                'h = −b/(2a) and Δ = b² − 4ac control symmetry and real-root multiplicity.',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'step-detective', packId: 'algebra-linear-systems' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'alg-u1-l2-fc1',
              front: 'Why must an equation equal ZERO before setting factored pieces to zero?',
              back: 'Only zero has the Zero Product Property (ab = 0 => a = 0 or b = 0); ab = 6 holds for infinitely many pairs.',
              explanation: 'Subtract any nonzero RHS and re-factor.',
              interleave: true,
            },
            {
              id: 'alg-u1-l2-fc2',
              front: 'Discriminant Δ = b² − 4ac for x² − 6x + 9 = 0',
              back: 'Δ = 36 − 36 = 0 (one repeated real root tangent at x = 3).',
              explanation: 'A zero discriminant marks a perfect square trinomial (x − 3)².',
              interleave: true,
            },
            {
              id: 'alg-u1-l2-fc3',
              front: 'Three standard quadratic representations and what each reveals immediately',
              back: 'Standard: y-intercept c; Vertex: minimum/maximum (h, k); Factored: x-intercepts r₁, r₂.',
              explanation: 'Convert between them via completing the square or factoring.',
              interleave: true,
            },
          ],
        },
        {
          id: 'alg-u1-l3',
          unitId: 'alg-u1',
          title: 'Grid Distance & Nonlinear Synthesis',
          summary:
            'Compute Euclidean distances between intersection points and tie linear slopes to quadratic rates.',
          estimatedMinutes: 8,
          standards: ['CCSS.MATH.HSA.CED.A.2', 'CCSS.MATH.HSF.IF.A.2'],
          prerequisiteLessonIds: ['alg-u1-l2'],
          visual: {
            kind: 'figure-2d',
            figure: {
              template: 'coordinate-line',
              givens: { x1: -3, y1: -1, x2: 5, y2: 14 },
              ask: 'distance',
              rounding: 'integer',
              ranges: { x1: [-6, -1], y1: [-6, 6], x2: [1, 7], y2: [-6, 14] },
            },
          },
          steps: [
            {
              id: 'alg-u1-l3-s1',
              kind: 'narrative',
              title: 'Connecting Algebraic Solutions Back to Geometry',
              bodyMarkdown:
                'Solving a system $y = mx + b$ and $y = ax^2 + bx + c$ yields two coordinates $(x_1, y_1)$ and $(x_2, y_2)$ where line cuts curve. Measuring chord length between them turns algebra straight back into coordinate geometry via $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.',
              callout: {
                tone: 'key-idea',
                text: 'Line-parabola intersections equate m x + d = a x² + b x + c, producing another quadratic whose Δ gives 2, 1 (tangent), or 0 crossings.',
              },
            },
            {
              id: 'alg-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Predict Chord Distance Between Grid Points',
              predictionPrompt:
                'Two points sit at (−3, −1) and (5, 14). Which Pythagorean triple governs the straight-line chord between them?',
              predictionChoices: ['6-8-10', '5-12-13', '8-15-17', '7-24-25'],
              correctPredictionIndex: 2,
              visual: {
                kind: 'figure-2d',
                figure: {
                  template: 'coordinate-line',
                  givens: { x1: -3, y1: -1, x2: 5, y2: 14 },
                  ask: 'distance',
                  rounding: 'integer',
                },
              },
              observeInstruction: 'Check Δx = 5 − (−3) = 8 and Δy = 14 − (−1) = 15 on the plotted segment.',
              explainPrompt: 'Why is the distance exactly 17?',
              explainOptions: [
                'sqrt(8² + 15²) = sqrt(64 + 225) = sqrt(289) = 17',
                '8 + 15 − 6 = 17',
                'sqrt(15² − 8²) = 17',
                'Average of 8 and 15 doubled',
              ],
              correctExplainIndex: 0,
              reconcileFeedback: 'Right triangle legs 8 and 15 form the classic 8-15-17 hypotenuse.',
            },
            {
              id: 'alg-u1-l3-s3',
              kind: 'worked-example',
              title: 'Composing Functions Inside Systems',
              problemMarkdown: 'Given $f(x) = 2x - 3$ and $g(x) = x^2 + 1$, evaluate $f(g(3))$ and explain why order matters.',
              steps: [
                {
                  label: 'Evaluate inner g(3) first',
                  expressionOrAction: 'g(3) = 3² + 1 = 10',
                  whyNote: 'Feed x = 3 into g before passing to f.',
                },
                {
                  label: 'Apply outer f(10)',
                  expressionOrAction: 'f(10) = 2(10) − 3 = 17 (note g(f(3)) = g(3) = 10 ≠ 17!)',
                  whyNote: 'Checking the reverse order proves composition is non-commutative.',
                },
              ],
            },
            {
              id: 'alg-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Dynamic Segment Length Check',
              question: {
                type: 'figure',
                prompt: 'Compute the distance between P₁ and P₂ shown in the figure (nearest integer).',
                figure: {
                  template: 'coordinate-line',
                  givens: { x1: -4, y1: 0, x2: 2, y2: 8 },
                  ask: 'distance',
                  rounding: 'integer',
                  ranges: { x1: [-6, -1], y1: [-6, 6], x2: [1, 7], y2: [-6, 12] },
                },
                explanation: 'Compute sqrt((x₂ − x₁)² + (y₂ − y₁)²) from the plotted grid coordinates.',
                points: 15,
              },
            },
            {
              id: 'alg-u1-l3-s5',
              kind: 'synthesis',
              title: 'Algebra Core Track Complete',
              takeaways: [
                'Line-quadratic intersections reduce to Δ of the difference quadratic.',
                'Evaluate inner g(x) before outer f(...) in f(g(x)) and verify coordinate distances with Δx² + Δy².',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'cloze-workbench', packId: 'algebra-linear-systems' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'alg-u1-l3-fc1',
              front: 'How many intersection points can a line and a parabola share?',
              back: '0, 1 (tangent), or 2, determined by the discriminant of a x² + (b − m)x + (c − d) = 0.',
              explanation: 'Equating y_line = y_parabola collects all terms into one quadratic.',
              interleave: true,
            },
            {
              id: 'alg-u1-l3-fc2',
              front: 'Does f(g(x)) generally equal g(f(x))?',
              back: 'No! Function composition is not commutative; evaluate from the innermost parentheses outward.',
              explanation: 'E.g. squaring then doubling gives 2x², while doubling then squaring gives 4x².',
              interleave: true,
            },
            {
              id: 'alg-u1-l3-fc3',
              front: 'Fast integer Pythagorean check for coordinate chords',
              back: 'Check if (|Δx|, |Δy|) scales 3-4-5, 5-12-13, or 8-15-17 before computing square roots.',
              explanation: 'Saves time and catches sign mistakes in Δx = x₂ − x₁.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

const GEO_TRACK: CurriculumTrack = {
  id: 'track-geometry-figures',
  slug: 'geometry-figures',
  packId: 'geometry-figures',
  title: 'Geometry: Figures, Trig & Trusses',
  category: 'Math',
  subject: 'Geometry',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-quantitative-foundations'],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'geo-u1',
      title: 'Rigidity, Triangle Laws & Unit-Circle Vectors',
      anchoringPhenomenon:
        'Geodesic domes resist buckling because fixed triangle edges lock joint angles by SSS rigidity, unlike collapsible four-bar rectangles.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'geo-u1-l1',
          unitId: 'geo-u1',
          title: 'Structural Triangle Rigidity & Geodesic Trusses',
          summary:
            'Inspect how SSS triangulation locks 3D dome geometry and obeys Euler’s convex polyhedron invariant V − E + F = 2.',
          estimatedMinutes: 8,
          standards: ['CCSS.MATH.HSG.CO.B.8', 'CCSS.MATH.HSG.MG.A.1'],
          prerequisiteLessonIds: [],
          visual: {
            kind: 'model-3d',
            modelId: 'geodesic-truss',
            initialParams: { apexLoad: 50, stressMap: true },
            highlightHotspots: ['apex', 'hoop'],
          },
          steps: [
            {
              id: 'geo-u1-l1-s1',
              kind: 'narrative',
              title: 'Why Engineers Brace Squares With Diagonals',
              bodyMarkdown:
                'Build a square out of four straws with pin joints and push a corner—it shears effortlessly into a flat rhombus while every side stays constant. Now pin **three** straws into a triangle: without bending a straw, **zero** angular motion is possible because **SSS congruence** locks all three angles uniquely.\n\nSubdividing a sphere into interconnected triangles builds a **geodesic dome**, whose vertices $V$, edges $E$, and faces $F$ obey Euler’s invariant **$V - E + F = 2$**.',
              callout: {
                tone: 'key-idea',
                text: 'Adding one diagonal brace turns a flexible 4-bar frame into two rigid triangles.',
              },
            },
            {
              id: 'geo-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Stress Paths in a Loaded 3D Geodesic Truss',
              predictionPrompt:
                'As apex load increases on the 3D geodesic dome, how do the triangular struts distribute the vertical force?',
              predictionChoices: [
                'Only the top joint bears stress while the hoop ring stays unstressed',
                'Axial compression and hoop tension spread load outward radially across triangulated rings to the base',
                'Struts shear sideways like an unbraced rectangle',
                'Euler invariant V − E + F changes from 2 to 0',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'geodesic-truss',
                initialParams: { apexLoad: 70, stressMap: true },
                highlightHotspots: ['apex', 'hoop', 'coords'],
              },
              observeInstruction:
                'Increase the apexLoad slider in the 3D Geodesic Truss model with stressMap enabled and click the apex and hoop hotspots.',
              explainPrompt:
                'Which geometric theorem guarantees triangles cannot deform without changing edge lengths?',
              explainOptions: [
                'SSS Congruence: fixing side lengths a, b, c uniquely fixes cos A, cos B, cos C',
                'AAA Similarity',
                'Midsegment Averaging',
                'Vertical Angle Congruence',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Because cos A = (b² + c² − a²)/(2bc) is fixed by side lengths alone, no joint angle can change unless struts stretch or compress axially.',
            },
            {
              id: 'geo-u1-l1-s3',
              kind: 'worked-example',
              title: 'Verifying V − E + F = 2 on a Pyramid & Octahedron',
              problemMarkdown: 'Check Euler’s characteristic on a regular octahedron (8 triangular faces).',
              steps: [
                {
                  label: 'Count vertices and faces',
                  expressionOrAction: 'V = 6 vertices (top, bottom, 4 equatorial); F = 8 triangular faces.',
                  whyNote: 'Every face has 3 sides.',
                },
                {
                  label: 'Compute edge count E without double-counting',
                  expressionOrAction: 'E = (3 × 8) / 2 = 12 edges -> V − E + F = 6 − 12 + 8 = 2!',
                  whyNote: 'Each edge borders 2 faces, so sum of face-sides divided by 2 equals E.',
                },
              ],
            },
            {
              id: 'geo-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Circle Area Recall',
              question: {
                type: 'figure',
                prompt: 'Find the area of the circular dome base from its radius r. Round to the nearest tenth.',
                figure: {
                  template: 'circle',
                  givens: { r: 8 },
                  ask: 'area',
                  rounding: 'tenth',
                  ranges: { r: [3, 15] },
                },
                explanation: 'Circular floor area equals π · r².',
                points: 10,
              },
            },
            {
              id: 'geo-u1-l1-s5',
              kind: 'synthesis',
              title: 'Rigidity Built on Triangles',
              takeaways: [
                'SSS locks triangle shape rigidly; closed convex meshes satisfy V − E + F = 2.',
                'Geodesic domes channel vertical loads into axial strut forces around hoop rings.',
              ],
              nextQuizIndex: 0,
              arcadeLaunch: { mode: 'diagram-scout', packId: 'geometry-figures' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'geo-u1-l1-fc1',
              front: 'Euler’s Polyhedron Formula for any closed convex mesh',
              back: 'V − E + F = 2 (Vertices − Edges + Faces = 2).',
              explanation: 'Holds across tetrahedra, cubes, octahedra, and spherical geodesic domes.',
              interleave: true,
            },
            {
              id: 'geo-u1-l1-fc2',
              front: 'Why are triangles structurally rigid while squares collapse?',
              back: 'SSS forces fixed side lengths -> fixed angles, whereas 4 fixed side lengths can shear into infinitely many rhombi.',
              explanation: 'Diagonal bracing turns quadrilaterals into rigid triangulated trusses.',
              interleave: true,
            },
            {
              id: 'geo-u1-l1-fc3',
              front: 'Formula linking face count to edge count in an all-triangle closed mesh',
              back: '3F = 2E (since every triangle contributes 3 sides and every edge connects 2 triangles).',
              explanation: 'Halving total polygon border sides always yields E.',
              interleave: true,
            },
          ],
        },
        {
          id: 'geo-u1-l2',
          unitId: 'geo-u1',
          title: 'Solving Triangles: ASA, SAS & SSS',
          summary:
            'Choose smoothly between Law of Sines (ASA) and Law of Cosines (SAS/SSS) when surveying non-right triangles.',
          estimatedMinutes: 9,
          standards: ['CCSS.MATH.HSG.SRT.D.10', 'CCSS.MATH.HSG.SRT.D.11'],
          prerequisiteLessonIds: ['geo-u1-l1'],
          visual: {
            kind: 'figure-2d',
            figure: {
              template: 'triangle-asa',
              givens: { angleA: 42, b: 14, angleC: 63 },
              ask: 'a',
              rounding: 'tenth',
              ranges: { angleA: [25, 65], b: [8, 20], angleC: [25, 65] },
            },
          },
          steps: [
            {
              id: 'geo-u1-l2-s1',
              kind: 'narrative',
              title: 'Matching Congruence Criteria to Trig Laws',
              bodyMarkdown:
                'Every classical congruence rule (**SSS, SAS, ASA**) corresponds to one exact algebraic solver:\n- **ASA / AAS** gives two angles -> immediately get the third ($B = 180^\\circ - A - C$) and use **Law of Sines**.\n- **SAS** gives two sides + included angle -> **Law of Cosines** finds the opposite side.\n- **SSS** gives all three sides -> **Law of Cosines** solves $\\cos A$ directly.',
              callout: {
                tone: 'key-idea',
                text: 'Only right triangles use SOH-CAH-TOA or a² + b² = c² directly; drop an altitude or use Sines/Cosines for oblique triangles.',
              },
            },
            {
              id: 'geo-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Estimate ASA Opposite Side by Angle Comparison',
              predictionPrompt:
                'In a triangle with angle A = 40°, angle B = 80°, and angle C = 60°, which side MUST be longest?',
              predictionChoices: [
                'Side a (opposite 40°)',
                'Side b (opposite largest angle 80°)',
                'Side c (opposite 60°)',
                'All three sides are equal',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'figure-2d',
                figure: {
                  template: 'triangle-asa',
                  givens: { angleA: 40, b: 15, angleC: 60 },
                  ask: 'a',
                  rounding: 'tenth',
                },
              },
              observeInstruction:
                'Notice in the ASA diagram that side a across from 40° sits visibly shorter than base b across from 80°.',
              explainPrompt: 'Why do larger interior angles always sit opposite longer sides?',
              explainOptions: [
                'In 0° < θ < 180°, sin(A)/a is constant across the triangle (Wait: bigger angle opens wider rays across the triangle)',
                'Because cosine grows with angle',
                'Because angles multiply side lengths linearly',
                'Because smaller angles always add to 90°',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'By the Hinge / Law-of-Sines relation a = b sin(A)/sin(B), wider angles span wider opposite chords inside the circumcircle.',
            },
            {
              id: 'geo-u1-l2-s3',
              kind: 'branching-scenario',
              title: 'Surveying Law Selection',
              startNodeId: 'pick-tool',
              nodes: {
                'pick-tool': {
                  promptMarkdown:
                    'A canyon surveyor knows side $b = 80\\text{ m}$ along her cliff, left sight angle $A = 48^\\circ$, and right sight angle $C = 57^\\circ$. Which law unlocks side $a$?',
                  choices: [
                    {
                      label: 'Subtract 180° − 48° − 57° = 75° for B, then run Law of Sines a = b sin(A)/sin(B)',
                      nextNodeId: 'check-sanity',
                      feedback: 'Optimal! Pairing side b with opposite angle B immediately unlocks the full triangle.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Use Law of Cosines a² = b² + c² − 2bc cos A right now',
                      nextNodeId: 'pick-tool',
                      feedback: 'Side c is still unknown, so Law of Cosines cannot run yet. Find angle B first.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
                'check-sanity': {
                  promptMarkdown:
                    'Before reporting your answer for side a (across from A = 48°) vs b = 80 m (across from B = 75°), should a be larger or smaller than 80 m?',
                  choices: [
                    {
                      label: 'Smaller than 80 m, since 48° < 75°',
                      nextNodeId: null,
                      feedback: 'Exactly right: 80 · sin(48°)/sin(75°) ≈ 61.5 m < 80 m.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Larger than 80 m',
                      nextNodeId: null,
                      feedback: 'Side lengths order identically to opposite angles: A < B forces a < b.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'geo-u1-l2-s4',
              kind: 'checkpoint',
              title: 'Dynamic Triangle ASA Calculation',
              question: {
                type: 'figure',
                prompt:
                  'In the labeled ASA triangle (angles A, C and included side b), calculate side a opposite angle A. Round to the nearest tenth.',
                figure: {
                  template: 'triangle-asa',
                  givens: { angleA: 45, b: 12, angleC: 60 },
                  ask: 'a',
                  rounding: 'tenth',
                  ranges: { angleA: [25, 65], b: [8, 20], angleC: [25, 65] },
                },
                explanation: 'Compute B = 180° − A − C, then use Law of Sines: a = b · sin(A) / sin(B).',
                points: 15,
              },
            },
            {
              id: 'geo-u1-l2-s5',
              kind: 'synthesis',
              title: 'Oblique Solving Complete',
              takeaways: [
                'ASA -> third angle B = 180° − A − C -> Law of Sines.',
                'SAS/SSS -> Law of Cosines; check largest side opposes largest angle.',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'certainty-vault', packId: 'geometry-figures' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'geo-u1-l2-fc1',
              front: 'Side-Angle Ordering Theorem in any triangle',
              back: 'Longest side always lies opposite the largest interior angle; shortest side lies opposite the smallest angle.',
              explanation: 'Provides an instant sanity check after solving via Law of Sines or Cosines.',
              interleave: true,
            },
            {
              id: 'geo-u1-l2-fc2',
              front: 'Law of Sines equation',
              back: 'a / sin(A) = b / sin(B) = c / sin(C).',
              explanation: 'Used directly whenever one side and its opposite angle are known (e.g. ASA after B = 180° − A − C).',
              interleave: true,
            },
            {
              id: 'geo-u1-l2-fc3',
              front: 'Which triangle congruence cases fail to lock a unique triangle?',
              back: 'AAA (similar scales only) and SSA (can yield 0, 1, or 2 triangles in the ambiguous case).',
              explanation: 'SSS, SAS, ASA, and AAS always determine uniqueness.',
              interleave: true,
            },
          ],
        },
        {
          id: 'geo-u1-l3',
          unitId: 'geo-u1',
          title: 'Unit Circle Angles & Vector Projections',
          summary:
            'Connect radian arc angles to unit-circle coordinates and use dot products to test perpendicularity geometrically.',
          estimatedMinutes: 8,
          standards: ['CCSS.MATH.HSF.TF.A.1', 'CCSS.MATH.HSN.VM.B.4'],
          prerequisiteLessonIds: ['geo-u1-l2'],
          visual: { kind: 'model-2d', modelId: 'unit-circle-wave-2d' },
          steps: [
            {
              id: 'geo-u1-l3-s1',
              kind: 'narrative',
              title: 'From Triangle Chords to Directed Projections',
              bodyMarkdown:
                'Place unit vectors along angle $\\theta_1$ and $\\theta_2$ on the unit circle: $\\hat{\\mathbf{u}} = \\langle\\cos\\theta_1, \\sin\\theta_1\\rangle$. Taking $\\hat{\\mathbf{u}}\\cdot\\hat{\\mathbf{v}} = \\cos(\\theta_2 - \\theta_1)$ bridges circle trigonometry straight to Euclidean perpendicularity ($\\mathbf{u}\\cdot\\mathbf{v} = 0 \\iff 90^\\circ$).',
              callout: {
                tone: 'key-idea',
                text: 'Dot product equals zero whenever two nonzero vectors form a 90° corner.',
              },
            },
            {
              id: 'geo-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Track Vector Rotation Along the Unit Circle',
              predictionPrompt:
                'When a vector ⟨cos θ, sin θ⟩ rotates by +90° counterclockwise from ⟨4, 3⟩, what perpendicular vector matches its new orientation?',
              predictionChoices: ['⟨−4, −3⟩', '⟨−3, 4⟩', '⟨3, 4⟩', '⟨4, −3⟩'],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'unit-circle-wave-2d' },
              observeInstruction:
                'Rotate the angle by 90° in the interactive unit circle model and watch how horizontal x = cos θ and vertical y = sin θ trade roles with a sign flip.',
              explainPrompt: 'Verify ⟨4, 3⟩ · ⟨−3, 4⟩ =',
              explainOptions: ['−12 + 12 = 0 (orthogonal)', '25', '−24', '+24'],
              correctExplainIndex: 0,
              reconcileFeedback: 'Rotating (x, y) by +90° maps to (−y, x), guaranteeing zero dot product.',
            },
            {
              id: 'geo-u1-l3-s3',
              kind: 'worked-example',
              title: 'Finding Radians and Orthogonal Dot Checks Together',
              problemMarkdown: 'Convert $150^\\circ$ to exact radians and verify $\\mathbf{u}=\\langle 6,-2\\rangle$ is perpendicular to $\\mathbf{v}=\\langle 1,3\\rangle$.',
              steps: [
                {
                  label: 'Convert degrees to radians',
                  expressionOrAction: '150° × (π / 180°) = 5π / 6 rad ≈ 2.62 rad',
                  whyNote: 'Simplify 150/180 = 5/6 before appending π.',
                },
                {
                  label: 'Evaluate dot product',
                  expressionOrAction: 'u · v = 6(1) + (−2)(3) = 6 − 6 = 0 -> orthogonal (90°)!',
                  whyNote: 'Zero dot product proves perpendicularity without plotting.',
                },
              ],
            },
            {
              id: 'geo-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Dynamic Dot Product Computation',
              question: {
                type: 'figure',
                prompt: 'Compute the dot product u · v of the two vectors shown.',
                figure: {
                  template: 'vector-2d',
                  givens: { ux: 4, uy: 3, vx: -3, vy: 4 },
                  ask: 'dotProduct',
                  rounding: 'integer',
                  ranges: { ux: [-8, 8], uy: [-8, 8], vx: [-8, 8], vy: [-8, 8] },
                },
                explanation: 'Compute u · v = ux·vx + uy·vy; zero signals orthogonality (90°).',
                points: 15,
              },
            },
            {
              id: 'geo-u1-l3-s5',
              kind: 'synthesis',
              title: 'Geometry Core Track Complete',
              takeaways: [
                'Unit circle coordinates generalize right-triangle ratios smoothly to all angles in radians.',
                '2D dot product u·v measures perpendicularity (= 0) and alignment across triangles and trusses.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'diagram-scout', packId: 'geometry-figures' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'geo-u1-l3-fc1',
              front: 'Rotating point (x, y) counterclockwise by 90° about the origin',
              back: '(−y, x). Notice (x, y) · (−y, x) = −xy + xy = 0.',
              explanation: 'Explains why perpendicular line slopes are negative reciprocals.',
              interleave: true,
            },
            {
              id: 'geo-u1-l3-fc2',
              front: 'Why are radians dimensionless?',
              back: 'θ = arc length s / radius r divides two lengths (meters/meters), leaving a pure real number.',
              explanation: 'Essential for calculus trig derivatives and s = rθ.',
              interleave: true,
            },
            {
              id: 'geo-u1-l3-fc3',
              front: 'Exact dot product u · v in components vs magnitude-angle form',
              back: 'u_x v_x + u_y v_y = ||u|| ||v|| cos θ.',
              explanation: 'Bridges coordinates directly to angular geometry.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

const CALC_TRACK: CurriculumTrack = {
  id: 'track-multivariable-calculus-3d',
  slug: 'multivariable-calculus-3d',
  packId: 'multivariable-calculus-3d',
  title: 'Calculus: Limits, Derivatives & Volumes',
  category: 'Math',
  subject: 'Calculus',
  gradeBand: 'College-Intro',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-precalculus-trigonometry'],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'calc-u1',
      title: 'Rates, Accumulation & Solids of Revolution',
      anchoringPhenomenon:
        'Spinning a curved blade profile around an axis sweeps a 3D vase whose volume equals the sum of infinitely thin circular disks and washers.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'calc-u1-l1',
          unitId: 'calc-u1',
          title: 'The Fundamental Theorem: Slope & Area Duality',
          summary:
            'See how the rate at which accumulated area grows equals the height of the boundary curve f(x).',
          estimatedMinutes: 9,
          standards: ['AP Calculus AB/BC Units 3 & 6'],
          prerequisiteLessonIds: [],
          visual: { kind: 'model-2d', modelId: 'derivative-integral-ftc-2d' },
          steps: [
            {
              id: 'calc-u1-l1-s1',
              kind: 'narrative',
              title: 'Why Differentiation Undoes Integration',
              bodyMarkdown:
                'Imagine shading area $A(x) = \\int_a^x f(t)\\,dt$ beneath a height curve $y = f(t)$. Nudge the right edge slightly wider by $\\Delta x$: the new sliver added has width $\\Delta x$ and height $f(x)$, so area grows by $\\Delta A \\approx f(x)\\,\\Delta x$.\n\nDividing by $\\Delta x$ reveals the **Fundamental Theorem of Calculus**: **$\\frac{dA}{dx} = f(x)$**!',
              callout: {
                tone: 'key-idea',
                text: 'Derivative = instantaneous slope of tangent; Definite Integral = signed net accumulation under the curve.',
              },
            },
            {
              id: 'calc-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Link Curve Height to Integral Slope',
              predictionPrompt:
                'If velocity v(t) stays POSITIVE while decreasing from t = 2 to t = 5, what does net displacement x(t) = ∫ v(u) du do?',
              predictionChoices: [
                'Displacement decreases',
                'Displacement continues INCREASING, but at a slowing slope (concave down)',
                'Displacement stays flat at 0',
                'Acceleration becomes positive',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'derivative-integral-ftc-2d' },
              observeInstruction:
                'Sweep the upper bound x across positive-but-falling segments in the 2D FTC derivative/integral explorer and compare curve height f(x) with the tangent slope of A(x).',
              explainPrompt: 'What feature of f(x) controls whether A(x) is concave up vs concave down?',
              explainOptions: [
                'Since A′(x) = f(x), A″(x) = f′(x), so f′(x) < 0 makes A concave down even while A still rises',
                'Only the x-intercept of A(x)',
                'The sign of the lower limit a',
                'Whether f is negative everywhere',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Positive f(x) means A rises; falling f(x) means A′ decreases (f′ < 0), bending the accumulation curve downward.',
            },
            {
              id: 'calc-u1-l1-s3',
              kind: 'worked-example',
              title: 'Differentiating an Integral With FTC Part 1',
              problemMarkdown: 'Evaluate $\\frac{d}{dx} \\int_0^x \\cos(t^2)\\,dt$ at $x = 0$ without trying to integrate $\\cos(t^2)$ analytically.',
              steps: [
                {
                  label: 'Apply FTC Part 1 directly',
                  expressionOrAction: 'd/dx [∫₀ˣ cos(t²) dt] = cos(x²)',
                  whyNote: 'cos(t²) has no elementary antiderivative, yet FTC gives its derivative in one line!',
                },
                {
                  label: 'Substitute x = 0',
                  expressionOrAction: 'cos(0²) = cos(0) = 1.',
                  whyNote: 'Evaluates cleanly to 1.',
                },
              ],
            },
            {
              id: 'calc-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Chain Rule Rate Check',
              question: {
                type: 'mcq',
                prompt: 'Compute d/dx [e^(3x²)].',
                options: ['3x² e^(3x² − 1)', '6x e^(3x²)', 'e^(6x)', '3 e^(3x²)'],
                correct: 1,
                explanation: 'By Chain Rule, derivative of outer e^u is e^u, times inner derivative d/dx(3x²) = 6x.',
                points: 10,
              },
            },
            {
              id: 'calc-u1-l1-s5',
              kind: 'synthesis',
              title: 'FTC Foundation Locked',
              takeaways: [
                'd/dx ∫ₐˣ f(t) dt = f(x); ∫ₐᵇ f′(t) dt = f(b) − f(a).',
                'Sign of f controls whether accumulation rises/falls; slope f′ controls concavity of accumulation.',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'step-detective', packId: 'multivariable-calculus-3d' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'calc-u1-l1-fc1',
              front: 'Fundamental Theorem of Calculus Parts 1 & 2',
              back: 'Part 1: d/dx ∫ₐˣ f(t)dt = f(x). Part 2: ∫ₐᵇ F′(x)dx = F(b) − F(a).',
              explanation: 'Differentiation and definite integration are inverse operations.',
              interleave: true,
            },
            {
              id: 'calc-u1-l1-fc2',
              front: 'FTC Part 1 with Chain Rule: d/dx ∫ₐ^(g(x)) f(t) dt',
              back: 'f(g(x)) · g′(x).',
              explanation: 'Upper limit velocity g′(x) scales how fast boundary area sweeps horizontally.',
              interleave: true,
            },
            {
              id: 'calc-u1-l1-fc3',
              front: 'Why can average velocity equal instantaneous velocity at least once on [a, b]?',
              back: 'Mean Value Theorem: if f is continuous on [a,b] and differentiable on (a,b), ∃ c where f′(c) = (f(b)−f(a))/(b−a).',
              explanation: 'Parallel secant-tangent guarantee.',
              interleave: true,
            },
          ],
        },
        {
          id: 'calc-u1-l2',
          unitId: 'calc-u1',
          title: 'Solids of Revolution: Disks & Washers in 3D',
          summary:
            'Revolve 2D planar regions around an axis and integrate cross-sectional π(R² − r²) washers.',
          estimatedMinutes: 9,
          standards: ['AP Calculus AB/BC Unit 8'],
          prerequisiteLessonIds: ['calc-u1-l1'],
          visual: {
            kind: 'model-3d',
            modelId: 'solids',
            initialParams: { sweep: 270, washer: false, showSlice: true },
            highlightHotspots: ['curve', 'axis', 'slice'],
          },
          steps: [
            {
              id: 'calc-u1-l2-s1',
              kind: 'narrative',
              title: 'Slicing Rotated 3D Volumes Like Coins',
              bodyMarkdown:
                'Revolve a curve $y = R(x) \\ge 0$ around the $x$-axis and slice vertically at coordinate $x$: every slice is a thin circular coin of radius $R(x)$, thickness $dx$, and volume **$\\pi [R(x)]^2\\,dx$**.\n\nIf a hollow core of radius $r(x)$ sits inside an outer radius $R(x)$, drill out the inner disk first—giving washer area **$\\pi\\left(R(x)^2 - r(x)^2\\right)$**, **NEVER** $\\pi(R - r)^2$!',
              callout: {
                tone: 'pitfall',
                text: 'Subtract SQUARED radii π(R² − r²), not (R − r)²! Squaring first removes the inner circular hole cleanly.',
              },
            },
            {
              id: 'calc-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Compare Solid Disk vs Hollow Washer',
              predictionPrompt:
                'Between radii r = 2 and R = 5, what fraction of total area does the washer π(5² − 2²) capture compared to the mistaken formula π(5 − 2)²?',
              predictionChoices: [
                'They are identical (9π vs 9π)',
                'True washer is 21π, far larger than 9π because an outer ring holds much more circumference than an inner ring',
                'True washer is smaller (3π)',
                'True washer equals 25π',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'solids',
                initialParams: { sweep: 300, washer: true, showSlice: true },
                highlightHotspots: ['slice', 'axis'],
              },
              observeInstruction:
                'Toggle washer mode and sweep the revolution angle toward 360° in the 3D Solids of Revolution viewer while inspecting the cross-section slice.',
              explainPrompt: 'Why is the slice integral perpendicular to the x-axis expressed in dx?',
              explainOptions: [
                'Slices stacked side-by-side along the x-axis have thickness dx and circular faces perpendicular to the axis of rotation',
                'Because y² cancels dx',
                'Because washer radius only depends on dy',
                'To match cylinder surface perimeter instead of area',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Revolving around x makes each disk stand perpendicular to x with thickness dx; 5² − 2² = 21 ≠ (5−2)² = 9!',
            },
            {
              id: 'calc-u1-l2-s3',
              kind: 'worked-example',
              title: 'Disk Volume Under y = sqrt(x) on [0, 4]',
              problemMarkdown: 'Compute the exact volume obtained by revolving $y = \\sqrt{x}$ on $[0, 4]$ about the $x$-axis.',
              steps: [
                {
                  label: 'Set up radius R(x) = sqrt(x)',
                  expressionOrAction: 'V = π ∫₀⁴ (√x)² dx = π ∫₀⁴ x dx',
                  whyNote: 'Squaring sqrt(x) simplifies cleanly for x ≥ 0.',
                },
                {
                  label: 'Integrate and apply endpoints',
                  expressionOrAction: 'V = π [x² / 2]₀⁴ = π (16/2 − 0) = 8π cubic units.',
                  whyNote: 'Exact volume of the paraboloid cup.',
                },
              ],
            },
            {
              id: 'calc-u1-l2-s4',
              kind: 'checkpoint',
              title: 'Washer Area Formula Check',
              question: {
                type: 'mcq',
                prompt: 'Which integrand represents cross-sectional washer area between outer R(x) and inner r(x) around the x-axis?',
                options: ['π(R(x) − r(x))²', 'π(R(x)² − r(x)²)', '2π(R(x) − r(x))', 'πR(x)r(x)'],
                correct: 1,
                explanation: 'Outer disk πR² minus inner hollow disk πr² = π(R² − r²).',
                points: 15,
              },
            },
            {
              id: 'calc-u1-l2-s5',
              kind: 'synthesis',
              title: '3D Revolution Summary',
              takeaways: [
                'Disk: π ∫ [R(x)]² dx; Washer: π ∫ ([R(x)]² − [r(x)]²) dx when revolving around a horizontal axis.',
                'Always measure R(x) and r(x) as distances straight to the rotation axis (even if axis is y = k ≠ 0).',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'streak-siege', packId: 'multivariable-calculus-3d' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'calc-u1-l2-fc1',
              front: 'Washer Method formula around y = 0 on [a, b]',
              back: 'V = π ∫ₐᵇ ([R(x)]² − [r(x)]²) dx.',
              explanation: 'Square outer and inner radii before subtracting.',
              interleave: true,
            },
            {
              id: 'calc-u1-l2-fc2',
              front: 'How do radii change when revolving y = f(x) around horizontal line y = −2?',
              back: 'Radius becomes distance |f(x) − (−2)| = f(x) + 2 before squaring inside π ∫ R² dx.',
              explanation: 'Always measure distance perpendicular to the actual axis of revolution.',
              interleave: true,
            },
            {
              id: 'calc-u1-l2-fc3',
              front: 'Known-cross-section volume principle (Cavalieri)',
              back: 'V = ∫ₐᵇ A(x) dx for ANY shape of cross-section A(x) (squares s², semicircles πs²/8, equilateral triangles s²√3/4).',
              explanation: 'Disks are just the special case A(x) = πr².',
              interleave: true,
            },
          ],
        },
        {
          id: 'calc-u1-l3',
          unitId: 'calc-u1',
          title: 'Critical Points, Concavity & Closed-Interval Optimization',
          summary:
            'Locate horizontal tangents f′(x) = 0 and test both interior candidates and boundary endpoints.',
          estimatedMinutes: 8,
          standards: ['AP Calculus AB/BC Unit 5'],
          prerequisiteLessonIds: ['calc-u1-l1'],
          visual: {
            kind: 'figure-2d',
            figure: {
              template: 'parabola-vertex',
              givens: { a: -2, b: 8, c: 1 },
              ask: 'vertexY',
              rounding: 'integer',
              ranges: { a: [-4, -1], b: [-12, 12], c: [-6, 8] },
            },
          },
          steps: [
            {
              id: 'calc-u1-l3-s1',
              kind: 'narrative',
              title: 'Why Extrema Hide Either at Zero Slopes or at Fences',
              bodyMarkdown:
                'By Fermat’s theorem, any smooth local peak or valley inside an open interval must flatten to slope $f\'(x) = 0$ (or fail to differentiate at a sharp corner). On a closed interval $[a, b]$, however, the highest point could simply happen at one of the **endpoints** $a$ or $b$ before the curve ever flattens!',
              callout: {
                tone: 'key-idea',
                text: 'Closed Interval Method: test f at every interior critical point (f′ = 0 or DNE) AND both endpoints a, b.',
              },
            },
            {
              id: 'calc-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Check Vertex Maximum via f′(x) = 0',
              predictionPrompt:
                'For f(x) = −2x² + 8x + 1, setting f′(x) = 0 locates the peak at x = 2. How does f″(2) = −4 confirm it is a maximum rather than a minimum?',
              predictionChoices: [
                'f″(2) < 0 means concave down (frown), so the horizontal tangent is a peak',
                'f″(2) < 0 means a vertical asymptote',
                'f″(2) = −4 means the y-value is −4',
                'Negative f″ means an inflection point',
              ],
              correctPredictionIndex: 0,
              visual: {
                kind: 'figure-2d',
                figure: {
                  template: 'parabola-vertex',
                  givens: { a: -2, b: 8, c: 1 },
                  ask: 'vertexY',
                  rounding: 'integer',
                },
              },
              observeInstruction:
                'Inspect the downward-opening peak of −2x² + 8x + 1 at (2, 9) in the parabola plot.',
              explainPrompt: 'What happens if f′(c) = 0 AND f″(c) = 0 (like y = x³ at x = 0)?',
              explainOptions: [
                'The Second Derivative Test is inconclusive—check whether f′ actually changes sign across c',
                'c is automatically a maximum',
                'c is automatically a minimum',
                'The function is discontinuous at c',
              ],
              correctExplainIndex: 0,
              reconcileFeedback: 'At y = x³, f′(0) = f″(0) = 0, and slope stays positive on both sides, making (0, 0) a saddle inflection.',
            },
            {
              id: 'calc-u1-l3-s3',
              kind: 'branching-scenario',
              title: 'Spot a Missing Endpoint in Optimization',
              startNodeId: 'closed-opt',
              nodes: {
                'closed-opt': {
                  promptMarkdown:
                    'Find the **absolute maximum** of $f(x) = x^2 - 4x + 7$ on $[0, 5]$. Solving $f\'(x) = 2x - 4 = 0$ gives $x = 2$ where $f(2) = 3$. Is $3$ the maximum?',
                  choices: [
                    {
                      label: 'No! f(2) = 3 is the MINIMUM; check endpoints f(0) = 7 and f(5) = 12 (max = 12)',
                      nextNodeId: 'done',
                      feedback: 'Great catch! Evaluating f′=0 alone often lands you at a local minimum instead of the interval maximum.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Yes, because there is only one critical point x = 2',
                      nextNodeId: 'closed-opt',
                      feedback: 'Notice f″(2) = +2 > 0, so x = 2 is actually concave UP (minimum)! You must evaluate endpoints f(0) and f(5).',
                      outcome: 'unsafe',
                    },
                  ],
                },
                done: {
                  promptMarkdown: 'Which theorem guarantees both an absolute max and absolute min exist on [0, 5]?',
                  choices: [
                    {
                      label: 'Extreme Value Theorem (continuous function on a closed bounded interval [a, b])',
                      nextNodeId: null,
                      feedback: 'Correct! EVT guarantees existence, and Closed Interval Method locates them.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Squeeze Theorem',
                      nextNodeId: null,
                      feedback: 'Squeeze Theorem evaluates limits; Extreme Value Theorem guarantees closed-interval extrema.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'calc-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Dynamic Vertex Extremum Value',
              question: {
                type: 'figure',
                prompt: 'Find the maximum value (vertex y-coordinate) of the downward parabola shown. Round to the nearest integer.',
                figure: {
                  template: 'parabola-vertex',
                  givens: { a: -2, b: 8, c: 1 },
                  ask: 'vertexY',
                  rounding: 'integer',
                  ranges: { a: [-4, -1], b: [-12, 12], c: [-6, 8] },
                },
                explanation: 'Set f′(x) = 2ax + b = 0 -> x = −b/(2a), then substitute x back into f(x) to find the maximum height.',
                points: 15,
              },
            },
            {
              id: 'calc-u1-l3-s5',
              kind: 'synthesis',
              title: 'Calculus Starter Track Complete',
              takeaways: [
                'Set f′(x) = 0 to find critical candidates, use f″(x) or sign charts to classify peaks vs valleys, and always compare endpoints on [a, b].',
                'Integrate disk/washer slices π(R² − r²) along the axis of symmetry.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'certainty-vault', packId: 'multivariable-calculus-3d' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'calc-u1-l3-fc1',
              front: 'First vs Second Derivative Tests at a critical point c where f′(c) = 0',
              back: 'First Deriv: f′ switches + to − => local max (− to + => min). Second Deriv: f″(c) < 0 => max; f″(c) > 0 => min.',
              explanation: 'Use First Derivative sign chart whenever f″(c) = 0 or DNE.',
              interleave: true,
            },
            {
              id: 'calc-u1-l3-fc2',
              front: 'What defines an inflection point vs simply f″(x) = 0?',
              back: 'f″(x) must actually CHANGE SIGN (+ to − or − to +) at x, not merely touch zero (e.g., x⁴ has f″(0)=0 but no concavity change).',
              explanation: 'Always test sign on both sides of f″(x) = 0.',
              interleave: true,
            },
            {
              id: 'calc-u1-l3-fc3',
              front: 'Two requirements for the Extreme Value Theorem to guarantee absolute max & min',
              back: '1) f must be continuous across 2) a closed, bounded interval [a, b].',
              explanation: 'Discontinuities or open intervals (a, b) can allow extrema to escape.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

const STAT_TRACK: CurriculumTrack = {
  id: 'track-probability-statistics',
  slug: 'probability-statistics',
  packId: 'probability-statistics',
  title: 'Statistics: Distributions & Inference',
  category: 'Math',
  subject: 'Statistics',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-quantitative-foundations'],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'stat-u1',
      title: 'Sampling Distributions, Normal Tails & Bayesian Inference',
      anchoringPhenomenon:
        'Even when individual dice or skewed wait-times look jagged, averaging dozens of observations converges onto a smooth bell curve whose width shrinks by 1/√n.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'stat-u1-l1',
          unitId: 'stat-u1',
          title: 'The Central Limit Theorem & Standard Error',
          summary:
            'Explore why sample means x-bar turn bell-shaped and why halving standard error requires quadrupling sample size n.',
          estimatedMinutes: 8,
          standards: ['CCSS.MATH.HSS.IC.A.1', 'AP Statistics Unit 5'],
          prerequisiteLessonIds: [],
          visual: { kind: 'model-2d', modelId: 'clt-sampling-inference-2d' },
          steps: [
            {
              id: 'stat-u1-l1-s1',
              kind: 'narrative',
              title: 'Why Averages Cancel Extreme Luck',
              bodyMarkdown:
                'Take 1 random skewed draw and anything can happen. Take the **average** of $n = 36$ independent draws and wild highs tend to balance wild lows. By the **Central Limit Theorem (CLT)**, for large $n$ the sampling distribution of $\\bar{x}$ approaches a **Normal** curve centered at $\\mu$ with **standard error** $\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}$.',
              callout: {
                tone: 'key-idea',
                text: 'Because n sits inside a square root in σ / √n, cutting error margin in HALF requires 4× as many observations!',
              },
            },
            {
              id: 'stat-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Simulate Sample Size Growth in CLT Lab',
              predictionPrompt:
                'When sample size n increases from 4 to 36 in the CLT simulator on a skewed parent distribution, what changes on the histogram of sample means?',
              predictionChoices: [
                'The center μ shifts right by 3×',
                'The histogram becomes bell-shaped (symmetric) AND shrinks to 1/3 its previous spread (√36 / √4 = 3)',
                'The spread shrinks to 1/9 its previous width',
                'The histogram turns even more skewed',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'clt-sampling-inference-2d' },
              observeInstruction:
                'Increase sample size n in the 2D CLT Sampling Inference explorer and compare spread when n quadruples or grows 9×.',
              explainPrompt: 'Why do independent random errors add as variances σ² instead of standard deviations σ?',
              explainOptions: [
                'Variance Var(X ± Y) = Var(X) + Var(Y) adds quadratically, so SD of sum grows like √n while dividing by n leaves σ/√n',
                'Standard deviations subtract in large samples',
                'Variance divides by n² while SD stays constant',
                'Skewness adds linearly to sample size',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Independent variances accumulate cleanly (+σ² per draw); taking the square root yields √n·σ for sums and σ/√n for averages.',
            },
            {
              id: 'stat-u1-l1-s3',
              kind: 'worked-example',
              title: 'Sizing a Survey for Target Margin of Error',
              problemMarkdown: 'A baseline poll of $n = 100$ households has margin of error $\\pm 8\\%$. How large a sample cuts margin of error to $\\pm 2\\%$?',
              steps: [
                {
                  label: 'Compute required error-reduction factor',
                  expressionOrAction: '8% / 2% = 4× narrower margin',
                  whyNote: 'We need √n to grow by a factor of 4.',
                },
                {
                  label: 'Square the factor to scale sample size n',
                  expressionOrAction: '4² = 16 -> n_new = 16 × 100 = 1,600 households.',
                  whyNote: 'Verifying: σ/√1600 = (1/4)(σ/√100) cleanly gives ±2%.',
                },
              ],
            },
            {
              id: 'stat-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Standard Error Scaling',
              question: {
                type: 'mcq',
                prompt: 'To reduce the standard error σ/√n by a factor of 3, sample size n must be multiplied by:',
                options: ['3', '6', '9', 'sqrt(3)'],
                correct: 2,
                explanation: 'Since √(9n) = 3√n sits in the denominator, multiplying n by 9 divides SE by 3.',
                points: 10,
              },
            },
            {
              id: 'stat-u1-l1-s5',
              kind: 'synthesis',
              title: 'CLT Foundations Complete',
              takeaways: [
                'Sample mean SD shrinks as σ/√n (4× n -> ½ error; 9× n -> ⅓ error).',
                'Variances ALWAYS add for independent X + Y or X − Y: SD(X − Y) = sqrt(SD(X)² + SD(Y)²).',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'certainty-vault', packId: 'probability-statistics' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'stat-u1-l1-fc1',
              front: 'Standard Error of the sample mean x-bar',
              back: 'SE(x-bar) = σ / √n (estimated by s / √n when σ is unknown).',
              explanation: 'Explains the diminishing returns of increasing sample size.',
              interleave: true,
            },
            {
              id: 'stat-u1-l1-fc2',
              front: 'Why does SD(X − Y) equal √(σ_x² + σ_y²) instead of σ_x − σ_y?',
              back: 'For independent random variables, subtracting X − Y adds uncertainty from both variables, so variances add positively.',
              explanation: 'Var(X − Y) = Var(X) + (−1)²Var(Y) = Var(X) + Var(Y).',
              interleave: true,
            },
            {
              id: 'stat-u1-l1-fc3',
              front: 'Sample size condition for CLT on heavily skewed data',
              back: 'Typically n ≥ 30 is sufficient for moderate skew; already-Normal populations satisfy Normal sampling for any n.',
              explanation: 'Stronger skew requires larger n to smooth the sampling distribution.',
              interleave: true,
            },
          ],
        },
        {
          id: 'stat-u1-l2',
          unitId: 'stat-u1',
          title: 'Z-Scores, Percentiles & Tail Probabilities',
          summary:
            'Standardize diverse Normal curves onto N(0, 1) to compute upper-tail, percentile, and two-tailed p-values.',
          estimatedMinutes: 9,
          standards: ['CCSS.MATH.HSS.ID.A.4'],
          prerequisiteLessonIds: ['stat-u1-l1'],
          visual: {
            kind: 'figure-2d',
            figure: {
              template: 'normal-curve',
              givens: { mean: 500, sd: 100, x: 700 },
              ask: 'upperTail',
              rounding: 'tenth',
              ranges: { mean: [400, 600], sd: [50, 120], x: [580, 760] },
            },
          },
          steps: [
            {
              id: 'stat-u1-l2-s1',
              kind: 'narrative',
              title: 'How One Standard Ruler Measures Every Bell Curve',
              bodyMarkdown:
                'How does scoring 700 on a scale with mean 500 and SD 100 compare to scoring 130 with mean 100 and SD 15? Compute the dimensionless **$z$-score** $= \\frac{x - \\mu}{\\sigma}$.\n\nBoth reach **$z = +2.0$** standard deviations above average! By symmetry, total probability equals 1 (100%): upper tail $P(X \\ge x) = 1 - \\Phi(z)$, while two-tailed probability doubles one tail: $2\\,(1 - \\Phi(|z|))$.',
              callout: {
                tone: 'key-idea',
                text: '68–95–99.7 Empirical Rule: ~68% lies within ±1σ, ~95% within ±2σ (leaving ~2.5% in each tail), and ~99.7% within ±3σ.',
              },
            },
            {
              id: 'stat-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Predict Upper Tail Beyond +2σ',
              predictionPrompt:
                'Using the 68–95–99.7 rule, roughly what percentage of observations on a Normal curve exceed μ + 2σ?',
              predictionChoices: ['5%', 'About 2.5% (exact 2.3%)', '16%', '0.15%'],
              correctPredictionIndex: 1,
              visual: {
                kind: 'figure-2d',
                figure: {
                  template: 'normal-curve',
                  givens: { mean: 500, sd: 100, x: 700 },
                  ask: 'upperTail',
                  rounding: 'tenth',
                },
              },
              observeInstruction:
                'Inspect the shaded right-hand tail above x = 700 (z = +2.0) on the Normal curve diagram.',
              explainPrompt: 'Why is the single upper tail ~2.5% rather than 5%?',
              explainOptions: [
                '95% lies inside [−2σ, +2σ], splitting the remaining 5% equally across LEFT (< −2σ) and RIGHT (> +2σ) tails',
                'Because bell curves are skewed left',
                'Because SD subtracts 2.5%',
                'Because 100 − 95 = 2.5',
              ],
              correctExplainIndex: 0,
              reconcileFeedback: 'Symmetric 5% outside ±2σ puts ~2.5% (2.28%) in the upper tail alone and 5% two-tailed.',
            },
            {
              id: 'stat-u1-l2-s3',
              kind: 'worked-example',
              title: 'Interpreting a P-Value Without Flipping Conditionals',
              problemMarkdown: 'A clinical trial reports a two-tailed $p$-value of $0.03$ against null $H_0$. State its exact statistical meaning.',
              steps: [
                {
                  label: 'Identify the conditioning assumption',
                  expressionOrAction: 'p = P(Data at least as extreme as observed | H₀ is TRUE) = 0.03.',
                  whyNote: 'A p-value always conditions on H₀ being true—NEVER on observed data.',
                },
                {
                  label: 'Separate p from P(H₀ true | data)',
                  expressionOrAction: 'It is FALSE to claim "3% chance H₀ is true"; rather, if H₀ held, random sampling would give results this extreme only 3% of the time.',
                  whyNote: 'Avoiding this transposed-conditional error is essential in inference.',
                },
              ],
            },
            {
              id: 'stat-u1-l2-s4',
              kind: 'checkpoint',
              title: 'Dynamic Upper-Tail Normal Probability',
              question: {
                type: 'figure',
                prompt: 'Compute the upper-tail percentage P(X ≥ x) for the labeled Normal distribution (nearest tenth).',
                figure: {
                  template: 'normal-curve',
                  givens: { mean: 100, sd: 15, x: 124 },
                  ask: 'upperTail',
                  rounding: 'tenth',
                  ranges: { mean: [80, 120], sd: [10, 20], x: [115, 145] },
                },
                explanation: 'Standardize z = (x − μ)/σ and compute upper-tail percentage 100 × (1 − Φ(z)).',
                points: 15,
              },
            },
            {
              id: 'stat-u1-l2-s5',
              kind: 'synthesis',
              title: 'Standard Normal Tails Summary',
              takeaways: [
                'z = (x − μ)/σ counts signed standard deviations above/below mean.',
                'p-value = P(data ≥ extreme | H₀ true)—never the probability that H₀ is true.',
              ],
              nextQuizIndex: 0,
              arcadeLaunch: { mode: 'cloze-workbench', packId: 'probability-statistics' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'stat-u1-l2-fc1',
              front: 'What is a p-value, precisely?',
              back: 'P(observing data as extreme or more extreme | H₀ is true). It is NOT P(H₀ is true | data).',
              explanation: 'Reversing P(A|B) and P(B|A) is the prosecutor’s fallacy.',
              interleave: true,
            },
            {
              id: 'stat-u1-l2-fc2',
              front: 'Critical z* for a symmetric 95% vs 99% confidence interval',
              back: '95% -> z* ≈ 1.96 (2.5% per tail); 99% -> z* ≈ 2.576 (0.5% per tail).',
              explanation: 'Higher confidence requires a wider margin of error at fixed n.',
              interleave: true,
            },
            {
              id: 'stat-u1-l2-fc3',
              front: 'Type I vs Type II Error',
              back: 'Type I (prob α): rejecting true H₀ (false alarm). Type II (prob β): failing to reject false H₀ (missed effect). Power = 1 − β.',
              explanation: 'Lowering α strictly raises β unless sample size n increases.',
              interleave: true,
            },
          ],
        },
        {
          id: 'stat-u1-l3',
          unitId: 'stat-u1',
          title: 'Bayes’ Theorem & Base-Rate Natural Frequencies',
          summary:
            'Combine prior prevalence with test sensitivity and false-positive rates using natural frequency trees.',
          estimatedMinutes: 9,
          standards: ['CCSS.MATH.HSS.CP.A.4', 'CCSS.MATH.HSS.CP.B.6'],
          prerequisiteLessonIds: ['stat-u1-l2'],
          visual: { kind: 'model-2d', modelId: 'bayes-natural-frequency-2d' },
          steps: [
            {
              id: 'stat-u1-l3-s1',
              kind: 'narrative',
              title: 'Why 99% Accurate Tests Still Mislead on Rare Conditions',
              bodyMarkdown:
                'Suppose a condition affects **1 in 1,000** people (0.1% prior), and a rapid screen has **99% sensitivity** and a **5% false-positive rate**. Test 10,000 people: only **10** truly have the condition (~10 true positives), while **9,990 × 0.05 ≈ 500** healthy people trigger **false positives**!\n\nSeeing whole people in **natural frequencies** makes Bayes obvious: positive predictive value is only **$10 / (10 + 500) \\approx 2\\%$**, not 99%!',
              callout: {
                tone: 'pitfall',
                text: 'Base-rate neglect confuses P(Positive | Sick) with P(Sick | Positive)—always compare true positives against ALL positives (TP + FP).',
              },
            },
            {
              id: 'stat-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Test Prior Prevalence in the Bayes Visualizer',
              predictionPrompt:
                'Keeping test accuracy fixed (high sensitivity, 5% false positives), what happens to P(Sick | Positive) if true prevalence rises from 0.1% to 20%?',
              predictionChoices: [
                'P(Sick | Positive) stays stuck near 2%',
                'P(Sick | Positive) jumps dramatically past 80% because true positives now swamp false alarms',
                'P(Sick | Positive) drops toward zero',
                'Sensitivity changes automatically',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'bayes-natural-frequency-2d' },
              observeInstruction:
                'Slide prior prevalence upward in the 2D Bayes Natural Frequency model and watch the true-positive vs false-positive ratio shift inside the positive pool.',
              explainPrompt: 'What ratio defines the posterior probability P(H | E)?',
              explainOptions: [
                'True Positives / (True Positives + False Positives) = P(E|H)P(H) / P(E)',
                'True Positives / Total Healthy Population',
                'False Positives / True Positives',
                'P(E | H) alone regardless of P(H)',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Bayes’ Theorem simply restricts the universe to everyone who got Positive evidence E, then takes the fraction belonging to hypothesis H.',
            },
            {
              id: 'stat-u1-l3-s3',
              kind: 'branching-scenario',
              title: 'Diagnose a Transposed Medical Headline',
              startNodeId: 'headline',
              nodes: {
                headline: {
                  promptMarkdown:
                    'A headline states: *"A new screen catches 95% of cases and has only 2% false alarms—so a positive test means you have a 95% chance of illness."* Disease prevalence is **1%**. Out of **1,000** tested people, compute TP vs FP first.',
                  choices: [
                    {
                      label: '10 sick (~9.5 TP) vs 990 healthy (~19.8 FP) -> Posterior ≈ 9.5 / 29.3 ≈ 32%',
                      nextNodeId: 'follow-up',
                      feedback:
                        'Clean work! Out of ~29.3 positive tests total, over two-thirds come from the large healthy group!',
                      outcome: 'optimal',
                    },
                    {
                      label: 'About 950 TP vs 20 FP -> 98% chance',
                      nextNodeId: 'headline',
                      feedback: 'Wait: only 1% of 1,000 = 10 people are sick, not 950! Re-apply the 1% prior.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
                'follow-up': {
                  promptMarkdown:
                    'Why would running a SECOND independent confirmatory test (same specs) raise posterior odds sharply if it also tests positive?',
                  choices: [
                    {
                      label: 'Because the posterior ~32% becomes the NEW prior for test #2!',
                      nextNodeId: null,
                      feedback:
                        'Yes! Sequential Bayesian updating uses the previous posterior as the next prior, quickly driving confidence above 95%.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Because averaging two tests halves sensitivity',
                      nextNodeId: null,
                      feedback: 'Two independent tests multiply the likelihood ratio by ~47.5× a second time.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'stat-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Natural Frequency Posterior Check',
              question: {
                type: 'fill',
                prompt:
                  'In a population of 1,000 items, 20 are defective. A scanner flags 18 defective items and 12 good items. What percentage (nearest integer, 0-100) of flagged items are truly defective?',
                correct: '60',
                alternatives: ['60%'],
                explanation: 'Total flagged = 18 + 12 = 30. Fraction defective = 18 / 30 = 0.60 = 60%.',
                points: 15,
              },
            },
            {
              id: 'stat-u1-l3-s5',
              kind: 'synthesis',
              title: 'Statistics & Inference Complete',
              takeaways: [
                'Always build a 1,000-person natural-frequency table (TP, FN, FP, TN) to defeat base-rate neglect.',
                'Posterior P(H | E) depends critically on both likelihood ratio AND prior base rate P(H).',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'boss-raid', packId: 'probability-statistics' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'stat-u1-l3-fc1',
              front: 'Bayes’ Theorem equation',
              back: 'P(H | E) = [P(E | H) · P(H)] / [P(E | H)·P(H) + P(E | ¬H)·P(¬H)].',
              explanation: 'Numerator is True Positives; denominator is ALL Positives (TP + FP).',
              interleave: true,
            },
            {
              id: 'stat-u1-l3-fc2',
              front: 'What is Base-Rate Neglect?',
              back: 'Ignoring low prior prevalence P(H) when judging test results, mistakenly treating high test sensitivity P(+|H) as posterior P(H|+).',
              explanation: 'Even tiny false-positive rates swamp rare true cases in large populations.',
              interleave: true,
            },
            {
              id: 'stat-u1-l3-fc3',
              front: 'How do two independent sequential positive tests update belief?',
              back: 'First posterior becomes the second test’s prior (multiplying prior odds by the likelihood ratio each time).',
              explanation: 'Bayesian updating naturally chains evidence.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

export const STEM_MATH_PACKS: ContentPack[] = [
  // 1. ALGEBRA
  {
    id: 'algebra-linear-systems',
    name: 'Algebra: Linear & Quadratic Systems',
    description:
      'Coordinate-plane lines, slope-intercept mastery, quadratic vertices, discriminants, and real-world system modeling.',
    subject: 'Algebra',
    category: 'Math',
    icon: '📈',
    modelId: 'linear-transform-eigen-2d',
    relatedModelIds: ['derivative-integral-ftc-2d'],
    standards: 'Common Core HSA-REI · HSA-CED · HSF-IF',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: ['quantitative-foundations'],
    track: ALG_TRACK,
    units: ALG_TRACK.units,
    quizzes: [
      {
        title: 'Slope & Intercept Essentials',
        description: 'Read coordinate lines, compute slopes, and find intercepts with confidence.',
        subject: 'Algebra',
        difficulty: 'easy',
        timeLimitSec: 480,
        srsInterleave: true,
        lessonId: 'alg-u1-l1',
        modelId: 'linear-transform-eigen-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the slope m of the line passing through P₁ and P₂. Round to the nearest tenth.',
            figure: {
              template: 'coordinate-line',
              givens: { x1: -2, y1: 1, x2: 4, y2: 10 },
              ask: 'slope',
              rounding: 'tenth',
              ranges: { x1: [-6, -1], y1: [-8, 8], x2: [1, 7], y2: [-8, 8] },
            },
            points: 10,
            explanation: 'Use m = (y₂ − y₁) / (x₂ − x₁), matching vertical rise divided by horizontal run.',
          },
          {
            type: 'figure',
            prompt: 'Find the y-intercept b of the line shown. Round to the nearest integer.',
            figure: {
              template: 'coordinate-line',
              givens: { x1: 2, y1: 7, x2: 6, y2: 15 },
              ask: 'yIntercept',
              rounding: 'integer',
              ranges: { x1: [-6, -1], y1: [-8, 12], x2: [1, 7], y2: [-8, 16] },
            },
            points: 10,
            explanation: 'Compute slope m = (y₂ − y₁)/(x₂ − x₁) first, then solve y₁ = m·x₁ + b for b.',
          },
          {
            type: 'mcq',
            prompt: 'Which line is perpendicular to y = (2/3)x − 5?',
            options: ['y = (2/3)x + 5', 'y = −(3/2)x + 1', 'y = (3/2)x − 1', 'y = −(2/3)x + 4'],
            correct: 1,
            points: 10,
            explanation: 'Perpendicular slopes are negative reciprocals: m⊥ = −1 / (2/3) = −3/2.',
          },
          {
            type: 'truefalse',
            prompt: 'A horizontal line y = 4 has a slope of 0.',
            correct: true,
            points: 10,
            explanation: 'Horizontal lines have zero vertical change (Δy = 0) for any horizontal run.',
          },
        ],
      },
      {
        title: 'Quadratics & Parabola Architecture',
        description: 'Locate vertices, axes of symmetry, and discriminants from standard form.',
        subject: 'Algebra',
        difficulty: 'medium',
        timeLimitSec: 600,
        srsInterleave: true,
        lessonId: 'alg-u1-l2',
        modelId: 'linear-transform-eigen-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the x-coordinate of the vertex (h) for this parabola.',
            figure: {
              template: 'parabola-vertex',
              givens: { a: 2, b: -12, c: 10 },
              ask: 'vertexX',
              rounding: 'tenth',
              ranges: { a: [1, 4], b: [-14, 14], c: [-10, 12] },
            },
            points: 10,
            explanation: 'Axis of symmetry lies at h = −b / (2a).',
          },
          {
            type: 'figure',
            prompt: 'Compute the discriminant Δ = b² − 4ac for the quadratic shown.',
            figure: {
              template: 'parabola-vertex',
              givens: { a: 1, b: -6, c: 5 },
              ask: 'discriminant',
              rounding: 'integer',
              ranges: { a: [1, 4], b: [-10, 10], c: [-8, 8] },
            },
            points: 10,
            explanation: 'Compute Δ = b² − 4ac: positive gives two real roots, zero gives one repeated root, negative gives none.',
          },
          {
            type: 'fill',
            prompt: 'In vertex form y = a(x − h)² + k, if a < 0 the parabola opens ______.',
            correct: 'downward',
            alternatives: ['down', 'downwards'],
            points: 10,
            explanation: 'A negative leading coefficient reflects the parabola vertically so its vertex is a maximum.',
          },
          {
            type: 'order',
            prompt: 'Order the steps to solve x² + 6x − 7 = 0 by completing the square:',
            options: [
              'Move the constant to get x² + 6x = 7',
              'Add (6/2)² = 9 to both sides: x² + 6x + 9 = 16',
              'Factor the left side as (x + 3)² = 16',
              'Take square roots: x + 3 = ±4, giving x = 1 or x = −7',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'Isolate the constant, add (b/2)², factor the perfect square trinomial, then extract roots.',
          },
        ],
      },
      {
        title: 'Nonlinear Systems & Distance Mastery',
        description: 'Roots, distance formula, and multi-equation algebraic synthesis.',
        subject: 'Algebra',
        difficulty: 'hard',
        timeLimitSec: 720,
        srsInterleave: true,
        lessonId: 'alg-u1-l3',
        modelId: 'linear-transform-eigen-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the larger real root of the parabola shown. Round to the nearest integer.',
            figure: {
              template: 'parabola-vertex',
              givens: { a: 1, b: -5, c: -14 },
              ask: 'greaterRoot',
              rounding: 'integer',
              ranges: { a: [1, 3], b: [-10, 10], c: [-16, -1] },
            },
            points: 15,
            explanation: 'Since a > 0, apply the + branch of the quadratic formula: (−b + √(b² − 4ac)) / (2a).',
          },
          {
            type: 'figure',
            prompt: 'Find the exact Euclidean distance between P₁ and P₂.',
            figure: {
              template: 'coordinate-line',
              givens: { x1: -3, y1: -1, x2: 5, y2: 14 },
              ask: 'distance',
              rounding: 'integer',
              ranges: { x1: [-6, -1], y1: [-6, 6], x2: [1, 7], y2: [-6, 14] },
            },
            points: 15,
            explanation: 'Distance d = √((x₂ − x₁)² + (y₂ − y₁)²) via the Pythagorean theorem.',
          },
          {
            type: 'mcq',
            prompt: 'For which value of k does x² + kx + 9 = 0 have exactly one repeated real root (k > 0)?',
            options: ['3', '6', '9', '18'],
            correct: 1,
            points: 15,
            explanation: 'Set discriminant Δ = k² − 4(1)(9) = 0 ⇒ k² = 36 ⇒ k = 6 for k > 0.',
          },
          {
            type: 'fill',
            prompt: 'If f(x) = 2x − 3 and g(x) = x² + 1, what is f(g(3))?',
            correct: '17',
            alternatives: [],
            points: 15,
            explanation: 'g(3) = 3² + 1 = 10, then f(10) = 2(10) − 3 = 17.',
          },
        ],
      },
    ],
  },

  // 2. GEOMETRY (retains canonical id 'geometry-figures', expanded to 3 tiers)
  {
    id: 'geometry-figures',
    name: 'Geometry: Figures, Trig & Trusses',
    description:
      'Angle-chasing, area, circles, unit-circle trigonometry, and structural triangle rigidity built on parametric figures.',
    subject: 'Geometry',
    category: 'Math',
    icon: '📐',
    modelId: 'geodesic-truss',
    relatedModelIds: ['solids', 'unit-circle-wave-2d'],
    standards: 'Common Core HSG-SRT · HSG-C · HSG-GMD',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: ['quantitative-foundations'],
    track: GEO_TRACK,
    units: GEO_TRACK.units,
    quizzes: [
      {
        title: 'Circles, Right Triangles & Trapezoids',
        description: 'Core Euclidean formulas for right triangles, circles, and quadrilaterals.',
        subject: 'Geometry',
        difficulty: 'easy',
        timeLimitSec: 540,
        srsInterleave: true,
        lessonId: 'geo-u1-l1',
        modelId: 'geodesic-truss',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the hypotenuse c. Round to the nearest tenth.',
            figure: {
              template: 'right-triangle',
              givens: { a: 3, b: 4 },
              ask: 'c',
              rounding: 'tenth',
              ranges: { a: [3, 12], b: [4, 16] },
            },
            points: 10,
            explanation: 'Pythagorean theorem: c = √(a² + b²).',
          },
          {
            type: 'figure',
            prompt: 'Find the area of the circle. Round to the nearest tenth.',
            figure: {
              template: 'circle',
              givens: { r: 6 },
              ask: 'area',
              rounding: 'tenth',
              ranges: { r: [3, 15] },
            },
            points: 10,
            explanation: 'Circle area formula: A = πr².',
          },
          {
            type: 'figure',
            prompt: 'Find the area of the trapezoid.',
            figure: {
              template: 'trapezoid',
              givens: { b1: 10, b2: 6, h: 4 },
              ask: 'area',
              rounding: 'integer',
              ranges: { b1: [4, 14], b2: [6, 18], h: [3, 12] },
            },
            points: 10,
            explanation: 'Trapezoid area equals average parallel base times perpendicular height: ½(b₁ + b₂)h.',
          },
          {
            type: 'truefalse',
            prompt: 'Triangles are structurally rigid: fixing all three side lengths uniquely locks the interior angles.',
            correct: true,
            points: 10,
            explanation: 'By SSS congruence, three fixed edge lengths allow zero angular deformation — why geodesic domes use triangles.',
          },
        ],
      },
      {
        title: 'Triangle Quest: Sines & Cosines',
        description: 'Solve oblique triangles with the Law of Sines and Law of Cosines.',
        subject: 'Geometry',
        difficulty: 'medium',
        timeLimitSec: 600,
        srsInterleave: true,
        lessonId: 'geo-u1-l2',
        modelId: 'geodesic-truss',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the length of side a. Round to the nearest tenth.',
            figure: {
              template: 'triangle-sas',
              givens: { b: 7, c: 5, angleA: 40 },
              ask: 'a',
              rounding: 'tenth',
              ranges: { b: [5, 14], c: [5, 14], angleA: [30, 120] },
            },
            points: 10,
            explanation: 'Law of cosines: a = √(b² + c² − 2bc·cos(A)).',
          },
          {
            type: 'figure',
            prompt: 'Given side lengths a, b, and c in the triangle diagram, find angle A (opposite side a) to the nearest degree.',
            figure: {
              template: 'triangle-sss',
              givens: { a: 5, b: 6, c: 7 },
              ask: 'angleA',
              rounding: 'integer',
              ranges: { a: [6, 10], b: [6, 10], c: [6, 10] },
            },
            points: 10,
            explanation: 'Rearrange Law of Cosines: cos(A) = (b² + c² − a²) / (2bc), then apply arccos.',
          },
          {
            type: 'figure',
            prompt: 'In the ASA triangle shown (base side b between angles A and C), find side a opposite angle A. Round to the nearest tenth.',
            figure: {
              template: 'triangle-asa',
              givens: { angleA: 45, b: 12, angleC: 60 },
              ask: 'a',
              rounding: 'tenth',
              ranges: { angleA: [25, 65], b: [8, 20], angleC: [25, 65] },
            },
            points: 15,
            explanation: 'Find angle B = 180° − A − C, then apply Law of Sines: a = b · sin(A) / sin(B).',
          },
          {
            type: 'mcq',
            prompt: 'You know two sides and the included angle of a triangle. Which law finds the third side directly?',
            options: ['Law of sines', 'Law of cosines', 'Pythagorean theorem', 'Tangent ratio'],
            correct: 1,
            points: 10,
            explanation: 'The law of cosines handles SAS directly: a² = b² + c² − 2bc·cos(A).',
          },
          {
            type: 'fill',
            prompt: 'By Euler’s polyhedron formula for a convex polyhedron, V − E + F equals ______.',
            correct: '2',
            alternatives: ['two'],
            points: 10,
            explanation: 'Every convex polyhedron and closed geodesic sphere satisfies V − E + F = 2.',
          },
        ],
      },
      {
        title: 'Unit Circle & Spatial Vectors',
        description: 'Radian conversion, unit-circle projections, and 2D vector geometry.',
        subject: 'Geometry',
        difficulty: 'hard',
        timeLimitSec: 720,
        srsInterleave: true,
        lessonId: 'geo-u1-l3',
        modelId: 'geodesic-truss',
        questions: [
          {
            type: 'figure',
            prompt: 'Evaluate cos(θ) on the unit circle for the plotted angle θ. Round to the nearest tenth.',
            figure: {
              template: 'unit-circle',
              givens: { angleDeg: 60 },
              ask: 'cos',
              rounding: 'tenth',
              ranges: { angleDeg: [15, 345] },
            },
            points: 15,
            explanation: 'cos(θ) equals the horizontal x-coordinate on the unit circle.',
          },
          {
            type: 'figure',
            prompt: 'Convert the plotted angle θ on the unit circle to radians. Round to the nearest hundredth.',
            figure: {
              template: 'unit-circle',
              givens: { angleDeg: 180 },
              ask: 'radians',
              rounding: 'hundredth',
              ranges: { angleDeg: [15, 345] },
            },
            points: 15,
            explanation: 'Multiply angle in degrees by π / 180° to convert to radians.',
          },
          {
            type: 'figure',
            prompt: 'Compute the dot product u · v of the two vectors shown.',
            figure: {
              template: 'vector-2d',
              givens: { ux: 4, uy: 3, vx: -3, vy: 4 },
              ask: 'dotProduct',
              rounding: 'integer',
              ranges: { ux: [-8, 8], uy: [-8, 8], vx: [-8, 8], vy: [-8, 8] },
            },
            points: 15,
            explanation: 'Dot product equals u · v = ux·vx + uy·vy; zero signals orthogonality (90°).',
          },
          {
            type: 'order',
            prompt: 'Order these angles from smallest to largest radian measure:',
            options: ['30° (π/6)', '45° (π/4)', '120° (2π/3)', '270° (3π/2)'],
            correct: [0, 1, 2, 3],
            points: 15,
            explanation: 'π/6 < π/4 < 2π/3 < 3π/2.',
          },
        ],
      },
    ],
  },

  // 3. CALCULUS
  {
    id: 'multivariable-calculus-3d',
    name: 'Calculus: Limits, Derivatives & Volumes',
    description:
      'Limits, instantaneous rates of change, optimization, Fundamental Theorem of Calculus, and 3D solids of revolution.',
    subject: 'Calculus',
    category: 'Math',
    icon: '∭',
    modelId: 'solids',
    relatedModelIds: ['derivative-integral-ftc-2d'],
    standards: 'AP Calculus AB/BC Units 1–8',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'College-Intro',
    prerequisitePackIds: ['precalculus-trigonometry'],
    track: CALC_TRACK,
    units: CALC_TRACK.units,
    quizzes: [
      {
        title: 'Limits & Continuity Warm-Up',
        description: 'Algebraic limits, indeterminate forms, and continuity tests.',
        subject: 'Calculus',
        difficulty: 'easy',
        timeLimitSec: 480,
        srsInterleave: true,
        lessonId: 'calc-u1-l1',
        modelId: 'solids',
        questions: [
          {
            type: 'mcq',
            prompt: 'Evaluate lim(x → 3) (x² − 9) / (x − 3).',
            options: ['0', '3', '6', 'Does not exist'],
            correct: 2,
            points: 10,
            explanation: 'Factor (x − 3)(x + 3)/(x − 3) = x + 3 → 6 as x → 3.',
          },
          {
            type: 'mcq',
            prompt: 'Evaluate lim(x → 0) sin(x) / x (with x in radians).',
            options: ['0', '1', '∞', 'π'],
            correct: 1,
            points: 10,
            explanation: 'By the squeeze theorem on the unit circle, sin(x)/x approaches 1 as x → 0.',
          },
          {
            type: 'truefalse',
            prompt: 'Every differentiable function at x = a is also continuous at x = a.',
            correct: true,
            points: 10,
            explanation: 'Differentiability implies continuity, though continuity does not guarantee differentiability (e.g., |x| at 0).',
          },
          {
            type: 'fill',
            prompt: 'Evaluate lim(x → ∞) (4x² + 7) / (2x² − 5x).',
            correct: '2',
            alternatives: ['2.0'],
            points: 10,
            explanation: 'Divide numerator and denominator by x²: the ratio of leading coefficients is 4/2 = 2.',
          },
        ],
      },
      {
        title: 'Derivatives, Tangents & Extrema',
        description: 'Chain rule, critical points, and vertex optimization.',
        subject: 'Calculus',
        difficulty: 'medium',
        timeLimitSec: 600,
        modelId: 'derivative-integral-ftc-2d',
        srsInterleave: true,
        lessonId: 'calc-u1-l1',
        questions: [
          {
            type: 'figure',
            prompt: 'Where does f′(x) = 0 occur for the quadratic curve shown? Enter the critical x-value.',
            figure: {
              template: 'parabola-vertex',
              givens: { a: -1, b: 8, c: -5 },
              ask: 'vertexX',
              rounding: 'integer',
              ranges: { a: [-4, -1], b: [-12, 12], c: [-8, 8] },
            },
            points: 10,
            explanation: 'Set f′(x) = 2ax + b = 0, giving critical vertex x = −b / (2a).',
          },
          {
            type: 'mcq',
            prompt: 'Differentiate f(x) = e^(3x²).',
            options: ['3x² e^(3x²−1)', '6x e^(3x²)', 'e^(6x)', '3 e^(3x²)'],
            correct: 1,
            points: 10,
            explanation: 'Chain rule: d/dx[e^u] = e^u · u′ = e^(3x²) · 6x.',
          },
          {
            type: 'fill',
            prompt: 'What is d/dx [sin(x)]?',
            correct: 'cos(x)',
            alternatives: ['cos x', 'cosx'],
            points: 10,
            explanation: 'The derivative of sin(x) in radians is cos(x).',
          },
          {
            type: 'order',
            prompt: 'Order the steps to find the absolute maximum of a continuous f(x) on [a, b]:',
            options: [
              'Compute the derivative f′(x)',
              'Find interior critical points where f′(x) = 0 or is undefined',
              'Evaluate f(x) at all critical points and at endpoints a and b',
              'Select the largest function value among those candidates',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'This is the Closed Interval Method guaranteed by the Extreme Value Theorem.',
          },
        ],
      },
      {
        title: 'Integrals & Solids of Revolution',
        description: 'Disk and washer cross-sections, arc length, and accumulation.',
        subject: 'Calculus',
        difficulty: 'hard',
        timeLimitSec: 720,
        srsInterleave: true,
        lessonId: 'calc-u1-l2',
        modelId: 'solids',
        questions: [
          {
            type: 'mcq',
            prompt: 'Revolving y = √x on [0, 4] around the x-axis produces a solid of volume:',
            options: ['4π', '8π', '16π', '32π'],
            correct: 1,
            points: 15,
            explanation: 'Disk method: V = π ∫₀⁴ (√x)² dx = π [x²/2]₀⁴ = 8π.',
          },
          {
            type: 'mcq',
            prompt: 'When revolving the region between outer radius R(x) and inner radius r(x) around the x-axis, the washer area is:',
            options: ['π(R(x) − r(x))²', 'π(R(x)² − r(x)²)', '2πx(R(x) − r(x))', 'πR(x)r(x)'],
            correct: 1,
            points: 15,
            explanation: 'Subtract the inner disk area πr² from the outer disk area πR²: π(R² − r²), NOT π(R − r)².',
          },
          {
            type: 'figure',
            prompt: 'Find the maximum value (vertex y) of f(x) shown before revolving.',
            figure: {
              template: 'parabola-vertex',
              givens: { a: -2, b: 8, c: 1 },
              ask: 'vertexY',
              rounding: 'integer',
              ranges: { a: [-4, -1], b: [-12, 12], c: [-6, 8] },
            },
            points: 15,
            explanation: 'Locate critical vertex x = −b/(2a), then evaluate f(x) at that maximum point.',
          },
          {
            type: 'fill',
            prompt: 'By the Fundamental Theorem of Calculus, d/dx [∫₀ˣ cos(t²) dt] evaluated at x = 0 equals ______.',
            correct: '1',
            alternatives: ['1.0'],
            points: 15,
            explanation: 'd/dx ∫₀ˣ cos(t²) dt = cos(x²), and cos(0) = 1.',
          },
        ],
      },
    ],
  },

  // 4. STATISTICS
  {
    id: 'probability-statistics',
    name: 'Statistics: Distributions & Inference',
    description:
      'Normal distributions, z-scores, tail probabilities, Bayes’ theorem, confidence intervals, and hypothesis testing.',
    subject: 'Statistics',
    category: 'Math',
    icon: '🔔',
    modelId: 'clt-sampling-inference-2d',
    relatedModelIds: ['bayes-natural-frequency-2d'],
    standards: 'AP Statistics Units 1–7 · Common Core HSS-ID',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: ['quantitative-foundations'],
    track: STAT_TRACK,
    units: STAT_TRACK.units,
    quizzes: [
      {
        title: 'Z-Scores & Empirical Rule',
        description: 'Standardize observations and interpret normal bell curves.',
        subject: 'Statistics',
        difficulty: 'easy',
        timeLimitSec: 480,
        srsInterleave: true,
        lessonId: 'stat-u1-l2',
        modelId: 'clt-sampling-inference-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Compute the z-score for x on the normal distribution shown. Round to the nearest tenth.',
            figure: {
              template: 'normal-curve',
              givens: { mean: 100, sd: 15, x: 130 },
              ask: 'zScore',
              rounding: 'tenth',
              ranges: { mean: [60, 120], sd: [8, 20], x: [95, 145] },
            },
            points: 10,
            explanation: 'Standardize via z = (x − μ) / σ.',
          },
          {
            type: 'figure',
            prompt: 'Find the percentile P(X ≤ x) as a percentage (0–100). Round to the nearest tenth.',
            figure: {
              template: 'normal-curve',
              givens: { mean: 50, sd: 10, x: 60 },
              ask: 'percentile',
              rounding: 'tenth',
              ranges: { mean: [40, 80], sd: [5, 15], x: [55, 95] },
            },
            points: 10,
            explanation: 'Convert x to z = (x − μ)/σ, then evaluate lower cumulative probability Φ(z) × 100%.',
          },
          {
            type: 'mcq',
            prompt: 'Which measure of center is most resistant to extreme outliers?',
            options: ['Sample mean', 'Median', 'Range', 'Standard deviation'],
            correct: 1,
            points: 10,
            explanation: 'The median depends only on the middle rank, not extreme tail values.',
          },
          {
            type: 'truefalse',
            prompt: 'About 68% of observations in a normal distribution fall within 1 standard deviation of the mean.',
            correct: true,
            points: 10,
            explanation: 'The 68–95–99.7 empirical rule gives ~68.27% within μ ± 1σ.',
          },
        ],
      },
      {
        title: 'Sampling Distributions & Tails',
        description: 'Central Limit Theorem, standard error, and tail probabilities.',
        subject: 'Statistics',
        difficulty: 'medium',
        timeLimitSec: 600,
        srsInterleave: true,
        lessonId: 'stat-u1-l1',
        modelId: 'clt-sampling-inference-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the upper-tail percentage P(X ≥ x) for the distribution shown. Round to the nearest tenth.',
            figure: {
              template: 'normal-curve',
              givens: { mean: 500, sd: 100, x: 700 },
              ask: 'upperTail',
              rounding: 'tenth',
              ranges: { mean: [400, 600], sd: [50, 120], x: [580, 760] },
            },
            points: 10,
            explanation: 'Compute z = (x − μ)/σ, then upper tail = 100 × (1 − Φ(z)).',
          },
          {
            type: 'mcq',
            prompt: 'To cut the standard error of the sample mean (σ / √n) in half, the sample size n must be multiplied by:',
            options: ['2', '4', '√2', '8'],
            correct: 1,
            points: 10,
            explanation: 'Because √(4n) = 2√n, quadrupling n halves the standard error.',
          },
          {
            type: 'fill',
            prompt: 'Rejecting a true null hypothesis H₀ is called a Type ______ error.',
            correct: 'I',
            alternatives: ['1', 'one'],
            points: 10,
            explanation: 'Type I error (false positive) occurs with probability α when H₀ is actually true.',
          },
          {
            type: 'order',
            prompt: 'Order the four stages of a significance test:',
            options: [
              'State null H₀ and alternative Hₐ hypotheses with significance level α',
              'Verify random, independence, and normality conditions',
              'Compute the test statistic and corresponding p-value',
              'Compare p-value to α and state the conclusion in context',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'State → Plan (conditions) → Do (statistic & p-value) → Conclude.',
          },
        ],
      },
      {
        title: 'Two-Tailed Inference & Bayes',
        description: 'Two-sided p-values, conditional probability, and variance addition.',
        subject: 'Statistics',
        difficulty: 'hard',
        timeLimitSec: 720,
        srsInterleave: true,
        lessonId: 'stat-u1-l3',
        modelId: 'bayes-natural-frequency-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Compute the two-tailed probability 2·P(|Z| ≥ |z|) in percent for the labeled x, μ, and σ. Round to the nearest integer.',
            figure: {
              template: 'normal-curve',
              givens: { mean: 0, sd: 1, x: 1.96 },
              ask: 'twoTailed',
              rounding: 'integer',
              ranges: { mean: [-1, 1], sd: [2, 3], x: [3, 5] },
            },
            points: 15,
            explanation: 'Find |z| = |(x − μ)/σ|, compute one tail 1 − Φ(|z|), and double it for both tails.',
          },
          {
            type: 'mcq',
            prompt: 'If X and Y are independent random variables with SD(X) = 3 and SD(Y) = 4, what is SD(X − Y)?',
            options: ['1', '5', '7', '25'],
            correct: 1,
            points: 15,
            explanation: 'Variances ALWAYS add for independent variables: Var(X − Y) = 3² + 4² = 25 ⇒ SD = 5.',
          },
          {
            type: 'mcq',
            prompt: 'A p-value of 0.03 properly means:',
            options: [
              'There is a 3% probability that H₀ is true',
              'Assuming H₀ is true, data at least this extreme occur 3% of the time by chance',
              '97% of the sample supports Hₐ',
              'The effect size is 0.03 standard deviations',
            ],
            correct: 1,
            points: 15,
            explanation: 'A p-value is P(data at least as extreme | H₀ true), never P(H₀ true | data).',
          },
          {
            type: 'truefalse',
            prompt: 'Increasing confidence from 90% to 99% on the same sample makes the confidence interval wider.',
            correct: true,
            points: 15,
            explanation: 'Higher confidence requires a larger critical z* (2.576 vs 1.645), widening the margin of error.',
          },
        ],
      },
    ],
  },
]
