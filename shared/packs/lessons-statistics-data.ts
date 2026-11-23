import type { PackLesson, TrackUnit } from '../lessons'
import type { PackQuiz } from './types'

/**
 * An opening unit for the Statistics track: describing and collecting data.
 * The existing unit starts at sampling distributions and assumes these ideas.
 */

const STAT_AVERAGES: PackLesson = {
  id: 'stat-u0-l1',
  unitId: 'stat-u0-data',
  title: 'Averages & Spread',
  summary: 'Summarise a data set with the mean, median and mode, measure its spread, and see what an outlier does to each.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'stat-u0-l1-s1',
      kind: 'narrative',
      title: 'Three Kinds of Average',
      bodyMarkdown:
        'An **average** is a single value that stands for a whole data set. There are three common ones.\n\n- **Mean:** add all the values and divide by how many there are.\n- **Median:** put the values in order and take the middle one. With an even number of values, take the mean of the middle two.\n- **Mode:** the value that occurs most often. A data set can have more than one mode, or none.\n\nFor the data **2, 3, 3, 5, 7**: the mean is 20 ÷ 5 = **4**, the median is **3** and the mode is **3**.',
    },
    {
      id: 'stat-u0-l1-s2',
      kind: 'worked-example',
      title: 'The Effect of an Outlier',
      problemMarkdown: 'Five workers earn **20, 22, 24, 26 and 28** thousand a year. The owner, who earns **120** thousand, is added. What happens to the mean and to the median?',
      steps: [
        {
          label: 'Mean and median before',
          expressionOrAction: 'Mean = 120 ÷ 5 = 24. Median = 24 (the middle value).',
          whyNote: 'The data are symmetrical, so the two averages agree.',
        },
        {
          label: 'Mean after',
          expressionOrAction: '(120 + 120) ÷ 6 = 40',
          whyNote: 'One very large value drags the mean far above what a typical worker earns.',
        },
        {
          label: 'Median after',
          expressionOrAction: 'Middle two of 20, 22, 24, 26, 28, 120 are 24 and 26, so the median is 25',
          whyNote: 'The median only moved from 24 to 25. It resists outliers.',
        },
      ],
    },
    {
      id: 'stat-u0-l1-s3',
      kind: 'checkpoint',
      title: 'Find the Median',
      question: {
        type: 'fill',
        prompt: 'What is the median of 9, 4, 7, 1, 12?',
        correct: '7',
        alternatives: ['seven'],
        explanation: 'In order: 1, 4, 7, 9, 12. The middle value is 7.',
        points: 10,
      },
    },
    {
      id: 'stat-u0-l1-s4',
      kind: 'narrative',
      title: 'Measuring Spread',
      bodyMarkdown:
        'Two classes can have the same mean score and still be very different: in one, everyone scores close to the mean; in the other, scores are scattered. **Spread** measures this.\n\n- **Range** = largest value − smallest value. It is quick, but one outlier changes it completely.\n- **Quartiles** cut the ordered data into four equal parts. The **lower quartile (Q1)** is the median of the lower half, and the **upper quartile (Q3)** is the median of the upper half.\n- **Interquartile range (IQR)** = Q3 − Q1. It is the spread of the middle half of the data, so outliers do not affect it.\n\nA **box plot** draws the minimum, Q1, the median, Q3 and the maximum on one scale.',
      callout: {
        tone: 'key-idea',
        text: 'For skewed data or data with outliers, report the median and the IQR. For roughly symmetrical data, the mean is fine.',
      },
    },
    {
      id: 'stat-u0-l1-s5',
      kind: 'checkpoint',
      title: 'Choose the Average',
      question: {
        type: 'mcq',
        prompt: 'House prices in a town are mostly modest, with a few mansions worth millions. Which average best describes a typical house?',
        options: [
          'The mean',
          'The median',
          'The range',
          'The maximum',
        ],
        correct: 1,
        explanation: 'The few very high prices pull the mean up. The median is not affected by them.',
        points: 10,
      },
    },
    {
      id: 'stat-u0-l1-s6',
      kind: 'checkpoint',
      title: 'Find the IQR',
      question: {
        type: 'fill',
        prompt: 'For a data set, Q1 = 12 and Q3 = 30. What is the interquartile range?',
        correct: '18',
        alternatives: ['eighteen'],
        explanation: 'IQR = Q3 − Q1 = 30 − 12 = 18.',
        points: 10,
      },
    },
    {
      id: 'stat-u0-l1-s7',
      kind: 'synthesis',
      title: 'Centre and Spread',
      takeaways: [
        'Mean: total ÷ count. Median: middle value. Mode: most common value.',
        'Range = maximum − minimum. IQR = Q3 − Q1.',
        'The median and the IQR resist outliers; the mean and the range do not.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'stat-u0-l1-fc1',
      front: 'How do you find the median of a data set?',
      back: 'Put the values in order and take the middle one (or the mean of the middle two).',
      explanation: 'It is not affected by outliers.',
      interleave: true,
    },
    {
      id: 'stat-u0-l1-fc2',
      front: 'What is the interquartile range?',
      back: 'Q3 − Q1: the spread of the middle half of the data.',
      explanation: 'Unlike the range, it ignores extreme values.',
      interleave: true,
    },
    {
      id: 'stat-u0-l1-fc3',
      front: 'Which average is pulled most by an outlier?',
      back: 'The mean.',
      explanation: 'Every value, however extreme, enters the total.',
      interleave: true,
    },
  ],
}

