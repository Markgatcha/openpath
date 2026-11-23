import type { ContentPack } from './types'
import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'

const ES_U1_LESSONS: PackLesson[] = [
  {
    id: 'es-u1-l1',
    unitId: 'es-u1-ecosystems',
    title: 'Energy Flow, Food Webs & the 10% Rule',
    summary: 'Follow energy from sunlight through producers and consumers, and see why each level supports less life than the one below.',
    estimatedMinutes: 8,
    standards: ['AP Env Sci Unit 1 (The Living World: Ecosystems)'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'es-u1-l1-s1',
        kind: 'narrative',
        title: 'Energy Moves One Way',
        bodyMarkdown:
          '**Producers** such as plants and algae capture sunlight and store it as chemical energy. **Primary consumers** eat producers, **secondary consumers** eat them, and so on. Each step is a **trophic level**.\n\nMatter is recycled in an ecosystem, but energy is not. At every level most of the energy an organism takes in is used for its own life processes and leaves as heat. Only about **10%** ends up stored in its body, where the next level can eat it.',
        callout: {
          tone: 'key-idea',
          text: 'Matter cycles. Energy flows through once and leaves as heat.',
        },
      },
      {
        id: 'es-u1-l1-s2',
        kind: 'worked-example',
        title: 'Four Levels of a Grassland',
        problemMarkdown:
          'The grasses in a field store **20,000 kJ** of energy. Using the 10% rule, estimate the energy stored at each of the next three trophic levels.',
        steps: [
          {
            label: 'Primary consumers (grasshoppers)',
            expressionOrAction: '10% of 20,000 kJ = 2,000 kJ',
            whyNote: 'Dividing by 10 is the same as taking 10%.',
          },
          {
            label: 'Secondary consumers (frogs)',
            expressionOrAction: '10% of 2,000 kJ = 200 kJ',
            whyNote: 'The rule applies again at every step up.',
          },
          {
            label: 'Tertiary consumers (hawks)',
            expressionOrAction: '10% of 200 kJ = 20 kJ',
            whyNote: 'Three steps up, only one thousandth of the original energy is left.',
          },
        ],
      },
      {
        id: 'es-u1-l1-s3',
        kind: 'checkpoint',
        title: 'Two Levels Up',
        question: {
          type: 'fill',
          prompt:
            'Algae in a pond store 50,000 kJ. Using the 10% rule, how many kJ are stored by the secondary consumers, two levels above the algae?',
          correct: '500',
          alternatives: ['500 kJ', '500kJ'],
          explanation: '50,000 → 5,000 for primary consumers → 500 for secondary consumers.',
          points: 15,
        },
      },
      {
        id: 'es-u1-l1-s4',
        kind: 'checkpoint',
        title: 'Why Food Chains Are Short',
        question: {
          type: 'mcq',
          prompt: 'Why do food chains rarely have more than four or five trophic levels?',
          options: [
            'Top predators have no natural enemies',
            'Too little energy is left at the top to support another level',
            'Producers cannot grow fast enough to be eaten',
            'Decomposers remove the top predators',
          ],
          correct: 1,
          explanation:
            'With roughly 90% lost at each step, the energy available falls by a factor of ten per level. After four or five steps there is not enough to sustain a population.',
          points: 10,
        },
      },
      {
        id: 'es-u1-l1-s5',
        kind: 'synthesis',
        title: 'Energy in Ecosystems',
        takeaways: [
          'Energy enters most ecosystems as sunlight captured by producers.',
          'Only about 10% of the energy at one trophic level is stored at the next.',
          'Energy loss at each step limits the length of food chains and the number of top predators.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'es-u1-l1-fc1',
        front: 'What is a trophic level?',
        back: 'A feeding position in a food chain, such as producer or primary consumer.',
        explanation: 'Each level gets its energy from the level below it.',
        interleave: true,
      },
      {
        id: 'es-u1-l1-fc2',
        front: 'State the 10% rule.',
        back: 'About 10% of the energy at one trophic level is stored at the next.',
        explanation: 'The rest is used by the organisms and released as heat.',
        interleave: true,
      },
      {
        id: 'es-u1-l1-fc3',
        front: 'Does energy cycle within an ecosystem?',
        back: 'No. Matter cycles; energy flows through once.',
        explanation: 'Energy arrives as sunlight and leaves as heat.',
        interleave: true,
      },
    ],
  },
  {
    id: 'es-u1-l2',
    unitId: 'es-u1-ecosystems',
    title: 'The Carbon Cycle',
    summary: 'Trace carbon between air, living things, oceans and rock, and separate the fast exchanges from the slow ones.',
    estimatedMinutes: 8,
    standards: ['AP Env Sci Unit 1 (The Living World: Ecosystems)'],
    prerequisiteLessonIds: ['es-u1-l1'],
    steps: [
      {
        id: 'es-u1-l2-s1',
        kind: 'narrative',
        title: 'Reservoirs and Flows',
        bodyMarkdown:
          'Carbon is stored in **reservoirs**: the atmosphere (as carbon dioxide), living things, soils, the oceans, and rocks and fossil fuels. It moves between them by a few processes:\n\n- **Photosynthesis** takes carbon dioxide out of the air and builds it into sugars.\n- **Respiration** and **decomposition** break those sugars down and return carbon dioxide.\n- The **ocean surface** absorbs and releases carbon dioxide.\n- **Burial** slowly locks carbon into sediments, and over millions of years into coal, oil and gas.\n- **Combustion** returns that buried carbon to the air in minutes.',
        callout: {
          tone: 'key-idea',
          text: 'Photosynthesis and respiration trade carbon within years. Burial takes millions of years; burning undoes it almost instantly.',
        },
      },
      {
        id: 'es-u1-l2-s2',
        kind: 'checkpoint',
        title: 'From Air to Fuel and Back',
        question: {
          type: 'order',
          prompt: 'Put these stages in the order a carbon atom would pass through them, starting in the air:',
          options: [
            'Carbon dioxide in the atmosphere',
            'Built into a plant by photosynthesis',
            'Buried and compressed into coal over millions of years',
            'Released as carbon dioxide when the coal is burned',
          ],
          correct: [0, 1, 2, 3],
          explanation: 'Photosynthesis fixes the carbon, burial stores it, and combustion returns it to the atmosphere.',
          points: 15,
        },
      },
      {
        id: 'es-u1-l2-s3',
        kind: 'worked-example',
        title: 'A Simple Carbon Budget',
        problemMarkdown:
          'In an illustrative year, human activity adds **11 units** of carbon to the atmosphere. The oceans absorb **3 units** and land plants absorb **3 units**. How much stays in the air?',
        steps: [
          {
            label: 'Add up what is removed',
            expressionOrAction: '3 + 3 = 6 units absorbed',
            whyNote: 'Oceans and land plants are both carbon sinks: they take in more than they give out.',
          },
          {
            label: 'Subtract from what was added',
            expressionOrAction: '11 − 6 = 5 units remain',
            whyNote: 'The numbers are rounded for practice, but the pattern is real: a bit under half of what is emitted stays in the atmosphere.',
          },
          {
            label: 'Interpret',
            expressionOrAction: 'The atmospheric reservoir grows every year that sources exceed sinks.',
            whyNote: 'A reservoir rises whenever inflow is larger than outflow, like a bath with the tap running faster than the drain.',
          },
        ],
      },
      {
        id: 'es-u1-l2-s4',
        kind: 'checkpoint',
        title: 'Slow Reservoir, Fast Release',
        question: {
          type: 'truefalse',
          prompt: 'Burning fossil fuels moves carbon from a reservoir that formed over millions of years into the atmosphere.',
          correct: true,
          explanation: 'Coal, oil and gas are carbon that was buried long ago. Combustion releases it far faster than burial can store it again.',
          points: 10,
        },
      },
      {
        id: 'es-u1-l2-s5',
        kind: 'synthesis',
        title: 'Carbon on the Move',
        takeaways: [
          'Carbon moves between the atmosphere, living things, soils, oceans and rock.',
          'Photosynthesis removes carbon dioxide from the air; respiration, decomposition and combustion return it.',
          'A reservoir grows when more flows in than out, which is what has happened to atmospheric carbon dioxide.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'es-u1-l2-fc1',
        front: 'Which process removes carbon dioxide from the atmosphere and stores it in living things?',
        back: 'Photosynthesis.',
        explanation: 'Plants and algae build carbon dioxide into sugars.',
        interleave: true,
      },
      {
        id: 'es-u1-l2-fc2',
        front: 'What is a carbon sink?',
        back: 'A reservoir that absorbs more carbon than it releases.',
        explanation: 'Oceans and growing forests are the main sinks.',
        interleave: true,
      },
      {
        id: 'es-u1-l2-fc3',
        front: 'Why does burning fossil fuels raise atmospheric carbon dioxide?',
        back: 'It releases long-buried carbon much faster than natural processes store it.',
        explanation: 'Sources exceed sinks, so the atmospheric reservoir grows.',
        interleave: true,
      },
    ],
  },
]

const ES_U2_LESSONS: PackLesson[] = [
  {
    id: 'es-u2-l1',
    unitId: 'es-u2-climate',
    title: 'The Greenhouse Effect & Earth’s Energy Balance',
    summary: 'Balance incoming sunlight against outgoing infrared, and see how an absorbing atmosphere sets the surface temperature.',
    estimatedMinutes: 10,
    standards: ['AP Env Sci Unit 9 (Global Change)', 'NGSS HS-ESS2-4'],
    prerequisiteLessonIds: ['es-u1-l2'],
    visual: {
      kind: 'model-2d',
      modelId: 'greenhouse-effect-2d',
      initialParams: { absorbPct: 78, albedo: 0.3, sunPct: 100, showFlows: true },
      highlightHotspots: ['sunlight', 'atmosphere', 'space'],
    },
    steps: [
      {
        id: 'es-u2-l1-s1',
        kind: 'narrative',
        title: 'Energy In, Energy Out',
        bodyMarkdown:
          'Averaged over the whole globe, day and night, about **340 W/m²** of sunlight reaches Earth. Clouds, ice and bright surfaces reflect roughly 30% of it straight back to space. That reflected fraction is the **albedo**. The rest, about **238 W/m²**, is absorbed and warms the planet.\n\nA warm planet radiates **infrared**. The temperature settles where the infrared leaving for space equals the sunlight absorbed. Greenhouse gases such as water vapour, carbon dioxide and methane let sunlight through but absorb infrared and re-emit it in all directions, including back down. The surface must then be warmer to push the same energy out to space.',
        callout: {
          tone: 'pitfall',
          text: 'The greenhouse effect is not a pollution problem in itself. Without it Earth’s surface would be frozen. The concern is how quickly it is being strengthened.',
        },
      },
      {
        id: 'es-u2-l1-s2',
        kind: 'predict-observe-explain',
        title: 'Earth With a Transparent Atmosphere',
        predictionPrompt:
          'Keep Earth’s sunlight and albedo, but imagine an atmosphere that absorbs no infrared at all. Where would the average surface temperature settle?',
        predictionChoices: [
          'About +15 °C, the same as today',
          'Close to absolute zero',
          'About −18 °C',
        ],
        correctPredictionIndex: 2,
        visual: {
          kind: 'model-2d',
          modelId: 'greenhouse-effect-2d',
          initialParams: { absorbPct: 78, albedo: 0.3, sunPct: 100, showFlows: true },
          highlightHotspots: ['atmosphere', 'surface'],
          challengeId: 'no-greenhouse-gases',
        },
        observeInstruction:
          'Drag “Infrared absorbed by the atmosphere” down to 0% and watch the temperature graph. Note where the surface settles and what happens to the “Back to surface” arrow.',
        explainPrompt: 'Why does the surface cool when the atmosphere stops absorbing infrared?',
        explainOptions: [
          'No infrared is sent back down, so the surface only needs to be warm enough to radiate the absorbed sunlight directly to space',
          'Less sunlight reaches the ground',
          'The atmosphere reflects more sunlight',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'The absorbed sunlight is unchanged at 238 W/m². With nothing returning infrared to the surface, it balances at about 255 K (−18 °C). The natural greenhouse effect accounts for the roughly 33 °C between that and today’s average of about 15 °C.',
      },
      {
        id: 'es-u2-l1-s3',
        kind: 'worked-example',
        title: 'How Much Sunlight Is Absorbed?',
        problemMarkdown: 'Earth receives an average of **340 W/m²** and has an albedo of **0.30**. How much sunlight is absorbed?',
        steps: [
          {
            label: 'Find the fraction that is not reflected',
            expressionOrAction: '1 − 0.30 = 0.70',
            whyNote: 'Albedo is the reflected fraction, so the rest is absorbed.',
          },
          {
            label: 'Multiply by the incoming sunlight',
            expressionOrAction: '340 × 0.70 = 238 W/m²',
            whyNote: 'This is the energy the planet must radiate back to space to hold a steady temperature.',
          },
        ],
      },
      {
        id: 'es-u2-l1-s4',
        kind: 'checkpoint',
        title: 'A Darker Planet',
        question: {
          type: 'fill',
          prompt: 'A planet receives an average of 340 W/m² of sunlight and has an albedo of 0.25. How many W/m² does it absorb?',
          correct: '255',
          alternatives: ['255 W/m²', '255 W/m2'],
          explanation: '340 × (1 − 0.25) = 340 × 0.75 = 255 W/m².',
          points: 15,
        },
      },
      {
        id: 'es-u2-l1-s5',
        kind: 'checkpoint',
        title: 'Which Gases Absorb Infrared?',
        question: {
          type: 'mcq',
          prompt: 'Which of these gases is NOT a greenhouse gas?',
          options: [
            'Carbon dioxide (CO₂)',
            'Methane (CH₄)',
            'Water vapour (H₂O)',
            'Nitrogen (N₂)',
          ],
          correct: 3,
          explanation:
            'Nitrogen and oxygen make up about 99% of dry air but barely absorb infrared. The greenhouse effect comes from gases present in much smaller amounts.',
          points: 10,
        },
      },
      {
        id: 'es-u2-l1-s6',
        kind: 'synthesis',
        title: 'A Planet in Balance',
        takeaways: [
          'Absorbed sunlight = incoming sunlight × (1 − albedo).',
          'Temperature settles where outgoing infrared equals absorbed sunlight.',
          'Greenhouse gases absorb infrared and send part of it back down, so the surface is warmer than it would otherwise be.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'es-u2-l1-fc1',
        front: 'What is albedo?',
        back: 'The fraction of incoming sunlight a surface or planet reflects.',
        explanation: 'Earth’s albedo is about 0.3. Ice and cloud raise it; oceans and forest lower it.',
        interleave: true,
      },
      {
        id: 'es-u2-l1-fc2',
        front: 'What does a greenhouse gas do?',
        back: 'It lets sunlight pass but absorbs infrared and re-emits it in all directions.',
        explanation: 'Part of that infrared returns to the surface.',
        interleave: true,
      },
      {
        id: 'es-u2-l1-fc3',
        front: 'When is a planet’s temperature steady?',
        back: 'When the infrared it sends to space equals the sunlight it absorbs.',
        explanation: 'Any imbalance warms or cools the planet until the two match again.',
        interleave: true,
      },
    ],
  },
  {
    id: 'es-u2-l2',
    unitId: 'es-u2-climate',
    title: 'Climate Change: Evidence, Feedbacks & Oceans',
    summary: 'Tell weather from climate, see how feedback loops amplify or damp a change, and find out what extra carbon dioxide does to seawater.',
    estimatedMinutes: 10,
    standards: ['AP Env Sci Unit 9 (Global Change)', 'NGSS HS-ESS3-5'],
    prerequisiteLessonIds: ['es-u2-l1'],
    visual: {
      kind: 'model-2d',
      modelId: 'greenhouse-effect-2d',
      initialParams: { absorbPct: 78, albedo: 0.3, sunPct: 100, showFlows: true },
      highlightHotspots: ['albedo', 'surface'],
    },
    steps: [
      {
        id: 'es-u2-l2-s1',
        kind: 'narrative',
        title: 'Weather Is Not Climate',
        bodyMarkdown:
          '**Weather** is what the atmosphere is doing today. **Climate** is the long-term average, usually taken over thirty years or more. One cold week says nothing about climate, in the same way one low test score says little about a year’s grades.\n\nSeveral independent records point the same way: thermometer readings on land and at sea, heat stored in the oceans, shrinking glaciers and sea ice, and rising sea level. Air trapped in ice cores shows carbon dioxide at about 280 parts per million before industrialisation. Direct measurements now put it above 420.',
        callout: {
          tone: 'key-idea',
          text: 'A claim about climate needs decades of data from many places, not a single day or a single town.',
        },
      },
      {
        id: 'es-u2-l2-s2',
        kind: 'narrative',
        title: 'Feedback Loops',
        bodyMarkdown:
          'A **feedback** is a response that changes the thing that caused it.\n\n- A **positive feedback** amplifies the original change. Warming melts bright ice, the darker surface absorbs more sunlight, and that causes more warming. This is the ice–albedo feedback.\n- A **negative feedback** damps the original change. A warmer surface radiates much more infrared, which carries extra energy away and limits the warming.',
        callout: {
          tone: 'pitfall',
          text: '“Positive” here means self-reinforcing, not good. “Negative” means self-limiting, not bad.',
        },
      },
      {
        id: 'es-u2-l2-s3',
        kind: 'predict-observe-explain',
        title: 'More Ice, More Reflection',
        predictionPrompt:
          'Suppose ice and cloud spread so the planet reflects 40% of sunlight instead of 30%. What happens to the surface temperature?',
        predictionChoices: [
          'It rises, because reflected light warms the air',
          'It falls',
          'It stays the same',
        ],
        correctPredictionIndex: 1,
        visual: {
          kind: 'model-2d',
          modelId: 'greenhouse-effect-2d',
          initialParams: { absorbPct: 78, albedo: 0.3, sunPct: 100, showFlows: true },
          highlightHotspots: ['albedo'],
          challengeId: 'albedo-cooling',
        },
        observeInstruction:
          'Raise the albedo slider from 0.30 to 0.40. Watch the “Absorbed sunlight” bar and the temperature graph as the surface settles.',
        explainPrompt: 'Why does a higher albedo cool the surface?',
        explainOptions: [
          'Reflected sunlight leaves without being absorbed, so less energy comes in',
          'Ice gives off cold',
          'Reflected sunlight is absorbed by greenhouse gases on its way out',
        ],
        correctExplainIndex: 0,
        reconcileFeedback:
          'Less sunlight is absorbed, so the surface cools until it radiates less to match. On the real Earth a cooler surface grows more ice, which raises albedo again: the ice–albedo feedback amplifies the change in whichever direction it starts.',
      },
      {
        id: 'es-u2-l2-s4',
        kind: 'checkpoint',
        title: 'Carbon Dioxide and Seawater',
        question: {
          type: 'mcq',
          prompt: 'The oceans absorb part of the carbon dioxide people emit. What does this do to seawater?',
          options: [
            'It raises the pH, making the water more basic',
            'It has no chemical effect; the gas simply dissolves',
            'It forms carbonic acid, lowering the pH',
            'It removes dissolved oxygen directly',
          ],
          correct: 2,
          explanation:
            'Carbon dioxide reacts with water to form carbonic acid. The lower pH makes it harder for corals, shellfish and some plankton to build calcium carbonate shells. This is ocean acidification.',
          points: 10,
        },
      },
      {
        id: 'es-u2-l2-s5',
        kind: 'checkpoint',
        title: 'One Cold Day',
        question: {
          type: 'truefalse',
          prompt: 'A record cold day in one city is good evidence that the global climate is not warming.',
          correct: false,
          explanation: 'That is weather: one place, one day. Climate is the average over decades and over the whole globe.',
          points: 10,
        },
      },
      {
        id: 'es-u2-l2-s6',
        kind: 'synthesis',
        title: 'Reading a Changing Climate',
        takeaways: [
          'Climate is the long-term average of weather; trends need decades of data.',
          'Positive feedbacks amplify a change and negative feedbacks damp it.',
          'Carbon dioxide absorbed by the oceans forms carbonic acid and lowers seawater pH.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'es-u2-l2-fc1',
        front: 'Weather vs. climate?',
        back: 'Weather is short-term conditions; climate is the average over decades.',
        explanation: 'Climate trends cannot be read from a single day or season.',
        interleave: true,
      },
      {
        id: 'es-u2-l2-fc2',
        front: 'What is the ice–albedo feedback?',
        back: 'Melting ice exposes darker surface, which absorbs more sunlight and causes more melting.',
        explanation: 'It is a positive (self-reinforcing) feedback.',
        interleave: true,
      },
      {
        id: 'es-u2-l2-fc3',
        front: 'What is ocean acidification?',
        back: 'The fall in seawater pH as the ocean absorbs carbon dioxide and forms carbonic acid.',
        explanation: 'It makes shell-building harder for many marine organisms.',
        interleave: true,
      },
    ],
  },
]

const ES_U3_LESSONS: PackLesson[] = [
  {
    id: 'es-u3-l1',
    unitId: 'es-u3-resources',
    title: 'Population Growth & Carrying Capacity',
    summary: 'Compare exponential and logistic growth, estimate doubling times with the rule of 70, and sort the factors that limit a population.',
    estimatedMinutes: 8,
    standards: ['AP Env Sci Unit 3 (Populations)'],
    prerequisiteLessonIds: ['es-u1-l1'],
    steps: [
      {
        id: 'es-u3-l1-s1',
        kind: 'narrative',
        title: 'Two Shapes of Growth',
        bodyMarkdown:
          'With unlimited food and space a population grows **exponentially**: it increases by the same percentage each year, so the curve gets steeper and steeper, like a J.\n\nReal habitats run short of something. As a population nears the **carrying capacity**, the largest number the environment can support over the long term, growth slows and the curve levels off into an S. This is **logistic** growth.\n\nLimits come in two kinds. **Density-dependent** factors bite harder as crowding increases: competition for food, disease, predation. **Density-independent** factors hit regardless of crowding: a drought, a fire, a hard frost.',
        callout: {
          tone: 'key-idea',
          text: 'Carrying capacity is set by the environment, not by the species. Change the resources and it changes too.',
        },
      },
      {
        id: 'es-u3-l1-s2',
        kind: 'worked-example',
        title: 'The Rule of 70',
        problemMarkdown: 'A population grows at a steady **2% per year**. About how long does it take to double?',
        steps: [
          {
            label: 'Write the rule',
            expressionOrAction: 'Doubling time (years) ≈ 70 ÷ growth rate (% per year)',
            whyNote: 'The rule is a shortcut for exponential growth and works well for small percentages.',
          },
          {
            label: 'Substitute',
            expressionOrAction: '70 ÷ 2 = 35 years',
            whyNote: 'Use the percentage as a plain number: 2, not 0.02.',
          },
        ],
      },
      {
        id: 'es-u3-l1-s3',
        kind: 'checkpoint',
        title: 'A Faster Doubling',
        question: {
          type: 'fill',
          prompt: 'A population of rabbits grows at 5% per year. Using the rule of 70, about how many years does it take to double?',
          correct: '14',
          alternatives: ['14 years', '14 yr', 'fourteen'],
          explanation: '70 ÷ 5 = 14 years.',
          points: 15,
        },
      },
      {
        id: 'es-u3-l1-s4',
        kind: 'checkpoint',
        title: 'Which Limit Depends on Crowding?',
        question: {
          type: 'mcq',
          prompt: 'Which of these is a density-dependent limiting factor?',
          options: [
            'A late frost that kills seedlings',
            'A volcanic eruption',
            'A forest fire started by lightning',
            'A disease that spreads between animals living close together',
          ],
          correct: 3,
          explanation: 'Disease spreads more easily in a crowded population. The other three strike regardless of how dense the population is.',
          points: 10,
        },
      },
      {
        id: 'es-u3-l1-s5',
        kind: 'synthesis',
        title: 'How Populations Grow',
        takeaways: [
          'Exponential growth is J-shaped; logistic growth levels off at the carrying capacity.',
          'Doubling time in years is about 70 divided by the percentage growth rate.',
          'Density-dependent limits strengthen with crowding; density-independent limits do not.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'es-u3-l1-fc1',
        front: 'What is carrying capacity?',
        back: 'The largest population an environment can support over the long term.',
        explanation: 'Logistic growth levels off as a population approaches it.',
        interleave: true,
      },
      {
        id: 'es-u3-l1-fc2',
        front: 'State the rule of 70.',
        back: 'Doubling time ≈ 70 ÷ percentage growth rate.',
        explanation: 'At 2% per year a quantity doubles in about 35 years.',
        interleave: true,
      },
      {
        id: 'es-u3-l1-fc3',
        front: 'Give one density-dependent limiting factor.',
        back: 'Competition, disease or predation.',
        explanation: 'Each has a larger effect when the population is more crowded.',
        interleave: true,
      },
    ],
  },
  {
    id: 'es-u3-l2',
    unitId: 'es-u3-resources',
    title: 'Energy Resources & Shared Resources',
    summary: 'Sort renewable from non-renewable energy, work in kilowatt-hours, and see why shared resources get overused.',
    estimatedMinutes: 10,
    standards: ['AP Env Sci Unit 6 (Energy Resources and Consumption)'],
    prerequisiteLessonIds: ['es-u3-l1'],
    steps: [
      {
        id: 'es-u3-l2-s1',
        kind: 'narrative',
        title: 'Renewable and Non-Renewable',
        bodyMarkdown:
          '**Non-renewable** resources form far more slowly than we use them: coal, oil, natural gas, and the uranium used in nuclear power. **Renewable** resources are replenished on a human timescale: sunlight, wind, flowing water, heat from the ground, and plant material that is regrown.\n\nElectrical energy is sold by the **kilowatt-hour (kWh)**: the energy used by a 1,000-watt device running for one hour.\n\nEnergy (kWh) = power (kW) × time (hours)',
        callout: {
          tone: 'pitfall',
          text: 'A kilowatt is a rate of using energy. A kilowatt-hour is an amount of energy. A bill charges for kilowatt-hours.',
        },
      },
      {
        id: 'es-u3-l2-s2',
        kind: 'worked-example',
        title: 'Swapping a Light Bulb',
        problemMarkdown:
          'A **60 W** filament bulb is replaced by a **10 W** LED that gives the same light. How much energy is saved over **1,000 hours** of use?',
        steps: [
          {
            label: 'Convert watts to kilowatts',
            expressionOrAction: '60 W = 0.06 kW and 10 W = 0.01 kW',
            whyNote: 'Divide watts by 1,000.',
          },
          {
            label: 'Energy used by each bulb',
            expressionOrAction: '0.06 × 1,000 = 60 kWh and 0.01 × 1,000 = 10 kWh',
            whyNote: 'Energy is power multiplied by time.',
          },
          {
            label: 'Subtract',
            expressionOrAction: '60 − 10 = 50 kWh saved',
            whyNote: 'Using less energy for the same result is efficiency, and it is usually the cheapest way to cut demand.',
          },
        ],
      },
      {
        id: 'es-u3-l2-s3',
        kind: 'faded-practice',
        title: 'Running a Heater',
        promptMarkdown: 'A **2,000 W** electric heater runs for **3 hours**. Finish the calculation of the energy it uses.',
        completedSteps: ['Convert the power to kilowatts: 2,000 W ÷ 1,000 = 2 kW', 'Energy = power × time'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'How many kilowatt-hours does the heater use?',
            correct: '6',
            alternatives: ['6 kWh', '6kWh', 'six'],
            explanation: '2 kW × 3 h = 6 kWh.',
            points: 15,
          },
        },
        misconceptionHints: {
          '6000': 'That is watt-hours. Convert the power to kilowatts first.',
          '2': 'That is the power in kilowatts. Multiply it by the 3 hours.',
        },
      },
      {
        id: 'es-u3-l2-s4',
        kind: 'branching-scenario',
        title: 'The Shared Fishing Lake',
        startNodeId: 'start',
        nodes: {
          start: {
            promptMarkdown:
              'Ten families fish the same lake. The fish population stays healthy if each family takes **20 fish** a week. Your family could sell more. What do you do?',
            choices: [
              {
                label: 'Take 40 a week. One family will not make a difference',
                nextNodeId: 'crash',
                feedback: 'You gain all the benefit of the extra fish, while the cost is spread across everyone. Every family faces the same temptation.',
                outcome: 'unsafe',
              },
              {
                label: 'Keep to 20 and propose a limit everyone agrees to',
                nextNodeId: 'agree',
                feedback: 'Restraint by one family only works if the others can be trusted to do the same, so an agreed rule matters.',
                outcome: 'optimal',
              },
            ],
          },
          crash: {
            promptMarkdown:
              'The other families see your catch and raise theirs too. Within two seasons there are too few adult fish left to breed, and everyone’s catch collapses. What does this show?',
            choices: [
              {
                label: 'A shared resource with no rules tends to be overused, even when everyone loses in the end',
                nextNodeId: 'agree',
                feedback: 'Yes. This pattern is called the tragedy of the commons.',
                outcome: 'optimal',
              },
              {
                label: 'The lake simply had too few fish to begin with',
                nextNodeId: 'agree',
                feedback: 'The lake supported 200 fish a week indefinitely. It failed because the catch went above what the population could replace.',
                outcome: 'suboptimal',
              },
            ],
          },
          agree: {
            promptMarkdown: 'The families meet. Which arrangement is most likely to keep the fishery going for decades?',
            choices: [
              {
                label: 'A catch limit per family, set below what the fish can replace, that everyone can see is being kept',
                nextNodeId: null,
                feedback: 'A sustainable yield, shared fairly and monitored, keeps the resource and the livelihoods that depend on it.',
                outcome: 'optimal',
              },
              {
                label: 'Ask everyone to be careful, with no agreed number',
                nextNodeId: null,
                feedback: 'Good intentions help, but without a clear limit and a way to check it the incentive to take a little more remains.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'es-u3-l2-s5',
        kind: 'synthesis',
        title: 'Using Resources That Last',
        takeaways: [
          'Non-renewable resources are used far faster than they form; renewable ones are replenished on a human timescale.',
          'Energy (kWh) = power (kW) × time (hours).',
          'Shared resources are overused unless there is an agreed limit: the tragedy of the commons.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'es-u3-l2-fc1',
        front: 'What is a kilowatt-hour?',
        back: 'The energy used by a 1 kW device running for one hour.',
        explanation: 'Energy (kWh) = power (kW) × time (h).',
        interleave: true,
      },
      {
        id: 'es-u3-l2-fc2',
        front: 'What is the tragedy of the commons?',
        back: 'Overuse of a shared resource because each user gains the benefit while the cost is spread across all.',
        explanation: 'Agreed, monitored limits are the usual remedy.',
        interleave: true,
      },
      {
        id: 'es-u3-l2-fc3',
        front: 'Name two renewable energy sources.',
        back: 'Any two of: solar, wind, hydroelectric, geothermal, biomass.',
        explanation: 'They are replenished on a human timescale.',
        interleave: true,
      },
    ],
  },
]

const GATE = { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 } as const

const ES_UNITS: TrackUnit[] = [
  {
    id: 'es-u1-ecosystems',
    title: 'Ecosystems, Energy & Carbon',
    anchoringPhenomenon:
      'A field of grass can feed thousands of insects but only a handful of hawks, because most energy is lost at every step up the food chain.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: ES_U1_LESSONS,
  },
  {
    id: 'es-u2-climate',
    title: 'Earth’s Energy Balance & Climate',
    anchoringPhenomenon:
      'Earth’s average surface temperature is about 15 °C, roughly 33 °C warmer than the sunlight it absorbs could maintain on its own.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: ES_U2_LESSONS,
  },
  {
    id: 'es-u3-resources',
    title: 'Populations & Resources',
    anchoringPhenomenon:
      'A fishery that fed a town for generations can collapse within a few seasons once the catch rises above what the fish can replace.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: ES_U3_LESSONS,
  },
]

const ES_TRACK: CurriculumTrack = {
  id: 'track-environmental-science-climate',
  slug: 'environmental-science-climate',
  packId: 'environmental-science-climate',
  title: 'Environmental Science & Climate',
  category: 'Science',
  subject: 'Environmental Science',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: ES_UNITS,
}

export const ENVIRONMENTAL_SCIENCE_CLIMATE_PACK: ContentPack = {
  id: 'environmental-science-climate',
  name: 'Environmental Science & Climate',
  description:
    'Energy flow and the carbon cycle, the greenhouse effect and Earth’s energy balance, climate feedbacks and ocean acidification, population growth, and energy resources.',
  subject: 'Environmental Science',
  category: 'Science',
  icon: '🌍',
  modelId: 'greenhouse-effect-2d',
  relatedModelIds: ['seasons-axial-tilt-3d', 'plate-tectonics'],
  standards: 'AP Env Sci Units 1, 3, 6 & 9 · NGSS HS-ESS2-4, HS-ESS3-5',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  srsInterleave: true,
  gradeBand: 'HS',
  prerequisitePackIds: [],
  track: ES_TRACK,
  units: ES_UNITS,
  quizzes: [
    {
      title: 'Ecosystems & the Carbon Cycle',
      description: 'Trophic levels, the 10% rule, and how carbon moves between air, life, oceans and rock.',
      subject: 'Environmental Science',
      difficulty: 'easy',
      timeLimitSec: 480,
      srsInterleave: true,
      lessonId: 'es-u1-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'Which organisms form the first trophic level of most ecosystems?',
          options: [
            'Primary consumers',
            'Decomposers',
            'Producers',
            'Top predators',
          ],
          correct: 2,
          explanation: 'Producers such as plants and algae capture sunlight and make the food every other level depends on.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'Producers in a meadow store 8,000 kJ. Using the 10% rule, how many kJ are stored by the primary consumers?',
          correct: '800',
          alternatives: ['800 kJ', '800kJ'],
          explanation: '10% of 8,000 kJ is 800 kJ.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'Energy is recycled within an ecosystem in the same way that carbon is.',
          correct: false,
          explanation: 'Matter cycles, but energy flows through once: it arrives as sunlight and leaves as heat.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Which process moves carbon from the atmosphere into living things?',
          options: [
            'Respiration',
            'Photosynthesis',
            'Combustion',
            'Decomposition',
          ],
          correct: 1,
          explanation: 'Photosynthesis builds carbon dioxide into sugars. The other three release carbon dioxide.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Order these from the MOST energy stored to the LEAST in a typical ecosystem:',
          options: ['Producers', 'Primary consumers', 'Secondary consumers', 'Tertiary consumers'],
          correct: [0, 1, 2, 3],
          explanation: 'Each level stores roughly a tenth of the energy of the level below it.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'In a year, 9 units of carbon are added to the atmosphere and sinks remove 5 units. What happens to the amount of carbon in the atmosphere?',
          options: [
            'It falls by 4 units',
            'It rises by 4 units',
            'It stays the same',
            'It rises by 14 units',
          ],
          correct: 1,
          explanation: 'A reservoir changes by inflow minus outflow: 9 − 5 = 4 units added.',
          points: 10,
        },
      ],
    },
    {
      title: 'Energy Balance & Climate Change',
      description: 'Albedo, absorbed sunlight, greenhouse gases, feedback loops and ocean acidification.',
      subject: 'Environmental Science',
      difficulty: 'medium',
      timeLimitSec: 540,
      srsInterleave: true,
      lessonId: 'es-u2-l1',
      modelId: 'greenhouse-effect-2d',
      questions: [
        {
          type: 'fill',
          prompt: 'A planet receives an average of 300 W/m² of sunlight and has an albedo of 0.20. How many W/m² does it absorb?',
          correct: '240',
          alternatives: ['240 W/m²', '240 W/m2'],
          explanation: '300 × (1 − 0.20) = 300 × 0.80 = 240 W/m².',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A planet’s temperature is steady when…',
          options: [
            'it reflects all the sunlight that reaches it',
            'its atmosphere absorbs no infrared',
            'the infrared it sends to space equals the sunlight it absorbs',
            'the sunlight it receives equals the sunlight it reflects',
          ],
          correct: 2,
          explanation: 'Energy in must equal energy out. Any imbalance warms or cools the planet until the two match.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'What do greenhouse gases do to the radiation passing through the atmosphere?',
          options: [
            'Let most sunlight through, but absorb infrared from the surface and re-emit it',
            'Block most incoming sunlight',
            'Reflect infrared back to the surface like a mirror',
            'Create additional heat by chemical reaction',
          ],
          correct: 0,
          explanation: 'They are largely transparent to sunlight and absorb infrared, re-emitting it in every direction. Part of that returns to the surface.',
          points: 10,
        },
        {
          type: 'truefalse',
          prompt: 'Without any greenhouse effect, Earth’s average surface temperature would be below freezing.',
          correct: true,
          explanation: 'It would settle near −18 °C. The natural greenhouse effect keeps the average near 15 °C.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Warming melts sea ice, exposing dark ocean that absorbs more sunlight and causes further warming. What kind of feedback is this?',
          options: [
            'Negative, because it has a harmful result',
            'Negative, because ice is lost',
            'It is not a feedback',
            'Positive, because it amplifies the change',
          ],
          correct: 3,
          explanation: 'A positive feedback reinforces the change that started it. The word says nothing about whether the outcome is good.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Order these events in the ice–albedo feedback, starting from the initial warming:',
          options: ['Temperature rises slightly', 'Ice and snow melt', 'Darker surface absorbs more sunlight', 'Temperature rises further'],
          correct: [0, 1, 2, 3],
          explanation: 'Each step causes the next, and the last step feeds back into the first.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'Why does ocean acidification threaten corals and shellfish?',
          options: [
            'The water becomes too salty',
            'Lower pH makes it harder to build calcium carbonate shells and skeletons',
            'Carbon dioxide blocks sunlight from reaching them',
            'It raises the freezing point of seawater',
          ],
          correct: 1,
          explanation: 'Carbonic acid lowers pH and reduces the carbonate these organisms need for their shells.',
          points: 10,
        },
      ],
    },
    {
      title: 'Populations & Energy Resources',
      description: 'Carrying capacity, the rule of 70, limiting factors, kilowatt-hours and shared resources.',
      subject: 'Environmental Science',
      difficulty: 'hard',
      timeLimitSec: 540,
      srsInterleave: true,
      lessonId: 'es-u3-l2',
      questions: [
        {
          type: 'fill',
          prompt: 'A city’s population grows at 7% per year. Using the rule of 70, about how many years does it take to double?',
          correct: '10',
          alternatives: ['10 years', '10 yr', 'ten'],
          explanation: '70 ÷ 7 = 10 years.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A population’s growth curve rises steeply and then levels off at a steady size. What does the level part represent?',
          options: [
            'The carrying capacity',
            'Exponential growth',
            'Extinction',
            'A density-independent event',
          ],
          correct: 0,
          explanation: 'Logistic growth flattens as the population reaches the largest size the environment can sustain.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Which is a density-independent limiting factor?',
          options: [
            'Competition for nesting sites',
            'A contagious disease',
            'A severe drought',
            'Predators that hunt where prey is most common',
          ],
          correct: 2,
          explanation: 'A drought affects the population regardless of how crowded it is. The other three intensify with density.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'A 1,500 W kettle is used for a total of 2 hours in a week. How many kilowatt-hours of energy does it use?',
          correct: '3',
          alternatives: ['3 kWh', '3kWh', 'three'],
          explanation: '1,500 W = 1.5 kW, and 1.5 kW × 2 h = 3 kWh.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'Natural gas is a renewable energy resource.',
          correct: false,
          explanation: 'Natural gas is a fossil fuel. It forms over millions of years, far more slowly than it is used.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Several farms pump from the same underground water supply with no agreed limit, and the water level falls every year. This is an example of…',
          options: [
            'logistic growth',
            'a negative feedback',
            'the 10% rule',
            'the tragedy of the commons',
          ],
          correct: 3,
          explanation: 'Each farm gains from pumping more while the cost of a falling water table is shared by all, so the resource is overused.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Order these appliances from the LEAST to the MOST energy used:',
          options: ['10 W lamp for 5 hours', '100 W television for 2 hours', '1,000 W microwave for 1 hour', '2,000 W heater for 2 hours'],
          correct: [0, 1, 2, 3],
          explanation: 'Energy = power × time: 0.05 kWh, 0.2 kWh, 1 kWh and 4 kWh.',
          points: 15,
        },
      ],
    },
  ],
}
