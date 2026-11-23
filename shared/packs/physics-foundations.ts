import type { ContentPack } from './types'
import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'

const PF_U1_LESSONS: PackLesson[] = [
  {
    id: 'pf-u1-l1',
    unitId: 'pf-u1-kinematics',
    title: 'Velocity, Acceleration & the Constant-Acceleration Equations',
    summary:
      'Read velocity off a position–time graph and use v = u + at and s = ut + ½at² to predict motion.',
    estimatedMinutes: 9,
    standards: ['AP Physics 1 Unit 1'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'pf-u1-l1-s1',
        kind: 'narrative',
        title: 'Two Rates of Change',
        bodyMarkdown:
          '**Velocity** is how fast position changes: v = Δx / Δt. **Acceleration** is how fast velocity changes: a = Δv / Δt. They are different quantities. A car cruising at a steady 30 m/s has a large velocity and zero acceleration; a car pulling away from a red light has a small velocity and a large acceleration.\n\nWhen acceleration is constant, three equations describe everything, with u the starting velocity:\n\n- v = u + at\n- s = ut + ½at²\n- v² = u² + 2as',
        callout: {
          tone: 'pitfall',
          text: 'Zero velocity does not mean zero acceleration. A ball at the top of a throw is momentarily at rest and still accelerating downward at 9.8 m/s².',
        },
      },
      {
        id: 'pf-u1-l1-s2',
        kind: 'predict-observe-explain',
        title: 'What a Position–Time Slope Tells You',
        predictionPrompt:
          'Two runners are plotted on the same position–time graph as straight lines. One line is steeper. What is true of that runner?',
        predictionChoices: [
          'They are accelerating',
          'They are moving faster',
          'They started farther from the origin',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 2, x2: 4, y2: 14 },
            ask: 'slope',
            rounding: 'tenth',
          },
        },
        observeInstruction:
          'Treat the horizontal axis as time in seconds and the vertical axis as position in metres. Read the rise and the run between the two marked points.',
        explainPrompt: 'Why is the slope of this line a velocity?',
        explainOptions: [
          'Rise is a change in position and run is a change in time, so rise ÷ run is metres per second',
          'Because the line passes above the origin',
          'Because a straight line always means the object is speeding up',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'The line rises 12 m in 4 s, a velocity of 3 m/s. A straight line means that velocity never changes, so the acceleration is zero. Accelerated motion shows up as a curve.',
      },
      {
        id: 'pf-u1-l1-s3',
        kind: 'worked-example',
        title: 'A Car Pulling Away From Rest',
        problemMarkdown:
          'A car starts from rest and accelerates at a constant **3 m/s²** for **6 s**. Find its final velocity and the distance it covers.',
        steps: [
          {
            label: 'List what is known',
            expressionOrAction: 'u = 0 m/s, a = 3 m/s², t = 6 s',
            whyNote: '"From rest" is a hidden given: it fixes the starting velocity at zero.',
          },
          {
            label: 'Final velocity',
            expressionOrAction: 'v = u + at = 0 + 3 × 6 = 18 m/s',
            whyNote: 'Each second adds 3 m/s to the velocity.',
          },
          {
            label: 'Distance covered',
            expressionOrAction: 's = ut + ½at² = 0 + ½ × 3 × 6² = 54 m',
            whyNote: 'Check with the average velocity: (0 + 18) / 2 = 9 m/s for 6 s is also 54 m.',
          },
        ],
      },
      {
        id: 'pf-u1-l1-s4',
        kind: 'checkpoint',
        title: 'Velocity From a Graph',
        question: {
          type: 'figure',
          prompt:
            'This line plots position x (m, vertical) against time t (s, horizontal). Find the velocity in m/s, to the nearest tenth.',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 3, x2: 5, y2: 18 },
            ask: 'slope',
            rounding: 'tenth',
            ranges: { y1: [0, 6], x2: [3, 8], y2: [12, 30] },
          },
          explanation: 'Velocity is the slope: (x₂ − x₁) / (t₂ − t₁).',
          points: 15,
        },
      },
      {
        id: 'pf-u1-l1-s5',
        kind: 'synthesis',
        title: 'Describing Motion',
        takeaways: [
          'Velocity is the slope of a position–time graph; acceleration is the slope of a velocity–time graph.',
          'With constant acceleration: v = u + at, s = ut + ½at², v² = u² + 2as.',
          'An object can have zero velocity and non-zero acceleration at the same instant.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u1-l1-fc1',
        front: 'What does the slope of a position–time graph give?',
        back: 'Velocity.',
        explanation: 'Slope is change in position divided by change in time.',
        interleave: true,
      },
      {
        id: 'pf-u1-l1-fc2',
        front: 'Distance covered from rest under constant acceleration a for time t',
        back: 's = ½at²',
        explanation: 'From s = ut + ½at² with u = 0. Doubling the time quadruples the distance.',
        interleave: true,
      },
      {
        id: 'pf-u1-l1-fc3',
        front: 'Which constant-acceleration equation has no time in it?',
        back: 'v² = u² + 2as',
        explanation: 'Use it when the question gives a distance and asks for a speed, or the reverse.',
        interleave: true,
      },
    ],
  },
  {
    id: 'pf-u1-l2',
    unitId: 'pf-u1-kinematics',
    title: 'Projectile Motion: Two Independent Motions',
    summary:
      'Split a launch into a constant horizontal velocity and a vertical free fall, then predict range, apex and time of flight.',
    estimatedMinutes: 10,
    standards: ['AP Physics 1 Unit 1'],
    prerequisiteLessonIds: ['pf-u1-l1'],
    visual: {
      kind: 'model-2d',
      modelId: 'projectile-motion-2d',
      initialParams: { speed: 20, angleDeg: 45, height: 0, gravity: 0, showComponents: true },
      highlightHotspots: ['launch', 'apex', 'landing'],
    },
    steps: [
      {
        id: 'pf-u1-l2-s1',
        kind: 'narrative',
        title: 'Sideways and Downward Do Not Interact',
        bodyMarkdown:
          'Once a projectile leaves the launcher, the only force on it (ignoring air resistance) is gravity, which points straight down. So:\n\n- **Horizontally** nothing pushes or pulls: horizontal velocity = v₀ cos θ stays constant.\n- **Vertically** it is in free fall: vertical velocity = v₀ sin θ − gt.\n\nThe curved path is just these two simple motions happening at the same time. Time is the only thing they share.',
        callout: {
          tone: 'key-idea',
          text: 'A bullet fired horizontally and a bullet dropped from the same height hit level ground at the same moment.',
        },
      },
      {
        id: 'pf-u1-l2-s2',
        kind: 'predict-observe-explain',
        title: 'Find the Farthest Throw',
        predictionPrompt:
          'With a fixed launch speed on level ground, which angle sends the projectile farthest?',
        predictionChoices: [
          '60°, because the projectile stays in the air longer',
          '30°, because a flatter throw keeps more horizontal speed',
          '45°',
        ],
        correctPredictionIndex: 2,
        visual: {
          kind: 'model-2d',
          modelId: 'projectile-motion-2d',
          initialParams: { speed: 20, angleDeg: 30, height: 0, gravity: 0, showComponents: true, showStrobe: true },
          highlightHotspots: ['landing'],
          challengeId: 'max-range-angle',
        },
        observeInstruction:
          'Leave the speed at 20 m/s and sweep the angle from 30° to 60°. Watch the Range readout, and notice that the strobe marks stay evenly spaced along the ground.',
        explainPrompt: 'Why do 30° and 60° land in the same place while 45° goes farther than both?',
        explainOptions: [
          'Gravity is weaker at 45°',
          'Range is horizontal speed × time of flight; 30° has more speed and less time, 60° has the reverse, and 45° gives the largest product',
          'The projectile travels a longer curved path at 45°',
        ],
        correctExplainIndex: 1,
        reconcileFeedback:
          'R = v₀² sin(2θ) / g. At 20 m/s on Earth the 45° throw reaches 40.8 m, and both 30° and 60° reach 35.3 m because sin(60°) = sin(120°).',
      },
      {
        id: 'pf-u1-l2-s3',
        kind: 'worked-example',
        title: 'A Ball Rolled Off a Cliff',
        problemMarkdown:
          'A ball leaves the edge of a **20 m** cliff travelling horizontally at **15 m/s**. Taking g = 9.8 m/s², how long is it in the air and how far from the base does it land?',
        steps: [
          {
            label: 'Use the vertical motion to find the time',
            expressionOrAction: '20 = ½ × 9.8 × t²  →  t = √(40 / 9.8) ≈ 2.02 s',
            whyNote: 'The launch is horizontal, so the vertical velocity starts at zero. The 15 m/s plays no part in the fall.',
          },
          {
            label: 'Use the horizontal motion to find the distance',
            expressionOrAction: 'x = vₓ t = 15 × 2.02 ≈ 30.3 m',
            whyNote: 'Horizontal velocity is constant, so distance is simply speed × time.',
          },
        ],
      },
      {
        id: 'pf-u1-l2-s4',
        kind: 'checkpoint',
        title: 'Dropped Versus Thrown',
        question: {
          type: 'mcq',
          prompt:
            'From the same height, ball A is dropped and ball B is thrown horizontally at 10 m/s at the same instant. Ignoring air resistance, which reaches level ground first?',
          options: [
            'Ball B, because it is moving faster',
            'Ball A, because it travels a shorter path',
            'They land at the same time',
          ],
          correct: 2,
          explanation:
            'Both start with zero vertical velocity and fall the same height under the same gravity. Horizontal speed has no effect on the fall time.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'Path length does not set the fall time. Only the vertical motion does.',
          '0': 'Ball B is faster sideways, but its downward motion is identical to ball A’s.',
        },
      },
      {
        id: 'pf-u1-l2-s5',
        kind: 'synthesis',
        title: 'Projectiles in One Picture',
        takeaways: [
          'Horizontal velocity stays constant; vertical velocity changes by g every second.',
          'Solve the vertical motion for the time, then use that time in the horizontal motion.',
          'On level ground the range is v₀² sin(2θ) / g: greatest at 45°, equal for complementary angles.',
        ],
        nextQuizIndex: 0,
        arcadeLaunch: { mode: 'sim-sandbox', packId: 'physics-foundations' },
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u1-l2-fc1',
        front: 'What stays constant during projectile flight (no air resistance)?',
        back: 'The horizontal velocity, and the downward acceleration g.',
        explanation: 'No horizontal force acts, so there is no horizontal acceleration.',
        interleave: true,
      },
      {
        id: 'pf-u1-l2-fc2',
        front: 'Velocity of a projectile at the top of its path',
        back: 'Horizontal only, equal to v₀ cos θ. It is not zero.',
        explanation: 'Only the vertical component passes through zero at the apex.',
        interleave: true,
      },
      {
        id: 'pf-u1-l2-fc3',
        front: 'Range of a projectile launched and landing at the same height',
        back: 'R = v₀² sin(2θ) / g',
        explanation: 'Maximum at 45°. Angles θ and 90° − θ give the same range.',
        interleave: true,
      },
    ],
  },
]

