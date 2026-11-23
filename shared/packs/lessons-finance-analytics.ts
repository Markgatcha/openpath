import type { CurriculumTrack, PackLesson, TrackUnit } from '../lessons'

/**
 * Lesson tracks for the Corporate Finance and Data Analytics packs, which
 * previously shipped quizzes only. One lesson leads into each existing quiz.
 */

const ATTRIBUTION = 'OpenPath Original Authors (MIT)'
const GATE = { policy: 'soft-recommended', minLessonCompletion: true, minQuizAccuracyPct: 75 } as const

const CF_TIME_VALUE: PackLesson = {
  id: 'cf-u1-l1',
  unitId: 'cf-u1-time-value',
  title: 'The Time Value of Money',
  summary: 'Discount a future payment back to today, value a payment that lasts forever, and estimate doubling times in your head.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'cf-u1-l1-s1',
      kind: 'narrative',
      title: 'A Dollar Today Is Worth More',
      bodyMarkdown:
        'Money you have now can be invested and earn a return, so $100 today is worth more than $100 a year from now. Finance turns that idea into arithmetic.\n\n- **Compounding** moves money forward in time: future value = present value × (1 + r)ⁿ.\n- **Discounting** moves it back: present value = future value ÷ (1 + r)ⁿ.\n\nHere **r** is the rate per period and **n** is the number of periods. The rate used for discounting is called the **discount rate**, and it stands for the return you could earn elsewhere at similar risk.',
      callout: {
        tone: 'key-idea',
        text: 'Cash flows at different dates cannot be added until they have all been moved to the same date.',
      },
    },
    {
      id: 'cf-u1-l1-s2',
      kind: 'worked-example',
      title: 'Discounting Two Years',
      problemMarkdown: 'What is the present value of **$1,210** received in **2 years** if the discount rate is **10%** a year?',
      steps: [
        {
          label: 'Find the discount factor',
          expressionOrAction: '(1 + 0.10)² = 1.21',
          whyNote: 'Each year of waiting divides the value by 1.10.',
        },
        {
          label: 'Divide',
          expressionOrAction: '$1,210 ÷ 1.21 = $1,000',
          whyNote: 'Check it forwards: $1,000 grows to $1,100 after one year and $1,210 after two.',
        },
      ],
    },
    {
      id: 'cf-u1-l1-s3',
      kind: 'narrative',
      title: 'Payments That Never End',
      bodyMarkdown:
        'A **perpetuity** pays the same amount every period forever. Its present value is finite, because distant payments are discounted almost to nothing:\n\npresent value = payment ÷ r\n\nA quick mental tool for compounding is the **Rule of 72**: a sum growing at r% a year doubles in roughly 72 ÷ r years.\n\nDiscounting also explains bond prices. A bond’s coupons are fixed, so when market interest rates rise those fixed payments are discounted more heavily and the bond’s price falls.',
    },
    {
      id: 'cf-u1-l1-s4',
      kind: 'checkpoint',
      title: 'Value a Perpetuity',
      question: {
        type: 'fill',
        prompt: 'A perpetuity pays $40 a year forever. At a discount rate of 8%, what is its present value in dollars?',
        correct: '500',
        alternatives: ['$500'],
        explanation: '$40 ÷ 0.08 = $500.',
        points: 15,
      },
    },
    {
      id: 'cf-u1-l1-s5',
      kind: 'checkpoint',
      title: 'Rule of 72',
      question: {
        type: 'mcq',
        prompt: 'An investment grows at 6% a year. About how long does it take to double?',
        options: [
          '6 years',
          '12 years',
          '18 years',
          '36 years',
        ],
        correct: 1,
        explanation: '72 ÷ 6 = 12 years.',
        points: 10,
      },
    },
    {
      id: 'cf-u1-l1-s6',
      kind: 'synthesis',
      title: 'Moving Money Through Time',
      takeaways: [
        'Present value = future value ÷ (1 + r)ⁿ.',
        'A perpetuity is worth its payment divided by the discount rate.',
        'Higher discount rates mean lower present values, which is why bond prices fall when rates rise.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'cf-u1-l1-fc1',
      front: 'How do you find the present value of a single future payment?',
      back: 'Divide it by (1 + r)ⁿ.',
      explanation: 'r is the discount rate per period and n the number of periods.',
      interleave: true,
    },
    {
      id: 'cf-u1-l1-fc2',
      front: 'What is the present value of a perpetuity?',
      back: 'Payment ÷ discount rate.',
      explanation: '$50 a year at 5% is worth $1,000.',
      interleave: true,
    },
    {
      id: 'cf-u1-l1-fc3',
      front: 'State the Rule of 72.',
      back: 'Doubling time in years ≈ 72 ÷ the percentage growth rate.',
      explanation: 'At 9% a year, money doubles in about 8 years.',
      interleave: true,
    },
  ],
}

