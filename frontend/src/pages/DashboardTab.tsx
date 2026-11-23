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