const PF_U2_LESSONS: PackLesson[] = [
  {
    id: 'pf-u2-l1',
    unitId: 'pf-u2-forces',
    title: 'Newton’s Laws & Net Force',
    summary:
      'Add forces as vectors, apply F = ma to the net force, and identify third-law pairs correctly.',
    estimatedMinutes: 9,
    standards: ['AP Physics 1 Unit 2'],
    prerequisiteLessonIds: ['pf-u1-l1'],
    steps: [
      {
        id: 'pf-u2-l1-s1',
        kind: 'narrative',
        title: 'Forces Change Motion; They Do Not Sustain It',
        bodyMarkdown:
          '**First law:** with zero net force, an object keeps its velocity. It stays at rest or keeps moving in a straight line at constant speed.\n\n**Second law:** a net force causes acceleration, a = F_net / m. The same push accelerates a heavier object less.\n\n**Third law:** forces come in pairs. If A pushes on B, B pushes on A with equal size in the opposite direction. The two forces act on *different* objects, so they never cancel each other.',
        callout: {
          tone: 'pitfall',
          text: 'A moving object does not need a force to keep moving. On Earth things slow down because friction and drag are forces, not because motion "runs out".',
        },
      },
      {
        id: 'pf-u2-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Adding Two Forces at Right Angles',
        predictionPrompt:
          'A hockey puck is pushed east with 6 N and north with 8 N at the same time. How large is the net force?',
        predictionChoices: ['14 N', '10 N', '2 N'],
        correctPredictionIndex: 1,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'vector-2d',
            givens: { ux: 6, uy: 0, vx: 0, vy: 8 },
            ask: 'resultantMag',
            rounding: 'integer',
          },
        },
        observeInstruction:
          'Place the two force arrows tip to tail. The net force is the single arrow from the start of the first to the tip of the second.',
        explainPrompt: 'Why is the answer smaller than 6 + 8?',
        explainOptions: [
          'Because part of each force is lost to friction',
          'Forces are vectors: perpendicular forces combine by Pythagoras, √(6² + 8²) = 10 N',
          'Because the larger force cancels the smaller one',
        ],
        correctExplainIndex: 1,
        reconcileFeedback:
          'Magnitudes only add directly when forces point the same way. Here the net force is 10 N, directed between east and north, and that is the direction the puck accelerates.',
      },
      {
        id: 'pf-u2-l1-s3',
        kind: 'worked-example',
        title: 'A Car With Drag',
        problemMarkdown:
          'A **1200 kg** car’s engine provides a forward force of **4000 N** while drag and friction total **1000 N** backward. Find the acceleration.',
        steps: [
          {
            label: 'Find the net force',
            expressionOrAction: 'F_net = 4000 − 1000 = 3000 N forward',
            whyNote: 'F = ma uses the net force, never a single force on its own.',
          },
          {
            label: 'Apply the second law',
            expressionOrAction: 'a = F_net / m = 3000 / 1200 = 2.5 m/s²',
            whyNote: 'If drag grew to 4000 N the net force would be zero and the car would cruise at constant speed.',
          },
        ],
      },
      {
        id: 'pf-u2-l1-s4',
        kind: 'checkpoint',
        title: 'Truck Meets Car',
        question: {
          type: 'mcq',
          prompt:
            'A heavy truck collides head-on with a small car. Compared with the force the truck exerts on the car, the force the car exerts on the truck is:',
          options: ['Equal in size', 'Smaller, because the car has less mass', 'Zero, because the truck keeps moving forward'],
          correct: 0,
          explanation:
            'Third-law forces are always equal and opposite. The car is damaged more because the same force gives its smaller mass a much larger acceleration.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'Mass decides the acceleration each vehicle gets, not the size of the force between them.',
        },
      },
      {
        id: 'pf-u2-l1-s5',
        kind: 'synthesis',
        title: 'Newton’s Laws in Use',
        takeaways: [
          'Zero net force means constant velocity, which includes rest.',
          'Find the net force first, then use a = F_net / m.',
          'Third-law pairs are equal, opposite, and act on different objects.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u2-l1-fc1',
        front: 'An object moves at constant velocity. What is the net force on it?',
        back: 'Zero.',
        explanation: 'Constant velocity means zero acceleration, so by F = ma the forces balance.',
        interleave: true,
      },
      {
        id: 'pf-u2-l1-fc2',
        front: 'Why do Newton’s third-law force pairs never cancel?',
        back: 'They act on two different objects.',
        explanation: 'Only forces on the same object can be added to find that object’s net force.',
        interleave: true,
      },
      {
        id: 'pf-u2-l1-fc3',
        front: 'Net force of 3 N and 4 N acting at right angles',
        back: '5 N',
        explanation: 'Perpendicular vectors combine by Pythagoras.',
        interleave: true,
      },
    ],
  },
  {
    id: 'pf-u2-l2',
    unitId: 'pf-u2-forces',
    title: 'Friction on a Ramp',
    summary:
      'Resolve weight along and into a slope, find the friction force from the normal force, and predict the acceleration.',
    estimatedMinutes: 10,
    standards: ['AP Physics 1 Unit 2'],
    prerequisiteLessonIds: ['pf-u2-l1'],
    steps: [
      {
        id: 'pf-u2-l2-s1',
        kind: 'narrative',
        title: 'Tilt the Axes, Not Your Head',
        bodyMarkdown:
          'On a ramp at angle θ, split the weight mg into two parts:\n\n- **Along the slope:** mg sin θ, pulling the block downhill.\n- **Into the slope:** mg cos θ, balanced by the normal force N.\n\nSliding friction opposes the motion with size f = μN = μmg cos θ. The net force downhill is therefore mg sin θ − μmg cos θ.',
        callout: {
          tone: 'key-idea',
          text: 'The normal force on a ramp is mg cos θ, not mg. The steeper the ramp, the smaller the normal force and the weaker the friction.',
        },
      },
      {
        id: 'pf-u2-l2-s2',
        kind: 'predict-observe-explain',
        title: 'Does a Heavier Block Slide Faster?',
        predictionPrompt:
          'A 10 kg block slides down a 30° ramp with friction coefficient 0.2. If it is swapped for a 20 kg block of the same material, the acceleration:',
        predictionChoices: ['Stays the same', 'Doubles', 'Halves'],
        correctPredictionIndex: 0,
        visual: {
          kind: 'figure-2d',
          figure: {
            template: 'inclined-plane',
            givens: { mass: 10, angle: 30, mu: 0.2 },
            ask: 'acceleration',
            rounding: 'hundredth',
          },
        },
        observeInstruction:
          'Look at the three forces on the block: weight straight down, the normal force out of the slope, and friction up the slope. Each one is proportional to the mass.',
        explainPrompt: 'Why does the mass not affect the acceleration?',
        explainOptions: [
          'Gravity pulls equally hard on every object',
          'Heavier blocks feel less friction',
          'The downhill pull and the friction both scale with m, so m cancels in a = g(sin θ − μ cos θ)',
        ],
        correctExplainIndex: 2,
        reconcileFeedback:
          'Doubling the mass doubles the net force and doubles the inertia. The acceleration stays at 9.8 × (sin 30° − 0.2 cos 30°) ≈ 3.20 m/s².',
      },
      {
        id: 'pf-u2-l2-s3',
        kind: 'worked-example',
        title: 'Block on a 30° Ramp',
        problemMarkdown:
          'A **10 kg** block slides down a **30°** ramp with μ = 0.2. Taking g = 9.8 m/s², find its acceleration.',
        steps: [
          {
            label: 'Normal force',
            expressionOrAction: 'N = mg cos θ = 10 × 9.8 × 0.866 ≈ 84.9 N',
            whyNote: 'The block does not accelerate into or out of the ramp, so N balances the into-slope part of the weight.',
          },
          {
            label: 'Friction',
            expressionOrAction: 'f = μN = 0.2 × 84.9 ≈ 17.0 N up the slope',
            whyNote: 'Friction opposes the sliding, so it points uphill.',
          },
          {
            label: 'Net force and acceleration',
            expressionOrAction: 'F_net = mg sin θ − f = 49.0 − 17.0 = 32.0 N;  a = 32.0 / 10 = 3.20 m/s²',
            whyNote: 'Without friction the answer would be g sin 30° = 4.9 m/s².',
          },
        ],
      },
      {
        id: 'pf-u2-l2-s4',
        kind: 'checkpoint',
        title: 'Acceleration Down the Ramp',
        question: {
          type: 'figure',
          prompt: 'Find the acceleration of the block down the ramp in m/s², to the nearest hundredth.',
          figure: {
            template: 'inclined-plane',
            givens: { mass: 12, angle: 35, mu: 0.15 },
            ask: 'acceleration',
            rounding: 'hundredth',
            ranges: { mass: [5, 25], angle: [25, 50], mu: [0.1, 0.3] },
          },
          explanation: 'a = g(sin θ − μ cos θ) with g = 9.8 m/s². The mass cancels.',
          points: 15,
        },
      },
      {
        id: 'pf-u2-l2-s5',
        kind: 'synthesis',
        title: 'Ramps Solved',
        takeaways: [
          'Along the slope the weight contributes mg sin θ; into the slope it contributes mg cos θ.',
          'Sliding friction is μ times the normal force and opposes the motion.',
          'a = g(sin θ − μ cos θ): the mass cancels.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u2-l2-fc1',
        front: 'Normal force on a block resting on a ramp at angle θ',
        back: 'N = mg cos θ',
        explanation: 'It balances only the part of the weight pressing into the surface.',
        interleave: true,
      },
      {
        id: 'pf-u2-l2-fc2',
        front: 'Sliding friction force in terms of the normal force',
        back: 'f = μN, directed against the motion.',
        explanation: 'μ is the coefficient of kinetic friction for the two surfaces.',
        interleave: true,
      },
      {
        id: 'pf-u2-l2-fc3',
        front: 'Acceleration of a block sliding down a frictionless ramp at angle θ',
        back: 'a = g sin θ',
        explanation: 'At 90° this becomes free fall (g); at 0° it is zero.',
        interleave: true,
      },
    ],
  },
]

