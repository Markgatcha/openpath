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
          'Large deposits of coal and iron',
          'A warm climate suited to growing cotton at home',
          'Canals and ports for cheap transport',
          'Capital to invest in machines',
        ],
        correct: 1,
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

// ── US Civics ──────────────────────────────────────────────────

const CIV_BRANCHES: PackLesson = {
  id: 'civ-u1-l1',
  unitId: 'civ-u1-structure',
  title: 'Three Branches, Checks & Federalism',
  summary: 'Learn who makes, enforces and interprets federal law, how each branch limits the others, and how power is shared with the states.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'civ-u1-l1-s1',
      kind: 'narrative',
      title: 'Separation of Powers',
      bodyMarkdown:
        'The Constitution splits the federal government into three branches so that no single group holds all the power.\n\n- **Legislative (Congress):** makes the laws. It has two chambers, the House of Representatives and the Senate.\n- **Executive (the President):** carries out and enforces the laws.\n- **Judicial (the federal courts):** interprets the laws and decides cases under them.\n\nEach branch can also block the others. These **checks and balances** include:\n\n- The President can **veto** a bill. Congress can override the veto with a **two-thirds** vote in both chambers.\n- The President nominates federal judges, but the **Senate** must confirm them.\n- The courts can strike down laws that violate the Constitution.\n- The House can impeach a president or judge; the Senate holds the trial.',
      callout: {
        tone: 'key-idea',
        text: 'Separation of powers divides the jobs. Checks and balances give each branch a way to stop the others.',
      },
    },
    {
      id: 'civ-u1-l1-s2',
      kind: 'checkpoint',
      title: 'Which Branch?',
      question: {
        type: 'mcq',
        prompt: 'The President rejects a bill passed by Congress. What is this check called?',
        options: [
          'Judicial review',
          'Impeachment',
          'A veto',
          'A filibuster',
        ],
        correct: 2,
        explanation: 'A veto sends the bill back. Congress can still pass it with a two-thirds vote in both chambers.',
        points: 10,
      },
    },
    {
      id: 'civ-u1-l1-s3',
      kind: 'narrative',
      title: 'How a Bill Becomes Law',
      bodyMarkdown:
        '1. A member of Congress **introduces** the bill.\n2. A **committee** studies it, changes it and votes on whether to send it on.\n3. The full chamber **debates and votes**.\n4. The **other chamber** repeats the process. Both must pass identical text.\n5. The **President** signs it into law or vetoes it.\n\nMost bills never get past the committee stage.',
    },
    {
      id: 'civ-u1-l1-s4',
      kind: 'narrative',
      title: 'Federalism',
      bodyMarkdown:
        '**Federalism** divides power between the national government and the states.\n\n- Some powers belong to the national government, such as coining money and declaring war.\n- Some are shared, such as taxing.\n- The **Tenth Amendment** says that powers not given to the federal government, and not denied to the states, are reserved to the states or to the people. Schools, most criminal law and elections are largely run by states for this reason.',
    },
    {
      id: 'civ-u1-l1-s5',
      kind: 'checkpoint',
      title: 'Order the Steps',
      question: {
        type: 'order',
        prompt: 'Order these steps in a bill becoming law:',
        options: ['Bill is introduced', 'Committee reviews it', 'Both chambers pass it', 'President signs it'],
        correct: [0, 1, 2, 3],
        explanation: 'Introduction, committee, passage by both chambers, then the President.',
        points: 15,
      },
    },
    {
      id: 'civ-u1-l1-s6',
      kind: 'synthesis',
      title: 'Divided Power',
      takeaways: [
        'Congress makes laws, the President enforces them and the courts interpret them.',
        'A veto can be overridden by two-thirds of both chambers; the Senate confirms judges.',
        'Under federalism, the Tenth Amendment reserves undelegated powers to the states or the people.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'civ-u1-l1-fc1',
      front: 'What vote overrides a presidential veto?',
      back: 'Two-thirds of both the House and the Senate.',
      explanation: 'It is a check by Congress on the President.',
      interleave: true,
    },
    {
      id: 'civ-u1-l1-fc2',
      front: 'What does the Tenth Amendment say?',
      back: 'Powers not delegated to the federal government are reserved to the states or the people.',
      explanation: 'It is the constitutional basis of state powers.',
      interleave: true,
    },
    {
      id: 'civ-u1-l1-fc3',
      front: 'Who confirms federal judges?',
      back: 'The Senate, by majority vote, after the President nominates them.',
      explanation: 'A check shared between two branches.',
      interleave: true,
    },
  ],
}

