import type {
  MarketQuote,
  MarketFundamentals,
  RiskCategory,
  InvestmentAnalysis,
  InvestmentFactorScores,
  RiskLevelLabel,
  GrowthLevelLabel,
  ValuationLevelLabel,
  QualityLevelLabel,
} from '../types/market';

/**
 * Weights per risk profile as specified in product rules
 */
export const RISK_WEIGHTS: Record<RiskCategory, {
  risk: number;
  quality: number;
  valuation: number;
  growth: number;
  momentum: number;
}> = {
  Conservative: {
    risk: 0.40,
    quality: 0.25,
    valuation: 0.20,
    growth: 0.10,
    momentum: 0.05,
  },
  Moderate: {
    risk: 0.25,
    quality: 0.25,
    growth: 0.20,
    valuation: 0.15,
    momentum: 0.15,
  },
  Growth: {
    growth: 0.30,
    momentum: 0.25,
    quality: 0.20,
    risk: 0.15,
    valuation: 0.10,
  },
  Aggressive: {
    growth: 0.35,
    momentum: 0.30,
    risk: 0.15,
    quality: 0.10,
    valuation: 0.10,
  },
};

/**
 * Calculate Risk Score (0 - 100).
 * High score = low risk / low volatility / defensive resilience (best for conservative).
 */
function calculateRiskFactorScore(quote: MarketQuote, fundamentals?: MarketFundamentals | null): number {
  const beta = fundamentals?.beta ?? quote.beta ?? 1.0;
  const high52 = quote.fiftyTwoWeekHigh;
  const low52 = quote.fiftyTwoWeekLow;
  const price = quote.price ?? 100;

  // Beta component (Beta ~0.6-0.9 is ideal for safety, Beta > 1.8 is aggressive)
  let betaScore = 70;
  if (beta <= 0.6) betaScore = 95;
  else if (beta <= 0.9) betaScore = 90;
  else if (beta <= 1.1) betaScore = 75;
  else if (beta <= 1.3) betaScore = 60;
  else if (beta <= 1.6) betaScore = 45;
  else betaScore = 30;

  // 52-week drawdown from high
  let drawdownScore = 70;
  if (high52 && high52 > 0) {
    const drawdown = (high52 - price) / high52;
    if (drawdown < 0.08) drawdownScore = 88;
    else if (drawdown < 0.15) drawdownScore = 78;
    else if (drawdown < 0.25) drawdownScore = 65;
    else if (drawdown < 0.40) drawdownScore = 50;
    else drawdownScore = 35;
  }

  // 52-week spread volatility: (High - Low) / Price
  let spreadScore = 70;
  if (high52 && low52 && price > 0) {
    const spread = (high52 - low52) / price;
    if (spread < 0.25) spreadScore = 90;
    else if (spread < 0.45) spreadScore = 75;
    else if (spread < 0.70) spreadScore = 60;
    else spreadScore = 40;
  }

  // ETF diversification bonus
  const etfBonus = quote.type === 'etf' ? 12 : 0;

  const rawScore = betaScore * 0.45 + drawdownScore * 0.30 + spreadScore * 0.25 + etfBonus;
  return Math.max(15, Math.min(98, Math.round(rawScore)));
}

/**
 * Calculate Growth Factor Score (0 - 100).
 * High score = strong revenue, earnings growth, long-term expansion.
 */
function calculateGrowthFactorScore(quote: MarketQuote, fundamentals?: MarketFundamentals | null): number {
  const revGrowth = fundamentals?.revenueGrowth; // e.g. 0.15
  const fiftyTwoWeekChange = fundamentals?.fiftyTwoWeekChange ?? (quote.changePercent ? quote.changePercent / 100 : 0.15);

  let revScore = 65;
  if (revGrowth !== null && revGrowth !== undefined) {
    if (revGrowth > 0.40) revScore = 98;
    else if (revGrowth > 0.20) revScore = 90;
    else if (revGrowth > 0.12) revScore = 80;
    else if (revGrowth > 0.05) revScore = 68;
    else if (revGrowth > 0) revScore = 55;
    else revScore = 40;
  }

  let trendScore = 65;
  if (fiftyTwoWeekChange > 0.50) trendScore = 95;
  else if (fiftyTwoWeekChange > 0.25) trendScore = 85;
  else if (fiftyTwoWeekChange > 0.10) trendScore = 72;
  else if (fiftyTwoWeekChange > 0) trendScore = 60;
  else trendScore = 42;

  const rawScore = revScore * 0.60 + trendScore * 0.40;
  return Math.max(20, Math.min(98, Math.round(rawScore)));
}

/**
 * Calculate Valuation Factor Score (0 - 100).
 * High score = attractive, not overextended / reasonable multiple.
 */
