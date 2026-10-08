import type { RiskAnswers, RiskCategory, RiskProfileResult } from '../types/market';
import { RISK_WEIGHTS } from './scoringEngine';

export interface QuestionOption {
  value: string;
  label: string;
  points: number;
  description?: string;
}

export interface Question {
  id: keyof RiskAnswers;
  number: number;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

export const RISK_QUESTIONS: Question[] = [
  {
    id: 'timeframe',
    number: 1,
    title: 'What is your investment timeframe?',
    subtitle: 'How long do you plan to keep your money invested?',
    options: [
      { value: '<1yr', label: '< 1 year', points: 1, description: 'Short horizon with liquidity priority' },
      { value: '1-3yr', label: '1–3 years', points: 2, description: 'Near-term goal with controlled fluctuations' },
      { value: '3-5yr', label: '3–5 years', points: 3, description: 'Medium horizon allowing market recovery' },
      { value: '5+yr', label: '5+ years', points: 4, description: 'Long-term horizon to harness compounding' },
    ],
  },
  {
    id: 'dropReaction',
    number: 2,
    title: 'How would you react if your portfolio dropped 20%?',
    subtitle: 'Market corrections are normal—how does your emotional compass react?',
    options: [
      { value: 'sell', label: 'Sell immediately', points: 1, description: 'Prevent any further paper loss' },
      { value: 'uncomfortable', label: 'Feel uncomfortable but hold', points: 2, description: 'Worry, but stay in the market' },
      { value: 'hold', label: 'Hold and wait', points: 3, description: 'Understand markets cycle and wait it out' },
      { value: 'buy_more', label: 'Buy more', points: 4, description: 'View discount as a buying opportunity' },
    ],
  },
  {
    id: 'objective',
    number: 3,
    title: 'What is your main investment objective?',
    subtitle: 'What is the primary target for this capital?',
    options: [
      { value: 'preserve', label: 'Preserve capital', points: 1, description: 'Protect initial principal at all costs' },
      { value: 'balanced', label: 'Balanced growth', points: 2, description: 'Generate modest income and steady growth' },
      { value: 'long_term', label: 'Long-term growth', points: 3, description: 'Outpace inflation with equity accumulation' },
      { value: 'aggressive', label: 'Aggressive growth', points: 4, description: 'Maximize compounding through high-momentum leaders' },
    ],
  },
  {
    id: 'volatility',
    number: 4,
    title: 'How much volatility can you tolerate?',
    subtitle: 'Price swings can be sharp in growth assets.',
    options: [
      { value: 'low', label: 'Low', points: 1, description: 'Minimal fluctuations, stable trajectory' },
      { value: 'medium', label: 'Medium', points: 2.5, description: 'Moderate ups and downs in normal cycles' },
      { value: 'high', label: 'High', points: 4, description: 'Comfortable with large double-digit swings' },
    ],
  },
  {
    id: 'preference',
    number: 5,
    title: 'What do you prefer?',
    subtitle: 'Which allocation feels most natural to you?',
    options: [
      { value: 'stable', label: 'Mostly stable investments', points: 1, description: 'Index leaders and defensive dividend payers' },
      { value: 'balanced', label: 'Balanced mix', points: 2, description: 'Core index ETFs paired with quality equities' },
      { value: 'growth', label: 'Growth-focused investments', points: 3, description: 'Innovative tech and enterprise software leaders' },
      { value: 'high_growth', label: 'High-growth opportunities', points: 4, description: 'Disruptive AI, semiconductors and high-beta leaders' },
    ],
  },
];

export const DEFAULT_ANSWERS: RiskAnswers = {
  timeframe: '5+yr',
  dropReaction: 'hold',
  objective: 'long_term',
  volatility: 'medium',
  preference: 'growth',
};

export function calculateRiskProfile(answers: RiskAnswers): RiskProfileResult {
  let totalPoints = 0;

  for (const q of RISK_QUESTIONS) {
    const chosenVal = answers[q.id];
    const option = q.options.find(o => o.value === chosenVal) || q.options[0];
    totalPoints += option.points;
  }

  // Min points: 1 + 1 + 1 + 1 + 1 = 5
  // Max points: 4 + 4 + 4 + 4 + 4 = 20
  const normalizedScore = Math.max(1, Math.min(100, Math.round(((totalPoints - 5) / (20 - 5)) * 99) + 1));

  let category: RiskCategory = 'Growth';
  let title = 'Growth Investor';
  let description = "You're comfortable accepting moderate volatility in exchange for higher long-term growth potential.";

  if (normalizedScore <= 25) {
    category = 'Conservative';
    title = 'Conservative Investor';
    description = 'You prioritize capital preservation and peace of mind over high upside, favoring defensive stability.';
  } else if (normalizedScore <= 50) {
    category = 'Moderate';
    title = 'Moderate Investor';
    description = 'You seek steady growth while maintaining protection against sharp drops with a balanced mix of quality assets.';
  } else if (normalizedScore <= 75) {
    category = 'Growth';
    title = 'Growth Investor';
    description = "You're comfortable accepting moderate volatility in exchange for higher long-term growth potential.";
  } else {
    category = 'Aggressive';
    title = 'Aggressive Investor';
    description = 'You prioritize maximum capital expansion and are prepared for significant market swings in pursuit of higher upside.';
  }

  return {
    score: normalizedScore,
    category,
    title,
    description,
    weights: {
      risk: RISK_WEIGHTS[category].risk,
      quality: RISK_WEIGHTS[category].quality,
      valuation: RISK_WEIGHTS[category].valuation,
      growth: RISK_WEIGHTS[category].growth,
      momentum: RISK_WEIGHTS[category].momentum,
    },
  };
}