const CF_RISK_RETURN: PackLesson = {
  id: 'cf-u2-l1',
  unitId: 'cf-u2-risk-return',
  title: 'Risk, Return & the CAPM',
  summary: 'Split risk into the part diversification removes and the part it cannot, then price the remaining risk with beta.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: ['cf-u1-l1'],
  steps: [
    {
      id: 'cf-u2-l1-s1',
      kind: 'narrative',
      title: 'Two Kinds of Risk',
      bodyMarkdown:
        'Investors want a higher expected return for taking more risk. But not all risk is rewarded.\n\n- **Idiosyncratic risk** belongs to one company: a failed product, a lawsuit, a factory fire. Hold many unrelated shares and these surprises largely cancel out.\n- **Systematic risk** hits the whole market at once: recessions, interest rates, wars. No amount of diversification removes it.\n\nBecause idiosyncratic risk can be diversified away almost for free, the market pays a premium only for systematic risk.',
      callout: {
        tone: 'key-idea',
        text: 'Diversification removes company-specific risk. It cannot remove market risk.',
      },
    },
    {
      id: 'cf-u2-l1-s2',
      kind: 'narrative',
      title: 'Beta and the Security Market Line',
      bodyMarkdown:
        '**Beta (β)** measures how strongly an asset moves with the market. The market itself has β = 1. A share with β = 1.5 tends to rise or fall one and a half times as far as the market; a risk-free asset has β = 0.\n\nThe **Capital Asset Pricing Model (CAPM)** says expected return rises in a straight line with beta:\n\nexpected return = risk-free rate + β × (market return − risk-free rate)\n\nThe bracket is the **market risk premium**, the extra return investors demand for holding the market instead of a risk-free asset. Plotted against beta, the formula is the **Security Market Line**; the premium is its slope.',
    },
    {
      id: 'cf-u2-l1-s3',
      kind: 'worked-example',
      title: 'Pricing a Share With CAPM',
      problemMarkdown: 'The risk-free rate is **3%**, the market risk premium is **6%**, and a share has **β = 1.5**. What return should investors expect?',
      steps: [
        {
          label: 'Risk premium for this share',
          expressionOrAction: '1.5 × 6% = 9%',
          whyNote: 'The share carries one and a half times the market’s systematic risk, so it earns one and a half times the premium.',
        },
        {
          label: 'Add the risk-free rate',
          expressionOrAction: '3% + 9% = 12%',
          whyNote: 'Every investment earns at least the risk-free rate for the passage of time.',
        },
      ],
    },
    {
      id: 'cf-u2-l1-s4',
      kind: 'checkpoint',
      title: 'Apply the CAPM',
      question: {
        type: 'fill',
        prompt: 'The risk-free rate is 2%, the market risk premium is 5%, and a share has a beta of 2. What is its expected return, as a percentage?',
        correct: '12',
        alternatives: ['12%', '12 %', '12 percent'],
        explanation: '2% + 2 × 5% = 12%.',
        points: 15,
      },
    },
    {
      id: 'cf-u2-l1-s5',
      kind: 'checkpoint',
      title: 'What Diversification Removes',
      question: {
        type: 'mcq',
        prompt: 'An investor spreads money across 200 unrelated companies. Which risk is still left?',
        options: [
          'Idiosyncratic risk, from events at single companies',
          'No risk at all',
          'Systematic risk, from events that move the whole market',
          'Only the risk of the largest holding',
        ],
        correct: 2,
        explanation: 'Company-specific surprises average out across many holdings. A market-wide downturn hits all of them together.',
        points: 10,
      },
    },
    {
      id: 'cf-u2-l1-s6',
      kind: 'synthesis',
      title: 'Paying for Risk',
      takeaways: [
        'Idiosyncratic risk can be diversified away; systematic risk cannot.',
        'Beta measures sensitivity to the market, which has a beta of 1.',
        'CAPM: expected return = risk-free rate + β × market risk premium.',
      ],
      nextQuizIndex: 1,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'cf-u2-l1-fc1',
      front: 'What does beta measure?',
      back: 'How sensitive an asset’s return is to movements in the overall market.',
      explanation: 'β = 1 moves with the market; β = 0 is risk-free.',
      interleave: true,
    },
    {
      id: 'cf-u2-l1-fc2',
      front: 'Write the CAPM equation.',
      back: 'Expected return = risk-free rate + β × (market return − risk-free rate).',
      explanation: 'The bracket is the market risk premium.',
      interleave: true,
    },
    {
      id: 'cf-u2-l1-fc3',
      front: 'Which type of risk does diversification not remove?',
      back: 'Systematic (market) risk.',
      explanation: 'It affects all assets at once.',
      interleave: true,
    },
  ],
}

