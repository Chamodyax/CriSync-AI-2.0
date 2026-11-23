import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePlus2,
  Home,
  ShieldAlert,
  Building2,
  Star,
  MessageSquare,
  Send,
  X,
  Upload,
  MapPin,
  HeartPulse,
  CheckCircle2,
  History,
  Sparkles,
  QrCode,
  Wand2,
  ChevronDown,
  ChevronUp,
  Globe,
  Bot,
  ArrowRight,
  ArrowLeft,
  Compass,
  LayoutGrid,
  Lightbulb,
  ClipboardCheck,
  AlertCircle,
  Camera,
  BellRing,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  SupportedLanguage,
  TRANSLATIONS,
  QuickTemplateItem,
  generateAutomatedAiSupportReply
} from '../i18n';

interface QueuedOfflineRequest {
  localId: string;
  queuedAtIso: string;
  payload: any;
}

const OFFLINE_QUEUE_STORAGE_KEY = 'crisync_offline_request_queue';
const CITIZEN_FORM_DRAFT_KEY = 'crisync_citizen_form_draft';

interface CitizenPortalTabProps {
  alerts: any[];
  crises?: any[];
  shelters: any[];
  requests: any[];
  notifications?: any[];
  household: any | null;
  currentUserId?: string;
  briefing?: any | null;
  activeLanguage?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  onUploadEvidence: (file: File) => Promise<string | null>;
  onSubmitRequest: (payload: any) => Promise<boolean | void>;
  onSaveHousehold: (payload: any) => Promise<void>;
  onSubmitFeedback: (payload: {
    assistanceRequestId: string;
    rating: number;
    comments: string;
    wasAidTimely: boolean;
    wasQuantitySufficient: boolean;
  }) => Promise<void>;
}

const categoryKeys = [
  'Medicine',
  'Food',
  'WaterAndSanitation',
  'TemporaryShelter',
  'SearchAndRescue',
  'AccessibilityAssistance',
  'Transportation'
];

const urgencyStyles: Record<string, string> = {
  Low: 'border-zinc-500/40 text-zinc-300 bg-zinc-500/10',
  Medium: 'border-sky-500/40 text-sky-300 bg-sky-500/10',
  High: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
  Critical: 'border-orange-500/40 text-orange-300 bg-orange-500/15',
  LifeThreatening: 'border-rose-500/50 text-rose-300 bg-rose-500/20'
};

type WizardStepNumber = 1 | 2 | 3 | 4 | 5;