const PF_U3_LESSONS: PackLesson[] = [
  {
    id: 'pf-u3-l1',
    unitId: 'pf-u3-energy-momentum',
    title: 'Work, Energy & Power',
    summary:
      'Track kinetic and gravitational potential energy and use conservation of energy to find speeds without following the path.',
    estimatedMinutes: 10,
    standards: ['AP Physics 1 Unit 3'],
    prerequisiteLessonIds: ['pf-u2-l1'],
    visual: {
      kind: 'model-2d',
      modelId: 'projectile-motion-2d',
      initialParams: { speed: 15, angleDeg: 20, height: 20, gravity: 0, showComponents: true },
      highlightHotspots: ['landing'],
    },
    steps: [
      {
        id: 'pf-u3-l1-s1',
        kind: 'narrative',
        title: 'Energy Is a Bookkeeping Tool',
        bodyMarkdown:
          '**Work** is energy transferred by a force: W = Fd cos θ, where θ is the angle between the force and the movement. **Kinetic energy** is ½mv² and **gravitational potential energy** near Earth’s surface is mgh.\n\nWhen only gravity does work, the total ½mv² + mgh stays the same. That lets you jump straight from a starting height and speed to a final speed, whatever the route in between. **Power** is the rate of doing work, P = W/t, measured in watts.',
        callout: {
          tone: 'key-idea',
          text: 'Kinetic energy depends on speed squared. Doubling the speed takes four times the energy and four times the braking distance.',
        },
      },
      {
        id: 'pf-u3-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Same Launch Speed, Different Angles',
        predictionPrompt:
          'A ball is launched at 15 m/s from a 20 m platform, first at 20° and then at 70°. Ignoring air resistance, which launch hits the ground at the greater speed?',
        predictionChoices: [
          'The 20° launch, because it is aimed more toward the ground',
          'The 70° launch, because it falls from higher',
          'Both hit at the same speed',
        ],
        correctPredictionIndex: 2,
        visual: {
          kind: 'model-2d',
          modelId: 'projectile-motion-2d',
          initialParams: { speed: 15, angleDeg: 20, height: 20, gravity: 0, showComponents: true },
          highlightHotspots: ['landing'],
        },
        observeInstruction:
          'Keep the speed at 15 m/s and the height at 20 m. Change only the angle and watch the Impact speed readout.',
        explainPrompt: 'Why does the impact speed ignore the launch angle?',
        explainOptions: [
          'Each launch starts with the same kinetic and potential energy and ends at the same height, so each ends with the same kinetic energy',
          'Gravity pulls harder on the steeper launch',
          'Both launches spend the same time in the air',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Energy gives v² = 15² + 2 × 9.8 × 20, so v ≈ 24.8 m/s at every angle. The direction of the impact velocity changes; its size does not.',
      },
      {
        id: 'pf-u3-l1-s3',
        kind: 'worked-example',
        title: 'Roller Coaster Drop',
        problemMarkdown:
          'A **500 kg** roller-coaster car starts from rest at the top of a **30 m** drop. Ignoring friction and taking g = 9.8 m/s², how fast is it moving at the bottom?',
        steps: [
          {
            label: 'Write energy at the top and the bottom',
            expressionOrAction: 'Top: mgh + 0.   Bottom: 0 + ½mv²',
            whyNote: 'Take the bottom as zero height. The car starts from rest, so it has no kinetic energy at the top.',
          },
          {
            label: 'Set them equal and cancel the mass',
            expressionOrAction: 'mgh = ½mv²  →  v = √(2gh)',
            whyNote: 'The mass cancels, so an empty car and a full car reach the same speed.',
          },
          {
            label: 'Substitute',
            expressionOrAction: 'v = √(2 × 9.8 × 30) = √588 ≈ 24.2 m/s',
            whyNote: 'The shape of the track never entered the calculation.',
          },
        ],
      },
      {
        id: 'pf-u3-l1-s4',
        kind: 'checkpoint',
        title: 'Speed and Kinetic Energy',
        question: {
          type: 'mcq',
          prompt: 'A car speeds up from 10 m/s to 20 m/s. Its kinetic energy becomes:',
          options: ['√2 times as large', '2 times as large', '4 times as large'],
          correct: 2,
          explanation: 'Kinetic energy is ½mv². Doubling v multiplies v² by 4.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'Kinetic energy is proportional to speed squared, not to speed.',
        },
      },
      {
        id: 'pf-u3-l1-s5',
        kind: 'synthesis',
        title: 'Energy Accounting',
        takeaways: [
          'W = Fd cos θ; a force at right angles to the motion does no work.',
          'With only gravity doing work, ½mv² + mgh is constant.',
          'Power is energy transferred per second: P = W / t.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u3-l1-fc1',
        front: 'Speed after falling a height h from rest (no friction)',
        back: 'v = √(2gh)',
        explanation: 'From mgh = ½mv². Independent of mass and of the path taken.',
        interleave: true,
      },
      {
        id: 'pf-u3-l1-fc2',
        front: 'How does kinetic energy change when speed triples?',
        back: 'It becomes 9 times as large.',
        explanation: 'KE = ½mv², so it scales with the square of the speed.',
        interleave: true,
      },
      {
        id: 'pf-u3-l1-fc3',
        front: 'Work done by a force perpendicular to the direction of motion',
        back: 'Zero.',
        explanation: 'W = Fd cos 90° = 0. This is why the normal force does no work on a sliding block.',
        interleave: true,
      },
    ],
  },
  {
    id: 'pf-u3-l2',
    unitId: 'pf-u3-energy-momentum',
    title: 'Momentum, Impulse & Collisions',
    summary:
      'Use p = mv and conservation of momentum to solve collisions, and impulse to explain why longer impacts mean smaller forces.',
    estimatedMinutes: 10,
    standards: ['AP Physics 1 Unit 4'],
    prerequisiteLessonIds: ['pf-u3-l1'],
    steps: [
      {
        id: 'pf-u3-l2-s1',
        kind: 'narrative',
        title: 'What Collisions Conserve',
        bodyMarkdown:
          '**Momentum** is p = mv, and it has a direction. A force acting for a time changes it: **impulse** FΔt = Δp.\n\nWhen two objects collide and no outside force acts, the forces between them are a third-law pair, so whatever momentum one loses the other gains. **Total momentum before equals total momentum after**, in every collision.\n\nKinetic energy is different. It is conserved only in a perfectly **elastic** collision. In an **inelastic** collision some of it becomes heat, sound and deformation; when the objects stick together the loss is as large as momentum conservation allows.',
        callout: {
          tone: 'pitfall',
          text: 'Momentum is conserved even when kinetic energy is not. Never use energy conservation on a collision unless you are told it is elastic.',
        },
      },
      {
        id: 'pf-u3-l2-s2',
        kind: 'worked-example',
        title: 'Two Carts That Stick Together',
        problemMarkdown:
          'A **2 kg** cart moving at **3 m/s** hits a stationary **1 kg** cart and they couple together. Find their shared velocity and the kinetic energy lost.',
        steps: [
          {
            label: 'Momentum before',
            expressionOrAction: 'p = 2 × 3 + 1 × 0 = 6 kg·m/s',
            whyNote: 'The stationary cart contributes nothing.',
          },
          {
            label: 'Momentum after equals momentum before',
            expressionOrAction: '(2 + 1) v = 6  →  v = 2 m/s',
            whyNote: 'After coupling the carts move as one 3 kg object.',
          },
          {
            label: 'Compare kinetic energies',
            expressionOrAction: 'Before: ½ × 2 × 3² = 9 J.   After: ½ × 3 × 2² = 6 J.   Lost: 3 J',
            whyNote: 'One third of the kinetic energy went into heat, sound and deformation, yet momentum is unchanged.',
          },
        ],
      },
      {
        id: 'pf-u3-l2-s3',
        kind: 'faded-practice',
        title: 'Stopping a Ball',
        promptMarkdown:
          'A **0.5 kg** ball moving at **4 m/s** is brought to rest by a glove in **0.1 s**. Finish the calculation of the average force.',
        completedSteps: [
          'Change in momentum: Δp = 0.5 × (0 − 4) = −2 kg·m/s',
          'Impulse equals change in momentum: F Δt = Δp, so F = Δp / Δt',
        ],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'What is the size of the average force on the ball, in newtons?',
            correct: '20',
            alternatives: ['20 N', '20N', '-20'],
            explanation: '|F| = 2 / 0.1 = 20 N. The sign only says the force opposes the motion.',
            points: 15,
          },
        },
        misconceptionHints: {
          '2': 'That is the change in momentum. Divide it by the 0.1 s the force acts for.',
          '0.2': 'Divide the momentum change by the time; do not multiply.',
        },
      },
      {
        id: 'pf-u3-l2-s4',
        kind: 'checkpoint',
        title: 'Why Airbags Work',
        question: {
          type: 'mcq',
          prompt: 'In a crash, an airbag reduces the force on a passenger mainly by:',
          options: [
            'Reducing the passenger’s change in momentum',
            'Increasing the time over which the passenger’s momentum changes',
            'Reducing the passenger’s mass',
          ],
          correct: 1,
          explanation:
            'The passenger’s momentum must drop to zero either way. Spreading that change over a longer time makes the force F = Δp / Δt smaller.',
          points: 15,
        },
        misconceptionHints: {
          '0': 'The passenger still goes from the car’s speed to rest, so Δp is the same with or without the airbag.',
        },
      },
      {
        id: 'pf-u3-l2-s5',
        kind: 'synthesis',
        title: 'Momentum in One Place',
        takeaways: [
          'p = mv is a vector; total momentum is conserved in any collision with no outside force.',
          'Impulse F Δt equals the change in momentum, so a longer impact means a smaller force.',
          'Kinetic energy is conserved only in elastic collisions.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u3-l2-fc1',
        front: 'What is conserved in every collision between two objects with no outside force?',
        back: 'Total momentum.',
        explanation: 'Kinetic energy is conserved only if the collision is elastic.',
        interleave: true,
      },
      {
        id: 'pf-u3-l2-fc2',
        front: 'Impulse–momentum relation',
        back: 'F Δt = Δp',
        explanation: 'The same momentum change over a longer time needs a smaller force.',
        interleave: true,
      },
      {
        id: 'pf-u3-l2-fc3',
        front: 'A collision in which the objects stick together is called…',
        back: 'Perfectly inelastic.',
        explanation: 'It loses the most kinetic energy that momentum conservation permits.',
        interleave: true,
      },
    ],
  },
]

const PF_U4_LESSONS: PackLesson[] = [
  {
    id: 'pf-u4-l1',
    unitId: 'pf-u4-oscillations-waves',
    title: 'Oscillations, Period & Wave Speed',
    summary:
      'Relate period and frequency, predict the period of a pendulum and a mass on a spring, and connect them to wave speed v = fλ.',
    estimatedMinutes: 9,
    standards: ['AP Physics 1 Unit 7'],
    prerequisiteLessonIds: ['pf-u3-l1'],
    steps: [
      {
        id: 'pf-u4-l1-s1',
        kind: 'narrative',
        title: 'Motion That Repeats',
        bodyMarkdown:
          'An **oscillation** is a back-and-forth motion about a rest position. Its **period** T is the time for one full cycle and its **frequency** f = 1/T is the number of cycles per second, measured in hertz.\n\nTwo systems come up constantly:\n\n- **Simple pendulum** (small swings): T = 2π√(L/g)\n- **Mass on a spring:** T = 2π√(m/k)\n\nA **wave** is an oscillation that travels. Each point repeats the motion of its neighbour a little later, and the pattern moves at speed v = fλ, where λ is the wavelength.',
        callout: {
          tone: 'key-idea',
          text: 'For small swings, a pendulum’s period depends only on its length and on g. The mass of the bob and the size of the swing do not appear in the formula.',
        },
      },
      {
        id: 'pf-u4-l1-s2',
        kind: 'checkpoint',
        title: 'A Heavier Pendulum Bob',
        question: {
          type: 'mcq',
          prompt:
            'A pendulum takes 2.0 s per swing. The bob is replaced with one four times as heavy on the same string. What is the new period?',
          options: ['4.0 s', '2.0 s', '1.0 s'],
          correct: 1,
          explanation:
            'A heavier bob is pulled back harder by gravity but is equally harder to accelerate, so the two effects cancel, the same cancellation that makes all objects fall at the same rate. To change the period you must change the length: four times the length doubles the period.',
          points: 15,
        },
        misconceptionHints: {
          '0': 'Look at T = 2π√(L/g) and list the quantities in it. Is mass one of them?',
          '2': 'Look at T = 2π√(L/g) and list the quantities in it. Is mass one of them?',
        },
      },
      {
        id: 'pf-u4-l1-s3',
        kind: 'worked-example',
        title: 'A One-Metre Pendulum',
        problemMarkdown:
          'Find the period of a **1.0 m** simple pendulum on Earth (g = 9.8 m/s²), then its frequency.',
        steps: [
          {
            label: 'Substitute into the period formula',
            expressionOrAction: 'T = 2π√(L / g) = 2π√(1.0 / 9.8) = 2π × 0.319 ≈ 2.01 s',
            whyNote: 'A one-metre pendulum beats almost exactly once a second in each direction.',
          },
          {
            label: 'Convert to frequency',
            expressionOrAction: 'f = 1 / T = 1 / 2.01 ≈ 0.50 Hz',
            whyNote: 'Frequency and period are reciprocals: a long period is a low frequency.',
          },
        ],
      },
      {
        id: 'pf-u4-l1-s4',
        kind: 'checkpoint',
        title: 'Wave Speed',
        question: {
          type: 'mcq',
          prompt: 'A water wave has a frequency of 2 Hz and a wavelength of 1.5 m. What is its speed?',
          options: ['3.0 m/s', '0.75 m/s', '1.3 m/s'],
          correct: 0,
          explanation: 'v = fλ = 2 × 1.5 = 3.0 m/s.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'Multiply frequency by wavelength; dividing gives the wrong units.',
        },
      },
      {
        id: 'pf-u4-l1-s5',
        kind: 'synthesis',
        title: 'Periodic Motion',
        takeaways: [
          'f = 1 / T: period and frequency are reciprocals.',
          'Pendulum: T = 2π√(L/g). Spring: T = 2π√(m/k).',
          'A wave travels at v = fλ.',
        ],
        nextQuizIndex: 3,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'pf-u4-l1-fc1',
        front: 'Period of a simple pendulum (small swings)',
        back: 'T = 2π√(L/g)',
        explanation: 'Independent of the bob’s mass.',
        interleave: true,
      },
      {
        id: 'pf-u4-l1-fc2',
        front: 'Period of a mass m on a spring of stiffness k',
        back: 'T = 2π√(m/k)',
        explanation: 'More mass slows it down; a stiffer spring speeds it up.',
        interleave: true,
      },
      {
        id: 'pf-u4-l1-fc3',
        front: 'Wave speed in terms of frequency and wavelength',
        back: 'v = fλ',
        explanation: 'One wavelength passes a point in one period.',
        interleave: true,
      },
    ],
  },
]

const GATE = { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 } as const

const PF_UNITS: TrackUnit[] = [
  {
    id: 'pf-u1-kinematics',
    title: 'Kinematics & Projectile Motion',
    anchoringPhenomenon:
      'A ball thrown sideways and a ball dropped from the same height land at the same moment, because horizontal and vertical motion run independently.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: PF_U1_LESSONS,
  },
  {
    id: 'pf-u2-forces',
    title: 'Forces & Newton’s Laws',
    anchoringPhenomenon:
      'A puck on smooth ice keeps gliding long after the push ends: forces change motion, they are not needed to maintain it.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: PF_U2_LESSONS,
  },
  {
    id: 'pf-u3-energy-momentum',
    title: 'Energy & Momentum',
    anchoringPhenomenon:
      'A roller coaster’s speed at the bottom of a drop depends only on how far it fell, not on the shape of the track.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: PF_U3_LESSONS,
  },
  {
    id: 'pf-u4-oscillations-waves',
    title: 'Oscillations & Waves',
    anchoringPhenomenon:
      'A playground swing keeps the same rhythm whether a small child or an adult sits on it.',
    capstoneQuizIndex: 3,
    masteryGate: GATE,
    lessons: PF_U4_LESSONS,
  },
]

const PF_TRACK: CurriculumTrack = {
  id: 'track-physics-foundations',
  slug: 'physics-foundations',
  packId: 'physics-foundations',
  title: 'Physics Foundations: Motion, Forces & Energy',
  category: 'Science',
  subject: 'Physics',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: ['track-algebra-linear-systems'],
  srsInterleaveDefault: true,
  units: PF_UNITS,
}

export const PHYSICS_FOUNDATIONS_PACK: ContentPack = {
  id: 'physics-foundations',
  name: 'Physics Foundations: Motion, Forces & Energy',
  description:
    'Kinematics, projectile motion, Newton’s laws, friction, work and energy, momentum and collisions, oscillations and wave speed.',
  subject: 'Physics',
  category: 'Science',
  icon: '🎯',
  modelId: 'projectile-motion-2d',
  relatedModelIds: ['kepler', 'dc-rc-circuits-2d'],
  standards: 'AP Physics 1 Units 1–4 & 7',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  srsInterleave: true,
  gradeBand: 'HS',
  prerequisitePackIds: ['algebra-linear-systems'],
  track: PF_TRACK,
  units: PF_UNITS,
  quizzes: [
    {
      title: 'Kinematics & Projectile Motion',
      description: 'Constant-acceleration equations, motion graphs, and launches split into components.',
      subject: 'Physics',
      difficulty: 'easy',
      timeLimitSec: 540,
      srsInterleave: true,
      lessonId: 'pf-u1-l2',
      modelId: 'projectile-motion-2d',
      questions: [
        {
          type: 'mcq',
          prompt: 'A cyclist starts from rest and accelerates at 2 m/s² for 5 s. What is the final velocity?',
          options: ['2.5 m/s', '10 m/s', '25 m/s', '7 m/s'],
          correct: 1,
          explanation: 'v = u + at = 0 + 2 × 5 = 10 m/s.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'The same cyclist (from rest, 2 m/s² for 5 s) covers how many metres in that time?',
          correct: '25',
          alternatives: ['25 m', '25m'],
          explanation: 's = ½at² = ½ × 2 × 5² = 25 m.',
          points: 10,
        },
        {
          type: 'figure',
          prompt:
            'This line plots position x (m, vertical) against time t (s, horizontal). Find the velocity in m/s, to the nearest tenth.',
          figure: {
            template: 'coordinate-line',
            givens: { x1: 0, y1: 4, x2: 6, y2: 19 },
            ask: 'slope',
            rounding: 'tenth',
            ranges: { y1: [0, 8], x2: [3, 8], y2: [12, 30] },
          },
          explanation: 'Velocity is the slope of a position–time graph: Δx / Δt.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'At the highest point of a ball thrown straight up, the ball’s acceleration is zero.',
          correct: false,
          explanation: 'Its velocity is momentarily zero, but gravity still accelerates it downward at 9.8 m/s².',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A projectile is launched at 20 m/s at 30° above the horizontal. What is its horizontal velocity component?',
          options: ['10.0 m/s', '20.0 m/s', '17.3 m/s', '11.5 m/s'],
          correct: 2,
          explanation: 'vₓ = v₀ cos θ = 20 × cos 30° ≈ 17.3 m/s. The 10.0 m/s is the vertical component.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt:
            'On level ground and at the same launch speed, a 25° launch has the same range as a launch at which other angle?',
          options: ['65°', '50°', '45°', '75°'],
          correct: 0,
          explanation: 'Range depends on sin(2θ), and sin(50°) = sin(130°), so 25° and 65° match.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A stone is dropped from rest and falls for 3.0 s. Taking g = 9.8 m/s², how far does it fall?',
          options: ['29.4 m', '14.7 m', '88.2 m', '44.1 m'],
          correct: 3,
          explanation: 's = ½gt² = ½ × 9.8 × 3² = 44.1 m. The 29.4 is its speed in m/s after 3 s.',
          points: 15,
        },
      ],
    },
    {
      title: 'Dynamics: Forces & Newton’s Laws',
      description: 'Net force, third-law pairs, apparent weight, and friction on level ground and ramps.',
      subject: 'Physics',
      difficulty: 'medium',
      timeLimitSec: 600,
      srsInterleave: true,
      lessonId: 'pf-u2-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'A net force of 12 N acts on a 3 kg cart. What is its acceleration?',
          options: ['36 m/s²', '0.25 m/s²', '4 m/s²', '9 m/s²'],
          correct: 2,
          explanation: 'a = F_net / m = 12 / 3 = 4 m/s².',
          points: 10,
        },
        {
          type: 'figure',
          prompt: 'Two forces act on one object, shown as vectors u and v (in N). Find the size of the net force, to the nearest tenth.',
          figure: {
            template: 'vector-2d',
            givens: { ux: 5, uy: 0, vx: 0, vy: 12 },
            ask: 'resultantMag',
            rounding: 'tenth',
            ranges: { ux: [3, 9], vy: [4, 12] },
          },
          explanation: 'Add the components, then use Pythagoras on the resultant.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'An object moving at constant velocity must have a net force acting in its direction of motion.',
          correct: false,
          explanation: 'Constant velocity means zero acceleration, so the net force is zero (Newton’s first law).',
          points: 10,
        },
        {
          type: 'mcq',
          prompt:
            'A book rests on a table. Which force is the Newton’s third-law partner of Earth’s gravitational pull on the book?',
          options: [
            'The table’s normal force on the book',
            'The book’s gravitational pull on Earth',
            'The book’s push on the table',
            'Friction between the book and the table',
          ],
          correct: 1,
          explanation:
            'Third-law pairs swap the two objects and are the same type of force. The normal force balances the weight but acts on the same object, so it is not the partner.',
          points: 15,
        },
        {
          type: 'figure',
          prompt: 'Find the normal force on the block in newtons, to the nearest tenth.',
          figure: {
            template: 'inclined-plane',
            givens: { mass: 8, angle: 25, mu: 0.2 },
            ask: 'normalForce',
            rounding: 'tenth',
            ranges: { mass: [4, 20], angle: [15, 45], mu: [0.1, 0.3] },
          },
          explanation: 'N = mg cos θ with g = 9.8 m/s².',
          points: 15,
        },
        {
          type: 'mcq',
          prompt:
            'A 60 kg person stands on a scale in a lift accelerating upward at 2 m/s². Taking g = 9.8 m/s², what force does the scale read?',
          options: ['708 N', '588 N', '468 N', '120 N'],
          correct: 0,
          explanation: 'N − mg = ma, so N = m(g + a) = 60 × 11.8 = 708 N.',
          points: 15,
        },
        {
          type: 'fill',
          prompt:
            'A 10 kg crate slides across a level floor with a friction coefficient of 0.5. Taking g = 9.8 m/s², what is the friction force in newtons?',
          correct: '49',
          alternatives: ['49 N', '49N'],
          explanation: 'On level ground N = mg = 98 N, so f = μN = 0.5 × 98 = 49 N.',
          points: 15,
        },
      ],
    },
    {
      title: 'Energy, Momentum & Collisions',
      description: 'Work, kinetic and potential energy, power, impulse, and conservation of momentum.',
      subject: 'Physics',
      difficulty: 'medium',
      timeLimitSec: 600,
      srsInterleave: true,
      lessonId: 'pf-u3-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'What is the kinetic energy of a 2 kg ball moving at 3 m/s?',
          options: ['6 J', '18 J', '3 J', '9 J'],
          correct: 3,
          explanation: 'KE = ½mv² = ½ × 2 × 3² = 9 J.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'How much work is done against gravity lifting a 10 kg box straight up by 2 m? Take g = 9.8 m/s².',
          options: ['20 J', '196 J', '98 J', '49 J'],
          correct: 1,
          explanation: 'W = mgh = 10 × 9.8 × 2 = 196 J.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'A motor does 600 J of work in 4 s. What is its power in watts?',
          correct: '150',
          alternatives: ['150 W', '150W'],
          explanation: 'P = W / t = 600 / 4 = 150 W.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt:
            'A child starts from rest at the top of a frictionless slide 5 m high. Taking g = 9.8 m/s², what is the speed at the bottom?',
          options: ['9.9 m/s', '49 m/s', '7.0 m/s', '98 m/s'],
          correct: 0,
          explanation: 'v = √(2gh) = √(2 × 9.8 × 5) = √98 ≈ 9.9 m/s.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A 3 kg cart moving at 4 m/s hits a stationary 1 kg cart and they stick together. What is their velocity afterward?',
          options: ['4 m/s', '2 m/s', '3 m/s', '1 m/s'],
          correct: 2,
          explanation: 'Momentum before = 3 × 4 = 12 kg·m/s. After: (3 + 1)v = 12, so v = 3 m/s.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'Kinetic energy is conserved in every collision.',
          correct: false,
          explanation: 'Momentum is conserved in every collision without outside forces; kinetic energy only in elastic ones.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Order these moving objects from SMALLEST to LARGEST momentum:',
          options: [
            '0.15 kg ball at 40 m/s',
            '5 kg bowling ball at 6 m/s',
            '70 kg runner at 8 m/s',
            '1000 kg car at 1 m/s',
          ],
          correct: [0, 1, 2, 3],
          explanation: 'p = mv gives 6, 30, 560 and 1000 kg·m/s. A slow, massive car out-carries a fast, light ball.',
          points: 15,
        },
      ],
    },
    {
      title: 'Oscillations & Waves',
      description: 'Period and frequency, pendulums, masses on springs, and the wave equation.',
      subject: 'Physics',
      difficulty: 'medium',
      timeLimitSec: 480,
      srsInterleave: true,
      lessonId: 'pf-u4-l1',
      questions: [
        {
          type: 'fill',
          prompt: 'An oscillator has a period of 0.25 s. What is its frequency in hertz?',
          correct: '4',
          alternatives: ['4 Hz', '4Hz'],
          explanation: 'f = 1 / T = 1 / 0.25 = 4 Hz.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'The length of a simple pendulum is made four times as long. Its period:',
          options: ['Is four times as long', 'Is halved', 'Doubles', 'Is unchanged'],
          correct: 2,
          explanation: 'T is proportional to √L, and √4 = 2.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'For small swings, making a pendulum’s bob heavier makes its period longer.',
          correct: false,
          explanation: 'T = 2π√(L/g) contains no mass.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A mass on a spring oscillates with period T. If the mass is made four times as large on the same spring, the period becomes:',
          options: ['T / 2', '2T', '4T', 'T'],
          correct: 1,
          explanation: 'T = 2π√(m/k), so the period scales with √m.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A wave on a rope has a frequency of 5 Hz and a wavelength of 2 m. What is its speed?',
          options: ['10 m/s', '2.5 m/s', '0.4 m/s', '7 m/s'],
          correct: 0,
          explanation: 'v = fλ = 5 × 2 = 10 m/s.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Where in its motion is a mass on a spring moving fastest?',
          options: [
            'At maximum stretch',
            'At maximum compression',
            'Halfway between the centre and an end',
            'As it passes through the rest position',
          ],
          correct: 3,
          explanation:
            'At the rest position all the energy is kinetic. At the two ends the mass is momentarily at rest and all the energy is stored in the spring.',
          points: 15,
        },
      ],
    },
  ],
}
