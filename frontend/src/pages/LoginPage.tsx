import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Mail,
  Lock,
  ArrowUpRight,
  AlertCircle,
  Radio,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Cpu,
  Truck,
  HeartHandshake,
  Home,
  UserCheck,
  Activity,
  Zap,
  Sun,
  Moon,
  HelpCircle,
  User,
  Phone,
  Building2,
  Globe,
  UserPlus,
  KeyRound,
  Fingerprint,
  Trash2
} from 'lucide-react';
import { apiFetch } from '../api';
import { LANGUAGE_OPTIONS } from '../i18n';
import { GlobalEarthBackdrop } from '../components/GlobalEarthBackdrop';
import { PatternLockPad } from '../components/PatternLockPad';
import {
  TrustedDeviceQuickUnlock,
  clearTrustedDeviceUnlock,
  isPlatformBiometricSupported,
  loadTrustedDeviceUnlock,
  verifyDeviceBiometric
} from '../utils/quickUnlock';

export interface RegisterAccountPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  preferredLanguage: string;
  organisationId: string | null;
  primaryAddress?: string;
  totalMembers?: number;
  childrenCount?: number;
  elderlyCount?: number;
  hasMobilityNeeds?: boolean;
  hasChronicMedicalNeeds?: boolean;
  medicalNotes?: string;
  registerAsVolunteer?: boolean;
  skillsCsv?: string;
  languagesCsv?: string;
  availabilitySchedule?: string;
  baseTown?: string;
  organisationName?: string;
  organisationType?: string;
  country?: string;
  partnershipProposal?: string;
}

