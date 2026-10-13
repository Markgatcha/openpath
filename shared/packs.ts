import type { Difficulty, QuestionInput } from './schemas'

/**
 * Premade content packs. Each pack is a small set of ready-to-clone quizzes;
 * installing a pack copies the quizzes (unpublished) into the teacher's
 * library, where they can be edited like anything else.
 */

export interface PackQuiz {
  title: string
  description: string
  subject: string
  difficulty: Difficulty
  timeLimitSec: number | null
  questions: QuestionInput[]
}

export interface ContentPack {
  id: string
  name: string
  description: string
  subject: string
  icon: string
  quizzes: PackQuiz[]
}

export const CONTENT_PACKS: ContentPack[] = [
  {
    id: 'geometry-figures',
    name: 'Geometry Figures',
    description:
      'Angle-chasing and area drills built on parametric figure questions — the drawing and the answer key are computed together, so nothing can drift out of sync.',
    subject: 'Geometry',
    icon: '📐',
    quizzes: [
      {
        title: 'Triangle Quest',
        description: 'Solve for the missing sides — the figure is your friend.',
        subject: 'Geometry',
        difficulty: 'medium',
        timeLimitSec: 600,
        questions: [
          {
            type: 'figure',
            prompt: 'Find the length of side a. Round to the nearest tenth.',
            figure: {
              template: 'triangle-sas',
              givens: { b: 7, c: 5, angleA: 40 },
              ask: 'a',
              rounding: 'tenth',
            },
            points: 10,
            explanation:
              'Law of cosines: a² = b² + c² − 2bc·cos(A) = 49 + 25 − 70·cos(40°) ≈ 20.4, so a ≈ 4.5.',
          },
          {
            type: 'figure',
            prompt: 'Find the hypotenuse c. Round to the nearest tenth.',
            figure: {
              template: 'right-triangle',
              givens: { a: 3, b: 4 },
              ask: 'c',
              rounding: 'tenth',
            },
            points: 10,
            explanation: 'Pythagorean theorem: c = √(3² + 4²) = 5.',
          },
          {
            type: 'figure',
            prompt:
              'A triangle has sides 5, 6, and 7. Find angle A (opposite side a = 5). Round to the nearest degree.',
            figure: {
              template: 'triangle-sss',
              givens: { a: 5, b: 6, c: 7 },
              ask: 'angleA',
              rounding: 'integer',
            },
            points: 10,
            explanation:
              'Law of cosines: cos(A) = (36 + 49 − 25) / (2·6·7) = 60/84, so A ≈ 44°.',
          },
          {
            type: 'mcq',
            prompt:
              'You know two sides and the included angle of a triangle. Which law finds the third side?',
            options: [
              'Law of sines',
              'Law of cosines',
              'Pythagorean theorem',
              'Tangent ratio',
            ],
            correct: 1,
            explanation:
              'The law of cosines is built for SAS: c² = a² + b² − 2ab·cos(C).',
            points: 10,
          },
          {
            type: 'truefalse',
            prompt: 'The Pythagorean theorem works on every triangle.',
            correct: false,
            explanation:
              'It only applies to right triangles — for others, use the sine or cosine laws.',
            points: 10,
          },
        ],
      },
      {
        title: 'Circles & Trapezoids',
        description: 'Circumference, area, and the midsegment formula.',
        subject: 'Geometry',
        difficulty: 'easy',
        timeLimitSec: 480,
        questions: [
          {
            type: 'figure',
            prompt: 'Find the area of the circle. Round to the nearest tenth.',
            figure: {
              template: 'circle',
              givens: { r: 6 },
              ask: 'area',
              rounding: 'tenth',
            },
            points: 10,
            explanation: 'A = πr² = π·6² = 36π ≈ 113.1.',
          },
          {
            type: 'figure',
            prompt: 'Find the circumference of the circle. Round to the nearest tenth.',
            figure: {
              template: 'circle',
              givens: { d: 10 },
              ask: 'circumference',
              rounding: 'tenth',
            },
            points: 10,
            explanation: 'C = πd = π·10 ≈ 31.4.',
          },
          {
            type: 'figure',
            prompt:
              'A trapezoid has bases 10 and 6 with height 4. Find its area.',
            figure: {
              template: 'trapezoid',
              givens: { b1: 10, b2: 6, h: 4 },
              ask: 'area',
              rounding: 'integer',
            },
            points: 10,
            explanation: 'A = ½(b₁ + b₂)h = ½·16·4 = 32.',
          },
          {
            type: 'fill',
            prompt: 'The midsegment of a trapezoid equals the ___ of its bases.',
            correct: 'average',
            alternatives: ['mean'],
            points: 10,
            explanation:
              'The midsegment length is ½(b₁ + b₂) — literally the average of the two bases.',
          },
        ],
      },
    ],
  },
  {
    id: 'calculus-i-gateway',
    name: 'Calculus I Gateway',
    description:
      'A first-week diagnostic for limits and derivatives: enough signal to know who needs a rescue mission before the first exam.',
    subject: 'Calculus',
    icon: '∫',
    quizzes: [
      {
        title: 'Limits Warm-up',
        description: 'Evaluate, estimate, and know when a limit does not exist.',
        subject: 'Calculus',
        difficulty: 'medium',
        timeLimitSec: 600,
        questions: [
          {
            type: 'mcq',
            prompt: 'What is the limit of (x² − 4)/(x − 2) as x approaches 2?',
            options: ['0', '2', '4', 'Does not exist'],
            correct: 2,
            explanation:
              'Factor: (x−2)(x+2)/(x−2) = x + 2 → 4 as x → 2.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt:
              'The limit of f(x) as x approaches a exists when…',
            options: [
              'f(a) is defined',
              'the left- and right-hand limits agree',
              'f is continuous everywhere',
              'the function is a polynomial',
            ],
            correct: 1,
            explanation:
              'A two-sided limit exists exactly when both one-sided limits exist and are equal.',
            points: 10,
          },
          {
            type: 'truefalse',
            prompt: 'If f(3) = 5, then the limit of f(x) as x → 3 must be 5.',
            correct: false,
            explanation:
              'The limit describes the approach, not the value at the point — the function can jump.',
            points: 10,
          },
          {
            type: 'fill',
            prompt: 'lim (x → 0) sin(x)/x = ___',
            correct: '1',
            alternatives: ['one'],
            points: 10,
            explanation:
              'The classic squeeze-theorem result: sin(x)/x → 1 as x → 0.',
          },
        ],
      },
      {
        title: 'Derivative Drills',
        description: 'Power rule, constants, and the chain rule in disguise.',
        subject: 'Calculus',
        difficulty: 'medium',
        timeLimitSec: 600,
        questions: [
          {
            type: 'mcq',
            prompt: 'What is the derivative of x³?',
            options: ['3x²', 'x²', '3x', 'x⁴/4'],
            correct: 0,
            explanation: 'Power rule: d/dx xⁿ = n·xⁿ⁻¹, so d/dx x³ = 3x².',
            points: 10,
          },
          {
            type: 'mcq',
            prompt: 'What is the derivative of a constant 7?',
            options: ['7', '1', '0', '7x'],
            correct: 2,
            explanation:
              'Constants do not change — the slope of a horizontal line is 0.',
            points: 10,
          },
          {
            type: 'fill',
            prompt: 'd/dx sin(x) = ___',
            correct: 'cos(x)',
            alternatives: ['cosx', 'cosine of x'],
            points: 10,
            explanation: 'The derivative of sine is cosine.',
          },
          {
            type: 'order',
            prompt:
              'Order these derivative rules from the one you apply first to last when differentiating sin(3x²).',
            options: [
              'Power rule on x²',
              'Chain rule for the outer sine',
              'Multiply by the inner derivative',
            ],
            correct: [0, 1, 2],
            explanation:
              'Identify the inner power first, then the outer function, then multiply by the inner derivative.',
            points: 10,
          },
        ],
      },
    ],
  },
  {
    id: 'intro-psych-survey',
    name: 'Intro Psych Survey',
    description:
      'Foundations and research methods for a first psychology course — the vocabulary every later chapter assumes.',
    subject: 'Psychology',
    icon: '🧠',
    quizzes: [
      {
        title: 'Foundations of Psychology',
        description: 'Schools of thought and the people who built them.',
        subject: 'Psychology',
        difficulty: 'easy',
        timeLimitSec: 480,
        questions: [
          {
            type: 'mcq',
            prompt: 'Who is widely regarded as the founder of psychoanalysis?',
            options: [
              'Wilhelm Wundt',
              'Sigmund Freud',
              'William James',
              'B. F. Skinner',
            ],
            correct: 1,
            explanation:
              'Freud founded psychoanalysis; Wundt founded the first psychology lab, James championed functionalism, and Skinner led behaviorism.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt:
              'Which school of psychology focused on what the mind does rather than what it is made of?',
            options: [
              'Structuralism',
              'Functionalism',
              'Gestalt',
              'Psychoanalysis',
            ],
            correct: 1,
            explanation:
              'Functionalism (William James) asked how mental processes help us adapt.',
            points: 10,
          },
          {
            type: 'truefalse',
            prompt:
              'The nature vs. nurture debate asks whether behavior comes from genes or experience.',
            correct: true,
            explanation:
              'Modern psychology treats it as an interaction — genes and environment constantly trade punches.',
            points: 10,
          },
          {
            type: 'fill',
            prompt: 'The first psychology laboratory was founded by ___ in 1879.',
            correct: 'Wilhelm Wundt',
            alternatives: ['Wundt'],
            points: 10,
            explanation:
              'Wundt opened the lab in Leipzig, Germany — psychology’s birthday party.',
          },
        ],
      },
      {
        title: 'Research Methods',
        description: 'Controls, confounds, and the correlation trap.',
        subject: 'Psychology',
        difficulty: 'medium',
        timeLimitSec: 480,
        questions: [
          {
            type: 'mcq',
            prompt:
              'In an experiment, the group that does NOT receive the treatment is called…',
            options: [
              'The experimental group',
              'The control group',
              'The confederate group',
              'The sample',
            ],
            correct: 1,
            explanation:
              'The control group gives you the baseline everything else is compared against.',
            points: 10,
          },
          {
            type: 'truefalse',
            prompt: 'A strong correlation between two variables proves one causes the other.',
            correct: false,
            explanation:
              'Correlation is not causation — a third variable (or chance) may drive both.',
            points: 10,
          },
          {
            type: 'mcq',
            prompt:
              'Randomly assigning participants to groups mainly helps with…',
            options: [
              'Bigger sample sizes',
              'Reducing confounding variables',
              'Faster data collection',
              'Ethical approval',
            ],
            correct: 1,
            explanation:
              'Randomization spreads confounds evenly across groups, so differences point at the treatment.',
            points: 10,
          },
        ],
      },
    ],
  },
]

export function findPack(id: string): ContentPack | undefined {
  return CONTENT_PACKS.find((pack) => pack.id === id)
}
