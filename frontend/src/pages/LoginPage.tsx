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
                  className={`flex-auto py-2 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs xl:text-[13px] whitespace-nowrap font-extrabold flex items-center justify-center gap-1.5 transition ${
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
                  className={`flex-auto py-2 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs xl:text-[13px] whitespace-nowrap font-extrabold flex items-center justify-center gap-1.5 transition ${
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
                  className={`flex-auto py-2 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs xl:text-[13px] whitespace-nowrap font-extrabold flex items-center justify-center gap-1.5 transition ${
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
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {authMode === 'signin' ? (
                <form key="user-signin-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] sm:text-sm font-bold text-zinc-300 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="rsvp-input"
                      placeholder="Enter your registered email address"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] sm:text-sm font-bold text-zinc-300 mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Password</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="rsvp-input"
                      placeholder="Enter your account password"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={submitting}
                    className="keep-white w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[15px] sm:text-base tracking-tight transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Authenticating...' : 'Sign In to CriSync'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </form>
              ) : authMode === 'admin' ? (
                <form key="admin-portal-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-violet-500/15 border border-violet-500/35 text-[13px] sm:text-sm text-violet-200 flex items-start gap-2.5">
                    <KeyRound className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-white">Restricted Administrative Access</p>
                      <p className="text-xs sm:text-[13px] text-violet-200/80 mt-0.5 leading-relaxed">
                        Sign in using authorised System Administrator username/email and password. Non-admin accounts are automatically declined from this portal.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] sm:text-sm font-bold text-zinc-300 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Admin Email / Username</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="rsvp-input"
                      placeholder="Enter administrator email"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] sm:text-sm font-bold text-zinc-300 mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Admin Password</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="rsvp-input"
                      placeholder="Enter administrator password"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={submitting}
                    className="keep-white w-full py-3.5 px-5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[15px] sm:text-base tracking-tight transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Authenticating...' : 'Sign In as System Administrator'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </form>
              ) : (
                <form key="public-signup-form" onSubmit={handleSignUpSubmit} className="space-y-3.5 text-[13px] sm:text-sm">

                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Account Role</span>
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="rsvp-input"
                    >
                      {SIGNUP_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                      Example: Start with Emergency Coordinator to declare a crisis, or register as Affected Citizen to submit help requests.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      name="crisync_register_fullname"
                      autoComplete="off"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Enter your full legal name"
                      className="rsvp-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        name="crisync_register_email"
                        autoComplete="off"
                        required
                        readOnly={!unlockedInputs.regEmail}
                        onFocus={() => unlockInput('regEmail')}
                        onMouseDown={() => unlockInput('regEmail')}
                        onKeyDown={() => unlockInput('regEmail')}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@domain.org"
                        className="rsvp-input"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        name="crisync_register_phone"
                        autoComplete="off"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+94 77 123 4567"
                        className="rsvp-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Password</span>
                      </label>
                      <input
                        type="password"
                        name="crisync_register_password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        readOnly={!unlockedInputs.regPassword}
                        onFocus={() => unlockInput('regPassword')}
                        onMouseDown={() => unlockInput('regPassword')}
                        onKeyDown={() => unlockInput('regPassword')}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="rsvp-input"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Preferred Language</span>
                      </label>
                      <select
                        value={regLanguage}
                        onChange={(e) => setRegLanguage(e.target.value)}
                        className="rsvp-input"
                      >
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {regRole === 'Donor' && (
                    <div className="p-3.5 rounded-2xl bg-lime-500/10 border border-lime-500/25 text-lime-200 text-xs sm:text-[13px] leading-relaxed">
                      <strong className="text-white block mb-0.5">Public Donor Registration</strong>
                      Donors self-register independently with immediate access to active humanitarian fundraising campaigns and in-kind supply pledges.
                    </div>
                  )}

                  {regRole === 'Volunteer' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-[13px] leading-relaxed">
                      <strong className="text-white block mb-0.5">Pending Volunteer Verification Policy</strong>
                      Volunteers self-register independently, and your initial account status starts as <strong>Pending</strong> until a dedicated <strong>Volunteer Coordinator</strong> verifies and activates your account.
                    </div>
                  )}

                  {regRole === 'PartnerOfficer' && (
                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-2.5">
                      <p className="font-extrabold text-zinc-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Partner Organization Partnership Request</span>
                      </p>
                      <p className="text-xs sm:text-[13px] text-cyan-200/85 leading-relaxed">
                        Submit your organization details below to register a partnership request. A System or Organization Admin reviews and approves incoming partner requests.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Organization Name</label>
                          <input
                            type="text"
                            required
                            value={regOrgName}
                            onChange={(e) => setRegOrgName(e.target.value)}
                            placeholder="Partner NGO or agency name"
                            className="rsvp-input"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Organization Type</label>
                          <select
                            value={regOrgType}
                            onChange={(e) => setRegOrgType(e.target.value)}
                            className="rsvp-input"
                          >
                            <option value="Partner NGO">Partner NGO</option>
                            <option value="Medical INGO">Medical INGO</option>
                            <option value="Logistics Partner">Logistics Partner</option>
                            <option value="Government Agency">Government Agency</option>
                            <option value="Community Relief Network">Community Relief Network</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Country / Operating Region</label>
                        <input
                          type="text"
                          required
                          value={regOrgCountry}
                          onChange={(e) => setRegOrgCountry(e.target.value)}
                          placeholder="Country or disaster region covered"
                          className="rsvp-input"
                        />
                        <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                          Example: Sri Lanka / South Asia Regional
                        </p>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Partnership Proposal & Relief Capacity</label>
                        <textarea
                          rows={2}
                          required
                          value={regPartnershipProposal}
                          onChange={(e) => setRegPartnershipProposal(e.target.value)}
                          placeholder="Describe medical teams, relief supplies, or shelter capacity you offer"
                          className="rsvp-input resize-none"
                        />
                        <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                          Example: Mobile emergency medical units and 500 family water filtration kits
                        </p>
                      </div>
                    </div>
                  )}

                  {regRole === 'Citizen' && (
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-3">
                      <p className="font-extrabold text-zinc-100 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Family & Medical Onboarding Profile</span>
                      </p>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Home Address / Town</label>
                        <input
                          type="text"
                          value={regPrimaryAddress}
                          onChange={(e) => setRegPrimaryAddress(e.target.value)}
                          placeholder="Street, town, or nearest landmark"
                          className="rsvp-input"
                        />
                        <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                          Example: 42 Station Road, Ward 03, Colombo
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Family Size</label>
                          <input
                            type="number"
                            min={1}
                            value={regTotalMembers}
                            onChange={(e) => setRegTotalMembers(Number(e.target.value))}
                            className="rsvp-input font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Children</label>
                          <input
                            type="number"
                            min={0}
                            value={regChildrenCount}
                            onChange={(e) => setRegChildrenCount(Number(e.target.value))}
                            className="rsvp-input font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Elderly</label>
                          <input
                            type="number"
                            min={0}
                            value={regElderlyCount}
                            onChange={(e) => setRegElderlyCount(Number(e.target.value))}
                            className="rsvp-input font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={regHasMobilityNeeds}
                            onChange={(e) => setRegHasMobilityNeeds(e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          Wheelchair / Mobility Needs
                        </label>
                        <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={regHasChronicMedicalNeeds}
                            onChange={(e) => setRegHasChronicMedicalNeeds(e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          Chronic Medical Condition
                        </label>
                      </div>
                      {regHasChronicMedicalNeeds && (
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Medical / Medication Notes</label>
                          <input
                            type="text"
                            value={regMedicalNotes}
                            onChange={(e) => setRegMedicalNotes(e.target.value)}
                            placeholder="List daily medications or critical devices"
                            className="rsvp-input"
                          />
                          <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                            Example: Insulin glargine cold-chain storage required, asthma nebulizer
                          </p>
                        </div>
                      )}
                      <label className="flex items-center gap-2 text-emerald-300 font-bold cursor-pointer pt-1 border-t border-white/10">
                        <input
                          type="checkbox"
                          checked={regAsVolunteer}
                          onChange={(e) => setRegAsVolunteer(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        Also register me on the Emergency Volunteer Roster
                      </label>
                    </div>
                  )}

                  {(regRole === 'Volunteer' || (regRole === 'Citizen' && regAsVolunteer)) && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2.5">
                      <p className="font-extrabold text-zinc-100 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Volunteer Skills & Availability Schedule</span>
                      </p>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Emergency Skills (comma-separated)</label>
                        <input
                          type="text"
                          value={regSkillsCsv}
                          onChange={(e) => setRegSkillsCsv(e.target.value)}
                          placeholder="Enter your field skills"
                          className="rsvp-input"
                        />
                        <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                          Example: FirstAid, Medical Triage, Boat Rescue, Logistics Dispatch
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Spoken Languages</label>
                          <input
                            type="text"
                            value={regLanguagesCsv}
                            onChange={(e) => setRegLanguagesCsv(e.target.value)}
                            placeholder="Languages you speak"
                            className="rsvp-input"
                          />
                          <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                            Example: English, Sinhala, Tamil
                          </p>
                        </div>
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Base Town / District</label>
                          <input
                            type="text"
                            value={regBaseTown}
                            onChange={(e) => setRegBaseTown(e.target.value)}
                            placeholder="Current dispatch town"
                            className="rsvp-input"
                          />
                          <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                            Example: Colombo / Galle / Kandy
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Availability Schedule</label>
                        <input
                          type="text"
                          value={regAvailability}
                          onChange={(e) => setRegAvailability(e.target.value)}
                          placeholder="Hours or days available"
                          className="rsvp-input"
                        />
                        <p className="text-xs sm:text-[13px] text-zinc-400/85 mt-1 font-normal">
                          Example: Weekdays 08:00-18:00 & 24/7 Emergency Call-Out
                        </p>
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={submitting}
                    className="keep-white w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[15px] sm:text-base tracking-tight transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Creating Account...' : 'Create Account & Enter CriSync'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </form>
              )}
            </div>

            <div className="bento-glass rounded-3xl p-5 sm:p-6 relative overflow-hidden group">
              <div className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4 h-40 sm:h-44 relative overflow-hidden">
                <img
                  src="/images/hero-relief.jpg"
                  alt="Humanitarian relief workers assisting families during flood response"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="crisync-photo-scrim absolute inset-0" />
                <div className="keep-white absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                  <div>
                    <span className="crisync-photo-pill-emerald inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-extrabold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      Global Humanitarian Aid Network • Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center shadow-md shrink-0 keep-white">
                  <Radio className="w-5 h-5 text-white keep-white" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <Sparkles className="w-3 h-3" />
                    Platform Operation Status
                  </span>
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight mt-0.5">
                    {activeCrisisTitle || 'Clean Real-World Response Workspace'}
                  </h1>
                </div>
              </div>

              <p className="text-[13px] sm:text-sm text-zinc-300 leading-relaxed mb-4">
                Connecting affected citizens and households with emergency coordinators, relief warehouses, evacuation shelters, donors, and field volunteers using secure role-based accounts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] sm:text-sm font-bold text-zinc-100 truncate">
                      Real Data Only
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      Declare Crises, Shelters & Stock
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] sm:text-sm font-bold text-zinc-100 truncate">
                      Password-Protected RBAC
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      Multi-User Role-Based Access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
            className="lg:col-span-7 bento-glass rounded-3xl p-5 sm:p-7 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[13px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  CriSync Role Governance & Access Architecture
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  Self-Registration, Invited Operational Roles & Two-Tier Admins
                </h2>
                <p className="text-[13px] sm:text-sm leading-relaxed text-zinc-400 mt-1">
                  Public users can register under the 4 open roles below. Operational teams require an authorised invitation, and Global/Organization Admins operate under a strict small-count security policy.
                </p>
              </div>
              <div className="text-left sm:text-right bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-2xl">
                <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <KeyRound className="w-3 h-3" />
                  Access Governance
                </span>
                <span className="text-[13px] sm:text-sm font-bold text-zinc-100 block mt-0.5">
                  {ALL_PLATFORM_ROLES.length} Governed Roles
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: '3D Global Sync', tone: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' },
                { label: 'Explainable AI Triage', tone: 'bg-purple-500/15 border-purple-500/30 text-purple-300' },
                { label: 'Atomic Shelter Locks', tone: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
                { label: '6-Language Citizen Help', tone: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' },
                { label: 'Biometric Quick Unlock', tone: 'bg-amber-500/15 border-amber-500/30 text-amber-300' }
              ].map((pill) => (
                <span
                  key={pill.label}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${pill.tone}`}
                >
                  {pill.label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              {[
                { id: 'public', label: 'Public & Citizens (4)' },
                { id: 'operations', label: 'Operations Staff (6)' },
                { id: 'admin', label: 'System Admins (2)' },
                { id: 'all', label: 'Show All 12 Roles' }
              ].map((tabOpt) => {
                const active = roleExplorerTab === tabOpt.id;
                return (
                  <button
                    key={tabOpt.id}
                    type="button"
                    onClick={() => setRoleExplorerTab(tabOpt.id as 'public' | 'operations' | 'admin' | 'all')}
                    className={`flex-auto py-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                      active
                        ? 'bg-indigo-600 text-white keep-white shadow-sm'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {tabOpt.label}
                  </button>
                );
              })}
            </div>

            {(roleExplorerTab === 'public' || roleExplorerTab === 'all') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[13px] sm:text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                  1. Public & Self-Registration Roles (4)
                </h3>
                <span className="text-xs sm:text-[13px] text-zinc-400">Open Sign-Up or Proxy Registration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SIGNUP_ROLE_OPTIONS.map((opt, idx) => {
                  const isSelectedRole = authMode === 'signup' && regRole === opt.value;
                  const meta = getRoleMeta(opt.value);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.08 + idx * 0.06, ease: 'easeOut' }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={opt.value}
                      onClick={() => startRegistrationForRole(opt.value)}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isSelectedRole
                          ? `bg-gradient-to-br ${meta.accent} shadow-glow ring-2 ring-indigo-500/60`
                          : 'bg-white/[0.025] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                            {meta.icon}
                          </div>
                          <span className={`text-[11px] sm:text-xs whitespace-nowrap font-bold px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                            {meta.tag}
                          </span>
                        </div>
                        <h4 className="text-[15px] sm:text-base font-extrabold text-white">{meta.title}</h4>
                        <p className="text-[13px] sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">{meta.summary}</p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] sm:text-xs text-zinc-400 truncate">{opt.value}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startSignInMode();
                            }}
                            className="text-xs sm:text-[13px] whitespace-nowrap font-bold bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Sign In</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startRegistrationForRole(opt.value);
                            }}
                            className="keep-white text-xs sm:text-[13px] whitespace-nowrap font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition shadow-sm"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Register</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            )}

            {(roleExplorerTab === 'operations' || roleExplorerTab === 'all') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[13px] sm:text-sm font-extrabold uppercase tracking-wider text-amber-300">
                  2. Invitation-Based Operational Roles (6)
                </h3>
                <span className="text-xs sm:text-[13px] text-zinc-400">Requires Admin or Coordinator Invitation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {INVITED_OPERATIONAL_ROLES.map((opt, idx) => {
                  const meta = getRoleMeta(opt.value);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.14 + idx * 0.05, ease: 'easeOut' }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      key={opt.value}
                      className="rounded-2xl p-3.5 border bg-white/[0.02] border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                            {meta.icon}
                          </div>
                          <span className={`text-[11px] whitespace-nowrap font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                            {meta.tag}
                          </span>
                        </div>
                        <h4 className="text-[13px] sm:text-sm font-extrabold text-white">{meta.title}</h4>
                        <p className="text-xs sm:text-[13px] text-zinc-400 mt-1 leading-relaxed">{meta.summary}</p>
                        <p className="text-[11px] sm:text-xs text-amber-300/90 font-semibold mt-1.5">{opt.inviteNote}</p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-zinc-500 truncate">{opt.value}</span>
                        <button
                          type="button"
                          onClick={startSignInMode}
                          className="text-xs whitespace-nowrap font-bold bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition shrink-0"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Sign In</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            )}

            {(roleExplorerTab === 'admin' || roleExplorerTab === 'all') && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] sm:text-sm font-extrabold uppercase tracking-wider text-violet-300">
                  3. Two-Tier Admin Structure (Small Number of Admins Policy)
                </h3>
                <span className="text-xs sm:text-[13px] text-zinc-400">Min 2 & Max 3 Global Admins • Max 3 Org Admins</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADMIN_GOVERNANCE_ROLES.map((opt, idx) => {
                  const meta = getRoleMeta(opt.value);
                  const isSelected = authMode === 'admin';
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.2 + idx * 0.06, ease: 'easeOut' }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={opt.value}
                      onClick={startAdminLogin}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-br ${meta.accent} shadow-glow ring-2 ring-violet-500/60`
                          : 'bg-white/[0.025] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                            {meta.icon}
                          </div>
                          <span className={`text-[11px] sm:text-xs whitespace-nowrap font-bold px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                            {meta.tag}
                          </span>
                        </div>
                        <h4 className="text-[15px] sm:text-base font-extrabold text-white">{meta.title}</h4>
                        <p className="text-[13px] sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">{meta.summary}</p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] sm:text-xs text-zinc-400 truncate">{opt.value}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startAdminLogin();
                          }}
                          className="keep-white text-xs sm:text-[13px] whitespace-nowrap font-bold bg-violet-600 hover:bg-violet-500 text-white inline-flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-xl transition shadow-sm"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Admin Login</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[13px] sm:text-sm text-zinc-500">
        <span className="inline-flex items-center gap-2 font-semibold">
          <img
            src="/crisync-logo.png"
            alt="CriSync Logo"
            className="w-6 h-6 rounded-lg object-cover crisync-logo-frame shrink-0"
          />
          <span className="crisync-wordmark text-sm">
            <span className="crisync-wordmark-primary">Cri</span>
            <span className="crisync-wordmark-accent">Sync</span>
          </span>
          <span>— Humanitarian Crisis Aid & Coordination Platform</span>
        </span>
        <span>Accessible in Light & Dark Mode • Desktop & Mobile Ready</span>
      </footer>
    </div>
  );
};
