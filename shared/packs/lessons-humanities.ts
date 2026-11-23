import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

/**
 * Lesson tracks for the World History, US Civics, English Rhetoric and
 * Conversational Spanish packs, which previously shipped quizzes only.
 * One lesson leads into each existing quiz.
 */

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'
const GATE = { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 } as const

// ── World History ──────────────────────────────────────────────

const WH_TRADE: PackLesson = {
  id: 'wh-u1-l1',
  unitId: 'wh-u1-trade-networks',
  title: 'Trade Networks That Linked the World',
  summary: 'Follow goods, ideas and diseases along the Silk Roads, the Indian Ocean, the Sahara and across the Atlantic.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'wh-u1-l1-s1',
      kind: 'narrative',
      title: 'Three Great Networks',
      bodyMarkdown:
        'Long before aircraft and container ships, three networks tied Africa, Asia and Europe together.\n\n- **The Silk Roads** ran overland across Central Asia. Caravans carried light, valuable goods such as silk and spices. Religions, including Buddhism, travelled the same routes, and so did diseases.\n- **The Indian Ocean network** linked East Africa, Arabia, India, Southeast Asia and China by sea. Ships could carry heavy, bulky cargo. Sailors relied on the **monsoon**, seasonal winds that blow one way for part of the year and then reverse, so a voyage out and back could be planned around them.\n- **The trans-Saharan routes** crossed the desert by camel caravan. West African gold went north; salt came south. Empires such as Mali and Songhai grew rich by taxing this trade.',
      callout: {
        tone: 'key-idea',
        text: 'Trade routes carried more than goods. Beliefs, technologies and diseases moved along them too.',
      },
    },
    {
      id: 'wh-u1-l1-s2',
      kind: 'checkpoint',
      title: 'Match the Route',
      question: {
        type: 'mcq',
        prompt: 'Which network depended on winds that reverse direction with the seasons?',
        options: [
          'The Silk Roads',
          'The Indian Ocean network',
          'The trans-Saharan routes',
          'None of them',
        ],
        correct: 1,
        explanation: 'Monsoon winds let sailors cross the Indian Ocean in one season and return in another.',
        points: 10,
      },
    },
    {
      id: 'wh-u1-l1-s3',
      kind: 'narrative',
      title: 'The Columbian Exchange',
      bodyMarkdown:
        'After Columbus reached the Caribbean in 1492, the Americas were joined to Africa, Asia and Europe for the first time. The transfer of plants, animals, people and diseases that followed is called the **Columbian Exchange**.\n\n- **From the Americas:** maize, potatoes, tomatoes and cacao. These high-yield crops helped populations grow in Europe, Africa and Asia.\n- **To the Americas:** wheat, sugar cane, horses, cattle and pigs.\n- **Disease:** smallpox and other infections, new to the Americas, killed a large share of the Indigenous population.\n- **People:** millions of enslaved Africans were forced across the Atlantic to work on plantations.',
    },
    {
      id: 'wh-u1-l1-s4',
      kind: 'checkpoint',
      title: 'Which Way Did It Travel?',
      question: {
        type: 'mcq',
        prompt: 'Which of these moved from Afro-Eurasia to the Americas in the Columbian Exchange?',
        options: [
          'Potatoes',
          'Maize',
          'Horses',
          'Tomatoes',
        ],
        correct: 2,
        explanation: 'Horses arrived with Europeans. Potatoes, maize and tomatoes are American crops that travelled the other way.',
        points: 10,
      },
    },
    {
      id: 'wh-u1-l1-s5',
      kind: 'checkpoint',
      title: 'Wealth of the Sahara',
      question: {
        type: 'truefalse',
        prompt: 'The empire of Mali grew wealthy largely by taxing the trade in gold and salt across the Sahara.',
        correct: true,
        explanation: 'Control of the routes between the gold fields and the desert salt mines was the basis of Mali’s wealth.',
        points: 10,
      },
    },
    {
      id: 'wh-u1-l1-s6',
      kind: 'synthesis',
      title: 'A Connected World',
      takeaways: [
        'Silk Roads: overland luxury goods. Indian Ocean: bulk goods by sea on the monsoon. Sahara: gold and salt by camel.',
        'Trade spread religions, technologies and diseases as well as goods.',
        'The Columbian Exchange after 1492 joined the Americas to the rest of the world, with huge gains and losses.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'wh-u1-l1-fc1',
      front: 'What are monsoon winds, and why did they matter for trade?',
      back: 'Seasonal winds that reverse direction; they let Indian Ocean sailors plan voyages out and back.',
      explanation: 'Predictable winds made long sea trade reliable.',
      interleave: true,
    },
    {
      id: 'wh-u1-l1-fc2',
      front: 'Which two goods dominated trans-Saharan trade?',
      back: 'Gold and salt.',
      explanation: 'Mali and Songhai taxed this trade.',
      interleave: true,
    },
    {
      id: 'wh-u1-l1-fc3',
      front: 'What was the Columbian Exchange?',
      back: 'The transfer of crops, animals, people and diseases between the Americas and Afro-Eurasia after 1492.',
      explanation: 'Maize and potatoes went east; horses and smallpox went west.',
      interleave: true,
    },
  ],
}