const CIV_FOUNDING: PackLesson = {
  id: 'civ-u2-l1',
  unitId: 'civ-u2-founding-ideas',
  title: 'From the Articles to the Federalist Papers',
  summary: 'See why the first national government failed and how Madison and Hamilton argued for the Constitution that replaced it.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: ['civ-u1-l1'],
  steps: [
    {
      id: 'civ-u2-l1-s1',
      kind: 'narrative',
      title: 'A Government Too Weak',
      bodyMarkdown:
        'The first national government ran under the **Articles of Confederation** (in force from 1781). Fearing a new tyranny, its authors made the centre very weak:\n\n- Congress could not **tax**. It could only ask the states for money.\n- It could not **regulate trade** between the states.\n- There was no president and no national courts.\n- Changing the Articles needed the agreement of **all thirteen** states.\n\nUnable to pay its debts or keep order, the government was replaced. Delegates met in Philadelphia in **1787** and wrote the Constitution.',
    },
    {
      id: 'civ-u2-l1-s2',
      kind: 'checkpoint',
      title: 'Weakness of the Articles',
      question: {
        type: 'mcq',
        prompt: 'Which power did Congress lack under the Articles of Confederation?',
        options: [
          'The power to declare war',
          'The power to levy taxes',
          'The power to make treaties',
          'The power to run a post office',
        ],
        correct: 1,
        explanation: 'Congress could only request money from the states, and they often did not pay.',
        points: 10,
      },
    },
    {
      id: 'civ-u2-l1-s3',
      kind: 'narrative',
      title: 'The Case for the Constitution',
      bodyMarkdown:
        'To win support for the new Constitution, Alexander Hamilton, James Madison and John Jay wrote the **Federalist Papers**. Three are especially important.\n\n- **Federalist No. 10 (Madison):** groups with their own interests, called **factions**, are unavoidable. A **large republic** controls them best, because with so many competing groups none can easily form a majority and oppress the rest.\n- **Federalist No. 51 (Madison):** power must be divided so that each branch can resist the others. "Ambition must be made to counteract ambition."\n- **Federalist No. 78 (Hamilton):** the courts need independence. Judges should hold office for life during good behaviour, and may void laws that conflict with the Constitution.\n\nOpponents, the **Anti-Federalists**, feared that a strong central government would swallow the states and threaten liberty. Their pressure produced the promise of a Bill of Rights.',
      callout: {
        tone: 'key-idea',
        text: 'Madison did not try to make people agree. He designed a system in which rival interests would hold each other in check.',
      },
    },
    {
      id: 'civ-u2-l1-s4',
      kind: 'checkpoint',
      title: 'Match the Essay',
      question: {
        type: 'mcq',
        prompt: 'Which essay argues that separating power among branches lets each one check the others?',
        options: [
          'Federalist No. 10',
          'Federalist No. 78',
          'Brutus No. 1',
          'Federalist No. 51',
        ],
        correct: 3,
        explanation: 'No. 51 explains checks and balances. No. 10 deals with factions and No. 78 with the judiciary.',
        points: 10,
      },
    },
    {
      id: 'civ-u2-l1-s5',
      kind: 'checkpoint',
      title: 'Madison on Factions',
      question: {
        type: 'truefalse',
        prompt: 'In Federalist No. 10, Madison argues that factions should be eliminated by banning political groups.',
        correct: false,
        explanation: 'He says removing the causes of faction would destroy liberty. His remedy is a large republic with many competing interests.',
        points: 10,
      },
    },
    {
      id: 'civ-u2-l1-s6',
      kind: 'synthesis',
      title: 'Founding Arguments',
      takeaways: [
        'The Articles of Confederation gave Congress no power to tax or to regulate interstate trade.',
        'Federalist 10: a large republic controls factions. Federalist 51: checks and balances. Federalist 78: an independent judiciary.',
        'Anti-Federalist objections led to the Bill of Rights.',
      ],
      nextQuizIndex: 1,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'civ-u2-l1-fc1',
      front: 'What is the argument of Federalist No. 10?',
      back: 'A large republic best controls the dangers of faction.',
      explanation: 'Many competing interests make an oppressive majority unlikely.',
      interleave: true,
    },
    {
      id: 'civ-u2-l1-fc2',
      front: 'Which essay defends life tenure for judges and judicial review?',
      back: 'Federalist No. 78, by Alexander Hamilton.',
      explanation: 'It calls the judiciary the least dangerous branch.',
      interleave: true,
    },
    {
      id: 'civ-u2-l1-fc3',
      front: 'Name two weaknesses of the Articles of Confederation.',
      back: 'Congress could not tax and could not regulate trade between states.',
      explanation: 'There was also no executive and no national court system.',
      interleave: true,
    },
  ],
}

const CIV_LIBERTIES: PackLesson = {
  id: 'civ-u3-l1',
  unitId: 'civ-u3-rights-courts',
  title: 'Civil Liberties & Landmark Cases',
  summary: 'Find out how the Bill of Rights came to bind the states, and meet the cases and amendments that widened rights and the vote.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['civ-u2-l1'],
  steps: [
    {
      id: 'civ-u3-l1-s1',
      kind: 'narrative',
      title: 'The Court Claims Its Power',
      bodyMarkdown:
        'The Constitution does not say outright that courts may cancel laws. In **Marbury v. Madison (1803)**, the Supreme Court ruled that when a law conflicts with the Constitution, the Constitution wins, and it is the courts’ job to say so. This power is **judicial review**.\n\nThe first ten amendments, the **Bill of Rights** (1791), protect freedoms such as speech, religion and a fair trial. At first they limited only the **federal** government. A state could, in principle, restrict speech without breaking the First Amendment.',
    },
    {
      id: 'civ-u3-l1-s2',
      kind: 'narrative',
      title: 'Applying Rights to the States',
      bodyMarkdown:
        'The **Fourteenth Amendment** (1868) says no state may take away life, liberty or property "without due process of law". During the twentieth century the Supreme Court used this **Due Process Clause** to apply most of the Bill of Rights to the states, one right at a time. The doctrine is called **selective incorporation**.\n\nTwo landmark examples:\n\n- **Gideon v. Wainwright (1963):** a state must provide a lawyer to a defendant charged with a serious crime who cannot afford one. The Sixth Amendment right to counsel now binds the states.\n- **Brown v. Board of Education (1954):** racially segregated public schools violate the Fourteenth Amendment’s guarantee of equal protection.',
      callout: {
        tone: 'key-idea',
        text: 'Selective incorporation is why your state government, not only Washington, must respect the Bill of Rights.',
      },
    },
    {
      id: 'civ-u3-l1-s3',
      kind: 'checkpoint',
      title: 'Name the Doctrine',
      question: {
        type: 'mcq',
        prompt: 'A state law is struck down for violating freedom of speech. Which amendment makes the First Amendment apply to that state?',
        options: [
          'The Tenth Amendment',
          'The Fourteenth Amendment',
          'The Fifth Amendment',
          'The Nineteenth Amendment',
        ],
        correct: 1,
        explanation: 'Its Due Process Clause is the route by which Bill of Rights protections are applied to the states.',
        points: 10,
      },
    },
    {
      id: 'civ-u3-l1-s4',
      kind: 'narrative',
      title: 'Widening the Vote',
      bodyMarkdown:
        'Four amendments extended the right to vote:\n\n- **Fifteenth (1870):** the vote cannot be denied because of race.\n- **Nineteenth (1920):** it cannot be denied because of sex.\n- **Twenty-fourth (1964):** no poll tax in federal elections.\n- **Twenty-sixth (1971):** citizens aged 18 and over can vote.\n\nA right on paper is not always a right in practice. Despite the Fifteenth Amendment, many Black Americans were kept from voting until the Voting Rights Act of 1965.',
    },
    {
      id: 'civ-u3-l1-s5',
      kind: 'checkpoint',
      title: 'Gideon’s Right',
      question: {
        type: 'mcq',
        prompt: 'What did Gideon v. Wainwright require of the states?',
        options: [
          'To read suspects their rights on arrest',
          'To end segregation in public schools',
          'To provide a lawyer for defendants who cannot afford one in serious criminal cases',
          'To allow students to wear armbands in protest',
        ],
        correct: 2,
        explanation: 'The Court held that the right to counsel is fundamental to a fair trial.',
        points: 10,
      },
    },
    {
      id: 'civ-u3-l1-s6',
      kind: 'synthesis',
      title: 'Rights in Practice',
      takeaways: [
        'Marbury v. Madison (1803) established judicial review.',
        'Selective incorporation applies the Bill of Rights to the states through the Fourteenth Amendment.',
        'The 15th, 19th, 24th and 26th Amendments widened the vote, in that order.',
      ],
      nextQuizIndex: 2,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'civ-u3-l1-fc1',
      front: 'What did Marbury v. Madison establish?',
      back: 'Judicial review: courts can strike down laws that conflict with the Constitution.',
      explanation: 'Decided in 1803.',
      interleave: true,
    },
    {
      id: 'civ-u3-l1-fc2',
      front: 'What is selective incorporation?',
      back: 'Applying Bill of Rights protections to the states, case by case, through the Fourteenth Amendment.',
      explanation: 'It relies on the Due Process Clause.',
      interleave: true,
    },
    {
      id: 'civ-u3-l1-fc3',
      front: 'Which amendment lowered the voting age to 18?',
      back: 'The Twenty-sixth (1971).',
      explanation: 'It followed the 15th, 19th and 24th in widening the vote.',
      interleave: true,
    },
  ],
}