const CF_CAPITAL: PackLesson = {
  id: 'cf-u3-l1',
  unitId: 'cf-u3-capital-decisions',
  title: 'NPV, IRR & the Cost of Capital',
  summary: 'Decide whether a project is worth doing, and work out the rate a company must beat to create value.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['cf-u2-l1'],
  steps: [
    {
      id: 'cf-u3-l1-s1',
      kind: 'narrative',
      title: 'Is the Project Worth It?',
      bodyMarkdown:
        '**Net present value (NPV)** is the present value of a project’s future cash inflows minus what it costs today.\n\n- NPV above zero: the project earns more than the required return. Accept it.\n- NPV below zero: it earns less. Reject it.\n\nThe **internal rate of return (IRR)** is the discount rate at which NPV is exactly zero. A project is acceptable when its IRR is higher than the required return.',
      callout: {
        tone: 'key-idea',
        text: 'NPV measures value created in money today. That is why it is the standard test for an investment.',
      },
    },
    {
      id: 'cf-u3-l1-s2',
      kind: 'checkpoint',
      title: 'Find the NPV',
      question: {
        type: 'fill',
        prompt: 'A machine costs $500 today. The present value of the cash it will bring in is $650. What is the project’s NPV, in dollars?',
        correct: '150',
        alternatives: ['$150', '+150', '+$150'],
        explanation: '$650 − $500 = $150. The NPV is positive, so the project adds value.',
        points: 15,
      },
    },
    {
      id: 'cf-u3-l1-s3',
      kind: 'narrative',
      title: 'What Rate Must a Company Beat?',
      bodyMarkdown:
        'A company raises money from shareholders (**equity**) and lenders (**debt**). Each group expects a return. The **weighted average cost of capital (WACC)** blends the two according to how much of each the company uses:\n\nWACC = (share of equity × cost of equity) + (share of debt × cost of debt × (1 − tax rate))\n\nThe tax term is there because interest is paid before tax, which lowers the company’s tax bill. Debt is therefore cheaper than its interest rate suggests. WACC is the discount rate for projects of average risk.',
    },
    {
      id: 'cf-u3-l1-s4',
      kind: 'worked-example',
      title: 'Calculating WACC',
      problemMarkdown:
        'A company is financed **50% by equity** costing **12%** and **50% by debt** costing **8%**. The tax rate is **25%**. Find its WACC.',
      steps: [
        {
          label: 'Equity part',
          expressionOrAction: '0.50 × 12% = 6%',
          whyNote: 'Weight the cost of equity by its share of the financing.',
        },
        {
          label: 'After-tax cost of debt',
          expressionOrAction: '8% × (1 − 0.25) = 6%',
          whyNote: 'Interest is tax-deductible, so a quarter of it comes back as lower tax.',
        },
        {
          label: 'Debt part, and the total',
          expressionOrAction: '0.50 × 6% = 3%, so WACC = 6% + 3% = 9%',
          whyNote: 'A project of average risk must return more than 9% to create value.',
        },
      ],
    },
    {
      id: 'cf-u3-l1-s5',
      kind: 'checkpoint',
      title: 'IRR Against the Hurdle',
      question: {
        type: 'mcq',
        prompt: 'A company’s cost of capital is 9%. A project has an IRR of 7%. What should the company do?',
        options: [
          'Accept it, because the IRR is positive',
          'Reject it, because it returns less than the cost of capital',
          'Accept it, because 7% is close to 9%',
          'Borrow more to raise the IRR',
        ],
        correct: 1,
        explanation: 'At a 9% discount rate this project’s NPV is negative. It would return less than investors require.',
        points: 10,
      },
    },
    {
      id: 'cf-u3-l1-s6',
      kind: 'synthesis',
      title: 'Choosing Investments',
      takeaways: [
        'NPV = present value of inflows − initial cost; accept when it is positive.',
        'IRR is the discount rate that makes NPV zero.',
        'WACC blends the costs of equity and after-tax debt and is the rate a typical project must beat.',
      ],
      nextQuizIndex: 2,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'cf-u3-l1-fc1',
      front: 'What is the NPV decision rule?',
      back: 'Accept a project if its NPV is greater than zero.',
      explanation: 'A positive NPV means it earns more than the required return.',
      interleave: true,
    },
    {
      id: 'cf-u3-l1-fc2',
      front: 'Define the internal rate of return.',
      back: 'The discount rate at which a project’s NPV equals zero.',
      explanation: 'Accept when IRR exceeds the cost of capital.',
      interleave: true,
    },
    {
      id: 'cf-u3-l1-fc3',
      front: 'Why is the cost of debt multiplied by (1 − tax rate) in WACC?',
      back: 'Interest is tax-deductible, so debt costs the company less than its stated rate.',
      explanation: 'This saving is called the interest tax shield.',
      interleave: true,
    },
  ],
}

