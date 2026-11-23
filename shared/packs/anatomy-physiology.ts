import type { ContentPack } from './types'
import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'

const ANP_U1_LESSONS: PackLesson[] = [
  {
    id: 'anp-u1-l1',
    unitId: 'anp-u1-organisation',
    title: 'From Cells to Organ Systems',
    summary: 'Climb the levels of organisation in the body and meet the four kinds of tissue every organ is built from.',
    estimatedMinutes: 7,
    standards: ['NGSS HS-LS1-2'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'anp-u1-l1-s1',
        kind: 'narrative',
        title: 'Levels of Organisation',
        bodyMarkdown:
          'The body is built in layers. **Cells** are the smallest living units. Similar cells working together form a **tissue**. Different tissues combine into an **organ**, such as the heart or stomach. Organs that share a job make up an **organ system**, and the systems together make the **organism**.\n\nAll organs are built from just four kinds of tissue:\n\n- **Epithelial** tissue covers surfaces and lines tubes and cavities.\n- **Connective** tissue supports and binds: bone, cartilage, fat and blood.\n- **Muscle** tissue contracts to produce movement.\n- **Nervous** tissue carries electrical signals.',
        callout: {
          tone: 'key-idea',
          text: '**Anatomy** is structure and **physiology** is function. The two always go together: a part’s shape fits the job it does.',
        },
      },
      {
        id: 'anp-u1-l1-s2',
        kind: 'checkpoint',
        title: 'Smallest to Largest',
        question: {
          type: 'order',
          prompt: 'Order these levels of organisation from SMALLEST to LARGEST:',
          options: ['Cell', 'Tissue', 'Organ', 'Organ system'],
          correct: [0, 1, 2, 3],
          explanation: 'Cells form tissues, tissues form organs, and organs work together in organ systems.',
          points: 15,
        },
      },
      {
        id: 'anp-u1-l1-s3',
        kind: 'worked-example',
        title: 'Reading an Organ: The Stomach',
        problemMarkdown: 'The stomach is one organ. Which of the four tissue types does it contain, and what does each do there?',
        steps: [
          {
            label: 'Lining',
            expressionOrAction: 'Epithelial tissue lines the inside and releases acid and enzymes',
            whyNote: 'Linings and glands are epithelial.',
          },
          {
            label: 'Wall',
            expressionOrAction: 'Muscle tissue in the wall churns the food',
            whyNote: 'Movement always means muscle.',
          },
          {
            label: 'Support and control',
            expressionOrAction: 'Connective tissue holds the layers together; nervous tissue coordinates the contractions',
            whyNote: 'Most organs contain all four tissue types, each doing its own part of the job.',
          },
        ],
      },
      {
        id: 'anp-u1-l1-s4',
        kind: 'checkpoint',
        title: 'Which Tissue?',
        question: {
          type: 'mcq',
          prompt: 'Blood is classed as which type of tissue?',
          options: ['Connective tissue', 'Epithelial tissue', 'Muscle tissue', 'Nervous tissue'],
          correct: 0,
          explanation: 'Connective tissues are cells spread through a surrounding material. In blood that material is the liquid plasma.',
          points: 10,
        },
      },
      {
        id: 'anp-u1-l1-s5',
        kind: 'synthesis',
        title: 'How the Body Is Built',
        takeaways: [
          'Cells → tissues → organs → organ systems → organism.',
          'The four tissue types are epithelial, connective, muscle and nervous.',
          'Structure fits function at every level.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'anp-u1-l1-fc1',
        front: 'Name the four tissue types.',
        back: 'Epithelial, connective, muscle and nervous.',
        explanation: 'Every organ is built from combinations of these.',
        interleave: true,
      },
      {
        id: 'anp-u1-l1-fc2',
        front: 'What is an organ?',
        back: 'A structure made of several tissues working together on a shared job.',
        explanation: 'The heart contains muscle, connective, nervous and epithelial tissue.',
        interleave: true,
      },
      {
        id: 'anp-u1-l1-fc3',
        front: 'Anatomy vs. physiology?',
        back: 'Anatomy is the study of structure; physiology is the study of function.',
        explanation: 'A structure’s form reflects what it does.',
        interleave: true,
      },
    ],
  },
  {
    id: 'anp-u1-l2',
    unitId: 'anp-u1-organisation',
    title: 'Homeostasis & Feedback',
    summary: 'See how the body holds temperature and blood sugar steady with negative feedback loops.',
    estimatedMinutes: 9,
    standards: ['NGSS HS-LS1-3'],
    prerequisiteLessonIds: ['anp-u1-l1'],
    steps: [
      {
        id: 'anp-u1-l2-s1',
        kind: 'narrative',
        title: 'Holding Steady',
        bodyMarkdown:
          '**Homeostasis** is the body keeping its internal conditions within a narrow range while the outside world changes. Core temperature stays close to 37 °C whether you are in snow or in a sauna.\n\nIt works through **negative feedback**, a loop with three parts:\n\n1. A **receptor** detects that a value has drifted.\n2. A **control centre**, often in the brain, compares it with the set point.\n3. An **effector** acts to push the value back.\n\nThe response opposes the change, so the system corrects itself, like a thermostat switching a heater off once a room is warm.',
        callout: {
          tone: 'pitfall',
          text: 'Negative feedback is not harmful feedback. “Negative” means the response reverses the change that triggered it.',
        },
      },
      {
        id: 'anp-u1-l2-s2',
        kind: 'branching-scenario',
        title: 'A Run on a Hot Day',
        startNodeId: 'start',
        nodes: {
          start: {
            promptMarkdown:
              'You are twenty minutes into a run on a hot afternoon. Your working muscles are releasing heat and your core temperature starts to climb. What does your body do?',
            choices: [
              {
                label: 'Sweat, and widen the blood vessels in the skin',
                nextNodeId: 'cooling',
                feedback: 'Yes. Evaporating sweat carries heat away, and wider skin vessels bring warm blood to the surface.',
                outcome: 'optimal',
              },
              {
                label: 'Shiver, and narrow the blood vessels in the skin',
                nextNodeId: 'start',
                feedback: 'Those responses conserve and produce heat. They are what the body does when it is too cold.',
                outcome: 'unsafe',
              },
            ],
          },
          cooling: {
            promptMarkdown: 'Your temperature falls back toward 37 °C. What happens to the sweating?',
            choices: [
              {
                label: 'It eases off, because the signal that triggered it has gone',
                nextNodeId: null,
                feedback: 'This is the feedback part of the loop: the response removes its own cause, so it switches itself off.',
                outcome: 'optimal',
              },
              {
                label: 'It keeps increasing until you stop running',
                nextNodeId: null,
                feedback: 'A response that kept growing would overshoot. Negative feedback scales the response to how far the value is from its set point.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