const WH_REVOLUTIONS: PackLesson = {
  id: 'wh-u2-l1',
  unitId: 'wh-u2-revolutions-industry',
  title: 'Revolutions, Industry & Empire',
  summary: 'See how new ideas about rights, new machines and new empires reshaped the world between 1750 and 1900.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['wh-u1-l1'],
  steps: [
    {
      id: 'wh-u2-l1-s1',
      kind: 'narrative',
      title: 'Ideas That Toppled Kings',
      bodyMarkdown:
        'In the 1700s, **Enlightenment** thinkers argued that reason, not tradition, should guide society. John Locke wrote that people have **natural rights** to life, liberty and property, and that a government rules only with the **consent of the governed**.\n\nThese ideas fed a wave of **Atlantic Revolutions**:\n\n- **American Revolution (1775–1783):** British colonies declared independence in 1776.\n- **French Revolution (from 1789):** the monarchy was overthrown and the rights of citizens proclaimed.\n- **Haitian Revolution (1791–1804):** enslaved people in the French colony of Saint-Domingue defeated their rulers and founded Haiti. It is the only slave revolt that created an independent state.\n- **Latin American independence (1810s–1820s):** most Spanish colonies in the Americas broke away.',
      callout: {
        tone: 'key-idea',
        text: 'The claim that all people have rights was soon turned against those who first made it, by enslaved people, colonial subjects and women.',
      },
    },
    {
      id: 'wh-u2-l1-s2',
      kind: 'checkpoint',
      title: 'Put the Revolutions in Order',
      question: {
        type: 'order',
        prompt: 'Order these events from earliest to latest:',
        options: [
          'American Declaration of Independence',
          'Start of the French Revolution',
          'Haiti becomes independent',
          'Berlin Conference on Africa',
        ],
        correct: [0, 1, 2, 3],
        explanation: '1776, 1789, 1804, then 1884–1885.',
        points: 15,
      },
    },
    {
      id: 'wh-u2-l1-s3',
      kind: 'narrative',
      title: 'Why Britain Industrialised First',
      bodyMarkdown:
        'The **Industrial Revolution** began in Britain in the late 1700s, when production moved from hand tools in homes to machines in factories. Britain had several advantages at once:\n\n- Plentiful **coal** and **iron ore**, close to each other.\n- Rivers, canals and ports for cheap transport.\n- Money to invest, and banks to lend it.\n- Colonies and trade supplying raw materials such as cotton, and markets to sell to.\n- More productive farming, which freed workers for the factories.\n\nThe steam engine, improved by James Watt in the 1760s and 1770s, turned coal into power for mills, mines, railways and ships.',
    },
    {
      id: 'wh-u2-l1-s4',
      kind: 'narrative',
      title: 'A New Wave of Empire',
      bodyMarkdown:
        'Factories needed raw materials and buyers, and steamships, railways and modern weapons gave industrial states the means to take both by force. In the late 1800s European powers seized most of Africa and much of Asia.\n\nAt the **Berlin Conference of 1884–1885**, European governments agreed rules for claiming African territory. No African ruler was invited. The borders that resulted often cut across peoples and kingdoms.',
    },
    {
      id: 'wh-u2-l1-s5',
      kind: 'checkpoint',
      title: 'Causes of Industrialisation',
      question: {
        type: 'mcq',
        prompt: 'Which of these was NOT a reason Britain industrialised early?',
        options: [
          'A warm climate suited to growing cotton at home',
          'Large deposits of coal and iron',
          'Canals and ports for cheap transport',
          'Capital to invest in machines',
        ],
        correct: 0,
        explanation: 'Britain cannot grow cotton. It imported raw cotton, much of it grown by enslaved people in the Americas.',
        points: 10,
      },
    },
    {
      id: 'wh-u2-l1-s6',
      kind: 'synthesis',
      title: 'The Long Nineteenth Century',
      takeaways: [
        'Enlightenment ideas of natural rights and consent inspired revolutions across the Atlantic world.',
        'Britain industrialised first thanks to coal, iron, transport, capital, trade and productive farms.',
        'Industrial power drove a new imperialism; the Berlin Conference set rules for dividing Africa.',
      ],
      nextQuizIndex: 1,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'wh-u2-l1-fc1',
      front: 'What made the Haitian Revolution unique?',
      back: 'It is the only slave revolt that founded an independent state (1804).',
      explanation: 'It began in the French colony of Saint-Domingue in 1791.',
      interleave: true,
    },
    {
      id: 'wh-u2-l1-fc2',
      front: 'Which two natural resources powered Britain’s early industrialisation?',
      back: 'Coal and iron.',
      explanation: 'Coal fuelled steam engines; iron built machines and railways.',
      interleave: true,
    },
    {
      id: 'wh-u2-l1-fc3',
      front: 'What happened at the Berlin Conference of 1884–1885?',
      back: 'European powers set rules for dividing Africa among themselves, with no Africans present.',
      explanation: 'It sped up the colonisation of the continent.',
      interleave: true,
    },
  ],
}

