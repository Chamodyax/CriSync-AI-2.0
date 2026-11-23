import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon,
  Clock,
  PackageCheck,
  Home,
  Sparkles,
  GitMerge,
  Globe,
  CheckCircle2,
  Flame,
  Archive,
  MapPin,
  Users,
  Package,
  History,
  ArrowRight,
  ShieldAlert,
  Search,
  Radio,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Send,
  UserPlus,
  KeyRound,
  X,
  ZoomIn,
  Camera,
  BarChart3,
  AlertTriangle,
  Ban,
  Download,
  FileSpreadsheet,
  Star,
  Filter,
  RotateCcw
} from 'lucide-react';
import { LANGUAGE_OPTIONS, SupportedLanguage, TRANSLATIONS } from '../i18n';
import { resolveEvidencePhoto } from '../utils/fieldPhotos';
import { TelemetrySparkline } from '../components/TelemetrySparkline';

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const durationMs = 650;
    let frameId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{displayValue}</>;
}

interface DashboardTabProps {
  userRole: string;
  metrics: any;
  briefing: any;
  briefingLang: string;
  requests: any[];
  crises: any[];
  organisations?: any[];
  onChangeBriefingLanguage: (lang: string) => void;
  onMergeDuplicate: (req: any) => void;
  onSelectForAiGovernance: (req: any) => void;
  onUpdateRequestStatus: (id: string, newStatus: string, note: string, assignedOrganisationId?: string | null) => Promise<void>;
  onCreatePublicAlert: (payload: {
    crisisEventId: string;
    title: string;
    message: string;
    severityLevel: string;
    safetyGuidance: string;
  }) => Promise<void>;
  onCreateCrisisEvent: (payload: {
    title: string;
    crisisType: string;
    severity: string;
    country: string;
    region: string;
    description: string;
    centerLatitude: number;
    centerLongitude: number;
    radiusKm: number;
  }) => Promise<void>;
  onCreateOperationalArea?: (crisisId: string, payload: any) => Promise<void>;
  onRegisterCitizenOnBehalf?: (payload: any) => Promise<any>;
  onInviteStaff?: (payload: any) => Promise<any>;
  feedbackAnalytics?: any | null;
  sitRepReport?: any | null;
  lastSyncedAt?: Date | null;
  onManualRefresh?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  userRole,
  metrics,
  briefing,
  briefingLang,
  requests,
  crises,
  organisations = [],
  onChangeBriefingLanguage,
  onMergeDuplicate,
  onSelectForAiGovernance,
  onUpdateRequestStatus,
  onCreatePublicAlert,
  onCreateCrisisEvent,
  onCreateOperationalArea,
  onRegisterCitizenOnBehalf,
  onInviteStaff,
  feedbackAnalytics,
  sitRepReport,
  lastSyncedAt,
  onManualRefresh,
  isSyncing = false
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastSyncedAt) return;
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(lastSyncedAt).getTime()) / 1000);
      setSecondsAgo(Math.max(0, diff));
    };
    calc();
    const interval = setInterval(calc, 2000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  const lastSyncedText = !lastSyncedAt
    ? 'just now'
    : secondsAgo < 5
      ? 'just now'
      : secondsAgo < 60
        ? `${secondsAgo}s ago`
        : `${Math.floor(secondsAgo / 60)}m ago`;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'overdue' | 'suspicious' | 'duplicates' | 'verified'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'people'>('priority');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const canDeclareOrAlert =
    userRole === 'EmergencyCoordinator' || userRole === 'SystemAdmin' || userRole === 'OrganizationAdmin';
  const canRegisterCitizenProxy =
    userRole === 'CaseManager' || canDeclareOrAlert;
  const canInviteOperational = canDeclareOrAlert;

  const [commandOpen, setCommandOpen] = useState(crises.length === 0 || userRole === 'CaseManager');
  const [commandTab, setCommandTab] = useState<'alert' | 'crisis' | 'operational-zone' | 'citizen-behalf' | 'invite-staff'>(
    userRole === 'CaseManager' ? 'citizen-behalf' : crises.length === 0 ? 'crisis' : 'alert'
  );
  const [zoneForm, setZoneForm] = useState({
    crisisId: '',
    zoneName: '',
    district: '',
    latitude: 6.6828,
    longitude: 80.3992,
    coverageRadiusKm: 12,
    estimatedAffectedPopulation: 5000,
    riskLevel: 'High',
    assignedOrganisationId: ''
  });
  const [citizenProxyForm, setCitizenProxyForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    primaryAddress: '',
    totalMembers: 1,
    childrenCount: 0,
    elderlyCount: 0,
    hasMobilityNeeds: false,
    hasChronicMedicalNeeds: false,
    medicalNotes: '',
    preferredLanguage: 'si'
  });
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    temporaryPassword: '',
    role: 'CaseManager',
    organisationId: '',
    preferredLanguage: 'en'
  });
  const [lastInvitationResult, setLastInvitationResult] = useState<any | null>(null);
  const [unlockedFields, setUnlockedFields] = useState<Record<string, boolean>>({});
  const unlockField = (fieldKey: string) => {
    setUnlockedFields((prev) => (prev[fieldKey] ? prev : { ...prev, [fieldKey]: true }));
  };

  const [destructiveModal, setDestructiveModal] = useState<{
    req: any;
    actionType: 'Rejected' | 'Closed';
  } | null>(null);
  const [destructiveReasonCategory, setDestructiveReasonCategory] = useState('Duplicate submission');
  const [destructiveCustomNote, setDestructiveCustomNote] = useState('');
  const [isSubmittingDestructive, setIsSubmittingDestructive] = useState(false);
  const [undoToast, setUndoToast] = useState<{
    reqId: string;
    previousStatus: string;
    caseCode: string;
    actionType: 'Rejected' | 'Closed';
  } | null>(null);

  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [undoToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && destructiveModal) {
        setDestructiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [destructiveModal]);

  const openDestructiveConfirmModal = (req: any, actionType: 'Rejected' | 'Closed') => {
    setDestructiveModal({ req, actionType });
    setDestructiveReasonCategory(
      actionType === 'Rejected'
        ? 'Duplicate submission'
        : 'Relief assistance fulfilled on-site'
    );
    setDestructiveCustomNote('');
  };

  const handleConfirmDestructiveAction = async () => {
    if (!destructiveModal) return;
    const { req, actionType } = destructiveModal;
    setIsSubmittingDestructive(true);
    try {
      const fullNote = destructiveCustomNote.trim()
        ? `[${destructiveReasonCategory}] ${destructiveCustomNote.trim()}`
        : `[${destructiveReasonCategory}] Case ${actionType.toLowerCase()} after coordinator review.`;
      const prevStatus = req.status || 'PendingTriage';
      await onUpdateRequestStatus(req.id, actionType, fullNote);
      setDestructiveModal(null);
      setUndoToast({
        reqId: req.id,
        previousStatus: prevStatus,
        caseCode: req.trackingCode || (req.id ? req.id.slice(0, 8) : 'Case'),
        actionType
      });
    } finally {
      setIsSubmittingDestructive(false);
    }
  };

  const handleUndoDestructiveAction = async () => {
    if (!undoToast) return;
    const { reqId, previousStatus, actionType } = undoToast;
    setUndoToast(null);
    await onUpdateRequestStatus(
      reqId,
      previousStatus,
      `Action ${actionType} reversed via Undo by coordinator.`
    );
  };
  const [alertCrisisId, setAlertCrisisId] = useState(crises[0]?.id || '');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('Critical');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertGuidance, setAlertGuidance] = useState('');
  const [crisisTitle, setCrisisTitle] = useState('');
  const [crisisType, setCrisisType] = useState('Flood');
  const [crisisSeverity, setCrisisSeverity] = useState('Critical');
  const [crisisCountry, setCrisisCountry] = useState('');
  const [crisisRegion, setCrisisRegion] = useState('');
  const [crisisDescription, setCrisisDescription] = useState('');
  const [crisisLat, setCrisisLat] = useState(6.9271);
  const [crisisLon, setCrisisLon] = useState(79.8612);
  const [crisisRadiusKm, setCrisisRadiusKm] = useState(15);
  const [commandSubmitting, setCommandSubmitting] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    src: string;
    title: string;
    caption: string;
    fileName?: string;
  } | null>(null);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxPhoto(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [lightboxPhoto]);

  const activeAlertCrisisId = alertCrisisId || crises[0]?.id || '';

  const handleCitizenProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRegisterCitizenOnBehalf) return;
    setCommandSubmitting(true);
    try {
      await onRegisterCitizenOnBehalf(citizenProxyForm);
      setCitizenProxyForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        primaryAddress: '',
        totalMembers: 1,
        childrenCount: 0,
        elderlyCount: 0,
        hasMobilityNeeds: false,
        hasChronicMedicalNeeds: false,
        medicalNotes: '',
        preferredLanguage: 'si'
      });
    } finally {
      setCommandSubmitting(false);
    }
  };

  const handleInviteStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onInviteStaff) return;
    setCommandSubmitting(true);
    try {
      const invited = await onInviteStaff({
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        phoneNumber: inviteForm.phoneNumber,
        temporaryPassword: inviteForm.temporaryPassword,
        role: inviteForm.role,
        organisationId: inviteForm.organisationId || null,
        preferredLanguage: inviteForm.preferredLanguage
      });
      setLastInvitationResult({
        ...invited,
        temporaryPassword: inviteForm.temporaryPassword
      });
      setInviteForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        temporaryPassword: '',
        role: 'CaseManager',
        organisationId: '',
        preferredLanguage: 'en'
      });
    } finally {
      setCommandSubmitting(false);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlertCrisisId) return;
    setCommandSubmitting(true);
    await onCreatePublicAlert({
      crisisEventId: activeAlertCrisisId,
      title: alertTitle,
      message: alertMessage,
      severityLevel: alertSeverity,
      safetyGuidance: alertGuidance
    });
    setAlertTitle('');
    setAlertMessage('');
    setAlertGuidance('');
    setCommandSubmitting(false);
  };

  const handleRegisterCrisis = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommandSubmitting(true);
    await onCreateCrisisEvent({
      title: crisisTitle,
      crisisType,
      severity: crisisSeverity,
      country: crisisCountry,
      region: crisisRegion,
      description: crisisDescription,
      centerLatitude: Number(crisisLat),
      centerLongitude: Number(crisisLon),
      radiusKm: Number(crisisRadiusKm)
    });
    setCrisisTitle('');
    setCrisisCountry('');
    setCrisisRegion('');
    setCrisisDescription('');
    setCommandTab('alert');
    setCommandSubmitting(false);
  };

  const handleCreateZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCrisis = zoneForm.crisisId || crises[0]?.id;
    if (!onCreateOperationalArea || !targetCrisis) return;
    setCommandSubmitting(true);
    try {
      await onCreateOperationalArea(targetCrisis, {
        zoneName: zoneForm.zoneName,
        district: zoneForm.district,
        latitude: Number(zoneForm.latitude),
        longitude: Number(zoneForm.longitude),
        coverageRadiusKm: Number(zoneForm.coverageRadiusKm),
        estimatedAffectedPopulation: Number(zoneForm.estimatedAffectedPopulation),
        riskLevel: zoneForm.riskLevel,
        assignedOrganisationId: zoneForm.assignedOrganisationId || null
      });
      setZoneForm({
        ...zoneForm,
        zoneName: '',
        district: ''
      });
    } finally {
      setCommandSubmitting(false);
    }
  };

  const langKey = (briefingLang as SupportedLanguage) || 'en';
  const t = TRANSLATIONS[langKey] || TRANSLATIONS.en;

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const canManageCases =
    userRole === 'EmergencyCoordinator' ||
    userRole === 'CaseManager' ||
    userRole === 'OrganizationAdmin' ||
    userRole === 'SystemAdmin';

  const canReviewAi =
    userRole === 'EmergencyCoordinator' ||
    userRole === 'CaseManager' ||
    userRole === 'OrganizationAdmin' ||
    userRole === 'SystemAdmin';

  const isRequestOverdue = (req: any) => {
    const isTerminal =
      req.status === 'Fulfilled' ||
      req.status === 'Closed' ||
      req.status === 'MergedAsDuplicate' ||
      req.status === 'Rejected';
    if (isTerminal || !req.createdAtUtc) return false;
    const ageHours = (Date.now() - new Date(req.createdAtUtc).getTime()) / 3600000;
    return ageHours >= 4;
  };

  const criticalCount = requests.filter(
    (r) => r.finalApprovedUrgency === 'LifeThreatening' || r.finalApprovedUrgency === 'Critical'
  ).length;
  const overdueCount = requests.filter((r) => isRequestOverdue(r)).length;
  const suspiciousCount = requests.filter((r) => Boolean(r.isFlaggedSuspicious)).length;
  const duplicateCount = requests.filter((r) => Boolean(r.isFlaggedPotentialDuplicate)).length;

  const filteredRequests = requests
    .filter((req) => {
      const matchesSearch =
        !searchQuery.trim() ||
        req.referenceCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.locationAddress?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (categoryFilter !== 'ALL' && req.category !== categoryFilter) return false;
      if (urgencyFilter !== 'ALL' && req.finalApprovedUrgency !== urgencyFilter) return false;

      if (activeFilter === 'critical') {
        return req.finalApprovedUrgency === 'LifeThreatening' || req.finalApprovedUrgency === 'Critical';
      }
      if (activeFilter === 'overdue') {
        return isRequestOverdue(req);
      }
      if (activeFilter === 'suspicious') {
        return Boolean(req.isFlaggedSuspicious);
      }
      if (activeFilter === 'duplicates') {
        return Boolean(req.isFlaggedPotentialDuplicate);
      }
      if (activeFilter === 'verified') {
        return req.status === 'Verified' || req.status === 'Escalated' || req.status === 'Dispatched';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAtUtc || 0).getTime() - new Date(a.createdAtUtc || 0).getTime();
      }
      if (sortBy === 'people') {
        return (Number(b.affectedPeopleCount) || 0) - (Number(a.affectedPeopleCount) || 0);
      }
      return (Number(b.priorityScore) || 0) - (Number(a.priorityScore) || 0);
    });

  const handleExportSitRepCsv = () => {
    const csvRows: string[] = [
      [
        'ReferenceCode',
        'Category',
        'Urgency',
        'PriorityScore',
        'Status',
        'Title',
        'AffectedPeople',
        'RequestedQty',
        'LocationAddress',
        'DuplicateFlag',
        'SuspiciousFlag',
        'CreatedAtUtc'
      ].join(',')
    ];

    for (const r of filteredRequests) {
      const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      csvRows.push(
        [
          escapeCsv(r.referenceCode),
          escapeCsv(r.category),
          escapeCsv(r.finalApprovedUrgency),
          escapeCsv(r.priorityScore),
          escapeCsv(r.status),
          escapeCsv(r.title),
          escapeCsv(r.affectedPeopleCount),
          escapeCsv(r.requestedQuantity),
          escapeCsv(r.locationAddress),
          escapeCsv(Boolean(r.isFlaggedPotentialDuplicate)),
          escapeCsv(Boolean(r.isFlaggedSuspicious)),
          escapeCsv(r.createdAtUtc)
        ].join(',')
      );
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CriSync_SitRep_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSitRepJson = () => {
    const payload = sitRepReport || {
      generatedAtUtc: new Date().toISOString(),
      activeCrisisTitle: crises[0]?.title || 'Active Operation',
      metrics,
      feedbackAnalytics,
      exportedRequestsCount: filteredRequests.length,
      requests: filteredRequests
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CriSync_SitRep_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeLangOption = LANGUAGE_OPTIONS.find((l) => l.code === langKey) || LANGUAGE_OPTIONS[0];

  return (
    <div className="space-y-6" dir={t.dir}>
      {crises.length === 0 && requests.length === 0 && (
        <div className="bento-glass rounded-3xl p-5 border border-indigo-500/35 bg-indigo-500/[0.06] flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              Getting Started — Clean Project Setup Guide
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Welcome to CriSync Live Mode (All Demo Data Removed)
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              1) As <strong className="text-white">Emergency Coordinator</strong> or <strong className="text-white">System Admin</strong>, click <strong className="text-indigo-300">Declare New Crisis Event</strong> below to open an active emergency. 2) Broadcast a <strong className="text-rose-300">Public Alert</strong> and add safe <strong className="text-amber-300">Shelters</strong> & <strong className="text-emerald-300">Warehouse Stock</strong>. 3) Register or sign in as a <strong className="text-sky-300">Citizen</strong> to submit real help requests for AI triage and dispatch.
            </p>
          </div>
        </div>
      )}

      {(canDeclareOrAlert || canRegisterCitizenProxy || canInviteOperational) && (
        <div className="bento-glass rounded-3xl overflow-hidden border border-indigo-500/30">
          <button
            type="button"
            onClick={() => setCommandOpen((prev) => !prev)}
            className="w-full px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-white/[0.03] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Command, Invitations & Field Onboarding Actions
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {userRole === 'CaseManager'
                    ? 'Register Offline Citizens on Behalf of Victims'
                    : 'Broadcast Alerts, Declare Crises, Register Citizens & Invite Operational Staff'}
                </h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/15 text-zinc-200">
              <span>{commandOpen ? 'Hide Command Panel' : 'Open Command Panel'}</span>
              {commandOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          <AnimatePresence>
            {commandOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-2 border-t border-white/[0.08] space-y-4">
              <div className="flex flex-wrap gap-2">
                {canDeclareOrAlert && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCommandTab('alert')}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${commandTab === 'alert'
                          ? 'bg-rose-600 border-rose-500 text-white keep-white shadow-sm'
                          : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Broadcast Public Alert</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandTab('crisis')}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${commandTab === 'crisis'
                          ? 'bg-indigo-600 border-indigo-500 text-white keep-white shadow-sm'
                          : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Declare New Crisis Event</span>
                    </button>
                    {onCreateOperationalArea && crises.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCommandTab('operational-zone')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${commandTab === 'operational-zone'
                            ? 'bg-cyan-600 border-cyan-500 text-white keep-white shadow-sm'
                            : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Add Operational Area</span>
                      </button>
                    )}
                  </>
                )}
                {canRegisterCitizenProxy && onRegisterCitizenOnBehalf && (
                  <button
                    type="button"
                    onClick={() => setCommandTab('citizen-behalf')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${commandTab === 'citizen-behalf'
                        ? 'bg-sky-600 border-sky-500 text-white keep-white shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Citizen on Behalf</span>
                  </button>
                )}
                {canInviteOperational && onInviteStaff && (
                  <button
                    type="button"
                    onClick={() => setCommandTab('invite-staff')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${commandTab === 'invite-staff'
                        ? 'bg-amber-600 border-amber-500 text-white keep-white shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Invite Operational Role</span>
                  </button>
                )}
              </div>

              {commandTab === 'citizen-behalf' && canRegisterCitizenProxy ? (
                    <form key="citizen-behalf-form" onSubmit={handleCitizenProxySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="md:col-span-3 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-[11px]">
                    <strong className="text-white">Case Manager Proxy Onboarding:</strong> Register an affected Citizen who lacks a phone or internet connection during a disaster, including their household vulnerability profile.
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Citizen Full Name</label>
                    <input
                      type="text"
                      name="crisync_proxy_citizen_name"
                      autoComplete="off"
                      required
                      value={citizenProxyForm.fullName}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, fullName: e.target.value })}
                      placeholder="Affected resident full name"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Email or Household ID</label>
                    <input
                      type="email"
                      name="crisync_proxy_citizen_email"
                      autoComplete="off"
                      required
                      readOnly={!unlockedFields.citizenEmail}
                      onFocus={() => unlockField('citizenEmail')}
                      onMouseDown={() => unlockField('citizenEmail')}
                      onKeyDown={() => unlockField('citizenEmail')}
                      value={citizenProxyForm.email}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, email: e.target.value })}
                      placeholder="citizen.name@offline.crisync.org"
                      className="rsvp-input"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: kamal.perera@offline.crisync.org (if resident has no email)
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Contact Phone / Neighbour Phone</label>
                    <input
                      type="text"
                      name="crisync_proxy_citizen_phone"
                      autoComplete="off"
                      value={citizenProxyForm.phoneNumber}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, phoneNumber: e.target.value })}
                      placeholder="Optional contact number"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Assigned Access Password</label>
                    <input
                      type="text"
                      name="crisync_proxy_citizen_password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      readOnly={!unlockedFields.citizenPassword}
                      onFocus={() => unlockField('citizenPassword')}
                      onMouseDown={() => unlockField('citizenPassword')}
                      onKeyDown={() => unlockField('citizenPassword')}
                      value={citizenProxyForm.password}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, password: e.target.value })}
                      placeholder="Temporary access password"
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-zinc-300 mb-1">Residential Location / Relief Zone</label>
                    <input
                      type="text"
                      required
                      value={citizenProxyForm.primaryAddress}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, primaryAddress: e.target.value })}
                      placeholder="Village, street, or shelter camp name"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Total Family Members</label>
                    <input
                      type="number"
                      min={1}
                      value={citizenProxyForm.totalMembers}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, totalMembers: Number(e.target.value) })}
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Children Count</label>
                    <input
                      type="number"
                      min={0}
                      value={citizenProxyForm.childrenCount}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, childrenCount: Number(e.target.value) })}
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Elderly Count</label>
                    <input
                      type="number"
                      min={0}
                      value={citizenProxyForm.elderlyCount}
                      onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, elderlyCount: Number(e.target.value) })}
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div className="md:col-span-3 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={citizenProxyForm.hasMobilityNeeds}
                        onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, hasMobilityNeeds: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Mobility / Wheelchair Support Needed
                    </label>
                    <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={citizenProxyForm.hasChronicMedicalNeeds}
                        onChange={(e) => setCitizenProxyForm({ ...citizenProxyForm, hasChronicMedicalNeeds: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Chronic Medical / Medication Needs
                    </label>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={commandSubmitting}
                      className="keep-white px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{commandSubmitting ? 'Registering...' : 'Register Citizen Account & Family Profile'}</span>
                    </button>
                  </div>
                </form>
              ) : commandTab === 'invite-staff' && canInviteOperational ? (
                    <form key="invite-staff-form" onSubmit={handleInviteStaffSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="md:col-span-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                    <strong className="text-white">Invitation Authority:</strong> System Admin and Emergency Coordinator can invite <strong>Case Manager</strong>, <strong>Shelter Admin</strong>, <strong>Resource & Logistics Manager</strong>, and <strong>Volunteer Coordinator</strong>. Note: <strong>Donor / Funding Officer</strong> handles money & financial transactions and can only be invited exclusively by the <strong>Global System Admin</strong>.
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Invited Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="rsvp-input"
                    >
                      <option value="CaseManager">Case Manager</option>
                      <option value="ShelterAdmin">Shelter Administrator</option>
                      <option value="LogisticsManager">Resource & Logistics Manager</option>
                      <option value="VolunteerCoordinator">Volunteer Coordinator</option>
                      {userRole === 'SystemAdmin' && (
                        <option value="DonorOfficer">Donor / Funding Officer (Global System Admin Only)</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="crisync_invite_staff_name"
                      autoComplete="off"
                      required
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                      placeholder="Officer's full name"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Work Email</label>
                    <input
                      type="email"
                      name="crisync_invite_staff_email"
                      autoComplete="off"
                      required
                      readOnly={!unlockedFields.inviteEmail}
                      onFocus={() => unlockField('inviteEmail')}
                      onMouseDown={() => unlockField('inviteEmail')}
                      onKeyDown={() => unlockField('inviteEmail')}
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="officer@organisation.org"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="crisync_invite_staff_phone"
                      autoComplete="off"
                      value={inviteForm.phoneNumber}
                      onChange={(e) => setInviteForm({ ...inviteForm, phoneNumber: e.target.value })}
                      placeholder="+94 77 123 4567"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Temporary Password</label>
                    <input
                      type="text"
                      name="crisync_invite_staff_password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      readOnly={!unlockedFields.invitePassword}
                      onFocus={() => unlockField('invitePassword')}
                      onMouseDown={() => unlockField('invitePassword')}
                      onKeyDown={() => unlockField('invitePassword')}
                      value={inviteForm.temporaryPassword}
                      onChange={(e) => setInviteForm({ ...inviteForm, temporaryPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="rsvp-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Organisation</label>
                    <select
                      value={inviteForm.organisationId}
                      onChange={(e) => setInviteForm({ ...inviteForm, organisationId: e.target.value })}
                      className="rsvp-input"
                    >
                      <option value="">Independent / Coordinating Team</option>
                      {organisations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {lastInvitationResult && (
                    <div className="md:col-span-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 font-mono text-[11px]">
                      Invitation Issued ({lastInvitationResult.invitationCode}) • {lastInvitationResult.fullName} ({lastInvitationResult.role}) • Email: {lastInvitationResult.email} • Password: {lastInvitationResult.temporaryPassword}
                    </div>
                  )}
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={commandSubmitting}
                      className="keep-white px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{commandSubmitting ? 'Sending Invite...' : 'Issue Staff Invitation & Credentials'}</span>
                    </button>
                  </div>
                </form>
              ) : commandTab === 'alert' ? (
                <form onSubmit={handleBroadcastAlert} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Target Crisis Event</label>
                    <select
                      value={activeAlertCrisisId}
                      onChange={(e) => setAlertCrisisId(e.target.value)}
                      className="rsvp-input"
                    >
                      {crises.length === 0 && (
                        <option value="">No Crisis Events Yet — Declare a Crisis First</option>
                      )}
                      {crises.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.severity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Alert Severity Level</label>
                    <select
                      value={alertSeverity}
                      onChange={(e) => setAlertSeverity(e.target.value)}
                      className="rsvp-input"
                    >
                      <option value="Advisory">Advisory (Stay Informed)</option>
                      <option value="Warning">Warning (Prepare to Evacuate)</option>
                      <option value="Critical">Critical (Immediate Evacuation)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-zinc-300 mb-1">Public Alert Headline</label>
                    <input
                      type="text"
                      required
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                      placeholder="Short clear public emergency headline"
                      className="rsvp-input"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: Flash Flood Evacuation Warning — Low-Lying Areas Near Colombo Port
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Broadcast Message</label>
                    <textarea
                      required
                      rows={3}
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Describe the danger zone and immediate public situation"
                      className="rsvp-input resize-none"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: River levels exceeded danger mark at 14:30. Residents in Zone A should move to higher ground.
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Safety Guidance for Citizens</label>
                    <textarea
                      required
                      rows={3}
                      value={alertGuidance}
                      onChange={(e) => setAlertGuidance(e.target.value)}
                      placeholder="Actionable checklist for families and caregivers"
                      className="rsvp-input resize-none"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: Switch off main breaker, pack medicines and IDs, proceed to nearest designated school shelter.
                    </p>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={commandSubmitting || !activeAlertCrisisId}
                      className="keep-white px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{commandSubmitting ? 'Broadcasting...' : 'Broadcast Public Alert Now'}</span>
                    </motion.button>
                  </div>
                </form>
              ) : commandTab === 'operational-zone' && canDeclareOrAlert && onCreateOperationalArea ? (
                <form onSubmit={handleCreateZoneSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Crisis Event</label>
                    <select
                      value={zoneForm.crisisId || crises[0]?.id || ''}
                      onChange={(e) => setZoneForm({ ...zoneForm, crisisId: e.target.value })}
                      className="rsvp-input"
                    >
                      {crises.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Operational Zone Name</label>
                    <input
                      type="text"
                      required
                      value={zoneForm.zoneName}
                      onChange={(e) => setZoneForm({ ...zoneForm, zoneName: e.target.value })}
                      placeholder="e.g., Sector Delta - Pelmadulla Valley"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">District</label>
                    <input
                      type="text"
                      required
                      value={zoneForm.district}
                      onChange={(e) => setZoneForm({ ...zoneForm, district: e.target.value })}
                      placeholder="e.g., Ratnapura"
                      className="rsvp-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Latitude / Longitude</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={zoneForm.latitude}
                        onChange={(e) => setZoneForm({ ...zoneForm, latitude: Number(e.target.value) })}
                        className="rsvp-input font-mono"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        value={zoneForm.longitude}
                        onChange={(e) => setZoneForm({ ...zoneForm, longitude: Number(e.target.value) })}
                        className="rsvp-input font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Radius (km) &amp; Affected Pop.</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={1}
                        value={zoneForm.coverageRadiusKm}
                        onChange={(e) => setZoneForm({ ...zoneForm, coverageRadiusKm: Number(e.target.value) })}
                        className="rsvp-input font-mono"
                      />
                      <input
                        type="number"
                        min={0}
                        value={zoneForm.estimatedAffectedPopulation}
                        onChange={(e) => setZoneForm({ ...zoneForm, estimatedAffectedPopulation: Number(e.target.value) })}
                        className="rsvp-input font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Risk Level &amp; Assigned Agency</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={zoneForm.riskLevel}
                        onChange={(e) => setZoneForm({ ...zoneForm, riskLevel: e.target.value })}
                        className="rsvp-input"
                      >
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <select
                        value={zoneForm.assignedOrganisationId}
                        onChange={(e) => setZoneForm({ ...zoneForm, assignedOrganisationId: e.target.value })}
                        className="rsvp-input"
                      >
                        <option value="">Any Agency</option>
                        {organisations.map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={commandSubmitting}
                      className="keep-white px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{commandSubmitting ? 'Saving...' : 'Create Operational Zone'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterCrisis} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-zinc-300 mb-1">Crisis Title</label>
                    <input
                      type="text"
                      required
                      value={crisisTitle}
                      onChange={(e) => setCrisisTitle(e.target.value)}
                      placeholder="Official disaster or emergency operation name"
                      className="rsvp-input"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: Western Province Monsoon Flood Response 2026
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Crisis Type</label>
                    <select
                      value={crisisType}
                      onChange={(e) => setCrisisType(e.target.value)}
                      className="rsvp-input"
                    >
                      <option value="Flood">Flood</option>
                      <option value="Landslide">Landslide</option>
                      <option value="Earthquake">Earthquake</option>
                      <option value="SevereStorm">Severe Storm</option>
                      <option value="DiseaseOutbreak">Disease Outbreak</option>
                      <option value="MassDisplacement">Mass Displacement</option>
                      <option value="Other">Other Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Severity Rating</label>
                    <select
                      value={crisisSeverity}
                      onChange={(e) => setCrisisSeverity(e.target.value)}
                      className="rsvp-input"
                    >
                      <option value="Low">Low</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                      <option value="Catastrophic">Catastrophic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={crisisCountry}
                      onChange={(e) => setCrisisCountry(e.target.value)}
                      placeholder="Country name"
                      className="rsvp-input"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: Sri Lanka
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Affected Region / Districts</label>
                    <input
                      type="text"
                      required
                      value={crisisRegion}
                      onChange={(e) => setCrisisRegion(e.target.value)}
                      placeholder="Districts, provinces, or river basin"
                      className="rsvp-input"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: Colombo & Gampaha Districts
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Center Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={crisisLat}
                      onChange={(e) => setCrisisLat(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: 6.9271 (Decimal GPS Latitude)
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Center Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={crisisLon}
                      onChange={(e) => setCrisisLon(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: 79.8612 (Decimal GPS Longitude)
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Impact Radius (km)</label>
                    <input
                      type="number"
                      min={1}
                      value={crisisRadiusKm}
                      onChange={(e) => setCrisisRadiusKm(Number(e.target.value))}
                      className="rsvp-input font-mono"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: 15 km emergency perimeter
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-zinc-300 mb-1">Operational Situation Summary</label>
                    <textarea
                      required
                      rows={2}
                      value={crisisDescription}
                      onChange={(e) => setCrisisDescription(e.target.value)}
                      placeholder="Summarize initial field assessment and priority response needs"
                      className="rsvp-input resize-none"
                    />
                    <p className="text-[11px] text-zinc-400/75 opacity-75 mt-1 font-normal">
                      Example: Heavy rainfall caused localized flash flooding; rescue boats, clean water, and emergency medical packs needed.
                    </p>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={commandSubmitting}
                      className="keep-white px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{commandSubmitting ? 'Declaring...' : 'Declare & Activate Crisis Event'}</span>
                    </motion.button>
                  </div>
                </form>
              )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="bento-glass rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border border-indigo-500/25 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-emerald-300">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-ping'}`} />
            Live Command Telemetry
          </span>
          <span className="text-zinc-400 hidden sm:inline">•</span>
          <span className="text-zinc-300 font-semibold hidden sm:inline">
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
