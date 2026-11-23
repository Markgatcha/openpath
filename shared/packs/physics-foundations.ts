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
          '**Velocity** is how fast position changes: $v = \Delta x / \Delta t$. **Acceleration** is how fast velocity changes: $a = \Delta v / \Delta t$. They are different quantities. A car cruising at a steady 30 m/s has a large velocity and zero acceleration; a car pulling away from a red light has a small velocity and a large acceleration.\n\nWhen acceleration is constant, three equations describe everything, with $u$ the starting velocity:\n\n- $v = u + at$\n- $s = ut + \tfrac{1}{2}at^2$\n- $v^2 = u^2 + 2as$',
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
          'They are moving faster',
          'They are accelerating',
          'They started farther from the origin',
        ],
        correctPredictionIndex: 0,
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
          'Once a projectile leaves the launcher, the only force on it (ignoring air resistance) is gravity, which points straight down. So:\n\n- **Horizontally** nothing pushes or pulls: $v_x = v_0 \cos\theta$ stays constant.\n- **Vertically** it is in free fall: $v_y = v_0 \sin\theta - gt$.\n\nThe curved path is just these two simple motions happening at the same time. Time is the only thing they share.',
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
          '45°',
          '30°, because a flatter throw keeps more horizontal speed',
          '60°, because the projectile stays in the air longer',
        ],
        correctPredictionIndex: 0,
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
          'Range is horizontal speed × time of flight; 30° has more speed and less time, 60° has the reverse, and 45° gives the largest product',
          'Gravity is weaker at 45°',
          'The projectile travels a longer curved path at 45°',
        ],
        correctExplainIndex: 0,
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
            'They land at the same time',
            'Ball A, because it travels a shorter path',
            'Ball B, because it is moving faster',
          ],
          correct: 0,
          explanation:
            'Both start with zero vertical velocity and fall the same height under the same gravity. Horizontal speed has no effect on the fall time.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'Path length does not set the fall time. Only the vertical motion does.',
          '2': 'Ball B is faster sideways, but its downward motion is identical to ball A’s.',
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
          '**First law:** with zero net force, an object keeps its velocity. It stays at rest or keeps moving in a straight line at constant speed.\n\n**Second law:** a net force causes acceleration, $a = F_{net} / m$. The same push accelerates a heavier object less.\n\n**Third law:** forces come in pairs. If A pushes on B, B pushes on A with equal size in the opposite direction. The two forces act on *different* objects, so they never cancel each other.',
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
          'Forces are vectors: perpendicular forces combine by Pythagoras, √(6² + 8²) = 10 N',
          'Because part of each force is lost to friction',
          'Because the larger force cancels the smaller one',
        ],
        correctExplainIndex: 0,
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
          'On a ramp at angle $\theta$, split the weight $mg$ into two parts:\n\n- **Along the slope:** $mg\sin\theta$, pulling the block downhill.\n- **Into the slope:** $mg\cos\theta$, balanced by the normal force $N$.\n\nSliding friction opposes the motion with size $f = \mu N = \mu mg\cos\theta$. The net force downhill is therefore $mg\sin\theta - \mu mg\cos\theta$.',
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
          'The downhill pull and the friction both scale with m, so m cancels in a = g(sin θ − μ cos θ)',
          'Heavier blocks feel less friction',
          'Gravity pulls equally hard on every object',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Doubling the mass doubles the net force and doubles the inertia. The acceleration stays at 9.8 × (sin 30° − 0.2 cos 30°) ≈ 3.20 m/s².',
      },
      {
        id: 'pf-u2-l2-s3',
        kind: 'worked-example',
        title: 'Block on a 30° Ramp',
        problemMarkdown:
          'A **10 kg** block slides down a **30°** ramp with $\mu = 0.2$. Taking g = 9.8 m/s², find its acceleration.',
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
          '**Work** is energy transferred by a force: $W = Fd\cos\theta$, where $\theta$ is the angle between the force and the movement. **Kinetic energy** is $\tfrac{1}{2}mv^2$ and **gravitational potential energy** near Earth’s surface is $mgh$.\n\nWhen only gravity does work, the total $\tfrac{1}{2}mv^2 + mgh$ stays the same. That lets you jump straight from a starting height and speed to a final speed, whatever the route in between. **Power** is the rate of doing work, $P = W/t$, measured in watts.',
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
          'Both hit at the same speed',
          'The 70° launch, because it falls from higher',
          'The 20° launch, because it is aimed more toward the ground',
        ],
        correctPredictionIndex: 0,
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
          options: ['4 times as large', '2 times as large', '√2 times as large'],
          correct: 0,
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
          '**Momentum** is $p = mv$, and it has a direction. A force acting for a time changes it: **impulse** $F\Delta t = \Delta p$.\n\nWhen two objects collide and no outside force acts, the forces between them are a third-law pair, so whatever momentum one loses the other gains. **Total momentum before equals total momentum after**, in every collision.\n\nKinetic energy is different. It is conserved only in a perfectly **elastic** collision. In an **inelastic** collision some of it becomes heat, sound and deformation; when the objects stick together the loss is as large as momentum conservation allows.',
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
            alternatives: ['20 N', '20N', '20.0', '-20'],
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
            'Increasing the time over which the passenger’s momentum changes',
            'Reducing the passenger’s change in momentum',
            'Reducing the passenger’s mass',
          ],
          correct: 0,
          explanation:
            'The passenger’s momentum must drop to zero either way. Spreading that change over a longer time makes the force F = Δp / Δt smaller.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'The passenger still goes from the car’s speed to rest, so Δp is the same with or without the airbag.',
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