const CIV_UNITS: TrackUnit[] = [
  {
    id: 'civ-u1-structure',
    title: 'Branches & Federalism',
    anchoringPhenomenon: 'A president can refuse to sign a bill that most of Congress voted for, and Congress can still make it law.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: [CIV_BRANCHES],
  },
  {
    id: 'civ-u2-founding-ideas',
    title: 'Founding Documents',
    anchoringPhenomenon: 'The first government of the United States lasted less than a decade before its own leaders replaced it.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: [CIV_FOUNDING],
  },
  {
    id: 'civ-u3-rights-courts',
    title: 'Rights & the Courts',
    anchoringPhenomenon: 'A man too poor to hire a lawyer wrote to the Supreme Court in pencil from his prison cell, and won.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: [CIV_LIBERTIES],
  },
]

export const US_CIVICS_UNITS = CIV_UNITS

export const US_CIVICS_TRACK: CurriculumTrack = {
  id: 'track-us-civics-constitution',
  slug: 'us-civics-constitution',
  packId: 'us-civics-constitution',
  title: 'US Civics: Constitutional Architecture',
  category: 'History',
  subject: 'Civics',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: CIV_UNITS,
}

// ── English Rhetoric ───────────────────────────────────────────

const RH_SITUATION: PackLesson = {
  id: 'rh-u1-l1',
  unitId: 'rh-u1-situation-appeals',
  title: 'The Rhetorical Situation & the Three Appeals',
  summary: 'Work out why a text exists, who it is for and how it tries to persuade through credibility, emotion and logic.',
  estimatedMinutes: 8,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'rh-u1-l1-s1',
      kind: 'narrative',
      title: 'Every Text Answers a Situation',
      bodyMarkdown:
        '**Rhetoric** is the art of persuading. No speech or essay appears from nowhere; each responds to a **rhetorical situation**:\n\n- **Exigence:** the problem or event that prompts the writer to speak. It is the reason the text exists now.\n- **Audience:** the people the writer wants to move.\n- **Purpose:** what the writer wants the audience to think or do.\n- **Context:** the time, place and circumstances.\n- **Speaker:** who is writing, and what the audience already thinks of them.\n\nA eulogy, an advertisement and a lab report differ because their situations differ.',
    },
    {
      id: 'rh-u1-l1-s2',
      kind: 'narrative',
      title: 'Ethos, Pathos, Logos',
      bodyMarkdown:
        'Writers persuade through three kinds of appeal.\n\n- **Ethos** appeals to credibility: the writer’s expertise, fairness and character. "As a nurse for twenty years…"\n- **Pathos** appeals to emotion: fear, pride, sympathy, anger. A story about one hungry child.\n- **Logos** appeals to reason: facts, statistics and logical argument. "Accidents fell 30% after the limit was lowered."\n\nMost effective texts mix all three. One useful device is **anaphora**, repeating a word or phrase at the start of successive clauses: "We shall fight on the beaches, we shall fight on the landing grounds." The repetition builds rhythm and emphasis.',
      callout: {
        tone: 'key-idea',
        text: 'Naming a device is not analysis. Analysis explains how the choice helps the writer achieve a purpose with this audience.',
      },
    },
    {
      id: 'rh-u1-l1-s3',
      kind: 'checkpoint',
      title: 'Identify the Appeal',
      question: {
        type: 'mcq',
        prompt: 'A charity advert shows a shivering dog and says, "He has no one. Will you turn away?" Which appeal dominates?',
        options: [
          'Logos',
          'Pathos',
          'Ethos',
          'Exigence',
        ],
        correct: 1,
        explanation: 'The image and the question aim at sympathy and guilt, not at evidence or credibility.',
        points: 10,
      },
    },
    {
      id: 'rh-u1-l1-s4',
      kind: 'checkpoint',
      title: 'Find the Exigence',
      question: {
        type: 'mcq',
        prompt: 'After a flood damages the town, the mayor gives a speech asking residents to volunteer. What is the exigence?',
        options: [
          'The residents listening',
          'The mayor’s authority',
          'The request to volunteer',
          'The flood and the damage it caused',
        ],
        correct: 3,
        explanation: 'The exigence is the event that calls for the speech. The residents are the audience and the request is the purpose.',
        points: 10,
      },
    },
    {
      id: 'rh-u1-l1-s5',
      kind: 'synthesis',
      title: 'Reading Rhetorically',
      takeaways: [
        'The rhetorical situation: exigence, audience, purpose, context and speaker.',
        'Ethos is credibility, pathos is emotion and logos is reasoning.',
        'Analysis explains how a choice serves the purpose; it does not just label devices.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'rh-u1-l1-fc1',
      front: 'What is exigence?',
      back: 'The problem or event that prompts a writer to speak.',
      explanation: 'It explains why the text exists at this moment.',
      interleave: true,
    },
    {
      id: 'rh-u1-l1-fc2',
      front: 'Define ethos, pathos and logos.',
      back: 'Appeals to credibility, to emotion and to reason.',
      explanation: 'Most persuasive texts combine all three.',
      interleave: true,
    },
    {
      id: 'rh-u1-l1-fc3',
      front: 'What is anaphora?',
      back: 'Repeating a word or phrase at the beginning of successive clauses.',
      explanation: '"We shall fight… we shall fight…"',
      interleave: true,
    },
  ],
}

