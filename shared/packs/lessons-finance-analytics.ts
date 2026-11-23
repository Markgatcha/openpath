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
          'Reject it, because it returns less than the cost of capital',
          'Accept it, because the IRR is positive',
          'Accept it, because 7% is close to 9%',
          'Borrow more to raise the IRR',
        ],
        correct: 0,
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
