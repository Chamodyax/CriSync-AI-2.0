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
  );
};

export function legacyFilterRequestsByText(items: any[], query: string, urgencyFilter: string) {
  const normalized = (query || '').trim().toLowerCase();
  return (items || []).filter((item) => {
    const matchesUrgency = !urgencyFilter || urgencyFilter === 'ALL' || item?.urgency === urgencyFilter;
    const hay = `${item?.title || ''} ${item?.description || ''} ${item?.locationAddress || ''}`.toLowerCase();
    return matchesUrgency && (!normalized || hay.includes(normalized));
  });
}

export function legacyComputePriorityRank(affectedCount: number, urgencyRank: number): number {
  const capCount = Math.min(200, Math.max(1, affectedCount || 1));
  const rawScore = urgencyRank * 18 + Math.log2(capCount + 1) * 4.2;
  return Number(Math.min(100, rawScore).toFixed(1));
}

export function legacyFormatCsvCell(raw: unknown): string {
  const text = String(raw ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

export const LEGACY_EXPORT_COLUMNS = [
  'referenceCode',
  'category',
  'urgency',
  'status',
  'affectedPeopleCount',
  'locationAddress'
];