const RH_FALLACIES: PackLesson = {
  id: 'rh-u2-l1',
  unitId: 'rh-u2-argument-fallacies',
  title: 'Building Arguments & Spotting Fallacies',
  summary: 'Take an argument apart into claim, evidence and warrant, answer the other side fairly, and catch reasoning that cheats.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: ['rh-u1-l1'],
  steps: [
    {
      id: 'rh-u2-l1-s1',
      kind: 'narrative',
      title: 'The Parts of an Argument',
      bodyMarkdown:
        'The **Toulmin model** breaks an argument into parts.\n\n- **Claim:** the point being argued. "The school should start an hour later."\n- **Evidence:** the facts that support it. "Teenagers who sleep longer get better grades."\n- **Warrant:** the assumption that links the evidence to the claim, often unstated. "A school should arrange its day to help students learn."\n\nIf the audience rejects the warrant, the evidence will not persuade them, however strong it is.\n\nA strong body paragraph follows the same logic: state the **claim**, give the **evidence**, add **commentary** explaining how the evidence proves the claim, then **link** back to the thesis. Good writers also raise the **counterargument**, concede what is true in it and then show why their own position still holds.',
    },
    {
      id: 'rh-u2-l1-s2',
      kind: 'checkpoint',
      title: 'Find the Warrant',
      question: {
        type: 'mcq',
        prompt: '"This phone has the longest battery life, so you should buy it." What is the warrant?',
        options: [
          'This phone has the longest battery life',
          'Battery life is what matters most when choosing a phone',
          'You should buy this phone',
          'Other phones are more expensive',
        ],
        correct: 1,
        explanation: 'The warrant is the unstated assumption that connects the evidence (battery life) to the claim (buy it).',
        points: 10,
      },
    },
    {
      id: 'rh-u2-l1-s3',
      kind: 'narrative',
      title: 'Reasoning That Cheats',
      bodyMarkdown:
        'A **logical fallacy** is a flaw in reasoning that can make a weak argument sound convincing.\n\n- **Straw man:** distorting an opponent’s view into something easier to attack. "She wants bike lanes, so she wants to ban cars."\n- **Ad hominem:** attacking the person instead of the argument.\n- **False dilemma:** pretending there are only two choices. "Either we cut the arts or the school goes bankrupt."\n- **Slippery slope:** claiming one small step must lead to disaster, without showing why.\n- **Post hoc:** assuming that because B followed A, A caused B.\n\nA device worth knowing here is **antithesis**: setting two contrasting ideas side by side in balanced phrasing. "It was the best of times, it was the worst of times."',
      callout: {
        tone: 'key-idea',
        text: 'To test for a straw man, ask: would the opponent recognise this as their own position?',
      },
    },
    {
      id: 'rh-u2-l1-s4',
      kind: 'checkpoint',
      title: 'Name the Fallacy',
      question: {
        type: 'mcq',
        prompt: '"You can’t trust his view on taxes. He didn’t even finish university." Which fallacy is this?',
        options: [
          'Straw man',
          'False dilemma',
          'Ad hominem',
          'Slippery slope',
        ],
        correct: 2,
        explanation: 'It attacks the speaker’s background and never addresses what he said about taxes.',
        points: 10,
      },
    },
    {
      id: 'rh-u2-l1-s5',
      kind: 'synthesis',
      title: 'Sound Arguments',
      takeaways: [
        'Toulmin: a claim is supported by evidence, and a warrant links the two.',
        'Concede what is fair in the counterargument, then refute it.',
        'Common fallacies: straw man, ad hominem, false dilemma, slippery slope and post hoc.',
      ],
      nextQuizIndex: 1,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'rh-u2-l1-fc1',
      front: 'In the Toulmin model, what is the warrant?',
      back: 'The assumption that connects the evidence to the claim.',
      explanation: 'It is often left unstated.',
      interleave: true,
    },
    {
      id: 'rh-u2-l1-fc2',
      front: 'What is a straw man fallacy?',
      back: 'Misrepresenting an opponent’s position to make it easier to attack.',
      explanation: 'The real argument is never answered.',
      interleave: true,
    },
    {
      id: 'rh-u2-l1-fc3',
      front: 'What is antithesis?',
      back: 'Contrasting ideas placed side by side in balanced, parallel phrasing.',
      explanation: '"It was the best of times, it was the worst of times."',
      interleave: true,
    },
  ],
}

