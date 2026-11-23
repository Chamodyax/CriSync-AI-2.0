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
      organisationType: regRole === 'PartnerOfficer' ? regOrgType : undefined,
      country: regRole === 'PartnerOfficer' ? regOrgCountry : undefined,
      partnershipProposal: regRole === 'PartnerOfficer' ? regPartnershipProposal : undefined
    });
    setSubmitting(false);
  };

  const resetCredentialInputs = () => {
    setSignInEmail('');
    setSignInPassword('');
    setAdminEmail('');
    setAdminPassword('');
    setRegEmail('');
    setRegPassword('');
    setUnlockedInputs({});
  };

  const startRegistrationForRole = (roleValue: string) => {
    if (roleValue === 'SystemAdmin' || roleValue === 'OrganizationAdmin') {
      startAdminLogin();
      return;
    }
    resetCredentialInputs();
    setRegRole(roleValue);
    setAuthMode('signup');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startCreateAccountMode = () => {
    resetCredentialInputs();
    setAuthMode('signup');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startSignInMode = () => {
    resetCredentialInputs();
    setAuthMode('signin');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startAdminLogin = () => {
    resetCredentialInputs();
    setAuthMode('admin');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#07090e] text-zinc-100 flex flex-col justify-between relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      <GlobalEarthBackdrop theme={theme} variant="login" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: theme === 'light' ? [0.42, 0.62, 0.42] : [0.22, 0.38, 0.22], x: [0, 35, 0], y: [0, -25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full blur-3xl ${
            theme === 'light' ? 'bg-indigo-400/35' : 'bg-indigo-600/20'
          }`}
        />
        <motion.div
          animate={{ scale: [1.1, 0.92, 1.1], opacity: theme === 'light' ? [0.38, 0.58, 0.38] : [0.18, 0.34, 0.18], x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute bottom-[-140px] right-[-100px] w-[540px] h-[540px] rounded-full blur-3xl ${
            theme === 'light' ? 'bg-cyan-400/35' : 'bg-cyan-500/15'
          }`}
        />
        <motion.div
          animate={{ scale: [0.95, 1.15, 0.95], opacity: theme === 'light' ? [0.32, 0.5, 0.32] : [0.1, 0.18, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute bottom-16 -left-20 w-[400px] h-[400px] rounded-full blur-3xl ${
            theme === 'light' ? 'bg-rose-300/30' : 'bg-rose-500/10'
          }`}
        />
        <motion.div
          animate={{ scale: [0.8, 1.45], opacity: [0.28, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeOut' }}
          className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-indigo-400/20"
        />
        <motion.div
          animate={{ scale: [0.8, 1.45], opacity: [0.22, 0] }}
          transition={{ duration: 4.5, delay: 2.2, repeat: Infinity, ease: 'easeOut' }}
          className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-cyan-400/15"
        />
      </div>

      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <img
            src="/crisync-logo.png"
            alt="CriSync Logo"
            onClick={onReplayIntro}
            title="Replay Crisis + Sync → CriSync Intro Animation"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover crisync-logo-frame shrink-0 cursor-pointer"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="crisync-wordmark text-2xl sm:text-3xl lg:text-[34px]">
                <span className="crisync-wordmark-primary">Cri</span>
                <span className="crisync-wordmark-accent">Sync</span>
              </span>
              <button
                type="button"
                onClick={onReplayIntro}
                title="Replay Crisis + Sync → CriSync Formation Animation"
                className="text-[11px] sm:text-xs whitespace-nowrap font-bold tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Crisis + Sync • &ldquo;Cry-Sync&rdquo;</span>
              </button>
            </div>
            <p className="text-[13px] sm:text-[15px] text-zinc-400 truncate mt-1">
              Humanitarian Aid & Emergency Coordination System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-10 h-10 sm:w-auto sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/15 text-[13px] whitespace-nowrap font-bold text-zinc-200 flex items-center justify-center gap-2 transition shadow-sm"
            title="Switch between Light Mode and Dark Mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          <span className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-[13px] whitespace-nowrap font-bold text-indigo-300">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeCrisisTitle ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeCrisisTitle ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
            {activeCrisisTitle ? `Active Crisis: ${activeCrisisTitle}` : 'Live Production Mode • Ready'}
          </span>
        </div>
      </header>

      <div className="relative z-10 w-full border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-md overflow-hidden py-2">
        <div className="crisync-ticker-track items-center gap-8 text-xs sm:text-[13px] font-bold">
          {[
            { dot: 'bg-rose-400', label: activeCrisisTitle ? `Active Response: ${activeCrisisTitle}` : 'Global Emergency Readiness Active' },
            { dot: 'bg-cyan-400', label: '3D Global Aid Network: UN Geneva • Singapore • Nairobi • Colombo Synced' },
            { dot: 'bg-emerald-400', label: 'Evacuation Shelters Open • Wheelchair & Medical Support Available' },
            { dot: 'bg-indigo-400', label: '6-Language Citizen Help Portal: EN • SI • TA • AR • FR • ES' },
            { dot: 'bg-amber-400', label: 'Cold-Chain Medical Stock & Relief Dispatch Ready' },
            { dot: 'bg-rose-400', label: activeCrisisTitle ? `Active Response: ${activeCrisisTitle}` : 'Global Emergency Readiness Active' },
            { dot: 'bg-cyan-400', label: '3D Global Aid Network: UN Geneva • Singapore • Nairobi • Colombo Synced' },
            { dot: 'bg-emerald-400', label: 'Evacuation Shelters Open • Wheelchair & Medical Support Available' },
            { dot: 'bg-indigo-400', label: '6-Language Citizen Help Portal: EN • SI • TA • AR • FR • ES' },
            { dot: 'bg-amber-400', label: 'Cold-Chain Medical Stock & Relief Dispatch Ready' }
          ].map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 text-zinc-300 shrink-0 px-3">
              <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0`} />
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:hidden bento-glass rounded-3xl p-4 space-y-2.5 border border-indigo-500/25">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Real Multi-User Platform
                </p>
                <p className="text-[15px] font-extrabold text-white">
                  Sign In or Register Your Role
                </p>
              </div>
              <span className="text-[11px] whitespace-nowrap font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                {ALL_PLATFORM_ROLES.length} Official Roles
              </span>
            </div>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Sign in to an official role account, use <strong className="text-zinc-200">Create Account</strong> for citizens and teams, or open <strong className="text-zinc-200">Admin Login</strong> for System Administration.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="lg:col-span-5 space-y-5"
          >
            {trustedUnlock && (
              <div className="bento-glass rounded-3xl p-5 sm:p-6 border border-indigo-500/35 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="keep-white w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shrink-0">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block truncate">
                        {trustedUnlock.deviceName ? `Quick Unlock • ${trustedUnlock.deviceName}` : 'Trusted-Device Quick Unlock'}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                        {trustedUnlock.fullName}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">
                        {trustedUnlock.role} • {trustedUnlock.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgetTrustedDevice}
                    title="Remove Quick Unlock from this browser"
                    className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-zinc-300 hover:text-rose-300 inline-flex items-center gap-1 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Forget</span>
                  </button>
                </div>

                {quickUnlockError && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs sm:text-[13px] text-rose-200 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{quickUnlockError}</span>
                  </div>
                )}

                <form onSubmit={handleQuickSecretUnlock} className="space-y-3">
                  {trustedUnlock.mode === 'Pattern' ? (
                    <PatternLockPad
                      value={quickPatternInput}
                      onChange={setQuickPatternInput}
                      disabled={quickUnlockBusy}
                      label="Draw your Pattern (drag or tap 4+ dots)"
                    />
                  ) : (
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-300 mb-1.5">
                        Enter 6-Digit PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="off"
                        value={quickPinInput}
                        onChange={(e) => setQuickPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="rsvp-input text-center tracking-[0.45em] font-mono text-lg"
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="submit"
                      disabled={quickUnlockBusy}
                      className="keep-white flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{quickUnlockBusy ? 'Verifying...' : `Unlock with ${trustedUnlock.mode}`}</span>
                    </button>

                    {trustedUnlock.hasBiometricCredential && biometricAvailable && (
                      <button
                        type="button"
                        disabled={quickUnlockBusy}
                        onClick={() => void handleQuickBiometricUnlock()}
                        className="keep-white flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
                      >
                        <Fingerprint className="w-4 h-4" />
                        <span>Fingerprint / Hello</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="bento-glass rounded-3xl p-5 sm:p-7">
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
                <button
                  type="button"
                  onClick={startSignInMode}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-[11px] sm:text-xs xl:text-[13px] whitespace-nowrap font-extrabold flex items-center justify-center gap-1.5 transition ${
                    authMode === 'signin'
                      ? 'bg-indigo-600 text-white keep-white shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <Lock className="hidden sm:block w-3.5 h-3.5 shrink-0" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={startCreateAccountMode}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-[11px] sm:text-xs xl:text-[13px] whitespace-nowrap font-extrabold flex items-center justify-center gap-1.5 transition ${
                    authMode === 'signup'
                      ? 'bg-indigo-600 text-white keep-white shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <UserPlus className="hidden sm:block w-3.5 h-3.5 shrink-0" />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={startAdminLogin}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-[11px] sm:text-xs xl:text-[13px] whitespace-nowrap font-extrabold flex items-center justify-center gap-1.5 transition ${
                    authMode === 'admin'
                      ? 'bg-violet-600 text-white keep-white shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="hidden sm:block w-3.5 h-3.5 shrink-0" />
                  <span>Admin Login</span>
                </button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  {authMode === 'signin' ? (
                    <>
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>Sign In to Your Account</span>
                    </>
                  ) : authMode === 'admin' ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-violet-400" />
                      <span>System Administrator Portal</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-indigo-400" />
                      <span>Create New CriSync Account</span>
                    </>
                  )}
                </h2>
              </div>
              <p className="text-[13px] sm:text-sm leading-relaxed text-zinc-400 mb-5">
                {authMode === 'signin'
                  ? 'Enter your registered email and personal password below. Multiple team members and citizens can create individual accounts via Create Account.'
                  : authMode === 'admin'
                    ? 'Restricted administrator sign-in. Only authorised System Administrator accounts may enter here. Logged-in administrators can create additional Admin accounts from the Control Center.'
                    : 'Register a private password-protected account for any operational or citizen role, save your household or agency affiliation, and begin working.'}
              </p>

              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-[13px] sm:text-sm text-rose-200 font-semibold flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
  );
};
