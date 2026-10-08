// @ts-nocheck
import { analyzeAsset } from '../server/scoringEngine.js';
import { BENCHMARK_ASSETS, generateLocalMarketAnalysis } from '../src/utils/marketEngine.js';

export default async function handler(req, res) {
  try {
    const rawProfile = (req.query?.riskProfile) || 'Growth';
    const validProfiles = ['Conservative', 'Moderate', 'Growth', 'Aggressive'];
    const riskProfile = validProfiles.find(
      p => p.toLowerCase() === String(rawProfile).toLowerCase()
    ) || 'Growth';

    const result = generateLocalMarketAnalysis(riskProfile);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result);
  } catch (err) {
    const fallback = generateLocalMarketAnalysis('Growth');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(fallback);
  }
}