interface LoginPageProps {
  organisations: any[];
  activeCrisisTitle?: string;
  onLogin: (email: string, password: string, requireAdminRole?: boolean) => Promise<void>;
  onQuickUnlockSuccess: (authResponse: any, methodLabel: string) => Promise<void>;
  onRegister: (payload: RegisterAccountPayload) => Promise<void>;
  onReplayIntro?: () => void;
  errorMessage: string | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const SIGNUP_ROLE_OPTIONS = [
  { value: 'Citizen', label: 'Affected Citizen / Resident (Self-Register)' },
  { value: 'Donor', label: 'Public Donor / Sponsor (Self-Register)' },
  { value: 'Volunteer', label: 'Field Volunteer (Pending Coordinator Activation)' },
  { value: 'PartnerOfficer', label: 'Partner Organization Officer (Partnership Request)' }
];

const INVITED_OPERATIONAL_ROLES = [
  { value: 'EmergencyCoordinator', label: 'Emergency Coordinator', inviteNote: 'Appointed by Global System Admin' },
  { value: 'CaseManager', label: 'Case Manager', inviteNote: 'Invited by System Admin / Coordinator' },
  { value: 'ShelterAdmin', label: 'Shelter Administrator', inviteNote: 'Invited by System Admin / Coordinator' },
  { value: 'LogisticsManager', label: 'Resource & Logistics Manager', inviteNote: 'Invited by System Admin / Coordinator' },
  { value: 'VolunteerCoordinator', label: 'Volunteer Coordinator', inviteNote: 'Invited by System Admin / Coordinator' },
  { value: 'DonorOfficer', label: 'Donor / Funding Officer', inviteNote: 'Invited Exclusively by Global System Admin' }
];

const ADMIN_GOVERNANCE_ROLES = [
  { value: 'SystemAdmin', label: 'Global System Admin' },
  { value: 'OrganizationAdmin', label: 'Organization Admin' }
];

const ALL_PLATFORM_ROLES = [
  ...SIGNUP_ROLE_OPTIONS,
  ...INVITED_OPERATIONAL_ROLES,
  ...ADMIN_GOVERNANCE_ROLES
];

function getRoleMeta(role: string) {
  switch (role) {
    case 'EmergencyCoordinator':
      return {
        title: 'Emergency Coordinator',
        accent: 'from-rose-500/20 to-orange-500/10 border-rose-500/40 text-rose-300',
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        tag: 'Command Lead',
        summary: 'Oversee disaster response, verify cases, and invite operational role staff.'
      };
    case 'CaseManager':
      return {
        title: 'Case Manager',
        accent: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/40 text-indigo-300',
        badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        icon: <Activity className="w-4 h-4 text-indigo-400" />,
        tag: 'Invited Role',
        summary: 'Verify requests, register offline citizens on their behalf, and review AI priorities.'
      };
    case 'LogisticsManager':
      return {
        title: 'Logistics Manager',
        accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: <Truck className="w-4 h-4 text-emerald-400" />,
        tag: 'Invited Role',
        summary: 'Allocate warehouse inventory and dispatch essential emergency supplies.'
      };
    case 'ShelterAdmin':
      return {
        title: 'Shelter Administrator',
        accent: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: <Home className="w-4 h-4 text-amber-400" />,
        tag: 'Invited Role',
        summary: 'Manage temporary shelters, check families in, and track facility capacity.'
      };
    case 'VolunteerCoordinator':
      return {
        title: 'Volunteer Coordinator',
        accent: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/40 text-purple-300',
        badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        icon: <Users className="w-4 h-4 text-purple-400" />,
        tag: 'Invited Role',
        summary: 'Verify & activate Pending volunteers and assign teams to urgent field missions.'
      };
    case 'Volunteer':
      return {
        title: 'Field Volunteer',
        accent: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300',
        badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        icon: <UserCheck className="w-4 h-4 text-teal-400" />,
        tag: 'Self-Register (Pending)',
        summary: 'Self-register with skills & availability; activated after Volunteer Coordinator verification.'
      };
    case 'Donor':
      return {
        title: 'Public Donor',
        accent: 'from-lime-500/20 to-emerald-500/10 border-lime-500/40 text-lime-300',
        badge: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
        icon: <HeartHandshake className="w-4 h-4 text-lime-400" />,
        tag: 'Self-Register',
        summary: 'Self-register independently to donate funds or supplies and follow impact.'
      };
    case 'DonorOfficer':
      return {
        title: 'Donor / Funding Officer',
        accent: 'from-pink-500/20 to-rose-500/10 border-pink-500/40 text-pink-300',
        badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        icon: <HeartHandshake className="w-4 h-4 text-pink-400" />,
        tag: 'SystemAdmin Only',
        summary: 'Appointed exclusively by Global System Admin for financial campaign & compliance control.'
      };
    case 'PartnerOfficer':
      return {
        title: 'Partner Organization Officer',
        accent: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/40 text-cyan-300',
        badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        icon: <Zap className="w-4 h-4 text-cyan-400" />,
        tag: 'Partnership Request',
        summary: 'Register & submit a partnership request for Admin approval to coordinate aid.'
      };
    case 'OrganizationAdmin':
      return {
        title: 'Organization Admin',
        accent: 'from-fuchsia-500/20 to-violet-500/10 border-fuchsia-500/40 text-fuchsia-300',
        badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
        icon: <Building2 className="w-4 h-4 text-fuchsia-400" />,
        tag: 'Regional Admin',
        summary: 'Manage organization staff accounts, approve partner organizations & view logs.'
      };
    case 'SystemAdmin':
      return {
        title: 'Global System Admin',
        accent: 'from-violet-500/20 to-indigo-500/10 border-violet-500/40 text-violet-300',
        badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        icon: <Cpu className="w-4 h-4 text-violet-400" />,
        tag: 'Global Admin',
        summary: 'Full global control: invite Donor Officers, enforce Small Admin Policy, roles & integrations.'
      };
    default:
      return {
        title: 'Affected Citizen',
        accent: 'from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-300',
        badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        icon: <UserCheck className="w-4 h-4 text-sky-400" />,
        tag: 'Self-Register',
        summary: 'Self-register or be registered by a Case Manager to request aid & locate shelters.'
      };
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({
  organisations,
  activeCrisisTitle,
  onLogin,
  onQuickUnlockSuccess,
  onRegister,
  onReplayIntro,
  errorMessage,
  theme,
  onToggleTheme
}) => {
  const [trustedUnlock, setTrustedUnlock] = useState<TrustedDeviceQuickUnlock | null>(() =>
    loadTrustedDeviceUnlock()
  );
  const [roleExplorerTab, setRoleExplorerTab] = useState<'public' | 'operations' | 'admin' | 'all'>('public');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [quickPinInput, setQuickPinInput] = useState('');
  const [quickPatternInput, setQuickPatternInput] = useState('');
  const [quickUnlockError, setQuickUnlockError] = useState<string | null>(null);
  const [quickUnlockBusy, setQuickUnlockBusy] = useState(false);

  useEffect(() => {
    void isPlatformBiometricSupported().then(setBiometricAvailable);
  }, []);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'admin'>('signin');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [unlockedInputs, setUnlockedInputs] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const unlockInput = (fieldKey: string) => {
    setUnlockedInputs((prev) => (prev[fieldKey] ? prev : { ...prev, [fieldKey]: true }));
  };

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Citizen');
  const [regLanguage, setRegLanguage] = useState('en');
  const [regOrganisationId, setRegOrganisationId] = useState('');
  const [regPrimaryAddress, setRegPrimaryAddress] = useState('');
  const [regTotalMembers, setRegTotalMembers] = useState(1);
  const [regChildrenCount, setRegChildrenCount] = useState(0);
  const [regElderlyCount, setRegElderlyCount] = useState(0);
  const [regHasMobilityNeeds, setRegHasMobilityNeeds] = useState(false);
  const [regHasChronicMedicalNeeds, setRegHasChronicMedicalNeeds] = useState(false);
  const [regMedicalNotes, setRegMedicalNotes] = useState('');
  const [regAsVolunteer, setRegAsVolunteer] = useState(false);
  const [regSkillsCsv, setRegSkillsCsv] = useState('');
  const [regLanguagesCsv, setRegLanguagesCsv] = useState('');
  const [regAvailability, setRegAvailability] = useState('');
  const [regBaseTown, setRegBaseTown] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regOrgType, setRegOrgType] = useState('Partner NGO');
  const [regOrgCountry, setRegOrgCountry] = useState('');
  const [regPartnershipProposal, setRegPartnershipProposal] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const activeEmail = authMode === 'admin' ? adminEmail : signInEmail;
    const activePassword = authMode === 'admin' ? adminPassword : signInPassword;
    await onLogin(activeEmail, activePassword, authMode === 'admin');
    setSubmitting(false);
  };

  const handleQuickSecretUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trustedUnlock) return;
    const secret = trustedUnlock.mode === 'Pattern' ? quickPatternInput.trim() : quickPinInput.trim();
    if (trustedUnlock.mode === 'Pin' && !/^\d{6}$/.test(secret)) {
      setQuickUnlockError('Enter your 6-digit Quick Unlock PIN.');
      return;
    }
    if (trustedUnlock.mode === 'Pattern' && secret.split('-').filter(Boolean).length < 4) {
      setQuickUnlockError('Connect at least 4 dots on the pattern pad.');
      return;
    }