export const CitizenPortalTab: React.FC<CitizenPortalTabProps> = ({
  alerts,
  crises = [],
  shelters,
  requests,
  notifications = [],
  household,
  currentUserId,
  briefing,
  activeLanguage = 'en',
  onChangeLanguage,
  onUploadEvidence,
  onSubmitRequest,
  onSaveHousehold,
  onSubmitFeedback
}) => {
  const [savedDraft] = useState<any>(() => {
    try {
      const raw = localStorage.getItem(CITIZEN_FORM_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [portalMode, setPortalMode] = useState<'guided' | 'tabs'>(savedDraft?.portalMode || 'guided');
  const [wizardStep, setWizardStep] = useState<WizardStepNumber>(savedDraft?.wizardStep || 1);
  const [familyConfirmed, setFamilyConfirmed] = useState(savedDraft?.familyConfirmed ?? false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [savingFamily, setSavingFamily] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [aiHelperOpen, setAiHelperOpen] = useState(false);
  const [appliedTemplateLabel, setAppliedTemplateLabel] = useState<string | null>(null);
  const [lastSubmittedTitle, setLastSubmittedTitle] = useState('');

  const [activeSection, setActiveSection] = useState<'all' | 'request' | 'ai-support' | 'track' | 'family' | 'shelters'>('all');
  const [showExactGps, setShowExactGps] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(activeLanguage || 'en');

  const [selectedCrisisId, setSelectedCrisisId] = useState(savedDraft?.selectedCrisisId || '');
  const [title, setTitle] = useState(savedDraft?.title || '');
  const [description, setDescription] = useState(savedDraft?.description || '');
  const [category, setCategory] = useState(savedDraft?.category || 'Food');
  const [urgency, setUrgency] = useState(savedDraft?.urgency || 'High');
  const [peopleCount, setPeopleCount] = useState(savedDraft?.peopleCount || 1);
  const [quantity, setQuantity] = useState(savedDraft?.quantity || 1);
  const [accessibility, setAccessibility] = useState(savedDraft?.accessibility ?? false);
  const [address, setAddress] = useState(savedDraft?.address || '');
  const [latitude, setLatitude] = useState(savedDraft?.latitude || 6.9271);
  const [longitude, setLongitude] = useState(savedDraft?.longitude || 79.8612);
  const [evidenceFileName, setEvidenceFileName] = useState(savedDraft?.evidenceFileName || '');

  const [headName, setHeadName] = useState(savedDraft?.headName || '');
  const [totalMembers, setTotalMembers] = useState(savedDraft?.totalMembers || 1);
  const [childrenCount, setChildrenCount] = useState(savedDraft?.childrenCount || 0);
  const [elderlyCount, setElderlyCount] = useState(savedDraft?.elderlyCount || 0);
  const [hasMobility, setHasMobility] = useState(savedDraft?.hasMobility ?? false);
  const [hasChronicMedical, setHasChronicMedical] = useState(savedDraft?.hasChronicMedical ?? false);
  const [medicalNotes, setMedicalNotes] = useState(savedDraft?.medicalNotes || '');

  const [feedbackRequestId, setFeedbackRequestId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [wasAidTimely, setWasAidTimely] = useState(true);
  const [wasQuantitySufficient, setWasQuantitySufficient] = useState(true);

  const [selectedFaqId, setSelectedFaqId] = useState<string>('shelter');
  const [customAiQuery, setCustomAiQuery] = useState('');
  const [customAiReply, setCustomAiReply] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedOfflineRequests, setQueuedOfflineRequests] = useState<QueuedOfflineRequest[]>(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [syncingOfflineQueue, setSyncingOfflineQueue] = useState(false);
  const [offlineStatusNotice, setOfflineStatusNotice] = useState<string | null>(null);
  const [lastSubmitQueuedOffline, setLastSubmitQueuedOffline] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queuedOfflineRequests));
    } catch {
    }
  }, [queuedOfflineRequests]);

  useEffect(() => {
    if (title || description || address || headName || totalMembers > 1 || wizardStep > 1) {
      try {
        localStorage.setItem(CITIZEN_FORM_DRAFT_KEY, JSON.stringify({
          portalMode,
          wizardStep,
          familyConfirmed,
          selectedCrisisId,
          title,
          description,
          category,
          urgency,
          peopleCount,
          quantity,
          accessibility,
          address,
          latitude,
          longitude,
          evidenceFileName,
          headName,
          totalMembers,
          childrenCount,
          elderlyCount,
          hasMobility,
          hasChronicMedical,
          medicalNotes
        }));
      } catch {}
    }
  }, [
    portalMode,
    wizardStep,
    familyConfirmed,
    selectedCrisisId,
    title,
    description,
    category,
    urgency,
    peopleCount,
    quantity,
    accessibility,
    address,
    latitude,
    longitude,
    evidenceFileName,
    headName,
    totalMembers,
    childrenCount,
    elderlyCount,
    hasMobility,
    hasChronicMedical,
    medicalNotes
  ]);

  const syncOfflineQueue = async () => {
    if (queuedOfflineRequests.length === 0 || syncingOfflineQueue) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    setSyncingOfflineQueue(true);
    const remaining: QueuedOfflineRequest[] = [];
    let syncedCount = 0;

    for (const item of queuedOfflineRequests) {
      try {
        const result = await onSubmitRequest(item.payload);
        if (result === false) {
          remaining.push(item);
        } else {
          syncedCount++;
        }
      } catch {
        remaining.push(item);
      }
    }

    setQueuedOfflineRequests(remaining);
    setSyncingOfflineQueue(false);
    if (syncedCount > 0) {
      setOfflineStatusNotice(
        remaining.length === 0
          ? `Synced ${syncedCount} offline request(s) to the coordinator queue.`
          : `Synced ${syncedCount} offline request(s); ${remaining.length} waiting for retry.`
      );
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineStatusNotice('Connection offline. New requests will be stored safely on this device and auto-synced when online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedOfflineRequests]);

  useEffect(() => {
    if (activeLanguage && activeLanguage !== language) {
      setLanguage(activeLanguage);
    }
  }, [activeLanguage]);

  useEffect(() => {
    if (household) {
      setHeadName(household.householdHeadName || '');
      setTotalMembers(household.totalMembers || 1);
      setChildrenCount(household.childrenCount ?? 0);
      setElderlyCount(household.elderlyCount ?? 0);
      setHasMobility(Boolean(household.hasMobilityNeeds));
      setHasChronicMedical(Boolean(household.hasChronicMedicalNeeds));
      setMedicalNotes(household.medicalNotes || '');
      if (household.primaryAddress) {
        setAddress(household.primaryAddress);
      }
    }
  }, [household]);

  const activeCrisisId = selectedCrisisId || crises[0]?.id || '';
  const selectedCrisisObj = crises.find((c) => c.id === activeCrisisId) || crises[0] || null;

  const calculateWizardCompletion = (): number => {
    if (wizardStep === 5) return 100;
    let pct = 0;

    if (wizardStep > 1 || familyConfirmed) {
      pct += 25;
    } else if (headName.trim().length > 0) {
      pct += 15;
    }

    if (wizardStep > 2) {
      pct += 25;
    } else if (wizardStep === 2 && appliedTemplateLabel) {
      pct += 15;
    }

    if (wizardStep > 3) {
      pct += 35;
    } else if (wizardStep === 3) {
      if (title.trim().length >= 3) pct += 12;
      if (description.trim().length >= 5) pct += 12;
      if (address.trim().length >= 3) pct += 11;
    }

    if (wizardStep === 4) {
      pct += 5;
    }

    return Math.min(95, pct);
  };

  const completionPercent = calculateWizardCompletion();

  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCustomAiReply(null);
    if (onChangeLanguage) {
      onChangeLanguage(newLang);
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const applyQuickTemplate = (tpl: QuickTemplateItem) => {
    setCategory(tpl.category);
    setUrgency(tpl.urgency);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setPeopleCount(tpl.people);
    setQuantity(tpl.qty);
    setAccessibility(tpl.wheelchair);
    setAppliedTemplateLabel(tpl.label);
    setStepError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const safeName = await onUploadEvidence(selectedFile);
    if (safeName) {
      setEvidenceFileName(safeName);
    }
  };

  const buildRequestPayload = () => ({
    crisisEventId: activeCrisisId,
    category,
    selfReportedUrgency: urgency,
    title,
    description,
    affectedPeopleCount: Number(peopleCount),
    requestedQuantity: Number(quantity),
    requiresAccessibilitySupport: accessibility,
    locationAddress: address,
    latitude: Number(latitude),
    longitude: Number(longitude),
    supportingEvidenceFileName: evidenceFileName,
    supportingEvidenceMimeType: 'image/jpeg',
    preferredLanguage: language,
    idempotencyKey: `REQ-IDEMP-${Date.now()}-${title.trim().toLowerCase().replace(/\s+/g, '-')}`
  });

  const buildHouseholdPayload = () => ({
    householdHeadName: headName,
    totalMembers: Number(totalMembers),
    childrenCount: Number(childrenCount),
    elderlyCount: Number(elderlyCount),
    hasMobilityNeeds: hasMobility,
    hasChronicMedicalNeeds: hasChronicMedical,
    medicalNotes,
    primaryAddress: address,
    latitude: Number(latitude),
    longitude: Number(longitude)
  });

  const submitOrQueueRequest = async (payload: any): Promise<'sent' | 'queued'> => {
    const currentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (!currentlyOffline) {
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