const CF_UNITS: TrackUnit[] = [
  {
    id: 'cf-u1-time-value',
    title: 'Time Value of Money',
    anchoringPhenomenon: 'A lottery winner is offered $1 million today or $50,000 a year for 20 years, and the two are not worth the same.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: [CF_TIME_VALUE],
  },
  {
    id: 'cf-u2-risk-return',
    title: 'Risk & Return',
    anchoringPhenomenon: 'Owning one share can wipe out your savings; owning a small piece of five hundred companies almost never does.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: [CF_RISK_RETURN],
  },
  {
    id: 'cf-u3-capital-decisions',
    title: 'Capital Decisions',
    anchoringPhenomenon: 'A profitable-looking factory can still destroy value if it earns less than the money used to build it costs.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: [CF_CAPITAL],
  },
]

export const CORPORATE_FINANCE_UNITS = CF_UNITS

export const CORPORATE_FINANCE_TRACK: CurriculumTrack = {
  id: 'track-corporate-finance',
  slug: 'corporate-finance',
  packId: 'corporate-finance',
  title: 'Corporate Finance: Valuation, CAPM & Risk',
  category: 'Economics',
  subject: 'Finance',
  gradeBand: 'College-Intro',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: ['track-personal-finance-literacy'],
  srsInterleaveDefault: true,
  units: CF_UNITS,
}

