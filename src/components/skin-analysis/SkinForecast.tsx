'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SkinForecast, ConditionProjection } from '@/lib/skin-analysis/forecast'

interface SkinForecastProps {
  forecast: SkinForecast
  skinType: string | null
}

export default function SkinForecastView({ forecast, skinType }: SkinForecastProps) {
  const [activeTab, setActiveTab] = useState<'projections' | 'warnings' | 'recommendations'>('projections')

  const skinAgeImprovement = forecast.currentSkinAge - forecast.projectedSkinAge90
  const qualityImprovement = forecast.projectedQualityScore90 - forecast.currentQualityScore

  return (
    <div className="space-y-6">
      {/* Header with confidence indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-[#1C4444]">Your Skin Forecast</h2>
          <p className="text-[#1C4444]/60 text-sm mt-1">
            Based on {forecast.analysisCount} {forecast.analysisCount === 1 ? 'analysis' : 'analyses'}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          forecast.confidenceLevel === 'high'
            ? 'bg-green-100 text-green-700'
            : forecast.confidenceLevel === 'medium'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {forecast.confidenceLevel === 'high' ? '🎯 High Confidence' :
           forecast.confidenceLevel === 'medium' ? '📊 Medium Confidence' :
           '📈 Building Data...'}
        </div>
      </div>

      {/* 90-Day Projected Improvements */}
      <div className="bg-gradient-to-br from-[#1C4444] to-[#2d6a6a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📈</span>
          <h3 className="text-lg font-medium">Projected Improvements (90 days)</h3>
        </div>

        <div className="grid gap-4">
          {/* Skin Age Projection */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-white/70 text-sm">Skin Age</p>
                  <p className="text-xl font-medium">
                    {forecast.currentSkinAge} → {forecast.projectedSkinAge90}
                    {skinAgeImprovement > 0 && (
                      <span className="text-green-300 ml-2 text-base">
                        (-{skinAgeImprovement} years)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-white/70">Achievable</p>
                <p className="font-medium">{forecast.achievableSkinAge}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (skinAgeImprovement / (forecast.currentSkinAge - forecast.achievableSkinAge)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Quality Score Projection */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="text-white/70 text-sm">Skin Health</p>
                  <p className="text-xl font-medium">
                    {forecast.currentQualityScore} → {forecast.projectedQualityScore90}
                    {qualityImprovement > 0 && (
                      <span className="text-green-300 ml-2 text-base">
                        (+{qualityImprovement} points)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all duration-1000"
                style={{ width: `${forecast.projectedQualityScore90}%` }}
              />
            </div>
          </div>

          {/* Condition Clearance */}
          {forecast.conditionProjections.filter(c => c.clearByDay !== null).length > 0 && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm mb-3">Expected to Clear</p>
              <div className="space-y-2">
                {forecast.conditionProjections
                  .filter(c => c.clearByDay !== null)
                  .sort((a, b) => (a.clearByDay || 999) - (b.clearByDay || 999))
                  .slice(0, 3)
                  .map(condition => (
                    <div key={condition.id} className="flex items-center justify-between">
                      <span>{condition.name}</span>
                      <span className="text-green-300 text-sm">
                        Day {condition.clearByDay}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-6 flex justify-between text-xs text-white/60">
          <div className="text-center">
            <div className="w-3 h-3 bg-white/30 rounded-full mx-auto mb-1" />
            <p>Today</p>
            <p className="text-white font-medium">{forecast.currentQualityScore}</p>
          </div>
          <div className="flex-1 flex items-center px-4">
            <div className="h-0.5 w-full bg-white/20" />
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-white/50 rounded-full mx-auto mb-1" />
            <p>30 Days</p>
            <p className="text-white font-medium">{forecast.projectedQualityScore30}</p>
          </div>
          <div className="flex-1 flex items-center px-4">
            <div className="h-0.5 w-full bg-white/20" />
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-white/70 rounded-full mx-auto mb-1" />
            <p>60 Days</p>
            <p className="text-white font-medium">{forecast.projectedQualityScore60}</p>
          </div>
          <div className="flex-1 flex items-center px-4">
            <div className="h-0.5 w-full bg-white/20" />
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-1" />
            <p>90 Days</p>
            <p className="text-white font-medium">{forecast.projectedQualityScore90}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[#1C4444]/10 pb-2">
        <button
          onClick={() => setActiveTab('projections')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'projections'
              ? 'bg-[#1C4444] text-white'
              : 'text-[#1C4444]/60 hover:text-[#1C4444]'
          }`}
        >
          Condition Details
        </button>
        <button
          onClick={() => setActiveTab('warnings')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'warnings'
              ? 'bg-[#1C4444] text-white'
              : 'text-[#1C4444]/60 hover:text-[#1C4444]'
          }`}
        >
          Watch Out For ({forecast.warnings.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'bg-[#1C4444] text-white'
              : 'text-[#1C4444]/60 hover:text-[#1C4444]'
          }`}
        >
          Recommendations ({forecast.recommendations.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-6">
        {activeTab === 'projections' && (
          <ConditionProjectionsView projections={forecast.conditionProjections} />
        )}
        {activeTab === 'warnings' && (
          <WarningsView warnings={forecast.warnings} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsView recommendations={forecast.recommendations} />
        )}
      </div>

      {/* Category Improvements */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
          <span>📊</span> Category Improvements (90 Days)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(forecast.categories).map(([category, { current, projected90 }]) => (
            <div key={category} className="bg-[#F4EBE7] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1C4444] capitalize">{category}</span>
                <span className={`text-sm font-medium ${projected90 > current ? 'text-green-600' : 'text-[#1C4444]'}`}>
                  {projected90 > current && '+'}{projected90 - current}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1C4444]/40 rounded-full"
                    style={{ width: `${current}%` }}
                  />
                </div>
                <span className="text-xs text-[#1C4444]/60">{current}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${projected90}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium">{projected90}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consistency Score */}
      <div className="bg-[#F4EBE7] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-medium text-[#1C4444]">Tracking Consistency</p>
            <p className="text-xs text-[#1C4444]/60">
              {forecast.consistencyScore >= 70
                ? 'Great job! Keep analyzing weekly for best predictions.'
                : forecast.consistencyScore >= 40
                ? 'Good start! More frequent analyses = better forecasts.'
                : 'Tip: Weekly skin checks help us predict your progress.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1C4444]">{forecast.consistencyScore}%</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#9A8428] to-[#C4A83C] rounded-xl p-6 text-white text-center">
        <p className="text-lg font-medium mb-2">Ready to accelerate your progress?</p>
        <p className="text-white/80 text-sm mb-4">
          Get personalized product recommendations based on your skin analysis
        </p>
        <Link
          href="/skin-analysis"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1C4444] rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          <span>📷</span> New Analysis
        </Link>
      </div>
    </div>
  )
}

function ConditionProjectionsView({ projections }: { projections: ConditionProjection[] }) {
  const getImprovementColor = (rate: ConditionProjection['improvementRate']) => {
    switch (rate) {
      case 'fast': return 'text-green-600 bg-green-50'
      case 'moderate': return 'text-blue-600 bg-blue-50'
      case 'slow': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const getImprovementLabel = (rate: ConditionProjection['improvementRate']) => {
    switch (rate) {
      case 'fast': return '🚀 Fast improvement'
      case 'moderate': return '📈 Moderate improvement'
      case 'slow': return '🐢 Slow improvement'
      default: return '⏸️ Stagnant'
    }
  }

  return (
    <div className="space-y-4">
      {projections.map(condition => (
        <div key={condition.id} className="border border-[#1C4444]/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[#1C4444]">{condition.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${getImprovementColor(condition.improvementRate)}`}>
              {getImprovementLabel(condition.improvementRate)}
            </span>
          </div>

          {/* Confidence progression */}
          <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
            <div>
              <p className="text-[#1C4444]/60 text-xs">Now</p>
              <p className="font-medium text-[#1C4444]">{Math.round(condition.currentConfidence * 100)}%</p>
            </div>
            <div>
              <p className="text-[#1C4444]/60 text-xs">30d</p>
              <p className="font-medium text-[#1C4444]">{Math.round(condition.projectedConfidence30 * 100)}%</p>
            </div>
            <div>
              <p className="text-[#1C4444]/60 text-xs">60d</p>
              <p className="font-medium text-[#1C4444]">{Math.round(condition.projectedConfidence60 * 100)}%</p>
            </div>
            <div>
              <p className="text-[#1C4444]/60 text-xs">90d</p>
              <p className="font-medium text-green-600">{Math.round(condition.projectedConfidence90 * 100)}%</p>
            </div>
          </div>

          {/* Visual bar */}
          <div className="h-2 bg-[#F4EBE7] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#1C4444]"
              style={{ width: `${condition.projectedConfidence90 * 100}%` }}
            />
            <div
              className="h-full bg-green-400"
              style={{ width: `${(condition.currentConfidence - condition.projectedConfidence90) * 100}%` }}
            />
          </div>

          {condition.clearByDay !== null && (
            <p className="text-xs text-green-600 mt-2">
              ✨ Expected to clear by day {condition.clearByDay}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function WarningsView({ warnings }: { warnings: SkinForecast['warnings'] }) {
  if (warnings.length === 0) {
    return (
      <div className="text-center py-8 text-[#1C4444]/60">
        <span className="text-4xl block mb-2">✅</span>
        <p>No warnings at this time!</p>
      </div>
    )
  }

  const getWarningStyle = (type: string) => {
    switch (type) {
      case 'seasonal': return 'bg-blue-50 border-blue-200'
      case 'product': return 'bg-amber-50 border-amber-200'
      case 'behavior': return 'bg-purple-50 border-purple-200'
      case 'plateau': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {warnings.map((warning, index) => (
        <div key={index} className={`p-4 rounded-xl border ${getWarningStyle(warning.type)}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{warning.icon}</span>
            <div>
              <h4 className="font-medium text-[#1C4444]">{warning.title}</h4>
              <p className="text-sm text-[#1C4444]/70 mt-1">{warning.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecommendationsView({ recommendations }: { recommendations: SkinForecast['recommendations'] }) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-[#1C4444]/60">
        <span className="text-4xl block mb-2">🎉</span>
        <p>Your routine looks great!</p>
      </div>
    )
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <div key={index} className="bg-[#F4EBE7] rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-[#1C4444]">{rec.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityStyle(rec.priority)}`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-[#1C4444]/70">{rec.description}</p>
            </div>
            {rec.productSuggestion && (
              <Link
                href={`https://ayonne.skin/products/${rec.productSuggestion}`}
                target="_blank"
                className="text-[#1C4444] text-sm font-medium hover:underline whitespace-nowrap ml-4"
              >
                Shop →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
