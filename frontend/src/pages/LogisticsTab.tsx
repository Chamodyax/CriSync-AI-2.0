import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Eye,
  PackagePlus,
  Warehouse,
  Snowflake,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  MapPin,
  Zap,
  Plus,
  Handshake
} from 'lucide-react';

interface LogisticsTabProps {
  userRole: string;
  requests: any[];
  resources: any[];
  dispatches?: any[];
  partnerAidRequests?: any[];
  organisations?: any[];
  selectedStrategy: string;
  selectedCompetingIds: string[];
  allocationPlanResult: any | null;
  onChangeStrategy: (strategy: string) => void;
  onToggleCompetingRequest: (id: string) => void;
  onRunAllocation: (commitToDb: boolean) => void;
  onAddResource: (payload: any) => Promise<void>;
  onReplenishResource?: (id: string, addedQuantity: number, sourceNote?: string) => Promise<void>;
  onMarkDispatchDelivered?: (id: string) => Promise<void>;
  onCreatePartnerAidRequest?: (payload: any) => Promise<void>;
  onFulfillPartnerAidRequest?: (id: string, notes?: string) => Promise<void>;
}

const strategyCards = [
  {
    id: 'MultiConstraintOptimal',
    title: 'Best Overall Match (Recommended)',
    desc: 'Balances road distance, stock levels, expiry dates & cold-storage needs'
  },
  {
    id: 'ShortageProportionalContention',
    title: 'Fair Split During Shortages',
    desc: 'Shares limited supplies fairly across families based on urgency score'
  },
  {
    id: 'ProximityFirst',
    title: 'Closest Warehouse First',
    desc: 'Picks the nearest relief warehouse for the fastest possible delivery'
  }
];

