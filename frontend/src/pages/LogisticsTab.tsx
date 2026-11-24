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
                      <Zap className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      {active && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs font-extrabold text-white leading-snug">{st.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-zinc-300">
                Step 2: Check the requests to include in this delivery run
              </label>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-3 py-0.5 rounded-full border border-indigo-500/30">
                {selectedCompetingIds.length} Selected
              </span>
            </div>
            <div className="content-scroll space-y-2 max-h-56 overflow-y-auto pr-1">
              {requests
                .filter((r) => r.status !== 'MergedAsDuplicate')
                .map((r) => {
                  const isChecked = selectedCompetingIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-500/15 border-indigo-500/60 text-white'
                          : 'bg-white/[0.02] border-white/[0.07] text-zinc-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleCompetingRequest(r.id)}
                          className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/40 text-indigo-500"
                        />
                        <div>
                          <span className="font-mono font-bold text-indigo-300">{r.referenceCode}</span> —{' '}
                          <span className="font-bold text-white">{r.title}</span>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {r.category} • Urgency: <strong className="text-zinc-200">{r.finalApprovedUrgency}</strong> • Quantity Needed:{' '}
                            <strong className="font-mono text-emerald-300">{r.requestedQuantity} units</strong>
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onRunAllocation(false)}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>1. Preview Delivery Plan</span>
            </motion.button>
            {canDispatch && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRunAllocation(true)}
                className="keep-white flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                <Truck className="w-4 h-4" />
                <span>2. Confirm & Dispatch Supplies</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bento-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Recommended Delivery Breakdown
                </span>
                <h3 className="text-lg font-extrabold text-white">Supply Allocation Plan Results</h3>
              </div>
            </div>
            {allocationPlanResult && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                {allocationPlanResult.strategyUsed}
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {allocationPlanResult ? (
              <motion.div
                key={allocationPlanResult.strategyUsed + allocationPlanResult.totalAllocatedAcrossCases}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 text-xs"
              >
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-extrabold text-white text-sm">
                      Rule Used: {allocationPlanResult.strategyUsed}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        allocationPlanResult.shortageEncountered
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {allocationPlanResult.shortageEncountered ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {allocationPlanResult.shortageEncountered ? 'Stock Shortage Handled' : 'Full Stock Available'}
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    {allocationPlanResult.architecturalExplanation}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="bg-black/25 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] font-bold text-zinc-400 block">Total Requested</span>
                      <strong className="font-mono text-base text-white">
                        {allocationPlanResult.totalRequestedAcrossCases} units
                      </strong>
                    </div>
                    <div className="bg-black/25 p-3 rounded-xl border border-emerald-500/30">
                      <span className="text-[11px] font-bold text-emerald-400 block">Ready to Send</span>
                      <strong className="font-mono text-base text-emerald-300">
                        {allocationPlanResult.totalAllocatedAcrossCases} units
                      </strong>
                    </div>
                    <div className="bg-black/25 p-3 rounded-xl border border-rose-500/30">
                      <span className="text-[11px] font-bold text-rose-400 block">Remaining Shortage</span>
                      <strong className="font-mono text-base text-rose-400">
                        {allocationPlanResult.totalUnmetShortfall} units
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 content-scroll">
                  {allocationPlanResult.allocations.map((item: any) => {
                    const fillPct = Math.min(
                      100,
                      Math.round((item.allocatedQuantity / Math.max(1, item.requestedQuantity)) * 100)
                    );
                    return (
                      <div
                        key={item.assistanceRequestId}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-extrabold text-white font-mono text-sm">
                            {item.requestReferenceCode}{' '}
                            <span className="font-sans text-xs font-bold text-indigo-300">
                              (Urgency: {item.urgency})
                            </span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                            Sending {item.allocatedQuantity} of {item.requestedQuantity} units ({fillPct}%)
                          </span>
                        </div>
                        <div className="relative pt-2.5 pb-1">
                          <motion.div
                            initial={{ left: '0%' }}
                            animate={{ left: `calc(${Math.max(4, fillPct)}% - 12px)` }}
                            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] as const }}
                            className="absolute -top-0.5 w-6 h-6 rounded-full bg-indigo-600 border border-indigo-300/70 shadow-md flex items-center justify-center keep-white z-10"
                          >
                            <Truck className="w-3 h-3 text-white" />
                          </motion.div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fillPct}%` }}
                              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] as const }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full crisync-shimmer-bar"
                            />
                          </div>
                        </div>
                        <p className="text-zinc-400 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            From Warehouse: <strong className="text-zinc-200">{item.warehouseName}</strong> ({item.distanceKm} km away)
                          </span>
                        </p>
                        <p className="text-amber-200 font-semibold bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30">
                          Next Step: {item.alternativeRecommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="p-8 rounded-2xl bg-black/20 border border-dashed border-white/15 text-center space-y-3">
                <Eye className="w-7 h-7 text-indigo-400 mx-auto" />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Click <strong>"1. Preview Delivery Plan"</strong> on the left (or below) to see how supplies will be divided across your selected requests before dispatching.
                </p>
                <button
                  type="button"
                  onClick={() => onRunAllocation(false)}
                  className="keep-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Generate Preview Plan Now
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bento-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.08]">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2.5">
                <Warehouse className="w-5 h-5 text-indigo-400" />
                Current Warehouse Stock & Cold-Storage Inventory
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Live inventory levels across regional relief depots, including refrigerated medicine stock.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300">
              {resources.length} Items in Stock
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.03] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3.5 px-4">Supply Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Warehouse Location</th>
                  <th className="py-3.5 px-4">Available / Total</th>
                  <th className="py-3.5 px-4">Storage Type</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {resources.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-xs text-zinc-400">
                      No relief warehouse inventory added yet. Add incoming medical, food, water, or shelter stock using the panel on the right.
                    </td>
                  </tr>
                )}
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{r.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200 font-semibold">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">{r.warehouseName}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <div>
                        <span className="font-extrabold text-emerald-300">{r.availableQuantity}</span> /{' '}
                        {r.totalQuantity} <span className="font-sans text-zinc-400">{r.unit}</span>
                      </div>
                      {canDispatch && onReplenishResource && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <input
                            type="number"
                            min={1}
                            value={replenishAmounts[r.id] ?? 25}
                            onChange={(e) =>
                              setReplenishAmounts((prev) => ({
                                ...prev,
                                [r.id]: Math.max(1, Number(e.target.value) || 1)
                              }))
                            }
                            className="w-16 px-2 py-0.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onReplenishResource(
                                r.id,
                                replenishAmounts[r.id] ?? 25,
                                'Warehouse stock replenishment'
                              )
                            }
                            className="keep-white px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.supportsColdChain ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
                          <Snowflake className="w-3.5 h-3.5" />
                          Refrigerated
                        </span>
                      ) : (
                        <span className="text-zinc-400">Room Temp</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {r.expiryDateUtc ? new Date(r.expiryDateUtc).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {canDispatch && (
          <div className="lg:col-span-4 bento-glass rounded-3xl p-5 sm:p-6 h-fit">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.08]">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Add New Stock to Warehouse
                </h3>
                <p className="text-xs text-zinc-400">
                  Record incoming supplies or partner donations
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Supply Item Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Enter exact supply description"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: Bottled Drinking Water (5L Packs) or Cold-Chain Insulin Vials
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="rsvp-input"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Food">Food</option>
                    <option value="WaterAndSanitation">Clean Water &amp; Sanitation</option>
                    <option value="TemporaryShelter">Shelter Supplies</option>
                    <option value="Transportation">Emergency Transportation</option>
                    <option value="AccessibilityAssistance">Accessibility &amp; Mobility Aids</option>
                    <option value="SearchAndRescue">Search &amp; Rescue Gear</option>
                    <option value="MedicalEvacuation">Medical Evacuation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={totalQty}
                    onChange={(e) => setTotalQty(Number(e.target.value))}
                    className="rsvp-input font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Units / Vials / Packs"
                    className="rsvp-input"
                  />
                  <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                    Example: Kits, Packs
                  </p>
                </div>
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Warehouse Location Name</label>
                <input
                  type="text"
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Depot or storage facility name"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: Central Port Relief Depot / District Cold Storage
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Warehouse Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={warehouseLat}
                    onChange={(e) => setWarehouseLat(Number(e.target.value))}
                    className="rsvp-input font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Warehouse Lon</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={warehouseLon}
                    onChange={(e) => setWarehouseLon(Number(e.target.value))}
                    className="rsvp-input font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-400/75 opacity-75 -mt-1 font-normal">
                Example: GPS coordinates (6.9271, 79.8612) used for distance-based dispatch matching
              </p>
              <label className="flex items-center gap-2.5 text-zinc-200 font-semibold cursor-pointer p-3 rounded-2xl bg-black/20 border border-white/10">
                <input
                  type="checkbox"
                  checked={coldChain}
                  onChange={(e) => setColdChain(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500"
                />
                <Snowflake className="w-4 h-4 text-cyan-400" />
                Requires Refrigerated Cold-Storage
              </label>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="keep-white w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-1.5 transition"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Add Stock to Warehouse</span>
              </motion.button>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bento-glass rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Active Dispatch Convoys &amp; Deliveries
                </h3>
                <p className="text-xs text-zinc-400">
                  Track vehicle routes and confirm physical handoff at field drop points
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300">
              {dispatches.length} Convoys
            </span>
          </div>
          {dispatches.length === 0 ? (
            <p className="text-xs text-zinc-400">
              No active dispatches yet. Confirm a delivery plan above to launch a convoy.
            </p>
          ) : (
            <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto pr-1 content-scroll">
              {dispatches.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-white">{d.vehicleRegistration}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                          d.dispatchStatus === 'Delivered'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {d.dispatchStatus}
                      </span>
                    </div>
                    <p className="text-zinc-300">{d.routeSummary}</p>
                    <p className="text-zinc-400 font-mono text-[11px]">
                      {d.distanceKm} km • ETA {d.estimatedTravelMinutes} mins
                    </p>
                  </div>
                  {canDispatch && onMarkDispatchDelivered && d.dispatchStatus !== 'Delivered' && (
                    <button
                      type="button"
                      onClick={() => onMarkDispatchDelivered(d.id)}
                      className="keep-white px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bento-glass rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Cross-Organisation Partner Aid Requests
                </h3>
                <p className="text-xs text-zinc-400">
                  Escalate stock shortages and coordinate mutual aid across NGOs &amp; shelters
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300">
              {partnerAidRequests.length} Requests
            </span>
          </div>

          {onCreatePartnerAidRequest && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!partnerResourceName.trim()) return;
                await onCreatePartnerAidRequest({
                  neededCategory: partnerCategory,
                  resourceName: partnerResourceName,
                  quantityNeeded: Number(partnerQty),
                  justification: partnerJustification,
                  targetPartnerOrganisationId: targetPartnerOrgId || null
                });
                setPartnerResourceName('');
                setPartnerJustification('');
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs p-3 rounded-2xl bg-black/20 border border-white/10"
            >
              <select
                value={partnerCategory}
                onChange={(e) => setPartnerCategory(e.target.value)}
                className="rsvp-input"
              >
                <option value="Medicine">Medicine</option>
                <option value="Food">Food</option>
                <option value="WaterAndSanitation">Clean Water</option>
                <option value="TemporaryShelter">Shelter Supplies</option>
                <option value="AccessibilityAssistance">Accessibility</option>
              </select>
              <input
                type="text"
                required
                value={partnerResourceName}
                onChange={(e) => setPartnerResourceName(e.target.value)}
                placeholder="Needed item name"
                className="rsvp-input sm:col-span-2"
              />
              <input
                type="number"
                min={1}
                required
                value={partnerQty}
                onChange={(e) => setPartnerQty(Number(e.target.value))}
                className="rsvp-input font-mono"
              />
              <select
                value={targetPartnerOrgId}
                onChange={(e) => setTargetPartnerOrgId(e.target.value)}
                className="rsvp-input sm:col-span-2"
              >
                <option value="">Broadcast to All Verified Partners</option>
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={partnerJustification}
                onChange={(e) => setPartnerJustification(e.target.value)}
                placeholder="Urgent mutual-aid reason"
                className="rsvp-input sm:col-span-1"
              />
              <button
                type="submit"
                className="keep-white py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold"
              >
                Post Aid Request
              </button>
            </form>
          )}

          <div className="space-y-2.5 text-xs max-h-64 overflow-y-auto pr-1 content-scroll">
            {partnerAidRequests.length === 0 ? (
              <p className="text-zinc-400">
                No cross-organisation partner aid requests open right now.
              </p>
            ) : (
              partnerAidRequests.map((pr) => (
                <div
                  key={pr.id}
                  className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">
                        {pr.quantityNeeded} × {pr.resourceName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-[10px]">
                        {pr.status}
                      </span>
                    </div>
                    <p className="text-zinc-400">{pr.justification}</p>
                  </div>
                  {canDispatch && onFulfillPartnerAidRequest && pr.status !== 'FulfilledByPartner' && (
                    <button
                      type="button"
                      onClick={() => onFulfillPartnerAidRequest(pr.id, 'Partner transfer confirmed')}
                      className="keep-white px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fulfill Request</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
