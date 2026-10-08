import React, { useState } from 'react';
import {
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  X,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  RISK_QUESTIONS,
  calculateRiskProfile,
} from '../utils/riskProfiler';
import type { RiskAnswers, RiskProfileResult } from '../types/market';

interface RiskProfilerProps {
  initialAnswers: RiskAnswers;
  onComplete: (answers: RiskAnswers, result: RiskProfileResult) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const RiskProfiler: React.FC<RiskProfilerProps> = ({
  initialAnswers,
  onComplete,
  onClose,
  isModal = false,
}) => {
  const [answers, setAnswers] = useState<RiskAnswers>(initialAnswers);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const currentQuestion = RISK_QUESTIONS[currentStep];
  const totalQuestions = RISK_QUESTIONS.length;
  const result = calculateRiskProfile(answers);

  const handleSelectOption = (value: string) => {
    const updated = { ...answers, [currentQuestion.id]: value };
    setAnswers(updated);

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCalculated(true);
    }
  };

  const handleRetake = () => {
    setIsCalculated(false);
    setCurrentStep(0);
  };

  const handleConfirmAndAnalyse = () => {
    onComplete(answers, result);
    if (onClose) onClose();
  };

  const profileColor = {
    Conservative: 'text-blue-600 border-blue-200 bg-blue-50/50',
    Moderate: 'text-teal-600 border-teal-200 bg-teal-50/50',
    Growth: 'text-neutral-900 border-neutral-300 bg-neutral-100/70',
    Aggressive: 'text-purple-600 border-purple-200 bg-purple-50/50',
  }[result.category];

  return (
    <div className={`relative ${isModal ? 'max-w-xl w-full mx-auto p-6 sm:p-8 bg-white rounded-2xl border border-neutral-200 shadow-xl' : 'max-w-2xl mx-auto py-12 px-4 sm:px-6'}`}>
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {!isCalculated ? (
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
              <span>Step 1 · Risk Profile</span>
              <span className="font-mono tabular-nums">Question {currentStep + 1} of {totalQuestions}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden mb-6">
              <div
                className="bg-neutral-900 h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mb-2">
              {currentQuestion.title}
            </h2>
            {currentQuestion.subtitle && (
              <p className="text-sm text-neutral-500">
                {currentQuestion.subtitle}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                >
                  <div>
                    <div className="text-base font-medium text-neutral-900">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentStep === 0
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              Previous
            </button>

            {currentStep < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setIsCalculated(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>Calculate Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Result Screen */
        <div className="text-center py-2">
          <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-2">
            Your risk profile
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
            {result.title}
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto leading-relaxed mb-6">
            "{result.description}"
          </p>

          {/* Visual Spectrum Gauge */}
          <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 mb-8 max-w-md mx-auto text-left">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2 font-medium">
              <span>Risk Score</span>
              <span className="font-mono tabular-nums font-bold text-neutral-900">{result.score} / 100</span>
            </div>

            {/* Segmented bar */}
            <div className="grid grid-cols-4 gap-1.5 h-2.5 rounded-full overflow-hidden bg-neutral-200 mb-4 p-0.5">
              <div
                className={`rounded-sm transition-all ${
                  result.category === 'Conservative' ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              />
              <div
                className={`rounded-sm transition-all ${
                  result.category === 'Moderate' ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              />
              <div
                className={`rounded-sm transition-all ${
                  result.category === 'Growth' ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              />
              <div
                className={`rounded-sm transition-all ${
                  result.category === 'Aggressive' ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              />
            </div>

            <div className="grid grid-cols-4 text-[11px] text-neutral-400 text-center font-medium">
              <span className={result.category === 'Conservative' ? 'text-neutral-950 font-bold' : ''}>Conservative</span>
              <span className={result.category === 'Moderate' ? 'text-neutral-950 font-bold' : ''}>Moderate</span>
              <span className={result.category === 'Growth' ? 'text-neutral-950 font-bold' : ''}>Growth</span>
              <span className={result.category === 'Aggressive' ? 'text-neutral-950 font-bold' : ''}>Aggressive</span>
            </div>

            {/* Analysis Weighting Preview */}
            <div className="mt-5 pt-4 border-t border-neutral-200">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-2">
                Engine Weightings For Your Profile
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-neutral-200">
                  <div className="text-neutral-400 text-[10px]">Growth</div>
                  <div className="font-mono font-bold text-neutral-900">{(result.weights.growth * 100)}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-neutral-200">
                  <div className="text-neutral-400 text-[10px]">Momentum</div>
                  <div className="font-mono font-bold text-neutral-900">{(result.weights.momentum * 100)}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-neutral-200">
                  <div className="text-neutral-400 text-[10px]">Quality</div>
                  <div className="font-mono font-bold text-neutral-900">{(result.weights.quality * 100)}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-neutral-200">
                  <div className="text-neutral-400 text-[10px]">Risk</div>
                  <div className="font-mono font-bold text-neutral-900">{(result.weights.risk * 100)}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-neutral-200 col-span-3 sm:col-span-1">
                  <div className="text-neutral-400 text-[10px]">Valuation</div>
                  <div className="font-mono font-bold text-neutral-900">{(result.weights.valuation * 100)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA and Retake actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleConfirmAndAnalyse}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 shadow-sm transition-all cursor-pointer"
            >
              <span>Analyse Market</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleRetake}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 font-medium text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Change answers</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