const DA_TRENDS: PackLesson = {
  id: 'da-u1-l1',
  unitId: 'da-u1-exploring-data',
  title: 'Trendlines, Residuals & Correlation',
  summary: 'Fit a straight line to data, measure how far each point misses it, and read the strength of a relationship from r.',
  estimatedMinutes: 9,
  standards: [],
  prerequisiteLessonIds: [],
  steps: [
    {
      id: 'da-u1-l1-s1',
      kind: 'narrative',
      title: 'A Line Through the Data',
      bodyMarkdown:
        'A **trendline** summarises how one quantity changes with another: ŷ = a + b·x.\n\n- **b** is the **slope**: how much the prediction changes when x goes up by 1.\n- **a** is the **intercept**: the prediction when x = 0.\n- **ŷ** ("y-hat") is the value the line predicts.\n\nNo line passes through every point. The gap between what actually happened and what the line predicted is the **residual**: residual = y − ŷ. Ordinary least squares picks the line that makes the sum of the squared residuals as small as possible.',
      callout: {
        tone: 'key-idea',
        text: 'A positive residual means the real value was above the line. A negative residual means it was below.',
      },
    },
    {
      id: 'da-u1-l1-s2',
      kind: 'worked-example',
      title: 'A Line From Two Points',
      problemMarkdown: 'A trendline passes through **(2, 9)** and **(6, 17)**. Find its slope and intercept.',
      steps: [
        {
          label: 'Slope',
          expressionOrAction: '(17 − 9) ÷ (6 − 2) = 8 ÷ 4 = 2',
          whyNote: 'Slope is the change in y divided by the change in x.',
        },
        {
          label: 'Intercept',
          expressionOrAction: '9 = a + 2 × 2, so a = 5',
          whyNote: 'Put either point into ŷ = a + b·x and solve for a.',
        },
        {
          label: 'Write the line',
          expressionOrAction: 'ŷ = 5 + 2x',
          whyNote: 'Check with the other point: 5 + 2 × 6 = 17.',
        },
      ],
    },
    {
      id: 'da-u1-l1-s3',
      kind: 'narrative',
      title: 'How Strong Is the Relationship?',
      bodyMarkdown:
        'The **correlation coefficient r** runs from −1 to +1.\n\n- The **sign** gives the direction: positive means the two rise together, negative means one falls as the other rises.\n- The **size**, ignoring the sign, gives the strength. r = −0.9 is a stronger linear relationship than r = +0.6.\n- r near 0 means no straight-line relationship.\n\nA strong correlation does not show that one thing causes the other. Both may be driven by something else.\n\nTo judge whether a single value is unusual, use a **z-score**: z = (value − mean) ÷ standard deviation. It counts how many standard deviations the value lies from the mean.',
    },
    {
      id: 'da-u1-l1-s4',
      kind: 'checkpoint',
      title: 'Find the Residual',
      question: {
        type: 'fill',
        prompt: 'A model predicts 30 sales. The shop actually makes 26. What is the residual (actual minus predicted)?',
        correct: '-4',
        alternatives: ['−4', 'minus 4', 'negative 4'],
        explanation: '26 − 30 = −4. The real value fell below the line.',
        points: 15,
      },
    },
    {
      id: 'da-u1-l1-s5',
      kind: 'checkpoint',
      title: 'Compare Correlations',
      question: {
        type: 'mcq',
        prompt: 'Which correlation coefficient shows the strongest linear relationship?',
        options: [
          'r = +0.70',
          'r = +0.10',
          'r = −0.85',
          'r = −0.40',
        ],
        correct: 2,
        explanation: 'Strength is the size of r without its sign. 0.85 is the largest.',
        points: 10,
      },
    },
    {
      id: 'da-u1-l1-s6',
      kind: 'synthesis',
      title: 'Reading a Trend',
      takeaways: [
        'A trendline is ŷ = a + b·x, with slope b and intercept a.',
        'Residual = actual − predicted.',
        'The size of r gives strength and its sign gives direction; correlation is not causation.',
      ],
      nextQuizIndex: 0,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'da-u1-l1-fc1',
      front: 'What is a residual?',
      back: 'The actual value minus the value the model predicted.',
      explanation: 'residual = y − ŷ.',
      interleave: true,
    },
    {
      id: 'da-u1-l1-fc2',
      front: 'What does the sign of r tell you, and what does its size tell you?',
      back: 'The sign gives the direction of the relationship; the size gives its strength.',
      explanation: 'r = −0.9 is stronger than r = +0.6.',
      interleave: true,
    },
    {
      id: 'da-u1-l1-fc3',
      front: 'How do you calculate a z-score?',
      back: '(value − mean) ÷ standard deviation.',
      explanation: 'It measures distance from the mean in standard deviations.',
      interleave: true,
    },
  ],
}