const WH_TWENTIETH: PackLesson = {
  id: 'wh-u3-l1',
  unitId: 'wh-u3-twentieth-century',
  title: 'World Wars, Decolonisation & the Cold War',
  summary: 'Trace the twentieth century from two world wars to the end of empires and a divided world, and learn to question a source.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['wh-u2-l1'],
  steps: [
    {
      id: 'wh-u3-l1-s1',
      kind: 'narrative',
      title: 'Two World Wars',
      bodyMarkdown:
        'The **First World War (1914–1918)** grew out of rival alliances, nationalism and an arms race among industrial powers. It killed millions and broke up four empires.\n\nThe harsh peace and the economic collapse of the 1930s helped dictators to power. The **Second World War (1939–1945)** was fought across Europe, Africa, Asia and the Pacific. It included the Holocaust, the murder of six million Jews by Nazi Germany, and ended after atomic bombs were dropped on Japan.\n\nIn 1945 the **United Nations** was founded to keep the peace, and two states stood far above the rest in power: the United States and the Soviet Union.',
    },
    {
      id: 'wh-u3-l1-s2',
      kind: 'narrative',
      title: 'Cold War and the End of Empires',
      bodyMarkdown:
        'The **Cold War** (about 1947–1991) was a contest between the capitalist United States and the communist Soviet Union. The two never fought each other directly; they competed through alliances, an arms race and wars in other countries.\n\n- The **Marshall Plan** (1947) sent American aid to rebuild Western Europe’s economies, partly so that poverty would not make communism attractive.\n- **Decolonisation:** weakened by war, European empires came apart. India became independent in 1947 and Ghana in 1957; seventeen African countries followed in 1960 alone.\n- The **Green Revolution** of the mid-century raised grain harvests with high-yield seeds, fertiliser and irrigation.\n- The Berlin Wall fell in **1989**, and the Soviet Union dissolved in **1991**.',
      callout: {
        tone: 'key-idea',
        text: 'It was a "cold" war because the superpowers avoided fighting each other directly. Many of its proxy wars were anything but cold.',
      },
    },
    {
      id: 'wh-u3-l1-s3',
      kind: 'checkpoint',
      title: 'Sequence the Century',
      question: {
        type: 'order',
        prompt: 'Order these events from earliest to latest:',
        options: ['First World War begins', 'Indian independence', 'Ghanaian independence', 'Fall of the Berlin Wall'],
        correct: [0, 1, 2, 3],
        explanation: '1914, 1947, 1957, 1989.',
        points: 15,
      },
    },
    {
      id: 'wh-u3-l1-s4',
      kind: 'narrative',
      title: 'Questioning a Source',
      bodyMarkdown:
        'Historians do not take documents at face value. A common checklist is **HIPP**:\n\n- **Historical context:** what was happening when it was made?\n- **Intended audience:** who was meant to read or hear it?\n- **Purpose:** what was the author trying to achieve?\n- **Point of view:** who is the author, and how does their position shape what they say?\n\nA wartime poster and a private diary may describe the same event very differently. Both are useful, as long as you ask why.',
    },
    {
      id: 'wh-u3-l1-s5',
      kind: 'checkpoint',
      title: 'Purpose of the Marshall Plan',
      question: {
        type: 'mcq',
        prompt: 'What was the main aim of the Marshall Plan?',
        options: [
          'To punish Germany with reparations',
          'To create a military alliance against the Soviet Union',
          'To grant independence to European colonies',
          'To rebuild Western European economies and limit the appeal of communism',
        ],
        correct: 3,
        explanation: 'It was economic aid. The military alliance, NATO, came separately in 1949.',
        points: 10,
      },
    },
    {
      id: 'wh-u3-l1-s6',
      kind: 'synthesis',
      title: 'The Twentieth Century',
      takeaways: [
        'Two world wars (1914–1918 and 1939–1945) left the United States and the Soviet Union as rival superpowers.',
        'European empires broke up after 1945 as colonies won independence.',
        'Read every source with HIPP: historical context, intended audience, purpose and point of view.',
      ],
      nextQuizIndex: 2,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'wh-u3-l1-fc1',
      front: 'What was the Marshall Plan?',
      back: 'A 1947 US programme of economic aid to rebuild Western Europe.',
      explanation: 'It also aimed to make communism less attractive.',
      interleave: true,
    },
    {
      id: 'wh-u3-l1-fc2',
      front: 'What does HIPP stand for?',
      back: 'Historical context, Intended audience, Purpose, Point of view.',
      explanation: 'A checklist for analysing a primary source.',
      interleave: true,
    },
    {
      id: 'wh-u3-l1-fc3',
      front: 'What was the Green Revolution?',
      back: 'A mid-twentieth-century jump in grain harvests from high-yield seeds, fertiliser and irrigation.',
      explanation: 'It greatly increased food supply in Asia and Latin America.',
      interleave: true,
    },
  ],
}

const WH_UNITS: TrackUnit[] = [
  {
    id: 'wh-u1-trade-networks',
    title: 'Trade Networks',
    anchoringPhenomenon: 'The potato, now a staple from Ireland to India, was unknown outside South America before 1500.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: [WH_TRADE],
  },
  {
    id: 'wh-u2-revolutions-industry',
    title: 'Revolutions, Industry & Empire',
    anchoringPhenomenon: 'Within about fifty years, colonies on both sides of the Atlantic threw off the empires that had ruled them.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: [WH_REVOLUTIONS],
  },
  {
    id: 'wh-u3-twentieth-century',
    title: 'The Twentieth Century',
    anchoringPhenomenon: 'A world map from 1914 shows a few dozen states and vast empires; a map from 2000 shows nearly two hundred countries.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: [WH_TWENTIETH],
  },
]

export const WORLD_HISTORY_UNITS = WH_UNITS

export const WORLD_HISTORY_TRACK: CurriculumTrack = {
  id: 'track-world-history-civilizations',
  slug: 'world-history-civilizations',
  packId: 'world-history-civilizations',
  title: 'World History: Empires, Trade & Revolutions',
  category: 'History',
  subject: 'History',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: WH_UNITS,
}
