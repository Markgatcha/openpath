import type { ContentPack } from './types'
import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'

const MAL_U1_LESSONS: PackLesson[] = [
  {
    id: 'mal-u1-l1',
    unitId: 'mal-u1-evaluating-information',
    title: 'Lateral Reading & the SIFT Moves',
    summary:
      'Check an unfamiliar source the way fact-checkers do: leave the page, see what others say about it, and trace the claim to its origin.',
    estimatedMinutes: 9,
    standards: ['ISTE Student 1.3.b'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'mal-u1-l1-s1',
        kind: 'narrative',
        title: 'Do Not Judge a Page by the Page',
        bodyMarkdown:
          'A professional design, an official-sounding name and a list of references are all easy to fake. In a Stanford study, professional fact-checkers judged unfamiliar websites faster and more accurately than historians and university students. Their habit was **lateral reading**: instead of studying the page itself, they opened new tabs and searched for what other sources said about it.\n\nThe **SIFT** method turns that habit into four moves:\n\n1. **Stop.** Notice a strong reaction before you share.\n2. **Investigate the source.** Who is behind it, and what do others say about them?\n3. **Find better coverage.** Is the claim reported by sources you already trust?\n4. **Trace** claims, quotes and media back to their original context.',
        callout: {
          tone: 'key-idea',
          text: 'The fastest way to learn about a website is usually to leave it.',
        },
      },
      {
        id: 'mal-u1-l1-s2',
        kind: 'worked-example',
        title: 'Checking a Health Claim',
        problemMarkdown:
          'Imagine a post links to a site called **Natural Wellness Institute** claiming that a herbal tablet "prevents colds, according to a new study". Apply SIFT.',
        steps: [
          {
            label: 'Stop',
            expressionOrAction: 'Do not share yet. The claim is surprising and convenient.',
            whyNote: 'A strong "wow" or "I knew it" reaction is the cue to slow down.',
          },
          {
            label: 'Investigate the source',
            expressionOrAction: 'Open a new tab and search for the organisation’s name, not its own "About" page.',
            whyNote: 'If other sources show that it sells the tablet, it has a financial interest in the claim.',
          },
          {
            label: 'Find better coverage',
            expressionOrAction: 'Search for the claim itself and look for a national health agency or a review of many studies.',
            whyNote: 'One study rarely settles a question. Look for what the wider evidence says.',
          },
          {
            label: 'Trace to the original',
            expressionOrAction: 'Find the study itself. Check who was tested, how many people, and what was measured.',
            whyNote: 'Summaries often overstate. A small or short study cannot support "prevents colds".',
          },
        ],
      },
      {
        id: 'mal-u1-l1-s3',
        kind: 'checkpoint',
        title: 'The Fact-Checker’s First Move',
        question: {
          type: 'mcq',
          prompt: 'You land on a website you have never heard of. Which first step best matches lateral reading?',
          options: [
            'Read its "About" page carefully',
            'Check whether the design looks professional',
            'Open a new tab and search for what other sources say about the site',
            'Count how many references it lists',
          ],
          correct: 2,
          explanation:
            'A site controls its own "About" page, design and reference list. What independent sources say about it is much harder to fake.',
          points: 15,
        },
        misconceptionHints: {
          '0': 'The site writes its own "About" page. Who could give you an independent view?',
          '1': 'A polished design is cheap to produce and says nothing about accuracy.',
          '3': 'A long reference list can still point to weak or misrepresented sources.',
        },
      },
      {
        id: 'mal-u1-l1-s4',
        kind: 'branching-scenario',
        title: 'The Screenshot in the Group Chat',
        startNodeId: 'start',
        nodes: {
          start: {
            promptMarkdown:
              'A friend posts a screenshot of a headline: **"City to ban all bicycles downtown"**. There is no link. People in the chat are angry. What do you do first?',
            choices: [
              {
                label: 'Forward it to another group so more people know',
                nextNodeId: 'start',
                feedback: 'You would be spreading a claim you have not checked. A screenshot cuts a headline off from its article, date and source.',
                outcome: 'unsafe',
              },
              {
                label: 'Search for the headline to find the original article',
                nextNodeId: 'found',
                feedback: 'Good. Tracing to the original restores the context the screenshot removed.',
                outcome: 'optimal',
              },
              {
                label: 'Say nothing and scroll on',
                nextNodeId: 'found',
                feedback: 'This avoids spreading it, but the chat stays misinformed. Let’s look at what a quick search would have found.',
                outcome: 'suboptimal',
              },
            ],
          },
          found: {
            promptMarkdown:
              'The local newspaper’s article says the council is **considering** closing **one street** to bicycles **during market hours**. What is the most useful reply?',
            choices: [
              {
                label: 'Post the link and quote what the article actually says',
                nextNodeId: null,
                feedback: 'This corrects the record with the source, so others can check it too.',
                outcome: 'optimal',
              },
              {
                label: 'Tell your friend they are spreading fake news',
                nextNodeId: null,
                feedback: 'The correction is right, but without the source it becomes an argument about who to believe.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'mal-u1-l1-s5',
        kind: 'checkpoint',
        title: 'Put SIFT in Order',
        question: {
          type: 'order',
          prompt: 'Arrange the four SIFT moves in order:',
          options: [
            'Stop',
            'Investigate the source',
            'Find better coverage',
            'Trace claims to the original context',
          ],
          correct: [0, 1, 2, 3],
          explanation: 'S-I-F-T: Stop, Investigate the source, Find better coverage, Trace to the original.',
          points: 10,
        },
      },
      {
        id: 'mal-u1-l1-s6',
        kind: 'synthesis',
        title: 'Reading Sideways',
        takeaways: [
          'Lateral reading means leaving a page to see what independent sources say about it.',
          'SIFT: Stop, Investigate the source, Find better coverage, Trace to the original.',
          'Screenshots and summaries strip context; find the original before reacting.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'mal-u1-l1-fc1',
        front: 'What is lateral reading?',
        back: 'Leaving an unfamiliar page to check what other sources say about it.',
        explanation: 'It is the habit that set professional fact-checkers apart in a Stanford study.',
        interleave: true,
      },
      {
        id: 'mal-u1-l1-fc2',
        front: 'What do the letters of SIFT stand for?',
        back: 'Stop; Investigate the source; Find better coverage; Trace to the original context.',
        explanation: 'Four quick moves for checking a claim before believing or sharing it.',
        interleave: true,
      },
      {
        id: 'mal-u1-l1-fc3',
        front: 'Why is a screenshot of a headline weak evidence?',
        back: 'It removes the article, the date and the source, so the claim cannot be checked as shown.',
        explanation: 'Search for the original article before reacting.',
        interleave: true,
      },
    ],
  },
  {
    id: 'mal-u1-l2',
    unitId: 'mal-u1-evaluating-information',
    title: 'Misleading Charts, Numbers & Images',
    summary:
      'Spot truncated axes, relative-versus-absolute risk tricks, correlation presented as cause, and real photos used out of context.',
    estimatedMinutes: 9,
    standards: ['ISTE Student 1.3.b'],
    prerequisiteLessonIds: ['mal-u1-l1'],
    steps: [
      {
        id: 'mal-u1-l2-s1',
        kind: 'narrative',
        title: 'True Numbers Can Still Mislead',
        bodyMarkdown:
          'Misleading content often uses accurate data presented in a distorting way. Four patterns cover most cases:\n\n- **Truncated axis.** A bar chart that starts at 95 instead of 0 makes a 2% difference look enormous.\n- **Relative without absolute.** "Risk doubles" sounds alarming, but going from 1 in 10,000 to 2 in 10,000 is also a doubling.\n- **Correlation as cause.** Two things rising together may both be driven by a third factor.\n- **Real image, wrong context.** A genuine photo from another year or country is attached to today’s story.',
        callout: {
          tone: 'pitfall',
          text: 'Asking "is this number true?" is not enough. Also ask "compared with what?" and "out of how many?"',
        },
      },
      {
        id: 'mal-u1-l2-s2',
        kind: 'worked-example',
        title: '"Risk Doubles!"',
        problemMarkdown:
          'A headline says a food **doubles** the risk of a rare illness. The study behind it found the illness in **1 in 10,000** people who avoid the food and **2 in 10,000** who eat it. How big is the change?',
        steps: [
          {
            label: 'Relative change',
            expressionOrAction: '2 ÷ 1 = 2, a 100% increase',
            whyNote: 'This is the number the headline used. It is accurate.',
          },
          {
            label: 'Absolute change',
            expressionOrAction: '2/10,000 − 1/10,000 = 1 extra case per 10,000 people (0.01 percentage points)',
            whyNote: 'This is the number that tells you how much your own risk changes.',
          },
          {
            label: 'Judge the claim',
            expressionOrAction: 'Both numbers are true; only the absolute one shows the risk is still very small.',
            whyNote: 'Always look for the baseline rate when you see "doubles", "halves" or a bare percentage.',
          },
        ],
      },
      {
        id: 'mal-u1-l2-s3',
        kind: 'faded-practice',
        title: 'How Big Is the Rise?',
        promptMarkdown:
          'A post says bike thefts in a town are "up 50%". The police report shows **4** thefts last year and **6** this year. Check the percentage.',
        completedSteps: ['Change = 6 − 4 = 2 thefts', 'Percentage change = change ÷ original × 100'],
        fadedTarget: {
          type: 'fill',
          question: {
            type: 'fill',
            prompt: 'What is the percentage increase? Give a number.',
            correct: '50',
            alternatives: ['50%', '50 %', '50.0', '50 percent'],
            explanation:
              '2 ÷ 4 × 100 = 50%. The post is accurate, yet "up 50%" hides that it means two more thefts. Small counts produce dramatic percentages.',
            points: 15,
          },
        },
        misconceptionHints: {
          '33': 'Divide by the original value (4), not the new one (6).',
          '2': 'That is the change in thefts. Divide it by the original 4 and multiply by 100.',
        },
      },
      {
        id: 'mal-u1-l2-s4',
        kind: 'checkpoint',
        title: 'Ice Cream and Drowning',
        question: {
          type: 'mcq',
          prompt:
            'In one country, months with higher ice-cream sales also have more drownings. What is the most reasonable explanation?',
          options: [
            'Hot weather increases both ice-cream sales and swimming',
            'Eating ice cream makes swimming more dangerous',
            'Drownings make people buy ice cream',
            'The data must be fabricated',
          ],
          correct: 0,
          explanation:
            'Temperature is a third factor (a confounder) that drives both. A correlation alone does not show that one thing causes the other.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'Is there something else that rises in the same months and could drive both?',
          '3': 'The pattern can be perfectly real without one causing the other.',
        },
      },
      {
        id: 'mal-u1-l2-s5',
        kind: 'checkpoint',
        title: 'Where the Axis Starts',
        question: {
          type: 'truefalse',
          prompt:
            'Starting a bar chart’s vertical axis at 95 instead of 0 makes the difference between 96 and 98 look much larger than it is.',
          correct: true,
          explanation:
            'The bars would appear to be 1 and 3 units tall, a threefold visual difference, for values that differ by about 2%.',
          points: 10,
        },
      },
      {
        id: 'mal-u1-l2-s6',
        kind: 'synthesis',
        title: 'Reading Numbers Critically',
        takeaways: [
          'Check where a chart’s axis starts and what time window it shows.',
          'Ask for the absolute numbers behind any "doubles" or percentage claim.',
          'Correlation alone does not show cause; look for a third factor.',
          'A real photo can be misused; search for where and when it first appeared.',
        ],
        nextQuizIndex: 0,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'mal-u1-l2-fc1',
        front: 'Relative risk versus absolute risk',
        back: 'Relative compares two rates ("doubles"); absolute gives the actual change ("1 more per 10,000").',
        explanation: 'A large relative change can be a tiny absolute change when the baseline is rare.',
        interleave: true,
      },
      {
        id: 'mal-u1-l2-fc2',
        front: 'What is a confounder?',
        back: 'A third factor that influences both things being compared and creates a correlation between them.',
        explanation: 'Hot weather raises both ice-cream sales and drownings.',
        interleave: true,
      },
      {
        id: 'mal-u1-l2-fc3',
        front: 'How does a truncated axis mislead?',
        back: 'It exaggerates small differences by hiding most of each bar.',
        explanation: 'Check the axis labels before comparing bar heights.',
        interleave: true,
      },
    ],
  },
]

const MAL_U2_LESSONS: PackLesson[] = [
  {
    id: 'mal-u2-l1',
    unitId: 'mal-u2-how-ai-works',
    title: 'How Machines Learn From Data',
    summary:
      'See how a machine-learning model is trained on examples, why it is tested on data it has not seen, and how gaps in the data become errors.',
    estimatedMinutes: 9,
    standards: ['AI4K12 Big Idea 3 (Learning)'],
    prerequisiteLessonIds: [],
    steps: [
      {
        id: 'mal-u2-l1-s1',
        kind: 'narrative',
        title: 'Rules Written by Examples',
        bodyMarkdown:
          'Traditional software follows rules a programmer wrote. A **machine-learning model** is different: it is shown many examples and adjusts its internal numbers, called **parameters**, until its outputs match the examples well.\n\n- **Training data** is the set of examples it learns from.\n- **Test data** is a separate set kept hidden during training, used to check whether the model works on cases it has never seen.\n- A model that does well in training but badly on the test set has **memorised** rather than learned a general pattern.\n\nA model can only learn what its data contains. If a group or a situation is missing from the training data, expect more mistakes there.',
        callout: {
          tone: 'key-idea',
          text: 'A model has no idea what is true. It finds patterns in the examples it was given.',
        },
      },
      {
        id: 'mal-u2-l1-s2',
        kind: 'worked-example',
        title: 'Building a Spam Filter',
        problemMarkdown:
          'You have **10,000** emails that people have already marked as "spam" or "not spam". How would you build and check a spam filter?',
        steps: [
          {
            label: 'Split the data',
            expressionOrAction: 'Keep 8,000 emails for training and set 2,000 aside for testing.',
            whyNote: 'The test emails must stay unseen so they can stand in for future mail.',
          },
          {
            label: 'Train',
            expressionOrAction: 'The model adjusts its parameters to predict the label of each training email.',
            whyNote: 'It may learn that certain words, links or senders are more common in spam.',
          },
          {
            label: 'Test',
            expressionOrAction: 'Run the model on the 2,000 held-back emails and count its mistakes.',
            whyNote: 'This estimates how it will do on mail it has never seen.',
          },
          {
            label: 'Look at the kinds of error',
            expressionOrAction: 'Count real mail wrongly blocked (false positives) and spam let through (false negatives).',
            whyNote: 'The two errors have different costs. Losing a real message is usually worse than seeing one spam email.',
          },
        ],
      },
      {
        id: 'mal-u2-l1-s3',
        kind: 'checkpoint',
        title: 'Why Hold Data Back?',
        question: {
          type: 'mcq',
          prompt: 'Why is a model tested on data it did not see during training?',
          options: [
            'To make training finish faster',
            'To check that it learned a general pattern instead of memorising its examples',
            'Because the training data is always wrong',
            'To give the model more examples to learn from',
          ],
          correct: 1,
          explanation:
            'A model can score perfectly on examples it has memorised and still fail on new ones. Only unseen data shows how it will perform in real use.',
          points: 15,
        },
        misconceptionHints: {
          '3': 'If the model learns from the test data, that data can no longer measure performance on unseen cases.',
        },
      },
      {
        id: 'mal-u2-l1-s4',
        kind: 'branching-scenario',
        title: 'The Plant-Disease App',
        startNodeId: 'problem',
        nodes: {
          problem: {
            promptMarkdown:
              'A team trains an app to spot leaf disease using photos from **one farm, all taken in bright sunlight**. It scores 97% in their tests. Farmers in a cloudier region report that it misses obvious disease. What is the best fix?',
            choices: [
              {
                label: 'Tell farmers to only take photos at noon',
                nextNodeId: 'problem',
                feedback: 'That pushes the model’s limitation onto its users and still ignores other farms and crop varieties.',
                outcome: 'suboptimal',
              },
              {
                label: 'Add training photos from many farms, in different light and weather',
                nextNodeId: 'check',
                feedback: 'Yes. The model never saw cloudy conditions, so it could not learn what disease looks like in them.',
                outcome: 'optimal',
              },
              {
                label: 'Train for longer on the same photos',
                nextNodeId: 'problem',
                feedback: 'More passes over the same data cannot teach the model about conditions that are absent from it.',
                outcome: 'suboptimal',
              },
            ],
          },
          check: {
            promptMarkdown: 'After retraining, how should the team check that the problem is fixed?',
            choices: [
              {
                label: 'Test on photos from farms that were not used in training',
                nextNodeId: null,
                feedback: 'This measures what matters: performance on places the model has never seen.',
                outcome: 'optimal',
              },
              {
                label: 'Test again on the original sunny photos',
                nextNodeId: null,
                feedback: 'The original 97% came from exactly this kind of test, and it hid the problem.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'mal-u2-l1-s5',
        kind: 'checkpoint',
        title: 'Bias In, Bias Out',
        question: {
          type: 'truefalse',
          prompt: 'A model trained on data that under-represents a group will usually make more mistakes for that group.',
          correct: true,
          explanation: 'With few examples to learn from, the model’s patterns fit that group poorly.',
          points: 10,
        },
      },
      {
        id: 'mal-u2-l1-s6',
        kind: 'synthesis',
        title: 'Learning From Examples',
        takeaways: [
          'A machine-learning model adjusts parameters to fit training examples.',
          'Performance must be measured on data held back from training.',
          'Gaps and biases in the data become gaps and biases in the model.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'mal-u2-l1-fc1',
        front: 'Training data versus test data',
        back: 'Training data is what a model learns from; test data is held back to measure it on unseen cases.',
        explanation: 'Testing on training data overstates how good the model is.',
        interleave: true,
      },
      {
        id: 'mal-u2-l1-fc2',
        front: 'False positive versus false negative (spam filter)',
        back: 'False positive: real mail marked as spam. False negative: spam let through.',
        explanation: 'Which error matters more depends on the cost of each.',
        interleave: true,
      },
      {
        id: 'mal-u2-l1-fc3',
        front: 'Why does a model trained in one setting often fail in another?',
        back: 'It only learned patterns present in its training data.',
        explanation: 'Photos from one sunny farm cannot teach it about cloudy ones.',
        interleave: true,
      },
    ],
  },
  {
    id: 'mal-u2-l2',
    unitId: 'mal-u2-how-ai-works',
    title: 'Large Language Models: Fluent, Not Always Right',
    summary:
      'Understand that a chatbot writes by predicting likely next words, why that produces confident errors, and how to verify what it tells you.',
    estimatedMinutes: 9,
    standards: ['AI4K12 Big Idea 3 (Learning)', 'AI4K12 Big Idea 4 (Natural Interaction)'],
    prerequisiteLessonIds: ['mal-u2-l1'],
    steps: [
      {
        id: 'mal-u2-l2-s1',
        kind: 'narrative',
        title: 'A Very Good Next-Word Predictor',
        bodyMarkdown:
          'A **large language model** (LLM) is trained on a huge amount of text to do one thing: predict what comes next. Text is split into small pieces called **tokens**, and the model writes an answer one token at a time, each chosen because it is a likely continuation of everything so far.\n\nThat explains both its strength and its weakness:\n\n- It is **fluent**, because it has seen how well-written text flows.\n- It can be **wrong with total confidence**, because "sounds like a good answer" and "is true" are different things. Invented facts, quotes and references are often called **hallucinations**.\n- Unless it is connected to a search tool, it is not looking anything up. It is writing from patterns learned during training, which stopped at some date.',
        callout: {
          tone: 'pitfall',
          text: 'Confident, detailed writing is what a language model always produces. It is not a sign that the content is correct.',
        },
      },
      {
        id: 'mal-u2-l2-s2',
        kind: 'worked-example',
        title: 'Checking a Reference From a Chatbot',
        problemMarkdown:
          'You ask a chatbot for a source for a history essay. It replies with an author, a book title, a year and a page number. How do you check it before citing it?',
        steps: [
          {
            label: 'Search for the exact title',
            expressionOrAction: 'Look it up in a library catalogue or a search engine.',
            whyNote: 'Language models can produce references that look right and do not exist.',
          },
          {
            label: 'If it exists, open it',
            expressionOrAction: 'Find the page and read the passage yourself.',
            whyNote: 'A real book may still not say what the chatbot claimed.',
          },
          {
            label: 'If it does not exist, discard it',
            expressionOrAction: 'Search for the claim itself in sources you can open.',
            whyNote: 'Asking the chatbot "are you sure?" is not a check; it may simply repeat or change its answer.',
          },
          {
            label: 'Cite what you read',
            expressionOrAction: 'Reference the source you actually opened.',
            whyNote: 'You are responsible for every source in your work.',
          },
        ],
      },
      {
        id: 'mal-u2-l2-s3',
        kind: 'checkpoint',
        title: 'What Is It Actually Doing?',
        question: {
          type: 'mcq',
          prompt: 'When a large language model writes an answer, what is it fundamentally doing?',
          options: [
            'Looking the answer up in a database of verified facts',
            'Copying the best-matching web page',
            'Reasoning from a set of rules written by experts',
            'Predicting likely next tokens from patterns in its training text',
          ],
          correct: 3,
          explanation:
            'The answer is generated token by token as a likely continuation. Nothing in that process checks the result against the facts.',
          points: 15,
        },
        misconceptionHints: {
          '0': 'A plain language model has no fact database. What was it trained to predict?',
          '1': 'It generates new text rather than retrieving a page, which is why it can state things no source says.',
        },
      },
      {
        id: 'mal-u2-l2-s4',
        kind: 'checkpoint',
        title: 'The Quoted Page',
        question: {
          type: 'mcq',
          prompt:
            'A chatbot gives you a direct quotation from a novel, with a page number. What is the most reliable way to check it?',
          options: [
            'Find the passage in the book itself',
            'Ask the chatbot whether it is sure',
            'Ask a second chatbot the same question',
            'Check that the quotation sounds like the author’s style',
          ],
          correct: 0,
          explanation:
            'Only the original settles it. Another model, or the same one asked again, is generating text in the same way and can repeat the error.',
          points: 15,
        },
        misconceptionHints: {
          '1': 'The model has no way to look inside itself and confirm a quotation. Where does the quotation really live?',
          '2': 'Two models can make the same kind of mistake. Go to the original.',
        },
      },
      {
        id: 'mal-u2-l2-s5',
        kind: 'checkpoint',
        title: 'Confidence and Accuracy',
        question: {
          type: 'truefalse',
          prompt: 'If an AI answer is detailed and confidently written, it is very likely to be accurate.',
          correct: false,
          explanation: 'Fluency comes from the way the model generates text and is present in wrong answers too.',
          points: 10,
        },
      },
      {
        id: 'mal-u2-l2-s6',
        kind: 'synthesis',
        title: 'Using a Language Model With Open Eyes',
        takeaways: [
          'An LLM generates text by predicting likely next tokens.',
          'It can state false things fluently, including invented references.',
          'Verify facts, quotations and sources in the original, not by asking the model again.',
        ],
        nextQuizIndex: 1,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'mal-u2-l2-fc1',
        front: 'What is a token, for a language model?',
        back: 'A small piece of text (a word or part of a word) that the model reads and predicts.',
        explanation: 'Answers are generated one token at a time.',
        interleave: true,
      },
      {
        id: 'mal-u2-l2-fc2',
        front: 'What is an AI "hallucination"?',
        back: 'Output that is fluent and confident but false or invented.',
        explanation: 'Made-up references and quotations are common examples.',
        interleave: true,
      },
      {
        id: 'mal-u2-l2-fc3',
        front: 'How should you verify a source suggested by a chatbot?',
        back: 'Find the source itself and read the relevant passage.',
        explanation: 'Asking the model to confirm is not verification.',
        interleave: true,
      },
    ],
  },
]

const MAL_U3_LESSONS: PackLesson[] = [
  {
    id: 'mal-u3-l1',
    unitId: 'mal-u3-responsible-use',
    title: 'Using AI Tools Responsibly',
    summary:
      'Decide when AI help is allowed, keep private data out of prompts, write prompts that support learning, and own the result.',
    estimatedMinutes: 9,
    standards: ['ISTE Student 1.2.a', 'ISTE Student 1.2.d'],
    prerequisiteLessonIds: ['mal-u2-l2'],
    steps: [
      {
        id: 'mal-u3-l1-s1',
        kind: 'narrative',
        title: 'Three Questions Before You Prompt',
        bodyMarkdown:
          'Before using an AI tool for school or work, ask:\n\n1. **Is it allowed?** Rules differ between teachers, courses and tasks. If you are unsure, ask, and say how you used it.\n2. **Is it private?** Anything you type may be stored. Keep names, addresses, health details, passwords and other people’s information out of prompts.\n3. **Is it accurate?** You are responsible for what you hand in, including any error the tool introduced.\n\nThere is also a learning question. Having a tool produce the answer skips the effort that builds memory. Using it to **quiz you, explain a step you are stuck on, or critique your draft** keeps the thinking with you.',
        callout: {
          tone: 'key-idea',
          text: 'An AI tool can be a tutor or a substitute. Only the first one leaves you knowing more.',
        },
      },
      {
        id: 'mal-u3-l1-s2',
        kind: 'branching-scenario',
        title: 'Essay Due Tomorrow',
        startNodeId: 'start',
        nodes: {
          start: {
            promptMarkdown:
              'Your essay is due tomorrow. Your teacher’s policy says AI tools **may be used for brainstorming and feedback if you say so**, and **may not write the essay**. What do you do?',
            choices: [
              {
                label: 'Ask the tool to write the essay, then change some words',
                nextNodeId: 'start',
                feedback: 'This breaks the policy, and rewording does not make the work yours.',
                outcome: 'unsafe',
              },
              {
                label: 'Write your own outline, then ask the tool to point out weak arguments',
                nextNodeId: 'disclose',
                feedback: 'This is inside the policy and keeps the thinking yours.',
                outcome: 'optimal',
              },
              {
                label: 'Avoid AI entirely to be safe',
                nextNodeId: 'disclose',
                feedback: 'Always acceptable. You are passing up feedback the policy allows, which is your choice.',
                outcome: 'suboptimal',
              },
            ],
          },
          disclose: {
            promptMarkdown:
              'Suppose you did use the tool for feedback, and it suggested a statistic that you added to the essay. What now?',
            choices: [
              {
                label: 'Find the statistic in a real source, cite that source, and note that you used AI for feedback',
                nextNodeId: null,
                feedback: 'You verified the fact, cited something a reader can check, and were open about the help you had.',
                outcome: 'optimal',
              },
              {
                label: 'Keep the statistic and cite the chatbot as the source',
                nextNodeId: null,
                feedback: 'A chatbot is not a source a reader can check, and the number may be invented.',
                outcome: 'unsafe',
              },
            ],
          },
        },
      },
      {
        id: 'mal-u3-l1-s3',
        kind: 'checkpoint',
        title: 'What Is Safe to Paste?',
        question: {
          type: 'mcq',
          prompt: 'Which of these is the safest thing to paste into a public AI chatbot?',
          options: [
            'A classmate’s medical details, to ask for advice on their behalf',
            'Your full name, home address and date of birth, to fill in a form',
            'A paragraph you wrote about a novel, to ask for feedback',
            'A screenshot of a private group chat',
          ],
          correct: 2,
          explanation:
            'Your own non-personal writing carries little risk. The other options share personal or sensitive information, some of it belonging to other people who did not agree.',
          points: 15,
        },
        misconceptionHints: {
          '0': 'This is someone else’s sensitive information, shared without their consent.',
          '3': 'A group chat contains other people’s words and names. Did they agree to share them?',
        },
      },
      {
        id: 'mal-u3-l1-s4',
        kind: 'worked-example',
        title: 'From a Vague Prompt to a Useful One',
        problemMarkdown:
          'You are revising photosynthesis and type **"explain photosynthesis"**. The answer is long and you remember little of it. Improve the prompt so the tool acts as a tutor.',
        steps: [
          {
            label: 'Say who you are and what you know',
            expressionOrAction: '"I am 15 and I know plants need light, water and carbon dioxide."',
            whyNote: 'The tool can pitch its answer at your level instead of guessing.',
          },
          {
            label: 'Ask to be tested, not told',
            expressionOrAction: '"Ask me five questions, one at a time, and wait for my answer."',
            whyNote: 'Recalling an answer yourself strengthens memory far more than rereading one.',
          },
          {
            label: 'Ask for corrections with reasons',
            expressionOrAction: '"If I am wrong, explain why before moving on."',
            whyNote: 'Feedback right after an attempt is when it helps most.',
          },
          {
            label: 'Check anything surprising',
            expressionOrAction: 'Compare the tool’s corrections with your textbook.',
            whyNote: 'The tutor can be wrong too.',
          },
        ],
      },
      {
        id: 'mal-u3-l1-s5',
        kind: 'checkpoint',
        title: 'Who Owns the Mistake?',
        question: {
          type: 'truefalse',
          prompt:
            'If an AI tool introduces a factual error into an assignment you hand in, you are responsible for that error.',
          correct: true,
          explanation: 'Submitting work means vouching for it, whichever tools helped produce it.',
          points: 10,
        },
      },
      {
        id: 'mal-u3-l1-s6',
        kind: 'synthesis',
        title: 'Allowed, Private, Accurate',
        takeaways: [
          'Check the rules for the task and be open about how you used AI.',
          'Keep personal and other people’s information out of prompts.',
          'Use AI to quiz, explain and critique, so the learning stays yours.',
          'You answer for everything you submit.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'mal-u3-l1-fc1',
        front: 'Three questions to ask before using an AI tool for school work',
        back: 'Is it allowed? Is it private? Is it accurate?',
        explanation: 'Policy, privacy and verification.',
        interleave: true,
      },
      {
        id: 'mal-u3-l1-fc2',
        front: 'What should never go into a prompt?',
        back: 'Personal or sensitive information, especially other people’s.',
        explanation: 'What you type may be stored.',
        interleave: true,
      },
      {
        id: 'mal-u3-l1-fc3',
        front: 'How can an AI tool help you learn rather than replace learning?',
        back: 'Have it quiz you, explain a step you are stuck on, or critique your own draft.',
        explanation: 'Recalling answers yourself is what builds memory.',
        interleave: true,
      },
    ],
  },
  {
    id: 'mal-u3-l2',
    unitId: 'mal-u3-responsible-use',
    title: 'Feeds, Recommendation Algorithms & Synthetic Media',
    summary:
      'See why a feed is not a neutral sample of the world, and check AI-generated images, audio and video by their source rather than their look.',
    estimatedMinutes: 9,
    standards: ['AI4K12 Big Idea 5 (Societal Impact)', 'ISTE Student 1.3.b'],
    prerequisiteLessonIds: ['mal-u1-l1'],
    steps: [
      {
        id: 'mal-u3-l2-s1',
        kind: 'narrative',
        title: 'What Your Feed Is Built to Do',
        bodyMarkdown:
          'A social feed is ordered by a **recommendation algorithm**: a model that predicts which posts you are most likely to watch, like, comment on or share, and shows those first. It is tuned for **engagement**, which is not the same as accuracy or importance. Posts that provoke strong feelings tend to collect more reactions, so they can travel further.\n\nYour feed is also **personalised**. Two people see different posts, so "everyone is talking about this" may only be true of your own feed.\n\n**Synthetic media** adds a second problem. AI tools can now generate realistic images, voices and video, often called **deepfakes** when they imitate a real person. Visual clues such as odd hands or blurred text become less reliable as the tools improve, so the dependable check is the source: who published it first, and do independent outlets confirm it?',
        callout: {
          tone: 'key-idea',
          text: 'Seeing a post often tells you what the algorithm predicts you will engage with. It does not tell you how common or how true the claim is.',
        },
      },
      {
        id: 'mal-u3-l2-s2',
        kind: 'checkpoint',
        title: 'What Is the Feed Optimising?',
        question: {
          type: 'mcq',
          prompt: 'What is a typical social-media recommendation algorithm mainly built to predict?',
          options: [
            'Which posts are the most accurate',
            'Which posts you are most likely to engage with',
            'Which posts are the most recent',
            'Which posts your friends disagree with',
          ],
          correct: 1,
          explanation:
            'Ranking is driven by predicted engagement: watching, liking, commenting and sharing. Accuracy is not what is being measured.',
          points: 15,
        },
        misconceptionHints: {
          '0': 'The system measures clicks, watch time and shares. Does any of those measure accuracy?',
          '2': 'Feeds are rarely in simple time order. What decides which post comes first?',
        },
      },
      {
        id: 'mal-u3-l2-s3',
        kind: 'worked-example',
        title: 'A Shocking Video of a Public Figure',
        problemMarkdown:
          'A video appears in your feed showing a well-known politician saying something outrageous. It has thousands of shares. How do you check it?',
        steps: [
          {
            label: 'Find who posted it first',
            expressionOrAction: 'Trace the shares back to the earliest upload you can find.',
            whyNote: 'An anonymous account created last week is weaker evidence than a named news organisation.',
          },
          {
            label: 'Look for independent coverage',
            expressionOrAction: 'Search for the statement. Have several established outlets reported it?',
            whyNote: 'A real statement by a public figure is news; silence from every newsroom is a warning sign.',
          },
          {
            label: 'Check the official record',
            expressionOrAction: 'Look at the person’s official channels and any full recording of the event.',
            whyNote: 'Clips can be cut or reordered to change the meaning, with no AI involved.',
          },
          {
            label: 'Decide',
            expressionOrAction: 'If you cannot confirm it, do not share it.',
            whyNote: 'The number of shares measures spread, not truth.',
          },
        ],
      },
      {
        id: 'mal-u3-l2-s4',
        kind: 'branching-scenario',
        title: 'The Urgent Voice Message',
        startNodeId: 'message',
        nodes: {
          message: {
            promptMarkdown:
              'You get a voice message from an unknown number. It sounds exactly like your cousin: **"I’ve lost my phone and I’m stuck. Please send money to this account right now."** What do you do?',
            choices: [
              {
                label: 'Send the money; it is clearly their voice',
                nextNodeId: 'message',
                feedback: 'A voice can be cloned from a short recording. Urgency plus a new number plus a request for money is a classic scam pattern.',
                outcome: 'unsafe',
              },
              {
                label: 'Call your cousin on the number you already have',
                nextNodeId: null,
                feedback: 'Checking through a channel you already trust defeats the scam, however convincing the voice is.',
                outcome: 'optimal',
              },
              {
                label: 'Reply to the message asking if it is really them',
                nextNodeId: 'message',
                feedback: 'Whoever sent the message will simply say yes. Use a contact route they do not control.',
                outcome: 'suboptimal',
              },
            ],
          },
        },
      },
      {
        id: 'mal-u3-l2-s5',
        kind: 'checkpoint',
        title: 'Can You Always See It?',
        question: {
          type: 'truefalse',
          prompt: 'Looking for odd hands or blurry backgrounds is a reliable way to detect every AI-generated image.',
          correct: false,
          explanation:
            'Such flaws appear in some generated images and not in others, and they are becoming rarer. Checking where an image came from is more dependable.',
          points: 10,
        },
      },
      {
        id: 'mal-u3-l2-s6',
        kind: 'synthesis',
        title: 'Source Over Surface',
        takeaways: [
          'Feeds rank posts by predicted engagement, and each person’s feed is different.',
          'Share counts measure spread, not accuracy.',
          'Check synthetic media by its source and independent confirmation, not by how it looks.',
          'Confirm urgent requests through a contact route you already trust.',
        ],
        nextQuizIndex: 2,
        flashcardEnroll: { autoEnroll: true, interleave: true },
      },
    ],
    flashcardSeeds: [
      {
        id: 'mal-u3-l2-fc1',
        front: 'What does a feed’s recommendation algorithm optimise for?',
        back: 'Predicted engagement: watching, liking, commenting, sharing.',
        explanation: 'Engagement is not the same as accuracy or importance.',
        interleave: true,
      },
      {
        id: 'mal-u3-l2-fc2',
        front: 'What is a deepfake?',
        back: 'AI-generated or AI-altered image, audio or video that imitates a real person.',
        explanation: 'Verify by source and independent confirmation.',
        interleave: true,
      },
      {
        id: 'mal-u3-l2-fc3',
        front: 'A familiar voice on a new number urgently asks for money. Best response?',
        back: 'Contact the person through a number or channel you already have.',
        explanation: 'Voices can be cloned; a trusted channel cannot be faked by the caller.',
        interleave: true,
      },
    ],
  },
]

const GATE = { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 } as const

const MAL_UNITS: TrackUnit[] = [
  {
    id: 'mal-u1-evaluating-information',
    title: 'Evaluating Information Online',
    anchoringPhenomenon:
      'Professional fact-checkers judge an unfamiliar website in seconds, and they do it by leaving the site.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: MAL_U1_LESSONS,
  },
  {
    id: 'mal-u2-how-ai-works',
    title: 'How AI Systems Work',
    anchoringPhenomenon:
      'A chatbot can write a flawless paragraph that cites a book which was never published.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: MAL_U2_LESSONS,
  },
  {
    id: 'mal-u3-responsible-use',
    title: 'Using AI & Media Responsibly',
    anchoringPhenomenon:
      'Two people open the same app at the same moment and are shown two different versions of what is happening in the world.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: MAL_U3_LESSONS,
  },
]

const MAL_TRACK: CurriculumTrack = {
  id: 'track-media-ai-literacy',
  slug: 'media-ai-literacy',
  packId: 'media-ai-literacy',
  title: 'Media & AI Literacy',
  category: 'CS',
  subject: 'Media & AI Literacy',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: MAL_UNITS,
}

export const MEDIA_AI_LITERACY_PACK: ContentPack = {
  id: 'media-ai-literacy',
  name: 'Media & AI Literacy',
  description:
    'Lateral reading and SIFT, misleading charts and statistics, how machine learning and language models work, responsible AI use, feeds and synthetic media.',
  subject: 'Media & AI Literacy',
  category: 'CS',
  icon: '🔎',
  standards: 'ISTE Student Standards 1.2 & 1.3 · AI4K12 Big Ideas 3–5',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  srsInterleave: true,
  gradeBand: 'HS',
  track: MAL_TRACK,
  units: MAL_UNITS,
  quizzes: [
    {
      title: 'Evaluating Sources & Statistics',
      description: 'Lateral reading, SIFT, relative and absolute risk, correlation and misleading charts.',
      subject: 'Media & AI Literacy',
      difficulty: 'easy',
      timeLimitSec: 480,
      srsInterleave: true,
      lessonId: 'mal-u1-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'What does "lateral reading" mean?',
          options: [
            'Reading a page from the bottom up',
            'Reading only the headings of an article',
            'Leaving a page to check what other sources say about it',
            'Reading two articles from the same website',
          ],
          correct: 2,
          explanation: 'Fact-checkers open new tabs and investigate a source from outside instead of trusting what it says about itself.',
          points: 10,
        },
        {
          type: 'order',
          prompt: 'Arrange the SIFT moves in order:',
          options: ['Stop', 'Investigate the source', 'Find better coverage', 'Trace claims to the original context'],
          correct: [0, 1, 2, 3],
          explanation: 'S-I-F-T.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt:
            'A drug is advertised as "cutting the risk of a condition by 50%". The condition affects 2 in 1,000 people without the drug. How many per 1,000 does the drug help?',
          options: ['1', '50', '500', '2'],
          correct: 0,
          explanation: 'Half of 2 in 1,000 is 1 in 1,000. The relative change is 50%; the absolute change is 1 person per 1,000.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'If two things rise and fall together, one of them must be causing the other.',
          correct: false,
          explanation: 'Both may be driven by a third factor, or the pattern may be coincidence.',
          points: 10,
        },
        {
          type: 'fill',
          prompt: 'A town had 20 burglaries last year and 25 this year. What is the percentage increase? Give a number.',
          correct: '25',
          alternatives: ['25%', '25 %', '25.0', '25 percent'],
          explanation: '(25 − 20) ÷ 20 × 100 = 25%.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A dramatic photo is going round with a caption about today’s storm. What is the best way to check it?',
          options: [
            'See how many people have shared it',
            'Zoom in to see whether it looks edited',
            'Check whether the caption is well written',
            'Do a reverse image search to find where and when it first appeared',
          ],
          correct: 3,
          explanation: 'Real photos are often reused with a false caption. Finding the earliest appearance shows the true date and place.',
          points: 15,
        },
      ],
    },
    {
      title: 'How AI Systems Work',
      description: 'Training and test data, bias, and what a language model does when it writes.',
      subject: 'Media & AI Literacy',
      difficulty: 'medium',
      timeLimitSec: 480,
      srsInterleave: true,
      lessonId: 'mal-u2-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'In machine learning, what is "training data"?',
          options: [
            'The examples a model learns its patterns from',
            'The instructions a programmer writes by hand',
            'Data kept hidden to measure the model afterwards',
            'The answers a model gives to users',
          ],
          correct: 0,
          explanation: 'The model adjusts its parameters to fit these examples. The hidden set used for measurement is the test data.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A model scores 99% on its training examples and 60% on new data. What most likely happened?',
          options: [
            'The new data is wrong',
            'It memorised the training examples instead of learning a general pattern',
            'It needs to be tested on the training examples again',
            'It is working as well as possible',
          ],
          correct: 1,
          explanation: 'A large gap between training and test performance is the sign of memorising, often called overfitting.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'A face-recognition model trained mostly on photos of one group of people will usually be less accurate for other groups.',
          correct: true,
          explanation: 'A model learns the patterns in its data. Groups with few examples are fitted poorly.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'A spam filter moves a genuine email from your teacher into the spam folder. What kind of error is this?',
          options: ['A false negative', 'A hallucination', 'A false positive', 'A training error'],
          correct: 2,
          explanation: 'The filter said "spam" (positive) and was wrong. Spam that reaches the inbox is a false negative.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'Why can a large language model state something false in a confident tone?',
          options: [
            'It is programmed to deceive users',
            'It always copies errors from one specific website',
            'It only makes errors when the question is rude',
            'It generates likely-sounding text, and nothing in that process checks it against the facts',
          ],
          correct: 3,
          explanation: 'Generation is prediction of plausible next tokens. Plausible and true usually agree, but not always.',
          points: 15,
        },
        {
          type: 'fill',
          prompt: 'Fluent but false or invented output from an AI model is commonly called a ______.',
          correct: 'hallucination',
          alternatives: ['hallucinations', 'a hallucination', 'confabulation'],
          explanation: 'Invented references and quotations are typical examples.',
          points: 10,
        },
      ],
    },
    {
      title: 'Responsible Use, Feeds & Synthetic Media',
      description: 'Policy, privacy and verification when using AI; recommendation algorithms; deepfakes and scams.',
      subject: 'Media & AI Literacy',
      difficulty: 'medium',
      timeLimitSec: 480,
      srsInterleave: true,
      lessonId: 'mal-u3-l2',
      questions: [
        {
          type: 'mcq',
          prompt: 'Which use of an AI tool best supports your own learning?',
          options: [
            'Having it write your answer so you can copy it',
            'Having it summarise a chapter so you can skip reading it',
            'Having it quiz you and explain what you got wrong',
            'Having it rewrite a classmate’s essay as yours',
          ],
          correct: 2,
          explanation: 'Being tested makes you recall the material, which is what strengthens memory.',
          points: 10,
        },
        {
          type: 'truefalse',
          prompt: 'It is safe to paste a friend’s private messages into a public chatbot as long as you delete the chat afterwards.',
          correct: false,
          explanation: 'What you submit may already have been stored, and the messages were not yours to share.',
          points: 10,
        },
        {
          type: 'mcq',
          prompt: 'Why might two people see very different posts about the same news event?',
          options: [
            'Each feed is personalised by an algorithm predicting what that person will engage with',
            'One of them must be using an outdated app',
            'Posts are shown in strict time order',
            'News organisations post different stories to each person',
          ],
          correct: 0,
          explanation: 'Ranking is individual, so a feed is not a neutral sample of what is being said.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt: 'A video of a celebrity endorsing a get-rich-quick scheme has two million views. What does the view count tell you?',
          options: [
            'That the video is genuine',
            'That the scheme works',
            'That the celebrity approved it',
            'That it has spread widely, and nothing about whether it is real',
          ],
          correct: 3,
          explanation: 'Views measure reach. Fake endorsements are a common use of synthetic media.',
          points: 15,
        },
        {
          type: 'mcq',
          prompt:
            'A caller who sounds like a family member, on a number you do not know, urgently asks you to transfer money. What should you do?',
          options: [
            'Transfer the money, since you recognise the voice',
            'Hang up and call them on the number you already have',
            'Ask the caller to confirm their name',
            'Ask them to send a selfie',
          ],
          correct: 1,
          explanation: 'Voices and images can be generated. A contact route you already trust is one the caller cannot control.',
          points: 15,
        },
        {
          type: 'truefalse',
          prompt: 'You remain responsible for the accuracy of work you submit even if an AI tool wrote part of it.',
          correct: true,
          explanation: 'Submitting work means vouching for it.',
          points: 10,
        },
      ],
    },
  ],
}
