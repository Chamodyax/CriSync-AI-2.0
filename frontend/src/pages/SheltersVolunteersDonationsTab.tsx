import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  MapPin,
  Users,
  UserPlus,
  Building2,
  HeartPulse,
  Search,
  Sparkles,
  UserCheck,
  ClipboardCheck,
  HeartHandshake,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Activity,
  BellRing,
  Send,
  Shield,
  Clock,
  Globe,
  Pencil,
  Trash2,
  KeyRound,
  UserCog,
  Save,
  Database,
  X,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { InteractiveCrisisMap } from '../components/InteractiveCrisisMap';
import { LANGUAGE_OPTIONS, SupportedLanguage, TRANSLATIONS } from '../i18n';

export const SheltersTab: React.FC<{
  userRole: string;
  shelters: any[];
  allocations?: any[];
  requests: any[];
  onAllocateShelter: (payload: {
    shelterId: string;
    householdName: string;
    membersCount: number;
    requiresAccessibility: boolean;
    assistanceRequestId?: string | null;
    citizenUserId?: string | null;
  }) => Promise<void>;
  onCheckoutShelterAllocation?: (allocationId: string, householdName: string) => Promise<void>;
  onCreateShelter: (payload: any) => Promise<void>;
  onRecommendShelters: (requestId: string) => Promise<any[]>;
  onRequestShelterSupplies?: (shelterId: string, payload: any) => Promise<void>;
}> = ({
  userRole,
  shelters,
  allocations = [],
  requests,
  onAllocateShelter,
  onCheckoutShelterAllocation,
  onCreateShelter,
  onRecommendShelters,
  onRequestShelterSupplies
}) => {
  const [shelterId, setShelterId] = useState(shelters[0]?.id || '');
  const [householdName, setHouseholdName] = useState('');
  const [membersCount, setMembersCount] = useState(1);
  const [needsAccessibility, setNeedsAccessibility] = useState(false);
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [matchRequestId, setMatchRequestId] = useState(requests[0]?.id || '');
  const [shelterRecommendations, setShelterRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [newShelterName, setNewShelterName] = useState('');
  const [newShelterAddress, setNewShelterAddress] = useState('');
  const [newCapacity, setNewCapacity] = useState(200);
  const [newWheelchair, setNewWheelchair] = useState(true);
  const [newMedical, setNewMedical] = useState(true);
  const [newLat, setNewLat] = useState(6.9271);
  const [newLon, setNewLon] = useState(79.8612);
  const [supplyModalShelterId, setSupplyModalShelterId] = useState<string | null>(null);
  const [supplyResourceName, setSupplyResourceName] = useState('');
  const [supplyCategory, setSupplyCategory] = useState('Food');
  const [supplyQty, setSupplyQty] = useState(40);
  const [supplyJustification, setSupplyJustification] = useState('');

  const canRegisterShelter =
    userRole === 'ShelterAdmin' ||
    userRole === 'EmergencyCoordinator' ||
    userRole === 'OrganizationAdmin' ||
    userRole === 'SystemAdmin';

  const activeMatchRequestId = matchRequestId || requests[0]?.id || '';

  const handleFindRecommendedShelters = async () => {
    if (!activeMatchRequestId) return;
    setLoadingRecommendations(true);
    const list = await onRecommendShelters(activeMatchRequestId);
    setShelterRecommendations(list || []);
    setLoadingRecommendations(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(shelterId || shelters[0]?.id)) return;
    await onAllocateShelter({
      shelterId: shelterId || shelters[0]?.id,
      householdName,
      membersCount: Number(membersCount),
      requiresAccessibility: needsAccessibility,
      assistanceRequestId: linkedRequestId
    });
    setHouseholdName('');
    setMembersCount(1);
  };

  const handleCreateNewShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateShelter({
      name: newShelterName,
      address: newShelterAddress,
      latitude: Number(newLat),
      longitude: Number(newLon),
      totalCapacity: Number(newCapacity),
      currentOccupancy: 0,
      isWheelchairAccessible: newWheelchair,
      hasMedicalFacility: newMedical,
      hasCleanWater: true,
      hasPowerBackup: true,
      hasChildSafeSpace: true,
      availableServices: 'Emergency Shelter, Clean Water, Basic First Aid',
      status: 'Operational'
    });
    setNewShelterName('');
    setNewShelterAddress('');
  };

  const activeSelectedShelterId = shelterId || shelters[0]?.id || '';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden relative min-h-[148px] sm:min-h-[172px] border border-white/10 shadow-lg group">
        <img
          src="/images/shelter-center.jpg"
          alt="Safe community evacuation shelter center with accessibility support"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="crisync-photo-scrim-side absolute inset-0" />
        <div className="keep-white relative z-10 p-5 sm:p-7 flex flex-wrap items-end justify-between gap-4 min-h-[148px] sm:min-h-[172px]">
          <div className="space-y-1.5 max-w-xl">
            <span className="crisync-photo-pill-emerald inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold text-white">
              <Home className="w-3.5 h-3.5" />
              Verified Emergency Shelters
            </span>
            <h2 className="crisync-photo-text text-lg sm:text-xl font-black text-white tracking-tight">
              Safe Accommodation, Clean Water &amp; First-Aid Support
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="crisync-photo-pill px-3 py-1.5 rounded-xl text-xs font-extrabold text-white">
              {shelters.length} Safe Centers Open
            </span>
            <span className="crisync-photo-pill-indigo px-3 py-1.5 rounded-xl text-xs font-extrabold text-white">
              Wheelchair &amp; Medical Support
            </span>
          </div>
        </div>
      </div>

      <div className="bento-glass rounded-3xl p-5 sm:p-6 space-y-4 border border-indigo-500/25">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                AI Shelter Suitability Recommender
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Match Vulnerable Families to Optimal Safe Shelters
              </h2>
              <p className="text-xs text-zinc-400">
                Select an open help request below to score shelters by capacity, proximity, medical room, and wheelchair accessibility.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={activeMatchRequestId}
              onChange={(e) => setMatchRequestId(e.target.value)}
              className="rsvp-input text-xs sm:min-w-[260px]"
            >
              {requests.length === 0 ? (
                <option value="">No open help requests loaded</option>
              ) : (
                requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.referenceCode} — {r.title} ({r.affectedPeopleCount || r.peopleAffectedCount || 1} affected)
                  </option>
                ))
              )}
            </select>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={!activeMatchRequestId || loadingRecommendations}
              onClick={handleFindRecommendedShelters}
              className="keep-white px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loadingRecommendations ? 'Analyzing...' : 'Get AI Shelter Match'}</span>
            </motion.button>
          </div>
        </div>

        {shelterRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {shelterRecommendations.map((rec: any) => {
              const matchedReq = requests.find((r) => r.id === activeMatchRequestId);
              return (
                <div
                  key={rec.shelterId}
                  className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-white text-sm">{rec.shelterName}</span>
                      <span className="font-mono font-extrabold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/40 shrink-0">
                        {rec.suitabilityScore}/100
                      </span>
                    </div>
                    <p className="text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{rec.distanceKm} km away • {rec.availableSpots} spots open</span>
                    </p>
                    <p className="text-zinc-200 leading-relaxed">{rec.recommendationReason}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.isWheelchairAccessible && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                          Wheelchair Ready
                        </span>
                      )}
                      {rec.hasMedicalFacility && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Medical Room
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShelterId(rec.shelterId);
                      setLinkedRequestId(activeMatchRequestId);
                      if (matchedReq) {
                        setHouseholdName(`${matchedReq.title?.slice(0, 32) || matchedReq.referenceCode} Household`);
                        setMembersCount(Math.max(1, Number(matchedReq.affectedPeopleCount || matchedReq.peopleAffectedCount) || 1));
                        setNeedsAccessibility(Boolean(rec.isWheelchairAccessible));
                      }
                    }}
                    className="keep-white mt-2 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Select for Check-In</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bento-glass rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Safe Evacuation Centers
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  Open Relief Shelters & Available Spaces
                </h2>
                <p className="text-xs text-zinc-400">
                  Click any shelter card below to select it for family check-in on the right.
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300">
              {shelters.length} Open Shelters
            </span>
          </div>

          {shelters.length === 0 ? (
            <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/15 text-center text-xs text-zinc-400">
              No evacuation shelters registered yet. Use "Open a New Relief Shelter" on the right to register the first safe center.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shelters.map((s, index) => {
              const pct = Math.round((s.currentOccupancy / Math.max(1, s.totalCapacity)) * 100);
              const isNearFull = pct >= 90;
              const isSelected = activeSelectedShelterId === s.id;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(index * 0.05, 0.2) }}
                  whileHover={{ y: -2 }}
                  key={s.id}
                  onClick={() => setShelterId(s.id)}
                    className={`cursor-pointer p-5 rounded-3xl border space-y-3.5 transition-all ${isSelected
                      ? 'bg-indigo-500/10 border-2 border-indigo-500 shadow-glow'
                      : 'bg-white/[0.025] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-extrabold text-white leading-snug">{s.name}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shrink-0">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </p>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, pct)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full crisync-shimmer-bar ${isNearFull
                          ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>
                      Filled:{' '}
                      <strong className="font-mono text-white">
                        {s.currentOccupancy} / {s.totalCapacity}
                      </strong>{' '}
                      ({pct}%)
                    </span>
                    <span className="font-bold text-emerald-300">
                      {s.totalCapacity - s.currentOccupancy} spaces left
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-white/[0.07] text-xs">
                    <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold border ${s.isWheelchairAccessible
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : 'bg-white/5 text-zinc-500 border-white/10'
                      }`}
                    >
                      Wheelchair Ramp: <strong>{s.isWheelchairAccessible ? 'Yes' : 'No'}</strong>
                    </span>
                    <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold border ${s.hasMedicalFacility
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-zinc-500 border-white/10'
                      }`}
                    >
                      Medical Room: <strong>{s.hasMedicalFacility ? 'Yes' : 'No'}</strong>
                    </span>
                    {canRegisterShelter && onRequestShelterSupplies && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSupplyModalShelterId(supplyModalShelterId === s.id ? null : s.id);
                        }}
                        className="ml-auto px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-[11px]"
                      >
                        Request Supplies
                      </button>
                    )}
                  </div>
                  {canRegisterShelter && onRequestShelterSupplies && supplyModalShelterId === s.id && (
                    <form
                      onClick={(e) => e.stopPropagation()}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!supplyResourceName.trim()) return;
                        await onRequestShelterSupplies(s.id, {
                          category: supplyCategory,
                          resourceName: supplyResourceName,
                          quantityNeeded: Number(supplyQty),
                          justification: supplyJustification || 'Shelter occupancy resupply needed'
                        });
                        setSupplyResourceName('');
                        setSupplyJustification('');
                        setSupplyModalShelterId(null);
                      }}
                      className="p-3 rounded-2xl bg-black/30 border border-indigo-500/35 space-y-2 text-xs"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={supplyCategory}
                          onChange={(e) => setSupplyCategory(e.target.value)}
                          className="rsvp-input"
                        >
                          <option value="Food">Food</option>
                          <option value="WaterAndSanitation">Clean Water</option>
                          <option value="Medicine">Medicine</option>
                          <option value="TemporaryShelter">Shelter Supplies</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          required
                          value={supplyQty}
                          onChange={(e) => setSupplyQty(Number(e.target.value))}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={supplyResourceName}
                        onChange={(e) => setSupplyResourceName(e.target.value)}
                        placeholder="Needed item (e.g., Hygiene & Sleeping Kits)"
                        className="rsvp-input"
                      />
                      <input
                        type="text"
                        required
                        value={supplyJustification}
                        onChange={(e) => setSupplyJustification(e.target.value)}
                        placeholder="Reason (e.g., New evacuees arriving)"
                        className="rsvp-input"
                      />
                      <button
                        type="submit"
                        className="keep-white w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                      >
                        Send Supply Escalation
                      </button>
                    </form>
                  )}
                </motion.div>
              );
            })}
            </div>
          )}

          {allocations.length > 0 && (
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Active Shelter Check-Ins &amp; Household Discharge
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Discharge checked-in families once safe to release shelter capacity back to the live pool.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                  {allocations.filter((a) => a.allocationStatus !== 'CheckedOut').length} Checked-In Households
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {allocations.slice(0, 12).map((alloc: any) => {
                  const shelterObj = shelters.find((s) => s.id === alloc.shelterId);
                  const isCheckedOut = alloc.allocationStatus === 'CheckedOut';
                  return (
                    <div
                      key={alloc.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isCheckedOut
                          ? 'bg-white/[0.015] border-white/[0.06] opacity-70'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white truncate">{alloc.householdName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCheckedOut
                                ? 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400'
                                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            {alloc.allocationStatus}
                          </span>
                        </div>
                        <p className="text-zinc-400 truncate">
                          {shelterObj?.name || 'Relief Shelter'} • <strong className="text-zinc-200">{alloc.allocatedMembersCount} members</strong>
                          {alloc.requiresAccessibility ? ' • Wheelchair Space' : ''}
                        </p>
                      </div>
                      {!isCheckedOut && onCheckoutShelterAllocation && (canRegisterShelter || userRole === 'CaseManager') && (
                        <button
                          type="button"
                          onClick={() => onCheckoutShelterAllocation(alloc.id, alloc.householdName)}
                          className="keep-white px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 transition shadow-sm"
                        >
                          Discharge / Check-Out
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="bento-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.08]">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Quick Family Check-In
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Check In a Family to a Shelter
                </h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">1. Choose Shelter</label>
                <select
                  value={activeSelectedShelterId}
                  onChange={(e) => setShelterId(e.target.value)}
                  className="rsvp-input"
                >
                  {shelters.length === 0 && (
                    <option value="">No shelters registered yet</option>
                  )}
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.totalCapacity - s.currentOccupancy} spaces open)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">2. Family / Household Name</label>
                <input
                  type="text"
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="Enter family or household reference name"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: Silva Family (Ward 04) or Case #REQ-1002
                </p>
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">3. Number of Family Members</label>
                <input
                  type="number"
                  min={1}
                  value={membersCount}
                  onChange={(e) => setMembersCount(Number(e.target.value))}
                  className="rsvp-input font-mono"
                />
              </div>
              <label className="flex items-center gap-2.5 text-zinc-200 font-semibold cursor-pointer p-3 rounded-2xl bg-black/20 border border-white/10">
                <input
                  type="checkbox"
                  checked={needsAccessibility}
                  onChange={(e) => setNeedsAccessibility(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-indigo-500"
                />
                Family needs a wheelchair-accessible shelter
              </label>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!activeSelectedShelterId}
                className="keep-white w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                <span>Check In Family Now</span>
              </motion.button>
            </form>
          </div>

          {canRegisterShelter && (
            <div className="bento-glass rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.08]">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Open a New Relief Shelter
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Add a school, hall, or temple to the shelter network
                  </p>
                </div>
              </div>
              <form onSubmit={handleCreateNewShelter} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Shelter Name</label>
                  <input
                    type="text"
                    required
                    value={newShelterName}
                    onChange={(e) => setNewShelterName(e.target.value)}
                    placeholder="Official evacuation centre name"
                    className="rsvp-input"
                  />
                  <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                    Example: Central College Evacuation Complex
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Location / Address</label>
                  <input
                    type="text"
                    required
                    value={newShelterAddress}
                    onChange={(e) => setNewShelterAddress(e.target.value)}
                    placeholder="Street address and district"
                    className="rsvp-input"
                  />
                  <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                    Example: 120 Highlevel Road, Safe Ground Zone
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Capacity</label>
                    <input
                      type="number"
                      min={10}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newLat}
                      onChange={(e) => setNewLat(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newLon}
                      onChange={(e) => setNewLon(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400/75 opacity-75 -mt-1 font-normal">
                  Example: Max occupancy (200) and GPS coordinates (6.9271, 79.8612) for shelter proximity scoring
                </p>
                <div className="flex flex-wrap gap-4 p-3 rounded-2xl bg-black/20 border border-white/10">
                  <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWheelchair}
                      onChange={(e) => setNewWheelchair(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-emerald-500"
                    />
                    Wheelchair Accessible
                  </label>
                  <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMedical}
                      onChange={(e) => setNewMedical(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-emerald-500"
                    />
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    Medical Room On-Site
                  </label>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="keep-white w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Register New Shelter</span>
                </motion.button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VolunteersTab: React.FC<{
  userRole?: string;
  currentUserId?: string;
  volunteers: any[];
  assignments: any[];
  requests?: any[];
  volunteerMatches: any[];
  onMatchVolunteers: (skill: string) => Promise<void>;
  onAssignVolunteer: (volunteerId: string, taskTitle: string, skill: string, assistanceRequestId?: string | null) => Promise<void>;
  onVerifyActivateVolunteer?: (volunteerId: string, fullName: string) => Promise<void>;
  onUpdateMyAvailability?: (payload: { isAvailable: boolean; availabilitySchedule: string }) => Promise<void>;
  onRespondAssignment?: (assignmentId: string, decision: string, notes?: string) => Promise<void>;
  onCompleteAssignment?: (assignmentId: string, completionNotes: string) => Promise<void>;
  onRegisterVolunteer: (payload: {
    fullName: string;
    skillsCsv: string;
    languagesCsv: string;
    availabilitySchedule: string;
    baseTown: string;
    baseLatitude?: number;
    baseLongitude?: number;
  }) => Promise<void>;
}> = ({
  userRole = 'VolunteerCoordinator',
  currentUserId,
  volunteers,
  assignments,
  requests = [],
  volunteerMatches,
  onMatchVolunteers,
  onAssignVolunteer,
  onVerifyActivateVolunteer,
  onUpdateMyAvailability,
  onRespondAssignment,
  onCompleteAssignment,
  onRegisterVolunteer
}) => {
  const canVerifyVolunteers =
    userRole === 'VolunteerCoordinator' ||
    userRole === 'EmergencyCoordinator' ||
    userRole === 'OrganizationAdmin' ||
    userRole === 'SystemAdmin';
  const myVolunteerProfile = currentUserId
    ? volunteers.find((v: any) => v.userId === currentUserId)
    : undefined;
  const [myIsAvailable, setMyIsAvailable] = useState(myVolunteerProfile?.isAvailable ?? true);
  const [mySchedule, setMySchedule] = useState(myVolunteerProfile?.availabilitySchedule || '24/7 Emergency Standby');
  const [completionNotesMap, setCompletionNotesMap] = useState<Record<string, string>>({});
  const pendingVolunteers = volunteers.filter((v: any) => !v.isVerified);
  const [skillFilter, setSkillFilter] = useState('Medicine');
  const [taskTitle, setTaskTitle] = useState('');
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [volFullName, setVolFullName] = useState('');
  const [volSkillsCsv, setVolSkillsCsv] = useState('');
  const [volLanguagesCsv, setVolLanguagesCsv] = useState('');
  const [volAvailability, setVolAvailability] = useState('');
  const [volBaseTown, setVolBaseTown] = useState('');
  const [volLat, setVolLat] = useState(6.9271);
  const [volLon, setVolLon] = useState(79.8612);

  const displayedVolunteers = volunteerMatches.length > 0 ? volunteerMatches : volunteers;
  const quickSkills = [
    { id: 'Medicine', label: 'Medical & Nursing' },
    { id: 'SearchAndRescue', label: 'Search & Rescue' },
    { id: 'BoatOperation', label: 'Boat Operator' },
    { id: 'FirstAid', label: 'First Aid' },
    { id: 'Logistics', label: 'Supply Delivery' }
  ];

  const handleVolunteerRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volFullName.trim() || !volSkillsCsv.trim()) return;
    await onRegisterVolunteer({
      fullName: volFullName,
      skillsCsv: volSkillsCsv,
      languagesCsv: volLanguagesCsv,
      availabilitySchedule: volAvailability,
      baseTown: volBaseTown,
      baseLatitude: Number(volLat),
      baseLongitude: Number(volLon)
    });
    setVolFullName('');
    setVolSkillsCsv('');
    setVolLanguagesCsv('');
    setVolAvailability('');
    setVolBaseTown('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bento-glass rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Smart Volunteer Matching
            </span>
            <h2 className="text-lg font-extrabold text-white">
              Find Volunteers by Skill & Distance
            </h2>
            <p className="text-xs text-zinc-400">
              Click a skill button below to rank available volunteers by their training and closeness to the flood zone.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-2">
            1. Click a skill to find matching volunteers:
          </label>
          <div className="flex flex-wrap gap-2">
            {quickSkills.map((sk) => (
              <button
                key={sk.id}
                type="button"
                onClick={() => {
                  setSkillFilter(sk.id);
                  onMatchVolunteers(sk.id);
                }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${skillFilter === sk.id
                    ? 'bg-indigo-600 border-indigo-500 text-white keep-white shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                {sk.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Or type any skill (e.g., Medicine, Boat)"
              className="rsvp-input pl-10"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onMatchVolunteers(skillFilter)}
            className="keep-white px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Search Volunteers</span>
          </motion.button>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1">
            2. Field Task to Assign:
          </label>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Describe field assignment mission before clicking Assign"
            className="rsvp-input"
          />
          <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
            Example: Deliver emergency medical kits to Sector B clinic
          </p>
        </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              3. Link to Specific Emergency Assistance Case (Optional):
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="rsvp-input py-2 text-xs"
            >
              <option value="">General Field Mission (Unlinked to specific case)</option>
              {requests.map((req: any) => (
                <option key={req.id} value={req.id}>
                  Case {req.trackingCode || req.id.slice(0, 8)}: {req.title} ({req.district || 'Zone'})
                </option>
              ))}
            </select>
          </div>

        <div className="space-y-3">
          {pendingVolunteers.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Pending Volunteer Registrations ({pendingVolunteers.length})
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    Self-registered volunteers start with Pending status and require Volunteer Coordinator verification to activate their account.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {pendingVolunteers.map((pv: any) => (
                  <div
                    key={pv.id}
                    className="p-3 rounded-xl bg-black/25 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-white">{pv.fullName}</p>
                      <p className="text-[11px] text-zinc-400">
                        Skills: {pv.skillsCsv} • Schedule: {pv.availabilitySchedule}
                      </p>
                    </div>
                    {canVerifyVolunteers && onVerifyActivateVolunteer ? (
                      <button
                        type="button"
                        onClick={() => onVerifyActivateVolunteer(pv.id, pv.fullName)}
                        className="keep-white px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Activate Account</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold">
                        Pending Coordinator Verification
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayedVolunteers.length === 0 && (
            <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/15 text-center text-xs text-zinc-400">
              No volunteers registered in the roster yet. Register a volunteer using the form on the right.
            </div>
          )}
          {displayedVolunteers.map((v: any, idx: number) => (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
              key={v.volunteerProfileId || v.id}
              className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs hover:border-white/20 transition"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-white text-sm">{v.fullName}</p>
                  {v.isVerified ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold">
                      Verified & Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-300 text-[10px] font-bold">
                      Pending Verification
                    </span>
                  )}
                </div>
                <p className="text-zinc-400">
                  Verified Skills: <span className="font-semibold text-zinc-200">{v.skillsCsv}</span>
                </p>
                {(v.availabilitySchedule || v.languagesCsv || v.baseTown) && (
                  <p className="text-zinc-400 flex flex-wrap items-center gap-2 text-[11px]">
                    {v.availabilitySchedule && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{v.availabilitySchedule}</span>
                      </span>
                    )}
                    {v.languagesCsv && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        <span>{v.languagesCsv}</span>
                      </span>
                    )}
                    {v.baseTown && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{v.baseTown}</span>
                      </span>
                    )}
                  </p>
                )}
                {v.matchExplanation && (
                  <p className="text-indigo-200 font-semibold bg-indigo-500/15 px-3 py-1 rounded-xl border border-indigo-500/30 inline-block">
                    Match Score: <strong className="font-mono text-white">{v.matchScore}/100</strong> — {v.matchExplanation}
                  </p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  onAssignVolunteer(
                    v.volunteerProfileId || v.id,
                    taskTitle.trim() || `Emergency ${skillFilter} Field Deployment`,
                      skillFilter,
                      selectedCaseId || null
                  )
                }
                className="keep-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign to Task</span>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5 space-y-5">
        <div className="bento-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                Volunteer Onboarding
              </span>
              <h3 className="text-base font-extrabold text-white">
                Register New Volunteer & Availability Schedule
              </h3>
            </div>
          </div>

          <form onSubmit={handleVolunteerRegistration} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={volFullName}
                onChange={(e) => setVolFullName(e.target.value)}
                placeholder="Volunteer full name"
                className="rsvp-input"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                required
                value={volSkillsCsv}
                onChange={(e) => setVolSkillsCsv(e.target.value)}
                placeholder="Enter verified field skills"
                className="rsvp-input"
              />
              <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                Example: FirstAid, Medicine, SearchAndRescue, BoatOperation, Logistics
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Spoken Languages</label>
                <input
                  type="text"
                  value={volLanguagesCsv}
                  onChange={(e) => setVolLanguagesCsv(e.target.value)}
                  placeholder="Languages spoken"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: English, Sinhala, Tamil
                </p>
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Base Town / District</label>
                <input
                  type="text"
                  value={volBaseTown}
                  onChange={(e) => setVolBaseTown(e.target.value)}
                  placeholder="Home dispatch district"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: Colombo / Kandy
                </p>
              </div>
            </div>
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Availability Schedule</label>
              <input
                type="text"
                required
                value={volAvailability}
                onChange={(e) => setVolAvailability(e.target.value)}
                placeholder="Deployment shift hours"
                className="rsvp-input"
              />
              <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                Example: Weekdays 18:00-06:00 & Weekends (or 24/7 On-Call)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">GPS Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={volLat}
                  onChange={(e) => setVolLat(Number(e.target.value))}
                  className="rsvp-input font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">GPS Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={volLon}
                  onChange={(e) => setVolLon(Number(e.target.value))}
                  className="rsvp-input font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400/75 opacity-75 -mt-1 font-normal">
              Example: Decimal GPS coordinates (6.9271, 79.8612) for distance matching
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="keep-white w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Volunteer to Roster</span>
            </motion.button>
          </form>
        </div>

        <div className="bento-glass rounded-3xl p-5 sm:p-6 h-fit space-y-4">
          {myVolunteerProfile && onUpdateMyAvailability && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdateMyAvailability({
                  isAvailable: myIsAvailable,
                  availabilitySchedule: mySchedule
                });
              }}
              className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-indigo-300 uppercase tracking-wider text-[11px]">
                  My Field Availability ({myVolunteerProfile.fullName})
                </span>
                <span className="font-mono text-emerald-300 font-bold">
                  Completed: {myVolunteerProfile.CompletedTasksCount ?? myVolunteerProfile.completedTasksCount ?? 0}
                </span>
              </div>
              <label className="flex items-center gap-2 font-semibold text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={myIsAvailable}
                  onChange={(e) => setMyIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Available for immediate emergency dispatch
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={mySchedule}
                  onChange={(e) => setMySchedule(e.target.value)}
                  placeholder="Availability hours"
                  className="rsvp-input flex-1"
                />
                <button
                  type="submit"
                  className="keep-white px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Assigned Volunteer Tasks</h3>
                <p className="text-xs text-zinc-400">Active field deployments</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
              {assignments.length} Assigned
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {assignments.length === 0 && (
              <p className="text-zinc-400 py-3 text-center">
                No volunteer task deployments recorded yet.
              </p>
            )}
            {assignments.map((a) => {
              const canActOnTask = canVerifyVolunteers || (myVolunteerProfile && a.volunteerProfileId === myVolunteerProfile.id);
              return (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.08] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-white text-sm">{a.taskTitle}</p>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 flex flex-wrap items-center gap-2">
                    <span>
                      Skill Used: <strong className="text-zinc-200">{a.requiredSkill}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-purple-300 font-bold">
                      AI Match {a.aiMatchScore}/100
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-mono text-indigo-300">
                      <MapPin className="w-3.5 h-3.5" />
                      {a.distanceKm} km travel distance
                    </span>
                  </p>
                  {a.completionNotes && (
                    <p className="text-[11px] text-emerald-200 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/25">
                      Notes: {a.completionNotes}
                    </p>
                  )}
                  {canActOnTask && a.status === 'Assigned' && onRespondAssignment && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onRespondAssignment(a.id, 'Accepted', 'Volunteer accepted field mission')}
                        className="keep-white px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        Accept Mission
                      </button>
                      <button
                        type="button"
                        onClick={() => onRespondAssignment(a.id, 'Declined', 'Unavailable for this dispatch window')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/35 text-rose-200 font-bold"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {canActOnTask && (a.status === 'Assigned' || a.status === 'Accepted') && onCompleteAssignment && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        type="text"
                        value={completionNotesMap[a.id] || ''}
                        onChange={(e) => setCompletionNotesMap((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        placeholder="Delivery / handoff summary note"
                        className="rsvp-input flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onCompleteAssignment(
                            a.id,
                            completionNotesMap[a.id]?.trim() || 'Field relief task completed cleanly'
                          )
                        }
                        className="keep-white px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface RecordDonationPayload {
  campaignId: string;
  donorName: string;
  donationType: 'Monetary' | 'Material';
  monetaryAmountUsd: number;
  materialDescription: string;
  materialQuantity: number;
  allocationPurpose: string;
  sandboxCardLastFour: string;
}

export const DonationsTab: React.FC<{
  userRole: string;
  crises?: any[];
  campaigns: any[];
  donations: any[];
  transparencyReport?: any;
  onCreateCampaign?: (payload: { title: string; crisisEventId?: string; targetAmountUsd: number }) => Promise<void>;
  onRecordDonation: (payload: RecordDonationPayload) => Promise<void>;
  onApproveFlaggedDonation: (id: string) => Promise<void>;
  onRejectFlaggedDonation?: (id: string) => Promise<void>;
  onRecordExpenditure?: (campaignId: string, payload: { amountUsd: number; category: string; description: string }) => Promise<void>;
}> = ({
  );
};