const RH_STYLE: PackLesson = {
  id: 'rh-u3-l1',
  unitId: 'rh-u3-style-satire',
  title: 'Sentence Craft, Irony & Satire',
  summary: 'Hear how sentence shape creates emphasis, and how irony and satire say one thing in order to mean another.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: ['rh-u2-l1'],
  steps: [
    {
      id: 'rh-u3-l1-s1',
      kind: 'narrative',
      title: 'The Shape of a Sentence',
      bodyMarkdown:
        '**Syntax** is the arrangement of words in a sentence. Writers choose shapes for effect.\n\n- A **periodic sentence** holds back its main clause until the end, building suspense. "Despite the rain, the cold and the long road ahead, **she set out**."\n- A **cumulative** (or loose) sentence gives the main clause first and then adds detail. "**She set out**, coat buttoned, head down, into the rain."\n- **Parallelism** repeats a grammatical pattern: "to strive, to seek, to find".\n- **Chiasmus** repeats ideas in reverse order, in an A-B-B-A pattern. "Ask not what your **country** can do for **you**; ask what **you** can do for your **country**."',
    },
    {
      id: 'rh-u3-l1-s2',
      kind: 'checkpoint',
      title: 'Name the Sentence',
      question: {
        type: 'mcq',
        prompt: '"After years of doubt, after every door had closed, after his friends had given up, he succeeded." What kind of sentence is this?',
        options: [
          'Cumulative',
          'Chiastic',
          'Periodic',
          'A sentence fragment',
        ],
        correct: 2,
        explanation: 'The main clause, "he succeeded", is withheld until the very end.',
        points: 10,
      },
    },
    {
      id: 'rh-u3-l1-s3',
      kind: 'narrative',
      title: 'Irony and Understatement',
      bodyMarkdown:
        '**Irony** is a gap between what is said or expected and what is meant or happens.\n\n- **Verbal irony:** saying the opposite of what you mean. "Lovely weather," in a downpour.\n- **Situational irony:** the outcome is the reverse of what was expected. A fire station burns down.\n- **Dramatic irony:** the audience knows something a character does not.\n\n**Litotes** is deliberate understatement that affirms something by denying its opposite: "not bad" for "good", "no small feat" for "a great achievement".',
    },
    {
      id: 'rh-u3-l1-s4',
      kind: 'narrative',
      title: 'Satire',
      bodyMarkdown:
        '**Satire** uses humour, irony and exaggeration to criticise foolishness or wrongdoing, usually hoping to change it. There are two classic styles:\n\n- **Horatian** satire is gentle and amused. It laughs at human weakness.\n- **Juvenalian** satire is bitter and angry. It attacks cruelty and corruption.\n\nIn "A Modest Proposal" (1729), Jonathan Swift calmly suggests that poor Irish families sell their babies as food for the rich. He does not mean it. The reasonable tone applied to a monstrous idea is sustained verbal irony, and its target is the indifference of the wealthy to Irish poverty.',
      callout: {
        tone: 'key-idea',
        text: 'To read satire, find the gap between what the speaker says and what the author believes, then ask who is being criticised.',
      },
    },
    {
      id: 'rh-u3-l1-s5',
      kind: 'checkpoint',
      title: 'Spot the Device',
      question: {
        type: 'mcq',
        prompt: 'After winning an Olympic gold medal, an athlete says, "That wasn’t my worst race." Which device is this?',
        options: [
          'Chiasmus',
          'Anaphora',
          'Dramatic irony',
          'Litotes',
        ],
        correct: 3,
        explanation: 'She affirms a triumph by denying its opposite, which is understatement by negation.',
        points: 10,
      },
    },
    {
      id: 'rh-u3-l1-s6',
      kind: 'checkpoint',
      title: 'Reading Swift',
      question: {
        type: 'truefalse',
        prompt: 'In "A Modest Proposal", Swift sincerely recommends the plan his narrator describes.',
        correct: false,
        explanation: 'The proposal is ironic. Swift uses it to attack those who treated the Irish poor as less than human.',
        points: 10,
      },
    },
    {
      id: 'rh-u3-l1-s7',
      kind: 'synthesis',
      title: 'Style With a Purpose',
      takeaways: [
        'Periodic sentences delay the main clause; cumulative sentences lead with it. Chiasmus reverses ideas A-B-B-A.',
        'Irony is a gap between words and meaning; litotes affirms by denying the opposite.',
        'Satire criticises through humour: Horatian is gentle, Juvenalian is harsh.',
      ],
      nextQuizIndex: 2,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'rh-u3-l1-fc1',
      front: 'What is chiasmus?',
      back: 'Repeating ideas in reverse order (A-B-B-A).',
      explanation: '"Ask not what your country can do for you; ask what you can do for your country."',
      interleave: true,
    },
    {
      id: 'rh-u3-l1-fc2',
      front: 'What is a periodic sentence?',
      back: 'One that withholds its main clause until the end.',
      explanation: 'The delay builds suspense and emphasis.',
      interleave: true,
    },
    {
      id: 'rh-u3-l1-fc3',
      front: 'How do Horatian and Juvenalian satire differ?',
      back: 'Horatian is gentle and amused; Juvenalian is bitter and angry.',
      explanation: 'Swift’s "A Modest Proposal" is Juvenalian.',
      interleave: true,
    },
  ],
}

const RH_UNITS: TrackUnit[] = [
  {
    id: 'rh-u1-situation-appeals',
    title: 'Situation & Appeals',
    anchoringPhenomenon: 'The same facts can leave one audience unmoved and bring another to its feet, depending on who says them and how.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: [RH_SITUATION],
  },
  {
    id: 'rh-u2-argument-fallacies',
    title: 'Argument & Fallacies',
    anchoringPhenomenon: 'An argument can sound convincing and still prove nothing.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: [RH_FALLACIES],
  },
  {
    id: 'rh-u3-style-satire',
    title: 'Style, Irony & Satire',
    anchoringPhenomenon: 'In 1729 a respected clergyman published a calm, reasoned plan for eating children, and readers understood it as an attack on cruelty.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: [RH_STYLE],
  },
]

export const ENGLISH_RHETORIC_UNITS = RH_UNITS

export const ENGLISH_RHETORIC_TRACK: CurriculumTrack = {
  id: 'track-english-rhetoric-composition',
  slug: 'english-rhetoric-composition',
  packId: 'english-rhetoric-composition',
  title: 'English Rhetoric: Argument, Style & Fallacies',
  category: 'Languages',
  subject: 'English',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: RH_UNITS,
}

// ── Conversational Spanish ─────────────────────────────────────