export const LogisticsTab: React.FC<LogisticsTabProps> = ({
  userRole,
  requests,
  resources,
  dispatches = [],
  partnerAidRequests = [],
  organisations = [],
  selectedStrategy,
  selectedCompetingIds,
  allocationPlanResult,
  onChangeStrategy,
  onToggleCompetingRequest,
  onRunAllocation,
  onAddResource,
  onReplenishResource,
  onMarkDispatchDelivered,
  onCreatePartnerAidRequest,
  onFulfillPartnerAidRequest
}) => {
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Medicine');
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseLat, setWarehouseLat] = useState(6.9271);
  const [warehouseLon, setWarehouseLon] = useState(79.8612);
  const [totalQty, setTotalQty] = useState(100);
  const [unit, setUnit] = useState('Units');
  const [coldChain, setColdChain] = useState(false);

  const [replenishAmounts, setReplenishAmounts] = useState<Record<string, number>>({});
  const [partnerCategory, setPartnerCategory] = useState('Medicine');
  const [partnerResourceName, setPartnerResourceName] = useState('');
  const [partnerQty, setPartnerQty] = useState(25);
  const [partnerJustification, setPartnerJustification] = useState('');
  const [targetPartnerOrgId, setTargetPartnerOrgId] = useState('');

  const canDispatch =
    userRole === 'LogisticsManager' ||
    userRole === 'EmergencyCoordinator' ||
    userRole === 'PartnerOfficer' ||
    userRole === 'OrganizationAdmin' ||
    userRole === 'SystemAdmin';

  const lowStockAndExpiringItems = resources
    .map((r) => {
      const avail = Number(r.availableQuantity) || 0;
      const threshold = Number(r.reorderThreshold) || 20;
      const isLow = avail <= threshold;
      const daysToExpiry = r.expiryDateUtc
        ? Math.ceil((new Date(r.expiryDateUtc).getTime() - Date.now()) / 86400000)
        : null;
      const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30;
      return {
        ...r,
        isLow,
        isExpiringSoon,
        daysToExpiry
      };
    })
    .filter((r) => r.isLow || r.isExpiringSoon);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddResource({
      name: itemName,
      category: itemCategory,
      warehouseName,
      warehouseLatitude: Number(warehouseLat),
      warehouseLongitude: Number(warehouseLon),
      totalQuantity: Number(totalQty),
      availableQuantity: Number(totalQty),
      unit,
      supportsColdChain: coldChain,
      expiryDateUtc: new Date(Date.now() + 45 * 86400000).toISOString()
    });
    setItemName('');
    setWarehouseName('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden relative min-h-[148px] sm:min-h-[172px] border border-white/10 shadow-lg group">
        <img
          src="/images/logistics-depot.jpg"
          alt="Humanitarian logistics warehouse with cold-chain medical supplies and relief trucks"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="crisync-photo-scrim-side absolute inset-0" />
        <div className="keep-white relative z-10 p-5 sm:p-7 flex flex-wrap items-end justify-between gap-4 min-h-[148px] sm:min-h-[172px]">
          <div className="space-y-1.5 max-w-xl">
            <span className="crisync-photo-pill-indigo inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold text-white">
              <Warehouse className="w-3.5 h-3.5" />
              Global Relief Supply Hub
            </span>
            <h2 className="crisync-photo-text text-lg sm:text-xl font-black text-white tracking-tight">
              Cold-Chain Medical Stock &amp; Dispatch Network
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="crisync-photo-pill px-3 py-1.5 rounded-xl text-xs font-extrabold text-white">
              {resources.length} Active Stock Batches
            </span>
            <span className="crisync-photo-pill-emerald px-3 py-1.5 rounded-xl text-xs font-extrabold text-white">
              Cold-Chain Dispatch Ready
            </span>
          </div>
        </div>
      </div>

      {lowStockAndExpiringItems.length > 0 && (
        <div className="bento-glass rounded-3xl p-5 border border-amber-500/40 bg-amber-500/[0.06] space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  Automated Warehouse Threshold &amp; FEFO Expiry Monitor
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {lowStockAndExpiringItems.length} Warehouse Batch(es) Below Reorder Threshold or Expiring Within 30 Days
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300">
              Immediate Action Recommended
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
            {lowStockAndExpiringItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-black/25 border border-amber-500/30 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-white">{item.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 font-semibold text-[10px] shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-zinc-400">{item.warehouseName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.isLow && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-[11px]">
                        Low Stock: {item.availableQuantity} / {item.reorderThreshold} min
                      </span>
                    )}
                    {item.isExpiringSoon && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-[11px]">
                        Expires in {item.daysToExpiry}d
                      </span>
                    )}
                  </div>
                </div>
                {canDispatch && onReplenishResource && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onReplenishResource(item.id, 50, 'Quick emergency threshold restock (+50)')}
                      className="keep-white flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Quick Restock (+50)</span>
                    </button>
                    {onCreatePartnerAidRequest && (
                      <button
                        type="button"
                        onClick={() =>
                          onCreatePartnerAidRequest({
                            neededCategory: item.category,
                            resourceName: item.name,
                            quantityNeeded: Math.max(50, (item.reorderThreshold || 30) * 2),
                            justification: `Automated low-stock escalation for ${item.warehouseName} (${item.availableQuantity} remaining)`
                          })
                        }
                        className="py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold transition"
                      >
                        Partner Aid
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bento-glass rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Smart Supply Allocation & Dispatch Planner
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Plan & Dispatch Warehouse Relief Supplies
              </h2>
              <p className="text-xs text-zinc-400">
                Choose a distribution rule, select the requests you want to fulfill, and preview the delivery plan before dispatching.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Step 1: How should supplies be distributed?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {strategyCards.map((st) => {
                const active = selectedStrategy === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onChangeStrategy(st.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      active
                        ? 'bg-gradient-to-br from-indigo-500/25 to-purple-500/15 border-2 border-indigo-500 text-white shadow-glow'
                        : 'bg-white/[0.025] border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
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
