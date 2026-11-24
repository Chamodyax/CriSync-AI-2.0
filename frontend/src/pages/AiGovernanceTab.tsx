import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Sliders,
  BarChart3,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { RadialConfidenceGauge } from '../components/RadialConfidenceGauge';

interface AiGovernanceTabProps {
  userRole: string;
  recommendations: any[];
  demandForecast: any[];
  selectedRecommendation: any | null;
  onSelectRecommendation: (rec: any) => void;
  onSubmitGovernanceReview: (payload: {
    recommendationId: string;
    decisionStatus: string;
    overriddenUrgency: string;
    overriddenCategory: string;
    justification: string;
  }) => Promise<void>;
}

const decisionOptions = [
  { value: 'Approved', label: '✓ Agree with AI Score', style: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200' },
  { value: 'Modified', label: '✎ Change Urgency Level', style: 'border-indigo-500/50 bg-indigo-500/20 text-indigo-200' },
  { value: 'Rejected', label: '✕ Reject AI Suggestion', style: 'border-rose-500/50 bg-rose-500/20 text-rose-200' },
  { value: 'Deferred', label: '⏳ Review Later', style: 'border-amber-500/50 bg-amber-500/20 text-amber-200' }
];

const urgencyPills = ['Low', 'Medium', 'High', 'Critical', 'LifeThreatening'];

function getFriendlyFactorLabel(factorKey: string): string {
  switch (factorKey) {
    case 'MedicalKeywordScore':
      return 'Medical & Vulnerability Keywords';
    case 'PeopleCountScore':
      return 'Number of People Affected';
    case 'UserUrgencyScore':
      return 'Citizen Reported Urgency';
    case 'CategoryBaseScore':
      return 'Aid Category Importance';
    default:
      return factorKey;
  }
}

export const AiGovernanceTab: React.FC<AiGovernanceTabProps> = ({
  userRole,
  recommendations,
  demandForecast,
  selectedRecommendation,
  onSelectRecommendation,
  onSubmitGovernanceReview
}) => {
  const [action, setAction] = useState('Approved');
  const [urgency, setUrgency] = useState('High');
  const [category, setCategory] = useState('Medicine');
  const [justification, setJustification] = useState('');
  const reviewFormRef = useRef<HTMLDivElement | null>(null);

  const canApproveOrOverrideAi =
    userRole === 'EmergencyCoordinator' ||
    userRole === 'CaseManager' ||
    userRole === 'OrganizationAdmin' ||
    userRole === 'SystemAdmin';

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecommendation) return;
    await onSubmitGovernanceReview({
      recommendationId: selectedRecommendation.id,
      decisionStatus: action,
      overriddenUrgency: urgency,
      overriddenCategory: category,
      justification
    });
    setJustification('');
  };

  const demandForecastSection = (
    <div className="bento-glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Next 48 Hours Supply Outlook
            </span>
            <h3 className="text-lg font-extrabold text-white">
              Predicted Supply Needs & Warehouse Shortages (Next 2 Days)
            </h3>
            <p className="text-xs text-zinc-400">
              Compares expected community demand over the next 48 hours against current warehouse stock so you can spot shortages early.
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          48-Hour Forecast
        </span>
      </div>

      {demandForecast.length > 0 && (() => {
        const maxVal = Math.max(
          1,
          ...demandForecast.map((d) => Math.max(Number(d.predictedNext48HoursDemand || 0), Number(d.currentAvailableStock || 0)))
        );
        return (
          <div className="mb-5 p-4 rounded-2xl bg-black/20 border border-white/[0.07] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-zinc-200">
                48h Predicted Demand vs. Current Warehouse Stock
              </span>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5 text-indigo-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                  Predicted 48h Need
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Available Stock
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {demandForecast.slice(0, 8).map((item) => {
                const needPct = Math.round((Number(item.predictedNext48HoursDemand || 0) / maxVal) * 100);
                const stockPct = Math.round((Number(item.currentAvailableStock || 0) / maxVal) * 100);
                return (
                  <div key={`chart-${item.categoryName}`} className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white truncate">{item.categoryName}</span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {item.currentAvailableStock}/{item.predictedNext48HoursDemand}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.max(4, needPct)}%` }} />
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.max(4, stockPct)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.03] uppercase tracking-wider text-[11px] font-bold">
              <th className="py-3.5 px-4">Aid Category</th>
              <th className="py-3.5 px-4">Active Requests</th>
              <th className="py-3.5 px-4">Currently Needed</th>
              <th className="py-3.5 px-4">Predicted 48h Need</th>
              <th className="py-3.5 px-4">Available in Warehouse</th>
              <th className="py-3.5 px-4">Expected Shortage</th>
              <th className="py-3.5 px-4">Supply Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {demandForecast.map((item, idx) => {
              const hasShortfall = item.projectedDeficit > 0;
              const coveragePct = Math.min(
                100,
                Math.round(
                  (item.currentAvailableStock / Math.max(1, item.predictedNext48HoursDemand)) * 100
                )
              );
              return (
                <motion.tr
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.05, 0.25) }}
                  key={item.categoryName}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3.5 px-4 font-extrabold text-white">{item.categoryName}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    {item.historicalRequestsCount}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    {item.currentRequestedUnits} units
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-300 font-extrabold">
                    {item.predictedNext48HoursDemand} units
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-300 font-bold">
                    <div>{item.currentAvailableStock} units</div>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${coveragePct}%` }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                        className={`h-full rounded-full crisync-shimmer-bar ${
                          hasShortfall
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-400 font-extrabold">
                    {item.projectedDeficit > 0 ? `${item.projectedDeficit} units short` : 'No shortage'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        hasShortfall
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {item.riskStatus}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!canApproveOrOverrideAi) {
    return (
      <div className="space-y-6">
        {demandForecastSection}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bento-glass rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Transparent AI Priority Scoring
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Why the AI Ranked Each Request & Score Breakdown
              </h2>
              <p className="text-xs text-zinc-400">
                Review how points were calculated for each request. Staff always have the final say and can approve or adjust any score.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.length === 0 && (
              <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/15 text-center text-xs text-zinc-400">
                No AI priority recommendations yet. Recommendations are generated automatically whenever a Citizen submits a help request under an active Crisis Event.
              </div>
            )}
            {recommendations.map((rec, index) => {
              let factors: Record<string, number> = {};
              try {
                factors = JSON.parse(rec.explainableFactorsJson || '{}');
              } catch {
                factors = {};
              }
              const isSelected = selectedRecommendation?.id === rec.id;
              const confidencePct = Math.round(rec.confidenceScore * 100);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.2) }}
                  key={rec.id}
                  className={`p-5 rounded-3xl border space-y-3.5 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent border-2 border-indigo-500 shadow-glow'
                      : 'bg-white/[0.025] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <RadialConfidenceGauge percentage={confidencePct} size={62} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-200">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                          Suggested: {rec.recommendedUrgency} ({rec.recommendedCategory})
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          Status: {rec.governanceStatus}
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        onSelectRecommendation(rec);
                        setCategory(rec.recommendedCategory);
                        setUrgency(rec.recommendedUrgency);
                        setTimeout(() => {
                          reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 80);
                      }}
                      className="keep-white px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Review or Adjust Score</span>
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      1. AI Analyzed
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span
                      className={`px-2.5 py-1 rounded-lg border ${
                        rec.humanDecision
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      2. {rec.humanDecision ? `Human ${rec.humanDecision.actionTaken}` : 'Pending Human Review'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span
                      className={`px-2.5 py-1 rounded-lg border ${
                        rec.humanDecision
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                          : 'bg-white/[0.04] border-white/10 text-zinc-400'
                      }`}
                    >
                      3. Immutable Audit Trail
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{rec.rationale}</p>

                  <div>
                    <p className="text-[11px] font-bold text-zinc-400 mb-2">
                      How the AI calculated this priority score:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {Object.entries(factors).map(([factorName, factorValue]) => {
                        const barPct = Math.min(100, Math.max(15, Number(factorValue) * 3));
                        return (
                          <div
                            key={factorName}
                            className="bg-black/25 p-3 rounded-2xl border border-white/[0.07]"
                          >
                            <p className="text-[11px] font-semibold text-zinc-300 leading-tight">
                              {getFriendlyFactorLabel(factorName)}
                            </p>
                            <p className="text-sm font-mono font-extrabold text-white mt-1">
                              +{factorValue} <span className="text-[10px] text-zinc-400">points</span>
                            </p>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barPct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full crisync-shimmer-bar"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {rec.humanDecision && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                      <p className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        Reviewed by Staff: {rec.humanDecision.actionTaken} by {rec.humanDecision.responsibleUserName} ({rec.humanDecision.responsibleUserRole})
                      </p>
                      <p className="text-zinc-300 flex flex-wrap items-center gap-1.5 text-xs">
                        <span>AI Suggested: {rec.humanDecision.originalAiRecommendationSummary}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        <strong className="text-emerald-300">
                          Final Staff Decision: {rec.humanDecision.finalHumanDecisionSummary}
                        </strong>
                      </p>
                      <p className="text-zinc-400">
                        Staff Note: {rec.humanDecision.overrideJustification}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div ref={reviewFormRef} className="scroll-mt-24 lg:col-span-5 bento-glass rounded-3xl p-5 sm:p-6 h-fit lg:sticky lg:top-28 border border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4 pb-3.5 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Staff Final Decision
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Approve or Change AI Priority
              </h3>
            </div>
          </div>

          {selectedRecommendation ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 block">
                  Currently Reviewing Recommendation:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedRecommendation.rationale}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 font-bold">
                    Category: {selectedRecommendation.recommendedCategory}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 font-bold">
                    AI Urgency: {selectedRecommendation.recommendedUrgency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-2">
                  1. Your Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {decisionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAction(opt.value)}
                      className={`py-2.5 px-3 rounded-xl font-bold border text-xs transition ${
                        action === opt.value
                          ? `${opt.style} ring-2 ring-indigo-500/40`
                          : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-2">
                  2. Final Approved Urgency Level
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {urgencyPills.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`px-3 py-1.5 rounded-xl font-bold border text-xs transition ${
                        urgency === u
                          ? 'bg-indigo-600 border-indigo-400 text-white keep-white shadow-sm'
                          : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">
                  3. Reason for Your Decision (Saved to Audit Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Document field verification or clinical justification for approval or override"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: Confirmed ground accessibility with field team; approving dispatch urgency based on household vulnerability.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="keep-white w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Staff Review Decision</span>
              </motion.button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/15 text-center space-y-3">
              <Sliders className="w-7 h-7 text-indigo-400 mx-auto" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                Click <strong>"Review or Adjust Score"</strong> on any card on the left to approve or change the AI priority level.
              </p>
              {recommendations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const first = recommendations[0];
                    onSelectRecommendation(first);
                    setCategory(first.recommendedCategory);
                    setUrgency(first.recommendedUrgency);
                  }}
                  className="keep-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Select First Recommendation Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {demandForecastSection}
    </div>
  );
};