const ES_BASICS: PackLesson = {
  id: 'es-u1-l1',
  unitId: 'es-u1-everyday',
  title: 'Greetings, Ser & Estar, and the Present Tense',
  summary: 'Say hello, choose between the two Spanish verbs for "to be", talk about what you like and order in a café.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'es-u1-l1-s1',
      kind: 'narrative',
      title: 'Two Verbs for "To Be"',
      bodyMarkdown:
        'Spanish has two verbs where English has one.\n\n**Ser** describes what something *is*: identity, origin, profession, character, time and date.\n\n- *Soy estudiante.* (I am a student.)\n- *Ella es de México.* (She is from Mexico.)\n- *Son las tres.* (It is three o’clock.)\n\n**Estar** describes how or where something *is right now*: location, mood, health and temporary states.\n\n- *Estoy cansado.* (I am tired.)\n- *Madrid está en España.* (Madrid is in Spain.)\n- *La tienda está cerrada.* (The shop is closed.)\n\nPresent-tense forms:\n\n- **ser:** soy, eres, es, somos, sois, son\n- **estar:** estoy, estás, está, estamos, estáis, están',
      callout: {
        tone: 'key-idea',
        text: 'Ser says what something is. Estar says how or where it is. Location always takes estar, even when it is permanent.',
      },
    },
    {
      id: 'es-u1-l1-s2',
      kind: 'checkpoint',
      title: 'Ser or Estar?',
      question: {
        type: 'mcq',
        prompt: 'Choose the correct verb: "Mi hermana ______ médica."',
        options: [
          'es',
          'está',
          'son',
          'estoy',
        ],
        correct: 0,
        explanation: 'A profession is part of identity, so it takes ser: "Mi hermana es médica."',
        points: 10,
      },
    },
    {
      id: 'es-u1-l1-s3',
      kind: 'narrative',
      title: 'Gustar and Tener',
      bodyMarkdown:
        '**Gustar** does not work like "to like". It means "to be pleasing to", so the thing you like is the subject and decides the verb ending.\n\n- *Me gust**a** el libro.* (The book pleases me: I like the book.)\n- *Me gust**an** los libros.* (The books please me: I like the books.)\n\nThe pronoun shows who likes it: *me* (I), *te* (you), *le* (he, she), *nos* (we), *les* (they).\n\n**Tener** (to have) is irregular in the *yo* form: **tengo**. Spanish uses it for age, where English uses "to be".\n\n- *Tengo quince años.* (I am fifteen; literally, "I have fifteen years".)',
    },
    {
      id: 'es-u1-l1-s4',
      kind: 'checkpoint',
      title: 'Saying What You Like',
      question: {
        type: 'mcq',
        prompt: 'How do you say "I like the songs"?',
        options: [
          'Me gusta las canciones.',
          'Yo gusto las canciones.',
          'Me gustan la canción.',
          'Me gustan las canciones.',
        ],
        correct: 3,
        explanation: '"Las canciones" is plural, so the verb is "gustan".',
        points: 10,
      },
    },
    {
      id: 'es-u1-l1-s5',
      kind: 'worked-example',
      title: 'Ordering in a Café',
      problemMarkdown: 'Follow a short, polite exchange between a customer and a waiter.',
      steps: [
        {
          label: 'Greet',
          expressionOrAction: '"Buenos días." "Buenos días, ¿qué desea?"',
          whyNote: 'Good morning. Good morning, what would you like?',
        },
        {
          label: 'Order',
          expressionOrAction: '"Quisiera un café con leche, por favor."',
          whyNote: 'I would like a coffee with milk, please. "Quisiera" is more polite than "quiero" (I want).',
        },
        {
          label: 'Pay',
          expressionOrAction: '"¿Cuánto es?" "Son dos euros."',
          whyNote: 'How much is it? It is two euros. Prices take ser.',
        },
        {
          label: 'Leave',
          expressionOrAction: '"Gracias, hasta luego." "De nada, adiós."',
          whyNote: 'Thank you, see you later. You are welcome, goodbye.',
        },
      ],
    },
    {
      id: 'es-u1-l1-s6',
      kind: 'checkpoint',
      title: 'Give Your Age',
      question: {
        type: 'fill',
        prompt: 'Complete with the correct form of tener: "Yo ______ catorce años."',
        correct: 'tengo',
        alternatives: [],
        explanation: 'Age uses tener, and its yo form is irregular: tengo.',
        points: 10,
      },
    },
    {
      id: 'es-u1-l1-s7',
      kind: 'synthesis',
      title: 'First Conversations',
      takeaways: [
        'Ser is for identity, origin, profession and time. Estar is for location and temporary states.',
        'With gustar, the thing liked decides the ending: me gusta el libro, me gustan los libros.',
        'Tener is irregular in the yo form (tengo) and is used for age.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'es-u1-l1-fc1',
      front: 'When do you use estar instead of ser?',
      back: 'For location and for temporary states such as mood or health.',
      explanation: '"Estoy cansado." "Madrid está en España."',
      interleave: true,
    },
    {
      id: 'es-u1-l1-fc2',
      front: 'Me gusta or me gustan: "______ los libros"?',
      back: 'Me gustan los libros.',
      explanation: 'The verb agrees with the thing liked, which is plural.',
      interleave: true,
    },
    {
      id: 'es-u1-l1-fc3',
      front: 'How do you say "I am sixteen" in Spanish?',
      back: 'Tengo dieciséis años.',
      explanation: 'Spanish uses tener (to have) for age.',
      interleave: true,
    },
  ],
}

