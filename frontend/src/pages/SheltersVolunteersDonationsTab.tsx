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
  userRole,
  crises = [],
  campaigns,
  donations,
  transparencyReport,
  onCreateCampaign,
  onRecordDonation,
  onApproveFlaggedDonation,
  onRejectFlaggedDonation,
  onRecordExpenditure
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || '');
  const [donationType, setDonationType] = useState<'Monetary' | 'Material'>('Monetary');
  const [donorName, setDonorName] = useState('');
  const [amountUsd, setAmountUsd] = useState(250);
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState(50);
  const [purpose, setPurpose] = useState('');
  const [cardLastFour, setCardLastFour] = useState('4242');

  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignCrisisId, setCampaignCrisisId] = useState(crises[0]?.id || '');
  const [campaignTargetUsd, setCampaignTargetUsd] = useState(50000);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [expCampaignId, setExpCampaignId] = useState('');
  const [expAmountUsd, setExpAmountUsd] = useState(2500);
  const [expCategory, setExpCategory] = useState('MedicalSupplies');
  const [expDescription, setExpDescription] = useState('');

  const activeCampaignId = selectedCampaignId || campaigns[0]?.id || '';

  const canApproveCompliance =
    userRole === 'DonorOfficer' ||
    userRole === 'EmergencyCoordinator' ||
    userRole === 'SystemAdmin';

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateCampaign || !campaignTitle.trim()) return;
    setCreatingCampaign(true);
    await onCreateCampaign({
      title: campaignTitle,
      crisisEventId: campaignCrisisId || crises[0]?.id || undefined,
      targetAmountUsd: Number(campaignTargetUsd)
    });
    setCampaignTitle('');
    setCreatingCampaign(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRecordDonation({
      campaignId: activeCampaignId,
      donorName,
      donationType,
      monetaryAmountUsd: donationType === 'Monetary' ? Number(amountUsd) : 0,
      materialDescription: donationType === 'Material' ? materialDescription : '',
      materialQuantity: donationType === 'Material' ? Math.max(1, Number(materialQuantity) || 1) : 0,
      allocationPurpose: purpose,
      sandboxCardLastFour: donationType === 'Monetary' ? cardLastFour || '4242' : '0000'
    });
    setDonorName('');
    setMaterialDescription('');
    setPurpose('');
  };

  const presetAmounts = [250, 2500, 10000, 50000];

  return (
    <div className="space-y-6">
      {(canApproveCompliance || campaigns.length === 0) && onCreateCampaign && (
        <div className="bento-glass rounded-3xl p-5 sm:p-6 border border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                Campaign Administration
              </span>
              <h2 className="text-base font-extrabold text-white">
                Launch New Relief Fundraising Campaign
              </h2>
            </div>
          </div>

          {canApproveCompliance ? (
            <form onSubmit={handleCampaignSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-start">
              <div className="md:col-span-5">
                <label className="block font-bold text-zinc-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="Official fundraising appeal name"
                  className="rsvp-input"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: Emergency Medical & Clean Water Relief Fund 2026
                </p>
              </div>
              <div className="md:col-span-3">
                <label className="block font-bold text-zinc-300 mb-1">Linked Crisis (Optional)</label>
                <select
                  value={campaignCrisisId || crises[0]?.id || ''}
                  onChange={(e) => setCampaignCrisisId(e.target.value)}
                  className="rsvp-input"
                >
                  {crises.length === 0 && <option value="">General Emergency Fund</option>}
                  {crises.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-zinc-300 mb-1">Target Goal (USD)</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={campaignTargetUsd}
                  onChange={(e) => setCampaignTargetUsd(Number(e.target.value))}
                  className="rsvp-input font-mono"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: 50000
                </p>
              </div>
              <div className="md:col-span-2 md:pt-5">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={creatingCampaign}
                  className="keep-white w-full py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <span>{creatingCampaign ? 'Creating...' : 'Create Campaign'}</span>
                </motion.button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-amber-200 font-semibold">
              No fundraising campaigns have been launched yet. Sign in as a Donor Officer, Emergency Coordinator, or System Admin to open the first campaign.
            </p>
          )}
        </div>
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="bento-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-300 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                Transparent Relief Fundraising
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Active Relief Campaigns & Progress
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c: any) => {
              const pct = Math.min(
                100,
                Math.round(((c.collectedAmountUsd || 0) / Math.max(1, c.targetAmountUsd || 1)) * 100)
              );
              return (
                <motion.div
                  whileHover={{ y: -2 }}
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                    className={`cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent border text-xs transition-all group ${activeCampaignId === c.id
                      ? 'border-indigo-400 ring-2 ring-indigo-500/40'
                      : 'border-indigo-500/30'
                  }`}
                >
                  <div className="relative h-40 sm:h-44 overflow-hidden">
                    <img
                      src="/images/appeal-fundraising.jpg"
                      alt={`${c.title} community relief campaign`}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="crisync-photo-scrim absolute inset-0" />
                    <div className="keep-white absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="crisync-photo-pill-indigo px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white">
                        Verified Relief Appeal
                      </span>
                      <span className="crisync-photo-pill-emerald px-3 py-1 rounded-full text-white font-mono font-bold">
                        {pct}% Funded
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-extrabold text-white text-base">{c.title}</p>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{c.description}</p>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full crisync-shimmer-bar"
                      />
                    </div>
                    <div className="flex justify-between font-bold text-zinc-200 pt-1">
                      <span>
                        Raised So Far:{' '}
                        <strong className="font-mono text-emerald-300 text-sm">
                          ${(c.collectedAmountUsd || 0).toLocaleString()} USD
                        </strong>
                      </span>
                      <span>
                        Target Goal:{' '}
                        <strong className="font-mono text-white text-sm">
                          ${(c.targetAmountUsd || 0).toLocaleString()} USD
                        </strong>
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bento-glass rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {canApproveCompliance
                  ? 'Recorded Donations & Large Gift Compliance Approval'
                  : 'Recent Community & Partner Donations'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                High-value donations of $50,000 USD or above are automatically paused for human AML/KYC compliance review before release.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300">
              {donations.length} Donations
            </span>
          </div>

          <div className="space-y-3">
            {donations.length === 0 && (
              <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/15 text-center text-xs text-zinc-400">
                No donations logged yet. Launch a fundraising campaign above (if needed) and record the first contribution on the right.
              </div>
            )}
            {donations.map((d, idx) => {
              const isFlagged = d.isFlaggedSuspicious && !d.isReviewedByHuman;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: Math.min(idx * 0.05, 0.25) }}
                  key={d.id}
                    className={`p-4 rounded-2xl border text-xs transition-all ${isFlagged
                      ? 'crisync-critical-pulse bg-rose-500/10 border-rose-500/40'
                      : 'bg-white/[0.025] border-white/[0.08]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-white text-sm">{d.donorName}</span> —{' '}
                      {d.donationType === 'Material' ? (
                        <span className="font-mono font-extrabold text-amber-300 text-sm">
                          {d.materialQuantity} × {d.materialDescription} (In-Kind Material)
                        </span>
                      ) : (
                        <span className="font-mono font-extrabold text-emerald-300 text-sm">
                          ${Number(d.monetaryAmountUsd || 0).toLocaleString()} USD
                        </span>
                      )}
                      <p className="text-zinc-400 mt-1">
                        Designated For: <strong className="text-zinc-200">{d.allocationPurpose}</strong> • Receipt:{' '}
                        <span className="font-mono text-indigo-300">{d.paymentGatewayReference}</span>
                      </p>
                      {d.isFlaggedSuspicious && (
                        <p className="text-rose-300 mt-1.5 font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          Large Gift Check (&ge;$50,000): {d.suspiciousReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-zinc-200 font-bold">
                        {d.verificationStatus}
                      </span>
                      {canApproveCompliance && isFlagged && (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onApproveFlaggedDonation(d.id)}
                            className="keep-white px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve</span>
                          </motion.button>
                          {onRejectFlaggedDonation && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => onRejectFlaggedDonation(d.id)}
                              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-extrabold flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </motion.button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 bento-glass rounded-3xl p-5 sm:p-6 h-fit">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Make or Record a Donation
              </h3>
              <p className="text-xs text-zinc-400">
                Log verified monetary gifts ($50,000+ triggers compliance review) or pledge in-kind material supplies.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-zinc-300 mb-1">1. Target Relief Campaign</label>
              <select
                value={activeCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="rsvp-input"
              >
                {campaigns.length === 0 ? (
                  <option value="">No active campaigns yet</option>
                ) : (
                  campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1.5">2. Contribution Type</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
                <button
                  type="button"
                  onClick={() => setDonationType('Monetary')}
                    className={`py-2 px-3 rounded-xl font-extrabold transition ${donationType === 'Monetary'
                      ? 'bg-emerald-600 text-white keep-white shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Monetary (USD)
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('Material')}
                    className={`py-2 px-3 rounded-xl font-extrabold transition ${donationType === 'Material'
                      ? 'bg-amber-600 text-white keep-white shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Material (In-Kind)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">3. Donor or Organization Name</label>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Individual donor or sponsoring organization"
                className="rsvp-input"
              />
              <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                Example: Community Relief Trust or Private Corporate Sponsor
              </p>
            </div>

            {donationType === 'Monetary' ? (
              <>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1.5">4. Quick Amount (USD)</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountUsd(amt)}
                          className={`py-2 rounded-xl font-mono font-bold border transition ${amountUsd === amt
                            ? 'bg-emerald-600 border-emerald-500 text-white keep-white'
                            : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                        }`}
                      >
                        ${amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-zinc-300 mb-1">Amount (USD)</label>
                    <input
                      type="number"
                      min={10}
                      required
                      value={amountUsd}
                      onChange={(e) => setAmountUsd(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Card Last 4</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLastFour}
                      onChange={(e) => setCardLastFour(e.target.value)}
                      className="rsvp-input font-mono"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-zinc-300 mb-1">4. Item / Supply Description</label>
                  <input
                    type="text"
                    required
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    placeholder="e.g., Hygiene Kits, Blankets, Water Pumps"
                    className="rsvp-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={materialQuantity}
                    onChange={(e) => setMaterialQuantity(Number(e.target.value))}
                    className="rsvp-input font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-zinc-300 mb-1">5. Designated Relief Purpose</label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Specify intended relief allocation"
                className="rsvp-input"
              />
              <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                Example: Emergency Medical & Drinking Water Logistics
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!activeCampaignId}
              className="keep-white w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>{donationType === 'Material' ? 'Record Material Pledge' : 'Record Donation Now'}</span>
            </motion.button>
          </form>
        </div>
      </div>

      {(transparencyReport || (canApproveCompliance && onRecordExpenditure && campaigns.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`${canApproveCompliance && onRecordExpenditure && campaigns.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} bento-glass rounded-3xl p-5 sm:p-6 space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Financial Accountability Ledger
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Donor Fund Transparency &amp; Utilisation Report
                </h3>
              </div>
              {transparencyReport && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                  Verified: {transparencyReport.verifiedDonationsCount} • Pending: {transparencyReport.pendingFlaggedDonationsCount} • Rejected: {transparencyReport.rejectedDonationsCount}
                </span>
              )}
            </div>

            {transparencyReport && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10">
                    <span className="text-zinc-400 font-bold block">Total Collected</span>
                    <strong className="font-mono text-lg text-emerald-300">
                      ${Number(transparencyReport.totalCollectedUsd || 0).toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10">
                    <span className="text-zinc-400 font-bold block">Disbursed on Relief</span>
                    <strong className="font-mono text-lg text-indigo-300">
                      ${Number(transparencyReport.totalDisbursedUsd || 0).toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10">
                    <span className="text-zinc-400 font-bold block">Remaining Balance</span>
                    <strong className="font-mono text-lg text-amber-300">
                      ${Number(transparencyReport.totalRemainingUsd || 0).toLocaleString()} USD
                    </strong>
                  </div>
                </div>

                {Object.entries(transparencyReport.expenditureByCategory || {}).length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-2 text-xs">
                    <p className="font-bold text-zinc-200">Expenditure Breakdown by Sector</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(transparencyReport.expenditureByCategory || {}).map(([cat, amt]) => (
                        <div key={cat} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/10">
                          <span className="text-zinc-300 font-semibold">{cat}</span>
                          <span className="font-mono font-bold text-emerald-300">${Number(amt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 text-xs">
                  {(transparencyReport.campaigns || []).map((c: any) => (
                    <div key={c.campaignId} className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.08] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-white">{c.title}</span>
                        <span className="font-mono text-indigo-300 font-bold">
                          {c.utilisationPercentage}% Disbursed (${Number(c.disbursedAmountUsd).toLocaleString()} / ${Number(c.collectedAmountUsd).toLocaleString()})
                        </span>
                      </div>
                      {(c.expenditures || []).map((exp: any) => (
                        <div key={exp.id} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-300 bg-black/20 px-3 py-2 rounded-xl border border-white/[0.06]">
                          <span>
                            <strong className="text-emerald-300">[{exp.category}]</strong> {exp.description}
                          </span>
                          <span className="font-mono font-bold text-white">
                            -${Number(exp.amountUsd).toLocaleString()} USD • {exp.recordedByUserName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {canApproveCompliance && onRecordExpenditure && campaigns.length > 0 && (
            <div className="lg:col-span-4 bento-glass rounded-3xl p-5 sm:p-6 h-fit space-y-3.5 text-xs">
              <div className="pb-3 border-b border-white/[0.08]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                  Disbursement Audit Control
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Record Relief Expenditure
                </h3>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const targetCamp = expCampaignId || campaigns[0]?.id;
                  if (!targetCamp || !expDescription.trim()) return;
                  await onRecordExpenditure(targetCamp, {
                    amountUsd: Number(expAmountUsd),
                    category: expCategory,
                    description: expDescription
                  });
                  setExpDescription('');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Campaign</label>
                  <select
                    value={expCampaignId || campaigns[0]?.id || ''}
                    onChange={(e) => setExpCampaignId(e.target.value)}
                    className="rsvp-input"
                  >
                    {campaigns.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Category</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="rsvp-input"
                    >
                      <option value="MedicalSupplies">Medical Supplies</option>
                      <option value="FoodAndWaterLogistics">Food &amp; Water</option>
                      <option value="ShelterOperations">Shelter Operations</option>
                      <option value="SearchAndRescue">Search &amp; Rescue</option>
                      <option value="ReliefOperations">Relief Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Amount (USD)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={expAmountUsd}
                      onChange={(e) => setExpAmountUsd(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Expenditure Description</label>
                  <textarea
                    rows={2}
                    required
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="Supplier invoice or field distribution purpose"
                    className="rsvp-input resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="keep-white w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-sm"
                >
                  Approve &amp; Record Disbursement
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ADMIN_EDITABLE_ROLES = [
  'Citizen',
  'Donor',
  'Volunteer',
  'EmergencyCoordinator',
  'CaseManager',
  'LogisticsManager',
  'ShelterAdmin',
  'VolunteerCoordinator',
  'DonorOfficer',
  'PartnerOfficer',
  'OrganizationAdmin',
  'SystemAdmin'
];

const CRISIS_TYPES = ['Flood', 'Landslide', 'Earthquake', 'SevereStorm', 'DiseaseOutbreak', 'MassDisplacement', 'Other'];
const CRISIS_SEVERITIES = ['Low', 'Moderate', 'High', 'Critical', 'Catastrophic'];
const RESOURCE_CATEGORIES = ['Food', 'Medicine', 'TemporaryShelter', 'Transportation', 'AccessibilityAssistance', 'WaterAndSanitation', 'SearchAndRescue', 'MedicalEvacuation'];
const SHELTER_STATUSES = ['Operational', 'AtCapacity', 'Maintenance', 'Closed'];

const SystemAdminControlCenter: React.FC<{
  userRole: string;
  adminUsers: any[];
  currentUserId?: string;
  organisations: any[];
  crises: any[];
  shelters: any[];
  resources: any[];
  requests: any[];
  volunteers: any[];
  campaigns: any[];
  adminPartnerships?: any[];
  rolePermissions?: any[];
  systemConfig?: any;
  serviceSettings?: any;
  onAdminCreateUser?: (payload: any) => Promise<any>;
  onInviteStaff?: (payload: any) => Promise<any>;
  onAdminUpdateUser?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteUser?: (id: string, label: string) => Promise<void>;
  onApprovePartnership?: (orgId: string, orgName: string) => Promise<void>;
  onRejectPartnership?: (orgId: string, orgName: string) => Promise<void>;
  onAddRolePermission?: (payload: any) => Promise<void>;
  onDeleteRolePermission?: (id: string) => Promise<void>;
  onUpdateSystemConfig?: (payload: any) => Promise<void>;
  onUpdateServiceSettings?: (payload: any) => Promise<void>;
  onAdminUpdateCrisis?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteCrisis?: (id: string, label: string) => Promise<void>;
  onAdminUpdateShelter?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteShelter?: (id: string, label: string) => Promise<void>;
  onAdminUpdateResource?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteResource?: (id: string, label: string) => Promise<void>;
  onAdminDeleteRequest?: (id: string, label: string) => Promise<void>;
  onAdminDeleteVolunteer?: (id: string, label: string) => Promise<void>;
  onAdminDeleteCampaign?: (id: string, label: string) => Promise<void>;
}> = ({
  userRole,
  adminUsers,
  currentUserId,
  organisations,
  crises,
  shelters,
  resources,
  requests,
  volunteers,
  campaigns,
  adminPartnerships = [],
  rolePermissions = [],
  systemConfig,
  serviceSettings,
  onAdminCreateUser,
  onInviteStaff,
  onAdminUpdateUser,
  onAdminDeleteUser,
  onApprovePartnership,
  onRejectPartnership,
  onAddRolePermission,
  onDeleteRolePermission,
  onUpdateSystemConfig,
  onUpdateServiceSettings,
  onAdminUpdateCrisis,
  onAdminDeleteCrisis,
  onAdminUpdateShelter,
  onAdminDeleteShelter,
  onAdminUpdateResource,
  onAdminDeleteResource,
  onAdminDeleteRequest,
  onAdminDeleteVolunteer,
  onAdminDeleteCampaign
}) => {
  const isGlobalAdmin = userRole === 'SystemAdmin';
  const assignableRoles = ADMIN_EDITABLE_ROLES.filter(
    (r) => isGlobalAdmin || (r !== 'SystemAdmin' && r !== 'OrganizationAdmin' && r !== 'DonorOfficer')
  );

  const [adminTab, setAdminTab] = useState<
    'users' | 'partnerships' | 'permissions' | 'integrations' | 'config' | 'crises' | 'shelters' | 'resources' | 'requests' | 'volunteers' | 'campaigns'
  >('users');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<any>({});
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: isGlobalAdmin ? 'CaseManager' : 'CaseManager',
    organisationId: '',
    preferredLanguage: 'en'
  });
  const [sharedCredentials, setSharedCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
    role: string;
    invitationCode?: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [permForm, setPermForm] = useState({
    role: 'CaseManager',
    permissionCode: '',
    description: ''
  });
  const [configDraft, setConfigDraft] = useState<any>({
    minGlobalAdmins: 2,
    maxGlobalAdmins: 3,
    maxOrganizationAdmins: 3,
    requireVolunteerCoordinatorVerification: true,
    requirePartnerAdminApproval: true,
    highValueDonationThresholdUsd: 50000
  });
  const [serviceDraft, setServiceDraft] = useState<any>({
    aiProviderName: 'Azure OpenAI / Local Rule Fallback',
    aiModelName: 'crisync-triage-v2',
    aiConfidenceThreshold: 0.72,
    simulateExternalAiFailure: false,
    smsProviderName: 'Twilio Humanitarian Gateway',
    smsSenderId: 'CRISYNC',
    smsIdempotencyWindowMinutes: 60,
    simulateExternalNotificationFailure: false,
    emailSmtpProvider: 'SendGrid Relief Relay',
    emailSenderAddress: 'alerts@crisync.org',
    emailAlertsEnabled: true,
    mappingProviderName: 'OpenStreetMap / OSRM Routing',
    geocodingProviderName: 'Nominatim Disaster Geocode',
    simulateExternalMappingFailure: false
  });
  const [editingEntityKey, setEditingEntityKey] = useState<string | null>(null);
  const [entityDraft, setEntityDraft] = useState<any>({});
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [unlockedAdminFields, setUnlockedAdminFields] = useState<Record<string, boolean>>({});
  const unlockAdminField = (fieldKey: string) => {
    setUnlockedAdminFields((prev) => (prev[fieldKey] ? prev : { ...prev, [fieldKey]: true }));
  };

  useEffect(() => {
    if (systemConfig) {
      setConfigDraft(systemConfig);
    }
  }, [systemConfig]);

  useEffect(() => {
    if (serviceSettings) {
      setServiceDraft(serviceSettings);
    }
  }, [serviceSettings]);

  const activeGlobalAdminsCount = adminUsers.filter((u) => u.role === 'SystemAdmin' && u.isActive).length;
  const activeOrgAdminsCount = adminUsers.filter((u) => u.role === 'OrganizationAdmin' && u.isActive).length;
  const pendingPartnershipsCount = adminPartnerships.filter((p) => p.partnershipStatus === 'Pending').length;

  const runBusy = async (key: string, fn: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await fn();
    } finally {
      setBusyKey(null);
    }
  };

  const renderDeleteButton = (key: string, onConfirm: () => Promise<void>) => {
    if (confirmDeleteKey === key) {
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={busyKey === key}
            onClick={() =>
              runBusy(key, async () => {
                await onConfirm();
                setConfirmDeleteKey(null);
              })
            }
            className="keep-white px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold transition"
          >
            Confirm Remove
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteKey(null)}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-bold transition"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setConfirmDeleteKey(key)}
        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold inline-flex items-center gap-1 transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Remove</span>
      </button>
    );
  };

  const tabs = [
    { id: 'users' as const, label: `Users & Staff (${adminUsers.length})` },
    { id: 'partnerships' as const, label: `Partnerships (${pendingPartnershipsCount} Pending)` },
    { id: 'permissions' as const, label: `Roles & Permissions (${rolePermissions.length})` },
    { id: 'integrations' as const, label: 'AI, SMS, Email & Maps' },
    { id: 'config' as const, label: 'Core Config' },
    { id: 'crises' as const, label: `Crises (${crises.length})` },
    { id: 'shelters' as const, label: `Shelters (${shelters.length})` },
    { id: 'resources' as const, label: `Inventory (${resources.length})` },
    { id: 'requests' as const, label: `Requests (${requests.length})` },
    { id: 'volunteers' as const, label: `Volunteers (${volunteers.length})` },
    { id: 'campaigns' as const, label: `Campaigns (${campaigns.length})` }
  ];

  return (
    <div className="bento-glass rounded-3xl p-5 sm:p-6 space-y-5 border border-indigo-500/25">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <UserCog className="w-4 h-4" />
            {isGlobalAdmin ? 'Global System Administrator Control Center' : 'Organization Admin Control Center'}
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5">
            Staff Accounts, Partnerships, Role Permissions & System Integrations
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage operational staff, approve Partner Organizations, enforce the Small Admin Count Policy, configure roles/permissions, and manage AI, SMS, Email & Mapping services.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/35 text-xs font-bold text-violet-300 inline-flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          {userRole}
        </span>
      </div>

      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <p className="font-extrabold text-white">Small Number of Admins Policy</p>
          <p className="text-[11px] text-zinc-300 mt-0.5">
            Maintains at least {configDraft.minGlobalAdmins} active Global Admins so control is never lost during an emergency, while capping admins at {configDraft.maxGlobalAdmins} Global / {configDraft.maxOrganizationAdmins} Org Admins to minimize security attack risks.
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between">
          <span className="font-bold text-zinc-300">Global System Admins</span>
          <span className="font-mono font-extrabold text-emerald-300">
            {activeGlobalAdminsCount} / {configDraft.maxGlobalAdmins} (Min {configDraft.minGlobalAdmins})
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between">
          <span className="font-bold text-zinc-300">Organization Admins</span>
          <span className="font-mono font-extrabold text-fuchsia-300">
            {activeOrgAdminsCount} / {configDraft.maxOrganizationAdmins}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-black/25 border border-white/[0.08]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAdminTab(tab.id);
              setConfirmDeleteKey(null);
            }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${adminTab === tab.id
                ? 'bg-indigo-600 text-white keep-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === 'users' && (
        <div className="space-y-4">
          {onAdminCreateUser && (
            <div className="p-4 sm:p-5 rounded-2xl bg-violet-500/[0.08] border border-violet-500/30 space-y-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-violet-400" />
                    <span>Create New System Administrator or Role Account (Shareable Credentials)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Provision a new System Administrator or operational staff/citizen account and copy its credentials to share securely with another person.
                  </p>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px opacity-0 overflow-hidden"
              >
                <input type="text" name="prevent_admin_create_autofill_user" autoComplete="username" tabIndex={-1} defaultValue="" />
                <input type="password" name="prevent_admin_create_autofill_pass" autoComplete="current-password" tabIndex={-1} defaultValue="" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="crisync_admin_create_fullname"
                    autoComplete="off"
                    value={createUserForm.fullName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                    placeholder="Enter person's full name"
                    className="rsvp-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Email / Username</label>
                  <input
                    type="email"
                    name="crisync_admin_create_email"
                    autoComplete="off"
                    readOnly={!unlockedAdminFields.createEmail}
                    onFocus={() => unlockAdminField('createEmail')}
                    onMouseDown={() => unlockAdminField('createEmail')}
                    onKeyDown={() => unlockAdminField('createEmail')}
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    placeholder="new.admin@crisync.org"
                    className="rsvp-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="crisync_admin_create_phone"
                    autoComplete="off"
                    value={createUserForm.phoneNumber}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, phoneNumber: e.target.value })}
                    placeholder="+94 77 123 4567"
                    className="rsvp-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Initial Password</label>
                  <input
                    type="text"
                    name="crisync_admin_create_password"
                    autoComplete="new-password"
                    readOnly={!unlockedAdminFields.createPassword}
                    onFocus={() => unlockAdminField('createPassword')}
                    onMouseDown={() => unlockAdminField('createPassword')}
                    onKeyDown={() => unlockAdminField('createPassword')}
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="rsvp-input font-mono"
                  />
                  <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                    Example: Use a strong temporary password to share with the recipient
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Account Role</label>
                  <select
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                    className="rsvp-input"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r === 'SystemAdmin'
                          ? 'Global System Admin (Max 3)'
                          : r === 'OrganizationAdmin'
                            ? 'Organization Admin'
                            : r === 'DonorOfficer'
                              ? 'Donor / Funding Officer (Global Admin Only)'
                              : r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Organisation</label>
                  <select
                    value={createUserForm.organisationId}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, organisationId: e.target.value })}
                    disabled={createUserForm.role === 'Citizen' || createUserForm.role === 'Donor'}
                    className="rsvp-input disabled:opacity-50"
                  >
                    <option value="">Independent / None</option>
                    {organisations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-zinc-400">
                  {isGlobalAdmin
                    ? 'Global System Admin can invite operational staff, appoint Donor / Funding Officers (financial access), and manage Two-Tier Admins under the small-count policy.'
                    : 'Organization Admin can manage staff accounts for invited operational roles; only Global System Admin can appoint Donor / Funding Officers or new Admins.'}
                </span>
                <button
                  type="button"
                  disabled={
                    busyKey === 'create-admin-user' ||
                    !createUserForm.fullName.trim() ||
                    !createUserForm.email.trim() ||
                    createUserForm.password.trim().length < 6
                  }
                  onClick={() =>
                    runBusy('create-admin-user', async () => {
                      const capturedPassword = createUserForm.password;
                      const isInvitedOperational = ['CaseManager', 'ShelterAdmin', 'LogisticsManager', 'VolunteerCoordinator', 'DonorOfficer', 'EmergencyCoordinator'].includes(createUserForm.role);
                      const created = isInvitedOperational && onInviteStaff
                        ? await onInviteStaff({
                            fullName: createUserForm.fullName.trim(),
                            email: createUserForm.email.trim(),
                            phoneNumber: createUserForm.phoneNumber.trim(),
                            temporaryPassword: capturedPassword,
                            role: createUserForm.role,
                            organisationId: createUserForm.organisationId || null,
                            preferredLanguage: createUserForm.preferredLanguage
                          })
                        : await onAdminCreateUser({
                            fullName: createUserForm.fullName.trim(),
                            email: createUserForm.email.trim(),
                            phoneNumber: createUserForm.phoneNumber.trim(),
                            password: capturedPassword,
                            role: createUserForm.role,
                            organisationId:
                              createUserForm.role === 'Citizen' || createUserForm.role === 'Donor' || !createUserForm.organisationId
                                ? null
                                : createUserForm.organisationId,
                            preferredLanguage: createUserForm.preferredLanguage
                          });
                      if (created) {
                        setSharedCredentials({
                          fullName: created.fullName,
                          email: created.email,
                          password: capturedPassword,
                          role: created.role,
                          invitationCode: created.invitationCode
                        });
                        setCopiedCredentials(false);
                        setCreateUserForm({
                          fullName: '',
                          email: '',
                          phoneNumber: '',
                          password: '',
                          role: 'CaseManager',
                          organisationId: '',
                          preferredLanguage: 'en'
                        });
                      }
                    })
                  }
                  className="keep-white px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{busyKey === 'create-admin-user' ? 'Creating Account...' : 'Create Account & Generate Credentials'}</span>
                </button>
              </div>

              {sharedCredentials && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <p className="font-extrabold text-emerald-300">
                      Shareable Account Credentials Ready ({sharedCredentials.role})
                    </p>
                    <p className="text-zinc-200 font-mono">
                      Name: {sharedCredentials.fullName} • Email: {sharedCredentials.email} • Password: {sharedCredentials.password}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = `Crisync Account Credentials\nRole: ${sharedCredentials.role}\nName: ${sharedCredentials.fullName}\nEmail: ${sharedCredentials.email}\nPassword: ${sharedCredentials.password}`;
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(textToCopy).catch(() => {});
                      }
                      setCopiedCredentials(true);
                    }}
                    className="keep-white px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5 shrink-0"
                  >
                    {copiedCredentials ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCredentials ? 'Copied!' : 'Copy Credentials to Send'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {adminUsers.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No registered accounts found yet.</p>
          ) : (
            adminUsers.map((u) => {
              const isDefaultAdmin = u.email?.toLowerCase() === 'admin@crisync.org';
              const isCurrentUser = Boolean(currentUserId && u.id === currentUserId);
              const isEditing = editingUserId === u.id;
              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-white">{u.fullName}</p>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-bold text-indigo-300">
                          {u.role}
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${u.isActive
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {u.isActive ? u.accountStatus || 'Active' : 'Deactivated'}
                        </span>
                        {u.invitationCode && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                            {u.invitationCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {u.email} • {u.phoneNumber || 'No phone'} • {u.organisationName}
                        {u.invitedByUserName ? ` • By: ${u.invitedByUserName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingUserId(null);
                          } else {
                            setUnlockedAdminFields((prev) => ({ ...prev, [`resetPass:${u.id}`]: false }));
                            setEditingUserId(u.id);
                            setUserDraft({
                              fullName: u.fullName || '',
                              email: u.email || '',
                              phoneNumber: u.phoneNumber || '',
                              role: u.role || 'Citizen',
                              organisationId: u.organisationId || '',
                              isActive: Boolean(u.isActive),
                              newPassword: ''
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 transition"
                      >
                        {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        <span>{isEditing ? 'Close' : 'Edit User'}</span>
                      </button>
                      {!isDefaultAdmin &&
                        !isCurrentUser &&
                        onAdminDeleteUser &&
                        renderDeleteButton(`user:${u.id}`, () => onAdminDeleteUser(u.id, u.fullName))}
                    </div>
                  </div>

                  {isEditing && onAdminUpdateUser && (
                    <div className="pt-3 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px opacity-0 overflow-hidden"
                      >
                        <input type="text" name={`prevent_edit_autofill_user_${u.id}`} autoComplete="username" tabIndex={-1} defaultValue="" />
                        <input type="password" name={`prevent_edit_autofill_pass_${u.id}`} autoComplete="current-password" tabIndex={-1} defaultValue="" />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          name={`crisync_admin_edit_fullname_${u.id}`}
                          autoComplete="off"
                          value={userDraft.fullName}
                          onChange={(e) => setUserDraft({ ...userDraft, fullName: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          name={`crisync_admin_edit_email_${u.id}`}
                          autoComplete="off"
                          disabled={isDefaultAdmin}
                          value={userDraft.email}
                          onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })}
                          className="rsvp-input disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Phone Number</label>
                        <input
                          type="text"
                          name={`crisync_admin_edit_phone_${u.id}`}
                          autoComplete="off"
                          value={userDraft.phoneNumber}
                          onChange={(e) => setUserDraft({ ...userDraft, phoneNumber: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>

                      {!isDefaultAdmin && (
                        <>
                          <div>
                            <label className="block font-bold text-zinc-300 mb-1">Operational Role</label>
                            <select
                              value={userDraft.role}
                              onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value })}
                              className="rsvp-input"
                            >
                              {assignableRoles.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-zinc-300 mb-1">Organisation</label>
                            <select
                              value={userDraft.organisationId || ''}
                              onChange={(e) => setUserDraft({ ...userDraft, organisationId: e.target.value || null })}
                              disabled={userDraft.role === 'Citizen' || userDraft.role === 'Donor'}
                              className="rsvp-input disabled:opacity-50"
                            >
                              <option value="">Independent / None</option>
                              {organisations.map((org) => (
                                <option key={org.id} value={org.id}>
                                  {org.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 font-bold text-zinc-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userDraft.isActive}
                                onChange={(e) => setUserDraft({ ...userDraft, isActive: e.target.checked })}
                                className="w-4 h-4 rounded"
                              />
                              Account Active (Can Sign In)
                            </label>
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2">
                        <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reset Password (Optional)</span>
                        </label>
                        <input
                          type="password"
                          name={`crisync_admin_edit_reset_password_${u.id}`}
                          autoComplete="new-password"
                          readOnly={!unlockedAdminFields[`resetPass:${u.id}`]}
                          onFocus={() => unlockAdminField(`resetPass:${u.id}`)}
                          onMouseDown={() => unlockAdminField(`resetPass:${u.id}`)}
                          onKeyDown={() => unlockAdminField(`resetPass:${u.id}`)}
                          value={userDraft.newPassword}
                          onChange={(e) => setUserDraft({ ...userDraft, newPassword: e.target.value })}
                          placeholder="Leave empty to keep existing password"
                          className="rsvp-input"
                        />
                        <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                          Example: Enter a new minimum 6-character password only when resetting user access
                        </p>
                      </div>

                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          disabled={busyKey === `save-user:${u.id}`}
                          onClick={() =>
                            runBusy(`save-user:${u.id}`, async () => {
                              await onAdminUpdateUser(u.id, {
                                fullName: userDraft.fullName,
                                email: userDraft.email,
                                phoneNumber: userDraft.phoneNumber,
                                role: isDefaultAdmin ? 'SystemAdmin' : userDraft.role,
                                organisationId: userDraft.organisationId || null,
                                isActive: isDefaultAdmin ? true : Boolean(userDraft.isActive),
                                newPassword: userDraft.newPassword?.trim() ? userDraft.newPassword : null
                              });
                              setEditingUserId(null);
                            })
                          }
                          className="keep-white px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save User Changes</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {adminTab === 'partnerships' && (
        <div className="space-y-3">
          {adminPartnerships.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No partner organizations recorded.</p>
          ) : (
            adminPartnerships.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-white">{p.name}</p>
                      <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${p.partnershipStatus === 'Approved'
                            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                            : p.partnershipStatus === 'Rejected'
                              ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                              : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                        }`}
                      >
                        {p.partnershipStatus}
                      </span>
                    </div>
                    <p className="text-zinc-400 mt-1">
                      {p.organisationType} • {p.country} • {p.contactEmail} • {p.contactPhone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.partnershipStatus !== 'Approved' && onApprovePartnership && (
                      <button
                        type="button"
                        onClick={() => runBusy(`approve-org:${p.id}`, () => onApprovePartnership(p.id, p.name))}
                        className="keep-white px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Partnership</span>
                      </button>
                    )}
                    {p.partnershipStatus !== 'Rejected' && onRejectPartnership && (
                      <button
                        type="button"
                        onClick={() => runBusy(`reject-org:${p.id}`, () => onRejectPartnership(p.id, p.name))}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
                {p.partnershipProposal && (
                  <p className="p-2.5 rounded-xl bg-black/20 border border-white/10 text-zinc-300">
                    <strong className="text-zinc-200">Partnership Proposal:</strong> {p.partnershipProposal}
                  </p>
                )}
                {Array.isArray(p.officers) && p.officers.length > 0 && (
                  <p className="text-[11px] text-zinc-400">
                    Officers: {p.officers.map((o: any) => `${o.fullName} (${o.email} — ${o.accountStatus})`).join(', ')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === 'permissions' && (
        <div className="space-y-4 text-xs">
          {onAddRolePermission && (
            <div className="p-4 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/25 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Role</label>
                <select
                  value={permForm.role}
                  onChange={(e) => setPermForm({ ...permForm, role: e.target.value })}
                  className="rsvp-input"
                >
                  {ADMIN_EDITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Permission Code</label>
                <input
                  type="text"
                  value={permForm.permissionCode}
                  onChange={(e) => setPermForm({ ...permForm, permissionCode: e.target.value })}
                  placeholder="MANAGE_MEDICAL_AID"
                  className="rsvp-input font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Permission Description</label>
                <input
                  type="text"
                  value={permForm.description}
                  onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
                  placeholder="Short operational capability description"
                  className="rsvp-input"
                />
              </div>
              <button
                type="button"
                disabled={!permForm.permissionCode.trim()}
                onClick={() =>
                  runBusy('add-perm', async () => {
                    await onAddRolePermission(permForm);
                    setPermForm({ role: permForm.role, permissionCode: '', description: '' });
                  })
                }
                className="keep-white px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Permission</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {rolePermissions.map((rp) => (
              <div key={rp.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold mr-2">
                    {rp.role}
                  </span>
                  <span className="font-mono font-extrabold text-white">{rp.permissionCode}</span>
                  <p className="text-zinc-400 mt-1">{rp.description}</p>
                </div>
                {onDeleteRolePermission && (
                  <button
                    type="button"
                    onClick={() => runBusy(`del-perm:${rp.id}`, () => onDeleteRolePermission(rp.id))}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'integrations' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
              <p className="text-sm font-extrabold text-white">AI Priority & Triage Service</p>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">AI Provider</label>
                <input
                  type="text"
                  value={serviceDraft.aiProviderName}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, aiProviderName: e.target.value })}
                  className="rsvp-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Model Name</label>
                  <input
                    type="text"
                    value={serviceDraft.aiModelName}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, aiModelName: e.target.value })}
                    className="rsvp-input font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Confidence Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="0.99"
                    value={serviceDraft.aiConfidenceThreshold}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, aiConfidenceThreshold: Number(e.target.value) })}
                    className="rsvp-input font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 font-semibold text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(serviceDraft.simulateExternalAiFailure)}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, simulateExternalAiFailure: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Activate AI Backup Fallback Mode
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
              <p className="text-sm font-extrabold text-white">SMS Alert Gateway</p>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">SMS Provider</label>
                <input
                  type="text"
                  value={serviceDraft.smsProviderName}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, smsProviderName: e.target.value })}
                  className="rsvp-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Sender ID</label>
                  <input
                    type="text"
                    value={serviceDraft.smsSenderId}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, smsSenderId: e.target.value })}
                    className="rsvp-input font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Idempotency Window (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={serviceDraft.smsIdempotencyWindowMinutes}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, smsIdempotencyWindowMinutes: Number(e.target.value) })}
                    className="rsvp-input font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 font-semibold text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(serviceDraft.simulateExternalNotificationFailure)}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, simulateExternalNotificationFailure: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Activate SMS Backup Queue Mode
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
              <p className="text-sm font-extrabold text-white">Email Notification Service</p>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">SMTP / Email Relay Provider</label>
                <input
                  type="text"
                  value={serviceDraft.emailSmtpProvider}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, emailSmtpProvider: e.target.value })}
                  className="rsvp-input"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Sender Address</label>
                <input
                  type="email"
                  value={serviceDraft.emailSenderAddress}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, emailSenderAddress: e.target.value })}
                  className="rsvp-input font-mono"
                />
              </div>
              <label className="flex items-center gap-2 font-semibold text-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(serviceDraft.emailAlertsEnabled)}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, emailAlertsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Automated Email Dispatches & Invitations Enabled
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
              <p className="text-sm font-extrabold text-white">Maps & Geocoding Integration</p>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Routing Provider</label>
                <input
                  type="text"
                  value={serviceDraft.mappingProviderName}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, mappingProviderName: e.target.value })}
                  className="rsvp-input"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Geocoding Provider</label>
                <input
                  type="text"
                  value={serviceDraft.geocodingProviderName}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, geocodingProviderName: e.target.value })}
                  className="rsvp-input"
                />
              </div>
              <label className="flex items-center gap-2 font-semibold text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(serviceDraft.simulateExternalMappingFailure)}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, simulateExternalMappingFailure: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Activate Offline Haversine Mapping Fallback
              </label>
            </div>
          </div>

          {onUpdateServiceSettings && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => runBusy('save-integrations', () => onUpdateServiceSettings(serviceDraft))}
                className="keep-white px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save AI, SMS, Email & Mapping Settings</span>
              </button>
            </div>
          )}
        </div>
      )}

      {adminTab === 'config' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Minimum Global Admins (Lockout Prevention)</label>
              <input
                type="number"
                min={2}
                max={3}
                value={configDraft.minGlobalAdmins}
                onChange={(e) => setConfigDraft({ ...configDraft, minGlobalAdmins: Number(e.target.value) })}
                className="rsvp-input font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Maximum Global Admins (Attack Surface Limit)</label>
              <input
                type="number"
                min={2}
                max={4}
                value={configDraft.maxGlobalAdmins}
                onChange={(e) => setConfigDraft({ ...configDraft, maxGlobalAdmins: Number(e.target.value) })}
                className="rsvp-input font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Maximum Organization Admins</label>
              <input
                type="number"
                min={1}
                max={5}
                value={configDraft.maxOrganizationAdmins}
                onChange={(e) => setConfigDraft({ ...configDraft, maxOrganizationAdmins: Number(e.target.value) })}
                className="rsvp-input font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-300 mb-1">High-Value Donation Compliance Threshold (USD)</label>
              <input
                type="number"
                min={1000}
                value={configDraft.highValueDonationThresholdUsd}
                onChange={(e) => setConfigDraft({ ...configDraft, highValueDonationThresholdUsd: Number(e.target.value) })}
                className="rsvp-input font-mono"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 font-bold text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(configDraft.requireVolunteerCoordinatorVerification)}
                  onChange={(e) => setConfigDraft({ ...configDraft, requireVolunteerCoordinatorVerification: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Require Volunteer Coordinator Verification
              </label>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 font-bold text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(configDraft.requirePartnerAdminApproval)}
                  onChange={(e) => setConfigDraft({ ...configDraft, requirePartnerAdminApproval: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Require Admin Approval for Partner Organizations
              </label>
            </div>
          </div>
          {onUpdateSystemConfig && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => runBusy('save-sysconfig', () => onUpdateSystemConfig(configDraft))}
                className="keep-white px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Core Governance Configuration</span>
              </button>
            </div>
          )}
        </div>
      )}

      {adminTab === 'crises' && (
        <div className="space-y-3">
          {crises.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No crises recorded yet.</p>
          ) : (
            crises.map((c) => {
              const editKey = `crisis:${c.id}`;
              const isEditing = editingEntityKey === editKey;
              return (
                <div key={c.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">{c.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {c.crisisType} • Severity: {c.severity} • Region: {c.region || 'Unset'} • {c.isActive ? 'Active' : 'Closed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingEntityKey(null);
                          } else {
                            setEditingEntityKey(editKey);
                            setEntityDraft({
                              title: c.title || '',
                              crisisType: c.crisisType || 'Flood',
                              severity: c.severity || 'High',
                              region: c.region || '',
                              description: c.description || '',
                              centerLatitude: c.centerLatitude ?? 6.9271,
                              centerLongitude: c.centerLongitude ?? 79.8612,
                              radiusKm: c.radiusKm ?? 25,
                              isActive: Boolean(c.isActive)
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Close' : 'Edit'}</span>
                      </button>
                      {onAdminDeleteCrisis && renderDeleteButton(editKey, () => onAdminDeleteCrisis(c.id, c.title))}
                    </div>
                  </div>
                  {isEditing && onAdminUpdateCrisis && (
                    <div className="pt-3 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="md:col-span-2">
                        <label className="block font-bold text-zinc-300 mb-1">Crisis Title</label>
                        <input
                          type="text"
                          value={entityDraft.title}
                          onChange={(e) => setEntityDraft({ ...entityDraft, title: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Region</label>
                        <input
                          type="text"
                          value={entityDraft.region}
                          onChange={(e) => setEntityDraft({ ...entityDraft, region: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Type</label>
                        <select
                          value={entityDraft.crisisType}
                          onChange={(e) => setEntityDraft({ ...entityDraft, crisisType: e.target.value })}
                          className="rsvp-input"
                        >
                          {CRISIS_TYPES.map((tOpt) => (
                            <option key={tOpt} value={tOpt}>{tOpt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Severity</label>
                        <select
                          value={entityDraft.severity}
                          onChange={(e) => setEntityDraft({ ...entityDraft, severity: e.target.value })}
                          className="rsvp-input"
                        >
                          {CRISIS_SEVERITIES.map((sOpt) => (
                            <option key={sOpt} value={sOpt}>{sOpt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 font-bold text-zinc-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entityDraft.isActive}
                            onChange={(e) => setEntityDraft({ ...entityDraft, isActive: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          Crisis Active
                        </label>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block font-bold text-zinc-300 mb-1">Description</label>
                        <input
                          type="text"
                          value={entityDraft.description}
                          onChange={(e) => setEntityDraft({ ...entityDraft, description: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={entityDraft.centerLatitude}
                          onChange={(e) => setEntityDraft({ ...entityDraft, centerLatitude: Number(e.target.value) })}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={entityDraft.centerLongitude}
                          onChange={(e) => setEntityDraft({ ...entityDraft, centerLongitude: Number(e.target.value) })}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            runBusy(editKey, async () => {
                              await onAdminUpdateCrisis(c.id, entityDraft);
                              setEditingEntityKey(null);
                            })
                          }
                          className="keep-white px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Crisis</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {adminTab === 'shelters' && (
        <div className="space-y-3">
          {shelters.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No shelters registered yet.</p>
          ) : (
            shelters.map((s) => {
              const editKey = `shelter:${s.id}`;
              const isEditing = editingEntityKey === editKey;
              return (
                <div key={s.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">{s.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {s.address} • Occupancy: {s.currentOccupancy}/{s.totalCapacity} • Status: {s.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingEntityKey(null);
                          } else {
                            setEditingEntityKey(editKey);
                            setEntityDraft({
                              name: s.name || '',
                              address: s.address || '',
                              totalCapacity: s.totalCapacity ?? 100,
                              currentOccupancy: s.currentOccupancy ?? 0,
                              isWheelchairAccessible: Boolean(s.isWheelchairAccessible),
                              hasMedicalFacility: Boolean(s.hasMedicalFacility),
                              hasPowerBackup: Boolean(s.hasPowerBackup),
                              status: s.status || 'Operational',
                              latitude: s.latitude ?? 6.9271,
                              longitude: s.longitude ?? 79.8612
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Close' : 'Edit'}</span>
                      </button>
                      {onAdminDeleteShelter && renderDeleteButton(editKey, () => onAdminDeleteShelter(s.id, s.name))}
                    </div>
                  </div>
                  {isEditing && onAdminUpdateShelter && (
                    <div className="pt-3 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Shelter Name</label>
                        <input
                          type="text"
                          value={entityDraft.name}
                          onChange={(e) => setEntityDraft({ ...entityDraft, name: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block font-bold text-zinc-300 mb-1">Address</label>
                        <input
                          type="text"
                          value={entityDraft.address}
                          onChange={(e) => setEntityDraft({ ...entityDraft, address: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Total Capacity</label>
                        <input
                          type="number"
                          min={1}
                          value={entityDraft.totalCapacity}
                          onChange={(e) => setEntityDraft({ ...entityDraft, totalCapacity: Number(e.target.value) })}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Current Occupancy</label>
                        <input
                          type="number"
                          min={0}
                          value={entityDraft.currentOccupancy}
                          onChange={(e) => setEntityDraft({ ...entityDraft, currentOccupancy: Number(e.target.value) })}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Status</label>
                        <select
                          value={entityDraft.status}
                          onChange={(e) => setEntityDraft({ ...entityDraft, status: e.target.value })}
                          className="rsvp-input"
                        >
                          {SHELTER_STATUSES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-1.5 text-zinc-200 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entityDraft.isWheelchairAccessible}
                            onChange={(e) => setEntityDraft({ ...entityDraft, isWheelchairAccessible: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          Wheelchair Access
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-200 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entityDraft.hasMedicalFacility}
                            onChange={(e) => setEntityDraft({ ...entityDraft, hasMedicalFacility: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          Medical Bay
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-200 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entityDraft.hasPowerBackup}
                            onChange={(e) => setEntityDraft({ ...entityDraft, hasPowerBackup: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          Power Backup
                        </label>
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            runBusy(editKey, async () => {
                              await onAdminUpdateShelter(s.id, entityDraft);
                              setEditingEntityKey(null);
                            })
                          }
                          className="keep-white px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Shelter</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {adminTab === 'resources' && (
        <div className="space-y-3">
          {resources.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No warehouse inventory items added yet.</p>
          ) : (
            resources.map((r) => {
              const editKey = `resource:${r.id}`;
              const isEditing = editingEntityKey === editKey;
              return (
                <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">{r.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {r.category} • {r.warehouseName} • Available: {r.availableQuantity}/{r.totalQuantity} {r.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingEntityKey(null);
                          } else {
                            setEditingEntityKey(editKey);
                            setEntityDraft({
                              name: r.name || '',
                              category: r.category || 'Food',
                              warehouseName: r.warehouseName || '',
                              unit: r.unit || 'Units',
                              totalQuantity: r.totalQuantity ?? 0,
                              availableQuantity: r.availableQuantity ?? 0,
                              reorderThreshold: r.reorderThreshold ?? 20,
                              warehouseLatitude: r.warehouseLatitude ?? 6.9271,
                              warehouseLongitude: r.warehouseLongitude ?? 79.8612
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Close' : 'Edit'}</span>
                      </button>
                      {onAdminDeleteResource && renderDeleteButton(editKey, () => onAdminDeleteResource(r.id, r.name))}
                    </div>
                  </div>
                  {isEditing && onAdminUpdateResource && (
                    <div className="pt-3 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Item Name</label>
                        <input
                          type="text"
                          value={entityDraft.name}
                          onChange={(e) => setEntityDraft({ ...entityDraft, name: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Category</label>
                        <select
                          value={entityDraft.category}
                          onChange={(e) => setEntityDraft({ ...entityDraft, category: e.target.value })}
                          className="rsvp-input"
                        >
                          {RESOURCE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Warehouse</label>
                        <input
                          type="text"
                          value={entityDraft.warehouseName}
                          onChange={(e) => setEntityDraft({ ...entityDraft, warehouseName: e.target.value })}
                          className="rsvp-input"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Total Quantity</label>
                        <input
                          type="number"
                          min={0}
                          value={entityDraft.totalQuantity}
                          onChange={(e) => setEntityDraft({ ...entityDraft, totalQuantity: Number(e.target.value) })}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Available Quantity</label>
                        <input
                          type="number"
                          min={0}
                          value={entityDraft.availableQuantity}
                          onChange={(e) => setEntityDraft({ ...entityDraft, availableQuantity: Number(e.target.value) })}
                          className="rsvp-input font-mono"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            runBusy(editKey, async () => {
                              await onAdminUpdateResource(r.id, entityDraft);
                              setEditingEntityKey(null);
                            })
                          }
                          className="keep-white px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold inline-flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Stock Item</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {adminTab === 'requests' && (
        <div className="space-y-2.5">
          {requests.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No citizen assistance requests submitted yet.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {req.referenceCode}: {req.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {req.category} • Status: {req.status} • Urgency: {req.finalApprovedUrgency} • {req.locationAddress}
                  </p>
                </div>
                {onAdminDeleteRequest &&
                  renderDeleteButton(`req:${req.id}`, () => onAdminDeleteRequest(req.id, req.referenceCode || req.title))}
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === 'volunteers' && (
        <div className="space-y-2.5">
          {volunteers.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No volunteer profiles registered yet.</p>
          ) : (
            volunteers.map((v) => (
              <div key={v.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-white">{v.fullName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Skills: {v.skillsCsv || 'General'} • Schedule: {v.availabilitySchedule}
                  </p>
                </div>
                {onAdminDeleteVolunteer &&
                  renderDeleteButton(`vol:${v.id}`, () => onAdminDeleteVolunteer(v.id, v.fullName))}
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === 'campaigns' && (
        <div className="space-y-2.5">
          {campaigns.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No fundraising campaigns created yet.</p>
          ) : (
            campaigns.map((camp) => (
              <div key={camp.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-white">{camp.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Raised: ${Number(camp.collectedAmountUsd || 0).toLocaleString()} / Target: ${Number(camp.targetAmountUsd || 0).toLocaleString()}
                  </p>
                </div>
                {onAdminDeleteCampaign &&
                  renderDeleteButton(`camp:${camp.id}`, () => onAdminDeleteCampaign(camp.id, camp.title))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const MapAndResilienceTab: React.FC<{
  userRole: string;
  requests: any[];
  shelters: any[];
  resources: any[];
  operationalAreas: any[];
  mappingReferences?: any[];
  coverageReport?: any | null;
  resilienceStatus: any;
  routeCalc: any;
  auditLogs: any[];
  adminUsers?: any[];
  currentUserId?: string;
  organisations?: any[];
  crises?: any[];
  volunteers?: any[];
  campaigns?: any[];
  adminPartnerships?: any[];
  rolePermissions?: any[];
  systemConfig?: any;
  serviceSettings?: any;
  onAdminCreateUser?: (payload: any) => Promise<any>;
  onInviteStaff?: (payload: any) => Promise<any>;
  onAdminUpdateUser?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteUser?: (id: string, label: string) => Promise<void>;
  onApprovePartnership?: (orgId: string, orgName: string) => Promise<void>;
  onRejectPartnership?: (orgId: string, orgName: string) => Promise<void>;
  onAddRolePermission?: (payload: any) => Promise<void>;
  onDeleteRolePermission?: (id: string) => Promise<void>;
  onUpdateSystemConfig?: (payload: any) => Promise<void>;
  onUpdateServiceSettings?: (payload: any) => Promise<void>;
  onAdminUpdateCrisis?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteCrisis?: (id: string, label: string) => Promise<void>;
  onAdminUpdateShelter?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteShelter?: (id: string, label: string) => Promise<void>;
  onAdminUpdateResource?: (id: string, payload: any) => Promise<void>;
  onAdminDeleteResource?: (id: string, label: string) => Promise<void>;
  onAdminDeleteRequest?: (id: string, label: string) => Promise<void>;
  onAdminDeleteVolunteer?: (id: string, label: string) => Promise<void>;
  onAdminDeleteCampaign?: (id: string, label: string) => Promise<void>;
  activeLanguage?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  onCalculateRoute: (originLat?: number, originLon?: number, destLat?: number, destLon?: number) => Promise<void>;
  onToggleResilience: (service: string, currentValue: boolean) => Promise<void>;
  onRetryFailedNotifications?: () => Promise<void>;
  onSendIdempotentNotification: (
    idempotencyKey: string,
    languageCode?: string,
    subject?: string,
    messageBody?: string
  ) => Promise<void>;
}> = ({
  userRole,
  requests,
  shelters,
  resources,
  operationalAreas,
  mappingReferences = [],
  coverageReport = null,
  resilienceStatus,
  routeCalc,
  auditLogs,
  adminUsers = [],
  currentUserId,
  organisations = [],
  crises = [],
  volunteers = [],
  campaigns = [],
  adminPartnerships = [],
  rolePermissions = [],
  systemConfig,
  serviceSettings,
  onAdminCreateUser,
  onInviteStaff,
  onAdminUpdateUser,
  onAdminDeleteUser,
  onApprovePartnership,
  onRejectPartnership,
  onAddRolePermission,
  onDeleteRolePermission,
  onUpdateSystemConfig,
  onUpdateServiceSettings,
  onAdminUpdateCrisis,
  onAdminDeleteCrisis,
  onAdminUpdateShelter,
  onAdminDeleteShelter,
  onAdminUpdateResource,
  onAdminDeleteResource,
  onAdminDeleteRequest,
  onAdminDeleteVolunteer,
  onAdminDeleteCampaign,
  activeLanguage = 'si',
  onChangeLanguage,
  onCalculateRoute,
  onToggleResilience,
  onRetryFailedNotifications,
  onSendIdempotentNotification
}) => {
  const [idempKey, setIdempKey] = useState('');
  const [smsLang, setSmsLang] = useState<SupportedLanguage>(activeLanguage || 'si');
    const [routeOriginWarehouseId, setRouteOriginWarehouseId] = useState<string>('');
    const [routeDestRequestId, setRouteDestRequestId] = useState<string>('');

  const smsBundle = TRANSLATIONS[smsLang]?.smsNotification || TRANSLATIONS.en.smsNotification;

  const isSystemAdminOrCoord =
    userRole === 'SystemAdmin' || userRole === 'OrganizationAdmin' || userRole === 'EmergencyCoordinator';

  return (
    <div className="space-y-6">
      {(userRole === 'SystemAdmin' || userRole === 'OrganizationAdmin') && (
        <SystemAdminControlCenter
          userRole={userRole}
          adminUsers={adminUsers}
          currentUserId={currentUserId}
          organisations={organisations}
          crises={crises}
          shelters={shelters}
          resources={resources}
          requests={requests}
          volunteers={volunteers}
          campaigns={campaigns}
          adminPartnerships={adminPartnerships}
          rolePermissions={rolePermissions}
          systemConfig={systemConfig}
          serviceSettings={serviceSettings}
          onAdminCreateUser={onAdminCreateUser}
          onInviteStaff={onInviteStaff}
          onAdminUpdateUser={onAdminUpdateUser}
          onAdminDeleteUser={onAdminDeleteUser}
          onApprovePartnership={onApprovePartnership}
          onRejectPartnership={onRejectPartnership}
          onAddRolePermission={onAddRolePermission}
          onDeleteRolePermission={onDeleteRolePermission}
          onUpdateSystemConfig={onUpdateSystemConfig}
          onUpdateServiceSettings={onUpdateServiceSettings}
          onAdminUpdateCrisis={onAdminUpdateCrisis}
          onAdminDeleteCrisis={onAdminDeleteCrisis}
          onAdminUpdateShelter={onAdminUpdateShelter}
          onAdminDeleteShelter={onAdminDeleteShelter}
          onAdminUpdateResource={onAdminUpdateResource}
          onAdminDeleteResource={onAdminDeleteResource}
          onAdminDeleteRequest={onAdminDeleteRequest}
          onAdminDeleteVolunteer={onAdminDeleteVolunteer}
          onAdminDeleteCampaign={onAdminDeleteCampaign}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
            className={`${isSystemAdminOrCoord ? 'lg:col-span-8' : 'lg:col-span-12'
          } bento-glass rounded-3xl p-5 sm:p-6 space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Live Crisis Map
              </span>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                Interactive Flood Map (Requests, Shelters & Warehouses)
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Red/Orange Pins: Help Requests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Green Pins: Open Shelters
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  Purple Pins: Supply Warehouses
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  Cyan Pins: Service Centres / Staging Points
                </span>
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Route Origin Warehouse"
                  value={routeOriginWarehouseId}
                  onChange={(e) => setRouteOriginWarehouseId(e.target.value)}
                  className="rsvp-input py-1.5 px-2.5 text-xs bg-zinc-900 border-white/15 max-w-xs"
                >
                  <option value="">Default Warehouse (Auto)</option>
                  {resources.map((res: any) => (
                    <option key={res.id} value={res.id}>
                      Warehouse: {res.warehouseName || res.itemCategory} ({res.warehouseDistrict || 'Base'})
                    </option>
                  ))}
                </select>
                <span className="text-zinc-500 text-xs">➔</span>
                <select
                  aria-label="Route Destination Case"
                  value={routeDestRequestId}
                  onChange={(e) => setRouteDestRequestId(e.target.value)}
                  className="rsvp-input py-1.5 px-2.5 text-xs bg-zinc-900 border-white/15 max-w-xs truncate"
                >
                  <option value="">Default Incident (Auto)</option>
                  {requests.map((req: any) => (
                    <option key={req.id} value={req.id}>
                      Case: {req.trackingCode || req.id.slice(0, 8)} ({req.district || 'Zone'})
                    </option>
                  ))}
                </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const selRes = resources.find((r) => r.id === routeOriginWarehouseId);
                    const selReq = requests.find((rq) => rq.id === routeDestRequestId);
                    onCalculateRoute(
                      selRes?.warehouseLatitude,
                      selRes?.warehouseLongitude,
                      selReq?.latitude,
                      selReq?.longitude
                    );
                  }}
                  className="keep-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm"
            >
              <Navigation className="w-4 h-4" />
                  <span>Calculate Route</span>
            </motion.button>
          </div>
            </div>

          <AnimatePresence>
            {routeCalc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/35 text-xs text-zinc-200 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <strong className="font-mono bg-indigo-600 px-2 py-0.5 rounded mr-2 text-white keep-white">
                    {routeCalc.providerUsed}
                  </strong>
                  <span>{routeCalc.routeSummary}</span>
                </div>
                <span className="font-mono font-bold text-emerald-300">
                  Distance: {routeCalc.distanceKm} km • Est. Travel Time: {routeCalc.estimatedMinutes} mins
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <InteractiveCrisisMap
            requests={requests}
            shelters={shelters}
            resources={resources}
            operationalAreas={operationalAreas}
            mappingReferences={mappingReferences}
          />

          {coverageReport && (coverageReport.zones || []).length > 0 && (
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  Geographical Coverage &amp; Service Gap Analysis
                </h3>
                <span className="px-3 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-bold text-indigo-300">
                  {coverageReport.totalOperationalZones} Zones • {coverageReport.criticalGapZonesCount} Critical Gaps
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {coverageReport.zones.map((z: any) => (
                  <div key={z.areaId} className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-extrabold text-white leading-snug">{z.zoneName}</p>
                      <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${z.coverageStatus === 'CriticalGap'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : z.coverageStatus === 'Strained'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {z.coverageStatus}
                      </span>
                    </div>
                    <p className="text-zinc-400">District: {z.district} • Pop: {Number(z.estimatedAffectedPopulation).toLocaleString()}</p>
                    <p className="text-zinc-300 font-mono text-[11px]">
                      Open: {z.openRequestsCount} • Beds: {z.availableShelterBeds} • Depots: {z.nearbyDepotsCount} • Centres: {z.serviceCentresCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isSystemAdminOrCoord && (
          <div className="lg:col-span-4 space-y-5">
            {resilienceStatus && (
              <div className="bento-glass rounded-3xl p-5 sm:p-6 space-y-3.5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-base font-extrabold text-white">
                    Service Backup Mode Controls
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If an internet service fails during a storm, the platform automatically switches to local backup mode. Click any switch below to test Online vs. Backup mode.
                </p>
                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      name: 'AI',
                      label: 'AI Priority Scoring Service',
                      sim: resilienceStatus.simulateExternalAiFailure,
                      mode: resilienceStatus.activeAiMode,
                      trips: resilienceStatus.aiCircuitTripCount
                    },
                    {
                      name: 'Mapping',
                      label: 'Road & Map Routing Service',
                      sim: resilienceStatus.simulateExternalMappingFailure,
                      mode: resilienceStatus.activeMappingMode,
                      trips: resilienceStatus.mappingCircuitTripCount
                    },
                    {
                      name: 'Notification',
                      label: 'Emergency SMS Text Service',
                      sim: resilienceStatus.simulateExternalNotificationFailure,
                      mode: resilienceStatus.activeNotificationMode,
                      trips: resilienceStatus.notificationCircuitTripCount
                    }
                  ].map((svc) => (
                    <div
                      key={svc.name}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-extrabold text-white">{svc.label}</p>
                        <p className="text-[11px] font-semibold text-indigo-300 mt-0.5">{svc.mode}</p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          Backup Switches: {svc.trips}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onToggleResilience(svc.name, svc.sim)}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition ${svc.sim
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        <span
                            className={`w-2 h-2 rounded-full ${svc.sim ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                          }`}
                        />
                        {svc.sim ? 'Backup Mode' : 'Online'}
                      </motion.button>
                    </div>
                  ))}
                </div>
                {onRetryFailedNotifications && (
                  <button
                    type="button"
                    onClick={onRetryFailedNotifications}
                    className="keep-white w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Queued Notifications Now</span>
                  </button>
                )}
              </div>
            )}

            <div className="bento-glass rounded-3xl p-5 sm:p-6 space-y-3.5 text-xs">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    {smsBundle.title}
                  </h3>
                </div>
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {smsBundle.subtitle}
              </p>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">
                  {smsBundle.languageSelectLabel}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setSmsLang(l.code);
                        if (onChangeLanguage) {
                          onChangeLanguage(l.code);
                        }
                      }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${smsLang === l.code
                          ? 'bg-indigo-600 border-indigo-500 text-white keep-white'
                          : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/10 space-y-1">
                <p className="font-bold text-indigo-300">{smsBundle.subject}</p>
                <p className="text-zinc-300 leading-relaxed">{smsBundle.body}</p>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Unique Message ID (Idempotency Key)</label>
                <input
                  type="text"
                  value={idempKey}
                  onChange={(e) => setIdempKey(e.target.value)}
                  placeholder="Enter unique delivery key or leave blank to generate"
                  className="rsvp-input font-mono"
                />
                <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                  Example: SMS-DISPATCH-001 (send the same key twice to verify duplicate SMS protection)
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  onSendIdempotentNotification(
                    idempKey.trim() || `SMS-KEY-${Date.now()}`,
                    smsLang,
                    smsBundle.subject,
                    smsBundle.body
                  )
                }
                className="keep-white w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{smsBundle.sendBtn}</span>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {isSystemAdminOrCoord && (
        <div className="bento-glass rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-white/[0.08]">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-indigo-400" />
                System Activity & Security Audit Log
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Permanent record of every sign-in, case verification, AI review, and supply dispatch.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300">
              {auditLogs.length} Recorded Actions
            </span>
          </div>
          <div className="content-scroll overflow-x-auto max-h-72 rounded-2xl border border-white/[0.08]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#0d111a]/95 backdrop-blur-md border-b border-white/[0.08]">
                <tr className="text-zinc-400 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Action Taken</th>
                  <th className="py-3 px-4">Staff Member & Role</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {new Date(log.createdAtUtc).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 font-bold text-indigo-300">
                        {log.eventCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{log.actionName}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-300">
                      {log.actorUserName} <span className="text-zinc-500">({log.actorRole})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 max-w-md truncate">
                      {log.detailsJson}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