const DA_CLASSIFY: PackLesson = {
  id: 'da-u2-l1',
  unitId: 'da-u2-classification-joins',
  title: 'Judging a Classifier & Joining Tables',
  summary: 'Score a yes/no model with precision and recall, and combine tables in SQL without losing rows by accident.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['da-u1-l1'],
  steps: [
    {
      id: 'da-u2-l1-s1',
      kind: 'narrative',
      title: 'Four Kinds of Outcome',
      bodyMarkdown:
        'A classifier that answers yes or no can be right or wrong in two ways each.\n\n- **True positive (TP):** the model says yes and the answer really is yes.\n- **False positive (FP):** the model says yes but the answer is no. A false alarm.\n- **False negative (FN):** the model says no but the answer is yes. A miss.\n- **True negative (TN):** the model says no and the answer really is no.\n\nTwo scores come from these counts:\n\n- **Precision** = TP ÷ (TP + FP). Of everything the model flagged, how much was right?\n- **Recall** = TP ÷ (TP + FN). Of everything that should have been flagged, how much did it find?\n\nAccuracy alone can mislead. If 1% of transactions are fraud, a model that never flags anything is 99% accurate and useless.',
      callout: {
        tone: 'key-idea',
        text: 'Precision is about the flags the model raised. Recall is about the cases that were really there.',
      },
    },
    {
      id: 'da-u2-l1-s2',
      kind: 'worked-example',
      title: 'Scoring a Spam Filter',
      problemMarkdown:
        'A filter marks **50** emails as spam. **40** really are spam. Another **10** spam emails slip through to the inbox. Find precision and recall.',
      steps: [
        {
          label: 'Count the outcomes',
          expressionOrAction: 'TP = 40, FP = 50 − 40 = 10, FN = 10',
          whyNote: 'Flagged and right, flagged and wrong, missed.',
        },
        {
          label: 'Precision',
          expressionOrAction: '40 ÷ (40 + 10) = 0.80',
          whyNote: '80% of the emails it flagged were truly spam.',
        },
        {
          label: 'Recall',
          expressionOrAction: '40 ÷ (40 + 10) = 0.80',
          whyNote: 'It caught 80% of all the spam. The two scores match here only because FP and FN happen to be equal.',
        },
      ],
    },
    {
      id: 'da-u2-l1-s3',
      kind: 'narrative',
      title: 'Combining Tables in SQL',
      bodyMarkdown:
        'A **join** matches rows from two tables on a shared column.\n\n- **INNER JOIN** keeps only rows that have a match in both tables.\n- **LEFT JOIN** keeps every row of the left table. Where the right table has no match, its columns are filled with NULL.\n\nSQL also filters at two different moments. **WHERE** removes individual rows before they are grouped. **HAVING** removes whole groups after `GROUP BY` has calculated totals or averages.\n\nFinally, when training a model, split the data into training and test sets **before** any step that learns from the data, such as scaling. Otherwise information from the test set leaks into training and the score looks better than it really is.',
    },
    {
      id: 'da-u2-l1-s4',
      kind: 'checkpoint',
      title: 'Calculate Recall',
      question: {
        type: 'fill',
        prompt: 'A screening test correctly detects 30 cases and misses 10. What is its recall, as a percentage?',
        correct: '75',
        alternatives: ['75%', '75 %', '75 percent'],
        explanation: '30 ÷ (30 + 10) = 0.75, or 75%.',
        points: 15,
      },
    },
    {
      id: 'da-u2-l1-s5',
      kind: 'checkpoint',
      title: 'Pick the Join',
      question: {
        type: 'mcq',
        prompt: 'You want a list of every customer, including those who have never placed an order. Customers is the left table. Which join do you use?',
        options: [
          'LEFT JOIN',
          'INNER JOIN',
          'No join; use HAVING',
          'No join; use WHERE',
        ],
        correct: 0,
        explanation: 'A LEFT JOIN keeps all customers and shows NULL for the order columns of those without orders. An INNER JOIN would drop them.',
        points: 10,
      },
    },
    {
      id: 'da-u2-l1-s6',
      kind: 'synthesis',
      title: 'Measuring and Merging',
      takeaways: [
        'Precision = TP ÷ (TP + FP); recall = TP ÷ (TP + FN).',
        'LEFT JOIN keeps all left-table rows; INNER JOIN keeps only matches.',
        'WHERE filters rows before grouping; HAVING filters groups after.',
      ],
      nextQuizIndex: 1,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'da-u2-l1-fc1',
      front: 'What is precision?',
      back: 'TP ÷ (TP + FP): the share of flagged items that were truly positive.',
      explanation: 'Low precision means many false alarms.',
      interleave: true,
    },
    {
      id: 'da-u2-l1-fc2',
      front: 'What is recall?',
      back: 'TP ÷ (TP + FN): the share of real positives that the model found.',
      explanation: 'Low recall means many misses.',
      interleave: true,
    },
    {
      id: 'da-u2-l1-fc3',
      front: 'What is the difference between WHERE and HAVING in SQL?',
      back: 'WHERE filters rows before grouping; HAVING filters groups after aggregation.',
      explanation: 'Use HAVING for conditions on totals or averages.',
      interleave: true,
    },
  ],
}