const ES_PAST: PackLesson = {
  id: 'es-u2-l1',
  unitId: 'es-u2-past',
  title: 'Telling Stories: Preterite & Imperfect',
  summary: 'Choose between the two Spanish past tenses to set a scene and say what happened, and sort out por and para.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['es-u1-l1'],
  steps: [
    {
      id: 'es-u2-l1-s1',
      kind: 'narrative',
      title: 'Two Past Tenses',
      bodyMarkdown:
        'Spanish splits the past in two.\n\nThe **preterite** reports completed actions: single events with a clear beginning and end.\n\n- *Ayer **comí** paella.* (Yesterday I ate paella.)\n- *El tren **llegó** a las ocho.* (The train arrived at eight.)\n\nThe **imperfect** describes the background: habits, ongoing actions, descriptions, age, time and feelings.\n\n- *De niño, **jugaba** en el parque.* (As a child, I used to play in the park.)\n- ***Hacía** frío y **llovía**.* (It was cold and it was raining.)\n\nSignal words help. *Ayer*, *anoche*, *una vez* and *de repente* point to the preterite. *Siempre*, *cada día*, *mientras* and *de niño* point to the imperfect.',
      callout: {
        tone: 'key-idea',
        text: 'The imperfect paints the scene. The preterite says what happened in it.',
      },
    },
    {
      id: 'es-u2-l1-s2',
      kind: 'worked-example',
      title: 'An Interrupted Action',
      problemMarkdown: 'Translate: "While I was cooking, my friend arrived."',
      steps: [
        {
          label: 'Find the background action',
          expressionOrAction: '"I was cooking" → cocinaba (imperfect)',
          whyNote: 'It was in progress, with no stated end. "Mientras" usually signals the imperfect.',
        },
        {
          label: 'Find the interrupting event',
          expressionOrAction: '"my friend arrived" → llegó (preterite)',
          whyNote: 'It happened once, at a single moment, and is complete.',
        },
        {
          label: 'Combine',
          expressionOrAction: 'Mientras cocinaba, llegó mi amigo.',
          whyNote: 'Ongoing action in the imperfect, interruption in the preterite.',
        },
      ],
    },
    {
      id: 'es-u2-l1-s3',
      kind: 'checkpoint',
      title: 'Pick the Tenses',
      question: {
        type: 'mcq',
        prompt: 'Choose the best pair: "Cuando yo ______ (dormir), el perro ______ (ladrar) de repente."',
        options: [
          'dormí / ladraba',
          'dormía / ladró',
          'dormía / ladraba',
          'dormí / ladró',
        ],
        correct: 1,
        explanation: 'Sleeping was in progress (imperfect); the sudden bark interrupted it (preterite).',
        points: 10,
      },
    },
    {
      id: 'es-u2-l1-s4',
      kind: 'narrative',
      title: 'Irregular Preterites, Por and Para',
      bodyMarkdown:
        'Some common verbs are irregular in the preterite. **Ir** (to go) and **ser** (to be) share one set of forms:\n\n- fui, fuiste, fue, fuimos, fuisteis, fueron\n\n*Ayer **fuimos** al cine.* (Yesterday we went to the cinema.) Context tells you which verb is meant.\n\n**Por** and **para** both often translate as "for".\n\n- **Para** looks forward to a goal: a recipient, a purpose, a destination or a deadline. *Este libro es **para** ti.* *Estudio **para** aprender.*\n- **Por** looks back at a cause or along a path: a reason, an exchange, a duration or movement through. *Gracias **por** tu ayuda.* *Pagué diez euros **por** el libro.* *Caminamos **por** el parque.*',
    },
    {
      id: 'es-u2-l1-s5',
      kind: 'checkpoint',
      title: 'Por or Para?',
      question: {
        type: 'mcq',
        prompt: 'Complete: "Salimos mañana ______ Barcelona."',
        options: [
          'para',
          'por',
          'de',
          'en',
        ],
        correct: 0,
        explanation: 'Barcelona is the destination, so the sentence takes para.',
        points: 10,
      },
    },
    {
      id: 'es-u2-l1-s6',
      kind: 'checkpoint',
      title: 'Preterite of Ir',
      question: {
        type: 'fill',
        prompt: 'Complete with the preterite of ir: "Ayer nosotros ______ a la playa."',
        correct: 'fuimos',
        alternatives: [],
        explanation: 'The nosotros preterite of ir is fuimos.',
        points: 10,
      },
    },
    {
      id: 'es-u2-l1-s7',
      kind: 'synthesis',
      title: 'Talking About the Past',
      takeaways: [
        'Preterite: completed events. Imperfect: habits, descriptions and actions in progress.',
        'An interrupted action is imperfect; the interruption is preterite.',
        'Ir and ser share the preterite forms fui, fuiste, fue, fuimos, fuisteis, fueron.',
        'Para points to a goal or recipient; por gives a cause, exchange, duration or route.',
      ],
      nextQuizIndex: 1,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'es-u2-l1-fc1',
      front: 'Which past tense describes habits and background?',
      back: 'The imperfect.',
      explanation: '"De niño, jugaba en el parque."',
      interleave: true,
    },
    {
      id: 'es-u2-l1-fc2',
      front: 'What is the ellos preterite form of ir?',
      back: 'Fueron.',
      explanation: 'Ser has the same preterite forms.',
      interleave: true,
    },
    {
      id: 'es-u2-l1-fc3',
      front: 'Por or para for the person who will receive something?',
      back: 'Para.',
      explanation: '"Este regalo es para mi abuela."',
      interleave: true,
    },
  ],
}