const STAT_SAMPLING: PackLesson = {
  id: 'stat-u0-l2',
  unitId: 'stat-u0-data',
  title: 'Sampling, Bias & Correlation',
  summary: 'Judge whether a sample can be trusted, read a scatter graph, and keep correlation apart from causation.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: ['stat-u0-l1'],
  steps: [
    {
      id: 'stat-u0-l2-s1',
      kind: 'narrative',
      title: 'Populations and Samples',
      bodyMarkdown:
        'The **population** is the whole group you want to know about. Asking everyone is called a **census**, and it is usually too slow or too costly. Instead you study a **sample**, a smaller group taken from the population.\n\nA sample is only useful if it is **representative**: it resembles the population.\n\n- In a **random sample**, every member of the population has an equal chance of being chosen. Drawing names from a hat is one way.\n- A sample is **biased** if some kinds of people are more likely to be chosen than others. Asking people leaving a gym how much they exercise is biased.\n- A **larger** random sample generally gives a more reliable estimate, but a large biased sample is still biased.',
      callout: {
        tone: 'pitfall',
        text: 'A big sample does not cure bias. A million responses from the wrong people still give the wrong answer.',
      },
    },
    {
      id: 'stat-u0-l2-s2',
      kind: 'checkpoint',
      title: 'Spot the Bias',
      question: {
        type: 'mcq',
        prompt: 'A school wants to know how students travel to school. Which sample is least biased?',
        options: [
          'The first fifty students to arrive by bus',
          'Fifty students in the cycling club',
          'Fifty students picked at random from the full school register',
          'Fifty students who volunteer to answer',
        ],
        correct: 2,
        explanation: 'Only the random selection gives every student the same chance of being asked.',
        points: 10,
      },
    },
    {
      id: 'stat-u0-l2-s3',
      kind: 'narrative',
      title: 'Scatter Graphs and Correlation',
      bodyMarkdown:
        'A **scatter graph** plots two measurements for each individual, such as hours of revision and test score. The pattern of points shows the **correlation**.\n\n- **Positive correlation:** as one quantity goes up, so does the other. The points rise from left to right.\n- **Negative correlation:** as one goes up, the other goes down. The points fall from left to right.\n- **No correlation:** the points show no pattern.\n\nThe closer the points lie to a straight line, the **stronger** the correlation. A **line of best fit** drawn through the points can be used to estimate values. Estimating inside the range of the data (**interpolation**) is fairly safe; estimating beyond it (**extrapolation**) is not.',
    },
    {
      id: 'stat-u0-l2-s4',
      kind: 'narrative',
      title: 'Correlation Is Not Causation',
      bodyMarkdown:
        'Ice-cream sales and sunburn cases rise and fall together. Ice cream does not cause sunburn. Both are caused by a third thing: hot, sunny weather.\n\nWhen two quantities are correlated there are several possibilities:\n\n- One really does cause the other.\n- A hidden third factor, a **confounding variable**, affects both.\n- It is coincidence.\n\nA correlation alone cannot tell you which. A fair experiment, in which only one thing is changed, is needed to show cause.',
    },
    {
      id: 'stat-u0-l2-s5',
      kind: 'checkpoint',
      title: 'Read the Graph',
      question: {
        type: 'mcq',
        prompt: 'On a scatter graph of car age against car value, the points fall from top left to bottom right. What does this show?',
        options: [
          'Negative correlation',
          'Positive correlation',
          'No correlation',
          'That age causes cars to break down',
        ],
        correct: 0,
        explanation: 'As age increases, value decreases: a negative correlation.',
        points: 10,
      },
    },
    {
      id: 'stat-u0-l2-s6',
      kind: 'checkpoint',
      title: 'Cause or Coincidence?',
      question: {
        type: 'truefalse',
        prompt: 'Towns with more firefighters have more fires, so firefighters must cause fires.',
        correct: false,
        explanation: 'Larger towns have both more fires and more firefighters. Town size is the confounding variable.',
        points: 10,
      },
    },
    {
      id: 'stat-u0-l2-s7',
      kind: 'synthesis',
      title: 'Trusting Data',
      takeaways: [
        'A random sample gives every member of the population an equal chance of selection.',
        'Bias is not fixed by a bigger sample.',
        'Correlation describes a pattern; it does not prove that one thing causes another.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'stat-u0-l2-fc1',
      front: 'What makes a sample random?',
      back: 'Every member of the population has an equal chance of being chosen.',
      explanation: 'Random selection avoids bias.',
      interleave: true,
    },
    {
      id: 'stat-u0-l2-fc2',
      front: 'What is a confounding variable?',
      back: 'A hidden factor that affects both quantities and creates a correlation between them.',
      explanation: 'Hot weather raises both ice-cream sales and sunburn.',
      interleave: true,
    },
    {
      id: 'stat-u0-l2-fc3',
      front: 'What is extrapolation?',
      back: 'Using a line of best fit to estimate beyond the range of the data.',
      explanation: 'It is unreliable because the pattern may not continue.',
      interleave: true,
    },
  ],
}

export const STAT_DATA_UNIT: TrackUnit = {
  id: 'stat-u0-data',
  title: 'Describing & Collecting Data',
  anchoringPhenomenon: 'When one billionaire walks into a café, the average wealth of the customers jumps into the millions, yet nobody there is any richer.',
  capstoneQuizIndex: 0,
  masteryGate: { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 },
  lessons: [STAT_AVERAGES, STAT_SAMPLING],
}

export const STAT_DATA_QUIZ: PackQuiz = {
  title: 'Averages, Spread & Sampling',
  description: 'Mean, median, mode, range and IQR, outliers, sampling bias and correlation.',
  subject: 'Statistics',
  difficulty: 'easy',
  timeLimitSec: 480,
  srsInterleave: true,
  lessonId: 'stat-u0-l2',
  questions: [
    {
      type: 'fill',
      prompt: 'What is the mean of 4, 8, 6, 10, 2?',
      correct: '6',
      alternatives: ['six'],
      explanation: 'The total is 30, and 30 ÷ 5 = 6.',
      points: 10,
    },
    {
      type: 'mcq',
      prompt: 'What is the median of 3, 8, 5, 10?',
      options: ['5', '6.5', '8', '6'],
      correct: 1,
      explanation: 'In order: 3, 5, 8, 10. The middle two are 5 and 8, and their mean is 6.5.',
      points: 10,
    },
    {
      type: 'mcq',
      prompt: 'The data 5, 6, 6, 7, 8 has the value 50 added. Which measure changes the least?',
      options: [
        'The mean',
        'The range',
        'They all change equally',
        'The median',
      ],
      correct: 3,
      explanation: 'The median moves from 6 to 6.5. The mean jumps from 6.4 to about 13.7 and the range from 3 to 45.',
      points: 10,
    },
    {
      type: 'mcq',
      prompt: 'A website poll asks visitors whether they shop online. Why is the result unreliable for the whole country?',
      options: [
        'Website polls always have too few responses',
        'Only people who already use the internet can answer, so the sample is biased',
        'People cannot be trusted to answer polls',
        'The question has only two possible answers',
      ],
      correct: 1,
      explanation: 'People who are online are more likely to shop online than the population as a whole.',
      points: 10,
    },
    {
      type: 'truefalse',
      prompt: 'A strong correlation between two quantities proves that one causes the other.',
      correct: false,
      explanation: 'A confounding variable or coincidence can produce a correlation without any causal link.',
      points: 10,
    },
    {
      type: 'mcq',
      prompt: 'A line of best fit is based on children aged 5 to 12. Using it to predict the height of a 30-year-old is an example of:',
      options: [
        'Extrapolation',
        'Interpolation',
        'Random sampling',
        'Finding the median',
      ],
      correct: 0,
      explanation: 'The prediction lies outside the range of the data, where the pattern may not hold.',
      points: 10,
    },
  ],
}
