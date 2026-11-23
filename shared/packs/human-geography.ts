import type { ContentPack } from './types'
import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'

const HG_U1_LESSONS: PackLesson[] = [
  {
    id: 'hg-u1-l1',
    unitId: 'hg-u1-thinking-population',
    title: 'Maps, Scale & Thinking Like a Geographer',
    summary: 'Read a map scale, see why every flat map distorts something, and separate where a place is from why it matters.',
    estimatedMinutes: 8,
    standards: ['AP Human Geography Unit 1 (Thinking Geographically)'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'hg-u1-l1-s1',
        kind: 'narrative',
        title: 'Where, and Why There?',
        bodyMarkdown:
          'Geographers ask two questions about anything: **where is it**, and **why is it there**?\n\n- **Absolute location** is an exact position, such as latitude and longitude.\n- **Relative location** describes a place by what it is near or connected to.\n- **Site** is the physical ground a place stands on: a harbour, a hilltop, a river crossing.\n- **Situation** is its position relative to other places: on a trade route, near a border, far from the capital.\n\nA **map scale** tells you how much the real world has been shrunk. On a 1:50,000 map, 1 cm on paper stands for 50,000 cm on the ground, which is 500 m.',
        callout: {
          tone: 'key-idea',
          text: 'Site explains why a settlement started where it did. Situation usually explains why it grew.',
        },
      },
      {
        id: 'hg-u1-l1-s2',
        kind: 'worked-example',
        title: 'Using a Map Scale',
        problemMarkdown: 'Two villages are **4 cm** apart on a **1:50,000** map. How far apart are they on the ground?',
        steps: [
          {
            label: 'Multiply by the scale',
            expressionOrAction: '4 cm × 50,000 = 200,000 cm',
            whyNote: 'Every centimetre on the map stands for 50,000 real centimetres.',
          },
          {
            label: 'Convert to kilometres',
            expressionOrAction: '200,000 cm ÷ 100,000 = 2 km',
            whyNote: 'There are 100 cm in a metre and 1,000 m in a kilometre, so 100,000 cm in a kilometre.',
          },
        ],
      },
      {
        id: 'hg-u1-l1-s3',
        kind: 'checkpoint',
        title: 'Your Turn With a Scale',
        question: {
          type: 'fill',
          prompt: 'On a 1:100,000 map, two towns are 5 cm apart. How many kilometres apart are they on the ground?',
          correct: '5',
          alternatives: ['5 km', '5km', 'five'],
          explanation: '5 cm × 100,000 = 500,000 cm = 5 km. On this scale 1 cm is exactly 1 km.',
          points: 15,
        },
      },
      {
        id: 'hg-u1-l1-s4',
        kind: 'narrative',
        title: 'Every Flat Map Lies a Little',
        bodyMarkdown:
          'The Earth is a sphere and a map is flat, so something has to give. A **map projection** can keep shapes right, or areas right, or distances right, but never all of them at once.\n\nThe familiar **Mercator** projection keeps directions true, which made it ideal for navigation at sea. The price is that it stretches areas more and more toward the poles. Greenland looks about as large as Africa on a Mercator map. In reality Africa is roughly fourteen times bigger.',
        callout: {
          tone: 'pitfall',
          text: 'A map is an argument as well as a picture. Which projection, scale and centre a mapmaker chooses shapes what looks important.',
        },
      },
      {
        id: 'hg-u1-l1-s5',
        kind: 'checkpoint',
        title: 'Site or Situation?',
        question: {
          type: 'mcq',
          prompt: 'A city grew rich because it lies where two major trade routes cross. Which idea does this describe?',
          options: [
            'Its site',
            'Its situation',
            'Its absolute location',
            'Its map scale',
          ],
          correct: 1,
          explanation: 'Situation is a place’s position relative to other places and routes. Site would be its physical setting, such as a natural harbour.',
          points: 10,
        },
      },
      {
        id: 'hg-u1-l1-s6',
        kind: 'synthesis',
        title: 'Reading the World on Paper',
        takeaways: [
          'Scale converts map distance to ground distance: on 1:100,000, 1 cm is 1 km.',
          'Every projection distorts shape, area, distance or direction; Mercator exaggerates areas near the poles.',
          'Site is a place’s physical setting; situation is its position relative to other places.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'hg-u1-l1-fc1',
        front: 'Site vs. situation?',
        back: 'Site is the physical setting of a place; situation is its location relative to other places.',
        explanation: 'A harbour is site; lying on a trade route is situation.',
        interleave: true,
      },
      {
        id: 'hg-u1-l1-fc2',
        front: 'What does a 1:50,000 map scale mean?',
        back: '1 unit on the map represents 50,000 of the same unit on the ground.',
        explanation: '1 cm on the map is 500 m.',
        interleave: true,
      },
      {
        id: 'hg-u1-l1-fc3',
        front: 'What does the Mercator projection distort most?',
        back: 'Area, increasingly toward the poles.',
        explanation: 'It keeps directions true, which suited navigation.',
        interleave: true,
      },
    ],
  },
  {
    id: 'hg-u1-l2',
    unitId: 'hg-u1-thinking-population',
    title: 'Population & the Demographic Transition',
    summary: 'Measure how crowded and how fast-growing a population is, and follow a country through the stages of the demographic transition.',
    estimatedMinutes: 10,
    standards: ['AP Human Geography Unit 2 (Population and Migration Patterns and Processes)'],
    prerequisiteLessonIds: ['hg-u1-l1'],
    steps: [
      {
        id: 'hg-u1-l2-s1',
        kind: 'narrative',
        title: 'Counting People',
        bodyMarkdown:
          '**Population density** is the number of people per unit of land: population ÷ area.\n\nGrowth depends on births and deaths. The **crude birth rate** is births per 1,000 people per year, and the **crude death rate** is deaths per 1,000 people per year. Subtract one from the other and divide by 10 to get the **rate of natural increase** as a percentage:\n\nnatural increase (%) = (birth rate − death rate) ÷ 10\n\nIt leaves out migration, which is why it is called natural.',
      },
      {
        id: 'hg-u1-l2-s2',
        kind: 'worked-example',
        title: 'How Fast Is It Growing?',
        problemMarkdown: 'A country has a crude birth rate of **30** and a crude death rate of **10**. Find its rate of natural increase and its doubling time.',
        steps: [
          {
            label: 'Natural increase',
            expressionOrAction: '(30 − 10) ÷ 10 = 2% per year',
            whyNote: 'Twenty more births than deaths per 1,000 people is 2 per 100.',
          },
          {
            label: 'Doubling time',
            expressionOrAction: '70 ÷ 2 = 35 years',
            whyNote: 'The rule of 70: divide 70 by the percentage growth rate.',
          },
        ],
      },
      {
        id: 'hg-u1-l2-s3',
        kind: 'checkpoint',
        title: 'Population Density',
        question: {
          type: 'fill',
          prompt: 'A region has 12,000,000 people and an area of 60,000 km². What is its population density, in people per km²?',
          correct: '200',
          alternatives: ['200 per km²', '200 people per km²', '200/km²'],
          explanation: '12,000,000 ÷ 60,000 = 200 people per km².',
          points: 15,
        },
      },
      {
        id: 'hg-u1-l2-s4',
        kind: 'narrative',
        title: 'The Demographic Transition Model',
        bodyMarkdown:
          'As countries develop, their birth and death rates tend to change in a common sequence, the **demographic transition**:\n\n1. **Stage 1**: birth and death rates are both high. The population is small and stable.\n2. **Stage 2**: better food, clean water and medicine cut the death rate. Births stay high, so the population grows fast.\n3. **Stage 3**: birth rates fall as cities grow, children are more likely to survive, and more girls stay in school. Growth slows.\n4. **Stage 4**: birth and death rates are both low. The population is large and stable.\n\nSome geographers add a **Stage 5**, in which births fall below deaths and the population shrinks.',
        callout: {
          tone: 'pitfall',
          text: 'Population grows fastest in Stage 2, and the cause is falling deaths, not rising births.',
        },
      },
      {
        id: 'hg-u1-l2-s5',
        kind: 'checkpoint',
        title: 'Which Stage?',
        question: {
          type: 'mcq',
          prompt: 'A country has a high birth rate and a death rate that has recently dropped sharply. Which stage of the demographic transition is it in?',
          options: [
            'Stage 1',
            'Stage 3',
            'Stage 2',
            'Stage 4',
          ],
          correct: 2,
          explanation: 'High births with falling deaths is Stage 2, the period of fastest growth.',
          points: 10,
        },
      },
      {
        id: 'hg-u1-l2-s6',
        kind: 'synthesis',
        title: 'How Populations Change',
        takeaways: [
          'Density = population ÷ area.',
          'Natural increase (%) = (birth rate − death rate) ÷ 10; doubling time ≈ 70 ÷ that percentage.',
          'In the demographic transition, death rates fall first and birth rates follow later.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'hg-u1-l2-fc1',
        front: 'How is the rate of natural increase calculated?',
        back: '(Crude birth rate − crude death rate) ÷ 10, as a percentage.',
        explanation: 'It ignores migration.',
        interleave: true,
      },
      {
        id: 'hg-u1-l2-fc2',
        front: 'In which stage of the demographic transition does population grow fastest?',
        back: 'Stage 2.',
        explanation: 'Death rates have fallen while birth rates are still high.',
        interleave: true,
      },
      {
        id: 'hg-u1-l2-fc3',
        front: 'What is population density?',
        back: 'The number of people per unit area of land.',
        explanation: 'Population ÷ area.',
        interleave: true,
      },
    ],
  },
]

const HG_U2_LESSONS: PackLesson[] = [
  {
    id: 'hg-u2-l1',
    unitId: 'hg-u2-migration-culture',
    title: 'Migration: Push, Pull & Barriers',
    summary: 'Sort the reasons people move, tell voluntary from forced migration, and weigh what migration does to both ends of the journey.',
    estimatedMinutes: 9,
    standards: ['AP Human Geography Unit 2 (Population and Migration Patterns and Processes)'],
    prerequisiteLessonIds: ['hg-u1-l2'],
    steps: [
      {
        id: 'hg-u2-l1-s1',
        kind: 'narrative',
        title: 'Why People Move',
        bodyMarkdown:
          '**Migration** is a long-term move to a new home. Geographers sort the causes into two groups.\n\n- **Push factors** drive people away: no work, war, persecution, drought, floods.\n- **Pull factors** draw them toward somewhere else: jobs, safety, family, education.\n\nMost migration is **voluntary**, chosen for economic or family reasons. **Forced** migration is not chosen. A **refugee** has crossed an international border to escape conflict or persecution. An **internally displaced person** has fled for the same reasons but is still inside their own country.',
        callout: {
          tone: 'key-idea',
          text: 'Push and pull act together, and obstacles in between, such as cost, distance and borders, decide who is actually able to move.',
        },
      },
      {
        id: 'hg-u2-l1-s2',
        kind: 'branching-scenario',
        title: 'A Family Decides',
        startNodeId: 'start',
        nodes: {
          start: {
            promptMarkdown:
              'Three years of drought have ruined a farming family’s harvests. A cousin writes that factories in a city 400 km away are hiring. Which statement describes their situation best?',
            choices: [
              {
                label: 'The drought is a push factor and the factory jobs are a pull factor',
                nextNodeId: 'move',
                feedback: 'Yes. One pushes them away from home and the other draws them toward a particular destination.',
                outcome: 'optimal',
              },
              {
                label: 'Both the drought and the jobs are pull factors',
                nextNodeId: 'start',
                feedback: 'A pull factor attracts people to a place. The drought makes them want to leave, so it pushes.',
                outcome: 'suboptimal',
              },
            ],
          },
          move: {
            promptMarkdown:
              'The parents move to the city and send part of their wages home to the grandparents each month. What is this money called, and what does it do?',
            choices: [
              {
                label: 'Remittances: they support the family and the economy of the place the migrants left',
                nextNodeId: 'effects',
                feedback: 'Correct. For some countries remittances are a larger source of income than foreign aid.',
                outcome: 'optimal',
              },
              {
                label: 'Tariffs: a tax on moving between regions',
                nextNodeId: 'effects',
                feedback: 'A tariff is a tax on imported goods. Money sent home by migrants is called remittances.',
                outcome: 'suboptimal',
              },
            ],
          },
          effects: {
            promptMarkdown: 'Many working-age adults leave the village in the same way. What is a likely effect on the village itself?',
            choices: [
              {
                label: 'More money arrives, but there are fewer young workers and an older population left behind',
                nextNodeId: null,
                feedback: 'Migration brings gains and costs to both ends. The village gains income and loses labour; the city gains workers and needs more housing and services.',
                outcome: 'optimal',
              },
              {
                label: 'Nothing changes, because the migrants still count as villagers',
                nextNodeId: null,
                feedback: 'Their absence changes who lives and works there. Age structure, farm labour and local services are all affected.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'hg-u2-l1-s3',
        kind: 'checkpoint',
        title: 'Refugee or Not?',
        question: {
          type: 'mcq',
          prompt: 'A family flees fighting in their home town and shelters in another region of the same country. What are they?',
          options: [
            'Internally displaced persons',
            'Refugees',
            'Voluntary economic migrants',
            'Tourists',
          ],
          correct: 0,
          explanation: 'They were forced to move but have not crossed an international border. A refugee has.',
          points: 10,
        },
      },
      {
        id: 'hg-u2-l1-s4',
        kind: 'checkpoint',
        title: 'Push or Pull?',
        question: {
          type: 'mcq',
          prompt: 'Which of these is a pull factor?',
          options: [
            'Rising sea level flooding farmland',
            'High unemployment at home',
            'Political persecution',
            'A university offering scholarships',
          ],
          correct: 3,
          explanation: 'A pull factor is an attraction at the destination. The other three are reasons to leave.',
          points: 10,
        },
      },
      {
        id: 'hg-u2-l1-s5',
        kind: 'synthesis',
        title: 'People on the Move',
        takeaways: [
          'Push factors drive people out; pull factors attract them somewhere else.',
          'Refugees cross an international border; internally displaced persons do not.',
          'Migration changes both the place people leave and the place they arrive.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'hg-u2-l1-fc1',
        front: 'Give one push factor and one pull factor.',
        back: 'Push: war, drought or unemployment. Pull: jobs, safety or family.',
        explanation: 'Push factors act at the origin; pull factors at the destination.',
        interleave: true,
      },
      {
        id: 'hg-u2-l1-fc2',
        front: 'What are remittances?',
        back: 'Money that migrants send back to family in the place they left.',
        explanation: 'They can be a major source of income for the home region.',
        interleave: true,
      },
      {
        id: 'hg-u2-l1-fc3',
        front: 'Refugee vs. internally displaced person?',
        back: 'A refugee has crossed an international border; an internally displaced person has not.',
        explanation: 'Both have been forced to leave home.',
        interleave: true,
      },
    ],
  },
  {
    id: 'hg-u2-l2',
    unitId: 'hg-u2-migration-culture',
    title: 'Culture & How Ideas Spread',
    summary: 'Define culture, then trace how a language, a food or a fashion travels by relocation and by the three kinds of expansion diffusion.',
    estimatedMinutes: 8,
    standards: ['AP Human Geography Unit 3 (Cultural Patterns and Processes)'],
    prerequisiteLessonIds: ['hg-u2-l1'],
    steps: [
      {
        id: 'hg-u2-l2-s1',
        kind: 'narrative',
        title: 'What Culture Is',
        bodyMarkdown:
          '**Culture** is the shared way of life of a group: its language, beliefs, food, dress, music and the unwritten rules, or **norms**, for how to behave. Culture is learned, not inherited, and it changes over time.\n\nThe spread of a cultural feature from one place to others is called **diffusion**. It happens in two broad ways.\n\n- **Relocation diffusion**: people move and carry the feature with them.\n- **Expansion diffusion**: the feature spreads outward while staying strong where it began.',
      },
      {
        id: 'hg-u2-l2-s2',
        kind: 'narrative',
        title: 'Three Kinds of Expansion',
        bodyMarkdown:
          '- **Contagious** diffusion passes from person to person through contact, reaching nearly everyone nearby. A joke or a video going round a school spreads this way.\n- **Hierarchical** diffusion jumps between important people or large cities first and reaches smaller places later. Fashion often moves from major cities to smaller towns.\n- **Stimulus** diffusion spreads the underlying idea while the details are changed to suit local tastes. A restaurant chain that swaps its menu to fit local diets is an example.',
        callout: {
          tone: 'key-idea',
          text: 'Ask what moved. If the people moved, it is relocation. If only the idea moved, it is expansion.',
        },
      },
      {
        id: 'hg-u2-l2-s3',
        kind: 'checkpoint',
        title: 'Name the Diffusion',
        question: {
          type: 'mcq',
          prompt: 'Migrants from one country settle abroad and open restaurants serving the food of their homeland. What kind of diffusion is this?',
          options: [
            'Contagious diffusion',
            'Relocation diffusion',
            'Hierarchical diffusion',
            'Stimulus diffusion',
          ],
          correct: 1,
          explanation: 'The people themselves moved and carried the cuisine with them.',
          points: 10,
        },
      },
      {
        id: 'hg-u2-l2-s4',
        kind: 'checkpoint',
        title: 'Big Cities First',
        question: {
          type: 'mcq',
          prompt: 'A new style of music appears in a few of the world’s largest cities, then in regional capitals, and finally in small towns. What kind of diffusion is this?',
          options: [
            'Hierarchical diffusion',
            'Contagious diffusion',
            'Relocation diffusion',
            'Stimulus diffusion',
          ],
          correct: 0,
          explanation: 'It moves down a ranking of places, from the largest and best connected to the smallest.',
          points: 10,
        },
      },
      {
        id: 'hg-u2-l2-s5',
        kind: 'checkpoint',
        title: 'Learned or Inherited?',
        question: {
          type: 'truefalse',
          prompt: 'Culture is passed on biologically from parents to children.',
          correct: false,
          explanation: 'Culture is learned from the people around us. That is why it can change within a single generation.',
          points: 10,
        },
      },
      {
        id: 'hg-u2-l2-s6',
        kind: 'synthesis',
        title: 'Culture in Motion',
        takeaways: [
          'Culture is a group’s learned, shared way of life.',
          'Relocation diffusion moves with people; expansion diffusion spreads the idea outward.',
          'Expansion diffusion can be contagious, hierarchical or stimulus.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'hg-u2-l2-fc1',
        front: 'What is relocation diffusion?',
        back: 'The spread of a cultural feature by people moving and taking it with them.',
        explanation: 'Migrants carrying a language or cuisine to a new country.',
        interleave: true,
      },
      {
        id: 'hg-u2-l2-fc2',
        front: 'What is hierarchical diffusion?',
        back: 'Spread from larger or more influential places and people to smaller ones.',
        explanation: 'Trends often reach major cities before small towns.',
        interleave: true,
      },
      {
        id: 'hg-u2-l2-fc3',
        front: 'What is a cultural norm?',
        back: 'An unwritten rule for how members of a group are expected to behave.',
        explanation: 'Norms are learned and differ between cultures.',
        interleave: true,
      },
    ],
  },
]

const HG_U3_LESSONS: PackLesson[] = [
  {
    id: 'hg-u3-l1',
    unitId: 'hg-u3-cities-development',
    title: 'Cities & Urbanisation',
    summary: 'See why the world is moving to cities, how land use is arranged inside one, and what happens when a neighbourhood changes.',
    estimatedMinutes: 9,
    standards: ['AP Human Geography Unit 6 (Cities and Urban Land-Use Patterns and Processes)'],
    prerequisiteLessonIds: ['hg-u2-l1'],
    steps: [
      {
        id: 'hg-u3-l1-s1',
        kind: 'narrative',
        title: 'An Urban World',
        bodyMarkdown:
          '**Urbanisation** is the growth in the share of people who live in towns and cities. More than half of the world’s population is now urban. It is driven by migration from the countryside and by natural increase within cities.\n\nA **megacity** is a city of more than ten million people. Fast growth can outrun housing and services, and many newcomers end up in **informal settlements**: neighbourhoods built without legal title, often lacking piped water and sanitation.',
      },
      {
        id: 'hg-u3-l1-s2',
        kind: 'narrative',
        title: 'Patterns Inside a City',
        bodyMarkdown:
          'Land in the middle of a city is the easiest to reach, so it is the most expensive. That one fact organises a lot of urban land use.\n\nThe **concentric zone model** pictures a city as rings round a **central business district (CBD)**: offices and shops at the centre, then older, denser housing, then newer and more spacious housing toward the edge.\n\nReal cities are messier, and they keep changing. **Suburbanisation** moves people outward to lower-density housing. **Gentrification** is the reverse flow: wealthier residents move into an older inner neighbourhood, buildings are renovated, prices rise, and lower-income residents can be pushed out.',
        callout: {
          tone: 'pitfall',
          text: 'Urban models are simplifications to compare real cities against. No city matches one exactly.',
        },
      },
      {
        id: 'hg-u3-l1-s3',
        kind: 'checkpoint',
        title: 'The Centre of the Model',
        question: {
          type: 'mcq',
          prompt: 'In the concentric zone model, what lies at the centre of the city?',
          options: [
            'Low-density suburbs',
            'Farmland',
            'The central business district',
            'Heavy industry only',
          ],
          correct: 2,
          explanation: 'The CBD is the most accessible point, so land there is the most valuable and is used for offices and shops.',
          points: 10,
        },
      },
      {
        id: 'hg-u3-l1-s4',
        kind: 'checkpoint',
        title: 'A Changing Neighbourhood',
        question: {
          type: 'mcq',
          prompt: 'Old warehouses near a city centre are converted into expensive flats, cafés open, and rents rise so much that long-term residents move away. What is this process called?',
          options: [
            'Suburbanisation',
            'Urban sprawl',
            'Counter-urbanisation',
            'Gentrification',
          ],
          correct: 3,
          explanation: 'Gentrification brings investment into an older inner neighbourhood and can displace the people who lived there.',
          points: 10,
        },
      },
      {
        id: 'hg-u3-l1-s5',
        kind: 'checkpoint',
        title: 'How Big Is a Megacity?',
        question: {
          type: 'fill',
          prompt: 'A megacity has a population of more than how many million people?',
          correct: '10',
          alternatives: ['10 million', 'ten', 'ten million'],
          explanation: 'The usual threshold is ten million inhabitants.',
          points: 15,
        },
      },
      {
        id: 'hg-u3-l1-s6',
        kind: 'synthesis',
        title: 'Living in Cities',
        takeaways: [
          'Urbanisation is the rising share of people living in towns and cities; over half the world is now urban.',
          'Accessible central land is costly, which shapes how a city is laid out.',
          'Suburbanisation moves people outward; gentrification brings wealthier residents back in.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'hg-u3-l1-fc1',
        front: 'What is urbanisation?',
        back: 'An increase in the proportion of people living in towns and cities.',
        explanation: 'It results from rural-to-urban migration and natural increase.',
        interleave: true,
      },
      {
        id: 'hg-u3-l1-fc2',
        front: 'What is gentrification?',
        back: 'Wealthier people moving into an older inner neighbourhood, raising prices and often displacing existing residents.',
        explanation: 'It brings investment and also conflict over who benefits.',
        interleave: true,
      },
      {
        id: 'hg-u3-l1-fc3',
        front: 'What is a CBD?',
        back: 'The central business district: the commercial core of a city.',
        explanation: 'It sits at the centre of the concentric zone model.',
        interleave: true,
      },
    ],
  },
  {
    id: 'hg-u3-l2',
    unitId: 'hg-u3-cities-development',
    title: 'Measuring Development',
    summary: 'Compare countries with income per person and the Human Development Index, and sort jobs into economic sectors.',
    estimatedMinutes: 9,
    standards: ['AP Human Geography Unit 7 (Industrial and Economic Development Patterns and Processes)'],
    prerequisiteLessonIds: ['hg-u3-l1'],
    steps: [
      {
        id: 'hg-u3-l2-s1',
        kind: 'narrative',
        title: 'More Than Money',
        bodyMarkdown:
          '**Development** means improvement in people’s standard of living. The simplest measure is income per person: a country’s total income divided by its population.\n\nIncome is an average, and it hides how the money is shared and what it buys. The **Human Development Index (HDI)** gives a fuller picture by combining three things:\n\n- **Health**: life expectancy at birth.\n- **Education**: years of schooling.\n- **Income**: national income per person.\n\nHDI runs from 0 to 1. Higher means more developed.',
        callout: {
          tone: 'pitfall',
          text: 'A high average income does not prove that most people live well. Always ask how it is distributed.',
        },
      },
      {
        id: 'hg-u3-l2-s2',
        kind: 'worked-example',
        title: 'Income per Person',
        problemMarkdown: 'A country’s total income is **$200 billion** and its population is **50 million**. Find the income per person.',
        steps: [
          {
            label: 'Write both in the same units',
            expressionOrAction: '$200,000 million ÷ 50 million people',
            whyNote: 'One billion is 1,000 million.',
          },
          {
            label: 'Divide',
            expressionOrAction: '200,000 ÷ 50 = $4,000 per person',
            whyNote: 'The millions cancel, leaving dollars per person.',
          },
        ],
      },
      {
        id: 'hg-u3-l2-s3',
        kind: 'narrative',
        title: 'Three Sectors of Work',
        bodyMarkdown:
          'Jobs are grouped by what they do with resources.\n\n- **Primary**: taking raw materials from the earth. Farming, fishing, mining, forestry.\n- **Secondary**: making things from those materials. Factories and construction.\n- **Tertiary**: providing services. Teaching, nursing, retail, transport, banking.\n\nAs a country develops, the share of workers in the primary sector usually falls, the secondary share rises and later falls back, and the tertiary sector grows to become the largest.',
      },
      {
        id: 'hg-u3-l2-s4',
        kind: 'checkpoint',
        title: 'Which Sector?',
        question: {
          type: 'mcq',
          prompt: 'A worker assembles cars in a factory. Which sector of the economy is this?',
          options: [
            'Primary',
            'Tertiary',
            'Secondary',
            'Informal',
          ],
          correct: 2,
          explanation: 'Manufacturing turns raw materials and parts into finished goods, which is secondary activity.',
          points: 10,
        },
      },
      {
        id: 'hg-u3-l2-s5',
        kind: 'checkpoint',
        title: 'Calculate Income per Person',
        question: {
          type: 'fill',
          prompt: 'A country’s total income is $60 billion and its population is 20 million. What is the income per person, in dollars?',
          correct: '3000',
          alternatives: ['$3000', '3,000', '$3,000'],
          explanation: '$60,000 million ÷ 20 million = $3,000 per person.',
          points: 15,
        },
      },
      {
        id: 'hg-u3-l2-s6',
        kind: 'synthesis',
        title: 'Comparing Countries',
        takeaways: [
          'Income per person = total income ÷ population, and it says nothing about distribution.',
          'HDI combines life expectancy, schooling and income into a score from 0 to 1.',
          'Economies shift from primary to secondary to tertiary work as they develop.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'hg-u3-l2-fc1',
        front: 'Which three things does the Human Development Index combine?',
        back: 'Life expectancy, education and income per person.',
        explanation: 'It ranges from 0 to 1.',
        interleave: true,
      },
      {
        id: 'hg-u3-l2-fc2',
        front: 'Give an example of a primary-sector job.',
        back: 'Farming, fishing, mining or forestry.',
        explanation: 'Primary activities extract raw materials.',
        interleave: true,
      },
      {
        id: 'hg-u3-l2-fc3',
        front: 'What is the tertiary sector?',
        back: 'The part of the economy that provides services.',
        explanation: 'It becomes the largest sector in highly developed economies.',
        interleave: true,
      },
    ],
  },
]

const GATE = { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 } as const

const HG_UNITS: TrackUnit[] = [
  {
    id: 'hg-u1-thinking-population',
    title: 'Maps & Population',
    anchoringPhenomenon: 'On a classroom wall map Greenland looks as big as Africa, yet Africa is about fourteen times larger.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: HG_U1_LESSONS,
  },
  {
    id: 'hg-u2-migration-culture',
    title: 'Migration & Culture',
    anchoringPhenomenon: 'The same dish can be found on opposite sides of the world, carried there by the people who cook it.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: HG_U2_LESSONS,
  },
  {
    id: 'hg-u3-cities-development',
    title: 'Cities & Development',
    anchoringPhenomenon: 'For most of history nearly everyone lived in the countryside. Today more than half of all people live in cities.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: HG_U3_LESSONS,
  },
]

const HG_TRACK: CurriculumTrack = {
  id: 'track-human-geography',
  slug: 'human-geography',
  packId: 'human-geography',
  title: 'Human Geography & Society',
  category: 'History',
  subject: 'Human Geography',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: HG_UNITS,
}

export const HUMAN_GEOGRAPHY_PACK: ContentPack = {
  id: 'human-geography',
  name: 'Human Geography & Society',
  description:
    'Maps and scale, population and the demographic transition, migration, culture and diffusion, cities and urban change, and how development is measured.',
  subject: 'Human Geography',
  category: 'History',
  icon: '🗺️',
  standards: 'AP Human Geography Units 1, 2, 3, 6 & 7',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  srsInterleave: true,
  gradeBand: 'HS',
  prerequisitePackIds: [],
  track: HG_TRACK,
  units: HG_UNITS,
  quizzes: [
    {
      title: 'Maps & Population',
      description: 'Map scale, projections, site and situation, density, natural increase and the demographic transition.',
      subject: 'Human Geography',
      difficulty: 'easy',
      timeLimitSec: 540,
      srsInterleave: true,
      lessonId: 'hg-u1-l2',
      questions: [
        {
          type: 'fill',
          prompt: 'On a 1:50,000 map, two farms are 6 cm apart. How many kilometres apart are they on the ground?',
          correct: '3',
          alternatives: ['3 km', '3km', 'three'],
          explanation: '6 cm × 50,000 = 300,000 cm = 3 km.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'What does the Mercator projection do to the size of land near the poles?',
          options: [
            'Makes it look smaller than it is',
            'Makes it look larger than it is',
            'Shows it accurately',
            'Leaves it off the map',
          ],
          correct: 1,
          explanation: 'Mercator keeps direction true by stretching areas more and more with distance from the equator.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A port city was founded on a deep natural harbour sheltered from storms. Which idea does this describe?',
          options: [
            'Its situation',
            'Its site',
            'Its relative location',
            'Its projection',
          ],
          correct: 1,
          explanation: 'Site is the physical character of the place itself.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'A country has a crude birth rate of 25 and a crude death rate of 5. What is its rate of natural increase, as a percentage?',
          correct: '2',
          alternatives: ['2%', '2 %', '2 percent', 'two'],
          explanation: '(25 − 5) ÷ 10 = 2% per year.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'In Stage 2 of the demographic transition, population grows quickly because the birth rate rises.',
          correct: false,
          explanation: 'The birth rate stays high; the cause of rapid growth is the falling death rate.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Order these descriptions by stage of the demographic transition, from Stage 1 to Stage 4:',
          options: [
            'High birth rate, high death rate',
            'High birth rate, falling death rate',
            'Falling birth rate, low death rate',
            'Low birth rate, low death rate',
          ],
          correct: [0, 1, 2, 3],
          explanation: 'Deaths fall first, births follow, and both end up low.',
          points: 15,
        },
      ],
    },
    {
      title: 'Migration & Culture',
      description: 'Push and pull factors, forced migration, remittances and the types of cultural diffusion.',
      subject: 'Human Geography',
      difficulty: 'medium',
      timeLimitSec: 480,
      srsInterleave: true,
      lessonId: 'hg-u2-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'Which of these is a push factor?',
          options: [
            'Higher wages abroad',
            'Relatives already living in the destination',
            'A civil war at home',
            'A well-regarded university abroad',
          ],
          correct: 2,
          explanation: 'A push factor makes people want to leave where they are. The other three attract them elsewhere.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'What distinguishes a refugee from an internally displaced person?',
          options: [
            'A refugee has crossed an international border',
            'A refugee moved by choice',
            'A refugee moved for work',
            'A refugee stays for less than a year',
          ],
          correct: 0,
          explanation: 'Both were forced to flee. Only the refugee has left their own country.',
          points: 10,
        },
        {
          type: 'truefalse',
          prompt: 'Remittances are taxes that migrants pay to the country they move to.',
          correct: false,
          explanation: 'Remittances are money migrants send back to family in the place they came from.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A dance craze spreads through a school as friends teach each other. What kind of diffusion is this?',
          options: [
            'Relocation diffusion',
            'Hierarchical diffusion',
            'Stimulus diffusion',
            'Contagious diffusion',
          ],
          correct: 3,
          explanation: 'It passes by direct contact from person to person, reaching nearly everyone nearby.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A fast-food chain enters a new country and replaces its beef burgers with vegetarian ones to suit local diets. What kind of diffusion is this?',
          options: [
            'Contagious diffusion',
            'Stimulus diffusion',
            'Relocation diffusion',
            'Hierarchical diffusion',
          ],
          correct: 1,
          explanation: 'The underlying idea spreads, but its form is changed to fit the new culture.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Which statement about culture is correct?',
          options: [
            'It is learned from other people and changes over time',
            'It is fixed at birth',
            'It is the same within every country',
            'It consists only of language',
          ],
          correct: 0,
          explanation: 'Culture is a shared, learned way of life, including language, beliefs, customs and norms.',
          points: 10,
        },
      ],
    },
    {
      title: 'Cities & Development',
      description: 'Urbanisation, land use in cities, gentrification, income per person, HDI and economic sectors.',
      subject: 'Human Geography',
      difficulty: 'hard',
      timeLimitSec: 540,
      srsInterleave: true,
      lessonId: 'hg-u3-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'What does urbanisation mean?',
          options: [
            'A fall in the total population',
            'People moving from cities to the countryside',
            'A rising share of the population living in towns and cities',
            'The building of taller buildings',
          ],
          correct: 2,
          explanation: 'It is about the proportion of people who are urban, driven by migration and natural increase.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Why is land usually most expensive in the central business district?',
          options: [
            'It has the best soil',
            'It is the newest part of the city',
            'It has the lowest population',
            'It is the most accessible location, so many users compete for it',
          ],
          correct: 3,
          explanation: 'Accessibility creates competition, and competition raises the price of land.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'A country’s total income is $90 billion and its population is 30 million. What is the income per person, in dollars?',
          correct: '3000',
          alternatives: ['$3000', '3,000', '$3,000'],
          explanation: '$90,000 million ÷ 30 million = $3,000 per person.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'Which of these is NOT one of the three parts of the Human Development Index?',
          options: [
            'Life expectancy',
            'Years of schooling',
            'Population density',
            'Income per person',
          ],
          correct: 2,
          explanation: 'HDI combines health, education and income. Density is not a measure of development.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Order these jobs by sector: primary, then secondary, then tertiary.',
          options: ['Coal miner', 'Steelworker', 'Bank clerk'],
          correct: [0, 1, 2],
          explanation: 'Mining extracts a raw material, steelmaking manufactures, and banking is a service.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'A country with a high average income per person must have very little poverty.',
          correct: false,
          explanation: 'An average hides how income is shared. A few very rich people can lift the average while many remain poor.',
          points: 10,
        },
      ],
    },
  ],
}