    setQuickUnlockError(null);
    setQuickUnlockBusy(true);
    try {
      const authRes = await apiFetch<any>('/auth/quick-unlock/verify', {
        method: 'POST',
        body: JSON.stringify({
          userId: trustedUnlock.userId,
          deviceToken: trustedUnlock.deviceToken,
          secret
        })
      });
      await onQuickUnlockSuccess(authRes, `Trusted-Device ${trustedUnlock.mode}`);
    } catch (err: any) {
      const msg = err?.message || 'Quick Unlock failed.';
      setQuickUnlockError(msg);
      if (
        msg.toLowerCase().includes('locked after 3') ||
        msg.toLowerCase().includes('not active for this device') ||
        msg.toLowerCase().includes('device binding expired')
      ) {
        clearTrustedDeviceUnlock();
        setTrustedUnlock(null);
      }
      setQuickPinInput('');
      setQuickPatternInput('');
    } finally {
      setQuickUnlockBusy(false);
    }
  };

  const handleQuickBiometricUnlock = async () => {
    if (!trustedUnlock?.hasBiometricCredential || !trustedUnlock.credentialId) return;
    setQuickUnlockError(null);
    setQuickUnlockBusy(true);
    try {
      const challengeRes = await apiFetch<any>('/auth/quick-unlock/challenge', {
        method: 'POST',
        body: JSON.stringify({
          userId: trustedUnlock.userId,
          deviceToken: trustedUnlock.deviceToken
        })
      });
      const assertion = await verifyDeviceBiometric(
        challengeRes.challengeBase64Url,
        challengeRes.credentialId || trustedUnlock.credentialId
      );
      const authRes = await apiFetch<any>('/auth/quick-unlock/biometric', {
        method: 'POST',
        body: JSON.stringify({
          userId: trustedUnlock.userId,
          deviceToken: trustedUnlock.deviceToken,
          challengeId: challengeRes.challengeId,
          credentialId: assertion.credentialId,
          clientDataJsonBase64Url: assertion.clientDataJsonBase64Url
        })
      });
      await onQuickUnlockSuccess(authRes, 'Biometrics / Windows Hello');
    } catch (err: any) {
      setQuickUnlockError(err?.message || 'Biometric verification was cancelled or declined.');
    } finally {
      setQuickUnlockBusy(false);
    }
  };

  const handleForgetTrustedDevice = () => {
    clearTrustedDeviceUnlock();
    setTrustedUnlock(null);
    setQuickUnlockError(null);
    setQuickPinInput('');
    setQuickPatternInput('');
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onRegister({
      fullName: regFullName,
      email: regEmail,
      phoneNumber: regPhone,
      password: regPassword,
      role: regRole,
      preferredLanguage: regLanguage,
      organisationId: regRole === 'PartnerOfficer' && regOrganisationId ? regOrganisationId : null,
      primaryAddress: regPrimaryAddress,
      totalMembers: regTotalMembers,
      childrenCount: regChildrenCount,
      elderlyCount: regElderlyCount,
      hasMobilityNeeds: regHasMobilityNeeds,
      hasChronicMedicalNeeds: regHasChronicMedicalNeeds,
      medicalNotes: regMedicalNotes,
      registerAsVolunteer: regAsVolunteer || regRole === 'Volunteer',
      skillsCsv: regSkillsCsv,
      languagesCsv: regLanguagesCsv,
      availabilitySchedule: regAvailability,
      baseTown: regBaseTown,
      organisationName: regRole === 'PartnerOfficer' ? regOrgName : undefined,
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