const DA_GENERALISE: PackLesson = {
  id: 'da-u3-l1',
  unitId: 'da-u3-generalisation',
  title: 'Overfitting, Regularisation & A/B Tests',
  summary: 'Tell a model that has learned a pattern from one that has memorised its data, and run an experiment you can trust.',
  estimatedMinutes: 10,
  standards: [],
  prerequisiteLessonIds: ['da-u2-l1'],
  steps: [
    {
      id: 'da-u3-l1-s1',
      kind: 'narrative',
      title: 'Memorising Is Not Learning',
      bodyMarkdown:
        'A model is useful only if it works on data it has never seen. That is why data is split: the model learns from a **training set** and is judged on a separate **validation set**.\n\n- **Overfitting:** the model is too flexible and memorises noise in the training data. Training score is excellent; validation score is much worse.\n- **Underfitting:** the model is too simple to capture the pattern. Both scores are poor.\n\nThis is the **bias–variance trade-off**. A simple model has high bias: it misses the pattern in the same way every time. A very flexible model has high variance: its answers swing with whichever data it happened to see.',
      callout: {
        tone: 'key-idea',
        text: 'A large gap between training and validation scores is the sign of overfitting.',
      },
    },
    {
      id: 'da-u3-l1-s2',
      kind: 'checkpoint',
      title: 'Diagnose the Model',
      question: {
        type: 'mcq',
        prompt: 'A model scores 62% on its training data and 60% on validation data. What is the most likely problem?',
        options: [
          'Overfitting: it has memorised the training data',
          'Data leakage from the validation set',
          'Nothing; the model is ready to use',
          'Underfitting: it is too simple to capture the pattern',
        ],
        correct: 3,
        explanation: 'Both scores are low and close together. The model has not learned the pattern even on the data it trained on.',
        points: 10,
      },
    },
    {
      id: 'da-u3-l1-s3',
      kind: 'narrative',
      title: 'Keeping a Model Simple',
      bodyMarkdown:
        '**Regularisation** fights overfitting by adding a penalty for large coefficients, so the model prefers simpler explanations.\n\n- **L2 (Ridge)** penalises the squares of the coefficients. It shrinks them all towards zero but rarely makes any exactly zero.\n- **L1 (Lasso)** penalises their absolute values. It pushes the least useful coefficients all the way to zero, which removes those features from the model.\n\nModels often represent items as lists of numbers called **vectors**. The **dot product** multiplies matching entries and adds the results: (a, b) · (c, d) = ac + bd. A larger dot product means the two vectors point in more similar directions.',
    },
    {
      id: 'da-u3-l1-s4',
      kind: 'checkpoint',
      title: 'Dot Product',
      question: {
        type: 'fill',
        prompt: 'What is the dot product of the vectors (2, 3) and (4, 1)?',
        correct: '11',
        alternatives: ['eleven'],
        explanation: '2 × 4 + 3 × 1 = 8 + 3 = 11.',
        points: 15,
      },
    },
    {
      id: 'da-u3-l1-s5',
      kind: 'narrative',
      title: 'Experiments You Can Trust',
      bodyMarkdown:
        'An **A/B test** shows version A to one random group and version B to another, then compares a result such as sign-up rate.\n\nThe **p-value** is the probability of seeing a difference at least this large if the two versions were really the same. By convention, a result with p below 0.05 is called statistically significant.\n\nThat 5% error rate holds only if you decide the sample size in advance and look once. If you check every day and stop the first time p dips below 0.05, random swings give you many chances to be fooled, and the real false-positive rate climbs well above 5%. This mistake is called **peeking**.',
    },
    {
      id: 'da-u3-l1-s6',
      kind: 'checkpoint',
      title: 'Lasso or Ridge?',
      question: {
        type: 'mcq',
        prompt: 'You have 200 input features and suspect most are useless. Which method can remove features by setting their coefficients exactly to zero?',
        options: [
          'L2 (Ridge) regularisation',
          'L1 (Lasso) regularisation',
          'Adding more features',
          'Training for longer',
        ],
        correct: 1,
        explanation: 'The L1 penalty drives weak coefficients to exactly zero. L2 only shrinks them.',
        points: 10,
      },
    },
    {
      id: 'da-u3-l1-s7',
      kind: 'synthesis',
      title: 'Models That Generalise',
      takeaways: [
        'High training score with a low validation score means overfitting.',
        'Regularisation penalises large coefficients; L1 can set them to zero.',
        'Fix the sample size of an A/B test in advance; stopping early on a good p-value inflates false positives.',
      ],
      nextQuizIndex: 2,
      flashcardEnroll: { autoEnroll: true, interleave: true },
    },
  ],
  flashcardSeeds: [
    {
      id: 'da-u3-l1-fc1',
      front: 'How do you recognise overfitting?',
      back: 'The model scores far better on training data than on validation data.',
      explanation: 'It has memorised noise instead of the pattern.',
      interleave: true,
    },
    {
      id: 'da-u3-l1-fc2',
      front: 'What does L1 (Lasso) do that L2 (Ridge) does not?',
      back: 'It sets some coefficients exactly to zero, removing those features.',
      explanation: 'L2 shrinks coefficients but keeps them non-zero.',
      interleave: true,
    },
    {
      id: 'da-u3-l1-fc3',
      front: 'Why is peeking at an A/B test a problem?',
      back: 'Stopping as soon as p < 0.05 gives chance many tries, so false positives exceed 5%.',
      explanation: 'Decide the sample size before the test starts.',
      interleave: true,
    },
  ],
}