function calculateValuationFactorScore(quote: MarketQuote, fundamentals?: MarketFundamentals | null): number {
  const pe = fundamentals?.trailingPE ?? quote.peRatio ?? fundamentals?.forwardPE;
  const pb = fundamentals?.priceToBook;

  let peScore = 65;
  if (pe !== null && pe !== undefined) {
    if (pe < 0) peScore = 30; // unprofitable
    else if (pe <= 15) peScore = 95;
    else if (pe <= 22) peScore = 85;
    else if (pe <= 30) peScore = 70;
    else if (pe <= 45) peScore = 55;
    else if (pe <= 65) peScore = 42;
    else peScore = 30;
  }

  let pbScore = 65;
  if (pb !== null && pb !== undefined) {
    if (pb <= 3) pbScore = 90;
    else if (pb <= 7) pbScore = 75;
    else if (pb <= 15) pbScore = 60;
    else pbScore = 45;
  }

  const rawScore = peScore * 0.70 + pbScore * 0.30;
  return Math.max(15, Math.min(96, Math.round(rawScore)));
}

/**
 * Calculate Quality Factor Score (0 - 100).
 * High score = high profit margin, ROE, strong balance sheet.
 */
function calculateQualityFactorScore(quote: MarketQuote, fundamentals?: MarketFundamentals | null): number {
  const margin = fundamentals?.profitMargin;
  const roe = fundamentals?.returnOnEquity;
  const debt = fundamentals?.debtToEquity;

  let marginScore = 70;
  if (margin !== null && margin !== undefined) {
    if (margin > 0.30) marginScore = 96;
    else if (margin > 0.20) marginScore = 88;
    else if (margin > 0.10) marginScore = 76;
    else if (margin > 0.05) marginScore = 64;
    else marginScore = 45;
  }

  let roeScore = 70;
  if (roe !== null && roe !== undefined) {
    if (roe > 0.30) roeScore = 95;
    else if (roe > 0.18) roeScore = 85;
    else if (roe > 0.10) roeScore = 70;
    else roeScore = 50;
  }

  let debtScore = 70;
  if (debt !== null && debt !== undefined) {
    if (debt < 0.3) debtScore = 92;
    else if (debt < 0.8) debtScore = 80;
    else if (debt < 1.5) debtScore = 65;
    else debtScore = 45;
  }

  // Broad ETFs have inherent institutional quality
  if (quote.type === 'etf') {
    marginScore = 85;
    roeScore = 82;
    debtScore = 88;
  }

  const rawScore = marginScore * 0.45 + roeScore * 0.35 + debtScore * 0.20;
  return Math.max(25, Math.min(98, Math.round(rawScore)));
}

/**
 * Calculate Momentum Factor Score (0 - 100).
 * High score = recent bullish strength across timeframes.
 */
function calculateMomentumFactorScore(quote: MarketQuote, fundamentals?: MarketFundamentals | null): number {
  const changePercent = quote.changePercent ?? 0;
  const fiftyTwoWeekChange = fundamentals?.fiftyTwoWeekChange ?? 0.15;

  let dailyMom = 65;
  if (changePercent > 3.0) dailyMom = 90;
  else if (changePercent > 1.0) dailyMom = 80;
  else if (changePercent > 0) dailyMom = 70;
  else if (changePercent > -1.5) dailyMom = 55;
  else dailyMom = 40;

  let yearlyMom = 65;
  if (fiftyTwoWeekChange > 0.50) yearlyMom = 95;
  else if (fiftyTwoWeekChange > 0.25) yearlyMom = 84;
  else if (fiftyTwoWeekChange > 0.10) yearlyMom = 72;
  else if (fiftyTwoWeekChange > 0) yearlyMom = 60;
  else yearlyMom = 40;

  const rawScore = dailyMom * 0.35 + yearlyMom * 0.65;
  return Math.max(20, Math.min(98, Math.round(rawScore)));
}

/**
 * Derive clean human labels from factor scores
 */
