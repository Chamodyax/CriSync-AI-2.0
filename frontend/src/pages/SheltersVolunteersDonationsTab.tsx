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
