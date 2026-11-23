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