export function deriveLabels(factors: InvestmentFactorScores, quote: MarketQuote): {
  risk: RiskLevelLabel;
  growth: GrowthLevelLabel;
  valuation: ValuationLevelLabel;
  quality: QualityLevelLabel;
} {
  const beta = quote.beta ?? 1.0;
  let riskLabel: RiskLevelLabel = 'Medium';
  if (beta < 0.85 || (quote.type === 'etf' && beta <= 1.0)) riskLabel = 'Low';
  else if (beta <= 1.25) riskLabel = 'Medium';
  else if (beta <= 1.8) riskLabel = 'High';
  else riskLabel = 'Very High';

  let growthLabel: GrowthLevelLabel = 'Moderate';
  if (factors.growthScore >= 85) growthLabel = 'Very High';
  else if (factors.growthScore >= 72) growthLabel = 'High';
  else if (factors.growthScore >= 55) growthLabel = 'Moderate';
  else growthLabel = 'Low';

  let valuationLabel: ValuationLevelLabel = 'Fair';
  if (factors.valuationScore >= 80) valuationLabel = 'Undervalued';
  else if (factors.valuationScore >= 60) valuationLabel = 'Fair';
  else if (factors.valuationScore >= 45) valuationLabel = 'High';
  else valuationLabel = 'Stretched';

  let qualityLabel: QualityLevelLabel = 'Strong';
  if (factors.qualityScore >= 85) qualityLabel = 'Excellent';
  else if (factors.qualityScore >= 72) qualityLabel = 'Strong';
  else if (factors.qualityScore >= 55) qualityLabel = 'Good';
  else qualityLabel = 'Moderate';

  return {
    risk: riskLabel,
    growth: growthLabel,
    valuation: valuationLabel,
    quality: qualityLabel,
  };
}

/**
 * Generate dynamic "Why this fits you", "Potential concern", and one-sentence synopsis
 */
export function generateExplanations(
  quote: MarketQuote,
  fundamentals: MarketFundamentals | null | undefined,
  factors: InvestmentFactorScores,
  labels: { risk: RiskLevelLabel; growth: GrowthLevelLabel; valuation: ValuationLevelLabel; quality: QualityLevelLabel },
  riskProfile: RiskCategory
): {
  oneSentenceSummary: string;
  whyFitsYou: string[];
  potentialConcern: string;
  fitExplanation: string;
} {
  const why: string[] = [];
  const beta = fundamentals?.beta ?? quote.beta ?? 1.0;
  const pe = fundamentals?.trailingPE ?? quote.peRatio;
  const margin = fundamentals?.profitMargin;
  const revGrowth = fundamentals?.revenueGrowth;

  if (quote.type === 'etf') {
    why.push('Broad market diversification across top-tier holdings');
  } else if (labels.quality === 'Excellent' || labels.quality === 'Strong') {
    why.push('Strong profitability and resilient balance sheet');
  }

  if (revGrowth && revGrowth > 0.12) {
    why.push(`Robust revenue growth (${Math.round(revGrowth * 100)}% YoY)`);
  } else if (labels.growth === 'High' || labels.growth === 'Very High') {
    why.push('Consistent revenue and business expansion');
  }

  if (beta <= 1.05) {
    why.push('Controlled market volatility compared to broad equities');
  } else {
    why.push('Strong long-term upward momentum and innovation moat');
  }

  if (quote.dividendYield && quote.dividendYield > 0.005) {
    why.push(`Steady capital distributions (${(quote.dividendYield * 100).toFixed(2)}% dividend yield)`);
  } else if (factors.momentumScore >= 75) {
    why.push('Strong institutional price trend over the past 12 months');
  } else {
    why.push('Established leadership position in its core market');
  }

  while (why.length < 3) {
    why.push('Proven operating history and liquid trading volume');
  }
  const cleanWhy = why.slice(0, 4);

  let potentialConcern = 'Market-wide macroeconomic sensitivity during rate changes.';
  if (pe && pe > 40) {
    potentialConcern = `High valuation (${pe.toFixed(1)}x P/E) compared to historical market averages.`;
  } else if (beta > 1.5) {
    potentialConcern = `Above-average price volatility (Beta ${beta.toFixed(2)}) during market drawdowns.`;
  } else if (quote.type === 'etf') {
    potentialConcern = 'Broad market index tracking means performance mirrors overall macroeconomic cycles.';
  } else if (margin && margin < 0.10) {
    potentialConcern = 'Moderate operating margins could experience pressure if costs escalate.';
  }

  let fitExplanation = '';
  switch (riskProfile) {
    case 'Conservative':
      fitExplanation = quote.type === 'etf' || beta <= 1.0
        ? `Ideal for your Conservative profile: prioritizes capital preservation with muted volatility and defensive fundamentals.`
        : `Fits your Conservative profile when held as a smaller allocation due to its established market leadership.`;
      break;
    case 'Moderate':
      fitExplanation = `Provides an attractive balance of steady business quality and upside participation suited for your Moderate risk profile.`;
      break;
    case 'Growth':
      fitExplanation = `Aligned with your Growth profile: capitalizes on healthy revenue expansion with reasonable tolerance for market swings.`;
      break;
    case 'Aggressive':
      fitExplanation = `Strong match for your Aggressive profile: delivers elevated upside potential and strong compounding momentum.`;
      break;
  }

  const oneSentenceSummary = `${labels.quality} business quality with ${labels.growth.toLowerCase()} expansion trajectory and ${labels.valuation.toLowerCase()} valuation profile.`;

  return {
    oneSentenceSummary,
    whyFitsYou: cleanWhy,
    potentialConcern,
    fitExplanation,
  };
}