const ES_SUBJUNCTIVE: PackLesson = {
  id: 'es-u3-l1',
  unitId: 'es-u3-subjunctive',
  title: 'The Subjunctive: Wishes, Doubts & Conditions',
  summary: 'Learn when Spanish switches to the subjunctive, how to form it, and how to talk about what would happen if.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['es-u2-l1'],
  steps: [
    {
      id: 'es-u3-l1-s1',
      kind: 'narrative',
      title: 'A Mood, Not a Tense',
      bodyMarkdown:
        'The verb forms you have met so far are **indicative**: they state facts. The **subjunctive** is used for things that are wished, doubted, felt or not yet real.\n\nIt usually appears after **que**, when the first part of the sentence has one subject and the second part has another:\n\n- *Quiero **que vengas**.* (I want you to come.)\n- but: *Quiero **venir**.* (I want to come: same subject, so use the infinitive.)\n\nThe triggers are often remembered as **WEIRDO**:\n\n- **W**ishes: *querer que, esperar que*\n- **E**motions: *alegrarse de que, temer que*\n- **I**mpersonal expressions: *es importante que, es posible que*\n- **R**ecommendations: *recomendar que, sugerir que*\n- **D**oubt and denial: *dudar que, no creer que*\n- **O**jalá: *ojalá que* (I hope, if only)',
      callout: {
        tone: 'key-idea',
        text: 'Certainty takes the indicative: "Creo que viene." Doubt takes the subjunctive: "No creo que venga."',
      },
    },
    {
      id: 'es-u3-l1-s2',
      kind: 'narrative',
      title: 'Forming the Present Subjunctive',
      bodyMarkdown:
        '1. Start with the **yo** form of the present tense: *hablo, como, tengo*.\n2. Drop the **-o**.\n3. Add the "opposite" endings.\n\n- **-ar** verbs take **e**: hable, hables, hable, hablemos, habléis, hablen\n- **-er** and **-ir** verbs take **a**: coma, comas, coma, comamos, comáis, coman\n\nBecause the stem comes from the *yo* form, *tengo* gives **tenga** and *hago* gives **haga**.\n\nA few verbs are fully irregular and must be learned: **ser → sea**, **ir → vaya**, **saber → sepa**, **haber → haya**, **estar → esté**, **dar → dé**.',
    },
    {
      id: 'es-u3-l1-s3',
      kind: 'checkpoint',
      title: 'Form It',
      question: {
        type: 'fill',
        prompt: 'Complete with the present subjunctive of tener: "Espero que ella ______ tiempo mañana."',
        correct: 'tenga',
        alternatives: [],
        explanation: 'The yo form is tengo; drop the -o and add -a: tenga.',
        points: 10,
      },
    },
    {
      id: 'es-u3-l1-s4',
      kind: 'checkpoint',
      title: 'Indicative or Subjunctive?',
      question: {
        type: 'mcq',
        prompt: 'Which sentence is correct?',
        options: [
          'Dudo que Juan sabe la respuesta.',
          'Creo que Juan sepa la respuesta.',
          'Dudo que Juan sepa la respuesta.',
          'Es verdad que Juan sepa la respuesta.',
        ],
        correct: 2,
        explanation: 'Doubt triggers the subjunctive (sepa). "Creo que" and "es verdad que" express certainty and take the indicative (sabe).',
        points: 10,
      },
    },
    {
      id: 'es-u3-l1-s5',
      kind: 'narrative',
      title: 'Connectors and "If" Sentences',
      bodyMarkdown:
        'Some conjunctions **always** take the subjunctive, because the action they introduce has not happened:\n\n- *a menos que* (unless), *antes de que* (before), *para que* (so that), *sin que* (without), *con tal de que* (provided that), *en caso de que* (in case)\n\n*No salgo **a menos que haga** sol.* (I am not going out unless it is sunny.)\n\nTo talk about an unlikely or imaginary condition, use **si + imperfect subjunctive**, then the **conditional**:\n\n- *Si **tuviera** dinero, **viajaría** por el mundo.* (If I had money, I would travel the world.)\n\nFor a real possibility, use the present indicative after *si*, never the present subjunctive: *Si **tengo** tiempo, te llamo.*',
    },
    {
      id: 'es-u3-l1-s6',
      kind: 'checkpoint',
      title: 'Build the Hypothetical',
      question: {
        type: 'order',
        prompt: 'Put the words in order to say "If I were rich, I would buy a house":',
        options: ['Si', 'fuera rico,', 'compraría', 'una casa.'],
        correct: [0, 1, 2, 3],
        explanation: 'Si + imperfect subjunctive (fuera), then the conditional (compraría).',
        points: 15,
      },
    },
    {
      id: 'es-u3-l1-s7',
      kind: 'synthesis',
      title: 'Beyond Plain Facts',
      takeaways: [
        'Use the subjunctive after que when the main clause expresses a wish, emotion, recommendation or doubt about a different subject.',
        'Form it from the yo stem with opposite endings: hable, coma, tenga. Irregulars include sea, vaya and sepa.',
        'A menos que, antes de que, para que and sin que always take the subjunctive.',
        'Hypotheticals: si + imperfect subjunctive, then the conditional.',
      ],
      nextQuizIndex: 2,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'es-u3-l1-fc1',
      front: 'What does WEIRDO stand for?',
      back: 'Wishes, Emotions, Impersonal expressions, Recommendations, Doubt, Ojalá.',
      explanation: 'The main triggers of the subjunctive.',
      interleave: true,
    },
    {
      id: 'es-u3-l1-fc2',
      front: 'What is the present subjunctive yo form of saber?',
      back: 'Sepa.',
      explanation: 'It is irregular: "No creo que yo lo sepa."',
      interleave: true,
    },
    {
      id: 'es-u3-l1-fc3',
      front: 'Which tenses form a hypothetical "if" sentence?',
      back: 'Si + imperfect subjunctive, then the conditional.',
      explanation: '"Si tuviera dinero, viajaría."',
      interleave: true,
    },
  ],
}

const ES_UNITS: TrackUnit[] = [
  {
    id: 'es-u1-everyday',
    title: 'Everyday Spanish',
    anchoringPhenomenon: 'English says "I am tired" and "I am a student" with one verb. Spanish needs two different ones.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: [ES_BASICS],
  },
  {
    id: 'es-u2-past',
    title: 'Talking About the Past',
    anchoringPhenomenon: '"I ate" and "I used to eat" are different verb forms in Spanish, and a story needs both.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: [ES_PAST],
  },
  {
    id: 'es-u3-subjunctive',
    title: 'The Subjunctive',
    anchoringPhenomenon: 'Change "I think he is coming" to "I doubt he is coming" and the Spanish verb changes form.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: [ES_SUBJUNCTIVE],
  },
]

export const SPANISH_UNITS = ES_UNITS

export const SPANISH_TRACK: CurriculumTrack = {
  id: 'track-conversational-spanish',
  slug: 'conversational-spanish',
  packId: 'conversational-spanish',
  title: 'Spanish: Conversational Fluency & Grammar',
  category: 'Languages',
  subject: 'Spanish',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: ES_UNITS,
}