const DA_UNITS: TrackUnit[] = [
  {
    id: 'da-u1-exploring-data',
    title: 'Exploring Data',
    anchoringPhenomenon: 'Ice-cream sales and sunburn cases rise and fall together, yet neither causes the other.',
    capstoneQuizIndex: 0,
    masteryGate: GATE,
    lessons: [DA_TRENDS],
  },
  {
    id: 'da-u2-classification-joins',
    title: 'Classification & Joins',
    anchoringPhenomenon: 'A fraud detector that never flags anything is right 99% of the time.',
    capstoneQuizIndex: 1,
    masteryGate: GATE,
    lessons: [DA_CLASSIFY],
  },
  {
    id: 'da-u3-generalisation',
    title: 'Generalisation & Experiments',
    anchoringPhenomenon: 'A student who memorises last year’s exam answers can score 100% on that paper and fail the new one.',
    capstoneQuizIndex: 2,
    masteryGate: GATE,
    lessons: [DA_GENERALISE],
  },
]

export const DATA_ANALYTICS_UNITS = DA_UNITS

export const DATA_ANALYTICS_TRACK: CurriculumTrack = {
  id: 'track-data-analytics',
  slug: 'data-analytics',
  packId: 'data-analytics',
  title: 'Data Analytics: Regression, SQL & Modeling',
  category: 'CS',
  subject: 'Data Science',
  gradeBand: 'College-Intro',
  license: 'MIT',
  sourceAttribution: ATTRIBUTION,
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: DA_UNITS,
}