/**
 * Full analysis pipeline for an asset based on user's risk profile
 */
export function analyzeAsset(
  quote: MarketQuote,
  fundamentals: MarketFundamentals | null | undefined,
  riskProfile: RiskCategory
): InvestmentAnalysis {
  const factors: InvestmentFactorScores = {
    riskScore: calculateRiskFactorScore(quote, fundamentals),
    growthScore: calculateGrowthFactorScore(quote, fundamentals),
    valuationScore: calculateValuationFactorScore(quote, fundamentals),
    qualityScore: calculateQualityFactorScore(quote, fundamentals),
    momentumScore: calculateMomentumFactorScore(quote, fundamentals),
  };

  const weights = RISK_WEIGHTS[riskProfile];

  let overallScoreRaw = 0;
  if (riskProfile === 'Conservative') {
    overallScoreRaw =
      factors.riskScore * weights.risk +
      factors.qualityScore * weights.quality +
      factors.valuationScore * weights.valuation +
      factors.growthScore * weights.growth +
      factors.momentumScore * weights.momentum;
  } else if (riskProfile === 'Moderate') {
    overallScoreRaw =
      factors.riskScore * weights.risk +
      factors.qualityScore * weights.quality +
      factors.growthScore * weights.growth +
      factors.valuationScore * weights.valuation +
      factors.momentumScore * weights.momentum;
  } else if (riskProfile === 'Growth') {
    overallScoreRaw =
      factors.growthScore * weights.growth +
      factors.momentumScore * weights.momentum +
      factors.qualityScore * weights.quality +
      (100 - Math.abs(factors.riskScore - 60)) * weights.risk +
      factors.valuationScore * weights.valuation;
  } else {
    overallScoreRaw =
      factors.growthScore * weights.growth +
      factors.momentumScore * weights.momentum +
      factors.qualityScore * weights.quality +
      (100 - Math.abs(factors.riskScore - 45)) * weights.risk +
      factors.valuationScore * weights.valuation;
  }

  const overallScore = Math.max(30, Math.min(96, Math.round(overallScoreRaw)));
  const labels = deriveLabels(factors, quote);
  const explanations = generateExplanations(quote, fundamentals, factors, labels, riskProfile);

  const peFormatted = fundamentals?.trailingPE ?? quote.peRatio ? `${(fundamentals?.trailingPE ?? quote.peRatio)!.toFixed(1)}x` : 'Data unavailable';
  const marginFormatted = fundamentals?.profitMargin !== null && fundamentals?.profitMargin !== undefined
    ? `${(fundamentals.profitMargin * 100).toFixed(1)}%`
    : 'Data unavailable';
  const betaFormatted = (fundamentals?.beta ?? quote.beta) !== null && (fundamentals?.beta ?? quote.beta) !== undefined
    ? (fundamentals?.beta ?? quote.beta)!.toFixed(2)
    : '1.00';
  const oneYearRet = fundamentals?.fiftyTwoWeekChange !== null && fundamentals?.fiftyTwoWeekChange !== undefined
    ? `${fundamentals.fiftyTwoWeekChange >= 0 ? '+' : ''}${(fundamentals.fiftyTwoWeekChange * 100).toFixed(1)}%`
    : quote.changePercent !== null ? `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(1)}%` : 'Data unavailable';

  const mcap = quote.marketCap;
  let mcapFormatted = 'Data unavailable';
  if (mcap) {
    if (mcap >= 1e12) mcapFormatted = `$${(mcap / 1e12).toFixed(2)}T`;
    else if (mcap >= 1e9) mcapFormatted = `$${(mcap / 1e9).toFixed(1)}B`;
    else if (mcap >= 1e6) mcapFormatted = `$${(mcap / 1e6).toFixed(1)}M`;
  }

  const yieldFormatted = quote.dividendYield !== null && quote.dividendYield !== undefined && quote.dividendYield > 0
    ? `${(quote.dividendYield * 100).toFixed(2)}%`
    : '0.00%';

  return {
    quote,
    overallScore,
    riskProfileMatch: riskProfile,
    factors,
    labels,
    oneSentenceSummary: explanations.oneSentenceSummary,
    whyFitsYou: explanations.whyFitsYou,
    potentialConcern: explanations.potentialConcern,
    fitExplanation: explanations.fitExplanation,
    metrics: {
      pe: peFormatted,
      oneYearReturn: oneYearRet,
      profitMargin: marginFormatted,
      beta: betaFormatted,
      marketCap: mcapFormatted,
      dividendYield: yieldFormatted,
    },
  };
}
